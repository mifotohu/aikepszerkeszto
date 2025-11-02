import React, { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  tokensUsed: number;
  tokenLimit: number;
}

const ApiKeyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSave: (key: string) => void;
}> = ({ isOpen, onClose, currentKey, onSave }) => {
  const [keyInput, setKeyInput] = useState(currentKey);

  useEffect(() => {
    setKeyInput(currentKey);
  }, [currentKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keyInput);
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
        aria-modal="true" 
        role="dialog"
    >
      <div className="bg-base-200 rounded-lg shadow-2xl p-6 w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Google AI API Kulcs Beállítása</h2>
        <p className="text-sm text-text-secondary mb-4">
          A képgeneráláshoz szükséged van egy saját Google AI API kulcsra. A kulcsot ingyenesen beszerezheted a Google AI Studio-ból.
        </p>
        <div className="mb-4">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-text-secondary mb-1">
            API Kulcs
          </label>
          <input
            id="api-key-input"
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Illeszd be az API kulcsod"
            className="w-full p-2 bg-base-300 border border-base-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-brand-primary hover:text-brand-secondary transition-colors block mb-6 text-center"
        >
          API Kulcs beszerzése →
        </a>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base-300 text-text-primary rounded-lg hover:bg-base-100 transition-colors"
          >
            Mégse
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors"
          >
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
};


export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKey, onSaveApiKey, tokensUsed, tokenLimit }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isApiKeySet = !!apiKey;
  const percentageUsed = tokenLimit > 0 ? (tokensUsed / tokenLimit) * 100 : 0;

  return (
    <>
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentKey={apiKey}
        onSave={onSaveApiKey}
      />
      <div className="mb-6 bg-base-200 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">API Kulcs Beállítva</span>
                {isApiKeySet ? (
                    <span className="text-green-400 font-bold text-sm bg-green-500/10 px-2 py-0.5 rounded-full">✓ Aktív</span>
                ) : (
                    <span className="text-yellow-400 font-bold text-sm bg-yellow-500/10 px-2 py-0.5 rounded-full">✗ Hiányzik</span>
                )}
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors"
            >
                Módosítás
            </button>
        </div>
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2 text-sm">
                <span className="font-semibold text-text-primary">Napi Token Felhasználás</span>
                <span className="text-text-secondary">{tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}</span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-2.5">
                <div 
                    className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    aria-valuenow={percentageUsed}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                    aria-label="Napi token felhasználás"
                ></div>
            </div>
        </div>
      </div>
    </>
  );
};
