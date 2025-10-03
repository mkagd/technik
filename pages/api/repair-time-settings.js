const fs = require('fs');
const path = require('path');

const settingsPath = path.join(process.cwd(), 'data', 'repair-time-settings.json');
const employeesPath = path.join(process.cwd(), 'data', 'employees.json');

/**
 * API endpoint dla zarządzania ustawieniami czasów napraw
 * 
 * GET - Pobiera aktualne ustawienia czasów
 * PUT - Aktualizuje ustawienia czasów (wymagane uprawnienia admin)
 */
export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Odczytaj ustawienia
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      // Odczytaj pracowników z ich czasami
      const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
      
      // Przygotuj odpowiedź z pełnymi danymi
      const response = {
        settings,
        employees: employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          specializations: emp.specializations,
          repairTimes: emp.repairTimes || {},
          agdSpecializations: emp.agdSpecializations
        })),
        deviceTypes: settings.deviceTypes,
        additionalTimes: settings.additionalTimes
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Błąd odczytu ustawień czasów:', error);
      return res.status(500).json({ 
        error: 'Nie udało się pobrać ustawień czasów',
        details: error.message 
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { type, data } = req.body;

      if (type === 'additionalTimes') {
        // Aktualizacja czasów dodatkowych (demontaż, montaż, trudna zabudowa)
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        if (data.demontaz !== undefined) {
          settings.additionalTimes.demontaż.time = parseInt(data.demontaz);
        }
        if (data.montaz !== undefined) {
          settings.additionalTimes.montaż.time = parseInt(data.montaz);
        }
        if (data.trudnaZabudowa !== undefined) {
          settings.additionalTimes.trudnaZabudowa.time = parseInt(data.trudnaZabudowa);
        }

        settings.metadata.updatedAt = new Date().toISOString();
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Zaktualizowano czasy dodatkowe',
          settings 
        });
      }

      if (type === 'employeeRepairTimes') {
        // Aktualizacja czasów napraw dla konkretnego pracownika
        const { employeeId, repairTimes } = data;
        
        const employees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
        const employeeIndex = employees.findIndex(e => e.id === employeeId);
        
        if (employeeIndex === -1) {
          return res.status(404).json({ 
            error: 'Nie znaleziono pracownika',
            employeeId 
          });
        }

        // Walidacja czasów (muszą być > 0 i < 300 minut)
        for (const [device, time] of Object.entries(repairTimes)) {
          if (typeof time !== 'number' || time < 5 || time > 300) {
            return res.status(400).json({ 
              error: `Nieprawidłowy czas dla urządzenia ${device}: ${time}`,
              message: 'Czas musi być liczbą od 5 do 300 minut'
            });
          }
        }

        employees[employeeIndex].repairTimes = repairTimes;
        employees[employeeIndex].metadata = employees[employeeIndex].metadata || {};
        employees[employeeIndex].metadata.updatedAt = new Date().toISOString();
        employees[employeeIndex].metadata.lastModifiedBy = 'repair-time-settings-api';

        fs.writeFileSync(employeesPath, JSON.stringify(employees, null, 2), 'utf8');
        
        return res.status(200).json({ 
          success: true, 
          message: `Zaktualizowano czasy napraw dla ${employees[employeeIndex].name}`,
          employee: {
            id: employees[employeeIndex].id,
            name: employees[employeeIndex].name,
            repairTimes: employees[employeeIndex].repairTimes
          }
        });
      }

      if (type === 'deviceDefaults') {
        // Aktualizacja domyślnych czasów dla typów urządzeń
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        for (const [deviceId, time] of Object.entries(data)) {
          const deviceIndex = settings.deviceTypes.findIndex(d => d.id === deviceId);
          if (deviceIndex !== -1 && typeof time === 'number' && time >= 5 && time <= 300) {
            settings.deviceTypes[deviceIndex].defaultTime = time;
          }
        }

        settings.metadata.updatedAt = new Date().toISOString();
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Zaktualizowano domyślne czasy urządzeń',
          deviceTypes: settings.deviceTypes 
        });
      }

      return res.status(400).json({ 
        error: 'Nieprawidłowy typ aktualizacji',
        allowedTypes: ['additionalTimes', 'employeeRepairTimes', 'deviceDefaults']
      });

    } catch (error) {
      console.error('Błąd aktualizacji ustawień czasów:', error);
      return res.status(500).json({ 
        error: 'Nie udało się zaktualizować ustawień',
        details: error.message 
      });
    }
  }

  // Metoda nieobsługiwana
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ 
    error: `Metoda ${req.method} nie jest obsługiwana`,
    allowedMethods: ['GET', 'PUT']
  });
}
