// Simplified Employee Todo Panel for debugging
// components/EmployeeTodoPanelSimple.js

import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiList } from 'react-icons/fi';

const EmployeeTodoPanelSimple = ({ employeeId, employeeName }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('EmployeeTodoPanelSimple rendered for:', employeeId, employeeName);

  // Fetch todos
  const fetchTodos = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/employee-todos?employeeId=${employeeId}`);
      const data = await response.json();
      
      if (data.success) {
        setTodos(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Błąd pobierania TODO');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add todo
  const addTodo = async () => {
    try {
      const response = await fetch('/api/employee-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          todoData: {
            title: 'Test TODO',
            description: 'Test description',
            priority: 'medium',
            category: 'general'
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Błąd dodawania TODO');
      console.error('Add error:', err);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchTodos();
    }
  }, [employeeId]);

  if (loading && todos.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">Ładowanie TODO...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              TODO - {employeeName}
            </h2>
            <p className="text-sm text-gray-600">
              Simplified version for debugging
            </p>
          </div>
          <button
            onClick={addTodo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiPlus size={16} />
            Add Test TODO
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Employee ID: {employeeId}<br/>
            Employee Name: {employeeName}<br/>
            Todos Count: {todos.length}
          </p>
        </div>

        {todos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FiList size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600">
              No TODOs found. Click "Add Test TODO" to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map(todo => (
              <div key={todo.id} className="p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <FiCheck className={todo.completed ? 'text-green-500' : 'text-gray-300'} />
                  <div>
                    <h3 className="font-medium">{todo.title}</h3>
                    <p className="text-sm text-gray-600">{todo.description}</p>
                    <p className="text-xs text-gray-400">
                      Priority: {todo.priority} | Category: {todo.category}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTodoPanelSimple;