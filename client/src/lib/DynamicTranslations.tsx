import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DynamicTranslationsContextType {
  updateTranslations: (translatedContent: any) => void;
  isUpdating: boolean;
}

const DynamicTranslationsContext = createContext<DynamicTranslationsContextType | undefined>(undefined);

interface DynamicTranslationsProviderProps {
  children: ReactNode;
}

export function DynamicTranslationsProvider({ children }: DynamicTranslationsProviderProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { i18n } = useTranslation();

  const updateTranslations = async (translatedContent: any) => {
    try {
      setIsUpdating(true);
      
      // Update the i18n resources with the new translations
      i18n.addResourceBundle('custom', 'translation', translatedContent, true, true);
      
      // Force a re-render by changing language and changing back
      await i18n.changeLanguage('custom');
      
      console.log('Dynamic translations updated successfully');
    } catch (error) {
      console.error('Failed to update dynamic translations:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DynamicTranslationsContext.Provider value={{ updateTranslations, isUpdating }}>
      {children}
    </DynamicTranslationsContext.Provider>
  );
}

export function useDynamicTranslations() {
  const context = useContext(DynamicTranslationsContext);
  if (context === undefined) {
    throw new Error('useDynamicTranslations must be used within a DynamicTranslationsProvider');
  }
  return context;
}
