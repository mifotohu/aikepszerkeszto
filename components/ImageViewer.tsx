import React, { useState } from 'react';
import { Loader } from './Loader';
import { PhotoIcon } from './icons';

interface ImageViewerProps {
  originalImage: string | null;
  editedImage: string | null;
  isLoading: boolean;
}

const ImagePanel: React.FC<{ title: string; src: string | null; children?: React.ReactNode; actions?: React.ReactNode }> = ({ title, src, children, actions }) => {
  return (
    <div className="flex flex-col">
      <div className="bg-base-200 rounded-lg shadow-lg overflow-hidden flex flex-col flex-grow">
        <h3 className="text-center font-semibold py-3 bg-base-300/50">{title}</h3>
        <div className="relative aspect-square flex-grow flex items-center justify-center p-2">
          {src ? (
            <img src={src} alt={title} className="max-w-full max-h-full object-contain" />
          ) : (
            children
          )}
        </div>
      </div>
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
};

export const ImageViewer: React.FC<ImageViewerProps> = ({ originalImage, editedImage, isLoading }) => {
  const [format, setFormat] = useState('png');

  const handleDownload = () => {
    if (!editedImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      const mimeType = `image/${format}`;
      const dataUrl = canvas.toDataURL(mimeType, 1.0);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `mifoto_szerkesztett.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = editedImage;
  };


  if (!originalImage) {
    return (
      <div className="h-full min-h-[50vh] flex items-center justify-center bg-base-200 rounded-lg shadow-lg">
        <div className="text-center text-text-secondary">
          <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-medium">Itt jelennek meg a képeid</p>
          <p>A szerkesztéshez tölts fel egy képet.</p>
        </div>
      </div>
    );
  }

  const saveControls = editedImage && !isLoading ? (
    <div className="flex items-center justify-center gap-4">
      <label htmlFor="format-select" className="sr-only">Fájlformátum</label>
      <select
        id="format-select"
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="bg-base-300 border border-base-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
        aria-label="Válassz exportálási formátumot"
      >
        <option value="png">PNG</option>
        <option value="jpeg">JPG</option>
        <option value="webp">WEBP</option>
      </select>
      <button
        onClick={handleDownload}
        className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105"
      >
        Mentés
      </button>
    </div>
  ) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ImagePanel title="Eredeti" src={originalImage} />
      <ImagePanel title="Szerkesztett" src={editedImage} actions={saveControls}>
        {isLoading ? (
          <Loader />
        ) : (
          !editedImage && (
            <div className="text-center text-text-secondary">
              <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg font-medium">A szerkesztett képed itt jelenik meg</p>
            </div>
          )
        )}
      </ImagePanel>
    </div>
  );
};