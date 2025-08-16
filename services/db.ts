
import { Library } from '../types';

const DB_NAME = 'MedicalLibraryDB';
const DB_VERSION = 2; // Increment version for new schema
const STORE_NAME = 'libraries';
const BACKUP_KEY = 'medical_library_backup';

let db: IDBDatabase;
let isUpgrading = false;

// Enhanced error handling and logging
function logError(operation: string, error: any) {
  console.error(`Database ${operation} error:`, error);
  // Store error in localStorage for debugging
  const errorLog = JSON.parse(localStorage.getItem('db_error_log') || '[]');
  errorLog.push({
    timestamp: new Date().toISOString(),
    operation,
    error: error?.message || String(error)
  });
  localStorage.setItem('db_error_log', JSON.stringify(errorLog.slice(-10))); // Keep last 10 errors
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db && !isUpgrading) {
      return resolve(db);
    }

    // If we're already upgrading, wait a bit and try again
    if (isUpgrading) {
      setTimeout(() => {
        if (db && !isUpgrading) {
          resolve(db);
        } else {
          reject(new Error('Database upgrade in progress, please try again'));
        }
      }, 1000);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logError('open', request.error);
      isUpgrading = false;
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      db = request.result;
      isUpgrading = false;
      
      // Add connection monitoring
      db.onclose = () => {
        console.log('Database connection closed');
        db = null as any;
        isUpgrading = false;
      };
      
      db.onerror = (event) => {
        logError('general', event);
      };
      
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      try {
        isUpgrading = true;
        const dbInstance = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        
        console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
        
        if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
          const store = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
          // Add indexes for better performance
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
        
        // Handle version 1 to 2 upgrade - do this synchronously without additional transactions
        if (oldVersion < 2) {
          try {
            // Get the store from the database instance during upgrade
            const store = (dbInstance as any).objectStore(STORE_NAME);
            const cursorRequest = store.openCursor();
            
            cursorRequest.onsuccess = (cursorEvent: Event) => {
              const cursor = (cursorEvent.target as IDBRequest).result as IDBCursorWithValue;
              if (cursor) {
                const library = cursor.value as any;
                // Add new fields with defaults
                if (!library.createdAt) library.createdAt = new Date().toISOString();
                if (!library.lastAccessed) library.lastAccessed = new Date().toISOString();
                if (!library.metadata) library.metadata = {};
                
                // Use the cursor to update the record
                cursor.update(library);
                cursor.continue();
              }
            };
            
            cursorRequest.onerror = (cursorError: Event) => {
              console.warn('Error during cursor operation during upgrade:', cursorError);
              // Continue with upgrade even if cursor fails
            };
          } catch (upgradeError) {
            console.warn('Error during version upgrade:', upgradeError);
            // Continue with upgrade even if this part fails
          }
        }
      } catch (upgradeError) {
        console.error('Critical error during database upgrade:', upgradeError);
        isUpgrading = false;
        // Don't reject here, let the upgrade continue
      }
    };

    request.onblocked = () => {
      console.warn('Database blocked - another tab may have it open');
      isUpgrading = false;
    };
  });
}

// Enhanced save with backup and metadata
export async function saveLibrary(library: Library): Promise<void> {
  try {
    // Add metadata
    const enhancedLibrary = {
      ...library,
      createdAt: library.createdAt || new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      metadata: {
        ...library.metadata,
        fileCount: library.files.length,
        totalSize: 0, // Will be calculated if possible
        lastModified: new Date().toISOString()
      }
    };

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(enhancedLibrary);
      
      request.onsuccess = () => {
        // Create backup in localStorage
        createBackup(enhancedLibrary);
        resolve();
      };
      
      request.onerror = () => {
        logError('save', request.error);
        reject(new Error(`Failed to save library: ${request.error?.message}`));
      };
    });
  } catch (error) {
    logError('save', error);
    throw error;
  }
}

// Enhanced retrieval with fallback
export async function getLibraries(): Promise<Library[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const libraries = request.result || [];
        // Update last accessed time
        libraries.forEach(lib => {
          lib.lastAccessed = new Date().toISOString();
        });
        resolve(libraries);
      };
      
      request.onerror = () => {
        logError('retrieve', request.error);
        // Fallback to localStorage backup
        console.log('Falling back to localStorage backup...');
        resolve(getBackupLibraries());
      };
    });
  } catch (error) {
    logError('retrieve', error);
    // Fallback to localStorage backup
    console.log('Falling back to localStorage backup due to error...');
    return getBackupLibraries();
  }
}

// Enhanced delete with backup cleanup
export async function deleteLibrary(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        // Remove from backup
        removeBackupLibrary(id);
        resolve();
      };
      
      request.onerror = () => {
        logError('delete', request.error);
        reject(new Error(`Failed to delete library: ${request.error?.message}`));
      };
    });
  } catch (error) {
    logError('delete', error);
    throw error;
  }
}

// Backup system for localStorage fallback
function createBackup(library: Library) {
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || '{}');
    backup[library.id] = {
      ...library,
      // Don't store FileSystem handles in localStorage as they can't be serialized
      files: library.files.map(file => ({
        name: file.name,
        // Store file metadata instead of handle
        size: 0, // Will be populated if possible
        lastModified: new Date().toISOString()
      })),
      directoryHandle: null // Clear handle for localStorage
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
  } catch (error) {
    console.error('Failed to create backup:', error);
  }
}

function getBackupLibraries(): Library[] {
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || '{}');
    return Object.values(backup).map((lib: any) => ({
      ...lib,
      files: lib.files || [],
      directoryHandle: null // Will need to be re-established
    }));
  } catch (error) {
    console.error('Failed to read backup:', error);
    return [];
  }
}

function removeBackupLibrary(id: string) {
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || '{}');
    delete backup[id];
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
  } catch (error) {
    console.error('Failed to remove backup:', error);
  }
}

// Utility function to check database health
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Export backup functions for external use
export { createBackup, getBackupLibraries, removeBackupLibrary };

// Database reset function for recovery from corruption
export async function resetDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Close existing connection
      if (db) {
        db.close();
        db = null as any;
        isUpgrading = false;
      }

      // Delete the database
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      
      deleteRequest.onerror = () => {
        logError('delete', deleteRequest.error);
        reject(new Error(`Failed to delete database: ${deleteRequest.error?.message}`));
      };
      
      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
    } catch (error) {
      logError('reset', error);
      reject(error);
    }
  });
}

// Force database recreation
export async function forceRecreateDatabase(): Promise<IDBDatabase> {
  try {
    await resetDatabase();
    // Wait a bit for the deletion to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return await openDB();
  } catch (error) {
    logError('forceRecreate', error);
    throw error;
  }
}
