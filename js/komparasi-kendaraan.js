/* ==========================================================================
   Ravenmille – Komparasi Finansial Multi-Kendaraan
   ========================================================================== */

(function () {
  'use strict';

  var BUILTIN_PRESETS = [
    { id: 'avanza-15-g-cvt', name: 'Toyota Avanza 1.5 G CVT', price: 276700000, condition: 'baru', fuelType: 'ron92', fuelEff: 13.5 },
    { id: 'xpander-ultimate-cvt', name: 'Mitsubishi Xpander Ultimate CVT', price: 315900000, condition: 'baru', fuelType: 'ron92', fuelEff: 12.0 },
    { id: 'brio-satya-e-cvt', name: 'Honda Brio Satya E CVT', price: 198300000, condition: 'baru', fuelType: 'ron90', fuelEff: 16.5 },
    { id: 'honda-wr-v-rs', name: 'Honda WR-V 1.5 RS Sensing', price: 324100000, condition: 'baru', fuelType: 'ron92', fuelEff: 13.0 },
    { id: 'wuling-binguo-ev', name: 'Wuling BinguoEV 410km Premium', price: 372000000, condition: 'baru', fuelType: 'listrik', fuelEff: 8.2 },
    { id: 'innova-zenix-hybrid', name: 'Toyota Innova Zenix 2.0 V Hybrid', price: 541750000, condition: 'baru', fuelType: 'ron92', fuelEff: 17.5 },
    { id: 'avanza-veloz-2018', name: 'Toyota Avanza Veloz 1.5 AT 2018 (Bekas)', price: 165000000, condition: 'bekas', fuelType: 'ron90', fuelEff: 11.5 },
    { id: 'innova-reborn-diesel', name: 'Toyota Innova Reborn 2.4 V Diesel 2019 (Bekas)', price: 345000000, condition: 'bekas', fuelType: 'solar_dex', fuelEff: 12.8 }
  ];

  var COMPARISON_PAIRS = {
    'avanza-vs-xpander': ['avanza-15-g-cvt', 'xpander-ultimate-cvt'],
    'brio-vs-wrv': ['brio-satya-e-cvt', 'honda-wr-v-rs'],
    'zenix-vs-reborn': ['innova-zenix-hybrid', 'innova-reborn-diesel'],
    'binguo-vs-wrv': ['wuling-binguo-ev', 'honda-wr-v-rs']
  };

  var FUEL_PRICES = {
    ron90: 10000,
    ron92: 12950,
    solar_dex: 13900,
    listrik: 2000
  };

  var state = {
    periodYears: 3,
    presets: BUILTIN_PRESETS.slice(),
    slots: {
      kandidat1: { condition: 'baru' },
      kandidat2: { condition: 'baru' }
    }
  };

  function el(id) {
    return document.getElementById(id);
  }

  function numVal(id) {
    return parseFloat(el(id).value) || 0;
  }

  function estimateAnnualCosts(slotKey) {
    var price = numVal(slotKey + '-harga');
    var fuelType = el(slotKey + '-bbm-jenis').value;
    var kmYear = numVal(slotKey + '-jarak') || 15000;
    var cond = state.slots[slotKey].condition;
    var isEV = fuelType === 'listrik';

    var njkb = Math.max(20000000, Math.round(price * 0.75));
    var estTax = isEV ? 0 : Math.round(njkb * 0.02 + 143000);

    var insRate = 0.0208;
    if (price <= 125000000) insRate = 0.0326;
    else if (price <= 200000000) insRate = 0.0247;
    else if (price <= 400000000) insRate = 0.0208;
    else if (price <= 800000000) insRate = 0.0120;
    else insRate = 0.0105;

    var estIns = Math.round(price * insRate);
    var baseService = Math.max(1, Math.round(kmYear / 10000)) * 1800000;
    var estService = Math.round(baseService * (cond === 'bekas' ? 1.25 : 1.0) * (isEV ? 0.35 : 1.0));

    el(slotKey + '-pajak').value = estTax;
    el(slotKey + '-asuransi').value = estIns;
    el(slotKey + '-servis').value = estService;
  }

  function setCondition(slotKey, condition) {
    state.slots[slotKey].condition = condition;
    var btnBaru = el(slotKey + '-kondisi-baru');
    var btnBekas = el(slotKey + '-kondisi-bekas');
    btnBaru.classList.toggle('is-active', condition === 'baru');
    btnBekas.classList.toggle('is-active', condition === 'bekas');
    estimateAnnualCosts(slotKey);
    updateSummary();
  }

  function toggleCreditFields(slotKey) {
    var isCredit = el(slotKey + '-pembayaran').value === 'kredit';
    var creditRow = el(slotKey + '-baris-kredit');
    if (creditRow) {
      creditRow.hidden = !isCredit;
    }
    updateSummary();
  }

  function updateFuelLabel(slotKey) {
    var isEV = el(slotKey + '-bbm-jenis').value === 'listrik';
    el(slotKey + '-label-efisiensi').textContent = isEV ? 'Efisiensi Energi (km/kWh)' : 'Konsumsi BBM (km/liter)';
  }

  function populatePresetSelects() {
    ['kandidat1', 'kandidat2'].forEach(function (slotKey) {
      var select = el(slotKey + '-preset');
      if (!select) return;
      var currentVal = select.value;
      select.innerHTML = '<option value="">Pilih model acuan...</option>';
      state.presets.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
      });
      if (currentVal) select.value = currentVal;
    });
  }

  function applyPresetToSlot(slotKey, presetId) {
    var preset = state.presets.find(function (p) { return p.id === presetId; });
    if (!preset) return;

    el(slotKey + '-nama').value = preset.name;
    el(slotKey + '-harga').value = preset.price;
    el(slotKey + '-bbm-jenis').value = preset.fuelType || 'ron92';
    el(slotKey + '-efisiensi').value = preset.fuelEff || 12;
    el(slotKey + '-pembayaran').value = 'kredit';

    updateFuelLabel(slotKey);
    toggleCreditFields(slotKey);
    setCondition(slotKey, preset.condition || 'baru');

    if (preset.service !== undefined) el(slotKey + '-servis').value = preset.service;
    if (preset.tax !== undefined) el(slotKey + '-pajak').value = preset.tax;
    if (preset.insurance !== undefined) el(slotKey + '-asuransi').value = preset.insurance;
    updateSummary();
  }

  function collectSlotData(slotKey, fallbackName) {
    var fuelType = el(slotKey + '-bbm-jenis').value;
    var paymentMethod = el(slotKey + '-pembayaran').value;
    return {
      name: (el(slotKey + '-nama').value || '').trim() || fallbackName,
      price: numVal(slotKey + '-harga'),
      condition: state.slots[slotKey].condition,
      paymentMethod: paymentMethod,
      dpPct: paymentMethod === 'kredit' ? numVal(slotKey + '-dp') : 100,
      creditRatePct: paymentMethod === 'kredit' ? numVal(slotKey + '-bunga') : 0,
      fuelType: fuelType,
      fuelPrice: FUEL_PRICES[fuelType] || 12950,
      fuelEff: Math.max(0.1, numVal(slotKey + '-efisiensi')),
      kmYear: Math.max(1000, numVal(slotKey + '-jarak')),
      service: numVal(slotKey + '-servis'),
      tax: numVal(slotKey + '-pajak'),
      insurance: numVal(slotKey + '-asuransi')
    };
  }

  function quickComputeTotal(slotData, periodYears) {
    var depRate = periodYears === 1 ? 0.15 : (periodYears === 3 ? 0.32 : 0.46);
    var dep = slotData.price * depRate;
    var fuel = (slotData.kmYear / slotData.fuelEff) * slotData.fuelPrice * periodYears;
    var interest = slotData.paymentMethod === 'kredit'
      ? slotData.price * (1 - slotData.dpPct / 100) * (slotData.creditRatePct / 100) * periodYears
      : 0;
    return dep + fuel + (slotData.service + slotData.tax + slotData.insurance) * periodYears + interest;
  }

  function updateSummary() {
    var ui = window.RavenmilleUI;
    var v1 = collectSlotData('kandidat1', 'Kendaraan A');
    var v2 = collectSlotData('kandidat2', 'Kendaraan B');
    var t1 = quickComputeTotal(v1, state.periodYears);
    var t2 = quickComputeTotal(v2, state.periodYears);
    var diff = Math.abs(t1 - t2);
    var cheaper = t1 <= t2 ? v1.name : v2.name;

    el('komparasi-ringkasan-teks').textContent =
      v1.name + ' vs ' + v2.name + ' · Periode ' + state.periodYears + ' Tahun · Estimasi awal: ' +
      cheaper + ' lebih hemat sekitar ' + ui.formatIDR(diff) + '.';
  }

  function submitComparison() {
    var errorBanner = el('komparasi-error-banner');
    errorBanner.hidden = true;

    var v1 = collectSlotData('kandidat1', 'Kendaraan A');
    var v2 = collectSlotData('kandidat2', 'Kendaraan B');

    if (v1.price <= 0 || v2.price <= 0) {
      errorBanner.textContent = 'Pastikan harga beli OTR untuk kedua kandidat kendaraan lebih besar dari Rp 0.';
      errorBanner.hidden = false;
      return;
    }

    var payload = {
      period: state.periodYears,
      v1: v1,
      v2: v2
    };

    try {
      localStorage.setItem('ravenmille_komparasi_data', JSON.stringify(payload));
    } catch (e) {
      // Fallback via query string if storage fails
    }

    if (typeof window.ravenmilleSafeInsert === 'function') {
      Promise.race([
        window.ravenmilleSafeInsert('comparison_logs', {
          period_years: state.periodYears,
          vehicle_a_name: v1.name,
          vehicle_a_price: Math.round(v1.price),
          vehicle_b_name: v2.name,
          vehicle_b_price: Math.round(v2.price)
        }),
        new Promise(function (resolve) { setTimeout(resolve, 250); })
      ]).then(function () {
        window.location.href = 'hasil-komparasi.html';
      });
      return;
    }

    window.location.href = 'hasil-komparasi.html';
  }

  async function mergeSupabasePresets() {
    if (!window.RAVENMILLE_SUPABASE) return;
    try {
      var res = await window.RAVENMILLE_SUPABASE
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (!res.error && res.data && res.data.length > 0) {
        var existingNames = state.presets.map(function (p) { return p.name.toLowerCase(); });
        res.data.forEach(function (v) {
          if (existingNames.indexOf(v.name.toLowerCase()) === -1) {
            state.presets.unshift({
              id: 'sb-' + v.id,
              name: v.name,
              price: Number(v.price) || 250000000,
              condition: 'baru',
              fuelType: 'ron92',
              fuelEff: Number(v.fuel_eff) || 12,
              service: Number(v.service),
              tax: Number(v.tax),
              insurance: Number(v.insurance)
            });
          }
        });
        populatePresetSelects();
      }
    } catch (e) {
      // Keep built-in presets on error
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    populatePresetSelects();
    el('kandidat1-preset').value = 'avanza-15-g-cvt';
    el('kandidat2-preset').value = 'xpander-ultimate-cvt';
    applyPresetToSlot('kandidat1', 'avanza-15-g-cvt');
    applyPresetToSlot('kandidat2', 'xpander-ultimate-cvt');

    document.querySelectorAll('.tombol-periode-komparasi').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.periodYears = Number(btn.getAttribute('data-period')) || 3;
        document.querySelectorAll('.tombol-periode-komparasi').forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        updateSummary();
      });
    });

    document.querySelectorAll('[data-duel-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pair = COMPARISON_PAIRS[btn.getAttribute('data-duel-preset')];
        if (!pair) return;
        el('kandidat1-preset').value = pair[0];
        el('kandidat2-preset').value = pair[1];
        applyPresetToSlot('kandidat1', pair[0]);
        applyPresetToSlot('kandidat2', pair[1]);
      });
    });

    ['kandidat1', 'kandidat2'].forEach(function (slotKey) {
      el(slotKey + '-preset').addEventListener('change', function () {
        if (this.value) applyPresetToSlot(slotKey, this.value);
      });
      el(slotKey + '-kondisi-baru').addEventListener('click', function () { setCondition(slotKey, 'baru'); });
      el(slotKey + '-kondisi-bekas').addEventListener('click', function () { setCondition(slotKey, 'bekas'); });
      el(slotKey + '-pembayaran').addEventListener('change', function () { toggleCreditFields(slotKey); });
      el(slotKey + '-bbm-jenis').addEventListener('change', function () {
        updateFuelLabel(slotKey);
        estimateAnnualCosts(slotKey);
        updateSummary();
      });
      el(slotKey + '-harga').addEventListener('input', function () {
        estimateAnnualCosts(slotKey);
        updateSummary();
      });
      el(slotKey + '-jarak').addEventListener('input', function () {
        estimateAnnualCosts(slotKey);
        updateSummary();
      });
      [slotKey + '-nama', slotKey + '-efisiensi', slotKey + '-servis', slotKey + '-pajak', slotKey + '-asuransi', slotKey + '-dp', slotKey + '-bunga'].forEach(function (fieldId) {
        var node = el(fieldId);
        if (node) node.addEventListener('input', updateSummary);
      });
    });

    el('btn-proses-komparasi').addEventListener('click', submitComparison);
    mergeSupabasePresets();
  });
})();
