// pages/api/scrape/north-product.js
// 🕷️ Scraper do pobierania danych produktu z North.pl

import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || !url.includes('north.pl')) {
    return res.status(400).json({ error: 'Podaj prawidłowy link do produktu North.pl' });
  }

  console.log('🕷️ Scraping North.pl:', url);

  try {
    // Pobierz stronę produktu
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Ekstraktuj dane produktu
    const productData = {
      name: '',
      partNumber: '',
      price: '',
      images: [],
      description: '',
      availability: '',
      originalUrl: url
    };

    // 1. NAZWA PRODUKTU
    // Zazwyczaj w: <h1 class="product-name"> lub similar
    productData.name = $('h1.product-name').text().trim() 
      || $('h1[itemprop="name"]').text().trim()
      || $('h1').first().text().trim()
      || '';

    // 2. NUMER KATALOGOWY
    // Często w: <span class="product-code"> lub <div class="sku">
    productData.partNumber = $('.product-code').text().trim()
      || $('[itemprop="sku"]').text().trim()
      || $('span:contains("Kod")').next().text().trim()
      || $('span:contains("Indeks")').next().text().trim()
      || '';

    // Wyczyść numer katalogowy z prefiksów
    productData.partNumber = productData.partNumber
      .replace(/^(Kod|Indeks|SKU):\s*/i, '')
      .trim();

    // 3. CENA
    // Format: <span class="price">123,45 zł</span>
    const priceText = $('.price').first().text().trim()
      || $('[itemprop="price"]').attr('content')
      || $('span:contains("zł")').first().text().trim()
      || '';
    
    // Wyciągnij liczbę z ceny
    const priceMatch = priceText.match(/[\d\s]+[,.]?\d*/);
    if (priceMatch) {
      productData.price = priceMatch[0]
        .replace(/\s/g, '')
        .replace(',', '.')
        .trim();
    }

    // 4. ZDJĘCIA
    // Szukaj w różnych miejscach
    const imageSelectors = [
      'img[itemprop="image"]',
      '.product-image img',
      '.gallery img',
      'img.main-product-image',
      '#product-image img',
      'img[data-zoom-image]',
      '.product-gallery img',
      '.product-photos img',
      'picture img',
      'img[alt*="produkt"]',
      'img[alt*="zdjęcie"]'
    ];

    const imageUrls = new Set();
    
    console.log('🔍 Szukam zdjęć...');
    
    // Znajdź WSZYSTKIE obrazy na stronie do debugowania
    const allImages = [];
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-zoom-image');
      if (src) {
        allImages.push({
          src: src.substring(0, 80),
          alt: $(elem).attr('alt') || '',
          class: $(elem).attr('class') || '',
          parent: $(elem).parent().prop('tagName')
        });
      }
    });
    console.log(`📸 Znaleziono ${allImages.length} obrazów na stronie`);
    if (allImages.length > 0) {
      console.log('🖼️ Pierwsze 10 obrazów:', allImages.slice(0, 10));
      
      // Znajdź obrazy które wyglądają jak zdjęcia produktu (zawierają 'thumb' lub 'product')
      const productLikeImages = allImages.filter(img => 
        img.src.includes('thumb') || 
        img.src.includes('product') || 
        img.src.includes('foto') ||
        img.src.includes('image') ||
        img.alt.toLowerCase().includes('produkt')
      );
      if (productLikeImages.length > 0) {
        console.log('🎯 Obrazy wyglądające jak produkty:', productLikeImages.slice(0, 5));
      }
    }
    
    // Próba 1: Standardowe selektory
    imageSelectors.forEach(selector => {
      const found = $(selector);
      if (found.length > 0) {
        console.log(`✓ Selektor "${selector}" znalazł ${found.length} obrazów`);
      }
      
      found.each((i, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-zoom-image');
        if (src && !src.includes('placeholder') && !src.includes('no-image') && !src.includes('logo')) {
          // Konwertuj relatywny URL na absolutny
          let fullUrl = src;
          if (src.startsWith('/')) {
            fullUrl = 'https://north.pl' + src;
          } else if (!src.startsWith('http')) {
            fullUrl = 'https://north.pl/' + src;
          }
          console.log('  → Dodaję zdjęcie (selektor):', fullUrl.substring(0, 80));
          imageUrls.add(fullUrl);
        }
      });
    });
    
    // Próba 2: Szukaj WSZYSTKICH obrazów które wyglądają jak zdjęcia produktu
    if (imageUrls.size === 0) {
      console.log('⚠️ Selektory nie znalazły zdjęć, próbuję alternatywnej metody...');
      $('img').each((i, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-zoom-image');
        if (src && 
            (src.includes('/thumb/') || 
             src.includes('/Images/foto/') || 
             src.includes('/product/') ||
             src.includes('/imgartn/') ||     // ✅ North.pl używa tego dla zdjęć produktów!
             src.includes('_large') ||
             src.includes('_main'))) {
          let fullUrl = src;
          if (src.startsWith('/')) {
            fullUrl = 'https://north.pl' + src;
          } else if (!src.startsWith('http')) {
            fullUrl = 'https://north.pl/' + src;
          }
          
          // Konwertuj miniaturki na pełne zdjęcia
          // Miniaturka: /imgartn/2/50,50/708-DL-1065,0,nazwa
          // Pełny: /imgartn/2/1200,1200/708-DL-1065,0,nazwa
          if (fullUrl.includes('/imgartn/')) {
            // Zamień rozmiar miniaturki na pełny rozmiar
            fullUrl = fullUrl.replace(/\/\d+,\d+\//, '/1200,1200/');
          }
          
          console.log('  → Dodaję zdjęcie (wzorzec URL):', fullUrl.substring(0, 100));
          imageUrls.add(fullUrl);
        }
      });
    }

    // Wyczyść zdjęcia ze znaku wodnego North.pl
    const rawImages = Array.from(imageUrls).slice(0, 5); // Max 5 zdjęć
    console.log(`✅ Zebrano ${rawImages.length} zdjęć produktu`);

    // Dla każdego zdjęcia wywołaj endpoint czyszczący
    const cleanedImages = [];
    for (const imageUrl of rawImages) {
      try {
        console.log('🧹 Czyszczę zdjęcie:', imageUrl.substring(0, 80));
        
        // Wywołaj własny endpoint do czyszczenia (Metoda #3: Inteligentne wypełnienie)
        const cleanResponse = await axios.post('http://localhost:3000/api/clean-image-blur', {
          imageUrl: imageUrl
        }, {
          timeout: 15000
        });

        if (cleanResponse.data.success) {
          cleanedImages.push(cleanResponse.data.cleanedImageUrl);
          console.log('  ✅ Wyczyszczone:', cleanResponse.data.cleanedImageUrl);
        } else {
          // Jeśli czyszczenie się nie powiodło, użyj oryginału
          cleanedImages.push(imageUrl);
          console.log('  ⚠️ Nie udało się wyczyścić, używam oryginału');
        }
      } catch (cleanError) {
        // Jeśli błąd, użyj oryginału
        console.error('  ❌ Błąd czyszczenia:', cleanError.message);
        cleanedImages.push(imageUrl);
      }
    }

    productData.images = cleanedImages;
    console.log(`✅ Przygotowano ${productData.images.length} zdjęć (wyczyszczonych)`);


    // 5. DOSTĘPNOŚĆ
    productData.availability = $('.availability').text().trim()
      || $('.stock-status').text().trim()
      || '';

    // 6. OPIS (krótki)
    productData.description = $('[itemprop="description"]').text().trim().substring(0, 200)
      || $('.product-description').first().text().trim().substring(0, 200)
      || '';

    console.log('✅ Pobrano dane produktu:', {
      name: productData.name?.substring(0, 50) + '...',
      partNumber: productData.partNumber,
      price: productData.price,
      imagesCount: productData.images.length
    });

    // Walidacja - czy udało się pobrać przynajmniej nazwę
    if (!productData.name) {
      console.error('❌ Nie udało się wyekstrahować nazwy produktu');
      return res.status(400).json({ 
        error: 'Nie udało się pobrać danych produktu. Sprawdź czy link jest prawidłowy.' 
      });
    }

    return res.status(200).json({
      success: true,
      product: productData
    });

  } catch (error) {
    console.error('❌ Błąd scrapowania:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ 
        error: 'Przekroczono limit czasu połączenia. Spróbuj ponownie.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Nie udało się pobrać danych z North.pl: ' + error.message 
    });
  }
}
