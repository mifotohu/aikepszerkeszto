import React from 'react';
import { SparklesIcon } from './icons';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-text-secondary gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-base-300 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-brand-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-brand-secondary animate-pulse"/>
        </div>
      </div>
      <p className="text-lg font-semibold">Kép generálása...</p>
      <p className="text-sm max-w-xs">A mesterséges intelligencia dolgozik. Ez eltarthat egy kis ideig.</p>
    </div>
  );
};