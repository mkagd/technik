/**
 * API Endpoint: Wysyłanie alertów email o przekroczeniu limitów kosztów Google API
 * 
 * POST /api/send-cost-alert
 * Body: {
 *   alertType: 'budget' | 'requests' | 'rate',
 *   percentage: number (e.g., 80, 90),
 *   stats: { estimatedCost, dailyBudgetLimit, requests, ... }
 * }
 */

export default async function handler(req, res) {
  // Tylko POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Walidacja Resend API Key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('twoj_resend_api_key')) {
      console.error('❌ RESEND_API_KEY not configured');
      return res.status(500).json({ 
        error: 'Email service not configured',
        hint: 'Configure RESEND_API_KEY in .env.local'
      });
    }

    // Walidacja email docelowego
    if (!process.env.COST_ALERT_EMAIL) {
      console.error('❌ COST_ALERT_EMAIL not configured');
      return res.status(500).json({ 
        error: 'Alert email not configured',
        hint: 'Add COST_ALERT_EMAIL=your@email.com to .env.local'
      });
    }

    const { alertType, percentage, stats } = req.body;

    // Walidacja danych wejściowych
    if (!alertType || !percentage || !stats) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['alertType', 'percentage', 'stats']
      });
    }

    console.log('📧 Preparing cost alert email:', { alertType, percentage });

    // Przygotuj treść emaila
    const subject = `⚠️ Alert: ${percentage}% limitu API - ${alertType === 'budget' ? 'Budżet' : 'Zapytania'}`;
    
    const alertMessages = {
      budget: `Wykorzystano ${percentage}% dziennego budżetu ($${stats.estimatedCost?.toFixed(2)} z $${stats.dailyBudgetLimit})`,
      requests: `Wykorzystano ${percentage}% limitu zapytań (${stats.requests?.total} z ${stats.dailyRequestLimit})`,
      rate: `Przekroczono limit zapytań na minutę (${stats.perMinuteLimit})`
    };

    const alertMessage = alertMessages[alertType] || 'Przekroczono limit API';

    // Określ poziom krytyczności
    const severityColor = percentage >= 90 ? '#dc2626' : percentage >= 80 ? '#f59e0b' : '#3b82f6';
    const severityLabel = percentage >= 90 ? '🔴 KRYTYCZNY' : percentage >= 80 ? '🟡 OSTRZEŻENIE' : '🟢 INFO';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${severityColor};">
            <h1 style="color: ${severityColor}; margin: 0; font-size: 28px;">⚠️ Alert kosztów API</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Google Distance Matrix API</p>
          </div>

          <!-- Alert Level -->
          <div style="background: ${severityColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 20px; font-weight: bold;">${severityLabel}</div>
            <div style="font-size: 16px; margin-top: 5px;">${alertMessage}</div>
          </div>

          <!-- Statistics -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">📊 Statystyki dzisiaj:</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Koszt dzienny:</span>
                <strong style="color: #1e40af;">$${stats.estimatedCost?.toFixed(2)} / $${stats.dailyBudgetLimit}</strong>
              </div>
              <div style="width: 100%; background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="width: ${Math.min((stats.estimatedCost / stats.dailyBudgetLimit) * 100, 100)}%; height: 100%; background: ${severityColor};"></div>
              </div>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Zapytania:</span>
                <strong style="color: #1e40af;">${stats.requests?.total} / ${stats.dailyRequestLimit}</strong>
              </div>
              <div style="width: 100%; background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="width: ${Math.min((stats.requests?.total / stats.dailyRequestLimit) * 100, 100)}%; height: 100%; background: ${severityColor};"></div>
              </div>
            </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div style="text-align: center;">
                  <div style="color: #666; font-size: 12px;">API</div>
                  <div style="color: #3b82f6; font-size: 20px; font-weight: bold;">${stats.requests?.api || 0}</div>
                </div>
                <div style="text-align: center;">
                  <div style="color: #666; font-size: 12px;">Cache</div>
                  <div style="color: #10b981; font-size: 20px; font-weight: bold;">${stats.requests?.cache || 0}</div>
                </div>
                <div style="text-align: center;">
                  <div style="color: #666; font-size: 12px;">Nieudane</div>
                  <div style="color: #ef4444; font-size: 20px; font-weight: bold;">${stats.requests?.failed || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Projection -->
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📈 Prognoza miesięczna:</h3>
            <div style="color: #333; font-size: 24px; font-weight: bold;">
              $${stats.estimatedMonthlyCost?.toFixed(2)}
            </div>
            <div style="color: #666; font-size: 14px; margin-top: 5px;">
              Limit kredytu: $200/miesiąc
            </div>
          </div>

          <!-- Cache Performance -->
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: between; align-items: center;">
              <div>
                <div style="color: #166534; font-size: 14px;">Cache Hit Rate:</div>
                <div style="color: #15803d; font-size: 28px; font-weight: bold;">${stats.cacheHitRate || 0}%</div>
              </div>
              <div style="color: #666; font-size: 12px; margin-top: 10px;">
                ${stats.requests?.cache || 0} zapytań obsłużonych bez kosztu
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <h3 style="color: #333; font-size: 16px; margin-bottom: 15px;">🔧 Zalecane działania:</h3>
            <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
              ${percentage >= 90 ? `
                <li style="color: #dc2626; font-weight: bold;">⚠️ UWAGA: Przekroczono 90% limitu! System może zostać wkrótce zablokowany.</li>
                <li>Sprawdź czy nie występują pętle nieskończone w kodzie</li>
                <li>Rozważ tymczasowe wyłączenie automatycznych obliczeń tras</li>
              ` : percentage >= 80 ? `
                <li style="color: #f59e0b; font-weight: bold;">⚠️ Zbliżasz się do limitu dziennego</li>
                <li>Monitoruj wykorzystanie API w ciągu dnia</li>
                <li>Sprawdź czy cache działa poprawnie (powinien być >80%)</li>
              ` : ''}
              <li>Otwórz dashboard kosztów w aplikacji (przycisk "💰 Koszty API")</li>
              <li>Sprawdź ostatnie zapytania w konsoli przeglądarki</li>
              <li>Zweryfikuj ustawienia debounce i rate limiting</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
            <p>
              Ten email został wysłany automatycznie przez system monitoringu kosztów API.<br/>
              Czas wysłania: ${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}
            </p>
            <p style="margin-top: 10px;">
              <strong>Intelligent Week Planner</strong><br/>
              System Zarządzania Serwisem AGD
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Wyślij email przez Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@onrender.com',
        to: process.env.COST_ALERT_EMAIL,
        subject: subject,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to send email',
        details: data 
      });
    }

    console.log('✅ Cost alert email sent:', data.id);
    
    return res.status(200).json({ 
      success: true,
      emailId: data.id,
      message: 'Alert email sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending cost alert:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
