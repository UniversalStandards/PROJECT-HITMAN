import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { storage } from './storage';

interface WSMessage {
  type: 'notification' | 'update' | 'alert' | 'broadcast';
  data: any;
  userId?: string;
  organizationId?: string;
  timestamp: number;
}

interface WSClient {
  ws: WebSocket;
  userId?: string;
  organizationId?: string;
  role?: string;
  isAlive: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      
      const client: WSClient = {
        ws,
        isAlive: true
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId}`);

      // Handle pong for heartbeat
      ws.on('pong', () => {
        client.isAlive = true;
      });

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      // Handle authentication
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: Date.now()
      }));

      // Handle disconnection
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });

    // Start heartbeat check
    this.startHeartbeat();
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'auth':
        // Authenticate the WebSocket connection
        client.userId = message.userId;
        client.organizationId = message.organizationId;
        client.role = message.role;
        
        client.ws.send(JSON.stringify({
          type: 'auth_success',
          timestamp: Date.now()
        }));
        break;

      case 'subscribe':
        // Subscribe to specific channels
        console.log(`Client ${clientId} subscribing to:`, message.channels);
        break;

      case 'ping':
        // Respond to ping
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Send notification to all users in organization
  sendToOrganization(organizationId: string, message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.organizationId === organizationId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast to all connected clients
  broadcast(message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Send role-based notifications
  sendToRole(role: string, message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Heartbeat to keep connections alive
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }
        
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // Check every 30 seconds
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Clean up on server shutdown
  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((client) => {
      client.ws.close();
    });
    
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsManager = new WebSocketManager();

// Notification helper functions
export function notifyBudgetThreshold(organizationId: string, budget: any) {
  wsManager.sendToOrganization(organizationId, {
    type: 'alert',
    data: {
      title: 'Budget Threshold Alert',
      message: `Budget "${budget.name}" has reached ${budget.spentPercentage}% of allocated amount`,
      severity: 'warning',
      budgetId: budget.id
    },
    organizationId,
    timestamp: Date.now()
  });
}

export function notifyPaymentStatus(userId: string, payment: any) {
  wsManager.sendToUser(userId, {
    type: 'notification',
    data: {
      title: 'Payment Status Update',
      message: `Payment #${payment.id} is now ${payment.status}`,
      paymentId: payment.id,
      status: payment.status
    },
    userId,
    timestamp: Date.now()
  });
}

export function notifyNewVendorApplication(organizationId: string, vendor: any) {
  wsManager.sendToRole('admin', {
    type: 'notification',
    data: {
      title: 'New Vendor Application',
      message: `${vendor.name} has submitted a vendor registration`,
      vendorId: vendor.id,
      requiresAction: true
    },
    organizationId,
    timestamp: Date.now()
  });
}

export function broadcastSystemMessage(message: string, severity: 'info' | 'warning' | 'error' = 'info') {
  wsManager.broadcast({
    type: 'broadcast',
    data: {
      title: 'System Announcement',
      message,
      severity
    },
    timestamp: Date.now()
  });
}