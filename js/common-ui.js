/* ==========================================================================
   Ravenmille – Utilitas UI & Navigasi Bersama
   ========================================================================== */

(function () {
  'use strict';

  window.RavenmilleUI = {
    escapeHtml: function (str) {
      return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[ch];
      });
    },

    formatIDR: function (value) {
      var num = Math.round(Math.abs(Number(value) || 0));
      return 'Rp ' + num.toLocaleString('id-ID');
    },

    formatSignedIDR: function (value) {
      var n = Math.round(Number(value) || 0);
      var prefix = n < 0 ? '-Rp ' : 'Rp ';
      return prefix + Math.abs(n).toLocaleString('id-ID');
    },

    formatDateID: function (isoString) {
      try {
        return new Date(isoString).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        return '';
      }
    },

    renderKendaraanImage: function (imageUrl, altText, fallbackLabel) {
      var safeAlt = window.RavenmilleUI.escapeHtml(altText || 'Kendaraan image');
      var safeLabel = window.RavenmilleUI.escapeHtml(fallbackLabel || 'Kendaraan');
      if (!imageUrl) {
        return (
          '<div class="kendaraan-image-fallback">' +
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>' +
              '<circle cx="7" cy="17" r="2"/>' +
              '<circle cx="17" cy="17" r="2"/>' +
            '</svg>' +
            '<span>' + safeLabel + '</span>' +
          '</div>'
        );
      }
      var safeUrl = window.RavenmilleUI.escapeHtml(imageUrl);
      return (
        '<img class="kendaraan-image" src="' + safeUrl + '" alt="' + safeAlt + '" loading="lazy" referrerpolicy="no-referrer" ' +
        'onerror="this.parentElement.innerHTML=\'<div class=\\\'kendaraan-image-fallback\\\'><span>' + safeLabel + '</span></div>\'">'
      );
    },

    getInitials: function (name) {
      var words = String(name || 'RM')
        .replace(/,.*$/, '')
        .trim()
        .split(/\s+/)
        .filter(function (w) { return w && !/^(bengkel|spesialis|pt|cv)$/i.test(w); });
      if (!words.length) return 'RM';
      if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
      return (words[0][0] + words[1][0]).toUpperCase();
    },

    renderProfileAvatar: function (imageUrl, name, type) {
      var ui = window.RavenmilleUI;
      var safeName = ui.escapeHtml(name || 'Profil');
      var initials = ui.escapeHtml(ui.getInitials(name));
      var isWorkshop = type === 'workshop';
      var roleClass = isWorkshop ? ' is-workshop' : '';

      var svgIcon = isWorkshop
        ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

      var fallbackHtml =
        '<div class="direktori-avatar-fallback' + roleClass + '" title="' + safeName + '" aria-label="Foto profil ' + safeName + '">' +
          '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;">' +
            svgIcon +
            '<span style="font-size:0.65rem; font-weight:900; letter-spacing:0.06em; line-height:1;">' + initials + '</span>' +
          '</div>' +
        '</div>';

      if (!imageUrl) {
        return fallbackHtml;
      }

      var safeUrl = ui.escapeHtml(imageUrl);
      return (
        '<img class="direktori-avatar-img" src="' + safeUrl + '" alt="Foto profil ' + safeName + '" loading="lazy" referrerpolicy="no-referrer" ' +
        'onerror="this.style.display=\'none\'; if(this.nextElementSibling){this.nextElementSibling.style.display=\'grid\';}">' +
        '<div class="direktori-avatar-fallback' + roleClass + '" style="display:none;" aria-hidden="true"><span>' + initials + '</span></div>'
      );
    }
  };

  function initScrollProgressBar() {
    var scrollBar = document.getElementById('scroll-progress-bar');
    if (!scrollBar && document.body) {
      scrollBar = document.createElement('div');
      scrollBar.id = 'scroll-progress-bar';
      scrollBar.setAttribute('aria-hidden', 'true');
      document.body.prepend(scrollBar);
    }
    if (!scrollBar || scrollBar.getAttribute('data-rm-bound') === '1') return;
    scrollBar.setAttribute('data-rm-bound', '1');

    var updateProgress = function () {
      var docEl = document.documentElement;
      var maxScroll = docEl.scrollHeight - window.innerHeight;
      var ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      scrollBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  function initScrollReveal() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    document.documentElement.classList.add('rm-anim-ready');

    // Hero section staggered entrance on landing page
    var heroInner = document.querySelector('.hero-inner');
    if (heroInner) {
      Array.prototype.forEach.call(heroInner.children, function (child, idx) {
        child.style.setProperty('--rm-delay', Math.min(idx, 5) * 95 + 'ms');
        child.classList.add('rm-hero-enter');
      });
    }

    var SELECTOR = [
      '.section-header-block',
      '.fitur-card',
      '.step-card-dark',
      '.report-preview-split > *',
      '.proof-header-row',
      '.faq-item',
      '.langkah-stepper',
      '.kartu-utama',
      '.kartu-gelap',
      '.kartu-sekunder',
      '.masalah-card',
      '.direktori-card',
      '.berita-card',
      '.checklist-card',
      '.kendaraan-preset-card',
      '.laporan-kpi-hero',
      '.laporan-kpi-box',
      '.faktor-risiko-item',
      '.komparasi-bar-item',
      '.admin-list-item',
      '.footer-grid > *',
      '.footer-bottom'
    ].join(', ');

    var STAGGER_STEP_MS = 85;
    var MAX_STAGGER_ITEMS = 6;

    function revealNow(el, delayMs) {
      if (!el || !el.classList.contains('rm-reveal') || el.classList.contains('is-visible')) return;
      if (typeof delayMs === 'number' && delayMs > 0) {
        el.style.setProperty('--rm-delay', delayMs + 'ms');
      } else {
        delayMs = parseInt(el.style.getPropertyValue('--rm-delay'), 10) || 0;
      }

      el.classList.add('is-visible');

      setTimeout(function () {
        el.classList.remove('rm-reveal', 'is-visible', 'is-from-left', 'is-from-right');
        el.style.removeProperty('--rm-delay');
        el.setAttribute('data-rm-done', '1');
      }, 900 + delayMs);
    }

    var observer = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        var visibleBatch = [];
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visibleBatch.push(entry.target);
            observer.unobserve(entry.target);
          }
        });

        visibleBatch.forEach(function (target, idx) {
          var presetDelay = parseInt(target.style.getPropertyValue('--rm-delay'), 10);
          var delay = !isNaN(presetDelay) ? presetDelay : Math.min(idx, MAX_STAGGER_ITEMS) * STAGGER_STEP_MS;
          revealNow(target, delay);
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -36px 0px'
      });
    }

    function isHiddenOrInsideHidden(el) {
      if (!el || !el.closest) return true;
      return Boolean(el.closest('[hidden]')) || el.offsetParent === null;
    }

    function hasUnrevealedAncestor(el) {
      var parent = el.parentElement;
      while (parent && parent !== document.body) {
        if (parent.classList && parent.classList.contains('rm-reveal')) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    }

    function registerTargets(rootNode) {
      var scope = rootNode && rootNode.querySelectorAll ? rootNode : document;
      var candidates = [];

      if (rootNode && rootNode.matches && rootNode.matches(SELECTOR)) {
        candidates.push(rootNode);
      }
      scope.querySelectorAll(SELECTOR).forEach(function (node) {
        candidates.push(node);
      });

      if (!candidates.length) return;

      var toObserve = [];
      var inViewBatch = [];
      var viewportLimit = window.innerHeight * 0.96;

      candidates.forEach(function (el) {
        if (
          el.getAttribute('data-rm-done') === '1' ||
          el.classList.contains('rm-reveal') ||
          el.closest('.hero-section') ||
          isHiddenOrInsideHidden(el) ||
          hasUnrevealedAncestor(el)
        ) {
          return;
        }

        // Directional touch for report showcase split on desktop
        if (el.parentElement && el.parentElement.classList.contains('report-preview-split')) {
          el.classList.add(el.nextElementSibling ? 'is-from-left' : 'is-from-right');
        }

        el.classList.add('rm-reveal');

        // Stagger siblings inside grids & lists
        var parent = el.parentElement;
        if (parent) {
          var siblingIndex = 0;
          var siblings = parent.children;
          for (var s = 0; s < siblings.length; s++) {
            if (siblings[s] === el) break;
            if (siblings[s].matches && siblings[s].matches(SELECTOR)) siblingIndex++;
          }
          var staggerMs = Math.min(siblingIndex, MAX_STAGGER_ITEMS) * STAGGER_STEP_MS;
          if (staggerMs > 0) {
            el.style.setProperty('--rm-delay', staggerMs + 'ms');
          }
        }

        var rect = el.getBoundingClientRect();
        if (rect.top <= viewportLimit && rect.bottom >= 0) {
          inViewBatch.push(el);
        } else if (rect.bottom < 0) {
          // Already above scroll position on initial/anchor load
          inViewBatch.push(el);
        } else {
          toObserve.push(el);
        }
      });

      if (inViewBatch.length) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            inViewBatch.forEach(function (el, idx) {
              var delay = parseInt(el.style.getPropertyValue('--rm-delay'), 10);
              revealNow(el, !isNaN(delay) ? delay : Math.min(idx, MAX_STAGGER_ITEMS) * STAGGER_STEP_MS);
            });
          });
        });
      }

      if (observer) {
        toObserve.forEach(function (el) {
          observer.observe(el);
        });
      } else {
        toObserve.forEach(function (el) {
          revealNow(el, 0);
        });
      }
    }

    // Fast-scroll & resize safety net: ensure elements scrolled into or past viewport never stay hidden
    var scrollCheckPending = false;
    function checkRemainingVisible() {
      if (scrollCheckPending) return;
      scrollCheckPending = true;
      requestAnimationFrame(function () {
        scrollCheckPending = false;
        var limit = window.innerHeight * 0.96;
        var remaining = document.querySelectorAll('.rm-reveal:not(.is-visible)');
        remaining.forEach(function (el) {
          if (isHiddenOrInsideHidden(el)) return;
          var rect = el.getBoundingClientRect();
          if (rect.top <= limit) {
            if (observer) observer.unobserve(el);
            revealNow(el, parseInt(el.style.getPropertyValue('--rm-delay'), 10) || 0);
          }
        });
      });
    }
    window.addEventListener('scroll', checkRemainingVisible, { passive: true });
    window.addEventListener('resize', checkRemainingVisible, { passive: true });

    // Initial scan across entire page
    registerTargets(document);

    // Watch for dynamic content (Supabase fetches, filters, tabs, wizard steps)
    if ('MutationObserver' in window && document.body) {
      var scanScheduled = false;
      var mutObserver = new MutationObserver(function (mutations) {
        var needsScan = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'attributes' && m.attributeName === 'hidden' && !m.target.hasAttribute('hidden')) {
            needsScan = true;
            break;
          }
          if (m.type === 'childList' && m.addedNodes && m.addedNodes.length > 0) {
            for (var j = 0; j < m.addedNodes.length; j++) {
              if (m.addedNodes[j].nodeType === 1 && m.addedNodes[j].id !== 'scroll-progress-bar') {
                needsScan = true;
                break;
              }
            }
          }
          if (needsScan) break;
        }
        if (needsScan && !scanScheduled) {
          scanScheduled = true;
          requestAnimationFrame(function () {
            scanScheduled = false;
            registerTargets(document);
          });
        }
      });
      mutObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden']
      });
    }
  }

  function initInertiaScroll() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasFinePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
    if (prefersReduced || !hasFinePointer) return;

    document.documentElement.classList.add('rm-inertia-scroll');

    var currentY = window.scrollY || 0;
    var targetY = currentY;
    var lastProgrammaticY = currentY;
    var rafId = null;
    var lastTime = 0;
    var DAMPING = 9.5;

    function getMaxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function canScrollVertically(el, deltaY) {
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.nodeType === 1) {
          var style = window.getComputedStyle(el);
          var overflowY = style.overflowY;
          if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
            if (deltaY < 0 && el.scrollTop > 0) return true;
            if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    }

    function stopAnimation() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTime = 0;
    }

    function step(now) {
      if (!lastTime) lastTime = now;
      var dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      var maxScroll = getMaxScroll();
      if (targetY < 0) targetY = 0;
      if (targetY > maxScroll) targetY = maxScroll;

      var diff = targetY - currentY;
      if (Math.abs(diff) < 0.4) {
        currentY = targetY;
        lastProgrammaticY = Math.round(currentY);
        window.scrollTo({ top: lastProgrammaticY, left: window.scrollX, behavior: 'instant' });
        stopAnimation();
        return;
      }

      var alpha = 1 - Math.exp(-DAMPING * dt);
      currentY += diff * alpha;
      lastProgrammaticY = currentY;
      window.scrollTo({ top: currentY, left: window.scrollX, behavior: 'instant' });
      rafId = requestAnimationFrame(step);
    }

    function startGlideTo(nextTarget) {
      var maxScroll = getMaxScroll();
      if (rafId === null) {
        currentY = window.scrollY || 0;
      }
      targetY = Math.max(0, Math.min(maxScroll, nextTarget));
      if (rafId === null) {
        lastTime = 0;
        rafId = requestAnimationFrame(step);
      }
    }

    window.addEventListener('wheel', function (e) {
      // Abaikan pinch-zoom trackpad (ctrlKey/metaKey), shift-scroll, atau scroll horizontal
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!e.deltaY) return;
      if (canScrollVertically(e.target, e.deltaY)) return;

      e.preventDefault();

      var delta = e.deltaY;
      if (e.deltaMode === 1) {
        delta *= 22;
      } else if (e.deltaMode === 2) {
        delta *= window.innerHeight * 0.85;
      }

      if (rafId === null) {
        currentY = window.scrollY || 0;
        targetY = currentY;
      }

      startGlideTo(targetY + delta);
    }, { passive: false });

    // Sinkronkan saat user menarik scrollbar, menekan tombol panah/Space, atau navigasi halaman
    window.addEventListener('scroll', function () {
      var actualY = window.scrollY || 0;
      if (rafId === null || Math.abs(actualY - lastProgrammaticY) > 6) {
        stopAnimation();
        currentY = actualY;
        targetY = actualY;
        lastProgrammaticY = actualY;
      }
    }, { passive: true });

    // Gunakan transisi inersia yang sama saat klik tautan anchor (#tentang, #faq, Kembali ke atas)
    document.addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;

      if (href === '#') {
        e.preventDefault();
        startGlideTo(0);
        return;
      }

      var targetEl = document.getElementById(href.slice(1));
      if (targetEl) {
        e.preventDefault();
        var header = document.querySelector('.site-header');
        var offset = header ? header.offsetHeight + 12 : 16;
        var destY = targetEl.getBoundingClientRect().top + (window.scrollY || 0) - offset;
        startGlideTo(destY);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var menuButton = document.getElementById('mobile-menu-toggle');
    var mobileDrawer = document.getElementById('mobile-nav-drawer');

    if (menuButton && mobileDrawer) {
      menuButton.addEventListener('click', function () {
        var expanded = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!expanded));
        mobileDrawer.classList.toggle('is-open', !expanded);
      });
    }

    initInertiaScroll();
    initScrollProgressBar();
    initScrollReveal();
  });
})();
