import '../styles/globals.css'
import { ThemeProvider } from '../utils/ThemeContext'
import { ToastProvider } from '../contexts/ToastContext'
import { DarkModeProvider } from '../contexts/DarkModeContext'

export default function App({ Component, pageProps }) {
  return (
    <DarkModeProvider>
      <ThemeProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </DarkModeProvider>
  )
}
