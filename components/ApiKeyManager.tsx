
import React from 'react';

interface ApiKeyManagerProps {
  tokensUsed: number;
  tokenLimit: number;
  onChangeKey: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ tokensUsed, tokenLimit, onChangeKey }) => {
  const percentageUsed = tokenLimit > 0 ? (tokensUsed / tokenLimit) * 100 : 0;
  
  return (
    <div className="mb-6 bg-base-200 p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto sm:flex-grow">
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
        <button
            onClick={onChangeKey}
            className="w-full sm:w-auto flex-shrink-0 bg-base-300 text-text-primary font-bold py-2 px-4 rounded-lg hover:bg-base-100 transition-colors duration-200"
        >
            API Kulcs Cseréje
        </button>
    </div>
  );
};
