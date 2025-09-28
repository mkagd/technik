// components/RoleTester.js - Komponent do testowania ról (tylko w trybie development)

import { useState } from 'react';
import { detectUserRole, USER_ROLES } from '../utils/roleDetector';

export default function RoleTester() {
  const [currentRole, setCurrentRole] = useState(null);

  // Tylko w trybie development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const refreshRole = () => {
    const roleInfo = detectUserRole();
    setCurrentRole(roleInfo);
  };

  const simulateAdmin = () => {
    sessionStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminAuth', 'true'); // Backup
    refreshRole();
  };

  const simulateEmployee = () => {
    const mockEmployee = {
      id: 'EMP-001',
      firstName: 'Jan',
      lastName: 'Serwisant',
      email: 'jan.serwisant@technik.pl',
      role: 'employee'
    };
    localStorage.setItem('employeeSession', JSON.stringify(mockEmployee));
    refreshRole();
  };

  const simulateClient = () => {
    const mockClient = {
      id: 'CLIENT-001',
      firstName: 'Anna',
      lastName: 'Kowalska',
      email: 'anna.kowalska@gmail.com',
      role: 'client'
    };
    localStorage.setItem('currentUser', JSON.stringify(mockClient));
    refreshRole();
  };

  const simulateGoogleClient = () => {
    const mockGoogleClient = {
      id: 'GOOGLE-001',
      name: 'Piotr Testowy',
      email: 'piotr.testowy@gmail.com'
    };
    localStorage.setItem('rememberedTechnikUser', JSON.stringify(mockGoogleClient));
    refreshRole();
  };

  const clearAllSessions = () => {
    // Wyczyść wszystkie sesje użytkowników
    localStorage.removeItem('currentUser');
    localStorage.removeItem('employeeSession');
    localStorage.removeItem('rememberedTechnikUser');
    localStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminAuth');
    localStorage.removeItem('chatUserInfo');
    localStorage.removeItem('chatHistory');
    refreshRole();
  };

  useState(() => {
    refreshRole();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm">
        <h4 className="font-bold text-yellow-800 mb-2">🧪 Tester Ról (DEV)</h4>
        
        {currentRole && (
          <div className="mb-3 p-2 bg-white rounded text-sm">
            <strong>Aktualna rola:</strong> {currentRole.role}<br/>
            <strong>Użytkownik:</strong> {currentRole.displayName || 'Gość'}<br/>
            <strong>Route:</strong> {currentRole.route}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={simulateAdmin}
            className="w-full px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            👨‍💼 Symuluj Admina
          </button>
          
          <button
            onClick={simulateEmployee}
            className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            🔧 Symuluj Pracownika
          </button>
          
          <button
            onClick={simulateClient}
            className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            👤 Symuluj Klienta
          </button>

          <button
            onClick={simulateGoogleClient}
            className="w-full px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            🌐 Symuluj Google Client
          </button>
          
          <button
            onClick={clearAllSessions}
            className="w-full px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            🧹 Wyczyść wszystkie sesje
          </button>

          <button
            onClick={refreshRole}
            className="w-full px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
          >
            🔄 Odśwież rolę
          </button>
        </div>
      </div>
    </div>
  );
}