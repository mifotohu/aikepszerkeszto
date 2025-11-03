
import React, { useState, useEffect, FormEvent } from 'react';
import { Header } from './components/Header';
import { EditorControls } from './components/EditorControls';
import { ImageViewer } from './components/ImageViewer';
import { ApiKeyManager } from './components/ApiKeyManager';
import { editImage } from './services/geminiService';
import { SparklesIcon } from './components/icons';

const DAILY_TOKEN_LIMIT = 1000000;
const TOKEN_STORAGE_KEY = 'mifoto_token_usage';
const API_KEY_STORAGE_KEY = 'mifoto_api_key';

interface TokenUsage {
  count: number;
  date: string;
}

type LoadingAction = 'generate' | 'upscale' | null;

// Komponens az API kulcs beállításához
const ApiKeySetupScreen: React.FC<{ onKeySubmit: (key: string) => void }> = ({ onKeySubmit }) => {
  const [keyInput, setKeyInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      onKeySubmit(keyInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-text-primary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-base-200 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <SparklesIcon className="w-12 h-12 mx-auto text-brand-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Google AI API Kulcs Szükséges</h1>
          <p className="text-text-secondary">
            Az alkalmazás működéséhez add meg a saját Google AI Studio API kulcsodat.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Miért van erre szükség?</h2>
            <p className="text-sm text-text-secondary">
              Az API kulcs egy egyedi azonosító, amellyel az alkalmazás hozzáférhet a Google mesterséges intelligencia (Gemini) modelljéhez. Gondolj rá úgy, mint egy jelszóra, amely lehetővé teszi, hogy az applikáció a te nevedben, a te kvótád terhére hajtson végre képszerkesztési műveleteket.
            </p>
            <p className="text-sm text-text-secondary">
              A kulcsot <strong className="text-text-primary">nem tároljuk</strong> a szervereinken, csak a böngésződ memóriájában marad a munkamenet idejére.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Hogyan szerezz kulcsot?</h2>
            <ol className="list-decimal list-inside text-sm text-text-secondary space-y-2">
              <li>Látogass el a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary font-semibold hover:underline">Google AI Studio</a> oldalra.</li>
              <li>Kattints a <code className="bg-base-300 px-1 rounded text-xs">Create API key</code> gombra egy új projektben.</li>
              <li>Másold ki a generált kulcsot.</li>
              <li>Illeszd be az alábbi mezőbe.</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-text-primary mb-2">
            API Kulcs
          </label>
          <input
            id="api-key-input"
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="w-full bg-base-300 border border-base-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200"
            placeholder="Illeszd be az API kulcsod..."
            aria-label="Google AI API kulcs"
          />
          <button
            type="submit"
            disabled={!keyInput.trim()}
            className="mt-4 w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105 disabled:bg-base-300 disabled:cursor-not-allowed disabled:scale-100"
          >
            Mentés és Tovább
          </button>
        </form>

      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tokensUsedToday, setTokensUsedToday] = useState<number>(0);

  useEffect(() => {
    // API kulcs betöltése a session storage-ból
    const savedKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
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
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  const handleKeySubmit = (newKey: string) => {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    setApiKey(newKey);
  };

  const handleChangeKey = () => {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
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
    if (!originalFile || !promptToUse || !apiKey) return;

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
        // Specifikus hibakezelés érvénytelen API kulcs esetére
        if (err.message.includes('Requested entity was not found')) {
            setError('Az API kulcs érvénytelennek tűnik. Kérlek, ellenőrizd, vagy adj meg egy újat.');
            handleChangeKey(); // Rossz kulcs törlése
        } else {
            setError(err.message);
        }
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

  // Ha nincs API kulcs, a beállító képernyőt mutatjuk
  if (!apiKey) {
    return <ApiKeySetupScreen onKeySubmit={handleKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-base-100 text-text-primary font-sans flex flex-col">
      <Header />
      <main className="container mx-auto px-4 md:px-8 py-8 flex-grow">
        <ApiKeyManager 
            tokensUsed={tokensUsedToday}
            tokenLimit={DAILY_TOKEN_LIMIT}
            onChangeKey={handleChangeKey}
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
              isApiKeySet={!!apiKey}
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
