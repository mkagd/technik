/**
 * Moduł do normalizacji i porównywania adresów polskich
 * Obsługuje polskie znaki diakrytyczne, prefiksy ulic i fuzzy matching
 */

/**
 * Normalizuje adres do standardowej formy
 * @param {string} address - Adres do normalizacji
 * @returns {string} - Znormalizowany adres
 */
export function normalizeAddress(address) {
  if (!address || typeof address !== 'string') {
    return '';
  }

  let normalized = address.toLowerCase().trim();

  // Usuń polskie znaki diakrytyczne
  const diacriticsMap = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
  };

  for (const [diacritic, replacement] of Object.entries(diacriticsMap)) {
    normalized = normalized.replace(new RegExp(diacritic, 'g'), replacement);
  }

  // Usuń prefiksy ulic (ul., os., al., pl., itp.)
  const prefixes = ['ul\\.', 'os\\.', 'al\\.', 'pl\\.', 'ulica', 'osiedle', 'aleja', 'plac'];
  for (const prefix of prefixes) {
    normalized = normalized.replace(new RegExp(`^${prefix}\\s*`, 'i'), '');
  }

  // Usuń znaki interpunkcyjne (zachowaj spacje i cyfry)
  normalized = normalized.replace(/[^\w\s]/g, ' ');

  // Znormalizuj białe znaki (wiele spacji -> jedna spacja)
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Oblicza odległość Levenshteina między dwoma stringami
 * @param {string} str1 - Pierwszy string
 * @param {string} str2 - Drugi string
 * @returns {number} - Odległość Levenshteina
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Inicjalizacja pierwszego wiersza i kolumny
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Wypełnienie macierzy
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // usunięcie
        matrix[i][j - 1] + 1,      // wstawienie
        matrix[i - 1][j - 1] + cost // zamiana
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Oblicza procent podobieństwa między dwoma adresami
 * @param {string} address1 - Pierwszy adres
 * @param {string} address2 - Drugi adres
 * @returns {number} - Procent podobieństwa (0-100)
 */
export function calculateAddressSimilarity(address1, address2) {
  const norm1 = normalizeAddress(address1);
  const norm2 = normalizeAddress(address2);

  // Jeśli jeden z adresów jest pusty
  if (!norm1 || !norm2) {
    return 0;
  }

  // Jeśli adresy są identyczne po normalizacji
  if (norm1 === norm2) {
    return 100;
  }

  // Oblicz odległość Levenshteina
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);

  // Konwersja na procent podobieństwa
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Sprawdza, czy dwa adresy są wystarczająco podobne
 * @param {string} address1 - Pierwszy adres
 * @param {string} address2 - Drugi adres
 * @param {number} threshold - Próg podobieństwa (domyślnie 90%)
 * @returns {boolean} - Czy adresy są podobne
 */
export function areAddressesSimilar(address1, address2, threshold = 90) {
  const similarity = calculateAddressSimilarity(address1, address2);
  return similarity >= threshold;
}

/**
 * Znajduje najlepiej pasujący adres z listy
 * @param {string} targetAddress - Adres do znalezienia
 * @param {Array<{address: string, [key]: any}>} addressList - Lista obiektów z adresami
 * @param {number} threshold - Minimalny próg podobieństwa (domyślnie 90%)
 * @returns {Object|null} - Najlepiej pasujący obiekt lub null
 */
export function findBestMatchingAddress(targetAddress, addressList, threshold = 90) {
  if (!targetAddress || !Array.isArray(addressList) || addressList.length === 0) {
    return null;
  }

  let bestMatch = null;
  let highestSimilarity = 0;

  for (const item of addressList) {
    const similarity = calculateAddressSimilarity(targetAddress, item.address);
    
    if (similarity >= threshold && similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = { ...item, similarity };
    }
  }

  return bestMatch;
}

/**
 * Testuje moduł z przykładowymi danymi
 * @returns {Object} - Wyniki testów
 */
export function runTests() {
  const tests = [
    {
      name: 'Identyczne adresy',
      address1: 'ul. Krakowska 17, Tarnów',
      address2: 'ul. Krakowska 17, Tarnów',
      expected: 100
    },
    {
      name: 'Różne prefiksy',
      address1: 'ul. Krakowska 17',
      address2: 'Krakowska 17',
      expected: 100
    },
    {
      name: 'Polskie znaki',
      address1: 'ul. Łąkowa 5, Kraków',
      address2: 'Lakowa 5, Krakow',
      expected: 100
    },
    {
      name: 'Literówka',
      address1: 'ul. Krakowska 17',
      address2: 'ul. Krakwoska 17',
      expected: '> 85'
    },
    {
      name: 'Różne adresy',
      address1: 'ul. Warszawska 1',
      address2: 'ul. Krakowska 99',
      expected: '< 70'
    }
  ];

  const results = tests.map(test => {
    const similarity = calculateAddressSimilarity(test.address1, test.address2);
    return {
      ...test,
      result: similarity,
      passed: typeof test.expected === 'number' 
        ? similarity === test.expected
        : test.expected.includes('>') 
          ? similarity > parseInt(test.expected.split('>')[1])
          : similarity < parseInt(test.expected.split('<')[1])
    };
  });

  return results;
}
