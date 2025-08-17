
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Library, LibraryFile } from './types';
import { saveLibrary, getLibraries, deleteLibrary as dbDeleteLibrary, checkDatabaseHealth, forceRecreateDatabase } from './services/db';
import { fileHandleManager } from './services/fileHandleManager';
import WelcomeScreen from './components/WelcomeScreen';
import LibraryListScreen from './components/LibraryListScreen';
import LibraryViewScreen from './components/LibraryViewScreen';
import GeminiModal from './components/GeminiModal';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.Welcome);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Chargement des bibliothèques...');
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [fileForAi, setFileForAi] = useState<LibraryFile | null>(null);

  const loadLibraries = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Chargement des bibliothèques...');
    
    try {
      // Check database health first
      const dbHealthy = await checkDatabaseHealth();
      if (!dbHealthy) {
        console.warn('Database health check failed, attempting to recreate...');
        try {
          await forceRecreateDatabase();
          console.log('Database recreated successfully');
        } catch (recreateError) {
          console.error('Failed to recreate database:', recreateError);
          // Continue with localStorage fallback
        }
      }

      const savedLibraries = await getLibraries();
      const verifiedLibraries: Library[] = [];
      
      for (const lib of savedLibraries) {
        try {
          // Try to restore file handles for each library
          const restoredLibrary = await fileHandleManager.restoreLibraryHandles(lib);
          if (restoredLibrary) {
            verifiedLibraries.push(restoredLibrary);
            // Update the library in database with restored handles
            await saveLibrary(restoredLibrary);
          } else {
            // Library needs re-selection, keep it in list but mark as needing attention
            console.log(`Library "${lib.name}" needs directory re-selection`);
            verifiedLibraries.push({
              ...lib,
              metadata: {
                ...lib.metadata,
                needsReconnection: true,
                lastAttemptedRestore: new Date().toISOString()
              }
            });
          }
        } catch (error) {
          console.error(`Failed to restore library "${lib.name}":`, error);
          // Keep library but mark as having issues
          verifiedLibraries.push({
            ...lib,
            metadata: {
              ...lib.metadata,
              hasErrors: true,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              lastError: new Date().toISOString()
            }
          });
        }
      }
      
      setLibraries(verifiedLibraries);
      
      if (verifiedLibraries.length > 0) {
        setCurrentView(AppView.LibraryList);
      } else {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (hasSeenWelcome) {
          setCurrentView(AppView.LibraryList);
        }
      }
    } catch (error) {
      console.error("Impossible de charger les bibliothèques:", error);
      
      // If it's a database corruption error, try to recreate the database
      if (error instanceof Error && error.message.includes('Version change transaction was aborted')) {
        console.log('Detected database corruption, attempting recovery...');
        try {
          setLoadingMessage('Récupération de la base de données...');
          await forceRecreateDatabase();
          // Try to load libraries again
          const recoveredLibraries = await getLibraries();
          setLibraries(recoveredLibraries);
          setCurrentView(AppView.LibraryList);
        } catch (recoveryError) {
          console.error('Database recovery failed:', recoveryError);
          // Fall back to empty state
          setLibraries([]);
          setCurrentView(AppView.LibraryList);
        }
      } else {
        // Show error but don't crash the app
        setLibraries([]);
        setCurrentView(AppView.LibraryList);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibraries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddLibrary = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Sélection du dossier...');

      const newLibrary = await fileHandleManager.createLibraryFromDirectory();
      
      if (newLibrary) {
        await saveLibrary(newLibrary);
        setLibraries(prev => [...prev, newLibrary]);
        setSelectedLibrary(newLibrary);
        setCurrentView(AppView.LibraryView);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la bibliothèque :", error);
      if ((error as DOMException).name !== 'AbortError') {
        alert(`Une erreur est survenue lors de la sélection du dossier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnectLibrary = async (library: Library) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Reconnexion de la bibliothèque...');
      
      const reconnectedLibrary = await fileHandleManager.reconnectLibrary(library);
      
      if (reconnectedLibrary) {
        await saveLibrary(reconnectedLibrary);
        setLibraries(prev => prev.map(lib => 
          lib.id === library.id ? reconnectedLibrary : lib
        ));
        
        if (selectedLibrary?.id === library.id) {
          setSelectedLibrary(reconnectedLibrary);
        }
        
        // Show success message
        alert(`Bibliothèque "${library.name}" reconnectée avec succès !`);
      }
    } catch (error) {
      console.error("Erreur lors de la reconnexion:", error);
      if ((error as DOMException).name !== 'AbortError') {
        alert(`Erreur lors de la reconnexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLibrary = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette bibliothèque ?")) {
      try {
        await dbDeleteLibrary(id);
        setLibraries(libs => libs.filter(lib => lib.id !== id));
        
        if (selectedLibrary?.id === id) {
          setSelectedLibrary(null);
          setCurrentView(AppView.LibraryList);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Impossible de supprimer la bibliothèque.");
      }
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la base de données ? Cette action supprimera toutes les bibliothèques et nécessitera une reconnexion des dossiers. Cette action est irréversible.")) {
      try {
        setIsLoading(true);
        setLoadingMessage('Réinitialisation de la base de données...');
        
        // Import the reset function dynamically to avoid circular imports
        const { resetDatabase } = await import('./services/db');
        await resetDatabase();
        
        // Clear local state
        setLibraries([]);
        setSelectedLibrary(null);
        setCurrentView(AppView.LibraryList);
        
        // Show success message
        alert('Base de données réinitialisée avec succès. Vous pouvez maintenant recréer vos bibliothèques.');
      } catch (error) {
        console.error("Erreur lors de la réinitialisation:", error);
        alert(`Erreur lors de la réinitialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenFile = async (file: LibraryFile) => {
    try {
      const fileObject = await file.handle.getFile();
      const url = URL.createObjectURL(fileObject);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erreur d'ouverture du fichier :", error);
      alert("Impossible d'ouvrir le fichier PDF. Le fichier a peut-être été déplacé ou supprimé.");
    }
  };
  
  const handleWelcomeContinue = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setCurrentView(AppView.LibraryList);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Spinner message={loadingMessage} />
        </div>
      );
    }
    
    switch (currentView) {
      case AppView.Welcome:
        return <WelcomeScreen onContinue={handleWelcomeContinue} />;
      
              case AppView.LibraryList:
          return (
            <LibraryListScreen
              libraries={libraries}
              onAddLibrary={handleAddLibrary}
              onSelectLibrary={(lib) => { setSelectedLibrary(lib); setCurrentView(AppView.LibraryView); }}
              onDeleteLibrary={handleDeleteLibrary}
              onReconnectLibrary={handleReconnectLibrary}
              onResetDatabase={handleResetDatabase}
              isLoading={isLoading}
            />
          );
      
      case AppView.LibraryView:
        if (!selectedLibrary) {
          setCurrentView(AppView.LibraryList);
          return null;
        }
        return <LibraryViewScreen 
          library={selectedLibrary}
          onBack={() => setCurrentView(AppView.LibraryList)}
          onOpenFile={handleOpenFile}
          onOpenAiModal={(file) => {
              setFileForAi(file);
              setIsAiModalOpen(true);
          }}
        />;
        
      default:
        return <WelcomeScreen onContinue={handleWelcomeContinue} />;
    }
  };

  return (
    <>
      {renderContent()}
      <GeminiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        fileName={fileForAi?.name || ''}
      />
    </>
  );
};

export default App;
