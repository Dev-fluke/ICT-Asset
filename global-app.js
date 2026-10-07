// global-app.js

const SIDEBAR_CACHE_KEY = 'ict_sidebar_html_v10';

// 1. Synchronous Instant Sidebar Renderer (Called inline in HTML to eliminate FOUC/flicker)
function renderCachedSidebar() {
    try {
        const cached = sessionStorage.getItem(SIDEBAR_CACHE_KEY);
        const placeholder = document.getElementById('sidebar-placeholder');
        if (cached && placeholder && !placeholder.querySelector('.sidebar')) {
            placeholder.innerHTML = cached;
            applySidebarRolePermissions(placeholder);
            setActiveSidebarMenu(placeholder);
            if (typeof window.renderSidebarProfileData === 'function') {
                window.renderSidebarProfileData();
            }
            if (typeof window.updateSidebarRepairBadge === 'function') {
                window.updateSidebarRepairBadge();
            }
        }
    } catch (e) {
        console.warn('renderCachedSidebar error:', e);
    }
}

// 1.1 Helper: กรองสิทธิ์แสดงผลเมนูตาม Role (เช่น เฉพาะ Admin จึงจะเห็น users.html และ system.html)
function applySidebarRolePermissions(container) {
    const ph = container || document.getElementById('sidebar-placeholder');
    if (!ph) return;

    let userData = null;
    try {
        const raw = localStorage.getItem('user') || localStorage.getItem('user_session') || sessionStorage.getItem('user');
        if (raw) userData = JSON.parse(raw);
    } catch (e) {}

    const role = String(userData?.role || '').toLowerCase().trim();
    const isAdmin = role === 'admin';

    // ค้นหาเมนูตั้งค่า หรือเมนูที่มีลิงก์ไปยัง users.html หรือ system.html
    const settingNav = ph.querySelector('#sidebar-menu-setting') || 
                       ph.querySelector('#menu-setting')?.closest('.nav-item') || 
                       ph.querySelector('a[href*="users.html"]')?.closest('.nav-item') ||
                       ph.querySelector('a[href*="system.html"]')?.closest('.nav-item');

    if (settingNav) {
        settingNav.style.display = isAdmin ? '' : 'none';
    }

    // จัดการคลาส .admin-only ทั้งหมดภายใน Sidebar
    const adminElements = ph.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
}

// 1.2 Helper: ดึงข้อมูลโปรไฟล์ผู้ใช้งานมาแสดงบน Sidebar ทุกหน้า
function renderSidebarProfileData() {
    let userData = null;
    try {
        const raw = localStorage.getItem('user') || localStorage.getItem('user_session') || sessionStorage.getItem('user');
        if (raw) userData = JSON.parse(raw);
    } catch (e) {
        console.warn('renderSidebarProfileData error:', e);
    }

    if (!userData) return;

    const userName = userData.fullname || userData.name || userData.username || 'ผู้ใช้งานระบบ';
    const userHandle = userData.username ? `@${userData.username}` : '@user';
    const roleRaw = String(userData.role || 'staff').toLowerCase().trim();
    const isAdmin = roleRaw === 'admin';
    const roleText = isAdmin ? 'Admin' : (roleRaw === 'technician' ? 'ช่างเทคนิค' : 'เจ้าหน้าที่');
    const roleClass = isAdmin ? 'bg-danger text-white' : (roleRaw === 'technician' ? 'bg-warning text-dark' : 'bg-primary text-white');
    const avatarUrl = userData.avatar_url || (userData.avatar ? `/uploads/${userData.avatar}` : null) || userData.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0d6efd&color=fff`;

    // อัปเดตชื่อผู้ใช้
    const nameEls = document.querySelectorAll('#sidebar-user-fullname, #user-display-name, .sidebar #user-fullname');
    nameEls.forEach(el => el.textContent = userName);

    // อัปเดต username
    const userEls = document.querySelectorAll('#sidebar-user-username, .sidebar #user-username');
    userEls.forEach(el => el.textContent = userHandle);

    // อัปเดตสิทธิ์ (Role Badge)
    const roleEls = document.querySelectorAll('#sidebar-user-role, #user-role-badge, .sidebar #user-role');
    roleEls.forEach(el => {
        el.textContent = roleText;
        el.className = `badge rounded-pill px-2 py-0.5 small fw-semibold flex-shrink-0 ${roleClass}`;
    });

    // อัปเดตสังกัด (Department Badge)
    const deptName = userData.department_name || userData.department || (isAdmin ? 'ส่วนกลาง' : '');
    const deptEls = document.querySelectorAll('#sidebar-user-department, .sidebar #user-department');
    deptEls.forEach(el => {
        if (deptName && deptName !== '-') {
            el.innerHTML = `<i class="fa-solid fa-building me-1 opacity-75"></i>${deptName}`;
            el.title = `สังกัด: ${deptName}`;
            el.style.display = 'inline-flex';
            el.classList.add('align-items-center');
        } else {
            el.style.display = 'none';
        }
    });

    // อัปเดตรูปประจำตัว (Avatar)
    const avatarEls = document.querySelectorAll('#sidebar-user-avatar, .sidebar #user-avatar');
    avatarEls.forEach(el => {
        el.src = avatarUrl;
    });

    // จัดการสิทธิ์การมองเห็นเมนูตั้งค่า
    const settingNav = document.getElementById('sidebar-menu-setting') || 
                       document.querySelector('#menu-setting')?.closest('.nav-item') || 
                       document.querySelector('a[href*="users.html"]')?.closest('.nav-item') ||
                       document.querySelector('a[href*="system.html"]')?.closest('.nav-item');
    if (settingNav) {
        settingNav.style.display = isAdmin ? '' : 'none';
    }
}
window.renderSidebarProfileData = renderSidebarProfileData;

// 1.3 Helper: ดึงจำนวนงานซ่อมที่ค้างอยู่มาแสดงผลเป็นตัวเลขในวงกลมสีแดงบน Sidebar ตามสิทธิ์ผู้ใช้
async function updateSidebarRepairBadge(explicitCount) {
    let count = 0;

    let userData = null;
    try {
        const raw = localStorage.getItem('user') || localStorage.getItem('user_session') || sessionStorage.getItem('user');
        if (raw) userData = JSON.parse(raw);
    } catch (e) {}

    const roleRaw = String(userData?.role || 'staff').toLowerCase().trim();
    const isAdmin = roleRaw === 'admin';
    const staffDeptId = userData?.department_id;
    const staffDeptName = userData?.department_name;

    if (typeof explicitCount === 'number' && !isNaN(explicitCount)) {
        count = explicitCount;
    } else {
        try {
            let url = '/api/repairs/count';
            if (!isAdmin && (staffDeptId || staffDeptName)) {
                url += `?department_id=${encodeURIComponent(staffDeptId || '')}&department_name=${encodeURIComponent(staffDeptName || '')}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                count = Number(data.count) || 0;
            } else {
                throw new Error('Endpoint /api/repairs/count not available');
            }
        } catch (e) {
            // Fallback: ดึงจาก /api/equipments หากไม่มี endpoint นับตรง
            try {
                const eqRes = await fetch('/api/equipments');
                if (eqRes.ok) {
                    const equipments = await eqRes.json();
                    count = equipments.filter(item => {
                        const s = String(item.status_name || item.eq_status || item.status || '').toUpperCase();
                        const isRepair = (s.includes('REPAIR') || s.includes('ซ่อม')) && !s.includes('ใช้งานปกติ') && !s.includes('ACTIVE');
                        if (!isRepair) return false;

                        // หากไม่ใช่ Admin ให้กรองเฉพาะสังกัดตนเอง
                        if (!isAdmin) {
                            const matchId = staffDeptId && String(item.department_id) === String(staffDeptId);
                            const matchName = staffDeptName && String(item.department_name || '').trim().toLowerCase() === String(staffDeptName).trim().toLowerCase();
                            return matchId || matchName;
                        }
                        return true;
                    }).length;
                }
            } catch (err) {
                console.warn('Cannot fetch repair count:', err);
            }
        }
    }

    const badgeEls = document.querySelectorAll('.repair-badge, #repair-badge-parent, #repair-badge-child');
    badgeEls.forEach(el => {
        if (count > 0) {
            el.textContent = count > 99 ? '99+' : count;
            el.style.display = 'inline-flex';
        } else {
            el.style.display = 'none';
        }
    });
}
window.updateSidebarRepairBadge = updateSidebarRepairBadge;

// เรียกทำงานอัตโนมัติเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderSidebarProfileData();
        updateSidebarRepairBadge();
    });
} else {
    renderSidebarProfileData();
    updateSidebarRepairBadge();
}

// เช็กสถานะงานซ่อมเป็นระยะทุก 45 วินาที
if (!window._repairBadgeInterval) {
    window._repairBadgeInterval = setInterval(updateSidebarRepairBadge, 45000);
}

// 2. Active Menu Highlighter & Pre-expanded Submenus (Zero-animation jump)
function setActiveSidebarMenu(container) {
    const ph = container || document.getElementById('sidebar-placeholder');
    if (!ph) return;

    const pathname = window.location.pathname.split('/').pop() || 'dashboard.html';
    const menuLinks = ph.querySelectorAll('a');

    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const targetPage = href.split('/').pop();

        if (targetPage === pathname || (pathname === '' && targetPage === 'dashboard.html')) {
            link.classList.add('active');

            // Open parent collapse dropdown immediately without transition delay
            const parentCollapse = link.closest('.collapse');
            if (parentCollapse) {
                parentCollapse.classList.add('show');
                const toggleBtn = ph.querySelector(`[data-bs-target="#${parentCollapse.id}"], [href="#${parentCollapse.id}"]`);
                if (toggleBtn) {
                    toggleBtn.classList.remove('collapsed');
                    toggleBtn.setAttribute('aria-expanded', 'true');
                }
            }
        } else if (!href.startsWith('#')) {
            link.classList.remove('active');
        }
    });
}

// 3. Complete Sidebar Component Loader (Fetch once, cache in sessionStorage, bind profile & mobile events)
async function initSidebar(targetMenuPath) {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    let html = sessionStorage.getItem(SIDEBAR_CACHE_KEY);
    if (!html) {
        try {
            const res = await fetch('sidebar.html');
            if (res.ok) {
                html = await res.text();
                sessionStorage.setItem(SIDEBAR_CACHE_KEY, html);
            }
        } catch (err) {
            console.error('Failed to load sidebar.html:', err);
        }
    }

    if (html && !placeholder.querySelector('.sidebar')) {
        placeholder.innerHTML = html;
    }

    applySidebarRolePermissions(placeholder);
    setActiveSidebarMenu(placeholder);

    if (typeof window.renderSidebarProfileData === 'function') {
        window.renderSidebarProfileData();
    }

    if (typeof window.updateSidebarRepairBadge === 'function') {
        window.updateSidebarRepairBadge();
    }

    setupMobileSidebar(placeholder);
}

// 4. Mobile Sidebar Drawer Controls
function setupMobileSidebar(ph) {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('main-sidebar');

    if (toggleBtn && sidebar && !toggleBtn._hasMobileListener) {
        toggleBtn._hasMobileListener = true;
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('show');
            if (overlay) overlay.classList.add('show');
        });
    }

    if (closeBtn && sidebar && !closeBtn._hasMobileListener) {
        closeBtn._hasMobileListener = true;
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('show');
            if (overlay) overlay.classList.remove('show');
        });
    }

    if (overlay && sidebar && !overlay._hasMobileListener) {
        overlay._hasMobileListener = true;
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
}

// 5. Global Event Delegation for Logout (with re-entrancy lock & idempotency guard)
let isLoggingOut = false;

if (!window._globalLogoutListenerBound) {
    window._globalLogoutListenerBound = true;

    document.addEventListener('click', function (e) {
        const logoutBtn = e.target.closest('#btn-logout, .btn-logout, [href*="logout"]');
        if (logoutBtn) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        }
    });
}

async function handleLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
        const confirmed = confirm('คุณต้องการออกจากระบบหรือไม่?');
        if (!confirmed) {
            isLoggingOut = false;
            return;
        }

        let userData = null;
        try {
            const raw = localStorage.getItem('user') || localStorage.getItem('user_session') || sessionStorage.getItem('user');
            if (raw) userData = JSON.parse(raw);
        } catch (e) {}

        if (userData) {
            try {
                await fetch('/api/activity-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userData.id,
                        username: userData.username,
                        action: 'LOGOUT',
                        description: `ออกจากระบบ (${userData.fullname || userData.username})`,
                        target_type: 'AUTH'
                    })
                });
            } catch (e) {}
        }

        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (err) {
            console.warn('Logout API Error:', err);
        }

        try {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie = "browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        } catch (storageErr) {
            console.warn('Storage clearing issue:', storageErr);
        } finally {
            window.location.replace('index.html');
        }
    } catch (err) {
        isLoggingOut = false;
        console.error('Logout error:', err);
    }
}

// -------------------------------------------------------------------------
// 6. Global User Activity Logger & Online Heartbeat System
// -------------------------------------------------------------------------
async function recordUserActivity(action, description, targetType = null, targetId = null) {
    try {
        let userData = null;
        const raw = localStorage.getItem('user') || localStorage.getItem('user_session') || sessionStorage.getItem('user');
        if (raw) userData = JSON.parse(raw);
        if (!userData) return;

        await fetch('/api/activity-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userData.id,
                username: userData.username,
                action: action,
                description: description,
                target_type: targetType,
                target_id: targetId
            })
        });
    } catch (e) {
        console.warn('recordUserActivity error:', e);
    }
}

function startGlobalHeartbeat() {
    function send() {
        try {
            let userData = null;
            const raw = localStorage.getItem('user') || localStorage.getItem('user_session') || sessionStorage.getItem('user');
            if (raw) userData = JSON.parse(raw);
            if (!userData || (!userData.id && userData.id !== 0 && !userData.username)) return;

            fetch('/api/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userData.id,
                    username: userData.username
                })
            }).catch(() => {});
        } catch (e) {}
    }

    // ส่งสัญญาณทันทีที่เปิดหน้า และส่งซ้ำทุก 60 วินาที
    send();
    setInterval(send, 60000);
}

// =========================================================================
// ⏱️ Auto Logout on Inactivity System
// =========================================================================
let _inactivityTimer = null;
let _countdownTimer = null;

function initInactivityWatcher(settingsObj) {
    let settings = settingsObj;
    if (!settings) {
        try {
            settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
        } catch (e) {}
    }

    const enabled = settings?.auto_logout_enabled !== false && String(settings?.auto_logout_enabled) !== 'false';
    const minutes = parseInt(settings?.auto_logout_minutes, 10) || 15;

    // ถ้าปิดระบบ auto-logout ให้เคลียร์ตัวจับเวลาเดิมออก
    if (!enabled) {
        if (_inactivityTimer) clearTimeout(_inactivityTimer);
        if (_countdownTimer) clearInterval(_countdownTimer);
        hideInactivityWarning();
        return;
    }

    // ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && (localStorage.getItem('user') || localStorage.getItem('user_session'));
    if (!isLoggedIn) return;

    const timeoutMs = minutes * 60 * 1000;
    const warningMs = Math.max(30000, timeoutMs - 60000); // เตือนก่อนหมดเวลา 60 วินาที

    function resetTimer() {
        if (_inactivityTimer) clearTimeout(_inactivityTimer);
        if (_countdownTimer) clearInterval(_countdownTimer);
        hideInactivityWarning();

        _inactivityTimer = setTimeout(() => {
            showInactivityWarning(60);
        }, warningMs);
    }

    // ดักจับกิจกรรมของผู้ใช้
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => {
        window.removeEventListener(evt, resetTimer);
        window.addEventListener(evt, resetTimer, { passive: true });
    });

    resetTimer();
}

function showInactivityWarning(secondsLeft) {
    let currentSeconds = secondsLeft;
    let modal = document.getElementById('inactivity-warning-modal');

    if (!modal) {
        const modalHtml = `
            <div class="modal fade show" id="inactivity-warning-modal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.6); z-index: 10000;" aria-modal="true" role="dialog">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 420px;">
                    <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
                        <div class="modal-body text-center p-4">
                            <div class="mb-3">
                                <div class="d-inline-flex align-items-center justify-content-center bg-warning-subtle text-warning rounded-circle shadow-sm" style="width: 64px; height: 64px;">
                                    <i class="fa-solid fa-clock-rotate-left fs-2 text-warning"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold text-dark mb-2">ไม่มีการใช้งานระบบชั่วขณะ</h5>
                            <p class="text-muted small mb-3">
                                คุณไม่มีการเคลื่อนไหวใดๆ บนหน้านี้ ระบบจะทำการออกจากระบบโดยอัตโนมัติเพื่อความปลอดภัยในอีก
                            </p>
                            <div class="display-6 fw-bold text-danger mb-3" id="inactivity-countdown-timer">
                                ${currentSeconds} วินาที
                            </div>
                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-primary fw-bold py-2" id="btn-stay-logged-in">
                                    <i class="fa-solid fa-user-check me-1"></i> คงอยู่ในระบบต่อไป
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('inactivity-warning-modal');

        document.getElementById('btn-stay-logged-in').addEventListener('click', () => {
            initInactivityWatcher();
        });
    } else {
        modal.style.display = 'block';
    }

    const timerText = document.getElementById('inactivity-countdown-timer');

    if (_countdownTimer) clearInterval(_countdownTimer);
    _countdownTimer = setInterval(() => {
        currentSeconds--;
        if (timerText) timerText.textContent = `${currentSeconds} วินาที`;
        if (currentSeconds <= 0) {
            clearInterval(_countdownTimer);
            handleInactivityLogout();
        }
    }, 1000);
}

function hideInactivityWarning() {
    const modal = document.getElementById('inactivity-warning-modal');
    if (modal) modal.style.display = 'none';
}

function handleInactivityLogout() {
    hideInactivityWarning();
    try {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('user_session');
        sessionStorage.clear();
        document.cookie = "browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    } catch (e) {}

    window.location.href = 'index.html?timeout=1';
}

// โหลดและซิงค์การตั้งค่าระบบทั้งหมด
async function syncSystemSettings() {
    try {
        const res = await fetch('/api/system/settings');
        if (res.ok) {
            const data = await res.json();
            if (data.settings) {
                const s = data.settings;
                localStorage.setItem('system_settings', JSON.stringify(s));
                initInactivityWatcher(s);
            }
        }
    } catch (e) {
        console.warn('syncSystemSettings error:', e);
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            startGlobalHeartbeat();
            syncSystemSettings();
        });
    } else {
        startGlobalHeartbeat();
        syncSystemSettings();
    }
}

// Make functions available globally on window
window.renderCachedSidebar = renderCachedSidebar;
window.setActiveSidebarMenu = setActiveSidebarMenu;
window.initSidebar = initSidebar;
window.handleLogout = handleLogout;
window.recordUserActivity = recordUserActivity;
window.startGlobalHeartbeat = startGlobalHeartbeat;
window.initInactivityWatcher = initInactivityWatcher;
window.syncSystemSettings = syncSystemSettings;

