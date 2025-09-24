// pages/test-zlecenie.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiPhone,
  FiTool,
  FiCheckCircle,
  FiDollarSign,
  FiPlay,
  FiPause,
  FiSquare,
  FiSave
} from 'react-icons/fi';

export default function TestZlecenie() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/pracownik-panel')}
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Test zlecenia #{id}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUser className="h-5 w-5 mr-2" />
            Test ikon
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <FiCalendar className="h-5 w-5" />
              <span>Kalendarz</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiClock className="h-5 w-5" />
              <span>Zegar</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiPhone className="h-5 w-5" />
              <span>Telefon</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiTool className="h-5 w-5" />
              <span>Narzędzie</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCheckCircle className="h-5 w-5" />
              <span>Check</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiDollarSign className="h-5 w-5" />
              <span>Dollar</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiPlay className="h-5 w-5" />
              <span>Play</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiPause className="h-5 w-5" />
              <span>Pause</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiSquare className="h-5 w-5" />
              <span>Stop</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiSave className="h-5 w-5" />
              <span>Save</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}