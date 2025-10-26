import React from 'react';
import { SparklesIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
        <SparklesIcon className="w-8 h-8 text-brand-secondary" />
        <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
                MIfoto.hu AI képszerkesztő
            </h1>
            <p className="text-sm text-text-secondary">Ingyenes AI alapú képszerkesztő</p>
        </div>
      </div>
    </header>
  );
};