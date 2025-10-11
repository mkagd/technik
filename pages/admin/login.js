import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiLock, FiMail, FiAlertCircle, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';

/**
 * Admin Login Page
 * Strona logowania do panelu administracyjnego
 */
export default function AdminLogin() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Zapisz token w localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        
        console.log('✅ Login successful:', data.data.user.role);
        
        // Redirect do panelu admina
        router.push('/admin');
      } else {
        setError(data.message || 'Nieprawidłowy email lub hasło');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Logowanie Admina - AGD Serwis</title>
        <meta name="description" content="Panel administracyjny" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-xl">
              <FiShield className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Panel Administracyjny
            </h1>
            <p className="text-blue-200">
              Zaloguj się aby zarządzać systemem
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg flex items-start gap-3">
                <FiAlertCircle className="text-red-300 text-xl flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-100 font-medium">Błąd logowania</p>
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@technik.pl"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Hasło
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-blue-300" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-blue-300 hover:text-white" />
                    ) : (
                      <FiEye className="text-blue-300 hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link href="/admin/forgot-password">
                  <span className="text-sm text-blue-200 hover:text-white cursor-pointer transition-colors">
                    Zapomniałeś hasła?
                  </span>
                </Link>
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
                    <span>Logowanie...</span>
                  </>
                ) : (
                  <>
                    <FiShield />
                    <span>Zaloguj się</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Home */}
            <div className="mt-6 pt-6 border-t border-white/20 text-center">
              <Link href="/">
                <span className="text-sm text-blue-200 hover:text-white cursor-pointer transition-colors">
                  ← Powrót do strony głównej
                </span>
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/50 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-blue-100 text-center">
              <strong>🔐 Domyślne konta:</strong><br />
              <span className="font-mono text-xs">
                Admin: admin@technik.pl / admin123<br />
                Manager: manager@technik.pl / manager123
              </span>
            </p>
            <p className="text-xs text-blue-200 text-center mt-2">
              ⚠️ Zmień hasła po pierwszym logowaniu!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
