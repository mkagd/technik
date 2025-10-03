import fs from 'fs';
import path from 'path';

/**
 * API endpoint for notifications management
 * GET /api/notifications - Get all notifications or unread count
 * POST /api/notifications - Create new notification
 * PUT /api/notifications - Mark notification(s) as read
 * DELETE /api/notifications - Delete notification(s)
 */
export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'data', 'notifications.json');

  // Helper function to read notifications
  const readNotifications = () => {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading notifications:', error);
      return [];
    }
  };

  // Helper function to write notifications
  const writeNotifications = (notifications) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing notifications:', error);
      return false;
    }
  };

  // GET - Get all notifications or unread count
  if (req.method === 'GET') {
    try {
      const notifications = readNotifications();
      
      // If ?count=unread, return only unread count
      if (req.query.count === 'unread') {
        const unreadCount = notifications.filter(n => !n.read).length;
        return res.status(200).json({ unreadCount });
      }

      // If ?read=false, return only unread notifications
      if (req.query.read === 'false') {
        const unread = notifications.filter(n => !n.read);
        return res.status(200).json(unread);
      }

      // Return all notifications (sorted by date, newest first)
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(notifications);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  // POST - Create new notification
  if (req.method === 'POST') {
    try {
      const { title, message, type, link, userId } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      const notifications = readNotifications();
      
      const newNotification = {
        id: Date.now(),
        title,
        message,
        type: type || 'info', // info, success, warning, error
        link: link || null,
        userId: userId || null, // null = for all users
        read: false,
        createdAt: new Date().toISOString(),
      };

      notifications.push(newNotification);
      
      if (writeNotifications(notifications)) {
        return res.status(201).json(newNotification);
      } else {
        return res.status(500).json({ error: 'Failed to save notification' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  }

  // PUT - Mark notification(s) as read
  if (req.method === 'PUT') {
    try {
      const { id, ids, markAllAsRead } = req.body;

      const notifications = readNotifications();
      let updated = 0;

      if (markAllAsRead) {
        // Mark all as read
        notifications.forEach(n => {
          if (!n.read) {
            n.read = true;
            n.readAt = new Date().toISOString();
            updated++;
          }
        });
      } else if (ids && Array.isArray(ids)) {
        // Mark multiple by IDs
        notifications.forEach(n => {
          if (ids.includes(n.id) && !n.read) {
            n.read = true;
            n.readAt = new Date().toISOString();
            updated++;
          }
        });
      } else if (id) {
        // Mark single by ID
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          updated = 1;
        }
      }

      if (updated > 0) {
        if (writeNotifications(notifications)) {
          return res.status(200).json({ 
            success: true, 
            updated,
            message: `Marked ${updated} notification(s) as read` 
          });
        } else {
          return res.status(500).json({ error: 'Failed to update notifications' });
        }
      } else {
        return res.status(404).json({ error: 'No notifications updated' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update notification' });
    }
  }

  // DELETE - Delete notification(s)
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const { ids, deleteAll, deleteRead } = req.body;

      let notifications = readNotifications();
      const initialLength = notifications.length;

      if (deleteAll) {
        // Delete all notifications
        notifications = [];
      } else if (deleteRead) {
        // Delete only read notifications
        notifications = notifications.filter(n => !n.read);
      } else if (ids && Array.isArray(ids)) {
        // Delete multiple by IDs
        notifications = notifications.filter(n => !ids.includes(n.id));
      } else if (id) {
        // Delete single by ID
        notifications = notifications.filter(n => n.id !== parseInt(id));
      } else {
        return res.status(400).json({ error: 'No deletion criteria provided' });
      }

      const deleted = initialLength - notifications.length;

      if (deleted > 0) {
        if (writeNotifications(notifications)) {
          return res.status(200).json({ 
            success: true, 
            deleted,
            message: `Deleted ${deleted} notification(s)` 
          });
        } else {
          return res.status(500).json({ error: 'Failed to delete notifications' });
        }
      } else {
        return res.status(404).json({ error: 'No notifications deleted' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
