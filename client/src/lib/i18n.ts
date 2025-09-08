import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '../translations/en.json';
import es from '../translations/es.json';
import pt from '../translations/pt.json';
import zh from '../translations/zh.json';
import de from '../translations/de.json';
import fr from '../translations/fr.json';
import ja from '../translations/ja.json';
import custom from '../translations/custom.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  zh: { translation: zh },
  de: { translation: de },
  fr: { translation: fr },
  ja: { translation: ja },
  custom: { translation: custom },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'custom', // default language using custom.json
    fallbackLng: 'custom',
    
    interpolation: {
      escapeValue: false, // react already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Language code mapping - maps detected language names to i18n codes
const languageMap: { [key: string]: string } = {
  // English variations
  'english': 'custom',
  'en': 'custom',
  
  // For now, all languages use 'custom' since we're dynamically updating the custom.json
  // This ensures all detected languages use the same translation resource that gets updated
  'spanish': 'custom',
  'español': 'custom',
  'es': 'custom',
  
  'portuguese': 'custom',
  'português': 'custom',
  'pt': 'custom',
  
  'chinese': 'custom',
  '中文': 'custom',
  'mandarin': 'custom',
  'cantonese': 'custom',
  'zh': 'custom',
  
  'german': 'custom',
  'deutsch': 'custom',
  'de': 'custom',
  
  'french': 'custom',
  'français': 'custom',
  'fr': 'custom',
  
  'japanese': 'custom',
  '日本語': 'custom',
  'ja': 'custom',
  
  'italian': 'custom',
  'italiano': 'custom',
  'it': 'custom',
  
  'russian': 'custom',
  'русский': 'custom',
  'ru': 'custom',
  
  'arabic': 'custom',
  'العربية': 'custom',
  'ar': 'custom',
  
  'korean': 'custom',
  '한국어': 'custom',
  'ko': 'custom',
  
  'hindi': 'custom',
  'हिन्दी': 'custom',
  'hi': 'custom',
};

// Function to change language
export const changeLanguage = (language: string): string => {
  // All languages now use 'custom' since we dynamically update custom.json with translations
  // Map language name to code if needed
  const languageCode = languageMap[language.toLowerCase()] || 'custom';
  
  // Change the i18n language
  i18n.changeLanguage(languageCode);
  
  // Store in localStorage
  localStorage.setItem('detectedLanguage', languageCode);
  
  return languageCode;
};

export default i18n;
