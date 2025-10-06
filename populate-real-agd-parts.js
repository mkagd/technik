// populate-real-agd-parts.js
// Skrypt do wypełnienia magazynu prawdziwymi częściami AGD

const fs = require('fs');
const path = require('path');

const partsInventoryPath = path.join(__dirname, 'data', 'parts-inventory.json');

// Prawdziwe części zamienne do AGD z kodami producentów
const realParts = [
  // ==================== LODÓWKI ====================
  {
    id: "PART-LOD-001",
    name: "Termostat lodówki Ranco K59-L1287",
    partNumber: "K59-L1287",
    category: "AGD",
    subcategory: "Lodówka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/t/e/termostat-k59-l1287-ranco_1.jpg",
    compatibleBrands: ["Whirlpool", "Indesit", "Hotpoint", "Ariston", "Bauknecht"],
    compatibleModels: ["universal"],
    description: "Termostat Ranco K59-L1287 do lodówek i zamrażarek. Oryginalny termostat mechaniczny z kapilarą 900mm. Gwarancja 24 miesiące.",
    specifications: {
      manufacturer: "Ranco",
      capillaryLength: "900mm",
      connectionType: "6.3mm faston",
      temperatureRange: "-35°C do +5°C",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 75.00,
      wholesalePrice: 58.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 15,
      minStock: 5,
      maxStock: 30,
      reserved: 2,
      available: 13
    },
    supplier: {
      name: "North Polska",
      supplierCode: "NORTH-RANCO-001",
      contactInfo: {
        phone: "+48 22 123 45 67",
        email: "zamowienia@north.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 45,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nasadowy 8mm", "Multimetr"]
    }
  },
  {
    id: "PART-LOD-002",
    name: "Uszczelka drzwi lodówki Gorenje 616254",
    partNumber: "616254",
    category: "AGD",
    subcategory: "Lodówka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/u/s/uszczelka-gorenje-616254_1.jpg",
    compatibleBrands: ["Gorenje", "Amica", "Hisense"],
    compatibleModels: ["RK6192", "RK6191", "NRK6192", "NRK6191"],
    description: "Oryginalna uszczelka magnetyczna do drzwi lodówki Gorenje. Wymiary: 570x1210mm. Kolor biały. Montaż bez klejenia.",
    specifications: {
      dimensions: "570x1210mm",
      color: "biały",
      material: "PVC + magnes",
      mountingType: "wpinany",
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 145.00,
      wholesalePrice: 112.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 8,
      minStock: 3,
      maxStock: 15,
      reserved: 1,
      available: 7
    },
    supplier: {
      name: "Gorenje Service",
      supplierCode: "GOR-616254",
      contactInfo: {
        phone: "+48 22 333 44 55",
        email: "service@gorenje.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 30,
      requiredTools: ["Suszarka (opcjonalnie)", "Szpatułka plastikowa"]
    }
  },
  {
    id: "PART-LOD-003",
    name: "Dmuchawa wentylatora No Frost Samsung DA31-00146E",
    partNumber: "DA31-00146E",
    category: "AGD",
    subcategory: "Lodówka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/d/a/da31-00146e-samsung_1.jpg",
    compatibleBrands: ["Samsung"],
    compatibleModels: ["RL56", "RB31", "RB33", "RL60", "RB37"],
    description: "Oryginalny wentylator No Frost do lodówek Samsung Side by Side. Napięcie 12V DC, moc 2.5W. Kompletny z obudową.",
    specifications: {
      voltage: "12V DC",
      power: "2.5W",
      dimensions: "92x92x25mm",
      motorType: "DC bezszczotkowy",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 125.00,
      wholesalePrice: 95.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 12,
      minStock: 4,
      maxStock: 20,
      reserved: 0,
      available: 12
    },
    supplier: {
      name: "Samsung Parts",
      supplierCode: "SAM-DA31-00146E",
      contactInfo: {
        phone: "+48 22 777 88 99",
        email: "parts@samsung.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 60,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nasadowy 8mm", "Multimetr"]
    }
  },
  {
    id: "PART-LOD-004",
    name: "Półka szklana do lodówki Whirlpool 481245088142",
    partNumber: "481245088142",
    category: "AGD",
    subcategory: "Lodówka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/4/8/481245088142-whirlpool_1.jpg",
    compatibleBrands: ["Whirlpool", "Bauknecht", "Ignis", "IKEA"],
    compatibleModels: ["ART", "ARG", "WBA", "WBE"],
    description: "Oryginalna półka szklana z ramką plastikową do lodówek Whirlpool. Wymiary: 490x320mm, szkło hartowane 4mm.",
    specifications: {
      dimensions: "490x320mm",
      glassThickness: "4mm",
      material: "Szkło hartowane + ramka ABS",
      loadCapacity: "15kg",
      warranty: "6 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 89.00,
      wholesalePrice: 68.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 6,
      minStock: 2,
      maxStock: 12,
      reserved: 1,
      available: 5
    },
    supplier: {
      name: "Whirlpool Service",
      supplierCode: "WP-481245088142",
      contactInfo: {
        phone: "+48 22 555 66 77",
        email: "service@whirlpool.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 5,
      requiredTools: ["Brak - montaż ręczny"]
    }
  },
  {
    id: "PART-LOD-005",
    name: "Filtr wody do lodówki Samsung DA29-00020B",
    partNumber: "DA29-00020B",
    category: "AGD",
    subcategory: "Lodówka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/d/a/da29-00020b-samsung_1.jpg",
    compatibleBrands: ["Samsung"],
    compatibleModels: ["RS", "RSH", "RSA", "RSG", "RFG"],
    description: "Oryginalny filtr wody HAF-CIN do lodówek Samsung z dystrybutorem wody. Usuwa chlor, pestycydy, bakterie. Żywotność 6 miesięcy.",
    specifications: {
      filterType: "HAF-CIN",
      lifespan: "6 miesięcy / 1500L",
      filtrationLevel: "0.5 mikronów",
      removes: "Chlor, pestycydy, bakterie, rdza",
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 165.00,
      wholesalePrice: 128.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 20,
      minStock: 8,
      maxStock: 40,
      reserved: 3,
      available: 17
    },
    supplier: {
      name: "Samsung Parts",
      supplierCode: "SAM-DA29-00020B",
      contactInfo: {
        phone: "+48 22 777 88 99",
        email: "parts@samsung.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 10,
      requiredTools: ["Brak - montaż ręczny"]
    }
  },

  // ==================== ZMYWARKI ====================
  {
    id: "PART-ZMY-001",
    name: "Pompa odpływowa do zmywarki Askoll M224 XP",
    partNumber: "M224XP",
    category: "AGD",
    subcategory: "Zmywarka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/a/s/askoll-m224xp_1.jpg",
    compatibleBrands: ["Bosch", "Siemens", "Neff", "Gaggenau"],
    compatibleModels: ["universal"],
    description: "Oryginalna pompa odpływowa Askoll M224 XP. Moc 30W, 220-240V. Pasuje do większości zmywarek Bosch/Siemens. Gwarancja 24 miesiące.",
    specifications: {
      manufacturer: "Askoll",
      power: "30W",
      voltage: "220-240V 50Hz",
      pumpType: "Synchroniczny",
      connectionType: "Faston 6.3mm",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 135.00,
      wholesalePrice: 105.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 18,
      minStock: 6,
      maxStock: 30,
      reserved: 2,
      available: 16
    },
    supplier: {
      name: "North Polska",
      supplierCode: "NORTH-ASKOLL-M224",
      contactInfo: {
        phone: "+48 22 123 45 67",
        email: "zamowienia@north.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 45,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nasadowy 10mm", "Multimetr", "Szczypce"]
    }
  },
  {
    id: "PART-ZMY-002",
    name: "Ramię spryskujące górne Bosch 00289859",
    partNumber: "00289859",
    category: "AGD",
    subcategory: "Zmywarka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/0/0/00289859-bosch_1.jpg",
    compatibleBrands: ["Bosch", "Siemens", "Neff", "Constructa"],
    compatibleModels: ["SMS", "SBV", "SPV", "SPS", "SN", "SX"],
    description: "Oryginalne ramię spryskujące górne do zmywarek Bosch i Siemens. Kompletne z dyszami i kołpakiem. Średnica 420mm.",
    specifications: {
      diameter: "420mm",
      nozzlesCount: 8,
      mountingType: "Click-on",
      material: "Tworzywo PP",
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 95.00,
      wholesalePrice: 72.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 10,
      minStock: 4,
      maxStock: 20,
      reserved: 1,
      available: 9
    },
    supplier: {
      name: "BSH Service",
      supplierCode: "BSH-00289859",
      contactInfo: {
        phone: "+48 22 444 55 66",
        email: "service@bshg.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 10,
      requiredTools: ["Brak - montaż ręczny"]
    }
  },
  {
    id: "PART-ZMY-003",
    name: "Kosz dolny do zmywarki Electrolux 1524746409",
    partNumber: "1524746409",
    category: "AGD",
    subcategory: "Zmywarka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/1/5/1524746409-electrolux_1.jpg",
    compatibleBrands: ["Electrolux", "AEG", "Zanussi"],
    compatibleModels: ["ESF", "ESI", "ESL", "ZDF", "ZDI"],
    description: "Oryginalny kosz dolny do zmywarki Electrolux/AEG. Kompletny z kółkami i uchwytem. Wymiary: 470x500x120mm.",
    specifications: {
      dimensions: "470x500x120mm",
      material: "Stal nierdzewna powlekana",
      wheelsIncluded: true,
      adjustableHeight: false,
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 245.00,
      wholesalePrice: 189.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 5,
      minStock: 2,
      maxStock: 10,
      reserved: 0,
      available: 5
    },
    supplier: {
      name: "Electrolux Service",
      supplierCode: "ELX-1524746409",
      contactInfo: {
        phone: "+48 22 666 77 88",
        email: "service@electrolux.pl"
      },
      deliveryTime: "72h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 5,
      requiredTools: ["Brak - montaż ręczny"]
    }
  },
  {
    id: "PART-ZMY-004",
    name: "Elektrozawór dopływu wody Whirlpool 481228128468",
    partNumber: "481228128468",
    category: "AGD",
    subcategory: "Zmywarka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/4/8/481228128468-whirlpool_1.jpg",
    compatibleBrands: ["Whirlpool", "Bauknecht", "Ignis", "IKEA"],
    compatibleModels: ["ADG", "ADP", "WFC", "DWF"],
    description: "Oryginalny elektrozawór 2-drożny do zmywarek Whirlpool. Napięcie 220-240V, przyłącze 3/4 cala. Gwarancja 24 miesiące.",
    specifications: {
      voltage: "220-240V 50Hz",
      outlets: 2,
      connectionThread: "3/4 cala",
      pressure: "0.1-1.0 MPa",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 115.00,
      wholesalePrice: 88.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 14,
      minStock: 5,
      maxStock: 25,
      reserved: 2,
      available: 12
    },
    supplier: {
      name: "Whirlpool Service",
      supplierCode: "WP-481228128468",
      contactInfo: {
        phone: "+48 22 555 66 77",
        email: "service@whirlpool.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 40,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nastawny", "Multimetr"]
    }
  },
  {
    id: "PART-ZMY-005",
    name: "Uszczelka drzwi zmywarki Bosch 00754869",
    partNumber: "00754869",
    category: "AGD",
    subcategory: "Zmywarka",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/0/0/00754869-bosch_1.jpg",
    compatibleBrands: ["Bosch", "Siemens", "Neff"],
    compatibleModels: ["SMS", "SBV", "SPV", "SN", "SX"],
    description: "Oryginalna uszczelka drzwi do zmywarek Bosch/Siemens. Materiał elastyczny, odporny na detergenty. Długość 2000mm.",
    specifications: {
      length: "2000mm",
      material: "TPE (elastomer termoplastyczny)",
      color: "szary",
      temperatureResistance: "-20°C do +80°C",
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 65.00,
      wholesalePrice: 48.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 22,
      minStock: 8,
      maxStock: 40,
      reserved: 3,
      available: 19
    },
    supplier: {
      name: "BSH Service",
      supplierCode: "BSH-00754869",
      contactInfo: {
        phone: "+48 22 444 55 66",
        email: "service@bshg.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 20,
      requiredTools: ["Suszarka", "Szpatułka plastikowa"]
    }
  },

  // ==================== PIEKARNIKI ====================
  {
    id: "PART-PIE-001",
    name: "Grzałka górna piekarnika Bosch 00471375",
    partNumber: "00471375",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/0/0/00471375-bosch_1.jpg",
    compatibleBrands: ["Bosch", "Siemens", "Neff", "Constructa"],
    compatibleModels: ["HBA", "HBN", "HB", "HE", "HS"],
    description: "Oryginalna grzałka górna do piekarników Bosch/Siemens. Moc 1400W, długość 385mm. Gwarancja 24 miesiące.",
    specifications: {
      power: "1400W",
      voltage: "220-240V",
      length: "385mm",
      heatingElement: "Ni-Cr",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 155.00,
      wholesalePrice: 119.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 12,
      minStock: 4,
      maxStock: 20,
      reserved: 1,
      available: 11
    },
    supplier: {
      name: "BSH Service",
      supplierCode: "BSH-00471375",
      contactInfo: {
        phone: "+48 22 444 55 66",
        email: "service@bshg.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 45,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nasadowy 8mm", "Multimetr", "Rękawice izolacyjne"]
    }
  },
  {
    id: "PART-PIE-002",
    name: "Termostat bezpieczeństwa piekarnika EGO 55.17059.180",
    partNumber: "55.17059.180",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/g/ego-55-17059-180_1.jpg",
    compatibleBrands: ["Electrolux", "AEG", "Zanussi", "Whirlpool", "Indesit"],
    compatibleModels: ["universal"],
    description: "Oryginalny termostat bezpieczeństwa EGO. Temperatura wyłączenia 245°C, automatyczny reset. Uniwersalny montaż.",
    specifications: {
      manufacturer: "EGO",
      cutoffTemperature: "245°C",
      resetType: "Automatyczny",
      capillaryLength: "1150mm",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 85.00,
      wholesalePrice: 65.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 16,
      minStock: 6,
      maxStock: 30,
      reserved: 2,
      available: 14
    },
    supplier: {
      name: "North Polska",
      supplierCode: "NORTH-EGO-180",
      contactInfo: {
        phone: "+48 22 123 45 67",
        email: "zamowienia@north.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 35,
      requiredTools: ["Śrubokręt krzyżakowy", "Multimetr", "Rękawice izolacyjne"]
    }
  },
  {
    id: "PART-PIE-003",
    name: "Szyba wewnętrzna drzwi piekarnika Whirlpool 481244019316",
    partNumber: "481244019316",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/4/8/481244019316-whirlpool_1.jpg",
    compatibleBrands: ["Whirlpool", "Bauknecht", "Ignis", "IKEA"],
    compatibleModels: ["AKP", "AKZM", "AKZ", "OBI"],
    description: "Oryginalna szyba wewnętrzna do piekarników Whirlpool. Szkło hartowane, odporność do 300°C. Wymiary: 410x335mm.",
    specifications: {
      dimensions: "410x335mm",
      thickness: "4mm",
      material: "Szkło hartowane termoodporne",
      temperatureResistance: "300°C",
      warranty: "6 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 125.00,
      wholesalePrice: 95.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 7,
      minStock: 3,
      maxStock: 15,
      reserved: 0,
      available: 7
    },
    supplier: {
      name: "Whirlpool Service",
      supplierCode: "WP-481244019316",
      contactInfo: {
        phone: "+48 22 555 66 77",
        email: "service@whirlpool.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 25,
      requiredTools: ["Śrubokręt krzyżakowy"]
    }
  },
  {
    id: "PART-PIE-004",
    name: "Wentylator chłodzenia piekarnika Samsung DG31-00005A",
    partNumber: "DG31-00005A",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/d/g/dg31-00005a-samsung_1.jpg",
    compatibleBrands: ["Samsung"],
    compatibleModels: ["NV", "BQ", "NQ"],
    description: "Oryginalny wentylator chłodzenia obudowy do piekarników Samsung. Moc 25W, 220-240V. Kompletny z osłoną.",
    specifications: {
      power: "25W",
      voltage: "220-240V 50Hz",
      diameter: "120mm",
      airflow: "85 m³/h",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 145.00,
      wholesalePrice: 112.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 9,
      minStock: 3,
      maxStock: 18,
      reserved: 1,
      available: 8
    },
    supplier: {
      name: "Samsung Parts",
      supplierCode: "SAM-DG31-00005A",
      contactInfo: {
        phone: "+48 22 777 88 99",
        email: "parts@samsung.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 40,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nasadowy 8mm", "Multimetr"]
    }
  },
  {
    id: "PART-PIE-005",
    name: "Uszczelka drzwi piekarnika Gorenje 617468",
    partNumber: "617468",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/6/1/617468-gorenje_1.jpg",
    compatibleBrands: ["Gorenje", "Amica"],
    compatibleModels: ["BO", "BC", "BI", "BPS"],
    description: "Oryginalna uszczelka drzwi piekarnika Gorenje. Materiał termoizolacyjny, odporność do 300°C. Długość 3000mm.",
    specifications: {
      length: "3000mm",
      width: "15mm",
      material: "Włókno szklane + silikon",
      temperatureResistance: "300°C",
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 75.00,
      wholesalePrice: 58.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 18,
      minStock: 6,
      maxStock: 30,
      reserved: 2,
      available: 16
    },
    supplier: {
      name: "Gorenje Service",
      supplierCode: "GOR-617468",
      contactInfo: {
        phone: "+48 22 333 44 55",
        email: "service@gorenje.pl"
      },
      deliveryTime: "48h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 30,
      requiredTools: ["Szpatułka", "Klej wysokotemperaturowy"]
    }
  },
  {
    id: "PART-PIE-006",
    name: "Grzałka dolna piekarnika Electrolux 3872108503",
    partNumber: "3872108503",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/3/8/3872108503-electrolux_1.jpg",
    compatibleBrands: ["Electrolux", "AEG", "Zanussi"],
    compatibleModels: ["EOB", "EOC", "EZB", "ZOB"],
    description: "Oryginalna grzałka dolna do piekarników Electrolux/AEG. Moc 1200W, długość 400mm. Gwarancja 24 miesiące.",
    specifications: {
      power: "1200W",
      voltage: "220-240V",
      length: "400mm",
      heatingElement: "Ni-Cr",
      warranty: "24 miesiące",
      oem: true
    },
    pricing: {
      retailPrice: 135.00,
      wholesalePrice: 105.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 11,
      minStock: 4,
      maxStock: 20,
      reserved: 0,
      available: 11
    },
    supplier: {
      name: "Electrolux Service",
      supplierCode: "ELX-3872108503",
      contactInfo: {
        phone: "+48 22 666 77 88",
        email: "service@electrolux.pl"
      },
      deliveryTime: "72h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "medium",
      estimatedTime: 50,
      requiredTools: ["Śrubokręt krzyżakowy", "Klucz nasadowy 8mm", "Multimetr", "Rękawice izolacyjne"]
    }
  },
  {
    id: "PART-PIE-007",
    name: "Pokrętło programatora piekarnika Bosch 00614175",
    partNumber: "00614175",
    category: "AGD",
    subcategory: "Piekarnik",
    imageUrl: "https://north.pl/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/0/0/00614175-bosch_1.jpg",
    compatibleBrands: ["Bosch", "Siemens", "Neff"],
    compatibleModels: ["HBA", "HBN", "HB", "HE"],
    description: "Oryginalne pokrętło programatora do piekarników Bosch/Siemens. Kolor czarny, średnica 42mm. Montaż na oś 6mm.",
    specifications: {
      diameter: "42mm",
      color: "czarny",
      shaftDiameter: "6mm",
      material: "ABS",
      warranty: "12 miesięcy",
      oem: true
    },
    pricing: {
      retailPrice: 35.00,
      wholesalePrice: 25.00,
      currency: "PLN",
      taxIncluded: true
    },
    availability: {
      inStock: 25,
      minStock: 10,
      maxStock: 50,
      reserved: 3,
      available: 22
    },
    supplier: {
      name: "BSH Service",
      supplierCode: "BSH-00614175",
      contactInfo: {
        phone: "+48 22 444 55 66",
        email: "service@bshg.pl"
      },
      deliveryTime: "24h",
      minOrderQuantity: 1
    },
    installation: {
      difficulty: "easy",
      estimatedTime: 5,
      requiredTools: ["Brak - montaż ręczny"]
    }
  }
];

// Funkcja do zapisu danych
function saveParts() {
  const data = {
    inventory: realParts
  };
  
  fs.writeFileSync(partsInventoryPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Zapisano ${realParts.length} prawdziwych części AGD do magazynu!`);
  console.log('\n📊 Statystyki:');
  
  const lodowki = realParts.filter(p => p.subcategory === 'Lodówka').length;
  const zmywarki = realParts.filter(p => p.subcategory === 'Zmywarka').length;
  const piekarniki = realParts.filter(p => p.subcategory === 'Piekarnik').length;
  
  console.log(`   🧊 Części do lodówek: ${lodowki}`);
  console.log(`   💧 Części do zmywarek: ${zmywarki}`);
  console.log(`   🔥 Części do piekarników: ${piekarniki}`);
  
  const totalValue = realParts.reduce((sum, part) => 
    sum + (part.availability.inStock * part.pricing.wholesalePrice), 0
  );
  const totalStock = realParts.reduce((sum, part) => sum + part.availability.inStock, 0);
  
  console.log(`\n💰 Wartość magazynu: ${totalValue.toFixed(2)} PLN (cena hurtowa)`);
  console.log(`📦 Łączna ilość sztuk: ${totalStock}`);
  
  console.log('\n🏷️  Marki w magazynie:');
  const brands = [...new Set(realParts.flatMap(p => p.compatibleBrands))].sort();
  brands.forEach(brand => console.log(`   • ${brand}`));
}

// Uruchom skrypt
console.log('🚀 Wypełnianie magazynu prawdziwymi częściami AGD...\n');
saveParts();
console.log('\n✨ Gotowe! Możesz teraz zobaczyć części w panelu admin/magazyn/czesci');
