import { useState, useEffect, useRef } from 'react';
import { Palette, Check } from 'lucide-react';

export interface ThemeOption {
  id: string;
  name: string;
  badge: string;
  colorPreview: string;
  bgPreview: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'aston-martin',
    name: 'Aston Martin Racing',
    badge: 'Esmeralda',
    colorPreview: '#10b981',
    bgPreview: '#0f1117'
  },
  {
    id: 'porsche-gt',
    name: 'Porsche GT',
    badge: 'Lima Pastel',
    colorPreview: '#4ade80',
    bgPreview: '#121418'
  },
  {
    id: 'racing-neon',
    name: 'Racing Neón',
    badge: 'Alto Contraste',
    colorPreview: '#39ff14',
    bgPreview: '#0a0a0a'
  },
  {
    id: 'modo-claro',
    name: 'Modo Claro',
    badge: 'Luminoso',
    colorPreview: '#059669',
    bgPreview: '#f8f9fa'
  }
];

const STORAGE_KEY = 'autolead_theme';

export default function ThemeSelector() {
  const [activeTheme, setActiveTheme] = useState<string>('aston-martin');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'aston-martin';
    setActiveTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    setIsOpen(false);
  };

  const currentOption = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-high transition-all text-xs font-semibold text-on-surface cursor-pointer shadow-sm"
        title="Cambiar tema visual"
      >
        <Palette size={16} className="text-primary" />
        <span className="hidden sm:inline-block font-bold">{currentOption.badge}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-outline-variant text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Paleta de Colores
          </div>
          {THEMES.map(theme => {
            const isSelected = theme.id === activeTheme;
            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected ? 'bg-secondary-container text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: theme.colorPreview }}
                  />
                  <span>{theme.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
