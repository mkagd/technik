// pages/api/health-check.js
// Prosty endpoint do sprawdzenia czy serwer działa

export default function handler(req, res) {
  const serverTime = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  res.status(200).json({
    success: true,
    message: '✅ Serwer działa poprawnie!',
    timestamp: serverTime,
    clientIp: ip,
    method: req.method,
    userAgent: req.headers['user-agent'],
    server: {
      node: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    }
  });
}
