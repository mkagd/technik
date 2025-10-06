// pages/logistyka/dostawcy.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DarkModeToggle from '../../components/DarkModeToggle';
import { FiArrowLeft, FiTruck, FiPhone, FiMail, FiMapPin, FiStar, FiPackage } from 'react-icons/fi';

export default function LogistykaDostawcy() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    // Mock data - później można podłączyć API
    const mockSuppliers = [
      {
        id: 'SUP001',
        name: 'AGD Parts Sp. z o.o.',
        category: 'Części AGD',
        contact: {
          phone: '+48 22 123 45 67',
          email: 'zamowienia@agdparts.pl',
          address: 'Warszawa, ul. Magazynowa 12'
        },
        rating: 4.8,
        deliveryTime: '2-3 dni',
        minOrder: 500,
        totalOrders: 142
      },
      {
        id: 'SUP002',
        name: 'ElektroHurt',
        category: 'Elektronika',
        contact: {
          phone: '+48 12 987 65 43',
          email: 'biuro@elektrohurt.pl',
          address: 'Kraków, ul. Handlowa 45'
        },
        rating: 4.5,
        deliveryTime: '3-5 dni',
        minOrder: 300,
        totalOrders: 89
      },
      {
        id: 'SUP003',
        name: 'Quick Parts 24',
        category: 'Części zamienne',
        contact: {
          phone: '+48 61 234 56 78',
          email: 'sklep@quickparts24.pl',
          address: 'Poznań, ul. Szybka 7'
        },
        rating: 4.9,
        deliveryTime: '24h',
        minOrder: 200,
        totalOrders: 234
      },
      {
        id: 'SUP004',
        name: 'MegaAGD Hurt',
        category: 'Hurt AGD',
        contact: {
          phone: '+48 32 345 67 89',
          email: 'zamowienia@megaagd.pl',
          address: 'Katowice, ul. Przemysłowa 156'
        },
        rating: 4.3,
        deliveryTime: '2-4 dni',
        minOrder: 1000,
        totalOrders: 67
      }
    ];

    setSuppliers(mockSuppliers);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dostawcy</h1>
                <p className="text-sm text-gray-600 mt-1">Baza dostawców części serwisowych</p>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{suppliers.length}</div>
                <div className="text-sm text-gray-600">Aktywnych dostawców</div>
              </div>
              <FiTruck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">4.6</div>
                <div className="text-sm text-gray-600">Średnia ocena</div>
              </div>
              <FiStar className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">532</div>
                <div className="text-sm text-gray-600">Zamówienia ogółem</div>
              </div>
              <FiPackage className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">2.8 dni</div>
                <div className="text-sm text-gray-600">Śr. czas dostawy</div>
              </div>
              <FiTruck className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Suppliers list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista dostawców</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Ładowanie...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {supplier.name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {supplier.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiStar className="h-5 w-5 text-yellow-500 fill-current" />
                          <span className="font-semibold text-gray-900">{supplier.rating}</span>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FiPhone className="h-4 w-4 text-gray-400" />
                          <span>{supplier.contact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FiMail className="h-4 w-4 text-gray-400" />
                          <span>{supplier.contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FiMapPin className="h-4 w-4 text-gray-400" />
                          <span>{supplier.contact.address}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-600">Czas dostawy: </span>
                          <span className="font-medium text-gray-900">{supplier.deliveryTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Min. zamówienie: </span>
                          <span className="font-medium text-gray-900">{supplier.minOrder} zł</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Zamówienia: </span>
                          <span className="font-medium text-gray-900">{supplier.totalOrders}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-6 flex flex-col space-y-2">
                      <button
                        onClick={() => router.push(`/logistyka/magazyn/admin-order?supplier=${supplier.id}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Złóż zamówienie
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                        Szczegóły
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new supplier button */}
        <div className="mt-6 flex justify-center">
          <button className="px-6 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors">
            + Dodaj nowego dostawcę
          </button>
        </div>
      </main>
    </div>
  );
}
