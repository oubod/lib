import { Library, LibraryFile } from '../types';

export class FileHandleManager {
  private static instance: FileHandleManager;
  private permissionCache = new Map<string, boolean>();
  private handleStorageKey = 'file_handles_cache';
  private enhancedHandleKey = 'enhanced_file_handles';

  static getInstance(): FileHandleManager {
    if (!FileHandleManager.instance) {
      FileHandleManager.instance = new FileHandleManager();
    }
    return FileHandleManager.instance;
  }

  /**
   * Store directory handle for persistence (mobile-friendly)
   * Enhanced with multiple storage layers
   */
  private async storeDirectoryHandle(libraryId: string, directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    try {
      // Store the directory handle in multiple locations for redundancy
      const handleData = {
        id: libraryId,
        name: directoryHandle.name,
        timestamp: Date.now(),
        // Note: We can't serialize the handle directly, but we can store metadata
        metadata: {
          name: directoryHandle.name,
          kind: directoryHandle.kind,
          lastAccessed: new Date().toISOString(),
          accessCount: 1
        }
      };
      
      // Store in enhanced storage
      const enhancedStorage = JSON.parse(localStorage.getItem(this.enhancedHandleKey) || '{}');
      enhancedStorage[libraryId] = {
        ...handleData,
        version: '2.0',
        backupCreated: new Date().toISOString()
      };
      localStorage.setItem(this.enhancedHandleKey, JSON.stringify(enhancedStorage));
      
      // Store in legacy storage for compatibility
      const stored = JSON.parse(localStorage.getItem(this.handleStorageKey) || '{}');
      stored[libraryId] = handleData;
      localStorage.setItem(this.handleStorageKey, JSON.stringify(stored));
      
      console.log(`Enhanced directory handle storage for library: ${libraryId}`);
    } catch (error) {
      console.warn('Failed to store directory handle:', error);
    }
  }

  /**
   * Restore file handles for a library that was loaded from backup
   * Enhanced for mobile persistence with multiple fallback layers
   */
  async restoreLibraryHandles(library: Library): Promise<Library | null> {
    try {
      // First, try to restore from the enhanced storage
      const enhancedStorage = JSON.parse(localStorage.getItem(this.enhancedHandleKey) || '{}');
      const enhancedHandle = enhancedStorage[library.id];
      
      if (enhancedHandle && enhancedHandle.metadata) {
        console.log(`Attempting to restore handles from enhanced storage for library: ${library.name}`);
        
        // Try to use the existing directory handle if it's still valid
        if (library.directoryHandle) {
          try {
            // Verify the handle is still accessible
            const permission = await this.verifyPermission(library.directoryHandle, false);
            if (permission) {
              // Re-scan files to ensure they still exist
              const restoredFiles = await this.scanDirectory(library.directoryHandle);
              if (restoredFiles.length > 0) {
                console.log(`Successfully restored library: ${library.name} with ${restoredFiles.length} files`);
                
                // Update access count in storage
                this.updateHandleAccessCount(library.id);
                
                return {
                  ...library,
                  files: restoredFiles,
                  metadata: {
                    ...library.metadata,
                    needsReconnection: false,
                    lastRestored: new Date().toISOString(),
                    restoredFromEnhancedStorage: true
                  }
                };
              }
            }
          } catch (error) {
            console.log(`Handle validation failed for ${library.name}:`, error);
          }
        }
        
        // If we can't restore, mark as needing reconnection but keep the library
        console.log(`Library "${library.name}" needs directory re-selection`);
        return {
          ...library,
          metadata: {
            ...library.metadata,
            needsReconnection: true,
            lastAttemptedRestore: new Date().toISOString(),
            restoreAttemptCount: (library.metadata?.restoreAttemptCount || 0) + 1
          }
        };
      }
      
      // Fallback to legacy storage
      const stored = JSON.parse(localStorage.getItem(this.handleStorageKey) || '{}');
      const storedHandle = stored[library.id];
      
      if (storedHandle && storedHandle.metadata) {
        console.log(`Attempting to restore handles from legacy storage for library: ${library.name}`);
        
        // Try to use the existing directory handle if it's still valid
        if (library.directoryHandle) {
          try {
            const permission = await this.verifyPermission(library.directoryHandle, false);
            if (permission) {
              const restoredFiles = await this.scanDirectory(library.directoryHandle);
              if (restoredFiles.length > 0) {
                console.log(`Successfully restored library: ${library.name} with ${restoredFiles.length} files from legacy storage`);
                
                // Update access count in storage
                this.updateHandleAccessCount(library.id);
                
                return {
                  ...library,
                  files: restoredFiles,
                  metadata: {
                    ...library.metadata,
                    needsReconnection: false,
                    lastRestored: new Date().toISOString(),
                    restoredFromBackup: true
                  }
                };
              }
            }
          } catch (error) {
            console.log(`Legacy handle validation failed for ${library.name}:`, error);
          }
        }
        
        return {
          ...library,
          metadata: {
            ...library.metadata,
            needsReconnection: true,
            lastAttemptedRestore: new Date().toISOString(),
            restoreAttemptCount: (library.metadata?.restoreAttemptCount || 0) + 1
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to restore library handles:', error);
      return null;
    }
  }

  /**
   * Update access count for a handle
   */
  private updateHandleAccessCount(libraryId: string): void {
    try {
      // Update enhanced storage
      const enhancedStorage = JSON.parse(localStorage.getItem(this.enhancedHandleKey) || '{}');
      if (enhancedStorage[libraryId]) {
        enhancedStorage[libraryId].metadata.accessCount = (enhancedStorage[libraryId].metadata.accessCount || 0) + 1;
        enhancedStorage[libraryId].metadata.lastAccessed = new Date().toISOString();
        localStorage.setItem(this.enhancedHandleKey, JSON.stringify(enhancedStorage));
      }
      
      // Update legacy storage
      const stored = JSON.parse(localStorage.getItem(this.handleStorageKey) || '{}');
      if (stored[libraryId]) {
        stored[libraryId].metadata.accessCount = (stored[libraryId].metadata.accessCount || 0) + 1;
        stored[libraryId].metadata.lastAccessed = new Date().toISOString();
        localStorage.setItem(this.handleStorageKey, JSON.stringify(stored));
      }
    } catch (error) {
      console.error('Failed to update handle access count:', error);
    }
  }

  /**
   * Scan directory for PDF files and create file handles
   */
  async scanDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<LibraryFile[]> {
    const files: LibraryFile[] = [];
    
    try {
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.pdf')) {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            
            files.push({
              name: entry.name,
              handle: fileHandle,
              size: file.size,
              lastModified: new Date(file.lastModified).toISOString()
            });
          } catch (error) {
            console.warn(`Failed to process file ${entry.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan directory:', error);
    }

    return files;
  }

  /**
   * Verify permission for a directory handle
   */
  async verifyPermission(directoryHandle: FileSystemDirectoryHandle, request: boolean = false): Promise<boolean> {
    const cacheKey = `${directoryHandle.name}_${request}`;
    
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      const options: FileSystemHandlePermissionDescriptor = request ? { mode: 'readwrite' } : {};
      
      if (await directoryHandle.queryPermission(options) === 'granted') {
        this.permissionCache.set(cacheKey, true);
        return true;
      }
      
      if (request && await directoryHandle.requestPermission(options) === 'granted') {
        this.permissionCache.set(cacheKey, true);
        return true;
      }
      
      this.permissionCache.set(cacheKey, false);
      return false;
    } catch (error) {
      console.error('Permission verification failed:', error);
      this.permissionCache.set(cacheKey, false);
      return false;
    }
  }

  /**
   * Request directory picker and create library
   * Enhanced for mobile persistence
   */
  async createLibraryFromDirectory(): Promise<Library | null> {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      
      if (!await this.verifyPermission(directoryHandle, true)) {
        throw new Error('Permission denied for directory access');
      }
      
      const files = await this.scanDirectory(directoryHandle);
      
      if (files.length === 0) {
        throw new Error('No PDF files found in selected directory');
      }

      const library: Library = {
        id: crypto.randomUUID(),
        name: directoryHandle.name,
        files,
        directoryHandle,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        metadata: {
          fileCount: files.length,
          totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
          lastModified: new Date().toISOString(),
          description: `Library created from ${directoryHandle.name}`,
          tags: ['medical', 'pdf'],
          category: 'medical_documents',
          needsReconnection: false,
          lastConnected: new Date().toISOString(),
          persistence: {
            created: new Date().toISOString(),
            storageMethod: 'enhanced',
            backupLayers: ['localStorage', 'indexedDB']
          }
        }
      };

      // Store the directory handle for persistence
      await this.storeDirectoryHandle(library.id, directoryHandle);
      
      return library;
    } catch (error) {
      console.error('Failed to create library from directory:', error);
      if ((error as DOMException).name !== 'AbortError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * Reconnect a library by prompting user to re-select the directory
   */
  async reconnectLibrary(library: Library): Promise<Library | null> {
    try {
      console.log(`Attempting to reconnect library: ${library.name}`);
      
      const directoryHandle = await window.showDirectoryPicker();
      
      if (!await this.verifyPermission(directoryHandle, true)) {
        throw new Error('Permission denied for directory access');
      }
      
      const files = await this.scanDirectory(directoryHandle);
      
      if (files.length === 0) {
        throw new Error('No PDF files found in selected directory');
      }

      const reconnectedLibrary: Library = {
        ...library,
        files,
        directoryHandle,
        lastAccessed: new Date().toISOString(),
        metadata: {
          ...library.metadata,
          fileCount: files.length,
          totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
          lastModified: new Date().toISOString(),
          needsReconnection: false,
          lastConnected: new Date().toISOString(),
          lastReconnected: new Date().toISOString(),
          reconnectionCount: (library.metadata?.reconnectionCount || 0) + 1
        }
      };

      // Update the stored handle
      await this.storeDirectoryHandle(library.id, directoryHandle);
      
      console.log(`Successfully reconnected library: ${library.name}`);
      return reconnectedLibrary;
    } catch (error) {
      console.error('Failed to reconnect library:', error);
      if ((error as DOMException).name !== 'AbortError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Get library statistics
   */
  getLibraryStats(library: Library) {
    const totalSize = library.files.reduce((sum, file) => sum + (file.size || 0), 0);
    const fileTypes = new Set(library.files.map(file => file.name.split('.').pop()?.toLowerCase()));
    
    return {
      fileCount: library.files.length,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      fileTypes: Array.from(fileTypes),
      averageFileSize: library.files.length > 0 ? totalSize / library.files.length : 0,
      lastModified: library.metadata?.lastModified || library.lastAccessed
    };
  }

  /**
   * Get persistence statistics
   */
  getPersistenceStats(): { totalLibraries: number; enhancedStorage: number; legacyStorage: number; lastBackup: string } {
    try {
      const enhancedStorage = JSON.parse(localStorage.getItem(this.enhancedHandleKey) || '{}');
      const legacyStorage = JSON.parse(localStorage.getItem(this.handleStorageKey) || '{}');
      
      const enhancedCount = Object.keys(enhancedStorage).length;
      const legacyCount = Object.keys(legacyStorage).length;
      
      let lastBackup = 'Never';
      if (enhancedCount > 0) {
        const timestamps = Object.values(enhancedStorage).map((handle: any) => handle.timestamp);
        const latest = Math.max(...timestamps);
        lastBackup = new Date(latest).toLocaleString();
      }
      
      return {
        totalLibraries: Math.max(enhancedCount, legacyCount),
        enhancedStorage: enhancedCount,
        legacyStorage: legacyCount,
        lastBackup
      };
    } catch (error) {
      console.error('Failed to get persistence stats:', error);
      return { totalLibraries: 0, enhancedStorage: 0, legacyStorage: 0, lastBackup: 'Error' };
    }
  }

  /**
   * Clean up old or invalid handles
   */
  cleanupInvalidHandles(): { cleaned: number; remaining: number } {
    try {
      const enhancedStorage = JSON.parse(localStorage.getItem(this.enhancedHandleKey) || '{}');
      const legacyStorage = JSON.parse(localStorage.getItem(this.handleStorageKey) || '{}');
      
      let cleaned = 0;
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      // Clean enhanced storage
      Object.keys(enhancedStorage).forEach(id => {
        const handle = enhancedStorage[id];
        if (now - handle.timestamp > maxAge) {
          delete enhancedStorage[id];
          cleaned++;
        }
      });
      
      // Clean legacy storage
      Object.keys(legacyStorage).forEach(id => {
        const handle = legacyStorage[id];
        if (now - handle.timestamp > maxAge) {
          delete legacyStorage[id];
          cleaned++;
        }
      });
      
      // Save cleaned data
      localStorage.setItem(this.enhancedHandleKey, JSON.stringify(enhancedStorage));
      localStorage.setItem(this.handleStorageKey, JSON.stringify(legacyStorage));
      
      const remaining = Object.keys(enhancedStorage).length + Object.keys(legacyStorage).length;
      
      return { cleaned, remaining };
    } catch (error) {
      console.error('Failed to cleanup invalid handles:', error);
      return { cleaned: 0, remaining: 0 };
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileHandleManager = FileHandleManager.getInstance();
