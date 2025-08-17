import { Library } from '../types';

/**
 * Advanced Storage Service - Alternatives to localStorage
 * This service provides multiple storage backends for better persistence
 */

export interface StorageBackend {
  name: string;
  isAvailable(): boolean;
  save(key: string, data: any): Promise<boolean>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
}

/**
 * 1. IndexedDB Storage Backend (Most Robust)
 * - Large storage capacity (50MB+)
 * - Structured data storage
 * - Transaction support
 * - Best for complex data
 */
export class IndexedDBBackend implements StorageBackend {
  name = 'IndexedDB';
  private dbName = 'AdvancedLibraryDB';
  private version = 1;
  private storeName = 'libraries';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  async save(key: string, data: any): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ key, data, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      return true;
    } catch (error) {
      console.error('IndexedDB save failed:', error);
      return false;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      return result?.data || null;
    } catch (error) {
      console.error('IndexedDB load failed:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      return true;
    } catch (error) {
      console.error('IndexedDB delete failed:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      return true;
    } catch (error) {
      console.error('IndexedDB clear failed:', error);
      return false;
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }
}

/**
 * 2. WebSQL Storage Backend (Legacy but Reliable)
 * - SQL-like interface
 * - Good browser support
 * - Structured queries
 */
export class WebSQLBackend implements StorageBackend {
  name = 'WebSQL';
  private dbName = 'AdvancedLibraryDB';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'openDatabase' in window;
  }

  async save(key: string, data: any): Promise<boolean> {
    try {
      const db = await this.openDB();
      const sql = 'INSERT OR REPLACE INTO libraries (key, data, timestamp) VALUES (?, ?, ?)';
      
      await new Promise<void>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, [key, JSON.stringify(data), Date.now()], 
            () => resolve(), 
            (_: any, error: any) => reject(error)
          );
        });
      });
      
      return true;
    } catch (error) {
      console.error('WebSQL save failed:', error);
      return false;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const db = await this.openDB();
      const sql = 'SELECT data FROM libraries WHERE key = ?';
      
      const result = await new Promise<any>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, [key], 
            (_: any, result: any) => resolve(result.rows.item(0)?.data), 
            (_: any, error: any) => reject(error)
          );
        });
      });
      
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('WebSQL load failed:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const sql = 'DELETE FROM libraries WHERE key = ?';
      
      await new Promise<void>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, [key], 
            () => resolve(), 
            (_: any, error: any) => reject(error)
          );
        });
      });
      
      return true;
    } catch (error) {
      console.error('WebSQL delete failed:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const db = await this.openDB();
      const sql = 'DELETE FROM libraries';
      
      await new Promise<void>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, [], 
            () => resolve(), 
            (_: any, error: any) => reject(error)
          );
        });
      });
      
      return true;
    } catch (error) {
      console.error('WebSQL clear failed:', error);
      return false;
    }
  }

  private async openDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const db = (window as any).openDatabase(
          this.dbName, 
          '1.0', 
          'Advanced Library Database', 
          2 * 1024 * 1024 // 2MB
        );
        
        db.transaction((tx: any) => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS libraries (key TEXT PRIMARY KEY, data TEXT, timestamp INTEGER)',
            [],
            () => resolve(db),
            (_: any, error: any) => reject(error)
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * 3. File System API Storage (Most Advanced)
 * - Direct file system access
 * - Large storage capacity
 * - Native file operations
 * - Best for file-based data
 */
export class FileSystemBackend implements StorageBackend {
  name = 'FileSystem API';
  private rootHandle: FileSystemDirectoryHandle | null = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  async save(key: string, data: any): Promise<boolean> {
    try {
      if (!this.rootHandle) {
        this.rootHandle = await window.showDirectoryPicker();
      }
      
      const fileHandle = await this.rootHandle.getFileHandle(`${key}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data));
      await writable.close();
      
      return true;
    } catch (error) {
      console.error('FileSystem save failed:', error);
      return false;
    }
  }

  async load(key: string): Promise<any> {
    try {
      if (!this.rootHandle) {
        return null;
      }
      
      const fileHandle = await this.rootHandle.getFileHandle(`${key}.json`);
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      return JSON.parse(content);
    } catch (error) {
      console.error('FileSystem load failed:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.rootHandle) {
        return false;
      }
      
      await this.rootHandle.removeEntry(`${key}.json`);
      return true;
    } catch (error) {
      console.error('FileSystem delete failed:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (!this.rootHandle) {
        return false;
      }
      
      for await (const entry of this.rootHandle.values()) {
        if (entry.name.endsWith('.json')) {
          await this.rootHandle.removeEntry(entry.name);
        }
      }
      
      return true;
    } catch (error) {
      console.error('FileSystem clear failed:', error);
      return false;
    }
  }
}

/**
 * 4. Cache API Storage (Service Worker Compatible)
 * - Works offline
 * - Service worker integration
 * - Good for PWA apps
 */
export class CacheBackend implements StorageBackend {
  name = 'Cache API';
  private cacheName = 'advanced-library-cache';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'caches' in window;
  }

  async save(key: string, data: any): Promise<boolean> {
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(data));
      await cache.put(`/library/${key}`, response);
      return true;
    } catch (error) {
      console.error('Cache API save failed:', error);
      return false;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(`/library/${key}`);
      
      if (response) {
        const text = await response.text();
        return JSON.parse(text);
      }
      
      return null;
    } catch (error) {
      console.error('Cache API load failed:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const cache = await caches.open(this.cacheName);
      await cache.delete(`/library/${key}`);
      return true;
    } catch (error) {
      console.error('Cache API delete failed:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await caches.delete(this.cacheName);
      return true;
    } catch (error) {
      console.error('Cache API clear failed:', error);
      return false;
    }
  }
}

/**
 * 5. Hybrid Storage Manager
 * Combines multiple backends for maximum reliability
 */
export class HybridStorageManager {
  private backends: StorageBackend[] = [];
  private primaryBackend: StorageBackend | null = null;

  constructor() {
    this.initializeBackends();
  }

  private initializeBackends() {
    // Add backends in order of preference
    const backends = [
      new IndexedDBBackend(),
      new FileSystemBackend(),
      new WebSQLBackend(),
      new CacheBackend()
    ];

    // Only add available backends
    this.backends = backends.filter(backend => backend.isAvailable());
    
    // Set primary backend (first available)
    if (this.backends.length > 0) {
      this.primaryBackend = this.backends[0];
      console.log(`Primary storage backend: ${this.primaryBackend.name}`);
    }

    console.log(`Available storage backends: ${this.backends.map(b => b.name).join(', ')}`);
  }

  async save(key: string, data: any): Promise<boolean> {
    if (!this.primaryBackend) {
      console.warn('No storage backends available');
      return false;
    }

    // Try primary backend first
    try {
      const success = await this.primaryBackend.save(key, data);
      if (success) {
        // Also save to other backends for redundancy
        this.backends.slice(1).forEach(backend => {
          backend.save(key, data).catch(error => 
            console.warn(`Redundant save to ${backend.name} failed:`, error)
          );
        });
        return true;
      }
    } catch (error) {
      console.warn(`Primary backend ${this.primaryBackend.name} failed, trying others`);
    }

    // Fallback to other backends
    for (const backend of this.backends.slice(1)) {
      try {
        const success = await backend.save(key, data);
        if (success) {
          console.log(`Fallback save successful using ${backend.name}`);
          return true;
        }
      } catch (error) {
        console.warn(`Backend ${backend.name} failed:`, error);
      }
    }

    return false;
  }

  async load(key: string): Promise<any> {
    // Try all backends until one succeeds
    for (const backend of this.backends) {
      try {
        const data = await backend.load(key);
        if (data !== null) {
          console.log(`Data loaded successfully from ${backend.name}`);
          return data;
        }
      } catch (error) {
        console.warn(`Backend ${backend.name} failed:`, error);
      }
    }

    return null;
  }

  async delete(key: string): Promise<boolean> {
    // Delete from all backends
    const results = await Promise.allSettled(
      this.backends.map(backend => backend.delete(key))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return successCount > 0;
  }

  async clear(): Promise<boolean> {
    // Clear all backends
    const results = await Promise.allSettled(
      this.backends.map(backend => backend.clear())
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return successCount > 0;
  }

  getStorageInfo() {
    return {
      availableBackends: this.backends.map(b => b.name),
      primaryBackend: this.primaryBackend?.name || 'None',
      totalBackends: this.backends.length
    };
  }
}

// Export the hybrid storage manager as the main interface
export const hybridStorage = new HybridStorageManager();
