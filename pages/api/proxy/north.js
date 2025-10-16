// pages/api/proxy/north.js
// Proxy dla North.pl - omija Content Security Policy

export default async function handler(req, res) {
  // ✅ Handle CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24h cache
    return res.status(200).end();
  }
  
  const { url } = req.query;
  
  console.log('🔗 Proxy request:', url);
  console.log('📋 Method:', req.method);
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  // Walidacja - tylko North.pl
  if (!url.startsWith('https://north.pl')) {
    console.error('❌ Blocked URL (not north.pl):', url);
    return res.status(403).json({ error: 'Only north.pl URLs allowed' });
  }

  try {
    console.log('📥 Fetching from North.pl...');
    
    // Przygotuj headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Origin': 'https://north.pl',
      'Referer': 'https://north.pl/'
    };
    
    // Przygotuj opcje fetch
    const fetchOptions = {
      method: req.method,
      headers,
      redirect: 'manual' // ⚠️ NIE podążaj za redirectami automatycznie!
    };
    
    // Jeśli POST, dodaj body
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      headers['Content-Type'] = 'application/json';
      console.log('📤 POST body:', req.body);
    }
    
    const response = await fetch(url, fetchOptions);
    
    // Sprawdź czy to redirect
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log('🔄 North.pl redirect detected:', response.status, '→', location);
      
      // Jeśli redirect do głównej strony, ignoruj i zwróć błąd
      if (location === '/' || location === 'https://north.pl/' || !location.includes(url.split('/').pop())) {
        console.log('❌ North.pl blocked iframe access (redirect to homepage)');
        return res.status(403).json({ 
          error: 'North.pl blocked iframe access',
          message: 'North.pl wykrył dostęp przez iframe i zablokował stronę'
        });
      }
    }

    if (!response.ok) {
      console.error('❌ North.pl error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `North.pl returned ${response.status}` 
      });
    }

    // Sprawdź typ contentu
    const contentType = response.headers.get('content-type');
    console.log('📦 Content-Type:', contentType);
    
    // Jeśli JSON, przekaż bez modyfikacji
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      console.log('✅ Sending JSON response:', json);
      
      // Ustaw CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
      res.setHeader('Cache-Control', 'no-cache');
      
      return res.json(json);
    }
    
    // Jeśli HTML, modyfikuj i przekaż
    const html = await response.text();
    console.log('✅ Fetched HTML, length:', html.length);
    
    // Modyfikuj HTML + dodaj skrypt do przechwycenia AJAX
    let modifiedHtml = html
      // Dodaj base URL
      .replace(
        '<head>',
        `<head>
        <base href="https://north.pl/">
        <script>
          // 🔧 Przechwytuj AJAX requesty i przekieruj przez proxy
          (function() {
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
              // Jeśli URL to North.pl, użyj proxy
              if (url.startsWith('https://north.pl') || url.startsWith('/wizard/')) {
                const fullUrl = url.startsWith('/') ? 'https://north.pl' + url : url;
                // WAŻNE: użyj window.location.origin zamiast relatywnego URL
                const proxyUrl = window.location.origin + '/api/proxy/north?url=' + encodeURIComponent(fullUrl);
                console.log('🔄 Proxying fetch:', fullUrl, '→', proxyUrl);
                return originalFetch(proxyUrl, options);
              }
              return originalFetch(url, options);
            };
            
            // Przechwytuj XMLHttpRequest
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
              if (url.startsWith('https://north.pl') || url.startsWith('/wizard/') || url.startsWith('/cdn-cgi/')) {
                const fullUrl = url.startsWith('/') ? 'https://north.pl' + url : url;
                // WAŻNE: użyj window.location.origin zamiast relatywnego URL
                const proxyUrl = window.location.origin + '/api/proxy/north?url=' + encodeURIComponent(fullUrl);
                console.log('🔄 Proxying XHR:', fullUrl, '→', proxyUrl);
                return originalOpen.call(this, method, proxyUrl, ...rest);
              }
              return originalOpen.call(this, method, url, ...rest);
            };
            
            console.log('✅ North.pl proxy interceptor loaded');
          })();
        </script>
        <style>
          /* Poprawki dla iframe */
          body { margin: 0; padding: 0; }
        </style>
        `
      )
      // Usuń CSP meta tags
      .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
      .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');

    // Ustaw odpowiednie headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    
    console.log('✅ Sending proxied HTML');
    res.send(modifiedHtml);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from North.pl',
      details: error.message 
    });
  }
}
