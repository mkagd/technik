# Multi-Device Visit Implementation - Detailed Plan

## 📋 Overview
This document outlines the implementation of multi-device visit support, allowing technicians to service multiple appliances (e.g., pralka + zmywarka) during a single visit with independent auto-filled data from scanned nameplates.

**Approach Selected**: Multi-Device Visit (Approach 1)
- 1 Order = 1 Visit = Multiple Devices
- Each device has its own scanned models and auto-filled data
- Single address, single technician trip

---

## 🎯 Current Structure (Single Device)

### Order Level (orders.json)
```json
{
  "id": "ORD2025000046",
  "clientId": "CLI2025000002",
  "clientName": "Anna Nowak",
  "clientAddress": "ul. Piłsudskiego 28, 39-200 Dębica",
  "deviceType": "Pralka",           // ← Single device at order level
  "brand": "Samsung",                // ← Single brand
  "model": "",                       // ← Single model
  "serialNumber": "",                // ← Single serial number
  "issueDescription": "nie działa",
  "status": "zaplanowane",
  "visits": [
    {
      "visitId": "VIS25280001",
      "type": "diagnosis",
      "technicianId": "EMP25189001",
      "models": [                    // ← All scanned models for this device
        {
          "id": 1759572426402,
          "brand": "Amica",
          "model": "61118E3.475eHTaKDp",
          "type": "Płyta indukcyjna",
          "serialNumber": "00175708335521"
        }
      ]
    }
  ]
}
```

**Problem**: Cannot handle 2+ devices in same visit (e.g., pralka + zmywarka)

---

## 🚀 New Structure (Multi-Device)

### Order with Devices Array
```json
{
  "id": "ORD2025000046",
  "clientId": "CLI2025000002",
  "clientName": "Anna Nowak",
  "clientAddress": "ul. Piłsudskiego 28, 39-200 Dębica",
  
  // ❌ OLD: Single device fields at order level (removed)
  // "deviceType": "Pralka",
  // "brand": "Samsung",
  // "model": "",
  // "serialNumber": "",
  
  // ✅ NEW: Multiple devices array
  "devices": [
    {
      "deviceIndex": 0,
      "deviceType": "Pralka",
      "brand": "Samsung",
      "model": "WW80J5556MA",
      "serialNumber": "SN123456789",
      "issueDescription": "nie wiruje",
      "status": "active"
    },
    {
      "deviceIndex": 1,
      "deviceType": "Zmywarka",
      "brand": "Bosch",
      "model": "SMS46KI01E",
      "serialNumber": "SN987654321",
      "issueDescription": "nie myje",
      "status": "active"
    }
  ],
  
  // General order description (optional, summarizes all devices)
  "issueDescription": "Pralka nie wiruje, zmywarka nie myje",
  
  "status": "zaplanowane",
  "visits": [
    {
      "visitId": "VIS25280001",
      "type": "diagnosis",
      "technicianId": "EMP25189001",
      
      // ✅ NEW: Models grouped by device
      "deviceModels": [
        {
          "deviceIndex": 0,  // Pralka
          "models": [
            {
              "id": 1759572426402,
              "brand": "Samsung",
              "model": "WW80J5556MA",
              "type": "Pralka",
              "serialNumber": "SN123456789",
              "source": "scanner"
            }
          ]
        },
        {
          "deviceIndex": 1,  // Zmywarka
          "models": [
            {
              "id": 1759572426403,
              "brand": "Bosch",
              "model": "SMS46KI01E",
              "type": "Zmywarka",
              "serialNumber": "SN987654321",
              "source": "scanner"
            }
          ]
        }
      ],
      
      // ❌ OLD: Flat models array (deprecated but kept for backward compatibility)
      "models": []
    }
  ]
}
```

---

## 📊 Data Schema Design

### Device Object Structure
```typescript
interface Device {
  deviceIndex: number;           // Unique index within order (0, 1, 2...)
  deviceType: string;            // "Pralka", "Zmywarka", "Lodówka", etc.
  brand: string;                 // "Samsung", "Bosch", etc.
  model: string;                 // Model number
  serialNumber: string;          // Serial number
  issueDescription: string;      // Issue specific to this device
  status: 'active' | 'removed';  // For soft delete
  notes?: string;                // Optional device-specific notes
  warrantyInfo?: {
    hasWarranty: boolean;
    warrantyExpiry?: string;
  };
}
```

### Visit Device Models Structure
```typescript
interface DeviceModels {
  deviceIndex: number;           // Links to devices[deviceIndex]
  models: Model[];               // Scanned models for this device
}

interface Model {
  id: number;
  brand: string;
  model: string;
  type: string;
  serialNumber: string;
  notes?: string;
  dateAdded: string;
  source: 'scanner' | 'manual';
  parts?: Part[];
}
```

---

## 🔄 Migration Strategy

### Phase 1: Backward Compatible Migration

**Goal**: Convert single-device orders to multi-device format without breaking existing code.

#### Migration Script Logic
```javascript
// migrate-to-multi-device.js

const fs = require('fs');
const path = require('path');

// Backup first
const backupPath = path.join(__dirname, 'data', `orders-backup-${Date.now()}.json`);
fs.copyFileSync(
  path.join(__dirname, 'data', 'orders.json'),
  backupPath
);
console.log(`✅ Backup created: ${backupPath}`);

// Load orders
const orders = JSON.parse(fs.readFileSync('./data/orders.json', 'utf-8'));

let migratedCount = 0;
let alreadyMigratedCount = 0;

orders.forEach((order) => {
  // Skip if already migrated
  if (order.devices && Array.isArray(order.devices)) {
    alreadyMigratedCount++;
    return;
  }

  // Create devices array from single device fields
  order.devices = [
    {
      deviceIndex: 0,
      deviceType: order.deviceType || '',
      brand: order.brand || '',
      model: order.model || '',
      serialNumber: order.serialNumber || '',
      issueDescription: order.issueDescription || '',
      status: 'active'
    }
  ];

  // Migrate visit models to deviceModels
  if (order.visits && Array.isArray(order.visits)) {
    order.visits.forEach((visit) => {
      if (visit.models && Array.isArray(visit.models)) {
        // Convert flat models array to deviceModels
        visit.deviceModels = [
          {
            deviceIndex: 0,
            models: visit.models
          }
        ];
        
        // Keep old models array for backward compatibility (empty it later)
        // visit.models = []; // Don't delete yet
      }
    });
  }

  // Keep old fields for backward compatibility during transition
  // Later we can remove: deviceType, brand, model, serialNumber
  
  migratedCount++;
});

// Save migrated data
fs.writeFileSync(
  path.join(__dirname, 'data', 'orders.json'),
  JSON.stringify(orders, null, 2)
);

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Migrated: ${migratedCount}`);
console.log(`   ⏭️  Already migrated: ${alreadyMigratedCount}`);
console.log(`   📁 Total orders: ${orders.length}`);
console.log(`\n💾 Backup location: ${backupPath}`);
```

#### Rollback Script
```javascript
// rollback-migration.js
const fs = require('fs');
const path = require('path');

// Find latest backup
const backupFiles = fs.readdirSync('./data')
  .filter(f => f.startsWith('orders-backup-'))
  .sort()
  .reverse();

if (backupFiles.length === 0) {
  console.error('❌ No backup found!');
  process.exit(1);
}

const latestBackup = backupFiles[0];
console.log(`🔄 Rolling back to: ${latestBackup}`);

fs.copyFileSync(
  path.join(__dirname, 'data', latestBackup),
  path.join(__dirname, 'data', 'orders.json')
);

console.log('✅ Rollback completed!');
```

---

## 🛠️ API Implementation

### 1. GET /api/technician/visits/[visitId] - Updated

**Goal**: Return visit data with devices array

```javascript
// pages/api/technician/visits/[visitId].js

async function handleGet(req, res, visitId) {
  const orders = await readOrders();
  
  let visit = null;
  let order = null;

  // Find order and visit
  for (const ord of orders) {
    if (ord.visits && Array.isArray(ord.visits)) {
      const foundVisit = ord.visits.find(v => v.visitId === visitId);
      if (foundVisit) {
        visit = foundVisit;
        order = ord;
        break;
      }
    }
  }

  if (!visit || !order) {
    return res.status(404).json({ 
      success: false, 
      message: 'Wizyta nie znaleziona' 
    });
  }

  // ✅ NEW: Include devices array in response
  const response = {
    success: true,
    visit: {
      ...visit,
      orderId: order.id,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      clientAddress: order.clientAddress,
      
      // ✅ NEW: Add devices array
      devices: order.devices || [],
      
      // ⚠️ DEPRECATED: Keep for backward compatibility
      deviceType: order.deviceType || '',
      brand: order.brand || '',
      model: order.model || '',
      serialNumber: order.serialNumber || ''
    }
  };

  return res.status(200).json(response);
}
```

### 2. PUT /api/technician/visits/[visitId] - Updated for Multi-Device

**Goal**: Update specific device when scanning nameplate

```javascript
async function handlePut(req, res, visitId) {
  const { 
    models,           // Scanned models array
    deviceIndex,      // ✅ NEW: Which device to update (0, 1, 2...)
    ...otherUpdates 
  } = req.body;

  const orders = await readOrders();
  
  // Find order and visit
  let targetOrder = null;
  let targetVisit = null;
  let orderIndex = -1;

  for (let i = 0; i < orders.length; i++) {
    if (orders[i].visits) {
      const visitIndex = orders[i].visits.findIndex(v => v.visitId === visitId);
      if (visitIndex !== -1) {
        targetOrder = orders[i];
        targetVisit = orders[i].visits[visitIndex];
        orderIndex = i;
        break;
      }
    }
  }

  if (!targetOrder || !targetVisit) {
    return res.status(404).json({ 
      success: false, 
      message: 'Wizyta nie znaleziona' 
    });
  }

  // ✅ NEW: Handle models update for specific device
  if (models && Array.isArray(models) && typeof deviceIndex === 'number') {
    console.log(`📱 Updating models for device ${deviceIndex}`);
    
    // Initialize deviceModels if doesn't exist
    if (!targetVisit.deviceModels) {
      targetVisit.deviceModels = [];
    }

    // Find or create device models entry
    let deviceModelsEntry = targetVisit.deviceModels.find(
      dm => dm.deviceIndex === deviceIndex
    );

    if (!deviceModelsEntry) {
      deviceModelsEntry = {
        deviceIndex: deviceIndex,
        models: []
      };
      targetVisit.deviceModels.push(deviceModelsEntry);
    }

    // Update models for this device
    deviceModelsEntry.models = models;

    // ✅ AUTO-FILL: Update device fields from first scanned model
    if (models.length > 0 && targetOrder.devices && targetOrder.devices[deviceIndex]) {
      const firstModel = models[0];
      const device = targetOrder.devices[deviceIndex];
      
      console.log(`🔍 Auto-fill check for device ${deviceIndex}:`);
      
      // Update device fields if empty
      if (!device.deviceType || device.deviceType === 'Nieznany' || device.deviceType === 'Brak') {
        device.deviceType = firstModel.type || device.deviceType;
        console.log(`   ✅ deviceType: ${device.deviceType}`);
      }
      
      if (!device.brand || device.brand === 'Nieznany' || device.brand === 'Brak') {
        device.brand = firstModel.brand || device.brand;
        console.log(`   ✅ brand: ${device.brand}`);
      }
      
      if (!device.model || device.model === 'Nieznany' || device.model === 'Brak') {
        device.model = firstModel.model || device.model;
        console.log(`   ✅ model: ${device.model}`);
      }
      
      if (!device.serialNumber || device.serialNumber === 'Nieznany' || device.serialNumber === 'Brak') {
        device.serialNumber = firstModel.serialNumber || device.serialNumber;
        console.log(`   ✅ serialNumber: ${device.serialNumber}`);
      }
    }

    targetVisit.updatedAt = new Date().toISOString();
    targetOrder.updatedAt = new Date().toISOString();
  }

  // Handle other updates...
  // (existing code for notes, photos, status, etc.)

  // Save
  await writeOrders(orders);

  return res.status(200).json({
    success: true,
    message: 'Wizyta zaktualizowana',
    visit: targetVisit
  });
}
```

---

## 🎨 Frontend Implementation

### 1. Technician Visit Page - Device Selector

**File**: `pages/technician/visit/[visitId].js`

```javascript
import { useState, useEffect } from 'react';
import ModelManagerModal from '@/components/ModelManagerModal';

export default function TechnicianVisitPage() {
  const [visitData, setVisitData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [showModelScanner, setShowModelScanner] = useState(false);

  useEffect(() => {
    loadVisitDetails();
  }, []);

  async function loadVisitDetails() {
    const res = await fetch(`/api/technician/visits/${visitId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('technicianToken')}`
      }
    });
    
    const data = await res.json();
    if (data.success) {
      setVisitData(data.visit);
      setDevices(data.visit.devices || []);
    }
  }

  async function handleSaveModels(models) {
    const res = await fetch(`/api/technician/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('technicianToken')}`
      },
      body: JSON.stringify({
        models: models,
        deviceIndex: selectedDeviceIndex  // ✅ NEW: Specify which device
      })
    });

    if (res.ok) {
      alert(`✅ Modele zapisane dla urządzenia ${selectedDeviceIndex + 1}`);
      loadVisitDetails();  // Refresh data
      setShowModelScanner(false);
    }
  }

  // Get models for currently selected device
  const currentDeviceModels = visitData?.deviceModels?.find(
    dm => dm.deviceIndex === selectedDeviceIndex
  )?.models || [];

  return (
    <div className="p-4">
      <h1>Wizyta {visitData?.visitId}</h1>

      {/* ✅ NEW: Device Tabs/Selector */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Urządzenia</h2>
        <div className="flex gap-2 mb-4">
          {devices.map((device, index) => (
            <button
              key={index}
              onClick={() => setSelectedDeviceIndex(index)}
              className={`px-4 py-2 rounded ${
                selectedDeviceIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {device.deviceType || `Urządzenie ${index + 1}`}
            </button>
          ))}
        </div>

        {/* Current device details */}
        {devices[selectedDeviceIndex] && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-xl mb-2">
              {devices[selectedDeviceIndex].deviceType}
            </h3>
            <p><strong>Marka:</strong> {devices[selectedDeviceIndex].brand || '—'}</p>
            <p><strong>Model:</strong> {devices[selectedDeviceIndex].model || '—'}</p>
            <p><strong>Nr seryjny:</strong> {devices[selectedDeviceIndex].serialNumber || '—'}</p>
            <p><strong>Opis problemu:</strong> {devices[selectedDeviceIndex].issueDescription}</p>

            {/* Scanned models for this device */}
            <div className="mt-4">
              <h4 className="font-semibold">Zeskanowane modele ({currentDeviceModels.length})</h4>
              {currentDeviceModels.map((model, idx) => (
                <div key={idx} className="bg-gray-50 p-2 mt-2 rounded">
                  <p>{model.brand} {model.model}</p>
                  <p className="text-sm text-gray-600">S/N: {model.serialNumber}</p>
                </div>
              ))}
            </div>

            {/* Scan button */}
            <button
              onClick={() => setShowModelScanner(true)}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            >
              📸 Skanuj tabliczkę urządzenia
            </button>
          </div>
        )}
      </div>

      {/* Model Scanner Modal */}
      {showModelScanner && (
        <ModelManagerModal
          isOpen={showModelScanner}
          onClose={() => setShowModelScanner(false)}
          onSave={handleSaveModels}
          initialModels={currentDeviceModels}
          title={`Skanuj: ${devices[selectedDeviceIndex]?.deviceType}`}
        />
      )}
    </div>
  );
}
```

---

### 2. Admin Panel - Device Management UI

**File**: `pages/admin/orders/new.js` (or edit page)

```javascript
export default function NewOrderPage() {
  const [devices, setDevices] = useState([
    {
      deviceIndex: 0,
      deviceType: '',
      brand: '',
      model: '',
      serialNumber: '',
      issueDescription: '',
      status: 'active'
    }
  ]);

  function addDevice() {
    setDevices([
      ...devices,
      {
        deviceIndex: devices.length,
        deviceType: '',
        brand: '',
        model: '',
        serialNumber: '',
        issueDescription: '',
        status: 'active'
      }
    ]);
  }

  function removeDevice(index) {
    if (devices.length === 1) {
      alert('Musi być przynajmniej jedno urządzenie!');
      return;
    }
    
    const updated = devices.filter((_, i) => i !== index);
    // Re-index
    updated.forEach((dev, i) => {
      dev.deviceIndex = i;
    });
    setDevices(updated);
  }

  function updateDevice(index, field, value) {
    const updated = [...devices];
    updated[index][field] = value;
    setDevices(updated);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Client info fields... */}

      {/* ✅ NEW: Devices Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Urządzenia</h2>
          <button
            type="button"
            onClick={addDevice}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Dodaj urządzenie
          </button>
        </div>

        {devices.map((device, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Urządzenie {index + 1}</h3>
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDevice(index)}
                  className="text-red-600"
                >
                  🗑️ Usuń
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Typ urządzenia</label>
                <select
                  value={device.deviceType}
                  onChange={(e) => updateDevice(index, 'deviceType', e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Wybierz...</option>
                  <option value="Pralka">Pralka</option>
                  <option value="Zmywarka">Zmywarka</option>
                  <option value="Lodówka">Lodówka</option>
                  <option value="Piekarnik">Piekarnik</option>
                  <option value="Płyta indukcyjna">Płyta indukcyjna</option>
                  {/* ... */}
                </select>
              </div>

              <div>
                <label>Marka</label>
                <input
                  type="text"
                  value={device.brand}
                  onChange={(e) => updateDevice(index, 'brand', e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label>Model</label>
                <input
                  type="text"
                  value={device.model}
                  onChange={(e) => updateDevice(index, 'model', e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label>Numer seryjny</label>
                <input
                  type="text"
                  value={device.serialNumber}
                  onChange={(e) => updateDevice(index, 'serialNumber', e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>

              <div className="col-span-2">
                <label>Opis problemu</label>
                <textarea
                  value={device.issueDescription}
                  onChange={(e) => updateDevice(index, 'issueDescription', e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
        Utwórz zamówienie
      </button>
    </form>
  );
}
```

---

## ✅ Testing Plan

### Test Scenario 1: Migration Verification
1. ✅ Backup current orders.json
2. ✅ Run migration script
3. ✅ Verify all orders have `devices` array
4. ✅ Verify deviceModels structure in visits
5. ✅ Check backward compatibility (old fields still present)
6. ✅ Test rollback script works

### Test Scenario 2: Single Device (Backward Compatibility)
1. ✅ View existing order with 1 device
2. ✅ Scan nameplate for device 0
3. ✅ Verify auto-fill updates devices[0]
4. ✅ Verify models saved to deviceModels[0]

### Test Scenario 3: Multi-Device Visit
1. ✅ Create new order with 2 devices (Pralka + Zmywarka)
2. ✅ Assign technician, create visit
3. ✅ Open visit in technician panel
4. ✅ Select device 0 (Pralka), scan nameplate
5. ✅ Verify auto-fill updates only Pralka fields
6. ✅ Switch to device 1 (Zmywarka), scan nameplate
7. ✅ Verify auto-fill updates only Zmywarka fields
8. ✅ Verify both devices have independent scanned models

### Test Scenario 4: Admin Device Management
1. ✅ Create order with 1 device
2. ✅ Click "Add Device" button
3. ✅ Fill details for device 2
4. ✅ Save order
5. ✅ Verify devices array has 2 entries
6. ✅ Edit order, remove device 2
7. ✅ Verify device removed (or status='removed')

---

## 📦 Implementation Checklist

### Phase 1: Data Migration (Days 1-2)
- [ ] Create backup system
- [ ] Write migration script
- [ ] Write rollback script
- [ ] Test on copy of orders.json
- [ ] Run migration on production data
- [ ] Verify data integrity

### Phase 2: Backend API (Days 3-4)
- [ ] Update GET /api/technician/visits/[visitId]
  - [ ] Add devices array to response
  - [ ] Keep old fields for compatibility
- [ ] Update PUT /api/technician/visits/[visitId]
  - [ ] Add deviceIndex parameter
  - [ ] Update deviceModels structure
  - [ ] Implement per-device auto-fill
- [ ] Test API with Postman/curl

### Phase 3: Technician Frontend (Days 5-6)
- [ ] Update visit page UI
  - [ ] Add device selector/tabs
  - [ ] Show current device details
  - [ ] Display device-specific models
- [ ] Update ModelManagerModal integration
  - [ ] Pass deviceIndex to API
  - [ ] Update modal title with device name
- [ ] Test scanning for multiple devices
- [ ] Verify auto-fill works independently

### Phase 4: Admin Frontend (Days 7-8)
- [ ] Update order creation form
  - [ ] Add device management UI
  - [ ] Add/remove device buttons
  - [ ] Device-specific fields
- [ ] Update order edit form
  - [ ] Support adding devices to existing orders
  - [ ] Support removing devices
- [ ] Update order list/details views
  - [ ] Display devices count
  - [ ] Show all devices in order details

### Phase 5: Testing & Documentation (Days 9-10)
- [ ] Run all test scenarios
- [ ] Fix bugs found during testing
- [ ] Update user documentation
- [ ] Train admin users on multi-device feature
- [ ] Train technicians on device selector
- [ ] Deploy to production

---

## 🔧 Troubleshooting

### Issue: Old models array conflicts with deviceModels
**Solution**: Keep both during transition, prioritize deviceModels in UI

### Issue: Device index mismatch after deletion
**Solution**: Use soft delete (status='removed') or re-index on removal

### Issue: Technician confused by device selector
**Solution**: Add visual indicators (icons, colors), default to first device

### Issue: Auto-fill overwrites manually entered data
**Solution**: Check for empty/"Nieznany"/"Brak" before updating (already implemented)

---

## 📈 Future Enhancements

1. **Device Templates**: Pre-fill common device combinations (kuchnia = piekarnik + płyta)
2. **Device Photos**: Separate photos per device
3. **Device Status Tracking**: Track repair status per device independently
4. **Bulk Operations**: Mark all devices as completed at once
5. **Device History**: Track which devices serviced in past visits

---

## 🎉 Benefits

✅ **For Technicians**:
- Scan multiple devices in one visit
- Auto-fill works per device
- Clear device organization
- Faster data entry

✅ **For Admins**:
- Create multi-device orders easily
- Better tracking of services
- More accurate reporting

✅ **For Business**:
- Reduced travel costs (1 visit for 2+ devices)
- Better resource utilization
- Improved customer satisfaction
- More revenue per visit

---

**Status**: 🚧 Ready to implement
**Estimated Time**: 10 days
**Priority**: High
**Dependencies**: None (backward compatible)
