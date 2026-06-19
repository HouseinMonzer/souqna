import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '../locales/en.json'
import ar from '../locales/ar.json'

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const
export type Lang = (typeof SUPPORTED_LANGUAGES)[number]
export const RTL_LANGUAGES: Lang[] = ['ar']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'souqna-lang',
      caches: ['localStorage'],
    },
  })

// Sync <html dir> and <html lang> with the active language
function applyDirection(lng: string) {
  const dir = RTL_LANGUAGES.includes(lng as Lang) ? 'rtl' : 'ltr'
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir
    document.documentElement.lang = lng
  }
}

applyDirection(i18n.language)
i18n.on('languageChanged', applyDirection)

export function toggleLanguage() {
  const next: Lang = i18n.language?.startsWith('ar') ? 'en' : 'ar'
  i18n.changeLanguage(next)
}

export default i18n
