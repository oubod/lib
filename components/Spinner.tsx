
import React from 'react';

const Spinner = ({ message }: { message: string }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 text-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Spinner content */}
      <div className="relative z-10">
        <div className="w-20 h-20 border-4 border-gray-700 border-dashed rounded-full animate-spin border-t-transparent mb-6 relative">
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-dashed rounded-full animate-spin border-t-transparent border-r-transparent border-b-transparent"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Chargement en cours...</h2>
          <p className="text-lg text-gray-300 max-w-md">{message}</p>
        </div>
        
        {/* Loading dots */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Spinner;
