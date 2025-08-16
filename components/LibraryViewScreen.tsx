
import React, { useState, useMemo } from 'react';
import { Library, LibraryFile } from '../types';
import { ArrowLeftIcon, MagnifyingGlassIcon, DocumentIcon, ViewListIcon, ViewColumnsIcon, Squares2X2Icon } from './icons';
import PdfCard from './PdfCard';

interface LibraryViewScreenProps {
  library: Library;
  onBack: () => void;
  onOpenFile: (file: LibraryFile) => void;
  onOpenAiModal: (file: LibraryFile) => void;
}

type LayoutType = 'list' | '2cols' | '3cols';

const LibraryViewScreen: React.FC<LibraryViewScreenProps> = ({ library, onBack, onOpenFile, onOpenAiModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutType, setLayoutType] = useState<LayoutType>('3cols');

  const filteredFiles = useMemo(() => {
    if (!searchTerm) {
      return library.files;
    }
    return library.files.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, library.files]);

  const getGridClasses = () => {
    switch (layoutType) {
      case 'list':
        return 'grid-cols-1 gap-4';
      case '2cols':
        return 'grid-cols-1 sm:grid-cols-2 gap-6';
      case '3cols':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';
    }
  };

  const getCardClasses = () => {
    switch (layoutType) {
      case 'list':
        return 'flex-row items-center p-4 h-20';
      case '2cols':
        return 'p-4 h-auto';
      case '3cols':
        return 'p-4 h-auto';
      default:
        return 'p-4 h-auto';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 md:p-8">
      {/* Enhanced Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-3 mr-4 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white truncate mb-2">
                {library.name}
              </h1>
              <div className="flex items-center space-x-4 text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  {library.files.length} document(s)
                </span>
                <span className="text-sm">
                  Bibliothèque PDF
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Search and Layout Controls */}
      <div className="mb-8 space-y-4">
        {/* Enhanced Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200"
          />
        </div>

        {/* Layout Toggle Buttons */}
        <div className="flex justify-center">
          <div className="bg-gray-800 rounded-xl p-1 border border-gray-700">
            <div className="flex space-x-1">
              <button
                onClick={() => setLayoutType('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  layoutType === 'list'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <ViewListIcon className="w-4 h-4" />
                <span>Liste</span>
              </button>
              
              <button
                onClick={() => setLayoutType('2cols')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  layoutType === '2cols'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <ViewColumnsIcon className="w-4 h-4" />
                <span>2 Colonnes</span>
              </button>
              
              <button
                onClick={() => setLayoutType('3cols')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  layoutType === '3cols'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                <span>Grille</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {filteredFiles.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-300">
              {searchTerm ? `Résultats pour "${searchTerm}"` : 'Tous les documents'}
            </h2>
            <p className="text-gray-500 mt-1">
              {filteredFiles.length} document(s) trouvé(s) • Vue {layoutType === 'list' ? 'Liste' : layoutType === '2cols' ? '2 Colonnes' : 'Grille'}
            </p>
          </div>
          
          <div className={`grid ${getGridClasses()}`}>
            {filteredFiles.map(file => (
              <PdfCard 
                key={file.name} 
                file={file}
                onOpen={() => onOpenFile(file)}
                onAiAction={() => onOpenAiModal(file)}
                layoutType={layoutType}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <DocumentIcon className="w-12 h-12 text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {searchTerm ? 'Aucun document trouvé' : 'Aucun document'}
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchTerm 
              ? `Aucun document ne correspond à "${searchTerm}". Essayez un autre terme de recherche.`
              : 'Cette bibliothèque ne contient aucun document PDF pour le moment.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default LibraryViewScreen;
