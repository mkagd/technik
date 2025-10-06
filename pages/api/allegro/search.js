// API endpoint for searching Allegro listings with OAuth 2.0
import { getAccessToken, isConfigured } from '../../../lib/allegro-oauth';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, category = '', minPrice = '', maxPrice = '', limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Check if OAuth is configured
    if (!isConfigured()) {
      console.log('⚠️ Allegro OAuth not configured, using DEMO mode');
      const sampleResults = generateSampleResults(query, minPrice, maxPrice, limit);
      
      return res.status(200).json({
        success: true,
        query,
        count: sampleResults.length,
        results: sampleResults,
        demo: true,
        message: 'Tryb DEMO - skonfiguruj OAuth w pliku .env.local (ALLEGRO_CLIENT_ID i ALLEGRO_CLIENT_SECRET)'
      });
    }

    // Get OAuth access token
    const accessToken = await getAccessToken();

    // Build search parameters for Allegro API
    const searchParams = {
      phrase: query,
      limit: Math.min(parseInt(limit) || 20, 100),
      sort: '-price', // Sort by price
      'searchMode': 'REGULAR', // Regular search (not DESCRIPTIONS_ONLY)
    };

    // Add category filter if provided
    if (category) {
      searchParams['category.id'] = category;
    }

    // Add price range filters
    if (minPrice) {
      searchParams['price.from'] = parseFloat(minPrice);
    }
    if (maxPrice) {
      searchParams['price.to'] = parseFloat(maxPrice);
    }

    // Check if using Sandbox - read directly from config file
    let useSandbox = false;
    try {
      const configPath = path.join(process.cwd(), 'data', 'allegro-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        useSandbox = config.sandbox || false;
      } else {
        useSandbox = process.env.ALLEGRO_SANDBOX === 'true';
      }
    } catch (error) {
      useSandbox = process.env.ALLEGRO_SANDBOX === 'true';
    }
    
    // FIXED: Use correct production endpoint
    const baseUrl = useSandbox 
      ? 'https://api.allegro.pl.allegrosandbox.pl'
      : 'https://api.allegro.pl';
    
    const apiUrl = `${baseUrl}/offers/listing`;

    console.log(`🔍 Searching Allegro with OAuth (${useSandbox ? 'SANDBOX' : 'PRODUCTION'}):`, { 
      query, 
      minPrice, 
      maxPrice, 
      limit,
      apiUrl 
    });

    // Call Allegro API with OAuth token
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.allegro.public.v1+json',
      },
      params: searchParams,
    });

    // Extract items from response
    const items = response.data.items?.promoted || [];
    const regular = response.data.items?.regular || [];
    const allItems = [...items, ...regular];

    console.log(`✅ Found ${allItems.length} results from Allegro`);

    // Transform to simpler format
    const results = allItems.map(item => ({
      id: item.id,
      name: item.name,
      price: {
        amount: parseFloat(item.sellingMode?.price?.amount || 0),
        currency: item.sellingMode?.price?.currency || 'PLN',
      },
      delivery: {
        free: item.delivery?.lowestPrice?.amount === '0.00',
        price: parseFloat(item.delivery?.lowestPrice?.amount || 0),
      },
      seller: {
        login: item.seller?.login || 'Unknown',
        superSeller: item.seller?.superSeller || false,
      },
      stock: item.stock?.available || 0,
      url: `https://allegro.pl/oferta/${item.id}`,
      thumbnail: item.images?.[0]?.url || null,
      location: item.location?.city || '',
    }));

    return res.status(200).json({
      success: true,
      query,
      count: results.length,
      results,
      demo: false,
    });

  } catch (error) {
    console.error('❌ Allegro search error:', error.response?.data || error.message);
    console.error('❌ Full error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });
    
    // Fallback to demo mode on error
    if (error.message.includes('credentials not configured')) {
      const sampleResults = generateSampleResults(query, minPrice, maxPrice, limit);
      
      return res.status(200).json({
        success: true,
        query,
        count: sampleResults.length,
        results: sampleResults,
        demo: true,
        message: 'Tryb DEMO - ' + error.message
      });
    }

    return res.status(500).json({ 
      error: 'Failed to search Allegro',
      details: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    });
  }
}

// Generate sample results for demo
function generateSampleResults(query, minPrice, maxPrice, limit) {
  const queryLower = query.toLowerCase();
  
  // Sample parts database
  const sampleParts = [
    {
      id: 'DEMO001',
      name: 'Pasek napędowy HTD 3M 450mm uniwersalny',
      price: { amount: 89.99, currency: 'PLN' },
      delivery: { free: true, price: 0 },
      seller: { login: 'czescidoAGD', superSeller: true },
      stock: 15,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QYXNlazwvdGV4dD48L3N2Zz4=',
      location: 'Warszawa',
      keywords: ['pasek', 'napędowy', 'htd', 'pas']
    },
    {
      id: 'DEMO002',
      name: 'Pasek klinowy do pralki Bosch Siemens',
      price: { amount: 45.50, currency: 'PLN' },
      delivery: { free: false, price: 15.00 },
      seller: { login: 'AGD-Parts', superSeller: false },
      stock: 8,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Cb3NjaDwvdGV4dD48L3N2Zz4=',
      location: 'Kraków',
      keywords: ['pasek', 'klinowy', 'bosch', 'siemens', 'pralka']
    },
    {
      id: 'DEMO003',
      name: 'Filtr HEPA do odkurzacza Dyson V11 V15',
      price: { amount: 129.00, currency: 'PLN' },
      delivery: { free: true, price: 0 },
      seller: { login: 'DysonParts', superSeller: true },
      stock: 25,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GaWx0cjwvdGV4dD48L3N2Zz4=',
      location: 'Poznań',
      keywords: ['filtr', 'hepa', 'dyson', 'odkurzacz']
    },
    {
      id: 'DEMO004',
      name: 'Pompa odpływowa do pralki uniwersalna 30W',
      price: { amount: 65.00, currency: 'PLN' },
      delivery: { free: false, price: 12.99 },
      seller: { login: 'SerwisAGD24', superSeller: true },
      stock: 12,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qb21wYTwvdGV4dD48L3N2Zz4=',
      location: 'Wrocław',
      keywords: ['pompa', 'odpływowa', 'pralka']
    },
    {
      id: 'DEMO005',
      name: 'Termostat do lodówki Whirlpool Samsung',
      price: { amount: 78.50, currency: 'PLN' },
      delivery: { free: true, price: 0 },
      seller: { login: 'ChlodExpress', superSeller: false },
      stock: 6,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UZXJtb3N0YXQ8L3RleHQ+PC9zdmc+',
      location: 'Gdańsk',
      keywords: ['termostat', 'lodówka', 'whirlpool', 'samsung']
    },
    {
      id: 'DEMO006',
      name: 'Grzałka do zmywarki Bosch 2000W',
      price: { amount: 95.00, currency: 'PLN' },
      delivery: { free: false, price: 10.00 },
      seller: { login: 'BoschService', superSeller: true },
      stock: 18,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HcnphxYJrYTwvdGV4dD48L3N2Zz4=',
      location: 'Łódź',
      keywords: ['grzałka', 'zmywarka', 'bosch']
    },
    {
      id: 'DEMO007',
      name: 'Pasek 1192 J5 do pralki elastyczny',
      price: { amount: 35.99, currency: 'PLN' },
      delivery: { free: false, price: 13.50 },
      seller: { login: 'PaskiAGD', superSeller: false },
      stock: 30,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4xMTkyIEo1PC90ZXh0Pjwvc3ZnPg==',
      location: 'Katowice',
      keywords: ['pasek', '1192', 'j5', 'pralka']
    },
    {
      id: 'DEMO008',
      name: 'Elektrozawór do pralki 3-drożny 180 stopni',
      price: { amount: 55.00, currency: 'PLN' },
      delivery: { free: true, price: 0 },
      seller: { login: 'HydroAGD', superSeller: true },
      stock: 14,
      url: 'https://allegro.pl/listing?string=' + encodeURIComponent(query),
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5aYXdvcjwvdGV4dD48L3N2Zz4=',
      location: 'Szczecin',
      keywords: ['elektrozawór', 'zawór', 'pralka']
    }
  ];

  // Filter by query keywords
  let filtered = sampleParts.filter(part => {
    const matchesQuery = part.keywords.some(keyword => 
      queryLower.includes(keyword) || keyword.includes(queryLower)
    ) || part.name.toLowerCase().includes(queryLower);
    
    return matchesQuery;
  });

  // If no matches, return all as fallback
  if (filtered.length === 0) {
    filtered = sampleParts;
  }

  // Filter by price range
  const min = parseFloat(minPrice) || 0;
  const max = parseFloat(maxPrice) || Infinity;
  
  filtered = filtered.filter(part => {
    const price = parseFloat(part.price.amount);
    return price >= min && price <= max;
  });

  // Limit results
  const limitNum = parseInt(limit) || 20;
  filtered = filtered.slice(0, limitNum);

  return filtered;
}
