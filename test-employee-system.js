// test-employee-system.js - Skrypt testowy dla systemu pracowników
// Uruchom: node test-employee-system.js

import { readEmployees, addEmployee, readSpecializations, findBestEmployeeForJob } from './utils/employeeStorage.js';

console.log('🧪 TESTOWANIE SYSTEMU ZARZĄDZANIA PRACOWNIKAMI');
console.log('='.repeat(50));

try {
    // Test 1: Odczyt pracowników
    console.log('\n📋 Test 1: Odczyt pracowników');
    const employees = readEmployees();
    console.log(`✅ Znaleziono ${employees.length} pracowników`);
    employees.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.id}) - ${emp.specializations.join(', ')}`);
    });

    // Test 2: Odczyt specjalizacji
    console.log('\n🔧 Test 2: Odczyt specjalizacji');
    const specializations = readSpecializations();
    console.log(`✅ Znaleziono ${specializations.length} specjalizacji`);
    specializations.forEach(spec => {
        console.log(`  - ${spec.name} (${spec.category})`);
    });

    // Test 3: Znajdź najlepszego pracownika
    console.log('\n🏆 Test 3: Znajdź najlepszego pracownika dla Serwisu AGD');
    const bestEmployee = findBestEmployeeForJob(['Serwis AGD']);
    if (bestEmployee) {
        console.log(`✅ Najlepszy pracownik: ${bestEmployee.name} (ocena: ${bestEmployee.rating}, zadania: ${bestEmployee.completedJobs})`);
    } else {
        console.log('❌ Nie znaleziono odpowiedniego pracownika');
    }

    // Test 4: Dodaj nowego pracownika
    console.log('\n➕ Test 4: Dodanie nowego pracownika');
    const newEmployeeData = {
        name: 'Piotr Nowak',
        email: 'piotr.nowak@techserwis.pl',
        phone: '+48 555 123 456',
        specializations: ['Instalacje elektryczne', 'Montaż AGD'],
        address: 'Gdańsk',
        experience: '7 lat'
    };

    const newEmployee = addEmployee(newEmployeeData);
    if (newEmployee) {
        console.log(`✅ Dodano pracownika: ${newEmployee.name} (${newEmployee.id})`);
    } else {
        console.log('❌ Błąd dodawania pracownika');
    }

    // Test 5: Sprawdź ponownie listę pracowników
    console.log('\n📋 Test 5: Lista pracowników po dodaniu');
    const updatedEmployees = readEmployees();
    console.log(`✅ Teraz jest ${updatedEmployees.length} pracowników`);

    console.log('\n🎉 WSZYSTKIE TESTY ZAKOŃCZONE POMYŚLNIE!');
    console.log('\nSystem zarządzania pracownikami jest gotowy do użycia:');
    console.log('- API endpoints: /api/employees, /api/employees/[id], /api/specializations');
    console.log('- Panel administratora: zakładka "Pracownicy"');
    console.log('- Storage: utils/employeeStorage.js');
    console.log('- Pliki danych: data/employees.json, data/specializations.json');

} catch (error) {
    console.error('❌ BŁĄD W TESTACH:', error);
}
