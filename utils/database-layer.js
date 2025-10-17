// utils/database-layer.js
// Uniwersalna warstwa dostępu do danych (Local JSON lub Supabase)

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Konfiguracja
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_FILES = process.env.USE_LOCAL_FILES !== 'false'; // Domyślnie true

// Supabase client (lazy load)
let supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient && USE_SUPABASE) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseClient;
}

// ==========================================
// HELPER: Lokalne pliki JSON
// ==========================================

function getFilePath(collection) {
  return path.join(process.cwd(), 'data', `${collection}.json`);
}

function readLocalJSON(collection) {
  try {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Local file not found: ${collection}.json, creating empty`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    // Obsługa zarówno [] jak i { items: [] }
    if (Array.isArray(parsed)) return parsed;
    if (parsed[collection]) return parsed[collection];
    if (parsed.items) return parsed.items;
    
    return [];
  } catch (error) {
    console.error(`❌ Error reading ${collection}.json:`, error);
    return [];
  }
}

function writeLocalJSON(collection, data) {
  try {
    const filePath = getFilePath(collection);
    const dir = path.dirname(filePath);
    
    // Utwórz folder data/ jeśli nie istnieje
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${collection}.json:`, error);
    return false;
  }
}

// ==========================================
// API: Uniwersalne metody
// ==========================================

/**
 * GET ALL - Pobierz wszystkie rekordy
 * @param {string} collection - Nazwa kolekcji (np. 'orders', 'employees')
 * @param {object} filters - Opcjonalne filtry { field: value }
 */
export async function getAll(collection, filters = {}) {
  console.log(`📚 getAll(${collection}) - Mode: ${USE_SUPABASE ? 'Supabase' : 'Local'}`);
  
  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from(collection).select('*');
      
      // Zastosuj filtry
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase error:', error);
        if (USE_LOCAL_FILES) {
          console.log('⚠️ Falling back to local files');
          return readLocalJSON(collection);
        }
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase exception:', error);
      if (USE_LOCAL_FILES) {
        console.log('⚠️ Falling back to local files');
        return readLocalJSON(collection);
      }
      throw error;
    }
  } else {
    // Tryb lokalny
    let data = readLocalJSON(collection);
    
    // Zastosuj filtry lokalnie
    if (Object.keys(filters).length > 0) {
      data = data.filter(item => 
        Object.entries(filters).every(([key, value]) => item[key] === value)
      );
    }
    
    return data;
  }
}

/**
 * GET ONE - Pobierz pojedynczy rekord po ID
 * @param {string} collection - Nazwa kolekcji
 * @param {string} id - ID rekordu
 * @param {string} idField - Nazwa pola ID (domyślnie: 'id')
 */
export async function getOne(collection, id, idField = 'id') {
  console.log(`📄 getOne(${collection}, ${id})`);
  
  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(collection)
        .select('*')
        .eq(idField, id)
        .single();
      
      if (error) {
        if (USE_LOCAL_FILES) {
          const items = readLocalJSON(collection);
          return items.find(item => item[idField] === id) || null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        return items.find(item => item[idField] === id) || null;
      }
      throw error;
    }
  } else {
    const items = readLocalJSON(collection);
    return items.find(item => item[idField] === id) || null;
  }
}

/**
 * CREATE - Dodaj nowy rekord
 * @param {string} collection - Nazwa kolekcji
 * @param {object} item - Dane do dodania
 */
export async function create(collection, item) {
  console.log(`➕ create(${collection})`);
  
  // Dodaj timestamp jeśli nie ma
  if (!item.createdAt) {
    item.createdAt = new Date().toISOString();
  }
  
  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(collection)
        .insert(item)
        .select()
        .single();
      
      if (error) {
        if (USE_LOCAL_FILES) {
          // Fallback: zapisz lokalnie
          console.log('⚠️ Supabase failed, saving locally');
          const items = readLocalJSON(collection);
          items.push(item);
          writeLocalJSON(collection, items);
          return item;
        }
        throw error;
      }
      
      // Synchronizuj lokalnie (dla bezpieczeństwa)
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        items.push(data);
        writeLocalJSON(collection, items);
      }
      
      return data;
    } catch (error) {
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        items.push(item);
        writeLocalJSON(collection, items);
        return item;
      }
      throw error;
    }
  } else {
    const items = readLocalJSON(collection);
    items.push(item);
    writeLocalJSON(collection, items);
    return item;
  }
}

/**
 * UPDATE - Zaktualizuj rekord
 * @param {string} collection - Nazwa kolekcji
 * @param {string} id - ID rekordu
 * @param {object} updates - Dane do aktualizacji
 * @param {string} idField - Nazwa pola ID (domyślnie: 'id')
 */
export async function update(collection, id, updates, idField = 'id') {
  console.log(`✏️ update(${collection}, ${id})`);
  
  // Dodaj timestamp
  updates.updatedAt = new Date().toISOString();
  
  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(collection)
        .update(updates)
        .eq(idField, id)
        .select()
        .single();
      
      if (error) {
        if (USE_LOCAL_FILES) {
          const items = readLocalJSON(collection);
          const index = items.findIndex(item => item[idField] === id);
          if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            writeLocalJSON(collection, items);
            return items[index];
          }
        }
        throw error;
      }
      
      // Synchronizuj lokalnie
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        const index = items.findIndex(item => item[idField] === id);
        if (index !== -1) {
          items[index] = data;
          writeLocalJSON(collection, items);
        }
      }
      
      return data;
    } catch (error) {
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        const index = items.findIndex(item => item[idField] === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          writeLocalJSON(collection, items);
          return items[index];
        }
      }
      throw error;
    }
  } else {
    const items = readLocalJSON(collection);
    const index = items.findIndex(item => item[idField] === id);
    
    if (index === -1) {
      throw new Error(`Item not found: ${id}`);
    }
    
    items[index] = { ...items[index], ...updates };
    writeLocalJSON(collection, items);
    return items[index];
  }
}

/**
 * DELETE - Usuń rekord
 * @param {string} collection - Nazwa kolekcji
 * @param {string} id - ID rekordu
 * @param {string} idField - Nazwa pola ID (domyślnie: 'id')
 */
export async function deleteOne(collection, id, idField = 'id') {
  console.log(`🗑️ delete(${collection}, ${id})`);
  
  if (USE_SUPABASE) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from(collection)
        .delete()
        .eq(idField, id);
      
      if (error) {
        if (USE_LOCAL_FILES) {
          const items = readLocalJSON(collection);
          const filtered = items.filter(item => item[idField] !== id);
          writeLocalJSON(collection, filtered);
          return true;
        }
        throw error;
      }
      
      // Synchronizuj lokalnie
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        const filtered = items.filter(item => item[idField] !== id);
        writeLocalJSON(collection, filtered);
      }
      
      return true;
    } catch (error) {
      if (USE_LOCAL_FILES) {
        const items = readLocalJSON(collection);
        const filtered = items.filter(item => item[idField] !== id);
        writeLocalJSON(collection, filtered);
        return true;
      }
      throw error;
    }
  } else {
    const items = readLocalJSON(collection);
    const filtered = items.filter(item => item[idField] !== id);
    writeLocalJSON(collection, filtered);
    return true;
  }
}

// ==========================================
// SYNC: Synchronizacja offline → online
// ==========================================

/**
 * Synchronizuj lokalne zmiany z Supabase (po powrocie online)
 */
export async function syncPendingChanges() {
  if (!USE_SUPABASE) {
    console.log('⚠️ Supabase disabled, skipping sync');
    return;
  }
  
  // TODO: Implementacja kolejki synchronizacji
  console.log('🔄 Syncing pending changes...');
}

// ==========================================
// EKSPORT
// ==========================================

export default {
  getAll,
  getOne,
  create,
  update,
  delete: deleteOne,
  syncPendingChanges
};
