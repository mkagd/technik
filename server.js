// server.js - Custom server z wyłączonymi logami 304
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// ✅ Wyłącz domyślne logi Next.js
const app = next({ dev, hostname, port, quiet: true })
const handle = app.getRequestHandler()

// ✅ Endpointy które często odpytują (auto-refresh)
const silentEndpoints = [
    '/api/rezerwacje',
    '/api/orders',
    '/api/notifications',
    '/api/part-requests'
]

// ✅ Hook na zakończenie response - loguj tylko błędy i ważne akcje
function shouldLog(url, statusCode) {
    // ❌ CAŁKOWICIE WYŁĄCZ logi 304 (Not Modified)
    if (statusCode === 304) {
        return false
    }
    
    // ❌ NIE loguj assets (_next, static files)
    if (url.startsWith('/_next/') || url.startsWith('/static/')) {
        return false
    }
    
    // ✅ ZAWSZE loguj błędy (400+)
    if (statusCode >= 400) {
        return true
    }
    
    // ❌ NIE loguj GET requestów dla często odpytywanych API
    const isSilentEndpoint = silentEndpoints.some(endpoint => url.startsWith(endpoint))
    if (isSilentEndpoint && statusCode >= 200 && statusCode < 300) {
        return false
    }
    
    // ✅ Loguj tylko POST/PUT/DELETE (akcje zmieniające dane)
    const method = global.__currentMethod || 'GET'
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        return true
    }
    
    // ✅ Loguj strony HTML (200 OK dla stron)
    if (statusCode === 200 && !url.startsWith('/api/')) {
        return true
    }
    
    // ❌ Reszta: nie loguj (GET do API zwracający 200)
    return false
}

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true)
            const { pathname } = parsedUrl
            
            // Interceptuj response
            const originalEnd = res.end
            res.end = function(...args) {
                // Zapisz metodę globalnie (dla shouldLog)
                global.__currentMethod = req.method
                
                // Loguj tylko jeśli potrzeba
                if (shouldLog(pathname, res.statusCode)) {
                    const method = req.method
                    const status = res.statusCode
                    const time = Date.now() - req._startTime
                    
                    // Emoji dla metod
                    const methodEmoji = {
                        'GET': '📥',
                        'POST': '📤',
                        'PUT': '✏️',
                        'DELETE': '🗑️',
                        'PATCH': '🔧'
                    }[method] || '📡'
                    
                    const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '🔄' : '✅'
                    
                    console.log(`${statusEmoji} ${methodEmoji} ${method} ${pathname} ${status} in ${time}ms`)
                }
                originalEnd.apply(res, args)
            }
            
            req._startTime = Date.now()
            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error('❌ Error occurred handling', req.url, err)
            res.statusCode = 500
            res.end('internal server error')
        }
    })
        .once('error', (err) => {
            console.error('❌ Server error:', err)
            process.exit(1)
        })
        .listen(port, () => {
            console.log(`\n✅ Ready on http://${hostname}:${port}`)
            console.log(`📱 Aplikacja Technik dostępna`)
            console.log(`\n🔇 QUIET MODE - Logi zostały zminimalizowane:`)
            console.log(`   ❌ Wyłączone: GET 304 (Not Modified)`)
            console.log(`   ❌ Wyłączone: GET 200 dla /api/rezerwacje, /api/orders, /api/notifications, /api/part-requests`)
            console.log(`   ✅ Włączone: POST/PUT/DELETE (modyfikacje danych)`)
            console.log(`   ✅ Włączone: Błędy (4xx, 5xx)`)
            console.log(`   ✅ Włączone: Strony HTML (/, /admin/*)`)
            console.log(`\n`)
        })
})
