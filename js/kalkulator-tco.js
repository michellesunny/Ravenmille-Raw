/* ==========================================================================
   Ravenmille – Kalkulator Total Cost of Ownership (TCO)
   Mendukung data live dari Supabase + fallback katalog kendaraan Indonesia.
   ========================================================================== */

(function () {
  'use strict';

  var FALLBACK_VEHICLES = [
    {
      id: 'fallback-avanza',
      name: 'Toyota Avanza 1.5 G CVT',
      brand: 'Toyota',
      category: 'LMPV Populer',
      price: 276700000,
      fuelEff: 13.5,
      fuelPrice: 12950,
      kmYear: 15000,
      service: 3500000,
      insurance: 4800000,
      tax: 4200000,
      imageUrl: ''
    },
    {
      id: 'fallback-brio',
      name: 'Honda Brio Satya E CVT',
      brand: 'Honda',
      category: 'LCGC City Car',
      price: 198300000,
      fuelEff: 16.5,
      fuelPrice: 10000,
      kmYear: 15000,
      service: 2500000,
      insurance: 3500000,
      tax: 2950000,
      imageUrl: ''
    },
    {
      id: 'fallback-xpander',
      name: 'Mitsubishi Xpander Ultimate CVT',
      brand: 'Mitsubishi',
      category: 'LMPV Keluarga',
      price: 315900000,
      fuelEff: 12.0,
      fuelPrice: 12950,
      kmYear: 15000,
      service: 4100000,
      insurance: 5600000,
      tax: 4850000,
      imageUrl: ''
    },
    {
      id: 'fallback-zenix',
      name: 'Toyota Innova Zenix 2.0 V Hybrid',
      brand: 'Toyota',
      category: 'MPV Hybrid',
      price: 541750000,
      fuelEff: 17.5,
      fuelPrice: 12950,
      kmYear: 15000,
      service: 3900000,
      insurance: 7200000,
      tax: 7800000,
      imageUrl: ''
    },
    {
      id: 'fallback-hrv',
      name: 'Honda HR-V 1.5 SE CVT (Bekas 2022)',
      brand: 'Honda',
      category: 'Compact SUV',
      price: 325000000,
      fuelEff: 13.2,
      fuelPrice: 12950,
      kmYear: 15000,
      service: 4200000,
      insurance: 5400000,
      tax: 5100000,
      imageUrl: ''
    }
  ];

  var CUMULATIVE_DEPRECIATION = [0, 0.15, 0.245, 0.32, 0.39, 0.46];
  var COST_COMPONENTS = [
    { key: 'dep', label: 'Depresiasi Nilai', color: '#94A3B8' },
    { key: 'fuel', label: 'BBM / Energi', color: '#2563EB' },
    { key: 'svc', label: 'Servis & Sparepart', color: '#F59E0B' },
    { key: 'tax', label: 'Pajak (PKB)', color: '#059669' },
    { key: 'ins', label: 'Asuransi', color: '#7C3AED' },
    { key: 'int', label: 'Bunga Pembiayaan', color: '#E11D48' }
  ];

  var state = {
    currentStep: 1,
    periodYears: 3,
    vehicleList: [],
    selectedId: null,
    vehicleName: 'Toyota Avanza 1.5 G CVT',
    isAnalyzed: false,
    isLoading: true,
    searchQuery: '',
    reportCode: 'RVM-' + Math.floor(1000 + Math.random() * 9000),
    lastLoggedCode: '',
    lastModel: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function goToStep(stepNumber) {
    if (stepNumber === 3 && !state.isAnalyzed) return;
    state.currentStep = stepNumber;

    if (stepNumber === 3) {
      calculateAndRenderReport();
    }

    for (var i = 1; i <= 3; i++) {
      var panel = el('kalkulator-panel-' + i);
      if (panel) {
        panel.hidden = i !== stepNumber;
      }
    }

    document.querySelectorAll('.langkah-stepper-btn').forEach(function (btn) {
      var step = Number(btn.getAttribute('data-step'));
      btn.classList.toggle('is-active', step === stepNumber);
      btn.classList.toggle('is-done', step < stepNumber);
      var dot = btn.querySelector('.langkah-dot');
      if (dot) {
        dot.textContent = step < stepNumber ? '✓' : String(step);
      }
      if (step === 3) {
        btn.disabled = !state.isAnalyzed;
      }
    });

    document.querySelectorAll('.langkah-line').forEach(function (line, index) {
      line.classList.toggle('is-filled', stepNumber >= index + 2);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderVehicleCatalog() {
    var grid = el('katalog-kendaraan-rail');
    if (!grid) return;

    var ui = window.RavenmilleUI;
    var query = state.searchQuery.trim().toLowerCase();

    var customCard =
      '<article class="kendaraan-preset-card is-custom' + (state.selectedId === 'custom' ? ' is-selected' : '') + '" data-vehicle-id="custom" tabindex="0" role="button">' +
        '<div>' +
          '<div class="custom-plus-badge">+</div>' +
          '<div class="meta-kicker" style="color: #162447;">Input Bebas</div>' +
          '<h3 class="kendaraan-preset-title">Masukkan Kendaraan Sendiri</h3>' +
          '<p class="kendaraan-preset-desc">Ketik nama mobil atau motor pilihan Anda dan sesuaikan harga serta asumsi pemakaian secara manual.</p>' +
        '</div>' +
        '<span class="btn btn-secondary btn-sm" style="width: 100%;">Mulai Input Manual</span>' +
      '</article>';

    if (state.isLoading) {
      grid.innerHTML = customCard + '<div class="status-banner is-info" style="min-width: 260px; align-self: center;">Memuat katalog kendaraan...</div>';
      return;
    }

    var filtered = state.vehicleList.filter(function (v) {
      if (!query) return true;
      return (
        v.name.toLowerCase().indexOf(query) !== -1 ||
        (v.brand || '').toLowerCase().indexOf(query) !== -1 ||
        (v.category || '').toLowerCase().indexOf(query) !== -1
      );
    });

    var cardsHtml = filtered.map(function (v) {
      var isSelected = v.id === state.selectedId;
      return (
        '<article class="kendaraan-preset-card' + (isSelected ? ' is-selected' : '') + '" data-vehicle-id="' + ui.escapeHtml(v.id) + '" tabindex="0" role="button">' +
          '<div class="kendaraan-image-wrapper kendaraan-preset-thumb">' +
            ui.renderKendaraanImage(v.imageUrl, 'Kendaraan image ' + v.name, v.name) +
          '</div>' +
          '<div class="kendaraan-preset-body">' +
            '<div class="meta-row">' +
              '<span>' + ui.escapeHtml(v.category || 'Katalog') + '</span>' +
              '<span aria-hidden="true">·</span>' +
              '<span>' + v.fuelEff + ' km/L</span>' +
            '</div>' +
            '<h3 class="kendaraan-preset-title">' + ui.escapeHtml(v.name) + '</h3>' +
            '<p class="kendaraan-preset-price tabular-nums">' + ui.formatIDR(v.price) + '</p>' +
            '<span class="btn btn-primary btn-sm" style="width: 100%; margin-top: auto;">Pilih Unit</span>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    if (!filtered.length) {
      cardsHtml = '<div class="status-banner is-warning" style="min-width: 260px; align-self: center;">Tidak ada model yang cocok dengan pencarian Anda. Gunakan opsi Input Manual di samping.</div>';
    }

    grid.innerHTML = customCard + cardsHtml;
  }

  function selectVehicle(vehicleId) {
    state.selectedId = vehicleId;
    state.isAnalyzed = false;

    if (vehicleId === 'custom') {
      state.vehicleName = 'Kendaraan Kustom';
      el('input-nama-kendaraan').value = '';
      el('input-nama-kendaraan').placeholder = 'Contoh: Daihatsu Terios R AT 2020';
      el('langkah-2-judul').textContent = 'Parameter Kendaraan Kustom';
    } else {
      var found = state.vehicleList.find(function (v) { return v.id === vehicleId; });
      if (!found) return;
      state.vehicleName = found.name;
      el('input-nama-kendaraan').value = found.name;
      el('langkah-2-judul').textContent = 'Parameter: ' + found.name;
      el('input-harga-beli').value = found.price;
      el('input-efisiensi-bbm').value = found.fuelEff;
      el('input-harga-bbm').value = found.fuelPrice || 12950;
      el('input-jarak-tahunan').value = found.kmYear || 15000;
      el('input-biaya-servis').value = found.service;
      el('input-premi-asuransi').value = found.insurance;
      el('input-pajak-pkb').value = found.tax;
    }

    renderVehicleCatalog();
    goToStep(2);
  }

  async function loadVehicles() {
    if (window.RAVENMILLE_SUPABASE) {
      try {
        var res = await window.RAVENMILLE_SUPABASE
          .from('vehicles')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
          .order('created_at');

        if (!res.error && res.data && res.data.length > 0) {
          state.vehicleList = res.data.map(function (v) {
            return {
              id: v.id,
              name: v.name,
              brand: v.brand || '',
              category: v.category || 'Katalog',
              price: Number(v.price) || 0,
              fuelEff: Number(v.fuel_eff) || 12,
              fuelPrice: Number(v.fuel_price) || 12950,
              kmYear: Number(v.km_year) || 15000,
              service: Number(v.service) || 0,
              insurance: Number(v.insurance) || 0,
              tax: Number(v.tax) || 0,
              imageUrl: v.image_url || ''
            };
          });
        } else {
          state.vehicleList = FALLBACK_VEHICLES;
        }
      } catch (err) {
        state.vehicleList = FALLBACK_VEHICLES;
      }
    } else {
      state.vehicleList = FALLBACK_VEHICLES;
    }

    state.isLoading = false;
    renderVehicleCatalog();
  }

  function setPeriod(years) {
    state.periodYears = Number(years) || 3;
    document.querySelectorAll('.tombol-periode-tco').forEach(function (btn) {
      var active = Number(btn.getAttribute('data-period')) === state.periodYears;
      btn.classList.toggle('is-active', active);
    });
    if (state.currentStep === 3) {
      calculateAndRenderReport();
    }
  }

  function toggleCreditFields() {
    var isCredit = el('input-metode-bayar').value === 'kredit';
    el('kolom-uang-muka').hidden = !isCredit;
    el('kolom-bunga-kredit').hidden = !isCredit;
  }

  function autoEstimateOwnershipCosts() {
    var price = parseFloat(el('input-harga-beli').value) || 0;
    var kmYear = parseFloat(el('input-jarak-tahunan').value) || 15000;
    if (price <= 0) return;

    var njkb = Math.max(20000000, Math.round(price * 0.75));
    var pkb = Math.round(njkb * 0.02 + 143000);

    var insRate = 0.0208;
    if (price <= 125000000) insRate = 0.0326;
    else if (price <= 200000000) insRate = 0.0247;
    else if (price <= 400000000) insRate = 0.0208;
    else if (price <= 800000000) insRate = 0.0120;
    else insRate = 0.0105;

    var insurance = Math.round(price * insRate);
    var service = Math.max(1, Math.round(kmYear / 10000)) * 1800000;

    el('input-pajak-pkb').value = pkb;
    el('input-premi-asuransi').value = insurance;
    el('input-biaya-servis').value = service;
  }

  function readNumeric(id) {
    return parseFloat(el(id).value) || 0;
  }

  function computeTCOReport() {
    var N = state.periodYears;
    var price = readNumeric('input-harga-beli');
    var fuelEff = readNumeric('input-efisiensi-bbm');
    var fuelPrice = readNumeric('input-harga-bbm');
    var kmYear = readNumeric('input-jarak-tahunan');
    var serviceYear = readNumeric('input-biaya-servis');
    var insuranceYear = readNumeric('input-premi-asuransi');
    var taxYear = readNumeric('input-pajak-pkb');
    var isCredit = el('input-metode-bayar').value === 'kredit';
    var dpPct = Math.min(100, Math.max(0, readNumeric('input-uang-muka')));
    var ratePct = Math.max(0, readNumeric('input-bunga-kredit'));

    var annualInterest = isCredit ? price * (1 - dpPct / 100) * (ratePct / 100) : 0;
    var rows = [];
    var totals = { dep: 0, fuel: 0, svc: 0, tax: 0, ins: 0, int: 0, total: 0 };

    for (var y = 1; y <= N; y++) {
      var depYear = price * (CUMULATIVE_DEPRECIATION[y] - CUMULATIVE_DEPRECIATION[y - 1]);
      var fuelYear = (kmYear / (fuelEff || 1)) * fuelPrice;
      var rowTotal = depYear + fuelYear + serviceYear + taxYear + insuranceYear + annualInterest;
      var row = {
        year: y,
        odo: kmYear * y,
        dep: depYear,
        fuel: fuelYear,
        svc: serviceYear,
        tax: taxYear,
        ins: insuranceYear,
        int: annualInterest,
        resid: price * (1 - CUMULATIVE_DEPRECIATION[y]),
        total: rowTotal
      };
      COST_COMPONENTS.forEach(function (c) {
        totals[c.key] += row[c.key];
      });
      totals.total += rowTotal;
      rows.push(row);
    }

    return {
      N: N,
      price: price,
      kmYear: kmYear,
      isCredit: isCredit,
      dpPct: dpPct,
      rows: rows,
      totals: totals,
      residualValue: price * (1 - CUMULATIVE_DEPRECIATION[N])
    };
  }

  function calculateAndRenderReport() {
    var ui = window.RavenmilleUI;
    var inputName = el('input-nama-kendaraan').value.trim();
    if (inputName) {
      state.vehicleName = inputName;
    }

    var model = computeTCOReport();
    state.lastModel = model;
    var T = model.totals;
    var N = model.N;

    el('laporan-id').textContent = 'ID: ' + state.reportCode + '-' + N + 'Y';
    el('laporan-tanggal').textContent = ui.formatDateID(new Date().toISOString());
    el('laporan-subjudul').innerHTML =
      'Proyeksi Total Cost of Ownership ' + N + ' Tahun untuk <strong>' + ui.escapeHtml(state.vehicleName) + '</strong>';

    el('laporan-ringkasan-param').innerHTML =
      '<span>Harga: ' + ui.formatIDR(model.price) + '</span>' +
      '<span aria-hidden="true">·</span>' +
      '<span>Skema: ' + (model.isCredit ? 'Kredit ' + (N * 12) + ' Bulan (DP ' + model.dpPct + '%)' : 'Tunai Keras') + '</span>' +
      '<span aria-hidden="true">·</span>' +
      '<span>Jarak Tempuh: ' + model.kmYear.toLocaleString('id-ID') + ' km/tahun</span>';

    el('kpi-periode').textContent = N + ' Tahun';
    el('kpi-total-tco').textContent = ui.formatIDR(T.total);
    el('kpi-rasio-depresiasi').textContent = (T.total > 0 ? Math.round((T.dep / T.total) * 100) : 0) + '% dari total beban';
    el('kpi-beban-bulanan').textContent = ui.formatIDR(T.total / (N * 12));
    el('kpi-biaya-per-km').textContent = ui.formatIDR(T.total / Math.max(1, model.kmYear * N));
    el('kpi-total-km').textContent = (model.kmYear * N).toLocaleString('id-ID') + ' km total';
    el('kpi-nilai-sisa').textContent = ui.formatIDR(model.residualValue);
    el('kpi-retensi').textContent = 'Retensi ' + Math.round((1 - CUMULATIVE_DEPRECIATION[N]) * 100) + '% dari harga beli';

    // Donut SVG Chart
    var radius = 44;
    var circumference = 2 * Math.PI * radius;
    var offset = 0;
    var arcsHtml = COST_COMPONENTS.map(function (c) {
      var len = T.total > 0 ? (T[c.key] / T.total) * circumference : 0;
      var circle =
        '<circle cx="60" cy="60" r="' + radius + '" fill="none" stroke="' + c.color + '" stroke-width="18" ' +
        'stroke-dasharray="' + len + ' ' + Math.max(0, circumference - len) + '" ' +
        'stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 60 60)"/>';
      offset += len;
      return circle;
    }).join('');

    el('grafik-donut-komposisi').innerHTML =
      '<svg width="168" height="168" viewBox="0 0 120 120" role="img" aria-label="Grafik komposisi biaya TCO">' +
        '<circle cx="60" cy="60" r="' + radius + '" fill="none" stroke="#e2e8f0" stroke-width="18"/>' +
        arcsHtml +
        '<text x="60" y="55" text-anchor="middle" font-size="6.5" font-weight="800" fill="#64748b">TOTAL BIAYA</text>' +
        '<text x="60" y="68" text-anchor="middle" font-size="9.5" font-weight="900" fill="#162447">Rp ' + (T.total / 1e6).toFixed(1) + ' jt</text>' +
      '</svg>';

    el('legenda-komposisi').innerHTML = COST_COMPONENTS.map(function (c) {
      var pct = T.total > 0 ? ((T[c.key] / T.total) * 100).toFixed(1) : '0.0';
      return (
        '<div class="legenda-baris">' +
          '<span class="legenda-dot" style="background:' + c.color + '"></span>' +
          '<span>' + c.label + '</span>' +
          '<span class="tabular-nums">' + pct + '%</span>' +
          '<strong class="tabular-nums">' + ui.formatIDR(T[c.key]) + '</strong>' +
        '</div>'
      );
    }).join('');

    // Stacked Bar Chart
    var width = 420;
    var baseY = 166;
    var topPad = 28;
    var maxTotal = Math.max.apply(null, model.rows.map(function (r) { return r.total; })) || 1;
    var stepWidth = (width - 24) / N;
    var barWidth = Math.min(64, Math.max(32, stepWidth - 26));

    var gridLinesHtml = [0.25, 0.5, 0.75, 1].map(function (ratio) {
      var gy = baseY - ratio * (baseY - topPad);
      return '<line x1="8" x2="' + (width - 8) + '" y1="' + gy + '" y2="' + gy + '" stroke="#e2e8f0" stroke-dasharray="3 3"/>';
    }).join('');

    var barsHtml = model.rows.map(function (r, idx) {
      var x = 12 + stepWidth * idx + (stepWidth - barWidth) / 2;
      var y = baseY;
      var segs = ['fuel', 'svc', 'tax', 'ins', 'int', 'dep'].map(function (key) {
        var comp = COST_COMPONENTS.find(function (c) { return c.key === key; });
        var h = (r[key] / maxTotal) * (baseY - topPad);
        y -= h;
        return '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + h + '" fill="' + comp.color + '"/>';
      }).join('');
      var cx = x + barWidth / 2;
      var labelTopY = Math.max(12, y - 6);
      return (
        segs +
        '<text x="' + cx + '" y="' + labelTopY + '" text-anchor="middle" font-size="9" font-weight="800" fill="#162447">' + (r.total / 1e6).toFixed(1) + ' jt</text>' +
        '<text x="' + cx + '" y="' + (baseY + 16) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#162447">Thn ' + r.year + '</text>' +
        '<text x="' + cx + '" y="' + (baseY + 29) + '" text-anchor="middle" font-size="8.5" fill="#64748b">' + r.odo.toLocaleString('id-ID') + ' km</text>'
      );
    }).join('');

    el('grafik-batang-tahunan').innerHTML =
      '<svg width="420" height="206" viewBox="0 0 420 206" role="img" aria-label="Grafik tren beban biaya tahunan">' +
        gridLinesHtml +
        '<line x1="8" x2="' + (width - 8) + '" y1="' + baseY + '" y2="' + baseY + '" stroke="#94a3b8" stroke-width="1.5"/>' +
        barsHtml +
      '</svg>';

    el('legenda-batang').innerHTML = COST_COMPONENTS.map(function (c) {
      return '<span><i style="background:' + c.color + '"></i>' + c.label + '</span>';
    }).join('');

    // Projection Table
    var fmtNum = function (val) { return Math.round(val).toLocaleString('id-ID'); };
    var headers = ['Periode', 'Odometer', 'Bunga', 'Pajak (PKB)', 'Asuransi', 'BBM / Energi', 'Servis', 'Depresiasi', 'Total Beban', 'Nilai Sisa Aset'];
    var tableHtml =
      '<thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody>' +
        model.rows.map(function (r) {
          return (
            '<tr>' +
              '<td>Tahun ke-' + r.year + '</td>' +
              '<td>' + r.odo.toLocaleString('id-ID') + ' km</td>' +
              '<td>' + fmtNum(r.int) + '</td>' +
              '<td>' + fmtNum(r.tax) + '</td>' +
              '<td>' + fmtNum(r.ins) + '</td>' +
              '<td>' + fmtNum(r.fuel) + '</td>' +
              '<td>' + fmtNum(r.svc) + '</td>' +
              '<td>' + fmtNum(r.dep) + '</td>' +
              '<td class="is-highlight">' + fmtNum(r.total) + '</td>' +
              '<td>' + fmtNum(r.resid) + '</td>' +
            '</tr>'
          );
        }).join('') +
        '<tr class="is-total">' +
          '<td>Total Akumulasi</td>' +
          '<td>' + (model.kmYear * N).toLocaleString('id-ID') + ' km</td>' +
          '<td>' + fmtNum(T.int) + '</td>' +
          '<td>' + fmtNum(T.tax) + '</td>' +
          '<td>' + fmtNum(T.ins) + '</td>' +
          '<td>' + fmtNum(T.fuel) + '</td>' +
          '<td>' + fmtNum(T.svc) + '</td>' +
          '<td>' + fmtNum(T.dep) + '</td>' +
          '<td class="is-highlight">' + fmtNum(T.total) + '</td>' +
          '<td>' + fmtNum(model.residualValue) + '</td>' +
        '</tr>' +
      '</tbody>';
    el('tabel-proyeksi-tahunan').innerHTML = tableHtml;

    var logKey = state.reportCode + '-' + N + 'Y';
    if (state.lastLoggedCode !== logKey && typeof window.ravenmilleSafeInsert === 'function') {
      state.lastLoggedCode = logKey;
      window.ravenmilleSafeInsert('tco_simulations', {
        report_code: logKey,
        vehicle_name: state.vehicleName,
        price: Math.round(model.price),
        period_years: N,
        payment_method: model.isCredit ? 'kredit' : 'tunai',
        km_per_year: Math.round(model.kmYear),
        total_tco: Math.round(T.total),
        monthly_cost: Math.round(T.total / (N * 12))
      });
    }
  }

  function validateAndAnalyze() {
    var priceEl = el('input-harga-beli');
    var fuelEffEl = el('input-efisiensi-bbm');
    var errorBanner = el('kalkulator-form-error');

    priceEl.classList.remove('is-invalid');
    fuelEffEl.classList.remove('is-invalid');
    errorBanner.hidden = true;

    var price = readNumeric('input-harga-beli');
    var fuelEff = readNumeric('input-efisiensi-bbm');

    if (price <= 0) {
      priceEl.classList.add('is-invalid');
      priceEl.focus();
      errorBanner.textContent = 'Harga beli kendaraan harus lebih besar dari Rp 0.';
      errorBanner.hidden = false;
      return;
    }
    if (fuelEff <= 0) {
      fuelEffEl.classList.add('is-invalid');
      fuelEffEl.focus();
      errorBanner.textContent = 'Konsumsi BBM atau efisiensi energi harus lebih besar dari 0.';
      errorBanner.hidden = false;
      return;
    }

    state.isAnalyzed = true;
    state.reportCode = 'RVM-' + Math.floor(1000 + Math.random() * 9000);
    goToStep(3);
  }

  function copyReportSummary() {
    if (!state.lastModel) return;
    var m = state.lastModel;
    var T = m.totals;
    var ui = window.RavenmilleUI;
    var summary =
      'Ravenmille – Laporan TCO ' + m.N + ' Tahun\n' +
      'Kendaraan: ' + state.vehicleName + '\n' +
      'Total TCO: ' + ui.formatIDR(T.total) + '\n' +
      'Beban per Bulan: ' + ui.formatIDR(T.total / (m.N * 12)) + '\n' +
      'Biaya per Km: ' + ui.formatIDR(T.total / Math.max(1, m.kmYear * m.N)) + '\n' +
      'Estimasi Sisa Nilai Jual: ' + ui.formatIDR(m.residualValue);

    var btn = el('btn-salin-ringkasan');
    var originalLabel = btn.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(function () {
        btn.textContent = 'Ringkasan Tersalin';
        setTimeout(function () { btn.textContent = originalLabel; }, 2000);
      }).catch(function () {
        btn.textContent = 'Gagal Menyalin';
        setTimeout(function () { btn.textContent = originalLabel; }, 2000);
      });
    }
  }

  function downloadCSV() {
    if (!state.lastModel) return;
    var m = state.lastModel;
    var quote = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var headers = ['Periode', 'Odometer (km)', 'Bunga', 'Pajak', 'Asuransi', 'BBM', 'Servis', 'Depresiasi', 'Total Beban', 'Nilai Sisa Aset'];
    var lines = [headers.map(quote).join(',')];

    m.rows.forEach(function (r) {
      lines.push([
        quote('Tahun ke-' + r.year), r.odo, Math.round(r.int), Math.round(r.tax), Math.round(r.ins),
        Math.round(r.fuel), Math.round(r.svc), Math.round(r.dep), Math.round(r.total), Math.round(r.resid)
      ].join(','));
    });

    lines.push([
      quote('Total'), m.kmYear * m.N, Math.round(m.totals.int), Math.round(m.totals.tax), Math.round(m.totals.ins),
      Math.round(m.totals.fuel), Math.round(m.totals.svc), Math.round(m.totals.dep), Math.round(m.totals.total), Math.round(m.residualValue)
    ].join(','));

    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ravenmille-tco-' + m.N + 'tahun.csv';
    link.click();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.langkah-stepper-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToStep(Number(btn.getAttribute('data-step')));
      });
    });

    document.querySelectorAll('[data-go-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToStep(Number(btn.getAttribute('data-go-step')));
      });
    });

    document.querySelectorAll('.tombol-periode-tco').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setPeriod(Number(btn.getAttribute('data-period')));
      });
    });

    var searchInput = el('cari-kendaraan-katalog');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.searchQuery = searchInput.value;
        renderVehicleCatalog();
      });
    }

    var rail = el('katalog-kendaraan-rail');
    if (rail) {
      rail.addEventListener('click', function (e) {
        var card = e.target.closest('[data-vehicle-id]');
        if (card) selectVehicle(card.getAttribute('data-vehicle-id'));
      });
      rail.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var card = e.target.closest('[data-vehicle-id]');
          if (card) {
            e.preventDefault();
            selectVehicle(card.getAttribute('data-vehicle-id'));
          }
        }
      });
    }

    if (el('rail-btn-prev')) {
      el('rail-btn-prev').addEventListener('click', function () {
        el('katalog-kendaraan-rail').scrollBy({ left: -280, behavior: 'smooth' });
      });
    }
    if (el('rail-btn-next')) {
      el('rail-btn-next').addEventListener('click', function () {
        el('katalog-kendaraan-rail').scrollBy({ left: 280, behavior: 'smooth' });
      });
    }

    if (el('input-metode-bayar')) {
      el('input-metode-bayar').addEventListener('change', toggleCreditFields);
    }
    if (el('btn-estimasi-otomatis')) {
      el('btn-estimasi-otomatis').addEventListener('click', autoEstimateOwnershipCosts);
    }
    if (el('btn-analisis-tco')) {
      el('btn-analisis-tco').addEventListener('click', validateAndAnalyze);
    }
    if (el('btn-salin-ringkasan')) {
      el('btn-salin-ringkasan').addEventListener('click', copyReportSummary);
    }
    if (el('btn-unduh-csv')) {
      el('btn-unduh-csv').addEventListener('click', downloadCSV);
    }
    if (el('btn-cetak-pdf')) {
      el('btn-cetak-pdf').addEventListener('click', function () {
        window.print();
      });
    }

    toggleCreditFields();
    renderVehicleCatalog();
    loadVehicles();
  });
})();
