import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { DICTIONARY } from '../i18n/translations';

type Language = 'en' | 'ml';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (text: string) => Promise<string>;
  t: (path: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('preferred_language') as Language) || 'en';
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('preferred_language', language);
  }, [language]);

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = DICTIONARY[language];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      current = current[key];
    }
    return current;
  };

  const translate = async (text: string): Promise<string> => {
    if (language === 'en') return text;
    
    try {
      setIsLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${API_BASE}/api/translate`, { 
        text,
        target_language: 'ml-IN'
      });
      return response.data.translated_text || text;
    } catch (error) {
      console.error("Translation Error:", error);
      return text;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
