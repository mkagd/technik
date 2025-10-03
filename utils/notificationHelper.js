import fs from 'fs';
import path from 'path';

/**
 * Helper function to create notifications
 * This can be imported and used in any API endpoint
 */
export async function createNotification({ title, message, type = 'info', link = null, userId = null }) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'notifications.json');
    
    // Read existing notifications
    let notifications = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      notifications = JSON.parse(data);
    }
    
    // Create new notification
    const newNotification = {
      id: Date.now() + Math.floor(Math.random() * 1000), // Prevent ID collisions
      title,
      message,
      type, // 'info', 'success', 'warning', 'error'
      link,
      userId, // null = for all users
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    notifications.push(newNotification);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2), 'utf8');
    
    console.log('📢 Notification created:', newNotification);
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Pre-defined notification templates
 */
export const NotificationTemplates = {
  newReservation: (name, category) => ({
    title: 'Nowa rezerwacja',
    message: `${name} zgłosił rezerwację: ${category}`,
    type: 'info',
    link: '/admin/rezerwacje'
  }),
  
  newOrder: (orderNumber, deviceType) => ({
    title: 'Nowe zamówienie',
    message: `Utworzono zamówienie ${orderNumber} - ${deviceType}`,
    type: 'success',
    link: '/admin/zamowienia'
  }),
  
  newClient: (name) => ({
    title: 'Nowy klient',
    message: `Zarejestrowano nowego klienta: ${name}`,
    type: 'info',
    link: '/admin/klienci'
  }),
  
  orderStatusChanged: (orderNumber, status) => ({
    title: 'Zmiana statusu zamówienia',
    message: `Zamówienie ${orderNumber} - nowy status: ${status}`,
    type: 'warning',
    link: '/admin/zamowienia'
  }),
  
  visitScheduled: (orderNumber, date) => ({
    title: 'Zaplanowano wizytę',
    message: `Wizyta dla zamówienia ${orderNumber} - ${date}`,
    type: 'success',
    link: '/admin/kalendarz'
  })
};
