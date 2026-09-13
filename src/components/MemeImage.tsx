import React, { useState, useEffect } from 'react';
import { getImageCandidateUrls, ACTUAL_MEME_ASSETS } from '../lib/imageResolver';

interface MemeImageProps {
  basename: string;
  category?: string;
  altText?: string;
  className?: string;
}

export const MemeImage: React.FC<MemeImageProps> = ({
  basename,
  category,
  altText = 'Malayalam Movie Reaction Meme',
  className = '',
}) => {
  const [candidateUrls, setCandidateUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urls = getImageCandidateUrls(basename);
    setCandidateUrls(urls);
    setCurrentIndex(0);
    setIsFailed(false);
    setIsLoading(true);
  }, [basename]);

  const handleError = () => {
    if (currentIndex + 1 < candidateUrls.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFailed(true);
      setIsLoading(false);

      if (import.meta.env.DEV) {
        console.warn(
          `MEME IMAGE NOT FOUND:\n` +
          `category=${category || 'UNKNOWN'}\n` +
          `requested=${basename}\n` +
          `triedUrls=${JSON.stringify(candidateUrls)}\n` +
          `available=${JSON.stringify(ACTUAL_MEME_ASSETS)}`
        );
      }
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setIsFailed(false);
  };

  const currentUrl = candidateUrls[currentIndex] || '';

  return (
    <div className={`relative w-full overflow-hidden border-4 border-amber-900/60 dark:border-amber-500/60 rounded-xl bg-amber-950/20 dark:bg-stone-900 shadow-2xl ${className}`}>
      {!isFailed ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-stone-900/80 flex items-center justify-center font-pixel text-xs text-amber-400 z-10 animate-pulse">
              LOADING MEME...
            </div>
          )}
          <img
            key={currentUrl}
            src={currentUrl}
            alt={altText}
            onError={handleError}
            onLoad={handleLoad}
            className="w-full h-auto max-h-72 md:max-h-80 object-contain mx-auto block rounded-lg transition-opacity duration-200"
          />
        </>
      ) : (
        /* Fallback Pixel Meme Placeholder Card if candidate images are missing */
        <div className="w-full h-56 md:h-64 bg-amber-100/90 dark:bg-amber-950/60 border-4 border-amber-800 dark:border-amber-600 rounded-lg p-4 flex flex-col items-center justify-center text-center font-pixel space-y-3">
          <div className="text-4xl animate-bounce">🎬</div>
          <div className="text-sm text-amber-900 dark:text-amber-300 uppercase">
            MALAYALAM MOVIE MEME
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-200 font-vt323 text-lg">
            "{basename}"
          </div>
        </div>
      )}
    </div>
  );
};

