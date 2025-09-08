'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider as ReactI18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import { LanguageProvider } from '../lib/LanguageContext';

interface I18nextProviderProps {
  children: ReactNode;
}

export function I18nextProvider({ children }: I18nextProviderProps) {
  // Ensure i18n is initialized on client side
  useEffect(() => {
    // This ensures i18n is properly initialized in client components
  }, []);

  return (
    <ReactI18nextProvider i18n={i18n}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ReactI18nextProvider>
  );
} 