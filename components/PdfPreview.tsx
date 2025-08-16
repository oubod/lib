import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker with a proper source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PdfPreviewProps {
  file: File;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ file, className = '', onLoad, onError }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const generatePreview = async () => {
      try {
        if (!file) return;
        
        // Wait for canvas to be available
        let canvas = canvasRef.current;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!canvas && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          canvas = canvasRef.current;
          attempts++;
        }
        
        if (!canvas) {
          throw new Error('Canvas not available after waiting');
        }
        
        setIsLoading(true);
        setError(null);
        console.log('Generating preview for:', file.name);
        
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        console.log('File converted to array buffer, size:', arrayBuffer.byteLength);
        
        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0
        }).promise;
        
        console.log('PDF loaded, pages:', pdf.numPages);
        
        if (pdf.numPages === 0) {
          throw new Error('PDF has no pages');
        }
        
        // Get first page
        const page = await pdf.getPage(1);
        console.log('First page loaded');
        
        // Calculate viewport with a reasonable scale for preview
        const viewport = page.getViewport({ scale: 0.5 });
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas context not available');
        }
        
        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height);
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        };
        
        await page.render(renderContext).promise;
        console.log('Page rendered to canvas');
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Canvas converted to data URL');
        
        if (isMounted) {
          setPreviewUrl(dataUrl);
          setIsLoading(false);
          onLoad?.();
        }
        
      } catch (error) {
        console.error('Error generating PDF preview:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(errorMessage);
          setIsLoading(false);
          onError?.(error as Error);
        }
      }
    };

    // Add a small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      generatePreview();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [file, onLoad, onError]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-700 rounded-lg ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-xs text-gray-400">Chargement...</span>
        </div>
        {/* Hidden canvas for PDF rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-700 rounded-lg ${className}`}>
        <div className="text-center p-2">
          <div className="text-red-400 text-xs mb-1">Erreur</div>
          <div className="text-gray-400 text-xs max-w-full break-words">{error}</div>
        </div>
        {/* Hidden canvas for PDF rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  // Show preview
  if (previewUrl) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <img
          src={previewUrl}
          alt="PDF Preview"
          className="w-full h-full object-cover"
          onError={() => setError('Failed to load preview image')}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          PDF
        </div>
        {/* Hidden canvas for PDF rendering */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  // Fallback state
  return (
    <div className={`flex items-center justify-center bg-gray-700 rounded-lg ${className}`}>
      <div className="text-center p-2">
        <div className="text-gray-400 text-xs">Aucun aperçu</div>
      </div>
      {/* Hidden canvas for PDF rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default PdfPreview;
