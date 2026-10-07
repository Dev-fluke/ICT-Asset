// spa-router.js
class SPARouter {
    constructor(routes, containerId) {
        this.routes = routes;
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', e => {
            const anchor = e.target.closest('a');
            if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href').startsWith('/')) {
                const href = anchor.getAttribute('href');
                if (!anchor.hasAttribute('target') && !anchor.hasAttribute('download')) {
                    e.preventDefault();
                    this.navigate(href);
                }
            }
        });
        this.handleRoute();
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    async handleRoute() {
        let path = window.location.pathname;
        let route = this.routes[path] || this.routes['/404'];

        if (typeof route === 'function') {
            route = await route();
        }

        try {
            const response = await fetch(route);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            
            this.container.innerHTML = html;
            this.executeScripts();
            this.updateActiveMenu(path);
        } catch (err) {
            this.container.innerHTML = `<div class="p-5 text-center text-danger"><h5>ไม่พบหน้าที่ต้องการ (404)</h5></div>`;
        }
    }

    executeScripts() {
        const scripts = this.container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    updateActiveMenu(path) {
        const sidebar = document.getElementById('sidebar-placeholder');
        if (!sidebar) return;
        sidebar.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });
    }
}