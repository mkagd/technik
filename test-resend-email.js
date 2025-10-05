// Test Resend API - sprawdź czy działa wysyłka z Twojej domeny
// Uruchom: node test-resend-email.js

require('dotenv').config({ path: '.env.local' });

const testResendEmail = async () => {
    console.log('📧 Testing Resend API...\n');
    
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_EMAIL_FROM;
    const fromName = process.env.RESEND_EMAIL_FROM_NAME;
    const testEmail = process.env.COST_ALERT_EMAIL || 'biuro@serwiszdojazdem.pl';
    
    console.log('📋 Configuration:');
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : '❌ NOT SET'}`);
    console.log(`   From: ${fromName} <${from}>`);
    console.log(`   Test recipient: ${testEmail}\n`);
    
    if (!apiKey || apiKey.includes('twoj_resend_api_key')) {
        console.error('❌ RESEND_API_KEY not configured properly!');
        process.exit(1);
    }
    
    try {
        console.log('📤 Sending test email...');
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `${fromName} <${from}>`,
                to: [testEmail],
                subject: 'Test Email - Resend Configuration ✅',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #22c55e;">✅ Resend działa poprawnie!</h2>
                        <p>To jest testowa wiadomość wysłana z systemu Technik.</p>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <strong>📋 Konfiguracja:</strong><br>
                            <code>From: ${fromName} &lt;${from}&gt;</code><br>
                            <code>To: ${testEmail}</code><br>
                            <code>Date: ${new Date().toLocaleString('pl-PL')}</code>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px;">
                            Jeśli otrzymałeś tę wiadomość, oznacza to że:<br>
                            ✅ Klucz API Resend jest poprawny<br>
                            ✅ Domena jest zweryfikowana (lub używasz domeny testowej)<br>
                            ✅ System email działa poprawnie
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        
                        <p style="color: #9ca3af; font-size: 12px;">
                            Wiadomość wygenerowana automatycznie przez test-resend-email.js
                        </p>
                    </div>
                `
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Email sent successfully!');
            console.log(`   Email ID: ${data.id}`);
            console.log(`\n📬 Check your inbox: ${testEmail}`);
            console.log(`📊 View in Resend Dashboard: https://resend.com/emails/${data.id}`);
        } else {
            console.error('❌ Failed to send email');
            console.error(`   Status: ${response.status}`);
            console.error(`   Error:`, data);
            
            if (response.status === 403 && data.message?.includes('domain')) {
                console.log('\n💡 ROZWIĄZANIE:');
                console.log('   Twoja domena nie jest zweryfikowana w Resend!');
                console.log('   1. Przejdź do: https://resend.com/domains');
                console.log('   2. Dodaj domenę: serwiszdojazdem.pl');
                console.log('   3. Skonfiguruj rekordy DNS');
                console.log('   4. Poczekaj na weryfikację\n');
                console.log('   LUB użyj domeny testowej:');
                console.log('   RESEND_EMAIL_FROM=onboarding@resend.dev');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testResendEmail();
