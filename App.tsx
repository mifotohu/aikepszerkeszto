import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EditorControls } from './components/EditorControls';
import { ImageViewer } from './components/ImageViewer';
import { ApiKeyManager } from './components/ApiKeyManager';
import { editImage } from './services/geminiService';

const DAILY_TOKEN_LIMIT = 1000000; // Ingyenes napi keret (példa)
const TOKEN_STORAGE_KEY = 'mifoto_token_usage';
const API_KEY_STORAGE_KEY = 'mifoto_api_key';


interface TokenUsage {
  count: number;
  date: string;
}

type LoadingAction = 'generate' | 'upscale' | null;

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [tokensUsedToday, setTokensUsedToday] = useState<number>(0);

  const isApiKeySet = !!apiKey;

  useEffect(() => {
    // API kulcs betöltése a helyi tárolóból
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    // Token-használat betöltése a helyi tárolóból
    const storedUsage = localStorage.getItem(TOKEN_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (storedUsage) {
      try {
        const parsedUsage: TokenUsage = JSON.parse(storedUsage);
        if (parsedUsage.date === today) {
          setTokensUsedToday(parsedUsage.count);
        } else {
          // Új nap, számláló nullázása
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        // Sérült adat, törlés
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);
  
  const handleSaveApiKey = (newKey: string) => {
    const trimmedKey = newKey.trim();
    setApiKey(trimmedKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    if (trimmedKey) {
        setError(null); // Clear previous errors when a new key is set
    }
  };


  const handleFileChange = (file: File | null) => {
    setOriginalFile(file);
    setEditedImage(null); // Előző szerkesztett kép törlése
    setError(null); // Előző hiba törlése
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setOriginalImage(null);
    }
  };
  
  const performImageEdit = async (promptToUse: string, action: NonNullable<LoadingAction>) => {
    if (!originalFile || !promptToUse) return;
    
    if (!isApiKeySet) {
        setError("A kép generálásához add meg a Google AI API kulcsodat az 'API Kulcs Beállítva' szekció 'Módosítás' gombjára kattintva.");
        return;
    }

    setLoadingAction(action);
    setEditedImage(null);
    setError(null);

    try {
      const result = await editImage(originalFile, promptToUse, apiKey);
      setEditedImage(result.imageUrl);
      
      const newTotalTokens = tokensUsedToday + result.tokensUsed;
      setTokensUsedToday(newTotalTokens);
      
      const today = new Date().toISOString().split('T')[0];
      const newUsage: TokenUsage = { count: newTotalTokens, date: today };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newUsage));

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ismeretlen hiba történt a kép generálása során.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerate = () => {
    performImageEdit(prompt, 'generate');
  };

  const handleUpscale = () => {
    const upscalePrompt = "Növeld a kép felbontását, javítsd a részleteket és a képminőséget a stílus megváltoztatása nélkül.";
    performImageEdit(upscalePrompt, 'upscale');
  }

  return (
    <div className="min-h-screen bg-base-100 text-text-primary font-sans flex flex-col">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-8 flex-grow">
        <ApiKeyManager 
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            tokensUsed={tokensUsedToday}
            tokenLimit={DAILY_TOKEN_LIMIT}
        />
        {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold block mb-2">Hiba!</strong>
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: error }} />
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <EditorControls
              onFileChange={handleFileChange}
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerate}
              onUpscale={handleUpscale}
              loadingAction={loadingAction}
              isFileSelected={!!originalFile}
              isApiKeySet={isApiKeySet}
            />
          </div>
          <div className="lg:col-span-2">
            <ImageViewer
              originalImage={originalImage}
              editedImage={editedImage}
              isLoading={loadingAction !== null}
            />
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 md:px-8 py-8 text-center text-text-secondary text-sm">
        <hr className="border-base-300 my-6" />
        <p className="font-bold">MIfoto.hu - a [MI] közösségünk!</p>
        <a href="https://www.mifoto.hu" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-secondary transition-colors">
          www.mifoto.hu
        </a>
        <p className="mt-4">Az applikáció használata ingyenes, de Google API kulcs megadása, regisztrálása szükséges.</p>
        <p>Ingyenes kvótában naponta maximum 1M tokent tudsz felhasználni , és 60 kérés/perc a limit.</p>
      </footer>
    </div>
  );
};

export default App;
