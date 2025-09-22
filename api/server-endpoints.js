// api/server-endpoints.js
// Przygotowane endpointy API dla serwera Express.js/Node.js

// Przykładowa struktura endpointów dla przyszłego serwera

const express = require('express');
const router = express.Router();

// ===============================
// EMPLOYEES ENDPOINTS
// ===============================

// GET /api/employees - Lista pracowników
router.get('/employees', async (req, res) => {
    try {
        const { active = true, role } = req.query;

        let query = 'SELECT * FROM employees WHERE 1=1';
        const params = [];

        if (active !== 'all') {
            query += ' AND isActive = ?';
            params.push(active === 'true');
        }

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        query += ' ORDER BY firstName, lastName';

        // const employees = await db.query(query, params);

        res.json({
            success: true,
            data: employees,
            count: employees.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/employees/:id - Szczegóły pracownika
router.get('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // const employee = await db.query(
        //   'SELECT * FROM employees WHERE id = ?',
        //   [id]
        // );

        if (!employee) {
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: employee
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/employees - Dodaj pracownika
router.post('/employees', async (req, res) => {
    try {
        const employeeData = req.body;

        // Walidacja
        if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // const result = await db.query(
        //   'INSERT INTO employees (id, firstName, lastName, email, phone, specialization, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        //   [
        //     employeeData.id,
        //     employeeData.firstName,
        //     employeeData.lastName,
        //     employeeData.email,
        //     employeeData.phone,
        //     JSON.stringify(employeeData.specialization),
        //     employeeData.role
        //   ]
        // );

        res.status(201).json({
            success: true,
            data: { id: employeeData.id, ...employeeData }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/employees/:id - Aktualizuj pracownika
router.put('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // const result = await db.query(
        //   'UPDATE employees SET firstName=?, lastName=?, email=?, phone=?, specialization=?, updatedAt=NOW() WHERE id=?',
        //   [
        //     updateData.firstName,
        //     updateData.lastName,
        //     updateData.email,
        //     updateData.phone,
        //     JSON.stringify(updateData.specialization),
        //     id
        //   ]
        // );

        res.json({
            success: true,
            data: { id, ...updateData }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================
// SCHEDULES ENDPOINTS
// ===============================

// GET /api/schedules/employee/:employeeId - Harmonogramy pracownika
router.get('/schedules/employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { active = true, from, to } = req.query;

        let query = 'SELECT * FROM schedules WHERE employeeId = ?';
        const params = [employeeId];

        if (active === 'true') {
            query += ' AND isActive = TRUE';
        }

        if (from) {
            query += ' AND validFrom >= ?';
            params.push(from);
        }

        if (to) {
            query += ' AND (validTo IS NULL OR validTo <= ?)';
            params.push(to);
        }

        query += ' ORDER BY validFrom DESC';

        // const schedules = await db.query(query, params);

        res.json({
            success: true,
            data: schedules
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/schedules - Dodaj harmonogram
router.post('/schedules', async (req, res) => {
    try {
        const scheduleData = req.body;

        // const result = await db.query(
        //   'INSERT INTO schedules (id, employeeId, type, data, validFrom, validTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)',
        //   [
        //     scheduleData.id,
        //     scheduleData.employeeId,
        //     scheduleData.type,
        //     JSON.stringify(scheduleData.data),
        //     scheduleData.validFrom,
        //     scheduleData.validTo,
        //     scheduleData.createdBy
        //   ]
        // );

        res.status(201).json({
            success: true,
            data: scheduleData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================
// BOOKINGS ENDPOINTS
// ===============================

// GET /api/bookings/employee/:employeeId - Rezerwacje pracownika
router.get('/bookings/employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { from, to, status } = req.query;

        let query = 'SELECT * FROM bookings WHERE employeeId = ?';
        const params = [employeeId];

        if (from) {
            query += ' AND scheduledDate >= ?';
            params.push(from);
        }

        if (to) {
            query += ' AND scheduledDate <= ?';
            params.push(to);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY scheduledDate, scheduledTime';

        // const bookings = await db.query(query, params);

        res.json({
            success: true,
            data: bookings
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/bookings - Dodaj rezerwację
router.post('/bookings', async (req, res) => {
    try {
        const bookingData = req.body;

        // Sprawdź dostępność pracownika
        // const available = await checkEmployeeAvailability(
        //   bookingData.employeeId,
        //   bookingData.scheduledDate,
        //   bookingData.scheduledTime
        // );

        // if (!available) {
        //   return res.status(409).json({
        //     success: false,
        //     error: 'Employee not available at this time'
        //   });
        // }

        // const result = await db.query(
        //   'INSERT INTO bookings (id, employeeId, clientName, clientPhone, serviceType, scheduledDate, scheduledTime, estimatedDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        //   [
        //     bookingData.id,
        //     bookingData.employeeId,
        //     bookingData.clientName,
        //     bookingData.clientPhone,
        //     bookingData.serviceType,
        //     bookingData.scheduledDate,
        //     bookingData.scheduledTime,
        //     bookingData.estimatedDuration
        //   ]
        // );

        res.status(201).json({
            success: true,
            data: bookingData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/bookings/:id/status - Aktualizuj status rezerwacji
router.put('/bookings/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const updateFields = ['status = ?', 'updatedAt = NOW()'];
        const params = [status];

        if (status === 'completed') {
            updateFields.push('completedAt = NOW()');
        }

        if (notes) {
            updateFields.push('notes = ?');
            params.push(notes);
        }

        params.push(id);

        // const result = await db.query(
        //   `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`,
        //   params
        // );

        res.json({
            success: true,
            data: { id, status, notes }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================
// SYNC ENDPOINTS
// ===============================

// POST /api/sync - Synchronizacja danych
router.post('/sync', async (req, res) => {
    try {
        const { tables, version, exportedAt } = req.body;
        const syncResults = {
            imported: 0,
            updated: 0,
            conflicts: 0,
            errors: []
        };

        // Przetwórz każdą tabelę
        for (const [tableName, records] of Object.entries(tables)) {
            for (const record of records) {
                try {
                    // Sprawdź czy rekord już istnieje
                    // const existing = await db.query(
                    //   `SELECT id, updatedAt FROM ${tableName} WHERE id = ?`,
                    //   [record.id]
                    // );

                    // if (existing) {
                    //   // Sprawdź który jest nowszy
                    //   if (new Date(record.updatedAt) > new Date(existing.updatedAt)) {
                    //     // Aktualizuj
                    //     await updateRecord(tableName, record);
                    //     syncResults.updated++;
                    //   } else {
                    //     syncResults.conflicts++;
                    //   }
                    // } else {
                    //   // Wstaw nowy
                    //   await insertRecord(tableName, record);
                    //   syncResults.imported++;
                    // }

                } catch (error) {
                    syncResults.errors.push(`${tableName}:${record.id} - ${error.message}`);
                }
            }
        }

        res.json({
            success: true,
            syncResults,
            serverTime: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/health - Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ===============================
// AUTHENTICATION & PASSWORD RESET ENDPOINTS
// ===============================

// POST /api/auth/password-reset - Żądanie resetowania hasła
router.post('/auth/password-reset', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Sprawdź czy użytkownik istnieje
        const userQuery = 'SELECT id, email, firstName, lastName FROM users WHERE email = ? AND isActive = true';
        // const user = await db.queryOne(userQuery, [email]);

        // Symulacja sprawdzenia użytkownika
        const user = { id: 1, email: email, firstName: 'Jan', lastName: 'Kowalski' };

        if (!user) {
            // Z bezpieczeństwa zawsze zwracamy sukces, nawet jeśli email nie istnieje
            return res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent'
            });
        }

        // Generuj token resetowania
        const resetToken = generateSecureToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 godzina

        // Zapisz token w bazie
        const insertTokenQuery = `
            INSERT INTO password_reset_tokens (userId, token, expiresAt) 
            VALUES (?, ?, ?)
        `;
        // await db.query(insertTokenQuery, [user.id, resetToken, expiresAt]);

        // Wyślij email z linkiem resetowania
        // await sendPasswordResetEmail(user.email, user.firstName, resetToken);

        // Logowanie zdarzenia bezpieczeństwa
        const logQuery = `
            INSERT INTO security_logs (userId, event, details, ip, userAgent) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const logDetails = JSON.stringify({ email: email });
        // await db.query(logQuery, [user.id, 'password_reset_requested', logDetails, req.ip, req.get('User-Agent')]);

        res.json({
            success: true,
            message: 'If the email exists, a reset link has been sent'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/validate-reset-token - Walidacja tokenu resetowania
router.post('/auth/validate-reset-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                valid: false,
                error: 'Token is required'
            });
        }

        // Sprawdź token w bazie
        const tokenQuery = `
            SELECT prt.*, u.email, u.firstName, u.lastName 
            FROM password_reset_tokens prt 
            JOIN users u ON prt.userId = u.id 
            WHERE prt.token = ? AND prt.used = false AND prt.expiresAt > NOW()
        `;
        // const tokenData = await db.queryOne(tokenQuery, [token]);

        // Symulacja sprawdzenia tokenu
        const tokenData = token === 'valid_token' ? {
            userId: 1,
            email: 'test@example.com',
            firstName: 'Jan',
            expiresAt: new Date(Date.now() + 1800000) // 30 minut
        } : null;

        if (!tokenData) {
            return res.json({
                valid: false,
                error: 'Invalid or expired token'
            });
        }

        res.json({
            valid: true,
            email: tokenData.email,
            firstName: tokenData.firstName,
            expiresAt: tokenData.expiresAt
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            valid: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/reset-password - Resetowanie hasła
router.post('/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token and new password are required'
            });
        }

        // Walidacja siły hasła
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long'
            });
        }

        // Sprawdź token w bazie
        const tokenQuery = `
            SELECT prt.*, u.id as userId, u.email 
            FROM password_reset_tokens prt 
            JOIN users u ON prt.userId = u.id 
            WHERE prt.token = ? AND prt.used = false AND prt.expiresAt > NOW()
        `;
        // const tokenData = await db.queryOne(tokenQuery, [token]);

        // Symulacja sprawdzenia tokenu
        const tokenData = token === 'valid_token' ? {
            id: 1,
            userId: 1,
            email: 'test@example.com'
        } : null;

        if (!tokenData) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Hashuj nowe hasło
        // const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Rozpocznij transakcję
        // await db.beginTransaction();

        try {
            // Aktualizuj hasło użytkownika
            const updatePasswordQuery = `
                UPDATE users 
                SET password = ?, lastPasswordChange = NOW(), updatedAt = NOW() 
                WHERE id = ?
            `;
            // await db.query(updatePasswordQuery, [hashedPassword, tokenData.userId]);

            // Oznacz token jako użyty
            const markTokenUsedQuery = `
                UPDATE password_reset_tokens 
                SET used = true, usedAt = NOW() 
                WHERE id = ?
            `;
            // await db.query(markTokenUsedQuery, [tokenData.id]);

            // Unieważnij wszystkie aktywne sesje użytkownika
            const invalidateSessionsQuery = `
                UPDATE user_sessions 
                SET isActive = false, invalidatedAt = NOW() 
                WHERE userId = ? AND isActive = true
            `;
            // await db.query(invalidateSessionsQuery, [tokenData.userId]);

            // Logowanie zdarzenia bezpieczeństwa
            const logQuery = `
                INSERT INTO security_logs (userId, event, details, ip, userAgent) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const logDetails = JSON.stringify({
                email: tokenData.email,
                resetToken: token.substring(0, 8) + '...'
            });
            // await db.query(logQuery, [tokenData.userId, 'password_reset_completed', logDetails, req.ip, req.get('User-Agent')]);

            // await db.commit();

            // Wyślij email potwierdzający zmianę hasła
            // await sendPasswordChangedNotification(tokenData.email);

            res.json({
                success: true,
                message: 'Password has been reset successfully',
                email: tokenData.email
            });

        } catch (error) {
            // await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/auth/reset-tokens - Lista aktywnych tokenów (tylko dla adminów)
router.get('/auth/reset-tokens', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const tokensQuery = `
            SELECT 
                prt.id,
                prt.token,
                prt.createdAt,
                prt.expiresAt,
                prt.used,
                prt.usedAt,
                u.email,
                u.firstName,
                u.lastName
            FROM password_reset_tokens prt
            JOIN users u ON prt.userId = u.id
            WHERE prt.expiresAt > NOW()
            ORDER BY prt.createdAt DESC
            LIMIT 100
        `;
        // const tokens = await db.query(tokensQuery);

        // Ukryj pełne tokeny z bezpieczeństwa
        const sanitizedTokens = tokens.map(token => ({
            ...token,
            token: token.token.substring(0, 8) + '...'
        }));

        res.json({
            success: true,
            data: sanitizedTokens,
            count: sanitizedTokens.length
        });

    } catch (error) {
        console.error('Get reset tokens error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// DELETE /api/auth/reset-tokens/:id - Anulowanie tokenu (tylko dla adminów)
router.delete('/auth/reset-tokens/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const tokenId = req.params.id;

        const updateQuery = `
            UPDATE password_reset_tokens 
            SET used = true, usedAt = NOW() 
            WHERE id = ? AND used = false
        `;
        // const result = await db.query(updateQuery, [tokenId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Token not found or already used'
            });
        }

        res.json({
            success: true,
            message: 'Token has been cancelled'
        });

    } catch (error) {
        console.error('Cancel reset token error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ===============================
// HELPER FUNCTIONS
// ===============================

function generateSecureToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

async function sendPasswordResetEmail(email, firstName, resetToken) {
    // Implementacja wysyłki emaila
    // Można użyć nodemailer, SendGrid, AWS SES, itp.

    const resetUrl = `${process.env.FRONTEND_URL}/reset-hasla?token=${resetToken}`;

    console.log(`Sending password reset email to ${email}`);
    console.log(`Reset URL: ${resetUrl}`);

    // Przykład z nodemailer:
    /*
    const transporter = nodemailer.createTransporter({
        // konfiguracja SMTP
    });

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Resetowanie hasła - Serwis Technik',
        html: `
            <h2>Resetowanie hasła</h2>
            <p>Witaj ${firstName},</p>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
            <p><a href="${resetUrl}">Kliknij tutaj, aby ustawić nowe hasło</a></p>
            <p>Link wygasa za 1 godzinę.</p>
            <p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email.</p>
        `
    };

    await transporter.sendMail(mailOptions);
    */
}

async function sendPasswordChangedNotification(email) {
    // Powiadomienie o zmianie hasła
    console.log(`Sending password changed notification to ${email}`);
}

// Middleware do autentykacji
function authenticateToken(req, res, next) {
    // Implementacja sprawdzania tokenu JWT
    next();
}

// Middleware do autoryzacji admina
function authorizeAdmin(req, res, next) {
    // Sprawdzenie czy użytkownik ma uprawnienia admina
    next();
}

// ===============================
