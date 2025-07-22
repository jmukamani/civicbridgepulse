/**
 * IndexedDB Document Storage Utility
 * Manages offline storage of policy documents for citizen access
 */

const DB_NAME = 'CivicBridgeDocuments';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const METADATA_STORE = 'document_metadata';

class DocumentStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create documents store for file blobs
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('policyId', 'policyId', { unique: true });
          store.createIndex('downloadDate', 'downloadDate', { unique: false });
        }

        // Create metadata store for document info
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          const metaStore = db.createObjectStore(METADATA_STORE, { keyPath: 'policyId' });
          metaStore.createIndex('category', 'category', { unique: false });
          metaStore.createIndex('title', 'title', { unique: false });
        }
      };
    });
  }

  async ensureReady() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  /**
   * Download and store a policy document
   * Always fetches from backend API, never directly from Azure Blob Storage
   */
  async downloadDocument(policyId, policyData, token, onProgress) {
    await this.ensureReady();
    try {
      // First, store metadata
      await this.storeMetadata(policyId, policyData);
      // Always use backend API endpoint for download
      const fileUrl = `/api/policies/${policyId}/file?token=${token}`;
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status}`);
      }
      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;
      // Read response with progress tracking
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (onProgress && total > 0) {
          onProgress(Math.round((loaded / total) * 100));
        }
      }
      // Combine chunks into blob
      const blob = new Blob(chunks, { 
        type: response.headers.get('Content-Type') || 'application/pdf' 
      });
      // Store in IndexedDB
      const documentData = {
        id: `doc_${String(policyId)}`,
        policyId: String(policyId),
        blob: blob,
        mimeType: blob.type,
        size: blob.size,
        downloadDate: new Date().toISOString(),
        fileName: `${policyData.title}.${this.getFileExtension(blob.type)}`
      };
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.put(documentData);
      return {
        success: true,
        size: blob.size,
        fileName: documentData.fileName
      };
    } catch (error) {
      console.error('Failed to download document:', error);
      throw error;
    }
  }

  /**
   * Store policy metadata
   */
  async storeMetadata(policyId, policyData) {
    await this.ensureReady();
    if (!policyId || typeof policyId !== 'string') {
      throw new Error(`Invalid policyId for IndexedDB: ${policyId}`);
    }
    const metadata = {
      policyId: String(policyId),
      id: policyData.id ? String(policyData.id) : String(policyId),
      title: policyData.title,
      category: policyData.category,
      status: policyData.status,
      summary_en: policyData.summary_en,
      summary_sw: policyData.summary_sw,
      createdAt: policyData.createdAt,
      updatedAt: policyData.updatedAt,
      budget: policyData.budget,
      filePath: policyData.filePath, // This is crucial for offline viewing
      department: policyData.department,
      subtitle: policyData.subtitle,
      cachedAt: new Date().toISOString()
    };
    const transaction = this.db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);
    await store.put(metadata);
  }

  /**
   * Get cached document
   */
  async getDocument(policyId) {
    await this.ensureReady();
    
    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('policyId');
    
    return new Promise((resolve, reject) => {
      if (!policyId || typeof policyId !== 'string') {
        console.warn('Invalid policyId for IndexedDB lookup:', policyId);
        resolve(null);
        return;
      }
      const request = index.get(String(policyId));
      request.onsuccess = () => {
        const result = request.result;
        resolve(result);
      };
      request.onerror = () => {
        console.error('Document lookup error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get document metadata
   */
  async getMetadata(policyId) {
    await this.ensureReady();
    
    const transaction = this.db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    
    return new Promise((resolve, reject) => {
      if (!policyId || typeof policyId !== 'string') {
        console.warn('Invalid policyId for IndexedDB lookup:', policyId);
        resolve(null);
        return;
      }
      const request = store.get(String(policyId));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if document is cached
   */
  async isDocumentCached(policyId) {
    const doc = await this.getDocument(policyId);
    return !!doc;
  }

  /**
   * Get all cached documents
   */
  async getAllCachedDocuments() {
    await this.ensureReady();
    
    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readonly');
    const docStore = transaction.objectStore(STORE_NAME);
    const metaStore = transaction.objectStore(METADATA_STORE);
    
    const documents = await this.getAllFromStore(docStore);
    const metadataMap = new Map();
    
    const allMetadata = await this.getAllFromStore(metaStore);
    allMetadata.forEach(meta => metadataMap.set(meta.policyId, meta));
    
    return documents.map(doc => ({
      ...doc,
      metadata: metadataMap.get(doc.policyId)
    }));
  }

  /**
   * Delete cached document
   */
  async deleteDocument(policyId) {
    await this.ensureReady();
    
    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
    const docStore = transaction.objectStore(STORE_NAME);
    const metaStore = transaction.objectStore(METADATA_STORE);
    
    const docIndex = docStore.index('policyId');
    return new Promise((resolve, reject) => {
      if (!policyId || typeof policyId !== 'string') {
        console.warn('Invalid policyId for IndexedDB delete:', policyId);
        resolve(false);
        return;
      }
      const docRequest = docIndex.get(String(policyId));
      docRequest.onsuccess = () => {
        const doc = docRequest.result;
        if (doc) {
          docStore.delete(doc.id);
          metaStore.delete(String(policyId));
        }
        resolve(true);
      };
      docRequest.onerror = () => reject(docRequest.error);
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    const documents = await this.getAllCachedDocuments();
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const count = documents.length;
    
    return {
      count,
      totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      documents: documents.map(doc => ({
        policyId: doc.policyId,
        title: doc.metadata?.title || 'Unknown',
        size: doc.size,
        downloadDate: doc.downloadDate
      }))
    };
  }

  /**
   * Clear old documents (keep only recent N documents)
   */
  async cleanupOldDocuments(keepCount = 50) {
    const documents = await this.getAllCachedDocuments();
    
    if (documents.length <= keepCount) {
      return { deletedCount: 0 };
    }

    // Sort by download date, oldest first
    documents.sort((a, b) => new Date(a.downloadDate) - new Date(b.downloadDate));
    
    const toDelete = documents.slice(0, documents.length - keepCount);
    let deletedCount = 0;

    for (const doc of toDelete) {
      try {
        await this.deleteDocument(doc.policyId);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete document ${doc.policyId}:`, error);
      }
    }

    return { deletedCount };
  }

  /**
   * Create blob URL for cached document
   */
  async createDocumentURL(policyId) {
    const document = await this.getDocument(policyId);
    if (!document) {
      return null;
    }
    
    return URL.createObjectURL(document.blob);
  }

  // Helper methods
  async getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getFileExtension(mimeType) {
    const extensions = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };
    return extensions[mimeType] || 'pdf';
  }

  /**
   * Clear all stored documents
   */
  async clearAll() {
    await this.ensureReady();
    
    const transaction = this.db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
    await transaction.objectStore(STORE_NAME).clear();
    await transaction.objectStore(METADATA_STORE).clear();
    
    return { success: true };
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorage();
export default documentStorage; 