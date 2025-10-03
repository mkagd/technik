// pages/api/system/backup.js
// API endpoint for backup system management

import { AutoBackupSystem, getBackupSystem } from '../../../utils/autoBackup.js';
import requireAuth, { requireAdmin } from '../../../middleware/auth.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    // Get backup system status
    try {
      const system = getBackupSystem();
      
      if (!system) {
        return res.status(503).json({
          success: false,
          error: 'BACKUP_SYSTEM_NOT_INITIALIZED',
          message: 'Backup system not initialized'
        });
      }
      
      const status = system.getStatus();
      const backups = await system.listBackups();
      
      res.status(200).json({
        success: true,
        message: 'Backup system status retrieved',
        data: {
          status,
          backups: backups.slice(0, 20) // Limit to recent 20 backups
        }
      });
    } catch (error) {
      console.error('🗄️ Get backup status error:', error);
      res.status(500).json({
        success: false,
        error: 'BACKUP_STATUS_ERROR',
        message: 'Failed to get backup status'
      });
    }
  }
  
  else if (req.method === 'POST') {
    // Create manual backup
    try {
      const system = getBackupSystem();
      
      if (!system) {
        return res.status(503).json({
          success: false,
          error: 'BACKUP_SYSTEM_NOT_INITIALIZED',
          message: 'Backup system not initialized'
        });
      }
      
      const { type = 'manual' } = req.body;
      
      if (!['manual', 'hourly', 'daily', 'weekly', 'monthly'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_BACKUP_TYPE',
          message: 'Invalid backup type'
        });
      }
      
      console.log(`🗄️ Manual backup requested by ${req.user.email} (${type})`);
      
      const result = await system.createBackup(type);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: `${type} backup created successfully`,
          data: {
            path: result.path,
            duration: result.duration,
            metadata: result.metadata
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'BACKUP_FAILED',
          message: result.error
        });
      }
    } catch (error) {
      console.error('🗄️ Create backup error:', error);
      res.status(500).json({
        success: false,
        error: 'BACKUP_ERROR',
        message: 'Failed to create backup'
      });
    }
  }
  
  else if (req.method === 'PUT') {
    // Restore from backup
    try {
      const system = getBackupSystem();
      
      if (!system) {
        return res.status(503).json({
          success: false,
          error: 'BACKUP_SYSTEM_NOT_INITIALIZED',
          message: 'Backup system not initialized'
        });
      }
      
      const { backupPath } = req.body;
      
      if (!backupPath) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_BACKUP_PATH',
          message: 'Backup path is required'
        });
      }
      
      console.log(`🔄 Restore requested by ${req.user.email} from: ${backupPath}`);
      
      const result = await system.restoreFromBackup(backupPath);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Restore completed successfully',
          data: {
            metadata: result.metadata,
            restorePoint: result.restorePoint
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'RESTORE_FAILED',
          message: result.error
        });
      }
    } catch (error) {
      console.error('🗄️ Restore error:', error);
      res.status(500).json({
        success: false,
        error: 'RESTORE_ERROR',
        message: 'Failed to restore from backup'
      });
    }
  }
  
  else if (req.method === 'DELETE') {
    // Clean up old backups manually
    try {
      const system = getBackupSystem();
      
      if (!system) {
        return res.status(503).json({
          success: false,
          error: 'BACKUP_SYSTEM_NOT_INITIALIZED',
          message: 'Backup system not initialized'
        });
      }
      
      console.log(`🧹 Manual backup cleanup requested by ${req.user.email}`);
      
      await system.cleanupOldBackups();
      
      res.status(200).json({
        success: true,
        message: 'Backup cleanup completed'
      });
    } catch (error) {
      console.error('🗄️ Backup cleanup error:', error);
      res.status(500).json({
        success: false,
        error: 'CLEANUP_ERROR',
        message: 'Failed to cleanup backups'
      });
    }
  }
  
  else {
    res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed'
    });
  }
}

// Apply admin authentication middleware
export default requireAdmin()(handler);