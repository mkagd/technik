-- database/schema.sql
-- Struktura bazy danych gotowa na migrację

-- Tabela pracowników
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization JSON, -- PostgreSQL: JSONB, MySQL: JSON
    role ENUM('admin', 'employee', 'manager') DEFAULT 'employee',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLogin TIMESTAMP NULL,
    settings JSON,
    
    INDEX idx_email (email),
    INDEX idx_active (isActive),
    INDEX idx_role (role)
);

-- Tabela harmonogramów
CREATE TABLE schedules (
    id VARCHAR(50) PRIMARY KEY,
    employeeId VARCHAR(50) NOT NULL,
    type ENUM('weekly', 'daily', 'custom') DEFAULT 'weekly',
    data JSON NOT NULL, -- Szczegóły harmonogramu
    isActive BOOLEAN DEFAULT TRUE,
    validFrom TIMESTAMP NOT NULL,
    validTo TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdBy VARCHAR(50),
    version INT DEFAULT 1,
    
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES employees(id) ON DELETE SET NULL,
    
    INDEX idx_employee (employeeId),
    INDEX idx_active (isActive),
    INDEX idx_dates (validFrom, validTo),
    INDEX idx_type (type)
);

-- Tabela rezerwacji
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY,
    employeeId VARCHAR(50) NOT NULL,
    clientName VARCHAR(200) NOT NULL,
    clientEmail VARCHAR(255),
    clientPhone VARCHAR(20) NOT NULL,
    serviceType VARCHAR(100) NOT NULL,
    description TEXT,
    scheduledDate DATE NOT NULL,
    scheduledTime TIME NOT NULL,
    estimatedDuration INT DEFAULT 60, -- minuty
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    price DECIMAL(10,2),
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completedAt TIMESTAMP NULL,
    
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    
    INDEX idx_employee (employeeId),
    INDEX idx_date (scheduledDate),
    INDEX idx_status (status),
    INDEX idx_client_phone (clientPhone),
    INDEX idx_scheduled (scheduledDate, scheduledTime)
);

-- Tabela logów operacji (audyt)
CREATE TABLE activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entityType VARCHAR(50),
    entityId VARCHAR(50),
    details JSON,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES employees(id) ON DELETE SET NULL,
    
    INDEX idx_user (userId),
    INDEX idx_action (action),
    INDEX idx_entity (entityType, entityId),
    INDEX idx_created (createdAt)
);

-- Tabela ustawień aplikacji
CREATE TABLE app_settings (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    settingKey VARCHAR(100) NOT NULL,
    settingValue JSON,
    description TEXT,
    isSystem BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_setting (category, settingKey),
    INDEX idx_category (category),
    INDEX idx_system (isSystem)
);

-- Tabela synchronizacji (tracking zmian)
CREATE TABLE sync_tracking (
    id VARCHAR(50) PRIMARY KEY,
    tableName VARCHAR(100) NOT NULL,
    recordId VARCHAR(50) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    syncStatus ENUM('pending', 'synced', 'failed') DEFAULT 'pending',
    syncAttempts INT DEFAULT 0,
    lastSyncAttempt TIMESTAMP NULL,
    errorMessage TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (tableName, recordId),
    INDEX idx_status (syncStatus),
    INDEX idx_pending (syncStatus, syncAttempts)
);

-- Tabela użytkowników (dla autentykacji)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Zahashowane hasło
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    role ENUM('admin', 'employee', 'customer') DEFAULT 'customer',
    isActive BOOLEAN DEFAULT TRUE,
    emailVerified BOOLEAN DEFAULT FALSE,
    lastPasswordChange TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLogin TIMESTAMP NULL,
    loginAttempts INT DEFAULT 0,
    lockedUntil TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_active (isActive),
    INDEX idx_role (role)
);

-- Tabela tokenów resetowania hasła
CREATE TABLE password_reset_tokens (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NOT NULL,
    usedAt TIMESTAMP NULL,
    ip VARCHAR(45), -- IPv6 support
    userAgent TEXT,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_token (token),
    INDEX idx_user (userId),
    INDEX idx_expires (expiresAt),
    INDEX idx_used (used)
);

-- Tabela sesji użytkowników
CREATE TABLE user_sessions (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    sessionToken VARCHAR(255) UNIQUE NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiresAt TIMESTAMP NOT NULL,
    lastActivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invalidatedAt TIMESTAMP NULL,
    ip VARCHAR(45),
    userAgent TEXT,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_token (sessionToken),
    INDEX idx_user (userId),
    INDEX idx_active (isActive),
    INDEX idx_expires (expiresAt)
);

-- Tabela logów bezpieczeństwa
CREATE TABLE security_logs (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NULL,
    event VARCHAR(100) NOT NULL,
    details JSON,
    ip VARCHAR(45),
    userAgent TEXT,
    success BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user (userId),
    INDEX idx_event (event),
    INDEX idx_created (createdAt),
    INDEX idx_ip (ip)
);

-- Widoki dla raportów
CREATE VIEW employee_schedule_summary AS
SELECT 
    e.id,
    e.firstName,
    e.lastName,
    e.specialization,
    COUNT(s.id) as schedule_count,
    MAX(s.updatedAt) as last_schedule_update,
    COUNT(b.id) as booking_count,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings
FROM employees e
LEFT JOIN schedules s ON e.id = s.employeeId AND s.isActive = TRUE
LEFT JOIN bookings b ON e.id = b.employeeId 
    AND b.scheduledDate >= CURDATE() - INTERVAL 30 DAY
WHERE e.isActive = TRUE
GROUP BY e.id, e.firstName, e.lastName, e.specialization;

-- Funkcje pomocnicze (MySQL)
DELIMITER //

CREATE FUNCTION get_employee_availability(emp_id VARCHAR(50), check_date DATE, check_time TIME)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE available BOOLEAN DEFAULT FALSE;
    
    -- Sprawdź czy pracownik ma harmonogram na ten dzień
    SELECT COUNT(*) > 0 INTO available
    FROM schedules s
    WHERE s.employeeId = emp_id
    AND s.isActive = TRUE
    AND (s.validFrom <= check_date)
    AND (s.validTo IS NULL OR s.validTo >= check_date)
    AND JSON_EXTRACT(s.data, '$.available') = TRUE;
    
    RETURN available;
END //

DELIMITER ;

-- Triggery dla audytu
DELIMITER //

CREATE TRIGGER employees_audit_insert 
AFTER INSERT ON employees
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (id, userId, action, entityType, entityId, details)
    VALUES (
        CONCAT(UNIX_TIMESTAMP(), RAND()),
        NEW.id,
        'INSERT',
        'employee',
        NEW.id,
        JSON_OBJECT('firstName', NEW.firstName, 'lastName', NEW.lastName)
    );
END //

CREATE TRIGGER schedules_audit_insert 
AFTER INSERT ON schedules
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (id, userId, action, entityType, entityId, details)
    VALUES (
        CONCAT(UNIX_TIMESTAMP(), RAND()),
        NEW.createdBy,
        'INSERT',
        'schedule',
        NEW.id,
        JSON_OBJECT('employeeId', NEW.employeeId, 'type', NEW.type)
    );
END //

CREATE TRIGGER bookings_audit_update 
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (id, userId, action, entityType, entityId, details)
        VALUES (
            CONCAT(UNIX_TIMESTAMP(), RAND()),
            NEW.employeeId,
            'UPDATE',
            'booking',
            NEW.id,
            JSON_OBJECT('oldStatus', OLD.status, 'newStatus', NEW.status)
        );
    END IF;
END //

DELIMITER ;

-- Przykładowe dane testowe
INSERT INTO employees (id, firstName, lastName, email, specialization, role) VALUES
('emp_001', 'Jan', 'Kowalski', 'jan.kowalski@technik.pl', '["Mechanika", "Elektryka"]', 'employee'),
('emp_002', 'Anna', 'Nowak', 'anna.nowak@technik.pl', '["Diagnostyka", "Lakiernictwo"]', 'employee'),
('emp_003', 'Piotr', 'Admin', 'admin@technik.pl', '["Zarządzanie"]', 'admin');

INSERT INTO app_settings (id, category, settingKey, settingValue, description) VALUES
('set_001', 'booking', 'default_duration', '60', 'Domyślny czas trwania rezerwacji w minutach'),
('set_002', 'schedule', 'max_advance_days', '30', 'Maksymalna liczba dni do przodu dla rezerwacji'),
('set_003', 'notification', 'send_reminders', 'true', 'Czy wysyłać przypomnienia o rezerwacjach');
