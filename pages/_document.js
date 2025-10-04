// Custom Document - zapobiega miganiu dark mode przy ładowaniu strony
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        {/* Prevent dark mode flash - wykonuje się PRZED React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const darkMode = localStorage.getItem('darkMode') === 'true' ||
                    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  if (darkMode) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.error('Dark mode init error:', e);
                }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
