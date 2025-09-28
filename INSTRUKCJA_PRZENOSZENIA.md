# Instrukcja przeniesienia aplikacji na nowy serwer

## 1. Wymagania na docelowym serwerze:
- Node.js 18+ (najlepiej 20+)
- npm lub yarn
- Git

## 2. Kroki przeniesienia:

### A. Klonowanie repozytorium:
```bash
git clone https://github.com/mkagd/technik.git
cd technik
```

### B. Instalacja zależności:
```bash
npm install
```

### C. Konfiguracja zmiennych środowiskowych:
```bash
# Skopiuj plik .env.local z starego serwera
# lub utwórz nowy z kluczami API
```

### D. Build aplikacji:
```bash
npm run build
```

### E. Uruchomienie:
```bash
# Tryb produkcyjny
npm start

# Lub z PM2 (zalecane na serwerze):
npm install -g pm2
pm2 start npm --name "technik-app" -- start
pm2 startup
pm2 save
```

## 3. Konfiguracja sieci:
- Port forwarding na routerze: 80 -> 3000
- Firewall: otwórz port 3000
- DNS: skonfiguruj domenę wskazującą na IP serwera

## 4. HTTPS (opcjonalne):
```bash
# Nginx + Certbot dla Let's Encrypt
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d twoja-domena.pl
```

## 5. Monitoring:
```bash
# PM2 monitoring
pm2 monit

# Logi
pm2 logs technik-app
```

## 6. Backup:
- Regularny backup folderu `data/`
- Backup bazy danych (jeśli używasz)
- Backup plików konfiguracyjnych