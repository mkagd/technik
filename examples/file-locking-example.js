/**
 * 🔒 PRZYKŁAD FILE LOCKING
 * Zapobiega jednoczesnej edycji tego samego pliku
 */

// utils/fileLock.js
import lockfile from 'lockfile';
import fs from 'fs';

export async function withFileLock(filePath, operation) {
  const lockPath = filePath + '.lock';
  
  return new Promise((resolve, reject) => {
    // Spróbuj założyć blokadę (max 5 sekund czekania)
    lockfile.lock(lockPath, { wait: 5000 }, async (err) => {
      if (err) {
        return reject(new Error('Could not acquire file lock'));
      }

      try {
        // Wykonaj operację
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        // Zawsze odblokuj plik
        lockfile.unlock(lockPath, (unlockErr) => {
          if (unlockErr) console.warn('Failed to unlock:', unlockErr);
        });
      }
    });
  });
}

// Użycie w praktyce:
// utils/clientOrderStorage.js - BEZPIECZNE ZAPISY
export const updateClient = async (updatedClient) => {
  return withFileLock(CLIENTS_FILE, async () => {
    // Tylko jedna osoba może edytować naraz
    const clients = readClients();
    const index = clients.findIndex(c => c.id === updatedClient.id);
    
    if (index !== -1) {
      clients[index] = updatedClient;
      writeClients(clients);
      return updatedClient;
    }
    return null;
  });
};

// PRZED: Chaos przy równoczesnej edycji
// User A: clients[0].name = "Jan"     } Równocześnie
// User B: clients[0].phone = "123"    } → Jeden nadpisuje drugiego!

// PO: Uporządkowany dostęp
// User A: 🔒 Lock → edit → save → 🔓 Unlock
// User B: ⏳ Wait → 🔒 Lock → edit → save → 🔓 Unlock