import './globals.css'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { ThemeProvider } from './components/theme/ThemeProvider'
import { THEME_STORAGE_KEY } from './lib/theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pokemon Project',
  description: 'Proyecto del curso HTML y CSS adaptado a Next.js',
}

const themeInitScript = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      var theme = storedTheme === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.style.colorScheme = 'light';
    }
  })();
`

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
