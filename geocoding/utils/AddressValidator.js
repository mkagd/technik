// geocoding/utils/AddressValidator.js
// Walidacja i enhancement polskich adresów

/**
 * 🇵🇱 AddressValidator - inteligentna walidacja polskich adresów
 * 
 * Funkcjonalności:
 * - Rozpoznawanie polskich formatów adresów  
 * - Normalizacja skrótów (ul., al., pl., os.)
 * - Korekta błędów pisowni miast
 * - Walidacja kodów pocztowych
 * - Enhancement adresów dla lepszego geocoding
 */
export default class AddressValidator {
  constructor() {
    // Polskie skróty ulic
    this.streetAbbreviations = {
      'ul.': 'ulica',
      'ul': 'ulica',
      'al.': 'aleja',
      'al': 'aleja',
      'pl.': 'plac',
      'pl': 'plac',
      'os.': 'osiedle',
      'os': 'osiedle',
      'av.': 'aleja',
      'ave.': 'aleja',
      'str.': 'ulica',
      'st.': 'ulica'
    };

    // Popularne błędy pisowni miast polskich
    this.cityCorrections = {
      'krakow': 'Kraków',
      'cracow': 'Kraków',
      'warszawa': 'Warszawa',
      'warsaw': 'Warszawa',
      'lodz': 'Łódź',
      'wroclaw': 'Wrocław',
      'poznan': 'Poznań',
      'gdansk': 'Gdańsk',
      'danzig': 'Gdańsk',
      'szczecin': 'Szczecin',
      'stettin': 'Szczecin',
      'bydgoszcz': 'Bydgoszcz',
      'lublin': 'Lublin',
      'bialystok': 'Białystok',
      'czestochowa': 'Częstochowa',
      'katowice': 'Katowice',
      'sosnowiec': 'Sosnowiec',
      'rzeszow': 'Rzeszów',
      'torun': 'Toruń',
      'kielce': 'Kielce',
      'gliwice': 'Gliwice',
      'zabrze': 'Zabrze',
      'bytom': 'Bytom',
      'olsztyn': 'Olsztyn',
      'rybnik': 'Rybnik',
      'tychy': 'Tychy'
    };

    // Regex patterns dla polskich adresów
    this.patterns = {
      // Kod pocztowy XX-XXX
      postalCode: /\b\d{2}-\d{3}\b/g,
      
      // Numer domu/mieszkania
      houseNumber: /\b\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?\b/g,
      
      // Ulica z numerem: "ul. Mickiewicza 5"
      streetWithNumber: /(?:ul\.?|al\.?|pl\.?|os\.?)\s+([^,\d]+)\s*(\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?)/i,
      
      // Tylko ulica: "ul. Mickiewicza"
      streetOnly: /(?:ul\.?|al\.?|pl\.?|os\.?)\s+([^,]+)/i,
      
      // Miasto z kodem: "30-001 Kraków"
      cityWithPostal: /(\d{2}-\d{3})\s+([^,]+)/,
      
      // Pełny adres: "ul. Mickiewicza 5, 30-001 Kraków"
      fullAddress: /^(.+),\s*(\d{2}-\d{3})\s+([^,]+)$/,
      
      // Województwo
      voivodeship: /(?:woj\.?|województwo)\s+([^,]+)/i
    };

    console.log('🇵🇱 AddressValidator initialized');
  }

  /**
   * ✅ Główna metoda walidacji i enhancement
   */
  validateAndEnhance(address) {
    const original = address.trim();
    let enhanced = original;
    const issues = [];
    const components = {};

    console.log('🔍 Validating address:', original);

    try {
      // 1. Podstawowe czyszczenie
      enhanced = this.basicCleaning(enhanced);

      // 2. Parsowanie komponentów
      const parsed = this.parseAddressComponents(enhanced);
      Object.assign(components, parsed.components);
      
      if (parsed.enhanced !== enhanced) {
        enhanced = parsed.enhanced;
        issues.push('Normalized street abbreviations');
      }

      // 3. Korekta nazw miast
      const cityCorrection = this.correctCityName(enhanced);
      if (cityCorrection.corrected) {
        enhanced = cityCorrection.address;
        issues.push(`City corrected: ${cityCorrection.original} → ${cityCorrection.corrected}`);
      }

      // 4. Walidacja kodu pocztowego
      const postalValidation = this.validatePostalCode(enhanced);
      if (!postalValidation.isValid && postalValidation.suggestions.length > 0) {
        issues.push(`Invalid postal code, suggestions: ${postalValidation.suggestions.join(', ')}`);
      }

      // 5. Enhancement dla geocoding
      const geocodingEnhanced = this.enhanceForGeocoding(enhanced, components);
      if (geocodingEnhanced !== enhanced) {
        enhanced = geocodingEnhanced;
        issues.push('Enhanced for better geocoding');
      }

      const result = {
        original: original,
        enhanced: enhanced,
        isValid: issues.length === 0 || !issues.some(issue => issue.includes('Invalid')),
        components: components,
        issues: issues,
        confidence: this.calculateValidationConfidence(components, issues)
      };

      console.log('✅ Validation result:', result);
      return result;

    } catch (error) {
      console.error('🚨 Validation error:', error);
      return {
        original: original,
        enhanced: original,
        isValid: false,
        components: {},
        issues: [`Validation error: ${error.message}`],
        confidence: 0.1
      };
    }
  }

  /**
   * 🧹 Podstawowe czyszczenie adresu
   */
  basicCleaning(address) {
    return address
      .replace(/\s+/g, ' ') // Normalizuj spacje
      .replace(/[,;]\s*$/, '') // Usuń końcowe przecinki
      .replace(/^\s*[,;]/, '') // Usuń początkowe przecinki
      .replace(/\s*,\s*/g, ', ') // Normalizuj przecinki
      .trim();
  }

  /**
   * 🧩 Parsuj komponenty adresu
   */
  parseAddressComponents(address) {
    const components = {};
    let enhanced = address;

    // Parsuj pełny adres
    const fullMatch = address.match(this.patterns.fullAddress);
    if (fullMatch) {
      components.street_part = fullMatch[1].trim();
      components.postal_code = fullMatch[2];
      components.city = fullMatch[3].trim();
    }

    // Znajdź kod pocztowy
    const postalMatches = address.match(this.patterns.postalCode);
    if (postalMatches) {
      components.postal_code = postalMatches[0];
    }

    // Parsuj ulicę z numerem
    const streetMatch = address.match(this.patterns.streetWithNumber);
    if (streetMatch) {
      const streetType = streetMatch[0].split(/\s+/)[0];
      components.street_type = this.expandStreetAbbreviation(streetType);
      components.street_name = streetMatch[1].trim();
      components.house_number = streetMatch[2];
      
      // Normalize abbreviation
      enhanced = enhanced.replace(streetMatch[0], 
        `${components.street_type} ${components.street_name} ${components.house_number}`);
    }

    // Parsuj samo nazwę ulicy
    const streetOnlyMatch = address.match(this.patterns.streetOnly);
    if (streetOnlyMatch && !streetMatch) {
      const streetType = streetOnlyMatch[0].split(/\s+/)[0];
      components.street_type = this.expandStreetAbbreviation(streetType);
      components.street_name = streetOnlyMatch[1].trim();
      
      enhanced = enhanced.replace(streetOnlyMatch[0], 
        `${components.street_type} ${components.street_name}`);
    }

    return { components, enhanced };
  }

  /**
   * 🔄 Rozwiń skrót ulicy
   */
  expandStreetAbbreviation(abbrev) {
    const normalized = abbrev.toLowerCase().replace(/\.$/, '');
    return this.streetAbbreviations[normalized] || abbrev;
  }

  /**
   * 🏙️ Popraw nazwę miasta
   */
  correctCityName(address) {
    const words = address.toLowerCase().split(/\s+/);
    let corrected = null;
    let original = null;

    for (const word of words) {
      const cleanWord = word.replace(/[,.]$/, '');
      if (this.cityCorrections[cleanWord]) {
        corrected = this.cityCorrections[cleanWord];
        original = word;
        break;
      }
    }

    if (corrected) {
      const correctedAddress = address.replace(
        new RegExp(original, 'i'), 
        corrected
      );
      return {
        address: correctedAddress,
        original: original,
        corrected: corrected
      };
    }

    return { address: address };
  }

  /**
   * 📮 Waliduj kod pocztowy
   */
  validatePostalCode(address) {
    const matches = address.match(this.patterns.postalCode);
    
    if (!matches) {
      return {
        isValid: false,
        suggestions: ['Add postal code in XX-XXX format']
      };
    }

    const postalCode = matches[0];
    
    // Podstawowa walidacja formatu
    if (!/^\d{2}-\d{3}$/.test(postalCode)) {
      return {
        isValid: false,
        suggestions: ['Postal code should be in XX-XXX format']
      };
    }

    // Walidacja zakresów (podstawowa)
    const firstTwo = parseInt(postalCode.substring(0, 2));
    
    if (firstTwo < 10 || firstTwo > 99) {
      return {
        isValid: false,
        suggestions: ['Invalid postal code range']
      };
    }

    return {
      isValid: true,
      postalCode: postalCode
    };
  }

  /**
   * 🎯 Enhancement dla lepszego geocoding
   */
  enhanceForGeocoding(address, components) {
    let enhanced = address;

    // Dodaj "Polska" jeśli nie ma kraju
    if (!enhanced.toLowerCase().includes('polska') && 
        !enhanced.toLowerCase().includes('poland')) {
      enhanced += ', Polska';
    }

    // Zamień kolejność dla lepszego rozpoznawania przez Google
    // "30-001 Kraków" → "Kraków 30-001"
    if (components.postal_code && components.city) {
      const cityPostalPattern = new RegExp(`${components.postal_code}\\s+${components.city}`, 'i');
      if (cityPostalPattern.test(enhanced)) {
        enhanced = enhanced.replace(
          cityPostalPattern, 
          `${components.city} ${components.postal_code}`
        );
      }
    }

    return enhanced;
  }

  /**
   * 📊 Oblicz confidence score walidacji
   */
  calculateValidationConfidence(components, issues) {
    let confidence = 0.5; // Base confidence

    // Bonus za kompletne komponenty
    if (components.street_name) confidence += 0.1;
    if (components.house_number) confidence += 0.1;
    if (components.city) confidence += 0.1;
    if (components.postal_code) confidence += 0.1;

    // Penalty za problemy
    const errorIssues = issues.filter(issue => 
      issue.includes('Invalid') || issue.includes('error')
    );
    confidence -= errorIssues.length * 0.1;

    // Bonus za poprawki
    const correctionIssues = issues.filter(issue => 
      issue.includes('corrected') || issue.includes('Enhanced')
    );
    confidence += correctionIssues.length * 0.05;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 🔍 Sprawdź czy adres wygląda na polski
   */
  looksLikePolishAddress(address) {
    const indicators = [
      /\b(ul|al|pl|os)\.?\s/i, // Polskie skróty ulic
      /\d{2}-\d{3}/, // Kod pocztowy
      /(kraków|warszawa|wrocław|poznań|gdańsk)/i, // Popularne miasta
      /(polska|poland)/i, // Kraj
      /[ąćęłńóśźż]/i // Polskie znaki
    ];

    return indicators.some(pattern => pattern.test(address));
  }

  /**
   * 📋 Pobierz dostępne korekcje miast
   */
  getAvailableCityCorrections() {
    return { ...this.cityCorrections };
  }

  /**
   * 📋 Pobierz dostępne skróty ulic
   */
  getAvailableStreetAbbreviations() {
    return { ...this.streetAbbreviations };
  }
}