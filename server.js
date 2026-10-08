const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');

const app = express();

// =========================================================================
// 1. Middlewares, Static Files & Multer Configuration
// =========================================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// อนุญาตให้เข้าถึงไฟล์ในโฟลเดอร์ uploads และ public
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));

// ตรวจสอบและสร้างโฟลเดอร์ uploads สำหรับเก็บรูปภาพ
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ตั้งค่า Storage สำหรับ Multer Upload (รองรับทั้ง avatar, equipment และรูปภาพการแจ้งซ่อม)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const prefix = (file.fieldname === 'avatar') ? 'avatar-' : 'img-';
        cb(null, prefix + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // ขยายเป็น 10MB เพื่อรองรับรูปถ่ายครุภัณฑ์
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'));
        }
    }
});

// =========================================================================
// 2. Database Connection Pool Setup
// =========================================================================
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ay_inventory_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const os = require('os');

function getLocalIpAddress() {
    try {
        const nets = os.networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    return net.address;
                }
            }
        }
    } catch (e) {}
    return null;
}

const getQrCodeUrl = (req, computerName) => {
    let host = req.get('host') || 'localhost:3000';
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
        const localIp = getLocalIpAddress();
        if (localIp) {
            const port = host.split(':')[1] || '3000';
            host = `${localIp}:${port}`;
        }
    }
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    return `${protocol}://${host}/repair.html?code=${encodeURIComponent(computerName)}`;
};

// -------------------------------------------------------------------------
// Helper: ระบบบันทึกกิจกรรมผู้ใช้งาน (Activity Logger)
// -------------------------------------------------------------------------
async function logActivity({ user_id, username, action, description, target_type, target_id, ip_address }) {
    try {
        const sql = `
            INSERT INTO user_activity_logs (user_id, username, action, description, target_type, target_id, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        await db.query(sql, [user_id !== undefined ? user_id : null, username || 'System', action, description, target_type || null, target_id || null, ip_address || null]);
    } catch (e) {
        console.error('Failed to log activity:', e.message);
    }
}

// -------------------------------------------------------------------------
// Helper: ตรวจสอบและสร้างคอลัมน์/ตารางบันทึกกิจกรรมเมื่อเริ่มระบบ
// -------------------------------------------------------------------------
async function initUserLogsAndOnlineStatus() {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM users LIKE 'last_active_at'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE users ADD COLUMN last_active_at DATETIME NULL AFTER created_at");
        }
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                username VARCHAR(100) NOT NULL,
                action VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                target_type VARCHAR(50) NULL,
                target_id VARCHAR(50) NULL,
                ip_address VARCHAR(45) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_username (username),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (err) {
        console.error("Init user logs table error:", err.message);
    }
}
initUserLogsAndOnlineStatus();

// -------------------------------------------------------------------------
// Helper: ตรวจสอบและสร้างตารางการตั้งค่าระบบ (System Settings)
// -------------------------------------------------------------------------
async function initSystemSettingsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        const defaultSettings = [
            { key: 'auto_logout_enabled', value: 'true' },
            { key: 'auto_logout_minutes', value: '15' },
            { key: 'repair_portal_enabled', value: 'true' },
            { key: 'repair_portal_message', value: 'ระบบแจ้งซ่อมสำหรับผู้ใช้งานทั่วไปปิดรับแจ้งชั่วคราว กรุณาติดต่อเจ้าหน้าที่เทคโนโลยีสารสนเทศ' },
            { key: 'theme_color', value: '#0d6efd' },
            { key: 'theme_preset', value: 'blue' }
        ];

        for (const s of defaultSettings) {
            await db.query(`
                INSERT INTO system_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_key = setting_key
            `, [s.key, s.value]);
        }
    } catch (err) {
        console.error("Init system settings table error:", err.message);
    }
}
initSystemSettingsTable();

// -------------------------------------------------------------------------
// Helper: ตรวจสอบและสร้างคอลัมน์ sort_order สำหรับจัดลำดับ
// -------------------------------------------------------------------------
async function initSortOrderColumns() {
    try {
        const [cCols] = await db.query("SHOW COLUMNS FROM categories LIKE 'sort_order'");
        if (cCols.length === 0) {
            await db.query("ALTER TABLE categories ADD COLUMN sort_order INT DEFAULT 0");
            await db.query("UPDATE categories SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL");
        }

        const [dCols] = await db.query("SHOW COLUMNS FROM departments LIKE 'sort_order'");
        if (dCols.length === 0) {
            await db.query("ALTER TABLE departments ADD COLUMN sort_order INT DEFAULT 0");
            await db.query("UPDATE departments SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL");
        }

        const [oCols] = await db.query("SHOW COLUMNS FROM organizations LIKE 'sort_order'");
        if (oCols.length === 0) {
            await db.query("ALTER TABLE organizations ADD COLUMN sort_order INT DEFAULT 0");
            await db.query("UPDATE organizations SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL");
        }
    } catch (err) {
        console.error("Init sort_order columns error:", err.message);
    }
}
initSortOrderColumns();

// -------------------------------------------------------------------------
// Helper: ตรวจสอบและสร้างคอลัมน์ category_id, input_type, options, is_required ใน equipment_attributes
// -------------------------------------------------------------------------
async function initEquipmentAttributesSchema() {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM equipment_attributes');
        const colNames = cols.map(c => c.Field);
        
        if (!colNames.includes('category_id')) {
            await db.query('ALTER TABLE equipment_attributes ADD COLUMN category_id INT NULL AFTER id');
        }
        if (!colNames.includes('input_type')) {
            await db.query("ALTER TABLE equipment_attributes ADD COLUMN input_type VARCHAR(50) DEFAULT 'text' AFTER name");
        }
        if (!colNames.includes('options')) {
            await db.query('ALTER TABLE equipment_attributes ADD COLUMN options TEXT NULL AFTER input_type');
        }
        if (!colNames.includes('is_required')) {
            await db.query('ALTER TABLE equipment_attributes ADD COLUMN is_required TINYINT(1) DEFAULT 0 AFTER options');
        }
        
        const [indexes] = await db.query("SHOW INDEX FROM equipment_attributes WHERE Column_name = 'category_id'");
        if (indexes.length === 0) {
            await db.query('ALTER TABLE equipment_attributes ADD INDEX idx_category_id (category_id)');
        }
    } catch (err) {
        console.error("Init equipment_attributes schema error:", err.message);
    }
}
initEquipmentAttributesSchema();

// -------------------------------------------------------------------------
// Helper: ตรวจสอบและสร้างคอลัมน์ image ใน equipments สำหรับจัดเก็บรูปภาพ
// -------------------------------------------------------------------------
async function initEquipmentImageColumn() {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM equipments LIKE 'image'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE equipments ADD COLUMN image VARCHAR(255) NULL AFTER qr_code");
            console.log("Added 'image' column to equipments table");
        }
    } catch (err) {
        console.error("Init equipments image column error:", err.message);
    }
}
initEquipmentImageColumn();

// -------------------------------------------------------------------------
// Helper: ตรวจสอบและสร้างคอลัมน์ image ใน repairs สำหรับจัดเก็บรูปถ่ายอาการเสีย
// -------------------------------------------------------------------------
async function initRepairsImageColumn() {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM repairs LIKE 'image'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE repairs ADD COLUMN image VARCHAR(255) NULL AFTER symptom");
            console.log("Added 'image' column to repairs table");
        }
    } catch (err) {
        console.error("Init repairs image column error:", err.message);
    }
}
initRepairsImageColumn();

// =========================================================================
// 3. Auth API (Login, Heartbeat & Activity Logs)
// =========================================================================

// 💓 Heartbeat API สำหรับส่งสัญญาณชีพผู้ใช้งาน (เช็กสถานะออนไลน์)
app.post('/api/heartbeat', async (req, res) => {
    try {
        const { user_id, username } = req.body;
        if (!user_id && user_id !== 0 && !username) {
            return res.status(400).json({ success: false, message: 'Missing user identification' });
        }

        if (user_id === 0 || user_id === '0' || username === 'admin') {
            await db.query("UPDATE users SET last_active_at = NOW() WHERE username = 'admin' OR id = 0");
        } else if (user_id) {
            await db.query("UPDATE users SET last_active_at = NOW() WHERE id = ? OR username = ?", [user_id, username]);
        } else if (username) {
            await db.query("UPDATE users SET last_active_at = NOW() WHERE username = ?", [username]);
        }

        res.json({ success: true, timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 📝 API สำหรับบันทึกกิจกรรมการใช้งาน (Activity Log)
app.post('/api/activity-logs', async (req, res) => {
    try {
        const { user_id, username, action, description, target_type, target_id } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            user_id: user_id !== undefined ? user_id : null,
            username: username || 'User',
            action: action || 'ACTION',
            description: description || '-',
            target_type,
            target_id,
            ip_address: ip
        });
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 📜 API ดึงรายการประวัติกิจกรรมของผู้ใช้งาน
app.get('/api/users/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        
        let targetUsername = '';
        if (id === '0' || id === 0) {
            targetUsername = 'admin';
        } else {
            const [uRows] = await db.query('SELECT username FROM users WHERE id = ?', [id]);
            if (uRows.length > 0) {
                targetUsername = uRows[0].username;
            }
        }

        const sql = `
            SELECT id, user_id, username, action, description, target_type, target_id, ip_address, created_at
            FROM user_activity_logs 
            WHERE user_id = ? ${targetUsername ? 'OR username = ?' : ''}
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const params = targetUsername ? [id, targetUsername, limit] : [id, limit];

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งาน: ' + err.message });
    }
});

// =========================================================================
// ⚙️ System Settings API (การตั้งค่าระบบ)
// =========================================================================

// 📥 ดึงข้อมูลการตั้งค่าระบบทั้งหมด
app.get('/api/system/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const settings = {
            auto_logout_enabled: true,
            auto_logout_minutes: 15,
            repair_portal_enabled: true,
            repair_portal_message: 'ระบบแจ้งซ่อมสำหรับผู้ใช้งานทั่วไปปิดรับแจ้งชั่วคราว กรุณาติดต่อเจ้าหน้าที่เทคโนโลยีสารสนเทศ',
            theme_color: '#0d6efd',
            theme_preset: 'blue'
        };

        rows.forEach(r => {
            if (r.setting_key === 'auto_logout_enabled') {
                settings.auto_logout_enabled = r.setting_value === 'true' || r.setting_value === '1';
            } else if (r.setting_key === 'auto_logout_minutes') {
                settings.auto_logout_minutes = parseInt(r.setting_value, 10) || 15;
            } else if (r.setting_key === 'repair_portal_enabled') {
                settings.repair_portal_enabled = r.setting_value === 'true' || r.setting_value === '1';
            } else if (r.setting_key === 'repair_portal_message') {
                settings.repair_portal_message = r.setting_value;
            } else if (r.setting_key === 'theme_color') {
                settings.theme_color = r.setting_value;
            } else if (r.setting_key === 'theme_preset') {
                settings.theme_preset = r.setting_value;
            }
        });

        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าระบบ: ' + err.message });
    }
});

// 💾 บันทึกการตั้งค่าระบบ (Admin only)
app.put('/api/system/settings', async (req, res) => {
    try {
        const {
            auto_logout_enabled,
            auto_logout_minutes,
            repair_portal_enabled,
            repair_portal_message,
            theme_color,
            theme_preset,
            updated_by
        } = req.body;

        const updates = [];
        if (auto_logout_enabled !== undefined) updates.push(['auto_logout_enabled', String(auto_logout_enabled)]);
        if (auto_logout_minutes !== undefined) updates.push(['auto_logout_minutes', String(auto_logout_minutes)]);
        if (repair_portal_enabled !== undefined) updates.push(['repair_portal_enabled', String(repair_portal_enabled)]);
        if (repair_portal_message !== undefined) updates.push(['repair_portal_message', String(repair_portal_message)]);
        if (theme_color !== undefined) updates.push(['theme_color', String(theme_color)]);
        if (theme_preset !== undefined) updates.push(['theme_preset', String(theme_preset)]);

        for (const [key, val] of updates) {
            await db.query(`
                INSERT INTO system_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = ?
            `, [key, val, val]);
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            username: updated_by || 'Admin',
            action: 'UPDATE_SYSTEM_SETTINGS',
            description: `อัปเดตการตั้งค่าระบบ (Auto-Logout: ${auto_logout_enabled ? auto_logout_minutes + ' นาที' : 'ปิด'}, แจ้งซ่อมภายนอก: ${repair_portal_enabled ? 'เปิด' : 'ปิด'}, ธีมสี: ${theme_color})`,
            target_type: 'SYSTEM',
            target_id: 'SETTINGS',
            ip_address: ip
        });

        res.json({ success: true, message: 'บันทึกการตั้งค่าระบบสำเร็จ' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่าระบบ: ' + err.message });
    }
});

const crypto = require('crypto');

function verifyWipePasskey(inputKey) {
    if (!inputKey || typeof inputKey !== 'string') return false;
    const trimmed = inputKey.trim();
    if (process.env.DATA_WIPE_PASSKEY && trimmed === process.env.DATA_WIPE_PASSKEY.trim()) {
        return true;
    }
    const hash = crypto.createHash('sha256').update(trimmed).digest('hex');
    const expectedHash = 'bf96b3dc4d292679876f068d68917c18736156b450ced49d3e520a99676a2cfe';
    try {
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    } catch {
        return false;
    }
}

app.delete('/api/system/clear-equipments', async (req, res) => {
    try {
        const passkey = req.body?.passkey || req.headers['x-wipe-passkey'];
        if (!verifyWipePasskey(passkey)) {
            return res.status(403).json({ success: false, message: 'รหัสผ่านยืนยันความปลอดภัยไม่ถูกต้อง' });
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE equipments');
        await db.query('TRUNCATE TABLE repairs');
        await db.query('TRUNCATE TABLE repair_history');
        await db.query('UPDATE categories SET last_seq = 0');

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            username: req.headers['x-username'] || 'Admin',
            action: 'WIPE_ALL_EQUIPMENTS',
            description: `ผู้ดูแลระบบสั่งล้างข้อมูลครุภัณฑ์ทั้งหมด (Wipe Data)`,
            target_type: 'SYSTEM',
            target_id: 'WIPE',
            ip_address: ip
        });

        res.json({ success: true, message: 'ล้างข้อมูลครุภัณฑ์เรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Error clearing equipments:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการล้างข้อมูลครุภัณฑ์: ' + err.message });
    } finally {
        await db.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    }
});

app.delete('/api/system/clear-repairs', async (req, res) => {
    try {
        const passkey = req.body?.passkey || req.headers['x-wipe-passkey'];
        if (!verifyWipePasskey(passkey)) {
            return res.status(403).json({ success: false, message: 'รหัสผ่านยืนยันความปลอดภัยไม่ถูกต้อง' });
        }

        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE repairs');
        await db.query('TRUNCATE TABLE repair_history');

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            username: req.headers['x-username'] || 'Admin',
            action: 'WIPE_ALL_REPAIRS',
            description: `ผู้ดูแลระบบสั่งล้างประวัติการซ่อมทั้งหมด (Wipe Data)`,
            target_type: 'SYSTEM',
            target_id: 'WIPE',
            ip_address: ip
        });

        res.json({ success: true, message: 'ล้างประวัติการซ่อมเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Error clearing repairs:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการล้างประวัติการซ่อม: ' + err.message });
    } finally {
        await db.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    }
});

// 🔑 API สำหรับ Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน'
        });
    }

    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Bypass กรณี Super Admin ฉุกเฉิน
        if (username === 'admin' && password === 'ICT@2569') {
            await db.query("UPDATE users SET last_active_at = NOW() WHERE username = 'admin'").catch(() => {});
            await logActivity({
                user_id: 0,
                username: 'admin',
                action: 'LOGIN',
                description: 'เข้าสู่ระบบสำเร็จ (Super Admin)',
                target_type: 'AUTH',
                ip_address: clientIp
            });

            return res.json({
                success: true,
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: 0,
                    username: 'admin',
                    fullname: 'Super Admin',
                    position: 'ผู้ดูแลระบบสูงสุด',
                    email: 'admin@system.local',
                    role: 'Admin',
                    department_id: null,
                    department_name: 'ส่วนกลาง',
                    avatar: '/public/images/default-avatar.png',
                    avatar_url: '/public/images/default-avatar.png'
                }
            });
        }

        // Query ค้นหา User จาก Database (เพิ่ม u.position, u.email)
        const query = `
            SELECT u.id, u.username, u.password, u.fullname, u.position, u.email, u.role, u.department_id, u.avatar, d.name AS department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.username = ?
        `;
        const [rows] = await db.query(query, [username.trim()]);

        if (rows.length === 0 || rows[0].password !== password) {
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        const user = rows[0];
        delete user.password; // ลบรหัสผ่านก่อนส่งกลับ Client

        // อัปเดตเวลาเข้าใช้งานล่าสุด (last_active_at)
        await db.query("UPDATE users SET last_active_at = NOW() WHERE id = ?", [user.id]).catch(() => {});
        await logActivity({
            user_id: user.id,
            username: user.username,
            action: 'LOGIN',
            description: `เข้าสู่ระบบสำเร็จ (${user.fullname || user.username})`,
            target_type: 'AUTH',
            ip_address: clientIp
        });

        const avatarPath = user.avatar ? `/uploads/${user.avatar}` : '/public/images/default-avatar.png';

        return res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            user: {
                ...user,
                avatar: avatarPath,
                avatar_url: avatarPath
            }
        });
    } catch (error) {
        console.error('Login Database Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' + error.message
        });
    }
});

// 📌 Endpoint /api/me สำหรับดึงข้อมูลผู้ใช้งานปัจจุบัน
app.get('/api/me', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.user_id;

        // กรณีเป็น Super Admin (ID 0)
        if (userId === '0' || userId === 0) {
            return res.json({
                id: 0,
                username: 'admin',
                fullname: 'Super Admin',
                position: 'ผู้ดูแลระบบสูงสุด',
                email: 'admin@system.local',
                role: 'Admin',
                department_id: null,
                department_name: 'ส่วนกลาง',
                avatar_url: '/public/images/default-avatar.png'
            });
        }

        if (!userId) {
            return res.status(401).json({ message: 'ยังไม่ได้ระบุข้อมูลการเข้าสู่ระบบ' });
        }

        const query = `
            SELECT u.id, u.username, u.fullname, u.position, u.email, u.role, u.department_id, u.avatar, d.name AS department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        `;
        const [users] = await db.query(query, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        const user = users[0];
        res.json({
            ...user,
            avatar_url: user.avatar ? `/uploads/${user.avatar}` : '/public/images/default-avatar.png'
        });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ' + err.message });
    }
});

// =========================================================================
// 4. Users API (CRUD)
// =========================================================================
app.get('/api/users', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.username, 
                u.fullname, 
                u.position,
                u.email,
                u.role, 
                u.avatar, 
                u.department_id, 
                COALESCE(d.name, '-') AS department_name,
                u.created_at,
                u.last_active_at,
                CASE 
                    WHEN u.last_active_at IS NOT NULL AND TIMESTAMPDIFF(SECOND, u.last_active_at, NOW()) <= 300 THEN 1 
                    ELSE 0 
                END AS is_online
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ORDER BY u.id DESC
        `;
        const [rows] = await db.query(query);
        
        const result = rows.map(user => ({
            ...user,
            is_online: Boolean(user.is_online),
            avatar_url: user.avatar ? `/uploads/${user.avatar}` : '/public/images/default-avatar.png'
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน: ' + err.message });
    }
});

app.post('/api/users', upload.single('avatar'), async (req, res) => {
    try {
        const { username, password, fullname, position, email, role, department_id } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: 'กรุณากรอก Username, Password และสิทธิ์การใช้งาน' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username นี้ถูกใช้งานแล้ว' });
        }

        const avatarFilename = req.file ? req.file.filename : null;
        const deptId = department_id ? parseInt(department_id) : null;

        const sql = `
            INSERT INTO users (username, password, fullname, position, email, role, department_id, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            username.trim(), 
            password, 
            fullname || username, 
            position || null, 
            email || null, 
            role, 
            deptId, 
            avatarFilename
        ]);

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: req.headers['x-username'] || 'Admin',
            action: 'CREATE_USER',
            description: `ลงทะเบียนผู้ใช้งานใหม่: ${username.trim()} (${fullname || username}) [สิทธิ์: ${role}]`,
            target_type: 'USER',
            target_id: result.insertId,
            ip_address: clientIp
        });

        res.status(201).json({ message: 'ลงทะเบียนผู้ใช้งานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/users/:id', upload.single('avatar'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, fullname, position, email, role, department_id } = req.body;

        const deptId = department_id ? parseInt(department_id) : null;

        const [current] = await db.query('SELECT avatar FROM users WHERE id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        let avatarFilename = current[0].avatar;
        if (req.file) {
            avatarFilename = req.file.filename;
        }

        let sql = '';
        let params = [];

        if (password && password.trim() !== '') {
            sql = `
                UPDATE users 
                SET username = ?, password = ?, fullname = ?, position = ?, email = ?, role = ?, department_id = ?, avatar = ?
                WHERE id = ?
            `;
            params = [username.trim(), password, fullname, position || null, email || null, role, deptId, avatarFilename, id];
        } else {
            sql = `
                UPDATE users 
                SET username = ?, fullname = ?, position = ?, email = ?, role = ?, department_id = ?, avatar = ?
                WHERE id = ?
            `;
            params = [username.trim(), fullname, position || null, email || null, role, deptId, avatarFilename, id];
        }

        await db.query(sql, params);

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: req.headers['x-username'] || 'Admin',
            action: 'EDIT_USER',
            description: `แก้ไขข้อมูลผู้ใช้งาน: ${username.trim()} (ID: ${id})`,
            target_type: 'USER',
            target_id: id,
            ip_address: clientIp
        });

        res.json({ message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้งาน: ' + (err.sqlMessage || err.message) });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [targetUser] = await db.query('SELECT username, fullname FROM users WHERE id = ?', [id]);
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้งานที่ต้องการลบ' });
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const deletedName = targetUser.length > 0 ? targetUser[0].username : id;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: req.headers['x-username'] || 'Admin',
            action: 'DELETE_USER',
            description: `ลบผู้ใช้งาน: ${deletedName} (ID: ${id})`,
            target_type: 'USER',
            target_id: id,
            ip_address: clientIp
        });

        res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน: ' + err.message });
    }
});

// =========================================================================
// 5. Categories API
// =========================================================================
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: ' + err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { name, prefix } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });

        const cleanPrefix = prefix ? prefix.trim().toUpperCase() : null;
        const [maxRes] = await db.query('SELECT MAX(sort_order) AS max_order FROM categories');
        const nextOrder = (maxRes[0]?.max_order || 0) + 1;
        await db.query('INSERT INTO categories (name, prefix, sort_order) VALUES (?, ?, ?)', [name.trim(), cleanPrefix, nextOrder]);
        res.status(201).json({ message: 'เพิ่มหมวดหมู่เรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/categories/reorder', async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of items) {
            await connection.query(
                'UPDATE categories SET sort_order = ? WHERE id = ?',
                [item.sort_order, item.id]
            );
        }
        await connection.commit();
        res.json({ message: 'อัปเดตลำดับหมวดหมู่สำเร็จ' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reordering categories:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนลำดับหมวดหมู่: ' + error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, prefix } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });

        let sql = 'UPDATE categories SET name = ? WHERE id = ?';
        let params = [name.trim(), id];
        if (prefix !== undefined) {
            sql = 'UPDATE categories SET name = ?, prefix = ? WHERE id = ?';
            params = [name.trim(), prefix ? prefix.trim().toUpperCase() : null, id];
        }

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });

        res.json({ message: 'แก้ไขหมวดหมู่สำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่: ' + (err.sqlMessage || err.message) });
    }
});

app.get('/api/categories/:id/next-code', async (req, res) => {
    try {
        const { id } = req.params;
        const [catRows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (catRows.length === 0) return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });

        const cat = catRows[0];
        const currentYearStr = (new Date().getFullYear() + 543).toString().substring(2, 4);

        const [cntRows] = await db.query('SELECT COUNT(*) AS total FROM equipments WHERE category_id = ?', [id]);
        let effectiveLastSeq = parseInt(cat.last_seq) || 0;
        if (cntRows[0].total === 0 && effectiveLastSeq !== 0) {
            effectiveLastSeq = 0;
            await db.query('UPDATE categories SET last_seq = 0 WHERE id = ?', [id]).catch(() => {});
        }

        const nextSeq = effectiveLastSeq + 1;
        const nextSeqStr = nextSeq.toString().padStart(3, '0');
        const nextCode = cat.prefix ? `${cat.prefix}-${currentYearStr}-${nextSeqStr}` : '';

        const [pendingRows] = await db.query(
            "SELECT id, computer_name FROM equipments WHERE category_id = ? AND status = 'รอลงทะเบียน' ORDER BY id ASC LIMIT 50",
            [id]
        );

        res.json({
            prefix: cat.prefix || '',
            last_seq: cat.last_seq || 0,
            next_code: nextCode,
            pending_items: pendingRows
        });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/categories/:id/prefix', async (req, res) => {
    try {
        const { id } = req.params;
        const { prefix } = req.body;
        if (!prefix || !prefix.trim()) return res.status(400).json({ message: 'กรุณาระบุตัวย่อ' });
        const [result] = await db.query('UPDATE categories SET prefix = ? WHERE id = ?', [prefix.trim().toUpperCase(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
        res.json({ message: 'บันทึกตัวย่อสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + (err.sqlMessage || err.message) });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });

        res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากถูกผูกไว้กับครุภัณฑ์ในระบบ' });
        }
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่: ' + err.message });
    }
});

// =========================================================================
// 6. Departments API
// =========================================================================
app.get('/api/departments', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM departments ORDER BY sort_order ASC, id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสังกัด: ' + err.message });
    }
});

app.post('/api/departments', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อสังกัด' });

        const [maxRes] = await db.query('SELECT MAX(sort_order) AS max_order FROM departments');
        const nextOrder = (maxRes[0]?.max_order || 0) + 1;
        await db.query('INSERT INTO departments (name, sort_order) VALUES (?, ?)', [name.trim(), nextOrder]);
        res.status(201).json({ message: 'เพิ่มสังกัดสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสังกัด: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/departments/reorder', async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of items) {
            await connection.query(
                'UPDATE departments SET sort_order = ? WHERE id = ?',
                [item.sort_order, item.id]
            );
        }
        await connection.commit();
        res.json({ message: 'อัปเดตลำดับสังกัดสำเร็จ' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reordering departments:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนลำดับสังกัด: ' + error.message });
    } finally {
        connection.release();
    }
});

app.put('/api/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'กรุณาระบุชื่อสังกัด' });

        const [result] = await db.query('UPDATE departments SET name = ? WHERE id = ?', [name.trim(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบสังกัดที่ต้องการแก้ไข' });

        res.json({ message: 'แก้ไขสังกัดสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขสังกัด: ' + (err.sqlMessage || err.message) });
    }
});

app.delete('/api/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM departments WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบสังกัดที่ต้องการลบ' });

        res.json({ message: 'ลบสังกัดสำเร็จ' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'ไม่สามารถลบสังกัดนี้ได้ เนื่องจากถูกผูกไว้กับครุภัณฑ์ในระบบ' });
        }
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสังกัด: ' + err.message });
    }
});

// =========================================================================
// 7. Organizations API
// =========================================================================
app.get('/api/organizations', async (req, res) => {
    try {
        const { department_id } = req.query;
        let query = "SELECT o.*, d.name as department_name FROM organizations o LEFT JOIN departments d ON o.department_id = d.id";
        let params = [];
        
        if (department_id) {
            query += " WHERE o.department_id = ?";
            params.push(department_id);
        }
        
        query += " ORDER BY o.sort_order ASC, o.id ASC";
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน: ' + err.message });
    }
});

app.post('/api/organizations', async (req, res) => {
    try {
        const { name, department_id } = req.body;
        if (!name || !department_id) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        const [maxRes] = await db.query('SELECT MAX(sort_order) AS max_order FROM organizations WHERE department_id = ?', [department_id]);
        const nextOrder = (maxRes[0]?.max_order || 0) + 1;
        await db.query("INSERT INTO organizations (name, department_id, sort_order) VALUES (?, ?, ?)", [name.trim(), department_id, nextOrder]);
        res.json({ message: 'บันทึกหน่วยงานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มหน่วยงาน: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/organizations/reorder', async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const item of items) {
            await connection.query(
                'UPDATE organizations SET sort_order = ? WHERE id = ?',
                [item.sort_order, item.id]
            );
        }
        await connection.commit();
        res.json({ message: 'อัปเดตลำดับหน่วยงานสำเร็จ' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reordering organizations:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนลำดับหน่วยงาน: ' + error.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/organizations/:id', async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM organizations WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหน่วยงานที่ต้องการลบ' });
        }
        res.json({ message: 'ลบหน่วยงานสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหน่วยงาน: ' + err.message });
    }
});

// =========================================================================
// 8. Equipments API
// =========================================================================
app.get('/api/equipments', async (req, res) => {
    try {
        const { code } = req.query;
        let query = `
            SELECT 
                e.id, 
                e.computer_name, 
                e.user_name, 
                e.position,
                e.email,
                e.phone,
                e.category_id,
                e.department_id,
                e.organization_id,
                COALESCE(e.organization_name, o.name, '-') AS organization_name,
                COALESCE(e.status, 'ใช้งานปกติ') AS status, 
                e.last_audited_at, 
                e.qr_code,
                e.image,
                e.details,
                e.created_at,
                e.updated_at,
                COALESCE(c.name, '-') AS category_name,
                COALESCE(d.name, '-') AS department_name,
                lr.symptom AS repair_symptom,
                lr.reporter_name AS repair_reporter_name,
                lr.image AS repair_image,
                lr.created_at AS repair_created_at,
                lr.status AS repair_status
            FROM equipments e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN organizations o ON e.organization_id = o.id
            LEFT JOIN (
                SELECT r1.equipment_id, r1.symptom, r1.reporter_name, r1.image, r1.created_at, r1.status
                FROM repairs r1
                INNER JOIN (
                    SELECT equipment_id, MAX(id) AS max_id
                    FROM repairs
                    GROUP BY equipment_id
                ) r2 ON r1.id = r2.max_id
            ) lr ON e.id = lr.equipment_id
        `;
        const params = [];

        if (code) {
            const numCode = parseInt(code, 10);
            const isValidNumber = !isNaN(numCode);
            
            if (isValidNumber) {
                query += ` WHERE e.computer_name = ? OR e.id = ?`;
                params.push(code, numCode);
            } else {
                query += ` WHERE e.computer_name = ?`;
                params.push(code);
            }
        }

        query += ` ORDER BY e.id DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message });
    }
});

app.get('/api/equipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);
        const isValidNumber = !isNaN(numId);

        const query = `
            SELECT 
                e.*,
                COALESCE(e.organization_name, o.name, '-') AS organization_name,
                COALESCE(c.name, '-') AS category_name,
                COALESCE(d.name, '-') AS department_name,
                lr.symptom AS repair_symptom,
                lr.reporter_name AS repair_reporter_name,
                lr.created_at AS repair_created_at,
                lr.status AS repair_status
            FROM equipments e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN organizations o ON e.organization_id = o.id
            LEFT JOIN (
                SELECT r1.equipment_id, r1.symptom, r1.reporter_name, r1.created_at, r1.status
                FROM repairs r1
                INNER JOIN (
                    SELECT equipment_id, MAX(id) AS max_id
                    FROM repairs
                    GROUP BY equipment_id
                ) r2 ON r1.id = r2.max_id
            ) lr ON e.id = lr.equipment_id
            WHERE e.computer_name = ? ${isValidNumber ? 'OR e.id = ?' : ''}
        `;
        const params = isValidNumber ? [id, numId] : [id];
        const [rows] = await db.query(query, params);
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูลครุภัณฑ์' });

        const equipment = rows[0];

        if (equipment.details) {
            try {
                equipment.details = typeof equipment.details === 'string' 
                    ? JSON.parse(equipment.details) 
                    : equipment.details;
            } catch (e) {
                equipment.details = [];
            }
        } else {
            equipment.details = [];
        }

        res.json(equipment);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + err.message });
    }
});


app.post('/api/equipments/generate-qr', async (req, res) => {
    try {
        const { category_id, count } = req.body;
        const numCount = parseInt(count) || 0;
        if (!category_id || numCount <= 0 || numCount > 100) {
            return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง (สร้างได้สูงสุด 100 ดวงต่อครั้ง)' });
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [catRows] = await conn.query('SELECT prefix, last_seq FROM categories WHERE id = ? FOR UPDATE', [category_id]);
            if (catRows.length === 0) throw new Error('ไม่พบหมวดหมู่');
            
            const cat = catRows[0];
            if (!cat.prefix) throw new Error('หมวดหมู่นี้ยังไม่ได้ตั้งตัวย่อ (Prefix)');

            const currentYearStr = (new Date().getFullYear() + 543).toString().substring(2, 4);
            let seq = parseInt(cat.last_seq) || 0;
            const newEquipments = [];

            for (let i = 0; i < numCount; i++) {
                seq++;
                const seqStr = seq.toString().padStart(3, '0');
                const assetCode = `${cat.prefix}-${currentYearStr}-${seqStr}`;

                const scanUrl = getQrCodeUrl(req, assetCode);
                const qrCodeDataUrl = await QRCode.toDataURL(scanUrl);

                const [resInsert] = await conn.query(
                    'INSERT INTO equipments (computer_name, category_id, status, qr_code) VALUES (?, ?, "รอลงทะเบียน", ?)',
                    [assetCode, category_id, qrCodeDataUrl]
                );
                
                newEquipments.push({
                    id: resInsert.insertId,
                    computer_name: assetCode,
                    qr_code: qrCodeDataUrl
                });
            }

            await conn.query('UPDATE categories SET last_seq = ? WHERE id = ?', [seq, category_id]);
            await conn.commit();

            const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await logActivity({
                user_id: req.headers['x-user-id'] || null,
                username: req.headers['x-username'] || 'Admin',
                action: 'GENERATE_QR',
                description: `สร้าง QR Code ล่วงหน้าจำนวน ${numCount} ดวง สำหรับหมวดหมู่ ${cat.prefix}`,
                target_type: 'EQUIPMENT',
                target_id: category_id,
                ip_address: clientIp
            });

            res.json({ message: 'สร้าง QR Code สำเร็จ', data: newEquipments });
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + (err.sqlMessage || err.message) });
    }
});

app.post('/api/equipments', upload.single('image'), async (req, res) => {
    try {
        const { computer_name, user_name, position, email, phone, category_id, department_id, organization_id, sub_department_id, details, status } = req.body;

        if (!computer_name) return res.status(400).json({ message: 'กรุณากรอกรหัสครุภัณฑ์/ชื่อเครื่อง' });

        const catId = category_id ? parseInt(category_id) : null;
        const deptId = department_id ? parseInt(department_id) : null;
        const orgId = (organization_id || sub_department_id) ? parseInt(organization_id || sub_department_id) : null;
        
        let detailsJson = null;
        if (details) {
            if (typeof details === 'string') {
                try {
                    JSON.parse(details);
                    detailsJson = details;
                } catch {
                    detailsJson = JSON.stringify(details);
                }
            } else {
                detailsJson = JSON.stringify(details);
            }
        }

        const targetStatus = status || 'ใช้งานปกติ';
        const imageFilename = req.file ? req.file.filename : null;

        const scanUrl = getQrCodeUrl(req, computer_name);
        const qrCodeDataUrl = await QRCode.toDataURL(scanUrl);

        const [existing] = await db.query('SELECT id, status FROM equipments WHERE computer_name = ?', [computer_name]);

        let resultId = null;
        if (existing.length > 0) {
            if (existing[0].status === 'รอลงทะเบียน') {
                let updateSql = `
                    UPDATE equipments 
                    SET user_name = ?, position = ?, email = ?, phone = ?, category_id = ?, department_id = ?, organization_id = ?, details = ?, qr_code = ?, status = ?
                `;
                let updateParams = [
                    user_name || null,
                    position || null,
                    email || null,
                    phone || null,
                    catId,
                    deptId,
                    orgId,
                    detailsJson,
                    qrCodeDataUrl,
                    targetStatus
                ];
                if (imageFilename) {
                    updateSql += `, image = ? `;
                    updateParams.push(imageFilename);
                }
                updateSql += ` WHERE id = ?`;
                updateParams.push(existing[0].id);

                await db.query(updateSql, updateParams);
                resultId = existing[0].id;
            } else {
                return res.status(400).json({ message: `รหัสครุภัณฑ์/ชื่อเครื่อง "${computer_name}" มีอยู่ในระบบแล้ว` });
            }
        } else {
            const query = `
                INSERT INTO equipments (computer_name, user_name, position, email, phone, category_id, department_id, organization_id, details, qr_code, image, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(query, [
                computer_name, 
                user_name || null, 
                position || null, 
                email || null, 
                phone || null, 
                catId, 
                deptId, 
                orgId, 
                detailsJson, 
                qrCodeDataUrl,
                imageFilename,
                targetStatus
            ]);
            resultId = result.insertId;

            if (catId) {
                const parts = computer_name.split('-');
                if (parts.length === 3) {
                    const parsedSeq = parseInt(parts[2], 10);
                    if (!isNaN(parsedSeq)) {
                        await db.query(`
                            UPDATE categories 
                            SET last_seq = GREATEST(COALESCE(last_seq, 0), ?) 
                            WHERE id = ?
                        `, [parsedSeq, catId]);
                    }
                }
            }
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: req.headers['x-username'] || 'User',
            action: 'CREATE_EQUIPMENT',
            description: `ลงทะเบียนครุภัณฑ์: ${computer_name} (${user_name || '-'})`,
            target_type: 'EQUIPMENT',
            target_id: resultId,
            ip_address: clientIp
        });

        res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ', id: resultId });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/equipments/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { computer_name, user_name, position, email, phone, category_id, department_id, organization_id, organization_name, status, details, remove_image } = req.body;

        if (!computer_name) return res.status(400).json({ message: 'กรุณากรอกชื่อเครื่อง' });

        const catId = category_id ? parseInt(category_id) : null;
        const deptId = department_id ? parseInt(department_id) : null;
        const orgId = organization_id ? parseInt(organization_id) : null;
        
        let detailsJson = null;
        if (details) {
            if (typeof details === 'string') {
                try {
                    JSON.parse(details);
                    detailsJson = details;
                } catch {
                    detailsJson = JSON.stringify(details);
                }
            } else {
                detailsJson = JSON.stringify(details);
            }
        }

        const scanUrl = getQrCodeUrl(req, computer_name);
        const qrCodeDataUrl = await QRCode.toDataURL(scanUrl);

        const numId = parseInt(id, 10);
        const isValidNumber = !isNaN(numId);

        // ดึงรูปเดิมของเครื่องนี้
        const [current] = await db.query(
            `SELECT id, image FROM equipments WHERE computer_name = ? ${isValidNumber ? 'OR id = ?' : ''}`, 
            isValidNumber ? [id, numId] : [id]
        );
        if (current.length === 0) return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการแก้ไข' });

        let imageFilename = current[0].image;
        if (req.file) {
            if (imageFilename) {
                const oldPath = path.join(__dirname, 'uploads', imageFilename);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { console.error('Delete old image error:', e); }
                }
            }
            imageFilename = req.file.filename;
        } else if (remove_image === 'true' || remove_image === true) {
            if (imageFilename) {
                const oldPath = path.join(__dirname, 'uploads', imageFilename);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { console.error('Delete old image error:', e); }
                }
            }
            imageFilename = null;
        }

        const sql = `
            UPDATE equipments 
            SET computer_name = ?, user_name = ?, position = ?, email = ?, phone = ?, category_id = ?, department_id = ?, organization_id = ?, organization_name = ?, status = ?, details = ?, qr_code = ?, image = ?
            WHERE computer_name = ? ${isValidNumber ? 'OR id = ?' : ''}
        `;
        const params = isValidNumber 
            ? [computer_name, user_name || null, position || null, email || null, phone || null, catId, deptId, orgId, organization_name || null, status || 'ใช้งานปกติ', detailsJson, qrCodeDataUrl, imageFilename, id, numId]
            : [computer_name, user_name || null, position || null, email || null, phone || null, catId, deptId, orgId, organization_name || null, status || 'ใช้งานปกติ', detailsJson, qrCodeDataUrl, imageFilename, id];

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการแก้ไข' });

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: req.headers['x-username'] || 'User',
            action: 'EDIT_EQUIPMENT',
            description: `แก้ไขข้อมูลครุภัณฑ์: ${computer_name} (สถานะ: ${status || 'ใช้งานปกติ'})`,
            target_type: 'EQUIPMENT',
            target_id: id,
            ip_address: clientIp
        });

        res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/equipments/:id/repair-status', async (req, res) => {
    const { id } = req.params;
    let { status, note, repaired_by } = req.body;

    try {
        const [targetEq] = await db.query('SELECT computer_name FROM equipments WHERE id = ?', [id]);
        const eqName = targetEq.length > 0 ? targetEq[0].computer_name : `ID ${id}`;

        const userId = req.headers['x-user-id'];
        const headerUsername = req.headers['x-username'];
        const headerFullname = req.headers['x-fullname'];

        let finalOperatorName = headerFullname || repaired_by;
        if (userId && (!finalOperatorName || finalOperatorName === 'ช่างเทคนิค')) {
            const [uRows] = await db.query('SELECT fullname, username FROM users WHERE id = ?', [userId]);
            if (uRows.length > 0) {
                finalOperatorName = uRows[0].fullname || uRows[0].username;
            }
        } else if (headerUsername && (!finalOperatorName || finalOperatorName === 'ช่างเทคนิค')) {
            const [uRows] = await db.query('SELECT fullname, username FROM users WHERE username = ?', [headerUsername]);
            if (uRows.length > 0) {
                finalOperatorName = uRows[0].fullname || uRows[0].username;
            }
        }

        if (!finalOperatorName) finalOperatorName = 'ช่างเทคนิค';

        const updateSql = "UPDATE equipments SET status = ?, updated_at = NOW() WHERE id = ?";
        await db.query(updateSql, [status, id]);

        // อัปเดตสถานะในตาราง repairs ล่าสุดด้วย
        let repStatus = status;
        if (status === 'ใช้งานปกติ') repStatus = 'ซ่อมเสร็จสิ้น';
        else if (status === 'จำหน่าย') repStatus = 'จำหน่าย (ซ่อมไม่สำเร็จ)';
        else if (status === 'กำลังซ่อม') repStatus = 'กำลังซ่อม';

        try {
            await db.query(
                "UPDATE repairs SET status = ? WHERE equipment_id = ? ORDER BY id DESC LIMIT 1",
                [repStatus, id]
            );
        } catch (e) {
            console.warn('Could not update repairs table status:', e.message);
        }

        const historySql = "INSERT INTO repair_history (equipment_id, repair_status, repair_note, repaired_by) VALUES (?, ?, ?, ?)";
        await db.query(historySql, [id, status, note || null, finalOperatorName]);

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await logActivity({
            user_id: userId || null,
            username: finalOperatorName,
            action: 'UPDATE_REPAIR_STATUS',
            description: `อัปเดตสถานะงานซ่อมครุภัณฑ์ ${eqName}: -> ${status}${note ? ` (${note})` : ''}`,
            target_type: 'REPAIR',
            target_id: id,
            ip_address: clientIp
        });

        res.json({ success: true, message: 'บันทึกข้อมูลและประวัติเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Error updating repair status:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', details: err.message });
    }
});

app.get('/api/equipments/:id/repair-history', async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);
        const isValidNumber = !isNaN(numId);

        // หา equipment_id และ computer_name ที่แท้จริง
        const [eqRows] = await db.query(
            `SELECT id, computer_name FROM equipments WHERE ${isValidNumber ? 'id = ? OR computer_name = ?' : 'computer_name = ?'}`,
            isValidNumber ? [numId, id] : [id]
        );

        const realId = eqRows.length > 0 ? eqRows[0].id : numId;
        const compName = eqRows.length > 0 ? eqRows[0].computer_name : id;

        // ดึงจากตาราง repair_history
        const [historyRows] = await db.query(`
            SELECT 
                rh.id AS history_id,
                rh.equipment_id,
                rh.repair_status,
                rh.repair_note,
                COALESCE(u.fullname, rh.repaired_by, 'ช่างเทคนิค') AS repaired_by,
                rh.created_at AS action_date,
                COALESCE(e.computer_name, ?) AS computer_name,
                e.user_name
            FROM repair_history rh
            LEFT JOIN equipments e ON rh.equipment_id = e.id
            LEFT JOIN users u ON (rh.repaired_by = u.username OR rh.repaired_by = u.fullname)
            WHERE rh.equipment_id = ? OR e.computer_name = ?
            ORDER BY rh.created_at DESC
        `, [compName, realId, compName]);

        // ดึงจากตาราง repairs (การแจ้งซ่อม) ด้วย
        const [repairsRows] = await db.query(`
            SELECT 
                r.id AS history_id,
                r.equipment_id,
                r.status AS repair_status,
                CONCAT('แจ้งซ่อม: ', r.symptom) AS repair_note,
                r.image AS repair_image,
                COALESCE(r.reporter_name, 'ผู้ใช้งาน') AS repaired_by,
                r.created_at AS action_date,
                COALESCE(e.computer_name, ?) AS computer_name,
                e.user_name
            FROM repairs r
            LEFT JOIN equipments e ON r.equipment_id = e.id
            WHERE r.equipment_id = ? OR e.computer_name = ?
            ORDER BY r.created_at DESC
        `, [compName, realId, compName]);

        const combined = [...historyRows];
        repairsRows.forEach(rep => {
            const isDuplicate = combined.some(h => 
                h.repair_note && h.repair_note.includes(rep.repair_note)
            );
            if (!isDuplicate) {
                combined.push(rep);
            }
        });

        combined.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
        res.json(combined);
    } catch (err) {
        console.error('Error fetching equipment repair history:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการซ่อม' });
    }
});

app.delete('/api/equipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [targetEq] = await db.query('SELECT computer_name, image FROM equipments WHERE id = ?', [id]);
        const [result] = await db.query('DELETE FROM equipments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการลบ' });
        }

        // ลบรูปภาพออกจากเซิร์ฟเวอร์ถ้ามี
        if (targetEq.length > 0 && targetEq[0].image) {
            const oldPath = path.join(__dirname, 'uploads', targetEq[0].image);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (e) { console.error('Delete equipment image file error:', e); }
            }
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const eqName = targetEq.length > 0 ? targetEq[0].computer_name : id;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: req.headers['x-username'] || 'User',
            action: 'DELETE_EQUIPMENT',
            description: `ลบรายการครุภัณฑ์: ${eqName} (ID: ${id})`,
            target_type: 'EQUIPMENT',
            target_id: id,
            ip_address: clientIp
        });

        res.json({ message: 'ลบรายการครุภัณฑ์สำเร็จ' });
    } catch (err) {
        console.error('Delete Equipment Error:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'ไม่สามารถลบรายการนี้ได้ เนื่องจากมีประวัติการแจ้งซ่อมผูกอยู่' });
        }
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบครุภัณฑ์: ' + (err.sqlMessage || err.message) });
    }
});

// =========================================================================
// 9. Audit Rounds & Audit Process API
// =========================================================================
app.get('/api/audit-rounds', async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id,
                r.title,
                r.fiscal_year,
                r.department_id,
                r.start_date,
                r.end_date,
                r.status,
                r.created_at,
                d.name AS department_name,
                COUNT(e.id) AS total_items,
                SUM(
                    CASE 
                        WHEN e.last_audited_at IS NOT NULL 
                             AND e.last_audited_at >= r.start_date 
                             AND e.last_audited_at <= DATE_ADD(r.end_date, INTERVAL 1 DAY)
                        THEN 1 
                        ELSE 0 
                    END
                ) AS audited_items,
                CASE 
                    WHEN r.status = 'CLOSED' THEN 100
                    WHEN COUNT(e.id) = 0 THEN 0
                    ELSE ROUND(
                        (
                            SUM(
                                CASE 
                                    WHEN e.last_audited_at IS NOT NULL 
                                         AND e.last_audited_at >= r.start_date 
                                         AND e.last_audited_at <= DATE_ADD(r.end_date, INTERVAL 1 DAY)
                                    THEN 1 
                                    ELSE 0 
                                END
                            ) / COUNT(e.id)
                        ) * 100
                    )
                END AS progress
            FROM audit_rounds r
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN equipments e ON (r.department_id IS NULL OR e.department_id = r.department_id)
            GROUP BY r.id, r.title, r.fiscal_year, r.department_id, r.start_date, r.end_date, r.status, r.created_at, d.name
            ORDER BY r.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรอบการสำรวจ: ' + err.message });
    }
});

app.post('/api/audit-rounds', async (req, res) => {
    try {
        const { title, fiscal_year, department_id, start_date, end_date, status } = req.body;

        if (!title || !start_date || !end_date) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
        }

        const deptId = department_id ? parseInt(department_id) : null;
        const roundStatus = status || 'ACTIVE';
        const fy = fiscal_year ? parseInt(fiscal_year) : (new Date().getFullYear() + 543);

        const sql = `
            INSERT INTO audit_rounds (title, fiscal_year, department_id, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [title, fy, deptId, start_date, end_date, roundStatus]);

        res.status(201).json({ message: 'สร้างรอบการสำรวจสำเร็จ', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรอบการสำรวจ: ' + (err.sqlMessage || err.message) });
    }
});

app.put('/api/audit-rounds/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, fiscal_year, department_id, start_date, end_date, status } = req.body;

        const deptId = department_id ? parseInt(department_id) : null;
        const fy = fiscal_year ? parseInt(fiscal_year) : (new Date().getFullYear() + 543);

        const sql = `
            UPDATE audit_rounds 
            SET title = ?, fiscal_year = ?, department_id = ?, start_date = ?, end_date = ?, status = ?
            WHERE id = ?
        `;
        const [result] = await db.query(sql, [title, fy, deptId, start_date, end_date, status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบรอบการสำรวจที่ต้องการแก้ไข' });
        }

        res.json({ message: 'อัปเดตข้อมูลรอบการสำรวจสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขรอบการสำรวจ: ' + (err.sqlMessage || err.message) });
    }
});

app.delete('/api/audit-rounds/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM audit_rounds WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบรอบการสำรวจที่ต้องการลบ' });
        }

        res.json({ message: 'ลบรายการรอบการสำรวจสำเร็จ' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรอบการสำรวจ: ' + err.message });
    }
});

app.get('/api/audit/check', async (req, res) => {
    try {
        const { equipment_id, round_id } = req.query;
        if (!equipment_id || !round_id) return res.json({ audited: false });

        const [rounds] = await db.query('SELECT start_date, end_date FROM audit_rounds WHERE id = ?', [round_id]);
        if (rounds.length === 0) return res.json({ audited: false });

        const round = rounds[0];
        const numEqId = parseInt(equipment_id, 10);
        const isValidNumber = !isNaN(numEqId);

        const sql = `
            SELECT last_audited_at FROM equipments 
            WHERE (computer_name = ? ${isValidNumber ? 'OR id = ?' : ''}) 
            AND last_audited_at >= ? AND last_audited_at <= DATE_ADD(?, INTERVAL 1 DAY)
        `;
        const params = isValidNumber 
            ? [equipment_id, numEqId, round.start_date, round.end_date]
            : [equipment_id, round.start_date, round.end_date];

        const [eqs] = await db.query(sql, params);

        if (eqs.length > 0 && eqs[0].last_audited_at) {
            return res.json({ audited: true, audited_at: eqs[0].last_audited_at });
        }
        res.json({ audited: false });
    } catch (err) {
        res.json({ audited: false });
    }
});

app.post('/api/audit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);
        const isValidNumber = !isNaN(numId);

        const sql = `
            UPDATE equipments 
            SET last_audited_at = NOW() 
            WHERE computer_name = ? ${isValidNumber ? 'OR id = ?' : ''}
        `;
        const params = isValidNumber ? [id, numId] : [id];

        const [result] = await db.query(sql, params);

        if (result.affectedRows > 0) {
            const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await logActivity({
                user_id: req.headers['x-user-id'] || null,
                username: req.headers['x-username'] || 'User',
                action: 'AUDIT_EQUIPMENT',
                description: `บันทึกยืนยันผลการสำรวจครุภัณฑ์: ${id}`,
                target_type: 'AUDIT',
                target_id: id,
                ip_address: clientIp
            });

            res.json({ message: 'บันทึกการสำรวจประจำปีสำเร็จ!' });
        } else {
            res.status(404).json({ message: 'ไม่พบครุภัณฑ์ที่ต้องการสำรวจ' });
        }
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกการสำรวจ: ' + err.message });
    }
});

app.post('/api/audit/:id/reset', async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id, 10);
        const isValidNumber = !isNaN(numId);

        const sql = `
            UPDATE equipments 
            SET last_audited_at = NULL 
            WHERE computer_name = ? ${isValidNumber ? 'OR id = ?' : ''}
        `;
        const params = isValidNumber ? [id, numId] : [id];

        const [result] = await db.query(sql, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบครุภัณฑ์ที่ต้องการรีเซ็ต' });
        }
        
        res.json({ message: 'รีเซ็ตสถานะการสำรวจเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรีเซ็ตสถานะ: ' + err.message });
    }
});

// =========================================================================
// 10. Repairs API & Repair History API
// =========================================================================
app.get('/api/repairs/count', async (req, res) => {
    try {
        const { department_id, department_name } = req.query;
        let sql = `
            SELECT COUNT(*) AS count 
            FROM equipments e
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE (e.status LIKE '%ซ่อม%' OR e.status LIKE '%REPAIR%') 
              AND e.status NOT LIKE '%ใช้งานปกติ%' 
              AND e.status NOT LIKE '%ACTIVE%'
        `;
        const params = [];
        if (department_id) {
            sql += ` AND (e.department_id = ? OR d.name = ?)`;
            params.push(department_id, department_name || department_id);
        } else if (department_name) {
            sql += ` AND d.name = ?`;
            params.push(department_name);
        }

        const [rows] = await db.query(sql, params);
        res.json({ count: rows[0].count || 0 });
    } catch (err) {
        console.error('Error fetching repair count:', err);
        res.status(500).json({ error: 'ไม่สามารถนับจำนวนงานซ่อมได้', details: err.message });
    }
});

app.get('/api/repairs', async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id, r.reporter_name, r.symptom, r.image, r.status, r.created_at,
                e.computer_name, e.user_name AS equipment_user
            FROM repairs r
            JOIN equipments e ON r.equipment_id = e.id
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งซ่อม: ' + err.message });
    }
});

app.post('/api/repairs', upload.single('image'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { equipment_id, reporter_name, symptom } = req.body;
        const imageFilename = req.file ? req.file.filename : null;

        const numId = parseInt(equipment_id, 10);
        const isValidNumber = !isNaN(numId);

        const sql = `SELECT id, computer_name FROM equipments WHERE computer_name = ? ${isValidNumber ? 'OR id = ?' : ''}`;
        const params = isValidNumber ? [equipment_id, numId] : [equipment_id];

        const [eqRows] = await connection.query(sql, params);
        if (eqRows.length === 0) throw new Error('ไม่พบข้อมูลครุภัณฑ์ในระบบ');

        const realEqId = eqRows[0].id;

        await connection.query(
            'INSERT INTO repairs (equipment_id, reporter_name, symptom, image, status) VALUES (?, ?, ?, ?, ?)',
            [realEqId, reporter_name, symptom, imageFilename, 'รอดำเนินการ']
        );

        await connection.query('UPDATE equipments SET status = ? WHERE id = ?', ['ส่งซ่อม', realEqId]);

        await connection.commit();

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logActivity({
            user_id: req.headers['x-user-id'] || null,
            username: reporter_name || req.headers['x-username'] || 'User',
            action: 'REPORT_REPAIR',
            description: `แจ้งซ่อมครุภัณฑ์ ${eqRows[0].computer_name || realEqId} อาการ: ${symptom}`,
            target_type: 'REPAIR',
            target_id: realEqId,
            ip_address: clientIp
        });

        res.status(201).json({ message: 'ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว!' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งเรื่องแจ้งซ่อม: ' + err.message });
    } finally {
        connection.release();
    }
});

app.get('/api/repair-history', async (req, res) => {
    try {
        const { equipment_id } = req.query;
        let sql = `
            SELECT 
                rh.id AS history_id,
                rh.equipment_id,
                rh.repair_status,
                rh.repair_note,
                COALESCE(u.fullname, rh.repaired_by, 'ช่างเทคนิค') AS repaired_by,
                rh.created_at AS action_date,
                e.computer_name,
                e.user_name,
                e.department_id,
                e.organization_id,
                COALESCE(c.name, '-') AS category_name,
                COALESCE(d.name, '-') AS department_name,
                COALESCE(e.organization_name, o.name, '-') AS organization_name
            FROM repair_history rh
            LEFT JOIN equipments e ON rh.equipment_id = e.id
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN organizations o ON e.organization_id = o.id
            LEFT JOIN users u ON (rh.repaired_by = u.username OR rh.repaired_by = u.fullname)
        `;
        const params = [];
        if (equipment_id) {
            sql += ` WHERE rh.equipment_id = ? `;
            params.push(equipment_id);
        }
        sql += ` ORDER BY rh.created_at DESC `;
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching repair history:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล', details: err.message });
    }
});

// =========================================================================
// 11. Equipment Attributes API
// =========================================================================
app.get('/api/equipment-attributes', async (req, res) => {
    try {
        const { category_id } = req.query;
        let query = 'SELECT id, category_id, name, input_type, options, is_required, sort_order FROM equipment_attributes';
        const params = [];
        if (category_id) {
            query += ' WHERE category_id = ?';
            params.push(parseInt(category_id, 10));
        }
        query += ' ORDER BY sort_order ASC, id ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching attributes:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหัวข้อ' });
    }
});

app.post('/api/equipment-attributes', async (req, res) => {
    const { category_id, name, input_type, options, is_required } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'กรุณาระบุชื่อหัวข้อ' });
    }

    try {
        const catId = category_id ? parseInt(category_id, 10) : null;
        let maxSql = 'SELECT MAX(sort_order) AS maxOrder FROM equipment_attributes';
        const maxParams = [];
        if (catId) {
            maxSql += ' WHERE category_id = ?';
            maxParams.push(catId);
        } else {
            maxSql += ' WHERE category_id IS NULL';
        }
        const [maxResult] = await db.query(maxSql, maxParams);
        const nextOrder = (maxResult[0]?.maxOrder || 0) + 1;

        const [result] = await db.query(
            'INSERT INTO equipment_attributes (category_id, name, input_type, options, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [catId, name.trim(), input_type || 'text', options ? options.trim() : null, is_required ? 1 : 0, nextOrder]
        );

        res.status(201).json({
            message: 'เพิ่มหัวข้อสำเร็จ',
            id: result.insertId,
            category_id: catId,
            name: name.trim(),
            input_type: input_type || 'text',
            options: options ? options.trim() : null,
            is_required: is_required ? 1 : 0,
            sort_order: nextOrder
        });
    } catch (error) {
        console.error('Error adding attribute:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกหัวข้อ' });
    }
});

app.put('/api/equipment-attributes/reorder', async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'รูปแบบข้อมูลไม่ถูกต้อง' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of items) {
            await connection.query(
                'UPDATE equipment_attributes SET sort_order = ? WHERE id = ?',
                [item.sort_order, item.id]
            );
        }

        await connection.commit();
        res.json({ message: 'อัปเดตลำดับสำเร็จ' });
    } catch (error) {
        await connection.rollback();
        console.error('Error reordering attributes:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนลำดับ' });
    } finally {
        connection.release();
    }
});

app.put('/api/equipment-attributes/:id', async (req, res) => {
    const { id } = req.params;
    const { name, input_type, options, is_required } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'กรุณาระบุชื่อหัวข้อ' });
    }

    try {
        const [result] = await db.query(
            'UPDATE equipment_attributes SET name = ?, input_type = COALESCE(?, input_type), options = ?, is_required = ? WHERE id = ?',
            [name.trim(), input_type || 'text', options !== undefined ? (options ? options.trim() : null) : null, is_required ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหัวข้อที่ต้องการแก้ไข' });
        }

        res.json({ message: 'อัปเดตหัวข้อสำเร็จ' });
    } catch (error) {
        console.error('Error updating attribute:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขหัวข้อ' });
    }
});

app.delete('/api/equipment-attributes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'DELETE FROM equipment_attributes WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหัวข้อที่ต้องการลบ' });
        }

        res.json({ message: 'ลบหัวข้อสำเร็จ' });
    } catch (error) {
        console.error('Error deleting attribute:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหัวข้อ' });
    }
});

// =========================================================================
// 12. Dashboard API
// =========================================================================
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const { department_id } = req.query;

        let eqWhere = '';
        let repairWhere = '';
        const eqParams = [];
        const repairParams = [];

        if (department_id && department_id !== 'all') {
            eqWhere = ' WHERE department_id = ?';
            repairWhere = ' WHERE e.department_id = ?';
            eqParams.push(parseInt(department_id));
            repairParams.push(parseInt(department_id));
        }

        const [statusCounts] = await db.query(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'ใช้งานปกติ' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'ส่งซ่อม' THEN 1 ELSE 0 END) AS repair,
                SUM(CASE WHEN status = 'จำหน่าย' THEN 1 ELSE 0 END) AS retired
            FROM equipments
            ${eqWhere}
        `, eqParams);

        const [categoryCounts] = await db.query(`
            SELECT c.name, COUNT(e.id) AS count
            FROM categories c
            LEFT JOIN equipments e ON c.id = e.category_id ${department_id && department_id !== 'all' ? 'AND e.department_id = ?' : ''}
            GROUP BY c.id, c.name
            HAVING count > 0
            ORDER BY count DESC
        `, department_id && department_id !== 'all' ? [parseInt(department_id)] : []);

        const [latestRepairs] = await db.query(`
            SELECT 
                r.id, r.symptom, r.status, r.created_at,
                e.computer_name, e.user_name
            FROM repairs r
            JOIN equipments e ON r.equipment_id = e.id
            ${repairWhere}
            ORDER BY r.id DESC
            LIMIT 5
        `, repairParams);

        res.json({
            stats: statusCounts[0] || {},
            categories: categoryCounts || [],
            latestRepairs: latestRepairs || []
        });
    } catch (err) {
        console.error('Dashboard Summary Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด: ' + err.message });
    }
});

// =========================================================================
// 13. Export Excel Report
// =========================================================================
app.get('/api/reports/export/excel', async (req, res) => {
    try {
        const { department_id } = req.query;
        let query = `
            SELECT 
                e.computer_name, 
                e.user_name,
                e.position,
                e.email,
                e.phone,
                COALESCE(o.name, e.organization_name, '-') AS organization_name,
                COALESCE(c.name, '-') AS category_name,
                COALESCE(d.name, '-') AS department_name,
                COALESCE(e.status, 'ใช้งานปกติ') AS status,
                e.details
            FROM equipments e
            LEFT JOIN categories c ON e.category_id = c.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN organizations o ON e.organization_id = o.id
        `;
        const params = [];
        if (department_id) {
            query += ` WHERE e.department_id = ? OR d.name = ?`;
            params.push(department_id, department_id);
        }
        query += ` ORDER BY e.id DESC`;

        const [rows] = await db.query(query, params);

        const dynamicKeysSet = new Set();
        
        const parsedRows = rows.map(item => {
            let parsedDetails = [];
            if (item.details) {
                try {
                    parsedDetails = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
                } catch (e) {
                    parsedDetails = [];
                }
            }

            const specMap = {};
            if (Array.isArray(parsedDetails)) {
                parsedDetails.forEach(spec => {
                    const key = spec.title || spec.label || spec.name;
                    if (key) {
                        const cleanKey = key.trim();
                        specMap[cleanKey] = spec.value || '-';
                        dynamicKeysSet.add(cleanKey);
                    }
                });
            }

            return {
                ...item,
                specMap
            };
        });

        const dynamicKeys = Array.from(dynamicKeysSet);

        const columns = [
            { header: 'ลำดับ', key: 'no', width: 8 },
            { header: 'ชื่อเครื่อง', key: 'computer_name', width: 22 },
            { header: 'ชื่อผู้ใช้งาน', key: 'user_name', width: 25 },
            { header: 'ตำแหน่ง', key: 'position', width: 25 },
            { header: 'อีเมล ทอ.', key: 'email', width: 25 },
            { header: 'เบอร์โทรศัพท์', key: 'phone', width: 20 },
            { header: 'หมวดหมู่', key: 'category_name', width: 20 },
            { header: 'สังกัด', key: 'department_name', width: 22 },
            { header: 'หน่วยงาน', key: 'organization_name', width: 22 },
            { header: 'สถานะ', key: 'status', width: 15 }
        ];

        dynamicKeys.forEach(key => {
            columns.push({
                header: key,
                key: `spec_${key}`,
                width: 25
            });
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('รายงานครุภัณฑ์');
        worksheet.columns = columns;

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1F2937' }
        };

        parsedRows.forEach((item, index) => {
            const rowData = {
                no: index + 1,
                computer_name: item.computer_name || '-',
                user_name: item.user_name || '-',
                position: item.position || '-',
                email: item.email || '-',
                phone: item.phone || '-',
                category_name: item.category_name || '-',
                department_name: item.department_name || '-',
                organization_name: item.organization_name || '-',
                status: item.status || '-'
            };

            dynamicKeys.forEach(key => {
                rowData[`spec_${key}`] = item.specMap[key] || '-';
            });

            worksheet.addRow(rowData);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Equipment_Report.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Export Excel Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ' + err.message });
    }
});

// =========================================================================
// 14. Fallback Router & API 404 Handler (วางท้ายสุดเสมอ)
// =========================================================================
app.use(/\/api\/(.*)/, (req, res) => {
    res.status(404).json({ error: 'ไม่พบ API Endpoint ที่ระบุ' });
});

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            res.status(404).send('ไม่พบไฟล์ HTML หลักใน Root Directory');
        }
    });
});



// =========================================================================
// 15. Server Initialization
// =========================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));