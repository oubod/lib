
import React, { useState, useEffect } from 'react';
import { LibraryFile } from '../types';
import { BookOpenIcon, SparklesIcon, DocumentIcon } from './icons';
import PdfPreview from './PdfPreview';

interface PdfCardProps {
  file: LibraryFile;
  onOpen: () => void;
  onAiAction: () => void;
  layoutType?: 'list' | '2cols' | '3cols';
}

const PdfCard: React.FC<PdfCardProps> = ({ file, onOpen, onAiAction, layoutType = '3cols' }) => {
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFile = async () => {
      try {
        const fileObj = await file.handle.getFile();
        setFileObject(fileObj);
      } catch (error) {
        console.error('Error loading file:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [file.handle]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateFileName = (name: string, maxLength: number = 30): string => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - 3);
    return `${truncated}...${extension ? '.' + extension : ''}`;
  };

  // List view layout
  if (layoutType === 'list') {
    return (
      <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1 flex items-center space-x-4">
        {/* Preview Section - Smaller for list view */}
        <div className="relative flex-shrink-0">
          {isLoading ? (
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : fileObject ? (
            <div className="w-16 h-16 overflow-hidden rounded-lg">
              <PdfPreview 
                file={fileObject} 
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
              <DocumentIcon className="w-8 h-8 text-gray-500" />
            </div>
          )}
          
          {/* File Type Badge */}
          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
            PDF
          </div>
        </div>

        {/* File Info - Expanded for list view */}
        <div className="flex-grow min-w-0">
          <h3 
            className="text-sm font-semibold text-white truncate mb-1" 
            title={file.name}
          >
            {truncateFileName(file.name, 50)}
          </h3>
          
          {fileObject && (
            <div className="text-xs text-gray-400">
              {formatFileSize(fileObject.size)}
            </div>
          )}
        </div>

        {/* Action Buttons - Horizontal for list view */}
        <div className="flex space-x-2 flex-shrink-0">
          <button
            onClick={onOpen}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <BookOpenIcon className="w-3 h-3 inline mr-1" />
            Ouvrir
          </button>
          
          <button
            onClick={onAiAction}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <SparklesIcon className="w-3 h-3 inline mr-1" />
            IA
          </button>
        </div>
      </div>
    );
  }

  // Grid view layouts (2cols and 3cols)
  return (
    <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 transform hover:-translate-y-1">
      {/* Preview Section */}
      <div className="relative mb-4">
        {isLoading ? (
          <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : fileObject ? (
          <div className="w-full h-32 overflow-hidden rounded-lg">
            <PdfPreview 
              file={fileObject} 
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
            <DocumentIcon className="w-12 h-12 text-gray-500" />
          </div>
        )}
        
        {/* File Type Badge */}
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
          PDF
        </div>
      </div>

      {/* File Info */}
      <div className="mb-4">
        <h3 
          className="text-sm font-semibold text-white text-center break-words leading-tight mb-2" 
          title={file.name}
        >
          {truncateFileName(file.name)}
        </h3>
        
        {fileObject && (
          <div className="text-xs text-gray-400 text-center">
            {formatFileSize(fileObject.size)}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onOpen}
          className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <BookOpenIcon className="w-4 h-4 inline mr-2" />
          Ouvrir
        </button>
        
        <button
          onClick={onAiAction}
          className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          <SparklesIcon className="w-4 h-4 inline mr-2" />
          Résumé IA
        </button>
      </div>
    </div>
  );
};

export default PdfCard;
