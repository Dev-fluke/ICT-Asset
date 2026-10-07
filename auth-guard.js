// Helper Function สำหรับอ่านค่า Cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// 1. ฟังก์ชันเช็กสิทธิ์ (ตรวจจับทั้ง localStorage และ Session Cookie เมื่อปิด Browser)
function checkAuth() {
    // ถ้าไม่มี Session Cookie (แสดงว่าเพิ่งเปิด Browser ขึ้นมาใหม่) แต่มีคราบ Session อยู่ใน localStorage
    if (!getCookie('browser_session_active') && localStorage.getItem('isLoggedIn') === 'true') {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user_session');
        sessionStorage.clear();
    }

    // เช็กว่ามีการ Login หรือไม่ หากไม่มีให้เด้งไปหน้า index.html
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.replace('index.html');
    } else {
        // หากยังล็อกอินอยู่ ให้สร้าง/รักษา Session Cookie ไว้ ( cookie นี้จะหายไปทันทีเมื่อปิด Browser )
        document.cookie = "browser_session_active=true; path=/; SameSite=Lax";
    }
}

// 2. สั่งทำงานทันทีที่โหลด Script (ไม่ต้องรอ DOM)
checkAuth();

// 3. ป้องกัน Browser Cache เวลาผู้ใช้กดปุ่ม Back หลัง Logout
window.addEventListener('pageshow', function (event) {
    if (event.persisted || (performance && performance.getEntriesByType("navigation")[0]?.type === 'back_forward')) {
        checkAuth();
    }
});

// 4. ระบบ Auto Logout เมื่อไม่มีการใช้งานเกิน 10 นาที
(function setupAutoLogout() {
    // หากไม่ได้ Login ไม่ต้องทำงาน
    if (localStorage.getItem('isLoggedIn') !== 'true') return;

    let inactivityTimer;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 600,000 มิลลิวินาที = 10 นาที

    function logoutUser() {
        // ล้างข้อมูล Session ทั้งหมด
        document.cookie = "browser_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user_session');
        sessionStorage.clear();

        alert('ระบบออกจากการเชื่อมต่ออัตโนมัติ เนื่องจากไม่มีการใช้งานเกิน 10 นาที');
        window.location.replace('index.html');
    }

    function resetTimer() {
        // หากเพิ่ง Logout ไป ให้หยุดการทำงาน
        if (localStorage.getItem('isLoggedIn') !== 'true') return;

        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutUser, INACTIVITY_LIMIT);
    }

    // ตรวจจับ Event การโต้ตอบของผู้ใช้ (คลิก, พิมพ์, เลื่อนหน้าจอ, แตะสัมผัส)
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(eventType => {
        window.addEventListener(eventType, resetTimer, true);
    });

    // เริ่มนับเวลาถอยหลังทันทีที่เข้าหน้าเว็บ
    resetTimer();
})();