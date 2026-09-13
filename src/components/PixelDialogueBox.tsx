import React, { useState, useEffect } from 'react';

interface PixelDialogueBoxProps {
  speaker?: string;
  text: string;
  className?: string;
  speed?: number; // ms per character
}

export const PixelDialogueBox: React.FC<PixelDialogueBoxProps> = ({
  speaker = 'INSPECTOR SUBHASH',
  text,
  className = '',
  speed = 30,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className={`pixel-box p-3 font-vt323 text-lg md:text-xl text-emerald-300 relative ${className}`}>
      {/* Speaker Name Badge */}
      <div className="absolute -top-3.5 left-4 bg-emerald-500 text-black font-pixel text-[9px] px-2 py-0.5 border-2 border-black font-bold uppercase tracking-wider">
        {speaker}
      </div>

      {/* Speech Text Content */}
      <div className="pt-1 leading-snug min-h-[2.5rem]">
        {displayedText}
        {isTyping && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />}
      </div>

      {/* Retro RPG blinking arrow prompt */}
      {!isTyping && (
        <div className="absolute bottom-1.5 right-2 text-emerald-400 text-xs font-pixel animate-bounce">
          ▼
        </div>
      )}
    </div>
  );
};
