import { Library, LibraryFile } from '../types';

export class FileHandleManager {
  private static instance: FileHandleManager;
  private permissionCache = new Map<string, boolean>();

  static getInstance(): FileHandleManager {
    if (!FileHandleManager.instance) {
      FileHandleManager.instance = new FileHandleManager();
    }
    return FileHandleManager.instance;
  }

  /**
   * Restore file handles for a library that was loaded from backup
   * This prompts the user to re-select the directory if handles are invalid
   */
  async restoreLibraryHandles(library: Library): Promise<Library | null> {
    try {
      // Check if directory handle is still valid
      if (library.directoryHandle && await this.verifyPermission(library.directoryHandle, false)) {
        // Re-scan files to ensure they still exist
        const restoredFiles = await this.scanDirectory(library.directoryHandle);
        if (restoredFiles.length > 0) {
          return {
            ...library,
            files: restoredFiles
          };
        }
      }

      // If handles are invalid, prompt user to re-select directory
      console.log(`Library "${library.name}" needs directory re-selection`);
      return null;
    } catch (error) {
      console.error('Failed to restore library handles:', error);
      return null;
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

      return {
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
          category: 'medical_documents'
        }
      };
    } catch (error) {
      console.error('Failed to create library from directory:', error);
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

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileHandleManager = FileHandleManager.getInstance();
