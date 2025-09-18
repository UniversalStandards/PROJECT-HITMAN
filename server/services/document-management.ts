import { db } from '../db';
import { auditLogs } from '@shared/schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface Document {
  id: string;
  organizationId: string;
  entityType: 'payment' | 'vendor' | 'expense' | 'contract' | 'grant' | 'asset' | 'procurement';
  entityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
  tags?: string[];
  version?: number;
  checksum?: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface DocumentUploadRequest {
  file: any; // Express.Multer.File | any;
  organizationId: string;
  entityType: Document['entityType'];
  entityId: string;
  uploadedBy: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface DocumentSearchParams {
  organizationId?: string;
  entityType?: Document['entityType'];
  entityId?: string;
  fileName?: string;
  tags?: string[];
  uploadedBy?: string;
  startDate?: Date;
  endDate?: Date;
  status?: Document['status'];
}

export class DocumentManagementService {
  private readonly uploadDir = '/tmp/documents';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  private documents: Map<string, Document> = new Map();

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Upload a document
   */
  async uploadDocument(request: DocumentUploadRequest): Promise<Document> {
    try {
      const { file, organizationId, entityType, entityId, uploadedBy, metadata, tags } = request;

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds maximum of ${this.maxFileSize / (1024 * 1024)}MB`);
      }

      if (!this.allowedFileTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} is not allowed`);
      }

      // Generate unique file ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Create organization directory
      const orgDir = path.join(this.uploadDir, organizationId);
      await fs.mkdir(orgDir, { recursive: true });

      // Generate storage path
      const fileExt = path.extname(file.originalname);
      const storageName = `${documentId}${fileExt}`;
      const storagePath = path.join(orgDir, storageName);

      // Calculate checksum
      const checksum = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Save file
      await fs.writeFile(storagePath, file.buffer);

      // Create document record
      const document: Document = {
        id: documentId,
        organizationId,
        entityType,
        entityId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storageUrl: storagePath,
        uploadedBy,
        uploadedAt: new Date(),
        metadata,
        tags,
        version: 1,
        checksum,
        status: 'active'
      };

      // Store in memory (in production, this would be in database)
      this.documents.set(documentId, document);

      // Log audit trail
      await db
        .insert(auditLogs)
        .values({
          organizationId: organizationId,
          userId: uploadedBy,
          action: 'document_upload',
          entityType: entityType,
          entityId: entityId,
          newValues: JSON.stringify({
            documentId,
            fileName: file.originalname,
            fileSize: file.size
          }),
          ipAddress: '127.0.0.1'
        });

      return document;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    return this.documents.get(documentId) || null;
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<{ buffer: Buffer; document: Document }> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status === 'deleted') {
      throw new Error('Document has been deleted');
    }

    try {
      const buffer = await fs.readFile(document.storageUrl);
      return { buffer, document };
    } catch (error) {
      throw new Error('Failed to read document file');
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(params: DocumentSearchParams): Promise<Document[]> {
    let results = Array.from(this.documents.values());

    // Apply filters
    if (params.organizationId) {
      results = results.filter(doc => doc.organizationId === params.organizationId);
    }

    if (params.entityType) {
      results = results.filter(doc => doc.entityType === params.entityType);
    }

    if (params.entityId) {
      results = results.filter(doc => doc.entityId === params.entityId);
    }

    if (params.fileName) {
      results = results.filter(doc => 
        doc.fileName.toLowerCase().includes(params.fileName!.toLowerCase())
      );
    }

    if (params.tags && params.tags.length > 0) {
      results = results.filter(doc => 
        doc.tags?.some(tag => params.tags!.includes(tag))
      );
    }

    if (params.uploadedBy) {
      results = results.filter(doc => doc.uploadedBy === params.uploadedBy);
    }

    if (params.startDate) {
      results = results.filter(doc => 
        new Date(doc.uploadedAt) >= params.startDate!
      );
    }

    if (params.endDate) {
      results = results.filter(doc => 
        new Date(doc.uploadedAt) <= params.endDate!
      );
    }

    if (params.status) {
      results = results.filter(doc => doc.status === params.status);
    }

    return results;
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, deletedBy: string): Promise<void> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    // Mark as deleted (soft delete)
    document.status = 'deleted';
    
    // Log audit trail
    await db
      .insert(auditLogs)
      .values({
        userId: deletedBy,
        action: 'document_delete',
        entity: document.entityType,
        entityId: document.entityId,
        details: JSON.stringify({
          documentId,
          fileName: document.fileName
        }),
        ipAddress: '127.0.0.1'
      });
  }

  /**
   * Archive document
   */
  async archiveDocument(documentId: string, archivedBy: string): Promise<void> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    document.status = 'archived';
    
    // Log audit trail
    await db
      .insert(auditLogs)
      .values({
        userId: archivedBy,
        action: 'document_archive',
        entity: document.entityType,
        entityId: document.entityId,
        details: JSON.stringify({
          documentId,
          fileName: document.fileName
        }),
        ipAddress: '127.0.0.1'
      });
  }

  /**
   * Update document metadata
   */
  async updateDocumentMetadata(
    documentId: string,
    metadata: Record<string, any>,
    updatedBy: string
  ): Promise<Document> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    document.metadata = { ...document.metadata, ...metadata };
    
    // Log audit trail
    await db
      .insert(auditLogs)
      .values({
        userId: updatedBy,
        action: 'document_metadata_update',
        entity: document.entityType,
        entityId: document.entityId,
        details: JSON.stringify({
          documentId,
          metadata
        }),
        ipAddress: '127.0.0.1'
      });

    return document;
  }

  /**
   * Add tags to document
   */
  async addDocumentTags(
    documentId: string,
    tags: string[],
    updatedBy: string
  ): Promise<Document> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    document.tags = [...new Set([...(document.tags || []), ...tags])];
    
    // Log audit trail
    await db
      .insert(auditLogs)
      .values({
        userId: updatedBy,
        action: 'document_tags_add',
        entity: document.entityType,
        entityId: document.entityId,
        details: JSON.stringify({
          documentId,
          tags
        }),
        ipAddress: '127.0.0.1'
      });

    return document;
  }

  /**
   * Create new version of document
   */
  async createDocumentVersion(
    originalDocumentId: string,
    newFile: Express.Multer.File | any,
    uploadedBy: string
  ): Promise<Document> {
    const originalDoc = this.documents.get(originalDocumentId);
    
    if (!originalDoc) {
      throw new Error('Original document not found');
    }

    // Upload new version
    const newDoc = await this.uploadDocument({
      file: newFile,
      organizationId: originalDoc.organizationId,
      entityType: originalDoc.entityType,
      entityId: originalDoc.entityId,
      uploadedBy,
      metadata: {
        ...originalDoc.metadata,
        originalDocumentId,
        previousVersion: originalDoc.version
      },
      tags: originalDoc.tags
    });

    // Update version number
    newDoc.version = (originalDoc.version || 1) + 1;

    // Archive original
    await this.archiveDocument(originalDocumentId, uploadedBy);

    return newDoc;
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(entityType: Document['entityType'], entityId: string): Promise<Document[]> {
    const documents = await this.searchDocuments({ entityType, entityId });
    return documents.sort((a, b) => (b.version || 1) - (a.version || 1));
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(organizationId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
    byStatus: Record<string, number>;
  }> {
    const orgDocs = Array.from(this.documents.values())
      .filter(doc => doc.organizationId === organizationId);

    const stats = {
      totalDocuments: orgDocs.length,
      totalSize: 0,
      byType: {} as Record<string, { count: number; size: number }>,
      byStatus: {} as Record<string, number>
    };

    for (const doc of orgDocs) {
      stats.totalSize += doc.fileSize;

      // By type
      if (!stats.byType[doc.entityType]) {
        stats.byType[doc.entityType] = { count: 0, size: 0 };
      }
      stats.byType[doc.entityType].count++;
      stats.byType[doc.entityType].size += doc.fileSize;

      // By status
      if (!stats.byStatus[doc.status]) {
        stats.byStatus[doc.status] = 0;
      }
      stats.byStatus[doc.status]++;
    }

    return stats;
  }

  /**
   * Clean up old archived documents
   */
  async cleanupArchivedDocuments(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    for (const [id, doc] of this.documents) {
      if (doc.status === 'archived' && doc.uploadedAt < cutoffDate) {
        try {
          // Delete physical file
          await fs.unlink(doc.storageUrl);
          // Remove from memory
          this.documents.delete(id);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete archived document ${id}:`, error);
        }
      }
    }

    return deletedCount;
  }
}

export const documentService = new DocumentManagementService();