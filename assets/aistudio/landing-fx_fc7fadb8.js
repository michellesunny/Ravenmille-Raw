/* Ravenmille landing — dekorasi halus + animasi muncul (tanpa edit HTML) */
(function () {
    'use strict';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PARALLAX = true;               // false = matikan geser mengikuti mouse
    const rand = (a, b) => a + Math.random() * (b - a);

    const lum = c => {
        const m = c.match(/[\d.]+/g); if (!m) return 1;
        const [r, g, b] = m.map(Number), a = m.length > 3 ? m[3] : 1;
        return a < 0.3 ? 1 : (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };

    function shape(layer, cls, size, x, y, depth, wrap) {
        const w = document.createElement('div');
        w.className = 'fx-shape' + (wrap ? ' ' + wrap : '');
        w.style.cssText = `width:${size}px;height:${size}px;left:${x}%;top:${y}%`;
        const i = document.createElement('i');
        i.className = 'fx-in ' + cls;
        i.style.setProperty('--del', (-rand(0, 20)).toFixed(1) + 's');
        i.style.setProperty('--dur', rand(22, 32).toFixed(0) + 's');
        i.style.setProperty('--r', rand(-15, 15).toFixed(0) + 'deg');
        w.appendChild(i); layer.appendChild(w);
        return { el: w, d: depth, inner: i };
    }

    /* ---------- 1. Dekorasi per section ---------- */
    const decor = [];
    document.querySelectorAll('section').forEach(sec => {
        if (sec.classList.contains('hero-section')) return;
        const dark = lum(getComputedStyle(sec).backgroundColor) < 0.35;
        const layer = document.createElement('div');
        layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true');
        sec.classList.add('fx-section', dark ? 'fx-dark' : 'fx-light');
        sec.prepend(layer);
        const shapes = [];
        if (dark) {
            const g = shape(layer, '', 420, rand(-6, 10), rand(-30, -10), 0, 'fx-glow');
            g.inner.style.background = '#3b82f6';
            const g2 = shape(layer, '', 320, rand(60, 72), rand(45, 60), 0, 'fx-glow');
            g2.inner.style.background = '#f59e0b'; g2.el.style.opacity = '.14';
        } else {
            const set = [['fx-sq', 70], ['fx-ci fill', 54], ['fx-sq fill', 44], ['fx-ci', 96]];
            const spots = [[4, 10], [88, 14], [8, 76], [90, 72]];
            set.forEach((s, i) => shapes.push(shape(layer, s[0], s[1], spots[i][0] + rand(-2, 2), spots[i][1] + rand(-4, 4), rand(-14, 14))));
        }
        decor.push({ el: sec, shapes, visible: false });
    });

    if (!reduce) {
        const vis = new IntersectionObserver(es => es.forEach(e => {
            const d = decor.find(x => x.el === e.target); if (d) d.visible = e.isIntersecting;
        }), { rootMargin: '80px' });
        decor.forEach(d => vis.observe(d.el));

        if (PARALLAX && matchMedia('(pointer:fine)').matches) {
            let mx = 0, my = 0, cx = 0, cy = 0;
            addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
            (function loop() {
                cx += (mx - cx) * .06; cy += (my - cy) * .06;
                decor.forEach(d => d.visible && d.shapes.forEach(s => {
                    s.el.style.transform = `translate3d(${(cx * s.d).toFixed(1)}px,${(cy * s.d).toFixed(1)}px,0)`;
                }));
                requestAnimationFrame(loop);
            })();
        }
    }

    /* ---------- 2. Hero: urutan masuk ---------- */
    const heroInner = document.querySelector('.hero-section .max-w-4xl');
    if (heroInner) [...heroInner.children].forEach((el, i) => { el.style.setProperty('--i', i); el.classList.add('hero-in'); });

    /* ---------- 3. Reveal tiap section saat pertama kali terlihat ---------- */
    const targets = [];
    document.querySelectorAll('section:not(.hero-section), footer').forEach(sec => {
        const box = [...sec.children].find(c => !c.classList.contains('fx-layer'));
        if (!box) return;
        [...box.children].forEach(c => {
            if (c.matches('.grid, .space-y-4')) [...c.children].forEach((k, i) => targets.push([k, i + 1]));
            else targets.push([c, 0]);
        });
    });
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target; io.unobserve(el);
        el.classList.add('in');
        // lepas class setelah selesai supaya hover kartu tetap normal
        setTimeout(() => el.classList.remove('rv', 'in'), 1200 + (+el.style.getPropertyValue('--i') || 0) * 110);
    }), { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    targets.forEach(([el, i]) => { el.style.setProperty('--i', i); el.classList.add('rv'); io.observe(el); });

    /* ---------- 4. Hitung naik "120+" ---------- */
    const num = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === '120+');
    if (num && !reduce) {
        num.textContent = '0+';
        new IntersectionObserver((es, o) => es.forEach(e => {
            if (!e.isIntersecting) return; o.disconnect();
            const t0 = performance.now();
            (function tick(n) {
                const k = Math.min(1, (n - t0) / 1500);
                num.textContent = Math.round(120 * (1 - Math.pow(1 - k, 3))) + '+';
                if (k < 1) requestAnimationFrame(tick);
            })(t0);
        }), { threshold: .6 }).observe(num);
    }

    /* ---------- 5. Progress scroll ---------- */
    const bar = document.createElement('div'); bar.id = 'scroll-bar'; document.body.appendChild(bar);
    const upd = () => {
        const h = document.documentElement, max = h.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    addEventListener('scroll', upd, { passive: true }); upd();
})();