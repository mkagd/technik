import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TechnicianLayout from '../../components/TechnicianLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function TechnicianStats() {
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  
  useEffect(() => {
    const token = localStorage.getItem('technicianToken');
    const employeeData = localStorage.getItem('technicianEmployee');
    
    if (!token || !employeeData) {
      router.push('/technician/login');
      return;
    }

    try {
      setEmployee(JSON.parse(employeeData));
    } catch (err) {
      router.push('/technician/login');
    }
  }, []);

  useEffect(() => {
    if (employee) {
      loadStats();
    }
  }, [employee, timeRange]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('technicianToken');

    try {
      const response = await fetch(`/api/technician/stats?period=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Błąd pobierania statystyk');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Błąd ładowania statystyk');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <TechnicianLayout employee={employee} currentPage="stats">
        <Head><title>Statystyki - Panel Pracownika | TechSerwis AGD</title></Head>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie statystyk...</p>
          </div>
        </div>
      </TechnicianLayout>
    );
  }

  return (
    <TechnicianLayout employee={employee} currentPage="stats">
      <Head><title>Statystyki - Panel Pracownika | TechSerwis AGD</title></Head>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Twoja wydajność</h2>
        <p className="text-gray-600">Osiągnięcia i statystyki</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['week', 'month', 'quarter', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {{week: 'Tydzień', month: 'Miesiąc', quarter: 'Kwartał', year: 'Rok'}[range]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Wizyty</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.visits?.total || 0}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.visits?.completed || 0} zakończonych</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Czas pracy</h3>
              <p className="text-3xl font-bold text-gray-900">{Math.floor((stats.time?.totalMinutes || 0) / 60)}h</p>
              <p className="text-sm text-gray-500 mt-1">{formatTime(stats.time?.totalMinutes || 0)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Przychody</h3>
              <p className="text-3xl font-bold text-gray-900">{(stats.revenue?.total || 0).toFixed(0)} PLN</p>
              <p className="text-sm text-gray-500 mt-1">Średnio: {(stats.revenue?.average || 0).toFixed(0)} PLN</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Efektywność</h3>
              <p className="text-3xl font-bold text-gray-900">{((stats.visits?.completed || 0) / (stats.visits?.total || 1) * 100).toFixed(0)}%</p>
              <p className="text-sm text-gray-500 mt-1">Wskaźnik ukończenia</p>
            </div>
          </div>
          <p className="text-gray-500 text-center">Szczegółowe wykresy Chart.js - do dodania w następnej iteracji</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">Brak danych statystycznych</p>
        </div>
      )}
    </TechnicianLayout>
  );
}
