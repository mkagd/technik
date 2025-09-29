// Test TODO API dla pracowników
// test-employee-todo-api.js

const testEmployeeTodoAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testowanie Employee TODO API...\n');

  try {
    // Test 1: Dodawanie TODO
    console.log('1. Test dodawania TODO...');
    const addResponse = await fetch(`${baseUrl}/api/employee-todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'TEST_EMP_001',
        todoData: {
          title: 'Napraw laptop Dell',
          description: 'Wymień ekran LCD w laptopie klienta',
          priority: 'high',
          category: 'hardware',
          dueDate: '2024-12-31',
          estimatedHours: 2,
          tags: ['pilne', 'laptop', 'naprawa']
        }
      })
    });

    const addResult = await addResponse.json();
    console.log('✅ Dodano TODO:', addResult);
    
    if (!addResult.success) {
      throw new Error('Błąd dodawania TODO');
    }

    const todoId = addResult.data.id;

    // Test 2: Pobieranie TODO pracownika
    console.log('\n2. Test pobierania TODO...');
    const getResponse = await fetch(`${baseUrl}/api/employee-todos?employeeId=TEST_EMP_001`);
    const getResult = await getResponse.json();
    console.log('✅ Pobrano TODO:', getResult);

    // Test 3: Aktualizacja TODO
    console.log('\n3. Test aktualizacji TODO...');
    const updateResponse = await fetch(`${baseUrl}/api/employee-todos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todoId: todoId,
        updates: {
          completed: true,
          actualHours: 1.5
        }
      })
    });

    const updateResult = await updateResponse.json();
    console.log('✅ Zaktualizowano TODO:', updateResult);

    // Test 4: Pobieranie statystyk
    console.log('\n4. Test pobierania statystyk...');
    const statsResponse = await fetch(`${baseUrl}/api/employee-todos?employeeId=TEST_EMP_001&action=stats`);
    const statsResult = await statsResponse.json();
    console.log('✅ Statystyki:', statsResult);

    // Test 5: Dodanie drugiego TODO
    console.log('\n5. Test dodawania drugiego TODO...');
    const addResponse2 = await fetch(`${baseUrl}/api/employee-todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'TEST_EMP_001',
        todoData: {
          title: 'Sprawdź komputer klienta ABC',
          description: 'Diagnoza komputera stacjonarnego - możliwy problem z zasilaczem',
          priority: 'medium',
          category: 'service',
          dueDate: '2024-12-28',
          estimatedHours: 1,
          tags: ['diagnoza', 'komputer']
        }
      })
    });

    const addResult2 = await addResponse2.json();
    console.log('✅ Dodano drugie TODO:', addResult2);

    // Test 6: Nadchodzące TODO (następne 7 dni)
    console.log('\n6. Test nadchodzących TODO...');
    const upcomingResponse = await fetch(`${baseUrl}/api/employee-todos?employeeId=TEST_EMP_001&action=upcoming&days=7`);
    const upcomingResult = await upcomingResponse.json();
    console.log('✅ Nadchodzące TODO:', upcomingResult);

    // Test 7: Usuwanie TODO
    console.log('\n7. Test usuwania TODO...');
    const deleteResponse = await fetch(`${baseUrl}/api/employee-todos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todoId: addResult2.data.id
      })
    });

    const deleteResult = await deleteResponse.json();
    console.log('✅ Usunięto TODO:', deleteResult);

    // Test 8: Finalne statystyki
    console.log('\n8. Test finalnych statystyk...');
    const finalStatsResponse = await fetch(`${baseUrl}/api/employee-todos?employeeId=TEST_EMP_001&action=stats`);
    const finalStatsResult = await finalStatsResponse.json();
    console.log('✅ Finalne statystyki:', finalStatsResult);

    console.log('\n🎉 Wszystkie testy przeszły pomyślnie!');

  } catch (error) {
    console.error('❌ Błąd podczas testowania:', error);
  }
};

// Uruchom test jeśli uruchomiony bezpośrednio
if (require.main === module) {
  testEmployeeTodoAPI();
}

module.exports = testEmployeeTodoAPI;