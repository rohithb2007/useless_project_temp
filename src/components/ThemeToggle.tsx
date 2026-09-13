import React, { useState, useEffect } from 'react';

export type ThemeName = 'day' | 'night';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem('kalla_chiri_theme');
      if (saved === 'night' || saved === 'dark') return 'night';
      return 'day';
    } catch {
      return 'day';
    }
  });

  const applyTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    document.documentElement.dataset.theme = newTheme;
    if (newTheme === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('kalla_chiri_theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme state to localStorage:', e);
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeName = theme === 'day' ? 'night' : 'day';
    applyTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`pixel-btn pixel-btn-secondary text-[9px] px-2.5 py-1.5 flex items-center font-pixel ${className}`}
      title="Toggle Theme (☀️ DAY / 🌙 NIGHT)"
    >
      {theme === 'day' ? '☀️ DAY' : '🌙 NIGHT'}
    </button>
  );
};
