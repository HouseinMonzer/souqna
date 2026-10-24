import { useTranslation } from 'react-i18next'

export type Direction = 'ltr' | 'rtl'

export function useDirection(): Direction {
  const { i18n } = useTranslation()
  return i18n.dir(i18n.language) === 'rtl' ? 'rtl' : 'ltr'
}
