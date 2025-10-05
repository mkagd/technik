const fs = require('fs');
const path = require('path');

const employees = [
  {
    "id": "emp_001",
    "name": "Mario Średziński",
    "email": "mario.sredzinski@techserwis.pl",
    "phone": "+48 601 234 567",
    "address": "Warszawa",
    "workingHours": "8:00-16:00",
    "experience": "8 lat",
    "isActive": true,
    "role": "Serwisant",
    "specializations": ["Serwis AGD", "Naprawa pralek", "Lodówki", "Zmywarki", "Piekarniki"],
    "repairTimes": {
      "pralka": 25,
      "lodówka": 35,
      "zmywarka": 30,
      "piekarnik": 40,
      "kuchenka": 35,
      "płyta indukcyjna": 30,
      "suszarka": 30,
      "pralko-suszarka": 40,
      "zamrażarka": 35,
      "ekspres do kawy": 20,
      "robot kuchenny": 25,
      "blender": 15,
      "sokowirówka": 15,
      "mikrofalówka": 20,
      "okap": 25,
      "inne AGD": 25
    },
    "builtInWorkTimes": {
      "demontaż": 8,
      "montaż": 8,
      "trudnaZabudowa": 25
    },
    "agdSpecializations": {
      "primaryCategory": "AGD",
      "devices": [
        {
          "type": "pralka",
          "brands": ["Samsung", "LG", "Bosch", "Siemens", "Whirlpool"],
          "experienceYears": 8,
          "level": "expert",
          "certifications": []
        },
        {
          "type": "lodówka",
          "brands": ["Samsung", "LG", "Bosch", "Whirlpool"],
          "experienceYears": 7,
          "level": "expert",
          "certifications": []
        },
        {
          "type": "zmywarka",
          "brands": ["Bosch", "Siemens", "Whirlpool", "Beko"],
          "experienceYears": 6,
          "level": "advanced",
          "certifications": []
        }
      ],
      "specialSkills": ["Diagnoza awarii", "Naprawa elektroniki", "Wymiana kompresorów"]
    },
    "serviceArea": {
      "primaryCity": "Warszawa",
      "radius": 40,
      "preferredDistricts": ["Mokotów", "Ursynów", "Wilanów", "Włochy"],
      "maxDistanceKm": 50,
      "avoidAreas": [],
      "travelTimePreference": "minimize"
    },
    "compensation": {
      "baseRate": {
        "type": "monthly",
        "amount": 6500,
        "currency": "PLN"
      },
      "paymentMethods": {
        "cash": true,
        "card": true,
        "transfer": true
      },
      "bonusStructure": {
        "perRepair": 50,
        "perDiagnosis": 30,
        "qualityBonus": 500,
        "overtimeRate": 1.5
      },
      "earnings": {
        "total": 0,
        "thisMonth": 0,
        "lastMonth": 0,
        "unpaid": 0
      },
      "paymentHistory": [],
      "settings": {
        "autoCalculate": true,
        "taxRate": 0,
        "socialContributions": 0
      }
    },
    "passwordHash": "$2b$10$K7L/ypJmIEWmZxP6VK0nMOQxXf2WQYF3uT5VZzQ8LJnPxR7YkM2Dm",
    "loginToken": "mario_token_2025_secure_abc123xyz",
    "passwordSetAt": "2025-10-05T12:00:00.000Z",
    "lastLogin": null,
    "failedLoginAttempts": 0,
    "isLocked": false,
    "requirePasswordChange": false,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-10-05T12:00:00.000Z"
  },
  {
    "id": "emp_002",
    "name": "Marius Bielaszka",
    "email": "marius.bielaszka@techserwis.pl",
    "phone": "+48 602 345 678",
    "address": "Warszawa",
    "workingHours": "9:00-17:00",
    "experience": "5 lat",
    "isActive": true,
    "role": "Serwisant",
    "specializations": ["Serwis AGD", "Piekarniki", "Płyty indukcyjne", "Kuchenki", "Okapy"],
    "repairTimes": {
      "pralka": 35,
      "lodówka": 45,
      "zmywarka": 40,
      "piekarnik": 35,
      "kuchenka": 35,
      "płyta indukcyjna": 30,
      "suszarka": 40,
      "pralko-suszarka": 50,
      "zamrażarka": 45,
      "ekspres do kawy": 30,
      "robot kuchenny": 35,
      "blender": 25,
      "sokowirówka": 25,
      "mikrofalówka": 30,
      "okap": 25,
      "inne AGD": 35
    },
    "builtInWorkTimes": {
      "demontaż": 10,
      "montaż": 10,
      "trudnaZabudowa": 30
    },
    "agdSpecializations": {
      "primaryCategory": "AGD",
      "devices": [
        {
          "type": "piekarnik",
          "brands": ["Bosch", "Siemens", "Electrolux", "Amica"],
          "experienceYears": 5,
          "level": "advanced",
          "certifications": []
        },
        {
          "type": "płyta indukcyjna",
          "brands": ["Bosch", "Siemens", "Electrolux"],
          "experienceYears": 5,
          "level": "advanced",
          "certifications": []
        },
        {
          "type": "kuchenka",
          "brands": ["Bosch", "Amica", "Beko"],
          "experienceYears": 4,
          "level": "advanced",
          "certifications": []
        },
        {
          "type": "okap",
          "brands": ["Bosch", "Siemens", "Electrolux"],
          "experienceYears": 3,
          "level": "beginner",
          "certifications": []
        }
      ],
      "specialSkills": ["Naprawa płyt elektronicznych", "Wymiana grzałek", "Serwis okapów"]
    },
    "serviceArea": {
      "primaryCity": "Warszawa",
      "radius": 35,
      "preferredDistricts": ["Śródmieście", "Wola", "Ochota", "Bemowo"],
      "maxDistanceKm": 45,
      "avoidAreas": [],
      "travelTimePreference": "minimize"
    },
    "compensation": {
      "baseRate": {
        "type": "monthly",
        "amount": 5500,
        "currency": "PLN"
      },
      "paymentMethods": {
        "cash": true,
        "card": true,
        "transfer": true
      },
      "bonusStructure": {
        "perRepair": 40,
        "perDiagnosis": 25,
        "qualityBonus": 400,
        "overtimeRate": 1.5
      },
      "earnings": {
        "total": 0,
        "thisMonth": 0,
        "lastMonth": 0,
        "unpaid": 0
      },
      "paymentHistory": [],
      "settings": {
        "autoCalculate": true,
        "taxRate": 0,
        "socialContributions": 0
      }
    },
    "passwordHash": "$2b$10$Y8M/zpKnJFXnaQ7WL1oNPRyYg3XRZG4vU6Wa9M8KkoQyS8zlN3En",
    "loginToken": "marius_token_2025_secure_def456uvw",
    "passwordSetAt": "2025-10-05T12:00:00.000Z",
    "lastLogin": null,
    "failedLoginAttempts": 0,
    "isLocked": false,
    "requirePasswordChange": false,
    "createdAt": "2025-02-20T10:00:00.000Z",
    "updatedAt": "2025-10-05T12:00:00.000Z"
  }
];

const filePath = path.join(__dirname, 'data', 'employees.json');
fs.writeFileSync(filePath, JSON.stringify(employees, null, 2), 'utf8');
console.log('✅ Plik employees.json został utworzony poprawnie!');
console.log(`📁 Lokalizacja: ${filePath}`);
console.log(`👥 Liczba pracowników: ${employees.length}`);
employees.forEach(emp => {
  console.log(`   - ${emp.name} (${emp.id})`);
});
