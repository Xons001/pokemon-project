import './globals.css'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { LanguageProvider } from './components/i18n/LanguageProvider'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { detectLocale, LOCALE_STORAGE_KEY } from './lib/i18n'
import { THEME_STORAGE_KEY } from './lib/theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pok\u00e9mon Project',
  description: 'Proyecto del curso HTML y CSS adaptado a Next.js',
}

const appInitScript = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      var theme = storedTheme === 'dark' ? 'dark' : 'light';
      var storedLocale = window.localStorage.getItem('${LOCALE_STORAGE_KEY}');
      var locale = storedLocale === 'en' ? 'en' : '${detectLocale('es-ES')}';
      if (!storedLocale) {
        locale = (window.navigator.language || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
      }
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.locale = locale;
      document.documentElement.style.colorScheme = theme;
      document.documentElement.lang = locale;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.dataset.locale = 'es';
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.lang = 'es';
    }
  })();
`

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: appInitScript }} />
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
