
import React from 'react';
import { Library } from '../types';
import { PlusIcon, FolderIcon, TrashIcon, ExclamationTriangleIcon, RefreshIcon, CheckCircleIcon } from './icons';

interface LibraryListScreenProps {
  libraries: Library[];
  onAddLibrary: () => void;
  onSelectLibrary: (library: Library) => void;
  onDeleteLibrary: (id: string) => void;
  onResetDatabase?: () => void;
  isLoading: boolean;
}

const LibraryListScreen: React.FC<LibraryListScreenProps> = ({ 
  libraries, 
  onAddLibrary, 
  onSelectLibrary, 
  onDeleteLibrary, 
  onResetDatabase,
  isLoading 
}) => {
  
  const handleCardClick = (e: React.MouseEvent, library: Library) => {
    // Prevent card click when clicking action buttons
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    onSelectLibrary(library);
  };

  const getLibraryStatus = (library: Library) => {
    if (library.metadata?.autoReconnected) {
      return { text: 'Reconnecté automatiquement', color: 'text-green-400', bgColor: 'bg-green-900/20' };
    }
    if (library.metadata?.needsReconnection) {
      return { text: 'Reconnexion automatique...', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    }
    if (library.metadata?.hasErrors) {
      return { text: 'Erreur', color: 'text-red-400', bgColor: 'bg-red-900/20' };
    }
    return { text: 'Actif', color: 'text-green-400', bgColor: 'bg-green-900/20' };
  };

  const getPersistenceStatus = (library: Library) => {
    if (library.metadata?.persistence) {
      const persistence = library.metadata.persistence;
      if (persistence.localStorageBackup && persistence.indexedDBBackup) {
        return { 
          text: 'Sauvegardé localement', 
          color: 'text-green-400', 
          icon: <CheckCircleIcon className="w-4 h-4" />,
          bgColor: 'bg-green-900/20' 
        };
      } else if (persistence.localStorageBackup) {
        return { 
          text: 'Sauvegardé (localStorage)', 
          color: 'text-blue-400', 
          icon: <CheckCircleIcon className="w-4 h-4" />,
          bgColor: 'bg-blue-900/20' 
        };
      }
    }
    return { 
      text: 'Sauvegarde en cours...', 
      color: 'text-gray-400', 
      icon: null,
      bgColor: 'bg-gray-900/20' 
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 md:p-8">
      {/* Enhanced Header */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Mes Bibliothèques
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
          Accédez à vos collections de documents PDF et gérez vos bibliothèques médicales
        </p>
        
        {/* Persistence Status */}
        <div className="flex justify-center items-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-lg">
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Données sauvegardées localement
          </div>
        </div>
        
        {/* Database Reset Button */}
        {onResetDatabase && (
          <div className="flex justify-center">
            <button
              onClick={onResetDatabase}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Réinitialiser la base de données en cas de problème"
            >
              <RefreshIcon className="w-4 h-4 mr-2" />
              Réinitialiser la base de données
            </button>
          </div>
        )}
      </header>
      
      {libraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-8">
            <FolderIcon className="w-16 h-16 text-gray-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Aucune bibliothèque trouvée</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-md">
            Commencez par ajouter un dossier contenant vos fichiers PDF pour créer votre première bibliothèque.
          </p>
          <button
            onClick={onAddLibrary}
            disabled={isLoading}
            className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <PlusIcon className="w-6 h-6 mr-3" />
            Créer ma première bibliothèque
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Libraries Grid */}
          {libraries.map((library) => {
            const status = getLibraryStatus(library);
            const persistenceStatus = getPersistenceStatus(library);
            
            return (
              <div
                key={library.id}
                onClick={(e) => handleCardClick(e, library)}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{library.name}</h3>
                      <p className="text-gray-400">{library.files.length} document(s)</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {library.metadata?.needsReconnection && (
                      <div className="px-3 py-1.5 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg">
                        Reconnexion automatique en cours...
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLibrary(library.id);
                      }}
                      className="action-button px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-gray-500 text-sm">Statut</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                      {status.text}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 text-sm">Persistance</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${persistenceStatus.bgColor} ${persistenceStatus.color}`}>
                      {persistenceStatus.icon}
                      <span className="ml-1">{persistenceStatus.text}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 text-sm">Créée le</span>
                    <p className="text-blue-400 text-sm">{formatDate(library.createdAt)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 text-sm">Dernier accès</span>
                    <p className="text-blue-400 text-sm">{formatDate(library.lastAccessed)}</p>
                  </div>
                </div>
                
                {library.metadata?.needsReconnection && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      Reconnexion automatique en cours... L'application tente de restaurer l'accès au dossier.
                    </p>
                  </div>
                )}
                {library.metadata?.autoReconnected && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-sm">
                      ✅ Reconnecté automatiquement avec succès !
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Add Library Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={onAddLibrary}
              disabled={isLoading}
              className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <PlusIcon className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryListScreen;
