import React, { useRef } from 'react';
import { UploadIcon, ScaleIcon } from './icons';

interface EditorControlsProps {
  onFileChange: (file: File | null) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onUpscale: () => void;
  loadingAction: 'generate' | 'upscale' | null;
  isFileSelected: boolean;
  isApiKeySet: boolean;
}

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const EditorControls: React.FC<EditorControlsProps> = ({
  onFileChange,
  prompt,
  setPrompt,
  onGenerate,
  onUpscale,
  loadingAction,
  isFileSelected,
  isApiKeySet,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoading = loadingAction !== null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileChange(file || null);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    onFileChange(file || null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="bg-base-200 p-6 rounded-lg shadow-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2 text-text-primary">1. Tölts fel egy képet</h2>
        <label
          htmlFor="image-upload"
          className="cursor-pointer block w-full p-6 border-2 border-dashed border-base-300 rounded-lg text-center hover:border-brand-primary transition-colors duration-200"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <UploadIcon className="w-10 h-10 mx-auto text-text-secondary/50" />
          <p className="mt-2 text-sm text-text-secondary">
            Húzz ide egy képet vagy <span className="text-brand-primary font-semibold">kattints ide a tallózáshoz</span>
          </p>
          <input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </label>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2 text-text-primary">2. Írd le a módosítást</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="pl. adj hozzá egy retro szűrőt, fesd át vízfestmény stílusúra..."
          className="w-full h-32 p-3 bg-base-300 border border-base-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 disabled:opacity-50"
          disabled={!isFileSelected}
        />
      </div>

      <div className="space-y-4">
        <button
          onClick={onGenerate}
          disabled={!isFileSelected || !prompt || isLoading || !isApiKeySet}
          className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105 disabled:bg-base-300 disabled:text-text-secondary/50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
        >
          {loadingAction === 'generate' ? (
            <>
              <LoadingSpinner />
              Generálás...
            </>
          ) : (
            'Kép generálása'
          )}
        </button>

        <div className="relative flex items-center">
            <div className="flex-grow border-t border-base-300"></div>
            <span className="flex-shrink mx-4 text-xs text-text-secondary uppercase">Vagy</span>
            <div className="flex-grow border-t border-base-300"></div>
        </div>

        <button
            onClick={onUpscale}
            disabled={!isFileSelected || isLoading || !isApiKeySet}
            className="w-full bg-base-300 text-text-primary font-bold py-3 px-4 rounded-lg hover:bg-base-100 transition-all duration-300 transform hover:scale-105 disabled:bg-base-300 disabled:text-text-secondary/50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
        >
            {loadingAction === 'upscale' ? (
                <>
                    <LoadingSpinner />
                    Feldolgozás...
                </>
            ) : (
                <>
                    <ScaleIcon className="w-5 h-5 mr-2" />
                    Felbontás növelése (Upscale)
                </>
            )}
        </button>
      </div>
    </div>
  );
};
