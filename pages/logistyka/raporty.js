// pages/logistyka/raporty.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DarkModeToggle from '../../components/DarkModeToggle';
import { FiArrowLeft, FiDownload, FiTrendingUp, FiPackage, FiClock, FiDollarSign } from 'react-icons/fi';

export default function LogistykaRaporty() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrdersThisMonth: 0,
    totalValue: 0,
    avgApprovalTime: 0,
    topParts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Pobierz zamówienia
      const res = await fetch('/api/part-requests');
      const data = await res.json();
      
      const requests = data.requests || [];
      
      // Zamówienia z tego miesiąca
      const now = new Date();
      const thisMonth = requests.filter(r => {
        const createdDate = new Date(r.createdAt);
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
      });

      // Wartość zamówień (mock)
      const totalValue = thisMonth.length * 150; // średnio 150zł per zamówienie

      // Średni czas zatwierdzenia
      const approvedOrders = requests.filter(r => r.status === 'approved' && r.approvedAt);
      let avgTime = 0;
      if (approvedOrders.length > 0) {
        const times = approvedOrders.map(r => {
          const created = new Date(r.createdAt);
          const approved = new Date(r.approvedAt);
          return (approved - created) / (1000 * 60 * 60); // godziny
        });
        avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      }

      // Top części
      const partCounts = {};
      requests.forEach(r => {
        const key = r.partId || 'unknown';
        partCounts[key] = (partCounts[key] || 0) + 1;
      });
      
      const topParts = Object.entries(partCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([partId, count]) => ({
          partId,
          count,
          name: `Część ${partId}`
        }));

      setStats({
        totalOrdersThisMonth: thisMonth.length,
        totalValue: totalValue,
        avgApprovalTime: avgTime,
        topParts: topParts
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      title: 'Raport miesięczny',
      description: 'Podsumowanie zamówień z ostatniego miesiąca',
      icon: FiTrendingUp,
      color: 'blue'
    },
    {
      title: 'Analiza kosztów',
      description: 'Zestawienie wydatków na części',
      icon: FiDollarSign,
      color: 'green'
    },
    {
      title: 'Stan magazynu',
      description: 'Szczegółowy raport stanu magazynu',
      icon: FiPackage,
      color: 'purple'
    },
    {
      title: 'Czas realizacji',
      description: 'Analiza czasów zatwierdzania i dostaw',
      icon: FiClock,
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
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
                <h1 className="text-2xl font-bold text-gray-900">Raporty i statystyki</h1>
                <p className="text-sm text-gray-600 mt-1">Analizy magazynowe i zamówienia</p>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiPackage className="h-8 w-8 text-blue-600" />
              <span className="text-sm text-gray-500">Ten miesiąc</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : stats.totalOrdersThisMonth}
            </div>
            <div className="text-sm text-gray-600">Zamówień złożonych</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="h-8 w-8 text-green-600" />
              <span className="text-sm text-gray-500">Wartość</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : `${stats.totalValue} zł`}
            </div>
            <div className="text-sm text-gray-600">Łączna wartość</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="h-8 w-8 text-orange-600" />
              <span className="text-sm text-gray-500">Średnia</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '...' : `${stats.avgApprovalTime.toFixed(1)}h`}
            </div>
            <div className="text-sm text-gray-600">Czas zatwierdzenia</div>
          </div>
        </div>

        {/* Top parts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Najczęściej zamawiane części</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Ładowanie...</div>
            ) : stats.topParts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Brak danych</div>
            ) : (
              <div className="space-y-3">
                {stats.topParts.map((part, index) => (
                  <div key={part.partId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{part.name}</div>
                        <div className="text-sm text-gray-500">ID: {part.partId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{part.count}</div>
                      <div className="text-xs text-gray-500">zamówień</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dostępne raporty</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report, index) => {
                const Icon = report.icon;
                return (
                  <div
                    key={index}
                    className={`${colorClasses[report.color]} rounded-lg border-2 p-4 cursor-pointer hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="h-8 w-8" />
                      <button className="p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50">
                        <FiDownload className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {report.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Wskazówka:</strong> Raporty są generowane automatycznie na podstawie danych z systemu. Możesz je eksportować do PDF lub Excel.
          </p>
        </div>
      </main>
    </div>
  );
}
