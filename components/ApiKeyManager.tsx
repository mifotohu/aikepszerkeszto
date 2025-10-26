import React from 'react';

interface ApiKeyManagerProps {
  isApiKeySet: boolean;
  tokensUsed: number;
  tokenLimit: number;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isApiKeySet, tokensUsed, tokenLimit }) => {
  if (!isApiKeySet) {
    return (
      <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg" role="alert">
        <strong className="font-bold">API Kulcs Hiányzik! </strong>
        <span className="block sm:inline sm:ml-2">
          A generálás le van tiltva. Kérjük, állítsd be az <code>API_KEY</code> környezeti változót az alkalmazás futtatásához.
        </span>
      </div>
    );
  }

  const percentageUsed = tokenLimit > 0 ? (tokensUsed / tokenLimit) * 100 : 0;
  
  return (
    <div className="mb-6 bg-base-200 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2 text-sm">
            <span className="font-semibold text-text-primary">Napi Token Felhasználás</span>
            <span className="text-text-secondary">{tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}</span>
        </div>
        <div className="w-full bg-base-300 rounded-full h-2.5">
            <div 
                className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            ></div>
        </div>
    </div>
  );
};