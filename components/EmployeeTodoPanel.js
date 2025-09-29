// Komponenty do zarządzania TODO pracowników
// components/EmployeeTodoPanel.js

import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiX, FiClock, FiFlag, FiTag, FiEdit3, FiTrash2, FiCalendar, FiList } from 'react-icons/fi';

// Usunięto custom hook - logika przeniesiona do głównego komponentu

// Komponent pojedynczego TODO
const TodoItem = ({ todo, onUpdate, onDelete, onEdit }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    await onUpdate(todo.id, { completed: !todo.completed });
    setIsUpdating(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <div className={`p-4 border rounded-lg transition-all ${
      todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
    } ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isUpdating}
          className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
            todo.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {todo.completed && <FiCheck size={12} />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Tytuł */}
          <h3 className={`font-medium ${
            todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {todo.title}
          </h3>

          {/* Opis */}
          {todo.description && (
            <p className={`mt-1 text-sm ${
              todo.completed ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {todo.description}
            </p>
          )}

          {/* Metadane */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {/* Priorytet */}
            <span className={`px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
              <FiFlag size={10} className="inline mr-1" />
              {todo.priority}
            </span>

            {/* Kategoria */}
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600">
              <FiTag size={10} className="inline mr-1" />
              {todo.category}
            </span>

            {/* Data */}
            {todo.dueDate && (
              <span className={`px-2 py-1 rounded-full ${
                isOverdue ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <FiCalendar size={10} className="inline mr-1" />
                {formatDate(todo.dueDate)}
              </span>
            )}

            {/* Godziny */}
            {todo.estimatedHours && (
              <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                <FiClock size={10} className="inline mr-1" />
                {todo.actualHours || 0}h / {todo.estimatedHours}h
              </span>
            )}
          </div>

          {/* Tagi */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {todo.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Akcje */}
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(todo)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <FiEdit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponent formularza dodawania/edycji TODO
const TodoForm = ({ todo, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    dueDate: '',
    estimatedHours: '',
    tags: ''
  });

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        priority: todo.priority || 'medium',
        category: todo.category || 'general',
        dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
        estimatedHours: todo.estimatedHours || '',
        tags: todo.tags ? todo.tags.join(', ') : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        dueDate: '',
        estimatedHours: '',
        tags: ''
      });
    }
  }, [todo, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const todoData = {
      ...formData,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };

    onSave(todoData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {todo ? 'Edytuj TODO' : 'Dodaj nowe TODO'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tytuł */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tytuł *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Opis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priorytet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorytet
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Niski</option>
                <option value="medium">Średni</option>
                <option value="high">Wysoki</option>
              </select>
            </div>

            {/* Kategoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Ogólne</option>
                <option value="service">Serwis</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="meeting">Spotkanie</option>
                <option value="training">Szkolenie</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termin
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Szacowane godziny */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Szac. godziny
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tagi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tagi (oddzielone przecinkami)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="pilne, klient, naprawa"
            />
          </div>

          {/* Przyciski */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              {todo ? 'Zapisz zmiany' : 'Dodaj TODO'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Główny komponent panelu TODO
const EmployeeTodoPanel = ({ employeeId, employeeName }) => {
  // State bezpośrednio w komponencie
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [filter, setFilter] = useState('all');

  // Pobierz TODO pracownika
  const fetchTodos = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ employeeId, ...filters });
      const response = await fetch(`/api/employee-todos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTodos(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Błąd pobierania TODO');
    } finally {
      setLoading(false);
    }
  };

  // Pobierz statystyki
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/employee-todos?employeeId=${employeeId}&action=stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Błąd pobierania statystyk:', err);
    }
  };

  // Dodaj TODO
  const addTodo = async (todoData) => {
    try {
      const response = await fetch('/api/employee-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, todoData })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
        await fetchStats();
        return data.data;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err) {
      setError('Błąd dodawania TODO');
      return null;
    }
  };

  // Aktualizuj TODO
  const updateTodo = async (todoId, updates) => {
    try {
      const response = await fetch('/api/employee-todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, updates })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
        await fetchStats();
        return data.data;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err) {
      setError('Błąd aktualizacji TODO');
      return null;
    }
  };

  // Usuń TODO
  const deleteTodo = async (todoId) => {
    try {
      const response = await fetch('/api/employee-todos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTodos();
        await fetchStats();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      setError('Błąd usuwania TODO');
      return false;
    }
  };

  // useEffect
  useEffect(() => {
    if (employeeId) {
      fetchTodos();
      fetchStats();
    }
  }, [employeeId]);

  const handleAddTodo = async (todoData) => {
    const result = await addTodo(todoData);
    if (result) {
      setShowForm(false);
    }
  };

  const handleEditTodo = async (todoData) => {
    const result = await updateTodo(editingTodo.id, todoData);
    if (result) {
      setEditingTodo(null);
      setShowForm(false);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (confirm('Czy na pewno chcesz usunąć to TODO?')) {
      await deleteTodo(todoId);
    }
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'pending': return !todo.completed;
      case 'completed': return todo.completed;
      case 'overdue': return !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date();
      default: return true;
    }
  });

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
      {/* Nagłówek */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              TODO - {employeeName}
            </h2>
            <p className="text-sm text-gray-600">
              Zarządzaj swoimi zadaniami i priorytetami
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiPlus size={16} />
            Dodaj TODO
          </button>
        </div>

        {/* Statystyki */}
        {stats.total > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700">Wszystkie</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-green-700">Ukończone</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-yellow-700">Oczekujące</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-red-700">Przeterminowane</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
              <div className="text-sm text-purple-700">Ukończone</div>
            </div>
          </div>
        )}

        {/* Filtry */}
        <div className="mt-4 flex gap-2">
          {[
            { key: 'all', label: 'Wszystkie' },
            { key: 'pending', label: 'Oczekujące' },
            { key: 'completed', label: 'Ukończone' },
            { key: 'overdue', label: 'Przeterminowane' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista TODO */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {filteredTodos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <FiList size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Brak zadań TODO. Dodaj pierwsze zadanie!'
                : `Brak zadań w kategorii "${filter}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdate={updateTodo}
                onDelete={handleDeleteTodo}
                onEdit={(todo) => {
                  setEditingTodo(todo);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formularz */}
      <TodoForm
        todo={editingTodo}
        onSave={editingTodo ? handleEditTodo : handleAddTodo}
        onCancel={() => {
          setShowForm(false);
          setEditingTodo(null);
        }}
        isOpen={showForm}
      />
    </div>
  );
};

export default EmployeeTodoPanel;