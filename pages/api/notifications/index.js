import fs from 'fs';
import path from 'path';

const notificationsPath = path.join(process.cwd(), 'data', 'notifications.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // ============================================
    // GET: Lista notyfikacji
    // ============================================
    const { 
      userId,     // null = dla wszystkich adminów/logistyków
      type,       // 'info', 'success', 'warning', 'error'
      read,       // true/false
      limit 
    } = req.query;
    
    let notifications = readJSON(notificationsPath);
    if (!notifications) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać notyfikacji' 
      });
    }
    
    // Filtrowanie
    if (userId !== undefined) {
      if (userId === 'null' || userId === '') {
        // Notyfikacje globalne (dla wszystkich)
        notifications = notifications.filter(n => n.userId === null);
      } else {
        // Notyfikacje dla konkretnego użytkownika + globalne
        notifications = notifications.filter(n => 
          n.userId === userId || n.userId === null
        );
      }
    }
    
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    
    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter(n => n.read === isRead);
    }
    
    // Sortowanie: najnowsze pierwsze
    notifications.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Limit
    if (limit) {
      const limitNum = parseInt(limit);
      notifications = notifications.slice(0, limitNum);
    }
    
    // Statystyki
    const unreadCount = notifications.filter(n => !n.read).length;
    
    return res.status(200).json({ 
      success: true, 
      notifications,
      count: notifications.length,
      unreadCount
    });
    
  } else if (req.method === 'PUT') {
    // ============================================
    // PUT: Oznacz jako przeczytane
    // ============================================
    const { 
      notificationIds,  // Array lub single ID
      markAll           // true = oznacz wszystkie jako przeczytane
    } = req.body;
    
    let notifications = readJSON(notificationsPath);
    if (!notifications) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać notyfikacji' 
      });
    }
    
    let updatedCount = 0;
    
    if (markAll) {
      // Oznacz wszystkie jako przeczytane
      notifications = notifications.map(n => {
        if (!n.read) {
          updatedCount++;
          return {
            ...n,
            read: true,
            readAt: new Date().toISOString()
          };
        }
        return n;
      });
    } else if (notificationIds) {
      // Oznacz konkretne notyfikacje
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      notifications = notifications.map(n => {
        if (ids.includes(n.id) && !n.read) {
          updatedCount++;
          return {
            ...n,
            read: true,
            readAt: new Date().toISOString()
          };
        }
        return n;
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak notificationIds lub markAll' 
      });
    }
    
    // Zapisz
    if (!writeJSON(notificationsPath, notifications)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można zapisać notyfikacji' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      updatedCount,
      message: `Oznaczono ${updatedCount} notyfikacji jako przeczytane`
    });
    
  } else if (req.method === 'DELETE') {
    // ============================================
    // DELETE: Usuń notyfikacje
    // ============================================
    const { 
      notificationIds,  // Array lub single ID
      deleteAll,        // true = usuń wszystkie przeczytane
      olderThan         // Usuń starsze niż X dni
    } = req.body;
    
    let notifications = readJSON(notificationsPath);
    if (!notifications) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można odczytać notyfikacji' 
      });
    }
    
    const beforeCount = notifications.length;
    
    if (deleteAll) {
      // Usuń wszystkie przeczytane
      notifications = notifications.filter(n => !n.read);
    } else if (olderThan) {
      // Usuń starsze niż X dni
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(olderThan));
      notifications = notifications.filter(n => 
        new Date(n.createdAt) >= daysAgo
      );
    } else if (notificationIds) {
      // Usuń konkretne notyfikacje
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      notifications = notifications.filter(n => !ids.includes(n.id));
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Brak notificationIds, deleteAll lub olderThan' 
      });
    }
    
    const deletedCount = beforeCount - notifications.length;
    
    // Zapisz
    if (!writeJSON(notificationsPath, notifications)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Nie można zapisać notyfikacji' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      deletedCount,
      message: `Usunięto ${deletedCount} notyfikacji`
    });
    
  } else {
    res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }
}
