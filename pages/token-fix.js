import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fixToken, debugTokens, syncAllTokens } from '../utils/tokenHelper';

export default function TokenFix() {
  const router = useRouter();
  const [status, setStatus] = useState('checking');
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  };

  useEffect(() => {
    runFix();
  }, []);

  const runFix = async () => {
    addLog('🔧 Starting token repair...');
    
    // Debug current state
    addLog('📋 Current localStorage state:');
    debugTokens();
    
    // Try to fix
    const fixed = fixToken();
    
    if (fixed) {
      addLog('✅ Token fixed successfully!');
      syncAllTokens();
      addLog('✅ All tokens synchronized!');
      setStatus('fixed');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        addLog('🔄 Redirecting to dashboard...');
        router.push('/technician/dashboard');
      }, 2000);
    } else {
      addLog('❌ No token found - you need to login!');
      setStatus('need-login');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        addLog('🔄 Redirecting to login...');
        router.push('/pracownik-logowanie');
      }, 3000);
    }
  };

  const manualLogin = () => {
    router.push('/pracownik-logowanie');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          🔧 Token Repair Tool
        </h1>

        {status === 'checking' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Checking and fixing tokens...</p>
          </div>
        )}

        {status === 'fixed' && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Token Fixed!</h2>
            <p className="text-green-700">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'need-login' && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">No Token Found</h2>
            <p className="text-red-700 mb-4">You need to login first</p>
            <button
              onClick={manualLogin}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-bold mb-2">Debug Log:</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>If problems persist, clear all browser data and login again.</p>
        </div>
      </div>
    </div>
  );
}
