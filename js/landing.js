/* ==========================================================================
   Ravenmille – Interaktivitas Halaman Beranda
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // 0. Pastikan video latar hero berjalan mulus & menghormati preferensi reduced-motion
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var heroVideo = document.querySelector('.hero-bg-video');
    if (heroVideo) {
      if (prefersReduced) {
        heroVideo.pause();
      } else {
        heroVideo.muted = true;
        heroVideo.defaultMuted = true;
        var playPromise = heroVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      }
    }

    // 1. Animasi angka pengguna aktif bulanan (progress bar & scroll reveal ditangani oleh common-ui.js)
    var userCountEl = document.getElementById('monthly-users-count');
    if (userCountEl && !prefersReduced && 'IntersectionObserver' in window) {
      var targetNum = 120;
      userCountEl.textContent = '0+';
      var countObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          var start = performance.now();
          var duration = 1200;
          var tick = function (now) {
            var progress = Math.min(1, (now - start) / duration);
            var eased = 1 - Math.pow(1 - progress, 3);
            userCountEl.textContent = Math.round(targetNum * eased) + '+';
            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.5 });
      countObserver.observe(userCountEl);
    }

    // 3. Accordion FAQ
    var faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isExpanded = btn.getAttribute('aria-expanded') === 'true';
        var panelId = btn.getAttribute('aria-controls');
        var panel = panelId ? document.getElementById(panelId) : null;

        faqTriggers.forEach(function (otherBtn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          var otherIcon = otherBtn.querySelector('.faq-symbol');
          if (otherIcon) otherIcon.textContent = '+';
          var otherPanelId = otherBtn.getAttribute('aria-controls');
          var otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;
          if (otherPanel) otherPanel.hidden = true;
        });

        if (!isExpanded && panel) {
          btn.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
          var icon = btn.querySelector('.faq-symbol');
          if (icon) icon.textContent = '−';
        }
      });
    });

    // 4. Form Konsultasi / Pencarian Kendaraan (Tersambung ke Supabase + localStorage fallback)
    var inquiryForm = document.getElementById('form-konsultasi-kendaraan');
    if (inquiryForm) {
      inquiryForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        var namaInput = document.getElementById('konsultasi-nama');
        var emailInput = document.getElementById('konsultasi-email');
        var mobilInput = document.getElementById('konsultasi-mobil');
        var tujuanSelect = document.getElementById('konsultasi-tujuan');
        var persetujuan = document.getElementById('konsultasi-persetujuan');
        var feedbackBox = document.getElementById('konsultasi-feedback');
        var submitBtn = inquiryForm.querySelector('button[type="submit"]');

        [namaInput, emailInput, mobilInput].forEach(function (el) {
          if (el) el.classList.remove('is-invalid');
        });

        var nama = namaInput.value.trim();
        var email = emailInput.value.trim();
        var mobil = mobilInput.value.trim();
        var tujuan = tujuanSelect.value;
        var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!nama) {
          namaInput.classList.add('is-invalid');
          namaInput.focus();
          feedbackBox.className = 'status-banner is-danger';
          feedbackBox.textContent = 'Mohon isi nama lengkap Anda terlebih dahulu.';
          feedbackBox.hidden = false;
          return;
        }
        if (!emailValid) {
          emailInput.classList.add('is-invalid');
          emailInput.focus();
          feedbackBox.className = 'status-banner is-danger';
          feedbackBox.textContent = 'Mohon masukkan alamat email yang valid.';
          feedbackBox.hidden = false;
          return;
        }
        if (!mobil) {
          mobilInput.classList.add('is-invalid');
          mobilInput.focus();
          feedbackBox.className = 'status-banner is-danger';
          feedbackBox.textContent = 'Mohon tuliskan merek dan model mobil yang sedang Anda pertimbangkan.';
          feedbackBox.hidden = false;
          return;
        }
        if (!persetujuan.checked) {
          persetujuan.focus();
          feedbackBox.className = 'status-banner is-warning';
          feedbackBox.textContent = 'Centang kotak persetujuan untuk melanjutkan pengiriman permintaan.';
          feedbackBox.hidden = false;
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        var recommendations = {
          'beli-bekas': { href: 'analisis-risiko.html', label: 'Buka Analisis Risiko Mobil Bekas' },
          'beli-baru': { href: 'kalkulator-tco.html', label: 'Buka Kalkulator TCO Kendaraan' },
          'komparasi': { href: 'komparasi-kendaraan.html', label: 'Buka Komparasi Head-to-Head' },
          'inspeksi': { href: 'bengkel-inspektor.html', label: 'Lihat Daftar Inspektor Independen' }
        };
        var targetTool = recommendations[tujuan] || recommendations['beli-baru'];

        if (typeof window.ravenmilleSafeInsert === 'function') {
          await window.ravenmilleSafeInsert('consultations', {
            name: nama,
            email: email,
            vehicle_interest: mobil,
            goal: tujuan
          });
        }

        try {
          var existing = JSON.parse(localStorage.getItem('ravenmille_inquiries') || '[]');
          existing.push({
            nama: nama,
            email: email,
            mobil: mobil,
            tujuan: tujuan,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('ravenmille_inquiries', JSON.stringify(existing));
        } catch (e) {
          // Ignore storage errors in private mode
        }

        if (submitBtn) submitBtn.disabled = false;

        var safeNama = window.RavenmilleUI.escapeHtml(nama);
        var safeMobil = window.RavenmilleUI.escapeHtml(mobil);

        feedbackBox.className = 'status-banner is-success';
        feedbackBox.innerHTML =
          '<div><strong>Permintaan tersimpan untuk ' + safeNama + ' (' + safeMobil + ').</strong> ' +
          'Sambil tim menyiapkan ringkasan, Anda dapat langsung mengaudit unit pilihan Anda melalui alat terkait: ' +
          '<a href="' + targetTool.href + '" style="text-decoration: underline; font-weight: 800;">' + targetTool.label + '</a>.</div>';
        feedbackBox.hidden = false;
        inquiryForm.reset();
      });
    }

    // 4. Komponen bergerak elegan di latar belakang tiap section + parallax halus
    (function initLandingAmbientMotion() {
      var sections = document.querySelectorAll('main .section-band');
      if (!sections.length) return;

      var rand = function (min, max) {
        return min + Math.random() * (max - min);
      };

      var createShape = function (layer, className, size, leftPct, topPct, depth, wrapClass) {
        var wrap = document.createElement('div');
        wrap.className = 'ambient-shape-wrap' + (wrapClass ? ' ' + wrapClass : '');
        wrap.style.width = size + 'px';
        wrap.style.height = size + 'px';
        wrap.style.left = leftPct + '%';
        wrap.style.top = topPct + '%';

        var inner = document.createElement('i');
        inner.className = 'ambient-shape-inner ' + className;
        inner.style.setProperty('--del', (-rand(0, 18)).toFixed(1) + 's');
        inner.style.setProperty('--dur', rand(20, 30).toFixed(0) + 's');
        inner.style.setProperty('--rot', rand(-16, 16).toFixed(0) + 'deg');

        wrap.appendChild(inner);
        layer.appendChild(wrap);
        return { el: wrap, depth: depth, inner: inner };
      };

      var trackedBands = [];
      sections.forEach(function (sec) {
        var isDark = sec.classList.contains('is-navy');
        var layer = document.createElement('div');
        layer.className = 'ambient-layer ' + (isDark ? 'is-dark' : 'is-light');
        layer.setAttribute('aria-hidden', 'true');
        sec.prepend(layer);

        var shapes = [];
        if (isDark) {
          var glowWarm = createShape(layer, '', 420, rand(-8, 8), rand(-28, -10), 18, 'ambient-glow');
          glowWarm.inner.style.background = '#f59e0b';
          glowWarm.el.style.opacity = '0.14';

          var glowBlue = createShape(layer, '', 360, rand(64, 78), rand(46, 66), -16, 'ambient-glow');
          glowBlue.inner.style.background = '#3b82f6';
          glowBlue.el.style.opacity = '0.2';

          shapes.push(glowWarm, glowBlue);
        } else {
          var presets = [
            { cls: 'ambient-sq', size: 68, x: 4, y: 12, d: 14 },
            { cls: 'ambient-ci is-blue', size: 56, x: 89, y: 16, d: -16 },
            { cls: 'ambient-sq is-amber', size: 46, x: 7, y: 76, d: -12 },
            { cls: 'ambient-ring', size: 108, x: 87, y: 70, d: 18 }
          ];
          presets.forEach(function (p) {
            shapes.push(
              createShape(layer, p.cls, p.size, p.x + rand(-2, 2), p.y + rand(-3, 3), p.d, '')
            );
          });
        }

        trackedBands.push({ el: sec, shapes: shapes, visible: false });
      });

      if (prefersReduced) return;

      if ('IntersectionObserver' in window) {
        var bandObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var found = trackedBands.find(function (b) { return b.el === entry.target; });
            if (found) found.visible = entry.isIntersecting;
          });
        }, { rootMargin: '80px' });

        trackedBands.forEach(function (b) {
          bandObserver.observe(b.el);
        });
      }

      // Halus merespons kursor pada perangkat desktop
      if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
        var heroOrbits = document.querySelectorAll('.hero-orbit-ring');
        var mx = 0;
        var my = 0;
        var cx = 0;
        var cy = 0;
        var active = false;

        window.addEventListener('pointermove', function (e) {
          mx = e.clientX / window.innerWidth - 0.5;
          my = e.clientY / window.innerHeight - 0.5;
          if (!active) {
            active = true;
            requestAnimationFrame(tickParallax);
          }
        }, { passive: true });

        function tickParallax() {
          cx += (mx - cx) * 0.06;
          cy += (my - cy) * 0.06;

          trackedBands.forEach(function (band) {
            if (!band.visible) return;
            band.shapes.forEach(function (s) {
              s.el.style.transform = 'translate3d(' + (cx * s.depth).toFixed(1) + 'px, ' + (cy * s.depth).toFixed(1) + 'px, 0)';
            });
          });

          if (window.scrollY < window.innerHeight) {
            heroOrbits.forEach(function (orb, idx) {
              var factor = idx === 0 ? 22 : -26;
              orb.style.transform = 'translate3d(' + (cx * factor).toFixed(1) + 'px, ' + (cy * factor).toFixed(1) + 'px, 0)';
            });
          }

          if (Math.abs(mx - cx) > 0.002 || Math.abs(my - cy) > 0.002) {
            requestAnimationFrame(tickParallax);
          } else {
            active = false;
          }
        }

        // Efek tilt & levitasi halus terinterpolasi pada kartu pratinjau laporan audit
        var previewFrame = document.querySelector('.report-preview-frame');
        if (previewFrame) {
          var targetRx = 0;
          var targetRy = 0;
          var targetHoverY = 0;
          var curRx = 0;
          var curRy = 0;
          var curHoverY = 0;
          var isHovered = false;
          var frameVisible = false;
          var floatStart = performance.now();

          if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
              frameVisible = entries[0] && entries[0].isIntersecting;
            }, { rootMargin: '80px' }).observe(previewFrame);
          } else {
            frameVisible = true;
          }

          previewFrame.addEventListener('pointerenter', function () {
            isHovered = true;
            targetHoverY = -6;
          });

          previewFrame.addEventListener('pointermove', function (e) {
            var rect = previewFrame.getBoundingClientRect();
            var px = (e.clientX - rect.left) / rect.width - 0.5;
            var py = (e.clientY - rect.top) / rect.height - 0.5;
            targetRy = px * 7;
            targetRx = -py * 7;
            targetHoverY = -6;
          });

          previewFrame.addEventListener('pointerleave', function () {
            isHovered = false;
            targetRx = 0;
            targetRy = 0;
            targetHoverY = 0;
          });

          (function tickPreviewFloat(now) {
            if ((frameVisible || isHovered) && !previewFrame.classList.contains('rm-reveal')) {
              var idleWave = isHovered ? 0 : Math.sin((now - floatStart) * 0.0011) * 6;
              curRx += (targetRx - curRx) * 0.085;
              curRy += (targetRy - curRy) * 0.085;
              curHoverY += (targetHoverY - curHoverY) * 0.085;
              previewFrame.style.transform =
                'perspective(1000px) rotateX(' + curRx.toFixed(2) + 'deg) rotateY(' + curRy.toFixed(2) + 'deg) translate3d(0, ' + (curHoverY + idleWave).toFixed(2) + 'px, 0)';
            }
            requestAnimationFrame(tickPreviewFloat);
          })(floatStart);
        }
      }
    })();
  });
})();
