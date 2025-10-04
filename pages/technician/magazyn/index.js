// pages/technician/magazyn/index.js
// 📦 Panel Pracownika - Magazyn (Dashboard)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import TechnicianLayout from '../../../components/TechnicianLayout';

export default function TechnicianMagazyn() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');
    
    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      const emp = JSON.parse(employeeData);
      setEmployee(emp);
      loadData(emp.id, token);
    } catch (err) {
      console.error('Error parsing employee data:', err);
      router.push('/technician/login');
    }
  }, []);

  const loadData = async (employeeId, token) => {
    setLoading(true);
    try {
      // Load personal inventory
      const invRes = await fetch(`/api/inventory/personal?employeeId=${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData.inventory);
      }

      // Load my requests
      const reqRes = await fetch(`/api/part-requests?requestedFor=${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockParts = inventory?.parts?.filter(p => p.quantity < 2) || [];
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalParts = inventory?.statistics?.totalParts || 0;
  const totalValue = inventory?.statistics?.totalValue || 0;

  if (loading) {
    return (
      <TechnicianLayout employee={employee} currentPage="magazyn">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie magazynu...</p>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  return (
    <TechnicianLayout employee={employee} currentPage="magazyn">
      <Head>
        <title>Magazyn - Panel Pracownika | TechSerwis AGD</title>
      </Head>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Witaj w magazynie! 📦</h2>
            <p className="text-blue-100">Zarządzaj częściami i składaj zamówienia</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rodzaje części</p>
                  <p className="text-3xl font-bold text-gray-900">{inventory?.parts?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Łączna ilość</p>
                  <p className="text-3xl font-bold text-gray-900">{totalParts} szt</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Wartość magazynu</p>
                  <p className="text-3xl font-bold text-gray-900">{totalValue.toFixed(0)} zł</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                  <p className="text-3xl font-bold text-red-600">{lowStockParts.length}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Szybkie akcje</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/technician/magazyn/moj-magazyn" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Mój magazyn</h4>
                    <p className="text-sm text-gray-600">Przeglądaj części</p>
                  </div>
                </div>
              </Link>

              <Link href="/technician/magazyn/zamow" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-500">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Zamów części</h4>
                    <p className="text-sm text-gray-600">Złóż nowe zamówienie</p>
                  </div>
                </div>
              </Link>

              <Link href="/technician/magazyn/zamowienia" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-yellow-500">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Moje zamówienia</h4>
                    <p className="text-sm text-gray-600">{pendingRequests} oczekujących</p>
                  </div>
                  {pendingRequests > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {pendingRequests}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockParts.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ⚠️ Niski stan magazynowy ({lowStockParts.length} części)
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    Następujące części mają mniej niż 2 sztuki w magazynie:
                  </p>
                  <div className="space-y-2">
                    {lowStockParts.slice(0, 5).map((part, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{part.partName}</span>
                        <span className="text-sm text-red-600 font-semibold">{part.quantity} szt</span>
                      </div>
                    ))}
                  </div>
                  {lowStockParts.length > 5 && (
                    <p className="text-sm text-red-700 mt-2">
                      ... i {lowStockParts.length - 5} więcej
                    </p>
                  )}
                  <Link href="/technician/magazyn/zamow" className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Zamów brakujące części
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Requests */}
          {requests.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie zamówienia</h3>
              <div className="space-y-4">
                {requests.slice(0, 5).map((request) => (
                  <div key={request.requestId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">#{request.requestId}</p>
                      <p className="text-sm text-gray-600">{request.parts?.length || 0} części</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status === 'pending' ? 'Oczekuje' :
                         request.status === 'approved' ? 'Zatwierdzone' :
                         request.status === 'delivered' ? 'Dostarczone' :
                         request.status}
                      </span>
                      <Link href={`/technician/magazyn/zamowienia`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Zobacz →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/technician/magazyn/zamowienia" className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium">
                Zobacz wszystkie zamówienia →
              </Link>
            </div>
          )}
    </TechnicianLayout>
  );
}
