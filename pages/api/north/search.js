// pages/api/north/search.js
// API endpoint dla wyszukiwania części na North.pl

import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    console.log(`🔍 Searching North.pl for: ${query}`);

    // North.pl search URL
    const searchUrl = `https://www.north.pl/catalogsearch/result/?q=${encodeURIComponent(query)}`;
    
    console.log(`📡 Fetching: ${searchUrl}`);

    // Fetch the search results page
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);
    const results = [];

    // North.pl uses specific CSS selectors for product listings
    $('.products-grid .item, .product-item').each((index, element) => {
      if (results.length >= parseInt(limit)) return false;

      try {
        const $item = $(element);
        
        // Extract product data
        const name = $item.find('.product-name a, .product-item-name a').first().text().trim();
        const url = $item.find('.product-name a, .product-item-link').first().attr('href');
        
        // Image - try multiple selectors
        let image = $item.find('.product-image img, .product-item-photo img').first().attr('src');
        if (!image) {
          image = $item.find('img').first().attr('src');
        }
        
        // Price - try multiple formats
        let price = $item.find('.price, .price-box .price').first().text().trim();
        price = price.replace(/[^\d,]/g, '').replace(',', '.');
        
        // Product code/SKU
        const sku = $item.find('.product-code, .sku').text().trim() || 
                    $item.attr('data-sku') || '';

        // Availability
        const availability = $item.find('.availability, .stock').text().trim();
        const inStock = !availability.toLowerCase().includes('brak') && 
                       !availability.toLowerCase().includes('niedostępn');

        if (name && url) {
          results.push({
            name: name,
            url: url.startsWith('http') ? url : `https://north.pl${url}`,
            image: image && image.startsWith('http') ? image : (image ? `https://north.pl${image}` : null),
            price: parseFloat(price) || 0,
            priceFormatted: price ? `${parseFloat(price).toFixed(2)} zł` : 'Cena na zapytanie',
            sku: sku,
            availability: availability || 'Sprawdź na stronie',
            inStock: inStock,
            source: 'North.pl'
          });
        }
      } catch (itemError) {
        console.error('Error parsing item:', itemError.message);
      }
    });

    console.log(`✅ Found ${results.length} products on North.pl`);

    // If no results with primary selector, try alternative structure
    if (results.length === 0) {
      console.log('⚠️ No results with primary selector, trying alternative...');
      
      $('li.product, li.item').each((index, element) => {
        if (results.length >= parseInt(limit)) return false;

        try {
          const $item = $(element);
          const name = $item.find('a.product-item-link, h2.product-name a').text().trim();
          const url = $item.find('a.product-item-link, h2.product-name a').attr('href');
          const image = $item.find('img.product-image-photo').attr('src');
          let price = $item.find('span.price').text().trim();
          price = price.replace(/[^\d,]/g, '').replace(',', '.');

          if (name && url) {
            results.push({
              name: name,
              url: url.startsWith('http') ? url : `https://north.pl${url}`,
              image: image && image.startsWith('http') ? image : (image ? `https://north.pl${image}` : null),
              price: parseFloat(price) || 0,
              priceFormatted: price ? `${parseFloat(price).toFixed(2)} zł` : 'Cena na zapytanie',
              sku: '',
              availability: 'Sprawdź na stronie',
              inStock: true,
              source: 'North.pl'
            });
          }
        } catch (itemError) {
          console.error('Error parsing alternative item:', itemError.message);
        }
      });
    }

    if (results.length === 0) {
      console.log('⚠️ No products found, returning empty results');
      return res.status(200).json({
        success: true,
        query: query,
        count: 0,
        results: [],
        message: 'Brak wyników dla tego zapytania'
      });
    }

    return res.status(200).json({
      success: true,
      query: query,
      count: results.length,
      results: results,
      searchUrl: searchUrl
    });

  } catch (error) {
    console.error('❌ North.pl search error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to search North.pl',
      details: error.message,
      query: query
    });
  }
}
