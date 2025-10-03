// fix-visit-structure-in-szczegoly.js
// Poprawka: zamiana v.id na v.visitId w zlecenie-szczegoly.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages', 'zlecenie-szczegoly.js');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('🔧 Naprawa struktury wizyt w zlecenie-szczegoly.js...');

// Lista zamian do wykonania
const replacements = [
  // saveVisit function
  {
    from: `    const visitToSave = {
      ...newVisit,
      id: editingVisit?.id || Date.now(),`,
    to: `    const visitToSave = {
      ...newVisit,
      visitId: editingVisit?.visitId || \`VIS\${Date.now()}\`,`
  },
  {
    from: `      updatedVisits = visits.map(v => v.id === editingVisit.id ? visitToSave : v);`,
    to: `      updatedVisits = visits.map(v => v.visitId === editingVisit.visitId ? visitToSave : v);`
  },
  {
    from: `        setVisits(visits.filter(v => v.id !== visitToSave.id));`,
    to: `        setVisits(visits.filter(v => v.visitId !== visitToSave.visitId));`
  },
  
  // updateVisitStatus function
  {
    from: `    const visitToUpdate = visits.find(v => v.id === visitId);`,
    to: `    const visitToUpdate = visits.find(v => v.visitId === visitId);`
  },
  {
    from: `    const updatedVisits = visits.map(v => v.id === visitId ? updatedVisit : v);`,
    to: `    const updatedVisits = visits.map(v => v.visitId === visitId ? updatedVisit : v);`
  },
  
  // deleteVisit function
  {
    from: `    const visitToDelete = visits.find(v => v.id === visitId);`,
    to: `    const visitToDelete = visits.find(v => v.visitId === visitId);`
  },
  {
    from: `    const updatedVisits = visits.filter(v => v.id !== visitId);`,
    to: `    const updatedVisits = visits.filter(v => v.visitId !== visitId);`
  },
  
  // JSX rendering - key prop
  {
    from: `                  {visits.map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-4">`,
    to: `                  {visits.map((visit) => (
                    <div key={visit.visitId} className="border border-gray-200 rounded-lg p-4">`
  },
  
  // Buttons passing visitId
  {
    from: `                              onClick={() => updateVisitStatus(visit.id, 'in_progress', 'Wizyta rozpoczęta')}`,
    to: `                              onClick={() => updateVisitStatus(visit.visitId, 'in_progress', 'Wizyta rozpoczęta')}`
  },
  {
    from: `                              onClick={() => updateVisitStatus(visit.id, 'completed', 'Wizyta zakończona')}`,
    to: `                              onClick={() => updateVisitStatus(visit.visitId, 'completed', 'Wizyta zakończona')}`
  },
  {
    from: `                                  updateVisitStatus(visit.id, 'cancelled', 'Wizyta anulowana');`,
    to: `                                  updateVisitStatus(visit.visitId, 'cancelled', 'Wizyta anulowana');`
  },
  {
    from: `                            onClick={() => deleteVisit(visit.id)}`,
    to: `                            onClick={() => deleteVisit(visit.visitId)}`
  }
];

let changesCount = 0;

replacements.forEach((replacement, index) => {
  if (content.includes(replacement.from)) {
    content = content.replace(replacement.from, replacement.to);
    changesCount++;
    console.log(`✅ Zamiana ${index + 1} wykonana`);
  } else {
    console.log(`⚠️  Zamiana ${index + 1} - nie znaleziono tekstu`);
  }
});

// Zapisz
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`\n✅ Naprawiono ${changesCount} wystąpień`);
console.log(`✅ Plik zapisany: ${filePath}`);
