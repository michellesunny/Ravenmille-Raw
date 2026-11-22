/* ==========================================================================
   Ravenmille – Katalog Masalah & Estimasi Biaya Perbaikan Kendaraan
   Mengambil data dari Supabase (vehicle_issues) dengan fallback terstruktur.
   ========================================================================== */

(function () {
  'use strict';

  var FALLBACK_ISSUES = [
    {
      id: 'issue-avanza-racksteer',
      vehicleName: 'Toyota Avanza / Daihatsu Xenia (2015–2021)',
      category: 'Kaki-kaki & Kemudi',
      name: 'Bushing Rack Steer & Link Stabilizer Aus',
      km: '45.000 – 75.000 km',
      cost: 'Rp 750.000 – Rp 2.200.000',
      symptom: 'Muncul bunyi ketukan ("gluduk") di area roda depan saat melewati jalan bergelombang atau polisi tidur, serta setir terasa sedikit longgar.',
      solution: 'Ganti bushing rack steer berbahan teflon atau OEM, periksa boot rack steer agar tidak sobek, dan lakukan spooring ulang setelah perbaikan.',
      imageUrl: ''
    },
    {
      id: 'issue-hrv-cvt',
      vehicleName: 'Honda HR-V / Jazz / Mobilio CVT',
      category: 'Transmisi & Kopling',
      name: 'Getaran Halus & Slip Belt Transmisi CVT',
      km: '70.000 – 110.000 km',
      cost: 'Rp 1.800.000 – Rp 14.500.000',
      symptom: 'Tarikan awal terasa bergetar (judder) pada RPM rendah, atau putaran mesin melonjak tanpa akselerasi sepadan di tanjakan.',
      solution: 'Rutin ganti oli CVT khusus (HCF-2) setiap 20.000–30.000 km tanpa flushing tekanan tinggi. Jika belt sudah aus, wajib overhaul di bengkel spesialis matic.',
      imageUrl: ''
    },
    {
      id: 'issue-xpander-idle',
      vehicleName: 'Mitsubishi Xpander (2017–2021)',
      category: 'Mesin & Pendingin',
      name: 'Fuel Pump & Idle RPM Tidak Stabil',
      km: '40.000 – 80.000 km',
      cost: 'Rp 650.000 – Rp 2.500.000',
      symptom: 'Mesin tersendat saat berakselerasi atau sulit distarter ketika kondisi tangki panas. Terkadang putaran idle turun saat AC menyala.',
      solution: 'Pastikan unit telah menjalani kampanye penggantian fuel pump resmi, bersihkan throttle body, dan gunakan BBM sesuai oktan anjuran pabrikan.',
      imageUrl: ''
    },
    {
      id: 'issue-brio-ac',
      vehicleName: 'Honda Brio / Mobilio (2016–2022)',
      category: 'Kelistrikan & AC',
      name: 'Magnetic Clutch Kompresor AC & Extra Fan Lemah',
      km: '60.000 – 90.000 km',
      cost: 'Rp 1.200.000 – Rp 3.800.000',
      symptom: 'AC tiba-tiba tidak dingin saat macet di siang hari, namun kembali sejuk ketika mobil melaju kencang di jalan tol.',
      solution: 'Periksa celah magnetic clutch, ganti motor extra fan radiator jika putarannya melemah, dan bersihkan kondensor AC secara berkala.',
      imageUrl: ''
    },
    {
      id: 'issue-innova-injector',
      vehicleName: 'Toyota Kijang Innova Reborn 2.4 Diesel',
      category: 'Mesin & Pendingin',
      name: 'Penumpukan Kerak EGR & Injektor Commonrail',
      km: '60.000 – 100.000 km',
      cost: 'Rp 1.500.000 – Rp 6.500.000',
      symptom: 'Asap knalpot hitam pekat saat digas mendadak, tarikan terasa berat, dan konsumsi solar lebih boros dari standar.',
      solution: 'Bersihkan katup EGR dan intake manifold setiap 40.000 km, ganti filter solar tepat waktu, serta prioritaskan bahan bakar diesel rendah sulfur.',
      imageUrl: ''
    },
    {
      id: 'issue-rush-shock',
      vehicleName: 'Toyota Rush / Daihatsu Terios (2018–2023)',
      category: 'Kaki-kaki & Kemudi',
      name: 'Shockbreaker Belakang Lemah & Karet Support Retak',
      km: '50.000 – 85.000 km',
      cost: 'Rp 1.400.000 – Rp 3.200.000',
      symptom: 'Bagian belakang terasa memantul berlebihan saat bermuatan penuh dan terdengar decitan karet dari suspensi depan.',
      solution: 'Ganti sepasang shockbreaker belakang OEM atau aftermarket yang lebih stabil serta periksa kondisi karet support shock depan.',
      imageUrl: ''
    }
  ];

  var state = {
    issues: [],
    isLoading: true,
    searchQuery: '',
    selectedVehicle: 'Semua Model',
    selectedCategory: 'Semua Kategori'
  };

  function el(id) {
    return document.getElementById(id);
  }

  function inferCategory(issueName, symptom) {
    var text = ((issueName || '') + ' ' + (symptom || '')).toLowerCase();
    if (/cvt|matic|kopling|transmisi|gearbox/.test(text)) return 'Transmisi & Kopling';
    if (/rack|kaki|shock|bushing|stabilizer|rem|bearing|velg/.test(text)) return 'Kaki-kaki & Kemudi';
    if (/ac|kompresor|listrik|ecu|aki|sensor|fan|kabel|alternator/.test(text)) return 'Kelistrikan & AC';
    return 'Mesin & Pendingin';
  }

  function populateVehicleFilter() {
    var select = el('filter-model-masalah');
    if (!select) return;
    var models = [];
    state.issues.forEach(function (item) {
      if (item.vehicleName && models.indexOf(item.vehicleName) === -1) {
        models.push(item.vehicleName);
      }
    });
    select.innerHTML = '<option value="Semua Model">Semua Model Kendaraan</option>' +
      models.map(function (m) {
        var safe = window.RavenmilleUI.escapeHtml(m);
        return '<option value="' + safe + '">' + safe + '</option>';
      }).join('');
  }

  function renderIssues() {
    var grid = el('daftar-masalah-grid');
    if (!grid) return;
    var ui = window.RavenmilleUI;

    if (state.isLoading) {
      grid.innerHTML = '<div class="status-banner is-info" style="grid-column: 1 / -1;">Memuat katalog masalah kendaraan...</div>';
      return;
    }

    var query = state.searchQuery.trim().toLowerCase();
    var filtered = state.issues.filter(function (item) {
      var matchModel = state.selectedVehicle === 'Semua Model' || item.vehicleName === state.selectedVehicle;
      var matchCat = state.selectedCategory === 'Semua Kategori' || item.category === state.selectedCategory;
      var matchQuery = !query ||
        item.name.toLowerCase().indexOf(query) !== -1 ||
        item.vehicleName.toLowerCase().indexOf(query) !== -1 ||
        item.symptom.toLowerCase().indexOf(query) !== -1 ||
        item.solution.toLowerCase().indexOf(query) !== -1;
      return matchModel && matchCat && matchQuery;
    });

    el('masalah-jumlah-hasil').textContent = 'Menampilkan ' + filtered.length + ' dari ' + state.issues.length + ' kasus teknis';

    if (!filtered.length) {
      grid.innerHTML =
        '<div class="kartu-utama" style="grid-column: 1 / -1; text-align: center;">' +
          '<p style="font-weight: 700; color: #475569;">Tidak ada masalah kendaraan yang cocok dengan filter pencarian Anda.</p>' +
        '</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (item) {
      return (
        '<article class="kartu-utama masalah-card">' +
          (item.imageUrl
            ? '<div class="kendaraan-image-wrapper masalah-card-image">' +
                ui.renderKendaraanImage(item.imageUrl, 'Ilustrasi komponen ' + item.name, item.name) +
              '</div>'
            : '') +
          '<div class="masalah-card-body">' +
            '<div class="meta-row">' +
              '<span>' + ui.escapeHtml(item.vehicleName) + '</span>' +
              '<span aria-hidden="true">·</span>' +
              '<span>' + ui.escapeHtml(item.category) + '</span>' +
            '</div>' +
            '<h2 class="masalah-card-title">' + ui.escapeHtml(item.name) + '</h2>' +
            '<div class="masalah-specs-row tabular-nums">' +
              '<div><small>Titik KM Rawan</small><strong>' + ui.escapeHtml(item.km || 'Bervariasi') + '</strong></div>' +
              '<div><small>Estimasi Perbaikan</small><strong style="color: #be123c;">' + ui.escapeHtml(item.cost || 'Perlu cek bengkel') + '</strong></div>' +
            '</div>' +
            '<div class="masalah-detail-block">' +
              '<div><strong>Gejala Utama:</strong> <p>' + ui.escapeHtml(item.symptom || '-') + '</p></div>' +
              '<div><strong>Solusi &amp; Pencegahan:</strong> <p>' + ui.escapeHtml(item.solution || '-') + '</p></div>' +
            '</div>' +
            '<div class="masalah-card-footer">' +
              '<a href="bengkel-inspektor.html" class="btn btn-secondary btn-sm">Cari Bengkel Spesialis</a>' +
              '<a href="analisis-risiko.html" class="btn btn-primary btn-sm">Cek Risiko Unit</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  async function loadIssues() {
    var liveIssues = [];
    if (window.RAVENMILLE_SUPABASE) {
      try {
        var res = await window.RAVENMILLE_SUPABASE
          .from('vehicle_issues')
          .select('*, vehicles(name)')
          .order('created_at', { ascending: false });

        if (!res.error && res.data && res.data.length > 0) {
          liveIssues = res.data.map(function (row) {
            return {
              id: row.id,
              vehicleName: row.vehicles && row.vehicles.name ? row.vehicles.name : 'Model Umum',
              category: inferCategory(row.name, row.symptom),
              name: row.name,
              km: row.km || '-',
              cost: row.cost || '-',
              symptom: row.symptom || '-',
              solution: row.solution || '-',
              imageUrl: row.image_url || ''
            };
          });
        }
      } catch (e) {
        liveIssues = [];
      }
    }

    state.issues = liveIssues.concat(FALLBACK_ISSUES);
    state.isLoading = false;
    populateVehicleFilter();
    renderIssues();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var searchEl = el('cari-masalah-kendaraan');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.searchQuery = searchEl.value;
        renderIssues();
      });
    }

    var modelSelect = el('filter-model-masalah');
    if (modelSelect) {
      modelSelect.addEventListener('change', function () {
        state.selectedVehicle = modelSelect.value;
        renderIssues();
      });
    }

    document.querySelectorAll('[data-kategori-masalah]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.selectedCategory = btn.getAttribute('data-kategori-masalah');
        document.querySelectorAll('[data-kategori-masalah]').forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        renderIssues();
      });
    });

    renderIssues();
    loadIssues();
  });
})();
