import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  Bell, BellRing, Check, X, AlertCircle, Info, 
  AlertTriangle, CheckCircle2, Trash2, Circle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const { notifications, clearNotifications, markNotificationRead, unreadCount, isConnected } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !(n as any).read)
    : notifications;

  const getIcon = (type: string, severity?: string) => {
    if (type === 'alert') {
      switch (severity) {
        case 'error':
          return <AlertCircle className="h-4 w-4 text-destructive" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
        default:
          return <Info className="h-4 w-4 text-blue-600" />;
      }
    }
    
    if (type === 'broadcast') {
      return <BellRing className="h-4 w-4 text-purple-600" />;
    }
    
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {isConnected && (
            <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-green-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isConnected ? (
                    <>
                      <Circle className="mr-1 h-2 w-2 fill-current" />
                      Live
                    </>
                  ) : (
                    'Offline'
                  )}
                </Badge>
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearNotifications}
                    data-testid="button-clear-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="all" className="text-xs">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread ({unreadCount})
                </TabsTrigger>
              </TabsList>
              <TabsContent value={filter} className="mt-0">
                <ScrollArea className="h-[400px]">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredNotifications.slice().reverse().map((notification) => {
                        const isRead = (notification as any).read;
                        return (
                          <div
                            key={notification.timestamp}
                            className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                              !isRead ? 'bg-blue-50/50' : ''
                            }`}
                            onClick={() => markNotificationRead(notification.timestamp)}
                            data-testid={`notification-${notification.timestamp}`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getIcon(notification.type, notification.data?.severity)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {notification.data?.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {notification.data?.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(notification.timestamp)}
                                </p>
                              </div>
                              {!isRead && (
                                <div className="flex-shrink-0">
                                  <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}