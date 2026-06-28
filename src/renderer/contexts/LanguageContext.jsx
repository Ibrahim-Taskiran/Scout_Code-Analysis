import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: localStorage.getItem('scout_lang') || 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(i18n.language);

  useEffect(() => {
    const handleLangChange = (lng) => {
      setLanguageState(lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, []);

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('scout_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  const { t, i18n: currentI18n } = useTranslation();
  return {
    ...context,
    t,
    language: currentI18n.language || context?.language || 'tr',
  };
};
