
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EditorControls } from './components/EditorControls';
import { ImageViewer } from './components/ImageViewer';
import { ApiKeyManager } from './components/ApiKeyManager';
import { editImage } from './services/geminiService';
import { SparklesIcon } from './components/icons';

const DAILY_TOKEN_LIMIT = 1000000;
const TOKEN_STORAGE_KEY = 'mifoto_token_usage';

interface TokenUsage {
  count: number;
  date: string;
}

type LoadingAction = 'generate' | 'upscale' | null;

// Fix: Use a named interface 'AIStudio' for window.aistudio to resolve
// conflicting global declarations and add the optional modifier to match usage.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

// Komponens az API kulcs kiválasztásához
const ApiKeySetupScreen: React.FC<{ onKeySelect: () => void }> = ({ onKeySelect }) => (
    <div className="min-h-screen bg-base-100 text-text-primary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-base-200 p-8 rounded-lg shadow-lg text-center">
        <SparklesIcon className="w-12 h-12 mx-auto text-brand-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Google AI API Kulcs Szükséges</h1>
        <p className="text-text-secondary mb-6">
          Az alkalmazás futtatásához válassz ki egy API kulcsot. A képgenerálás költségekkel járhat.
        </p>
        <button
          onClick={onKeySelect}
          className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105"
        >
          API Kulcs Kiválasztása
        </button>
        <p className="text-xs text-text-secondary mt-4">
          További információ a díjszabásról: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">ai.google.dev/gemini-api/docs/billing</a>
        </p>
      </div>
    </div>
  );


const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsedToday, setTokensUsedToday] = useState<number>(0);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);


  useEffect(() => {
    // API kulcs ellenőrzése
     const checkApiKey = async () => {
        setIsCheckingApiKey(true);
        if (window.aistudio) {
            const keySelected = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(keySelected);
        } else {
            console.warn('AI Studio context not found. API key management may not work.');
            setHasApiKey(false);
        }
        setIsCheckingApiKey(false);
    };
    checkApiKey();

    // Token-használat betöltése a helyi tárolóból
    const storedUsage = localStorage.getItem(TOKEN_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (storedUsage) {
      try {
        const parsedUsage: TokenUsage = JSON.parse(storedUsage);
        if (parsedUsage.date === today) {
          setTokensUsedToday(parsedUsage.count);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // A versenyhelyzet elkerülése érdekében feltételezzük, hogy a felhasználó választott kulcsot.
        setHasApiKey(true);
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
    if (!originalFile || !promptToUse || !hasApiKey) return;

    setLoadingAction(action);
    setEditedImage(null);
    setError(null);

    try {
      const result = await editImage(originalFile, promptToUse);
      setEditedImage(result.imageUrl);
      
      const newTotalTokens = tokensUsedToday + result.tokensUsed;
      setTokensUsedToday(newTotalTokens);
      
      const today = new Date().toISOString().split('T')[0];
      const newUsage: TokenUsage = { count: newTotalTokens, date: today };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(newUsage));

    } catch (err) {
      console.error("Hiba a képfeldolgozás során:", err);
      let errorMessage = 'Ismeretlen hiba történt a kép generálása során.';
      if (err instanceof Error) {
        if (err.message.includes('Requested entity was not found')) {
            errorMessage = 'Az API kulcs érvénytelennek tűnik, vagy nincs engedélyed a használatára. Kérlek, válassz egy másikat.';
            setHasApiKey(false);
        } else if (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota')) {
            errorMessage = 'Elérted a felhasználási kvótát. Ez a hiba akkor fordul elő, ha a ingyenes keret kimerült. A folytatáshoz engedélyezd a számlázást a Google Cloud projektedben. A teljes hibaüzenet a böngésző konzoljában látható.';
        } else {
            errorMessage = `Hiba történt: ${err.message}`;
        }
      }
      setError(errorMessage);
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

  if (isCheckingApiKey) {
      return (
          <div className="min-h-screen bg-base-100 flex items-center justify-center">
              <p className="text-text-secondary">API kulcs ellenőrzése...</p>
          </div>
      );
  }

  if (!hasApiKey) {
    return <ApiKeySetupScreen onKeySelect={handleSelectKey} />;
  }

  return (
    <div className="min-h-screen bg-base-100 text-text-primary font-sans flex flex-col">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-8 flex-grow">
        <ApiKeyManager 
            tokensUsed={tokensUsedToday}
            tokenLimit={DAILY_TOKEN_LIMIT}
            onChangeKey={handleSelectKey}
        />
        {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Hiba! </strong>
                <span className="block sm:inline">{error}</span>
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
              isApiKeySet={hasApiKey}
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