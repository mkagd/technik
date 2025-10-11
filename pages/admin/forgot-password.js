import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiMail, FiAlertCircle, FiCheckCircle, FiShield, FiArrowLeft } from 'react-icons/fi';

/**
 * Admin Password Reset Page
 * Strona przypomnienia hasła dla administratorów
 */
export default function AdminForgotPassword() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resetCode, setResetCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Proszę podać adres email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setResetCode(data.resetCode); // Tymczasowe hasło/kod
      } else {
        setError(data.message || 'Nie znaleziono konta z tym adresem email');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Przypomnienie Hasła - Panel Admin</title>
        <meta name="description" content="Zresetuj hasło do panelu administracyjnego" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-xl">
              <FiShield className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Przypomnienie Hasła
            </h1>
            <p className="text-blue-200">
              Otrzymasz tymczasowe hasło do konta administratora
            </p>
          </div>

          {/* Reset Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {/* Success Message */}
            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-400/50 rounded-lg flex items-start gap-3">
                  <FiCheckCircle className="text-green-300 text-xl flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-100 font-medium">Hasło zostało zresetowane!</p>
                    <p className="text-green-200 text-sm mt-1">
                      Użyj poniższego tymczasowego hasła aby się zalogować.
                    </p>
                  </div>
                </div>

                {/* Temporary Password Display */}
                <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-2">Twoje tymczasowe hasło:</p>
                  <div className="bg-white/10 rounded-lg p-3 font-mono text-lg text-white text-center select-all">
                    {resetCode}
                  </div>
                  <p className="text-blue-200 text-xs mt-2">
                    ⚠️ Zapisz to hasło! Po zamknięciu strony nie będzie możliwe jego odzyskanie.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/admin/login')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Przejdź do logowania
                  </button>
                  
                  <p className="text-center text-sm text-blue-200">
                    Po zalogowaniu zalecana jest zmiana hasła w ustawieniach konta.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg flex items-start gap-3">
                    <FiAlertCircle className="text-red-300 text-xl flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-100 font-medium">Błąd</p>
                      <p className="text-red-200 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/50 rounded-lg">
                  <p className="text-sm text-blue-100">
                    📧 Podaj adres email powiązany z kontem administratora. 
                    Wygenerujemy dla Ciebie tymczasowe hasło.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Adres email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-blue-300" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@technik.pl"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Resetowanie hasła...</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle />
                        <span>Zresetuj hasło</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 pt-6 border-t border-white/20 text-center">
                  <Link href="/admin/login">
                    <span className="text-sm text-blue-200 hover:text-white cursor-pointer transition-colors inline-flex items-center gap-2">
                      <FiArrowLeft /> Powrót do logowania
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Security Note */}
          {!success && (
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-400/50 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-yellow-100 text-center">
                <strong>🔒 Uwaga bezpieczeństwa:</strong><br />
                <span className="text-xs text-yellow-200">
                  Tymczasowe hasło jest generowane losowo i ważne jednorazowo.
                  Po zalogowaniu zalecamy natychmiastową zmianę hasła.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
