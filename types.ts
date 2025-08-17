
export interface LibraryFile {
  name: string;
  handle: FileSystemFileHandle;
  size?: number;
  lastModified?: string;
}

export interface Library {
  id: string;
  name: string;
  files: LibraryFile[];
  directoryHandle: FileSystemDirectoryHandle;
  createdAt?: string;
  lastAccessed?: string;
  metadata?: {
    fileCount?: number;
    totalSize?: number;
    lastModified?: string;
    description?: string;
    tags?: string[];
    category?: string;
    needsReconnection?: boolean;
    hasErrors?: boolean;
    errorMessage?: string;
    lastReconnected?: string;
    lastConnected?: string;
    lastRestored?: string;
    lastAttemptedRestore?: string;
    lastError?: string;
    // Enhanced persistence properties
    persistence?: {
      lastSaved?: string;
      saveCount?: number;
      backupCreated?: boolean;
      localStorageBackup?: boolean;
      indexedDBBackup?: boolean;
      created?: string;
      storageMethod?: string;
      backupLayers?: string[];
    };
    // Enhanced restoration properties
    restoredFromBackup?: boolean;
    restoredFromEnhancedStorage?: boolean;
    restoredFromLegacyBackup?: boolean;
    backupRestored?: string;
    restoreAttemptCount?: number;
    reconnectionCount?: number;
  };
}

export enum AppView {
  Welcome,
  LibraryList,
  LibraryView,
}

// Declarations for the File System Access API to prevent TypeScript errors.
declare global {
  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  // Based on the WHATWG spec.
  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
    name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    name: string;
  }

  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}
