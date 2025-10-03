// pages/api/employee-auth.js
// 🔐 API dla autoryzacji pracowników
// Pobiera pracowników z data/employees.json zamiast hardkodowanych

import fs from 'fs';
import path from 'path';

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json');

const readEmployees = () => {
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Błąd odczytu employees.json:', error);
    return [];
  }
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Metoda nieobsługiwana. Użyj POST.' 
    });
  }

  const { action, email, password } = req.body;

  try {
    switch (action) {
      case 'login':
        return handleLogin(req, res, email, password);
      
      case 'get-employees':
        return handleGetEmployees(req, res);
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Nieznana akcja'
        });
    }
  } catch (error) {
    console.error('❌ Błąd w employee-auth API:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera'
    });
  }
}

const handleLogin = (req, res, email, password) => {
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email i hasło są wymagane'
    });
  }

  const employees = readEmployees();
  
  // Znajdź pracownika po emailu
  const employee = employees.find(emp => 
    emp.email === email && emp.isActive
  );

  if (!employee) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy email lub konto nieaktywne'
    });
  }

  // UWAGA: W rzeczywistej aplikacji hasła powinny być hashowane!
  // Na potrzeby demo używamy prostego porównania
  // Założymy domyślne hasło "haslo123" dla wszystkich pracowników
  const defaultPassword = 'haslo123';
  
  if (password !== defaultPassword) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowe hasło'
    });
  }

  // Przygotuj dane sesji pracownika
  const sessionData = {
    id: employee.id,
    email: employee.email,
    firstName: employee.name.split(' ')[0],
    lastName: employee.name.split(' ').slice(1).join(' '),
    fullName: employee.name,
    specializations: employee.specializations || [],
    workingHours: employee.workingHours || '8:00-16:00',
    phone: employee.phone,
    address: employee.address,
    rating: employee.rating,
    experience: employee.experience,
    completedJobs: employee.completedJobs,
    isActive: employee.isActive,
    loginTime: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    message: 'Logowanie udane',
    employee: sessionData
  });
};

const handleGetEmployees = (req, res) => {
  const employees = readEmployees();
  
  // Zwróć tylko podstawowe informacje (bez poufnych danych)
  const publicEmployeeData = employees
    .filter(emp => emp.isActive)
    .map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      specializations: emp.specializations || [],
      workingHours: emp.workingHours || '8:00-16:00',
      experience: emp.experience,
      rating: emp.rating
    }));

  return res.status(200).json({
    success: true,
    employees: publicEmployeeData
  });
};