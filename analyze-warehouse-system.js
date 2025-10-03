// ANALIZA SYSTEMU MAGAZYNOWEGO AGD
console.log('📦 ANALIZA SYSTEMU MAGAZYNOWEGO I CZĘŚCI AGD');
console.log('=' + '='.repeat(60));

const fs = require('fs');
const path = require('path');

// Wczytaj dane magazynowe
const partsInventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'parts-inventory.json'), 'utf8'));
const modelsDatabase = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'modelsDatabase.json'), 'utf8'));
const orders = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'orders.json'), 'utf8'));

console.log('\n📊 PODSTAWOWE STATYSTYKI MAGAZYNU:');
console.log(`   📦 Części w magazynie: ${partsInventory.inventory.length}`);
console.log(`   💰 Łączna wartość: ${partsInventory.statistics.totalValue} zł`);
console.log(`   📈 Obrót magazynu: ${partsInventory.statistics.stockTurnover}x rocznie`);
console.log(`   ⏱️ Średni czas dostawy: ${partsInventory.statistics.averageDeliveryTime}`);

// ===============================================
// 1. ANALIZA ASORTYMENTU MAGAZYNU
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('📋 ASORTYMENT MAGAZYNU - SZCZEGÓŁOWA ANALIZA');
console.log('='.repeat(60));

const categoriesStats = {};
let totalStockValue = 0;
let totalInStock = 0;

partsInventory.inventory.forEach((part, index) => {
  console.log(`\n${index + 1}. ${part.name} (${part.id})`);
  console.log(`   🔧 Numer części: ${part.partNumber}`);
  console.log(`   📱 Kategoria: ${part.category} → ${part.subcategory}`);
  console.log(`   🏷️ Marki: ${part.compatibleBrands.join(', ')}`);
  
  if (part.compatibleModels && part.compatibleModels.length > 0 && part.compatibleModels[0] !== 'universal') {
    console.log(`   📟 Modele: ${part.compatibleModels.slice(0, 3).join(', ')}${part.compatibleModels.length > 3 ? '...' : ''}`);
  } else {
    console.log(`   📟 Modele: Uniwersalny`);
  }
  
  console.log(`   📝 Opis: ${part.description}`);
  
  if (part.specifications) {
    console.log(`   ⚙️ Specyfikacja:`);
    Object.entries(part.specifications).forEach(([key, value]) => {
      console.log(`      • ${key}: ${value}`);
    });
  }
  
  console.log(`   💰 Ceny:`);
  console.log(`      • Detaliczna: ${part.pricing.retailPrice} ${part.pricing.currency}`);
  if (part.pricing.wholesalePrice) {
    console.log(`      • Hurtowa: ${part.pricing.wholesalePrice} ${part.pricing.currency}`);
    console.log(`      • Marża: ${((part.pricing.retailPrice - part.pricing.wholesalePrice) / part.pricing.wholesalePrice * 100).toFixed(1)}%`);
  }
  
  if (part.availability) {
    console.log(`   📦 Stan magazynowy:`);
    console.log(`      • Na stanie: ${part.availability.inStock} szt.`);
    console.log(`      • Dostępne: ${part.availability.available} szt.`);
    if (part.availability.reserved) {
      console.log(`      • Zarezerwowane: ${part.availability.reserved} szt.`);
    }
    console.log(`      • Min/Max: ${part.availability.minStock}/${part.availability.maxStock} szt.`);
    
    const stockStatus = part.availability.inStock <= part.availability.minStock ? '🔴 NISKI STAN' : 
                       part.availability.inStock >= part.availability.maxStock ? '🔵 WYSOKI STAN' : '🟢 OK';
    console.log(`      • Status: ${stockStatus}`);
    
    totalInStock += part.availability.inStock;
    totalStockValue += part.availability.inStock * part.pricing.retailPrice;
  }
  
  if (part.supplier) {
    console.log(`   🏪 Dostawca: ${part.supplier.name}`);
    console.log(`      • Kod: ${part.supplier.supplierCode}`);
    console.log(`      • Czas dostawy: ${part.supplier.deliveryTime}`);
    if (part.supplier.minOrderQuantity) {
      console.log(`      • Min. zamówienie: ${part.supplier.minOrderQuantity} szt.`);
    }
  }
  
  if (part.installation) {
    console.log(`   🔧 Instalacja:`);
    console.log(`      • Trudność: ${part.installation.difficulty}`);
    console.log(`      • Czas: ${part.installation.estimatedTime} min`);
    if (part.installation.requiredTools) {
      console.log(`      • Narzędzia: ${part.installation.requiredTools.join(', ')}`);
    }
  }
  
  if (part.failureIndicators) {
    console.log(`   🚨 Objawy awarii:`);
    part.failureIndicators.forEach(indicator => {
      console.log(`      • ${indicator}`);
    });
  }
  
  // Kategorie
  if (!categoriesStats[part.subcategory]) {
    categoriesStats[part.subcategory] = {
      count: 0,
      totalValue: 0,
      brands: new Set()
    };
  }
  categoriesStats[part.subcategory].count++;
  categoriesStats[part.subcategory].totalValue += part.pricing.retailPrice * (part.availability?.inStock || 0);
  part.compatibleBrands.forEach(brand => categoriesStats[part.subcategory].brands.add(brand));
});

console.log(`\n📊 PODSUMOWANIE ASORTYMENTU:`);
Object.entries(categoriesStats).forEach(([category, stats]) => {
  console.log(`   ${category}:`);
  console.log(`      • Części: ${stats.count}`);
  console.log(`      • Wartość: ${stats.totalValue.toFixed(0)} zł`);
  console.log(`      • Marki: ${Array.from(stats.brands).join(', ')}`);
});

console.log(`\n💰 WARTOŚĆ MAGAZYNU:`);
console.log(`   📦 Łączna ilość części: ${totalInStock} szt.`);
console.log(`   💰 Łączna wartość: ${totalStockValue.toFixed(0)} zł`);
console.log(`   📈 Średnia wartość części: ${(totalStockValue / totalInStock).toFixed(0)} zł/szt.`);

// ===============================================
// 2. ANALIZA DOSTAWCÓW
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🏪 ANALIZA DOSTAWCÓW');
console.log('='.repeat(60));

Object.entries(partsInventory.suppliers).forEach(([code, supplier]) => {
  console.log(`\n📋 ${supplier.name} (${code})`);
  console.log(`   📞 Kontakt:`);
  console.log(`      • Telefon: ${supplier.contact.phone}`);
  console.log(`      • Email: ${supplier.contact.email}`);
  if (supplier.contact.website) {
    console.log(`      • Strona: ${supplier.contact.website}`);
  }
  
  console.log(`   🚚 Opcje dostawy:`);
  Object.entries(supplier.deliveryOptions).forEach(([type, time]) => {
    console.log(`      • ${type}: ${time}`);
  });
  
  if (supplier.paymentTerms) {
    console.log(`   💳 Płatność: ${supplier.paymentTerms}`);
  }
  
  if (supplier.minOrderValue) {
    console.log(`   💰 Min. wartość zamówienia: ${supplier.minOrderValue} zł`);
  }
  
  if (supplier.discountTiers) {
    console.log(`   🎯 Rabaty:`);
    Object.entries(supplier.discountTiers).forEach(([tier, info]) => {
      console.log(`      • ${tier}: ${info.discount}% (od ${info.threshold} zł)`);
    });
  }
  
  if (supplier.specialties) {
    console.log(`   🔧 Specjalności: ${supplier.specialties.join(', ')}`);
  }
  
  // Policz części od tego dostawcy
  const partsFromSupplier = partsInventory.inventory.filter(part => 
    part.supplier && part.supplier.supplierCode === code
  );
  console.log(`   📦 Części w ofercie: ${partsFromSupplier.length}`);
  
  const totalSupplierValue = partsFromSupplier.reduce((sum, part) => 
    sum + (part.availability?.inStock || 0) * part.pricing.retailPrice, 0
  );
  console.log(`   💰 Wartość części na stanie: ${totalSupplierValue.toFixed(0)} zł`);
});

// ===============================================
// 3. ALERTY MAGAZYNOWE
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🚨 ALERTY MAGAZYNOWE');
console.log('='.repeat(60));

console.log(`\n🔴 NISKI STAN (${partsInventory.stockAlerts.lowStock.length}):`);
partsInventory.stockAlerts.lowStock.forEach(alert => {
  const part = partsInventory.inventory.find(p => p.id === alert.partId);
  console.log(`   • ${part.name} (${alert.partId})`);
  console.log(`     Stan: ${alert.currentStock}/${alert.minStock} (min)`);
  console.log(`     Zalecane zamówienie: ${alert.recommendedOrder} szt.`);
  console.log(`     Pilność: ${alert.urgency}`);
});

console.log(`\n⚫ BRAK NA STANIE (${partsInventory.stockAlerts.outOfStock.length}):`);
if (partsInventory.stockAlerts.outOfStock.length === 0) {
  console.log(`   ✅ Wszystkie części dostępne!`);
}

console.log(`\n🔵 NADMIAR (${partsInventory.stockAlerts.overStock.length}):`);
if (partsInventory.stockAlerts.overStock.length === 0) {
  console.log(`   ✅ Brak nadmiaru części!`);
}

// ===============================================
// 4. ANALIZA WYKORZYSTANIA CZĘŚCI W ZAMÓWIENIACH
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('📈 WYKORZYSTANIE CZĘŚCI W ZAMÓWIENIACH');
console.log('='.repeat(60));

let totalPartsUsed = 0;
let totalPartsValue = 0;
const partsUsageStats = {};

orders.forEach(order => {
  if (order.partsUsed && order.partsUsed.length > 0) {
    console.log(`\n📋 ${order.orderNumber} (${order.clientName}):`);
    order.partsUsed.forEach(part => {
      console.log(`   • ${part.name} (${part.partNumber})`);
      console.log(`     Ilość: ${part.quantity} x ${part.unitPrice} zł = ${part.totalPrice} zł`);
      
      totalPartsUsed += part.quantity;
      totalPartsValue += part.totalPrice;
      
      if (!partsUsageStats[part.partNumber]) {
        partsUsageStats[part.partNumber] = {
          name: part.name,
          totalUsed: 0,
          totalValue: 0
        };
      }
      partsUsageStats[part.partNumber].totalUsed += part.quantity;
      partsUsageStats[part.partNumber].totalValue += part.totalPrice;
    });
  }
});

console.log(`\n📊 STATYSTYKI WYKORZYSTANIA:`);
console.log(`   📦 Łącznie użytych części: ${totalPartsUsed} szt.`);
console.log(`   💰 Łączna wartość użytych części: ${totalPartsValue} zł`);

if (Object.keys(partsUsageStats).length > 0) {
  console.log(`\n🏆 NAJPOPULARNIEJSZE CZĘŚCI:`);
  Object.entries(partsUsageStats)
    .sort(([,a], [,b]) => b.totalUsed - a.totalUsed)
    .slice(0, 5)
    .forEach(([partNumber, stats], index) => {
      console.log(`   ${index + 1}. ${stats.name} (${partNumber})`);
      console.log(`      Użyte: ${stats.totalUsed} szt. | Wartość: ${stats.totalValue} zł`);
    });
}

// ===============================================
// 5. TOP SELLING PARTS
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🏆 NAJPOPULARNIEJSZE CZĘŚCI (SPRZEDAŻ)');
console.log('='.repeat(60));

partsInventory.statistics.topSellingParts.forEach((item, index) => {
  const part = partsInventory.inventory.find(p => p.id === item.partId);
  console.log(`${index + 1}. ${part.name}`);
  console.log(`   📊 Sprzedaż: ${item.sales} szt.`);
  console.log(`   💰 Cena: ${part.pricing.retailPrice} zł`);
  console.log(`   📈 Przychód: ${(item.sales * part.pricing.retailPrice).toFixed(0)} zł`);
});

// ===============================================
// 6. INTEGRACJA Z BAZĄ MODELI
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🔗 INTEGRACJA Z BAZĄ MODELI URZĄDZEŃ');
console.log('='.repeat(60));

let modelsWithParts = 0;
let totalModelsAnalyzed = 0;

Object.entries(modelsDatabase.brands).forEach(([brandName, categories]) => {
  console.log(`\n🏷️ ${brandName}:`);
  
  Object.entries(categories).forEach(([categoryName, models]) => {
    console.log(`   📱 ${categoryName}:`);
    
    Object.entries(models).forEach(([modelCode, modelData]) => {
      totalModelsAnalyzed++;
      
      if (modelData.common_parts && modelData.common_parts.length > 0) {
        modelsWithParts++;
        console.log(`      📟 ${modelData.name || modelCode}:`);
        console.log(`         Części: ${modelData.common_parts.length}`);
        
        // Sprawdź dostępność części w magazynie
        let availableInStock = 0;
        modelData.common_parts.forEach(part => {
          const inventoryPart = partsInventory.inventory.find(p => 
            p.partNumber === part.part_number || 
            p.compatibleBrands.includes(brandName.toLowerCase()) ||
            p.name.toLowerCase().includes(part.name.toLowerCase())
          );
          
          if (inventoryPart && inventoryPart.availability?.inStock > 0) {
            availableInStock++;
          }
        });
        
        const availability = availableInStock / modelData.common_parts.length * 100;
        console.log(`         Dostępność w magazynie: ${availability.toFixed(0)}% (${availableInStock}/${modelData.common_parts.length})`);
      }
    });
  });
});

console.log(`\n📊 POKRYCIE MODELAMI:`);
console.log(`   📱 Analizowane modele: ${totalModelsAnalyzed}`);
console.log(`   🔧 Modele z częściami: ${modelsWithParts}`);
console.log(`   📈 Pokrycie: ${(modelsWithParts / totalModelsAnalyzed * 100).toFixed(1)}%`);

// ===============================================
// 7. KOŃCOWA OCENA SYSTEMU MAGAZYNOWEGO
// ===============================================
console.log('\n' + '='.repeat(60));
console.log('🎯 OCENA SYSTEMU MAGAZYNOWEGO');
console.log('='.repeat(60));

const magazineScore = {
  assortment: 0,
  availability: 0,
  suppliers: 0,
  integration: 0,
  management: 0,
  overallScore: 0
};

// Asortyment (0-20 punktów)
const uniqueCategories = new Set(partsInventory.inventory.map(p => p.subcategory)).size;
const uniqueBrands = new Set(partsInventory.inventory.flatMap(p => p.compatibleBrands)).size;
magazineScore.assortment = Math.min(20, uniqueCategories * 3 + uniqueBrands * 1);

// Dostępność (0-20 punktów)
const inStockRatio = partsInventory.inventory.filter(p => p.availability?.inStock > 0).length / partsInventory.inventory.length;
const lowStockRatio = partsInventory.stockAlerts.lowStock.length / partsInventory.inventory.length;
magazineScore.availability = Math.round(inStockRatio * 20 - lowStockRatio * 10);

// Dostawcy (0-20 punktów)
const suppliersCount = Object.keys(partsInventory.suppliers).length;
const hasDiscounts = Object.values(partsInventory.suppliers).some(s => s.discountTiers);
magazineScore.suppliers = Math.min(20, suppliersCount * 5 + (hasDiscounts ? 10 : 0));

// Integracja (0-20 punktów)
const hasModelIntegration = modelsWithParts > 0;
const integrationScore = hasModelIntegration ? 15 : 0;
const hasOrderIntegration = orders.some(o => o.partsUsed && o.partsUsed.length > 0);
magazineScore.integration = integrationScore + (hasOrderIntegration ? 5 : 0);

// Zarządzanie (0-20 punktów)
const hasAlerts = partsInventory.stockAlerts.lowStock.length > 0 || partsInventory.stockAlerts.outOfStock.length > 0;
const hasStatistics = partsInventory.statistics && partsInventory.statistics.topSellingParts;
const hasAutoReorder = partsInventory.metadata.autoReorderEnabled;
magazineScore.management = (hasAlerts ? 5 : 0) + (hasStatistics ? 10 : 0) + (hasAutoReorder ? 5 : 0);

magazineScore.overallScore = magazineScore.assortment + magazineScore.availability + 
                           magazineScore.suppliers + magazineScore.integration + magazineScore.management;

console.log(`\n📊 OCENA PUNKTOWA (0-100):`);
console.log(`   📦 Asortyment: ${magazineScore.assortment}/20`);
console.log(`   📊 Dostępność: ${magazineScore.availability}/20`);
console.log(`   🏪 Dostawcy: ${magazineScore.suppliers}/20`);
console.log(`   🔗 Integracja: ${magazineScore.integration}/20`);
console.log(`   ⚙️ Zarządzanie: ${magazineScore.management}/20`);
console.log(`   🎯 WYNIK OGÓLNY: ${magazineScore.overallScore}/100`);

let magazineGrade, magazineRecommendation;
if (magazineScore.overallScore >= 90) {
  magazineGrade = "DOSKONAŁY";
  magazineRecommendation = "Magazyn w pełni profesjonalny!";
} else if (magazineScore.overallScore >= 80) {
  magazineGrade = "BARDZO DOBRY";
  magazineRecommendation = "Magazyn gotowy do pracy profesjonalnej.";
} else if (magazineScore.overallScore >= 70) {
  magazineGrade = "DOBRY";
  magazineRecommendation = "Magazyn wymaga drobnych ulepszeń.";
} else if (magazineScore.overallScore >= 60) {
  magazineGrade = "DOSTATECZNY";
  magazineRecommendation = "Magazyn wymaga znaczących poprawek.";
} else {
  magazineGrade = "NIEDOSTATECZNY";
  magazineRecommendation = "Magazyn nie jest gotowy do profesjonalnej pracy.";
}

console.log(`\n🏆 OCENA KOŃCOWA: ${magazineGrade} (${magazineScore.overallScore}/100)`);
console.log(`💡 REKOMENDACJA: ${magazineRecommendation}`);

console.log(`\n📝 KLUCZOWE ZALETY:`);
console.log(`   ✅ ${partsInventory.inventory.length} różnych części AGD`);
console.log(`   ✅ ${uniqueBrands} obsługiwanych marek`);
console.log(`   ✅ ${Object.keys(partsInventory.suppliers).length} sprawdzonych dostawców`);
console.log(`   ✅ System alertów magazynowych`);
console.log(`   ✅ Automatyczne uzupełnianie stanów`);
console.log(`   ✅ Integracja z zamówieniami serwisowymi`);
console.log(`   ✅ Statystyki sprzedaży i obrotów`);

console.log(`\n🎉 ANALIZA MAGAZYNU ZAKOŃCZONA!`);
console.log(`📦 Przeanalizowano ${partsInventory.inventory.length} części na łączną wartość ${totalStockValue.toFixed(0)} zł`);
console.log(`🏪 System magazynowy ${magazineScore.overallScore >= 70 ? 'GOTOWY DO PRACY' : 'WYMAGA POPRAWEK'}`);