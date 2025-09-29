// Demonstracja TODO dla pracowników - strona testowa
// pages/demo-employee-todo.js

import { useState, useEffect } from 'react';
import EmployeeTodoPanel from '../components/EmployeeTodoPanel';
import { FiUser, FiSettings, FiRefreshCw } from 'react-icons/fi';

export default function DemoEmployeeTodo() {
  const [selectedEmployee, setSelectedEmployee] = useState('DEMO_EMP_001');
  const [demoData, setDemoData] = useState(null);

  // Lista demonstracyjnych pracowników
  const demoEmployees = [
    { id: 'DEMO_EMP_001', name: 'Jan Kowalski', role: 'Senior Technik' },
    { id: 'DEMO_EMP_002', name: 'Anna Nowak', role: 'Technik Hardware' },
    { id: 'DEMO_EMP_003', name: 'Piotr Wiśniewski', role: 'Technik Software' }
  ];

  // Inicjalizacja danych demonstracyjnych
  const initializeDemoData = async () => {
    try {
      // Dodaj przykładowe TODO dla każdego pracownika
      for (const employee of demoEmployees) {
        // Przykładowe TODO 1
        await fetch('/api/employee-todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: employee.id,
            todoData: {
              title: `Naprawa laptopa klienta #${Math.floor(Math.random() * 1000)}`,
              description: 'Wymiana ekranu LCD oraz czyszczenie wnętrza laptopa',
              priority: Math.random() > 0.5 ? 'high' : 'medium',
              category: 'hardware',
              dueDate: new Date(Date.now() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              estimatedHours: Math.floor(Math.random() * 4) + 1,
              tags: ['laptop', 'naprawa', 'klient']
            }
          })
        });

        // Przykładowe TODO 2
        await fetch('/api/employee-todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: employee.id,
            todoData: {
              title: `Instalacja oprogramowania`,
              description: 'Aktualizacja systemu i instalacja niezbędnego oprogramowania',
              priority: 'low',
              category: 'software',
              dueDate: new Date(Date.now() + Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              estimatedHours: Math.floor(Math.random() * 3) + 1,
              tags: ['software', 'instalacja']
            }
          })
        });

        // Przykładowe TODO 3 - ukończone
        const completedTodo = await fetch('/api/employee-todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: employee.id,
            todoData: {
              title: `Konserwacja serwera`,
              description: 'Comiesięczna konserwacja serwera - sprawdzenie dysków, aktualizacje',
              priority: 'medium',
              category: 'service',
              dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              estimatedHours: 2,
              tags: ['serwer', 'konserwacja', 'miesięczne']
            }
          })
        });

        // Oznacz jako ukończone
        if (completedTodo.ok) {
          const todoData = await completedTodo.json();
          await fetch('/api/employee-todos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              todoId: todoData.data.id,
              updates: { completed: true, actualHours: 1.5 }
            })
          });
        }
      }

      setDemoData('initialized');
    } catch (error) {
      console.error('Błąd inicjalizacji danych demo:', error);
    }
  };

  // Czyszczenie danych demonstracyjnych
  const clearDemoData = async () => {
    try {
      // Pobierz wszystkie TODO dla każdego pracownika i usuń
      for (const employee of demoEmployees) {
        const response = await fetch(`/api/employee-todos?employeeId=${employee.id}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          for (const todo of data.data) {
            await fetch('/api/employee-todos', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ todoId: todo.id })
            });
          }
        }
      }
      
      setDemoData(null);
      alert('Dane demonstracyjne zostały wyczyszczone');
    } catch (error) {
      console.error('Błąd czyszczenia danych:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Demo: System TODO dla Pracowników
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Testowanie funkcjonalności zarządzania zadaniami pracowników
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={initializeDemoData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiSettings size={16} />
                Inicjalizuj dane demo
              </button>
              
              <button
                onClick={clearDemoData}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FiRefreshCw size={16} />
                Wyczyść dane
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Wybierz pracownika</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoEmployees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee.id)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedEmployee === employee.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiUser className="h-8 w-8 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">{employee.name}</h4>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                    <p className="text-xs text-gray-500">ID: {employee.id}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* TODO Panel */}
        {selectedEmployee && (
          <EmployeeTodoPanel
            employeeId={selectedEmployee}
            employeeName={demoEmployees.find(emp => emp.id === selectedEmployee)?.name}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p><strong>Instrukcje testowania:</strong></p>
            <div className="mt-2 space-y-1">
              <p>1. Kliknij "Inicjalizuj dane demo" aby utworzyć przykładowe TODO</p>
              <p>2. Wybierz pracownika z listy powyżej</p>
              <p>3. Testuj dodawanie, edycję i usuwanie zadań TODO</p>
              <p>4. Sprawdź filtry i statystyki</p>
              <p>5. Użyj "Wyczyść dane" aby usunąć wszystkie testowe TODO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}