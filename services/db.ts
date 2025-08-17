
import { Library } from '../types';

const DB_NAME = 'MedicalLibraryDB';
const DB_VERSION = 3; // Increment version for enhanced persistence
const STORE_NAME = 'libraries';
const BACKUP_KEY = 'medical_library_backup';
const PERSISTENCE_KEY = 'medical_library_persistence';

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

// Enhanced persistence check
function checkPersistenceSupport(): boolean {
  try {
    // Check if localStorage is available
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage only');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Persistence not supported:', error);
    return false;
  }
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
        
        // Handle version upgrades
        if (oldVersion < 2) {
          try {
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
                
                cursor.update(library);
                cursor.continue();
              }
            };
            
            cursorRequest.onerror = (cursorError: Event) => {
              console.warn('Error during cursor operation during upgrade:', cursorError);
            };
          } catch (upgradeError) {
            console.warn('Error during version upgrade:', upgradeError);
          }
        }

        // Version 3: Enhanced persistence metadata
        if (oldVersion < 3) {
          try {
            const store = (dbInstance as any).objectStore(STORE_NAME);
            const cursorRequest = store.openCursor();
            
            cursorRequest.onsuccess = (cursorEvent: Event) => {
              const cursor = (cursorEvent.target as IDBRequest).result as IDBCursorWithValue;
              if (cursor) {
                const library = cursor.value as any;
                // Add enhanced persistence metadata
                if (!library.metadata) library.metadata = {};
                if (!library.metadata.persistence) {
                  library.metadata.persistence = {
                    lastSaved: new Date().toISOString(),
                    saveCount: 1,
                    backupCreated: true,
                    localStorageBackup: true
                  };
                }
                
                cursor.update(library);
                cursor.continue();
              }
            };
            
            cursorRequest.onerror = (cursorError: Event) => {
              console.warn('Error during cursor operation during upgrade:', cursorError);
            };
          } catch (upgradeError) {
            console.warn('Error during version 3 upgrade:', upgradeError);
          }
        }
      } catch (upgradeError) {
        console.error('Critical error during database upgrade:', upgradeError);
        isUpgrading = false;
      }
    };

    request.onblocked = () => {
      console.warn('Database blocked - another tab may have it open');
      isUpgrading = false;
    };
  });
}

// Enhanced save with multiple backup layers
export async function saveLibrary(library: Library): Promise<void> {
  try {
    console.log(`Starting to save library: ${library.name} with enhanced persistence`);
    
    // Add enhanced metadata
    const enhancedLibrary = {
      ...library,
      createdAt: library.createdAt || new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      metadata: {
        ...library.metadata,
        fileCount: library.files.length,
        totalSize: library.files.reduce((sum, file) => sum + (file.size || 0), 0),
        lastModified: new Date().toISOString(),
        persistence: {
          lastSaved: new Date().toISOString(),
          saveCount: (library.metadata?.persistence?.saveCount || 0) + 1,
          backupCreated: true,
          localStorageBackup: true,
          indexedDBBackup: true
        }
      }
    };

    console.log(`Enhanced library metadata created for: ${library.name}`);

    // Always create localStorage backup first (most reliable)
    createEnhancedBackup(enhancedLibrary);
    console.log(`localStorage backup created for: ${library.name}`);

    // Try IndexedDB save
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(enhancedLibrary);
        
        request.onsuccess = () => {
          console.log(`Library "${library.name}" saved to IndexedDB successfully`);
          resolve();
        };
        
        request.onerror = () => {
          logError('save', request.error);
          reject(new Error(`Failed to save library: ${request.error?.message}`));
        };
      });
      console.log(`IndexedDB save completed for: ${library.name}`);
    } catch (dbError) {
      console.warn('IndexedDB save failed, using localStorage only:', dbError);
      // Continue with localStorage backup only
    }

    // Update persistence metadata
    updatePersistenceStatus(enhancedLibrary.id, 'saved');
    console.log(`Persistence status updated for: ${library.name}`);
    
    console.log(`Library "${library.name}" saved successfully with enhanced persistence`);
  } catch (error) {
    logError('save', error);
    throw error;
  }
}

// Enhanced retrieval with multiple fallback layers
export async function getLibraries(): Promise<Library[]> {
  try {
    // First try IndexedDB
    try {
      const db = await openDB();
      const libraries = await new Promise<Library[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const result = request.result || [];
          // Update last accessed time
          result.forEach(lib => {
            lib.lastAccessed = new Date().toISOString();
          });
          resolve(result);
        });
        
        request.onerror = () => {
          logError('retrieve', request.error);
          reject(new Error('IndexedDB retrieval failed'));
        };
      });

      if (libraries.length > 0) {
        console.log(`Retrieved ${libraries.length} libraries from IndexedDB`);
        return libraries;
      }
    } catch (dbError) {
      console.warn('IndexedDB retrieval failed, trying localStorage:', dbError);
    }

    // Fallback to localStorage
    console.log('Falling back to localStorage backup...');
    const backupLibraries = getEnhancedBackupLibraries();
    if (backupLibraries.length > 0) {
      console.log(`Retrieved ${backupLibraries.length} libraries from localStorage backup`);
      return backupLibraries;
    }

    // Final fallback to legacy backup
    console.log('Falling back to legacy backup...');
    return getBackupLibraries();
  } catch (error) {
    logError('retrieve', error);
    // Final fallback
    console.log('All retrieval methods failed, returning empty array');
    return [];
  }
}

// Enhanced delete with backup cleanup
export async function deleteLibrary(id: string): Promise<void> {
  try {
    // Remove from all backup layers first
    removeEnhancedBackupLibrary(id);
    removeBackupLibrary(id);

    // Try IndexedDB delete
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          console.log(`Library deleted from IndexedDB successfully`);
          resolve();
        };
        
        request.onerror = () => {
          logError('delete', request.error);
          reject(new Error(`Failed to delete library: ${request.error?.message}`));
        };
      });
    } catch (dbError) {
      console.warn('IndexedDB delete failed, but backup cleanup completed:', dbError);
    }

    // Update persistence metadata
    updatePersistenceStatus(id, 'deleted');
    
  } catch (error) {
    logError('delete', error);
    throw error;
  }
}

// Enhanced backup system with multiple layers
function createEnhancedBackup(library: Library) {
  try {
    // Create a clean backup without FileSystem handles
    const backupData = {
      ...library,
      files: library.files.map(file => ({
        name: file.name,
        size: file.size || 0,
        lastModified: file.lastModified || new Date().toISOString(),
        // Don't store the actual handle
        handle: null
      })),
      directoryHandle: null, // Clear handle for localStorage
      metadata: {
        ...library.metadata,
        backupCreated: new Date().toISOString(),
        backupVersion: '2.0'
      }
    };

    // Store in enhanced backup
    const enhancedBackup = JSON.parse(localStorage.getItem(PERSISTENCE_KEY) || '{}');
    enhancedBackup[library.id] = backupData;
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(enhancedBackup));

    // Also store in legacy backup for compatibility
    createBackup(library);
    
    console.log(`Enhanced backup created for library: ${library.name}`);
  } catch (error) {
    console.error('Failed to create enhanced backup:', error);
  }
}

function getEnhancedBackupLibraries(): Library[] {
  try {
    const enhancedBackup = JSON.parse(localStorage.getItem(PERSISTENCE_KEY) || '{}');
    const libraries = Object.values(enhancedBackup).map((lib: any) => ({
      ...lib,
      files: lib.files || [],
      directoryHandle: null, // Will need to be re-established
      metadata: {
        ...lib.metadata,
        needsReconnection: true,
        restoredFromBackup: true,
        backupRestored: new Date().toISOString()
      }
    }));
    
    return libraries;
  } catch (error) {
    console.error('Failed to read enhanced backup:', error);
    return [];
  }
}

function removeEnhancedBackupLibrary(id: string) {
  try {
    const enhancedBackup = JSON.parse(localStorage.getItem(PERSISTENCE_KEY) || '{}');
    delete enhancedBackup[id];
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(enhancedBackup));
  } catch (error) {
    console.error('Failed to remove enhanced backup:', error);
  }
}

// Legacy backup system (kept for compatibility)
function createBackup(library: Library) {
  try {
    const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || '{}');
    backup[library.id] = {
      ...library,
      files: library.files.map(file => ({
        name: file.name,
        size: file.size || 0,
        lastModified: file.lastModified || new Date().toISOString()
      })),
      directoryHandle: null
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
      directoryHandle: null,
      metadata: {
        ...lib.metadata,
        needsReconnection: true,
        restoredFromLegacyBackup: true
      }
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

// Persistence status tracking
function updatePersistenceStatus(libraryId: string, action: 'saved' | 'deleted' | 'restored') {
  try {
    const status = JSON.parse(localStorage.getItem('persistence_status') || '{}');
    status[libraryId] = {
      lastAction: action,
      timestamp: new Date().toISOString(),
      actionCount: (status[libraryId]?.actionCount || 0) + 1
    };
    localStorage.setItem('persistence_status', JSON.stringify(status));
  } catch (error) {
    console.error('Failed to update persistence status:', error);
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

// Check overall persistence health
export function checkPersistenceHealth(): { healthy: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    // Check localStorage
    if (!localStorage) {
      issues.push('localStorage not available');
    }
    
    // Check IndexedDB
    if (!window.indexedDB) {
      issues.push('IndexedDB not available');
    }
    
    // Check backup data
    const enhancedBackup = localStorage.getItem(PERSISTENCE_KEY);
    const legacyBackup = localStorage.getItem(BACKUP_KEY);
    
    if (!enhancedBackup && !legacyBackup) {
      issues.push('No backup data found');
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  } catch (error) {
    issues.push(`Persistence check failed: ${error}`);
    return { healthy: false, issues };
  }
}

// Export backup functions for external use
export { createBackup, getBackupLibraries, removeBackupLibrary, createEnhancedBackup, getEnhancedBackupLibraries, removeEnhancedBackupLibrary };

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

// Enhanced data export for backup
export function exportAllData(): string {
  try {
    const enhancedBackup = localStorage.getItem(PERSISTENCE_KEY);
    const legacyBackup = localStorage.getItem(BACKUP_KEY);
    const persistenceStatus = localStorage.getItem('persistence_status');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      enhancedBackup: enhancedBackup ? JSON.parse(enhancedBackup) : {},
      legacyBackup: legacyBackup ? JSON.parse(legacyBackup) : {},
      persistenceStatus: persistenceStatus ? JSON.parse(persistenceStatus) : {},
      exportInfo: {
        totalLibraries: 0,
        totalFiles: 0,
        backupSize: 0
      }
    };
    
    // Calculate stats
    if (enhancedBackup) {
      const enhanced = JSON.parse(enhancedBackup);
      exportData.exportInfo.totalLibraries = Object.keys(enhanced).length;
      exportData.exportInfo.totalFiles = Object.values(enhanced).reduce((sum: number, lib: any) => 
        sum + (lib.files?.length || 0), 0);
    }
    
    exportData.exportInfo.backupSize = JSON.stringify(exportData).length;
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export data:', error);
    return JSON.stringify({ error: 'Export failed', message: error.message });
  }
}

// Import data from backup
export function importFromBackup(backupData: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(backupData);
    
    if (data.enhancedBackup) {
      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(data.enhancedBackup));
    }
    
    if (data.legacyBackup) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(data.legacyBackup));
    }
    
    if (data.persistenceStatus) {
      localStorage.setItem('persistence_status', JSON.stringify(data.persistenceStatus));
    }
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    return { success: false, message: `Import failed: ${error.message}` };
  }
}
