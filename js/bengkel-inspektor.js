/* ==========================================================================
   Ravenmille – Direktori Bengkel Spesialis & Sewa Inspektor
   Menggabungkan data live Supabase (inspectors, workshops) dengan data kurasi.
   ========================================================================== */

(function () {
  'use strict';

  var BUILTIN_INSPECTORS = [
    {
      id: 'insp-1',
      name: 'Hendro Wibowo, S.T.',
      title: 'Senior Master Vehicle Inspector',
      city: 'Semarang',
      province: 'Jawa Tengah',
      phone: '6281234567801',
      rating: 4.95,
      inspections: 840,
      specialties: ['Struktur Sasis & Bekas Banjir', 'Kelistrikan ECU Modern', 'Diagnosa Transmisi AT/CVT'],
      tools: 'Digital Paint Depth Gauge, Launch X431 OBD Scanner, Borescope Kamera Mesin',
      price1: 'Rp 350.000',
      price2: 'Rp 550.000',
      availability: 'Setiap Hari (Semarang & Jateng)'
    },
    {
      id: 'insp-2',
      name: 'Rian Hidayat',
      title: 'Independent Diagnostic & CVT Specialist',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      phone: '6281234567802',
      rating: 4.9,
      inspections: 620,
      specialties: ['Transmisi CVT Honda & Nissan', 'Kelistrikan Komputer ECU', 'Inspeksi LCGC & Compact MPV'],
      tools: 'Launch X431 Pro Scanner, Digital Paint Meter, Compression Tester',
      price1: 'Rp 350.000',
      price2: 'Rp 550.000',
      availability: 'Setiap Hari (Jabodetabek)'
    },
    {
      id: 'insp-3',
      name: 'Agus Pratama, A.Md.T.',
      title: 'Body Structure & Undercarriage Inspector',
      city: 'Surabaya',
      province: 'Jawa Timur',
      phone: '6281234567803',
      rating: 4.88,
      inspections: 390,
      specialties: ['Kaki-kaki & Rack Steer', 'Diesel Ladder Frame', 'Chassis Alignment'],
      tools: 'Paint Depth Gauge, OBD2 Live Data Monitor, Thermal Camera',
      price1: 'Rp 300.000',
      price2: 'Rp 475.000',
      availability: 'Senin–Sabtu (Surabaya & Sidoarjo)'
    },
    {
      id: 'insp-4',
      name: 'Doni Saputra',
      title: 'Inspector & Automotive Appraiser',
      city: 'Bandung',
      province: 'Jawa Barat',
      phone: '6281234567804',
      rating: 4.92,
      inspections: 510,
      specialties: ['Cek Unit Pasca Tabrakan', 'Mesin Turbo & Hybrid', 'Deteksi Odometer Rollback'],
      tools: 'Thickness Meter Coating, Foxwell NT680 OBD Scanner, Battery Tester',
      price1: 'Rp 325.000',
      price2: 'Rp 500.000',
      availability: 'Setiap Hari (Bandung Raya)'
    },
    {
      id: 'insp-5',
      name: 'Bambang Triyono',
      title: 'Independent Technical Assessor',
      city: 'Yogyakarta',
      province: 'DI Yogyakarta',
      phone: '6281234567805',
      rating: 4.94,
      inspections: 430,
      specialties: ['Mobil Keluarga MPV & SUV', 'Transmisi Manual & AT', 'Inspeksi Karat Kolong'],
      tools: 'Micro-inspection Camera, Sound Level Meter, Paint Thickness Tester',
      price1: 'Rp 300.000',
      price2: 'Rp 450.000',
      availability: 'Setiap Hari (DIY & Sekitar)'
    }
  ];

  var BUILTIN_WORKSHOPS = [
    {
      id: 'ws-1',
      name: 'Bengkel Spesialis Dokter Mobil Semarang',
      category: 'Spesialis Tune Up, AC & Kaki-kaki',
      city: 'Semarang',
      address: 'Jl. Pamularsih Raya No. 45, Semarang Barat, Jawa Tengah',
      hours: '08:00 – 17:00 (Setiap Hari)',
      phone: '6281234567811',
      maps: 'https://maps.google.com/?q=Semarang',
      warranty: 'Garansi Servis 30 Hari / 1.000 km',
      services: ['Tune Up Injeksi', 'Overhaul Kaki-kaki', 'Kuras Oli Mesin & Transmisi', 'Scan Komputer OBD2']
    },
    {
      id: 'ws-2',
      name: 'Karya Prima Matic Transmisi Jakarta',
      category: 'Spesialis Transmisi Otomatis (AT / CVT / DCT)',
      city: 'Jakarta',
      address: 'Jl. Fatmawati Raya No. 88, Cilandak, Jakarta Selatan',
      hours: 'Senin–Sabtu: 08:30 – 17:00',
      phone: '6281234567812',
      maps: 'https://maps.google.com/?q=Jakarta',
      warranty: 'Garansi Overhaul Transmisi 6 Bulan',
      services: ['Flushing Matik Otomatis', 'Overhaul CVT & Valve Body', 'Kalibrasi TCM']
    },
    {
      id: 'ws-3',
      name: 'Sentral Kaki-kaki & Rack Steer Bandung',
      category: 'Spesialis Suspensi & Kemudi',
      city: 'Bandung',
      address: 'Jl. Soekarno Hatta No. 312, Bandung, Jawa Barat',
      hours: 'Senin–Sabtu: 08:00 – 17:00',
      phone: '6281234567813',
      maps: 'https://maps.google.com/?q=Bandung',
      warranty: 'Garansi Perbaikan Rack Steer 3 Bulan',
      services: ['Rekondisi Rack Steer EPS', 'Spooring & Balancing', 'Penggantian Bushing & Ball Joint']
    }
  ];

  var state = {
    activeTab: 'inspectors',
    selectedCity: 'Semua Kota',
    searchQuery: '',
    inspectors: BUILTIN_INSPECTORS.slice(),
    workshops: BUILTIN_WORKSHOPS.slice()
  };

  function el(id) {
    return document.getElementById(id);
  }

  function getCityList() {
    var base = ['Semua Kota', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang', 'Yogyakarta', 'Tangerang', 'Bekasi', 'Bali'];
    var list = state.activeTab === 'inspectors' ? state.inspectors : state.workshops;
    list.forEach(function (item) {
      if (item.city && base.indexOf(item.city) === -1) {
        base.push(item.city);
      }
    });
    return base;
  }

  function renderCityFilters() {
    var container = el('filter-kota-container');
    if (!container) return;
    var ui = window.RavenmilleUI;
    var cities = getCityList();

    container.innerHTML = cities.map(function (city) {
      var active = state.selectedCity === city;
      return '<button type="button" class="filter-btn' + (active ? ' is-active' : '') + '" data-kota="' + ui.escapeHtml(city) + '">' + ui.escapeHtml(city) + '</button>';
    }).join('');
  }

  function updateTabLabels() {
    el('tab-btn-inspektor').textContent = 'Inspektor (' + state.inspectors.length + ')';
    el('tab-btn-bengkel').textContent = 'Bengkel (' + state.workshops.length + ')';
  }

  function renderCards() {
    var container = el('direktori-cards-container');
    if (!container) return;
    var ui = window.RavenmilleUI;
    var query = state.searchQuery.trim().toLowerCase();

    if (state.activeTab === 'inspectors') {
      var filteredInsp = state.inspectors.filter(function (i) {
        var matchCity = state.selectedCity === 'Semua Kota' || (i.city || '').toLowerCase() === state.selectedCity.toLowerCase();
        var matchQuery = !query ||
          i.name.toLowerCase().indexOf(query) !== -1 ||
          (i.city || '').toLowerCase().indexOf(query) !== -1 ||
          (i.specialties || []).some(function (s) { return s.toLowerCase().indexOf(query) !== -1; });
        return matchCity && matchQuery;
      });

      if (!filteredInsp.length) {
        container.innerHTML = '<div class="kartu-utama" style="grid-column: 1 / -1; text-align: center;">Tidak ada inspektor yang cocok dengan filter pencarian.</div>';
        return;
      }

      container.innerHTML = filteredInsp.map(function (item) {
        var waMsg = encodeURIComponent(
          'Halo ' + item.name + ', saya mendapatkan kontak Anda melalui platform Ravenmille. Saya ingin menjadwalkan jasa inspeksi mobil bekas di area ' + (item.city || 'kota Anda') + '. Apakah Anda tersedia?'
        );
        var waUrl = 'https://wa.me/' + encodeURIComponent(item.phone || '') + '?text=' + waMsg;

        return (
          '<article class="kartu-utama direktori-card">' +
            '<div class="direktori-card-top">' +
              '<div class="direktori-profile-head">' +
                '<div class="direktori-avatar-frame">' +
                  ui.renderProfileAvatar(item.imageUrl, item.name, 'inspector') +
                '</div>' +
                '<div class="direktori-profile-meta">' +
                  '<div class="meta-kicker">Inspektor Independen</div>' +
                  '<h2 class="direktori-card-title">' + ui.escapeHtml(item.name) + '</h2>' +
                  '<p class="direktori-card-subtitle">' + ui.escapeHtml(item.title || 'Inspektor Kendaraan Bersertifikat') + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="direktori-meta-box">' +
                '<div class="direktori-lokasi">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
                  '<span>' + ui.escapeHtml((item.city || '-') + (item.province ? ', ' + item.province : '')) + '</span>' +
                '</div>' +
                (item.rating ? '<div class="meta-row tabular-nums"><span>Rating ' + item.rating + '/5</span><span aria-hidden="true">·</span><span>' + (item.inspections || 0) + '+ inspeksi</span></div>' : '') +
              '</div>' +
              '<div class="direktori-list-block">' +
                '<div class="direktori-block-label">Keahlian Utama</div>' +
                '<ul class="direktori-check-list">' +
                  (item.specialties || []).map(function (s) { return '<li>' + ui.escapeHtml(s) + '</li>'; }).join('') +
                '</ul>' +
              '</div>' +
              (item.tools ? '<div class="direktori-tools-block"><div class="direktori-block-label">Alat Ukur</div><p>' + ui.escapeHtml(item.tools) + '</p></div>' : '') +
              '<div class="direktori-pricing-row tabular-nums">' +
                '<div><small>Estimasi Biaya</small><strong>' + ui.escapeHtml(item.price1 || 'Konsultasi via WA') + (item.price2 ? ' – ' + ui.escapeHtml(item.price2) : '') + '</strong></div>' +
                '<div style="text-align: right;"><small>Ketersediaan</small><strong>' + ui.escapeHtml(item.availability || 'Sesuai Janji') + '</strong></div>' +
              '</div>' +
            '</div>' +
            '<div class="direktori-card-actions">' +
              '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="width: 100%;">Sewa via WhatsApp</a>' +
            '</div>' +
          '</article>'
        );
      }).join('');
    } else {
      var filteredWs = state.workshops.filter(function (w) {
        var matchCity = state.selectedCity === 'Semua Kota' || (w.city || '').toLowerCase() === state.selectedCity.toLowerCase();
        var matchQuery = !query ||
          w.name.toLowerCase().indexOf(query) !== -1 ||
          (w.city || '').toLowerCase().indexOf(query) !== -1 ||
          (w.services || []).some(function (s) { return s.toLowerCase().indexOf(query) !== -1; });
        return matchCity && matchQuery;
      });

      if (!filteredWs.length) {
        container.innerHTML = '<div class="kartu-utama" style="grid-column: 1 / -1; text-align: center;">Tidak ada bengkel yang cocok dengan filter pencarian.</div>';
        return;
      }

      container.innerHTML = filteredWs.map(function (w) {
        var waMsg = encodeURIComponent(
          'Halo Admin ' + w.name + ', saya melihat rekomendasi bengkel Anda di Ravenmille dan ingin konsultasi jadwal servis kendaraan. Terima kasih.'
        );
        var waUrl = 'https://wa.me/' + encodeURIComponent(w.phone || '') + '?text=' + waMsg;
        var mapsUrl = w.maps || ('https://maps.google.com/?q=' + encodeURIComponent((w.name || '') + ' ' + (w.city || '')));

        return (
          '<article class="kartu-utama direktori-card">' +
            '<div class="direktori-card-top">' +
              '<div class="direktori-profile-head">' +
                '<div class="direktori-avatar-frame">' +
                  ui.renderProfileAvatar(w.imageUrl, w.name, 'workshop') +
                '</div>' +
                '<div class="direktori-profile-meta">' +
                  '<div class="meta-kicker" style="color: #1d4ed8;">' + ui.escapeHtml(w.category || 'Bengkel Spesialis') + '</div>' +
                  '<h2 class="direktori-card-title">' + ui.escapeHtml(w.name) + '</h2>' +
                '</div>' +
              '</div>' +
              '<div class="direktori-meta-box">' +
                '<div class="direktori-lokasi">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>' +
                  '<span>' + ui.escapeHtml(w.address || w.city || '-') + '</span>' +
                '</div>' +
                (w.hours ? '<div class="meta-row"><span>Jam Buka: ' + ui.escapeHtml(w.hours) + '</span></div>' : '') +
              '</div>' +
              (w.warranty ? '<div class="status-banner is-success" style="padding: 8px 12px; font-size: 0.8rem;">' + ui.escapeHtml(w.warranty) + '</div>' : '') +
              '<div class="direktori-list-block">' +
                '<div class="direktori-block-label">Layanan Unggulan</div>' +
                '<ul class="direktori-check-list">' +
                  (w.services || []).map(function (s) { return '<li>' + ui.escapeHtml(s) + '</li>'; }).join('') +
                '</ul>' +
              '</div>' +
            '</div>' +
            '<div class="direktori-card-actions grid-2" style="gap: 10px;">' +
              '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm">WhatsApp</a>' +
              '<a href="' + ui.escapeHtml(mapsUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Lihat Peta</a>' +
            '</div>' +
          '</article>'
        );
      }).join('');
    }
  }

  async function loadFromSupabase() {
    if (!window.RAVENMILLE_SUPABASE) return;
    try {
      var inspRes = await window.RAVENMILLE_SUPABASE.from('inspectors').select('*').order('created_at', { ascending: false });
      if (!inspRes.error && inspRes.data && inspRes.data.length > 0) {
        var existingInspNames = state.inspectors.map(function (x) { return x.name.toLowerCase(); });
        var freshInsp = inspRes.data.filter(function (row) {
          return existingInspNames.indexOf((row.name || '').toLowerCase()) === -1;
        }).map(function (row) {
          return {
            id: row.id,
            name: row.name,
            title: row.title || 'Inspektor Independen Terdaftar',
            city: row.city || 'Indonesia',
            province: row.province || '',
            phone: row.phone || '',
            rating: row.rating || null,
            inspections: row.inspections || 0,
            specialties: Array.isArray(row.specialties) ? row.specialties : [],
            tools: row.tools || '',
            price1: row.price1 || 'Konsultasi via WA',
            price2: row.price2 || '',
            availability: row.availability || 'Hubungi via WhatsApp',
            imageUrl: row.image_url || row.avatar_url || row.photo_url || ''
          };
        });
        state.inspectors = freshInsp.concat(state.inspectors);
      }

      var wsRes = await window.RAVENMILLE_SUPABASE.from('workshops').select('*').order('created_at', { ascending: false });
      if (!wsRes.error && wsRes.data && wsRes.data.length > 0) {
        var existingWsNames = state.workshops.map(function (x) { return x.name.toLowerCase(); });
        var freshWs = wsRes.data.filter(function (row) {
          return existingWsNames.indexOf((row.name || '').toLowerCase()) === -1;
        }).map(function (row) {
          return {
            id: row.id,
            name: row.name,
            category: row.category || 'Bengkel Spesialis Rekanan',
            city: row.city || 'Indonesia',
            address: row.address || row.city || '',
            hours: row.hours || 'Hubungi admin bengkel',
            phone: row.phone || '',
            maps: row.maps || '',
            warranty: row.warranty || '',
            services: Array.isArray(row.services) ? row.services : [],
            imageUrl: row.image_url || row.avatar_url || row.photo_url || ''
          };
        });
        state.workshops = freshWs.concat(state.workshops);
      }
    } catch (e) {
      // Retain curated fallback if Supabase fails
    }

    updateTabLabels();
    renderCityFilters();
    renderCards();
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('tab-btn-inspektor').addEventListener('click', function () {
      state.activeTab = 'inspectors';
      el('tab-btn-inspektor').classList.add('is-active');
      el('tab-btn-bengkel').classList.remove('is-active');
      renderCityFilters();
      renderCards();
    });

    el('tab-btn-bengkel').addEventListener('click', function () {
      state.activeTab = 'workshops';
      el('tab-btn-bengkel').classList.add('is-active');
      el('tab-btn-inspektor').classList.remove('is-active');
      renderCityFilters();
      renderCards();
    });

    el('cari-direktori').addEventListener('input', function () {
      state.searchQuery = this.value;
      renderCards();
    });

    el('filter-kota-container').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-kota]');
      if (!btn) return;
      state.selectedCity = btn.getAttribute('data-kota');
      renderCityFilters();
      renderCards();
    });

    updateTabLabels();
    renderCityFilters();
    renderCards();
    loadFromSupabase();
  });
})();
