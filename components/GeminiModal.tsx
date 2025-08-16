import React, { useState } from 'react';
import { getAiInsight } from '../services/geminiService';
import { CloseIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
}

const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, fileName }) => {
  const [inputText, setInputText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Veuillez coller du texte à analyser.');
      return;
    }
    setError('');
    setIsLoading(true);
    setAiResponse('');
    try {
      const response = await getAiInsight(inputText, fileName);
      setAiResponse(response);
    } catch (err) {
      setError('Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setAiResponse('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-xl font-bold text-white">Analyse IA pour <span className="text-purple-300">{fileName}</span></h2>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto space-y-4">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-300 mb-2">
              Collez un extrait de votre PDF ici :
            </label>
            <textarea
              id="text-input"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: 'Quels sont les effets secondaires de l'amoxicilline ? ...'"
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-wait transition-colors"
            >
              {isLoading ? 'Analyse en cours...' : 'Obtenir l\'analyse'}
            </button>
          </div>

          {(isLoading || aiResponse) && (
            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Réponse de l'IA :</h3>
              {isLoading ? (
                <Spinner message="L'IA réfléchit..." />
              ) : (
                <div className="prose prose-invert text-gray-300 whitespace-pre-wrap max-w-none">{aiResponse}</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GeminiModal;
