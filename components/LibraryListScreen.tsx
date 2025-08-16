
import React from 'react';
import { Library } from '../types';
import { PlusIcon, FolderIcon, TrashIcon, ExclamationTriangleIcon, RefreshIcon } from './icons';

interface LibraryListScreenProps {
  libraries: Library[];
  onAddLibrary: () => void;
  onSelectLibrary: (library: Library) => void;
  onDeleteLibrary: (id: string) => void;
  onReconnectLibrary: (library: Library) => void;
  onResetDatabase?: () => void;
  isLoading: boolean;
}

const LibraryListScreen: React.FC<LibraryListScreenProps> = ({ 
  libraries, 
  onAddLibrary, 
  onSelectLibrary, 
  onDeleteLibrary, 
  onReconnectLibrary,
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
    if (library.metadata?.needsReconnection) {
      return { text: 'Reconnexion requise', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    }
    if (library.metadata?.hasErrors) {
      return { text: 'Erreur', color: 'text-red-400', bgColor: 'bg-red-900/20' };
    }
    return { text: 'Actif', color: 'text-green-400', bgColor: 'bg-green-900/20' };
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {libraries.map(lib => {
              const status = getLibraryStatus(lib);
              const needsAttention = lib.metadata?.needsReconnection || lib.metadata?.hasErrors;
              
              return (
                <div 
                  key={lib.id} 
                  onClick={(e) => handleCardClick(e, lib)} 
                  className={`group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 cursor-pointer hover:from-gray-700 hover:to-gray-800 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2 border ${
                    needsAttention ? 'border-yellow-500/50' : 'border-gray-700 hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        needsAttention 
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {needsAttention ? (
                          <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                        ) : (
                          <FolderIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white truncate">{lib.name}</h3>
                        <p className="text-gray-400 text-sm">{lib.files.length} document(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {needsAttention && (
                        <button
                          onClick={() => onReconnectLibrary(lib)}
                          className="action-button p-2 text-yellow-400 rounded-full hover:bg-yellow-900/50 transition-all duration-200 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                          aria-label="Reconnecter la bibliothèque"
                          title="Reconnecter la bibliothèque"
                        >
                          <RefreshIcon className="w-5 h-5"/>
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteLibrary(lib.id)}
                        className="action-button p-2 text-gray-500 rounded-full hover:bg-red-900/50 hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        aria-label="Supprimer la bibliothèque"
                      >
                        <TrashIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                  
                  {/* Status and Metadata */}
                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Statut</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    {lib.createdAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Créée le</span>
                        <span className="text-blue-400 font-medium">{formatDate(lib.createdAt)}</span>
                      </div>
                    )}
                    
                    {lib.lastAccessed && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Dernier accès</span>
                        <span className="text-blue-400 font-medium">{formatDate(lib.lastAccessed)}</span>
                      </div>
                    )}
                    
                    {needsAttention && (
                      <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-xs">
                          {lib.metadata?.needsReconnection 
                            ? "Cette bibliothèque nécessite une reconnexion au dossier source."
                            : lib.metadata?.errorMessage || "Une erreur s'est produite avec cette bibliothèque."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Add Library Button */}
            <button
              onClick={onAddLibrary}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-dashed border-gray-600 rounded-2xl text-gray-400 hover:from-gray-700 hover:to-gray-800 hover:border-blue-500 hover:text-blue-400 transition-all duration-300 transform hover:scale-105 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-4 group-hover:from-blue-500/40 group-hover:to-purple-600/40 transition-all duration-300">
                <PlusIcon className="w-8 h-8" />
              </div>
              <span className="font-semibold text-lg">Ajouter une bibliothèque</span>
              <span className="text-sm text-gray-500 mt-1">Nouveau dossier PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryListScreen;
