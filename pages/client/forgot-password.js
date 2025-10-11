import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/client/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Błąd podczas wysyłania linku');
      }

      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Resetowanie hasła - Technik</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Zapomniałeś hasła?
            </h1>
            <p className="text-gray-600">
              Nie martw się! Wyślemy Ci link do resetowania hasła.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-green-800 font-semibold mb-2 text-center">
                ✅ Link został wysłany!
              </h3>
              <p className="text-green-700 text-sm text-center mb-4">
                Sprawdź swoją skrzynkę email i kliknij w link aby zresetować hasło.
              </p>
              <p className="text-gray-600 text-xs text-center">
                Email powinien dotrzeć w ciągu kilku minut. Sprawdź również folder SPAM.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adres email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="twoj@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Wysyłam...' : 'Wyślij link resetujący'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            <a
              href="/client/login"
              className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Powrót do logowania
            </a>
            <p className="text-gray-500 text-xs">
              Nie masz konta?{' '}
              <a href="/rezerwacja" className="text-blue-600 hover:text-blue-700 font-medium">
                Umów wizytę
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
