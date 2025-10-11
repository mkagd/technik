import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CLIENTS_FILE = path.join(process.cwd(), 'data', 'clients.json');

const readClients = () => {
  try {
    const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading clients.json:', error);
    return [];
  }
};

const saveClients = (clients) => {
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving clients:', error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }

    // Znajdź klienta po emailu
    const clients = await readClients();
    const client = clients.find(c => c.email?.toLowerCase() === email.toLowerCase());

    if (!client) {
      // Z bezpieczeństwa zawsze zwracamy sukces, nawet jeśli email nie istnieje
      return res.status(200).json({ 
        message: 'Jeśli email istnieje w systemie, wyślemy link do resetowania hasła.' 
      });
    }

    // Generuj token resetujący
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 godzina

    // Zapisz token w kliencie
    client.resetToken = resetToken;
    client.resetTokenExpiry = resetTokenExpiry;
    saveClients(clients);

    console.log(`🔑 Reset token dla ${email}: ${resetToken}`);
    
    // 📧 Wyślij email z linkiem resetującym
    let emailSent = false;
    let emailError = null;

    if (process.env.RESEND_API_KEY && process.env.RESEND_EMAIL_FROM) {
      try {
        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/client/reset-password?token=${resetToken}`;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f5f5f5;
                padding: 20px;
              }
              .email-wrapper {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white; 
                padding: 40px 30px;
                text-align: center;
              }
              .header-icon {
                font-size: 64px;
                margin-bottom: 15px;
                display: block;
              }
              .header h1 { 
                font-size: 28px;
                font-weight: 600;
                margin: 0;
                letter-spacing: -0.5px;
              }
              .content { 
                padding: 40px 30px;
                background: #ffffff;
              }
              .greeting {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
              }
              .message {
                font-size: 15px;
                color: #4b5563;
                margin-bottom: 30px;
                line-height: 1.7;
              }
              .button-container {
                text-align: center;
                margin: 35px 0;
              }
              .button { 
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white !important;
                padding: 16px 48px;
                text-decoration: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
                transition: all 0.3s ease;
              }
              .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
              }
              .expiry-notice {
                text-align: center;
                background: #fef3c7;
                padding: 12px 20px;
                border-radius: 8px;
                margin: 25px 0;
                border: 1px solid #fbbf24;
              }
              .expiry-notice p {
                color: #92400e;
                font-size: 14px;
                font-weight: 500;
                margin: 0;
              }
              .warning-box { 
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                border-left: 4px solid #ef4444;
                padding: 20px;
                margin: 30px 0;
                border-radius: 8px;
              }
              .warning-box-title {
                font-weight: 600;
                color: #991b1b;
                font-size: 15px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .warning-box ul {
                margin: 0;
                padding-left: 20px;
                color: #991b1b;
              }
              .warning-box li {
                margin: 8px 0;
                font-size: 14px;
              }
              .alt-link {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-top: 30px;
                border: 1px solid #e5e7eb;
              }
              .alt-link p {
                font-size: 13px;
                color: #6b7280;
                margin-bottom: 10px;
              }
              .alt-link code {
                display: block;
                background: white;
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #d1d5db;
                word-break: break-all;
                font-size: 12px;
                color: #3b82f6;
                font-family: 'Courier New', monospace;
              }
              .footer { 
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }
              .footer p {
                color: #6b7280;
                font-size: 13px;
                margin: 8px 0;
              }
              .footer-brand {
                font-weight: 600;
                color: #3b82f6;
                font-size: 14px;
                margin-top: 15px;
              }
              @media only screen and (max-width: 600px) {
                .email-wrapper { border-radius: 0; }
                .content { padding: 30px 20px; }
                .header { padding: 30px 20px; }
                .button { padding: 14px 32px; font-size: 15px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <span class="header-icon">🔐</span>
                <h1>Resetowanie hasła</h1>
              </div>
              
              <div class="content">
                <p class="greeting">Witaj!</p>
                
                <p class="message">
                  Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w serwisie <strong>${process.env.RESEND_EMAIL_FROM_NAME || 'AGD'}</strong>. 
                  Kliknij poniższy przycisk, aby ustawić nowe hasło.
                </p>
                
                <div class="button-container">
                  <a href="${resetLink}" class="button">
                    🔓 Ustaw nowe hasło
                  </a>
                </div>
                
                <div class="expiry-notice">
                  <p>⏰ Ten link wygaśnie za <strong>1 godzinę</strong></p>
                </div>
                
                <div class="warning-box">
                  <div class="warning-box-title">
                    <span>⚠️</span>
                    <span>Ważne zasady bezpieczeństwa</span>
                  </div>
                  <ul>
                    <li>Jeśli nie prosiłeś o reset hasła - <strong>zignoruj ten email</strong></li>
                    <li>Nigdy nie udostępniaj tego linku innym osobom</li>
                    <li>Nasi pracownicy nigdy nie proszą o Twoje hasło</li>
                    <li>W razie podejrzeń skontaktuj się z nami</li>
                  </ul>
                </div>
                
                <div class="alt-link">
                  <p><strong>Przycisk nie działa?</strong> Skopiuj poniższy link i wklej go w przeglądarkę:</p>
                  <code>${resetLink}</code>
                </div>
              </div>
              
              <div class="footer">
                <p>Ten email został wysłany automatycznie. Prosimy nie odpowiadać na tę wiadomość.</p>
                <p>Masz pytania? Skontaktuj się z nami: <strong>${process.env.RESEND_EMAIL_FROM}</strong></p>
                <p class="footer-brand">&copy; ${new Date().getFullYear()} ${process.env.RESEND_EMAIL_FROM_NAME || 'Serwis AGD'}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${process.env.RESEND_EMAIL_FROM_NAME || 'Serwis'} <${process.env.RESEND_EMAIL_FROM}>`,
            to: email,
            subject: '🔐 Resetowanie hasła - Twój kod resetujący',
            html: emailHtml
          })
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('✅ Email resetujący wysłany do:', email);
        } else {
          const errorData = await emailResponse.json();
          emailError = errorData.message || 'Nieznany błąd Resend API';
          console.error('❌ Błąd wysyłania emaila:', emailError);
        }
      } catch (error) {
        emailError = error.message;
        console.error('❌ Wyjątek podczas wysyłania emaila:', error);
      }
    } else {
      console.log('⚠️ Brak konfiguracji Resend - email nie został wysłany');
    }
    
    // Zawsze zwracamy sukces (bezpieczeństwo - nie mówimy czy email istnieje)
    res.status(200).json({ 
      message: emailSent 
        ? 'Link do resetowania hasła został wysłany na podany email. Sprawdź swoją skrzynkę.' 
        : 'Jeśli email istnieje w systemie, wyślemy link do resetowania hasła.',
      emailSent,
      // Tylko do testów w developmencie - usuń w produkcji:
      ...(process.env.NODE_ENV === 'development' && {
        resetToken,
        resetLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/client/reset-password?token=${resetToken}`,
        emailError
      })
    });

  } catch (error) {
    console.error('❌ Błąd podczas resetowania hasła:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
}
