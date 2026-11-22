/* Ravenmille JavaScript
 * Client-side interactions for kalkulator.html, risiko.html,
 * komparasi.html and hasil-komparasi.html.
 * No server/database is used. Currency values are estimates based on user input.
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const money = (n) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(Number.isFinite(n) ? n : 0);
  const num = (id, fallback = 0) => {
    const el = $(id);
    const n = el ? Number(el.value) : fallback;
    return Number.isFinite(n) ? n : fallback;
  };
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const store = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* Results still render when browser storage is disabled. */ }
  };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  };

  // TCO calculator
  let tcoPeriod = 3;
  const presets = {
    avanza: {name:'TOYOTA AVANZA 1.5 G CVT', price:275000000, fuel:13.5, service:3500000, insurance:4800000, tax:4200000},
    brio: {name:'HONDA BRIO SATYA E CVT', price:190000000, fuel:16, service:2500000, insurance:3300000, tax:2800000},
    xpander: {name:'MITSUBISHI XPANDER ULTIMATE', price:315000000, fuel:12, service:4200000, insurance:5500000, tax:4800000},
    custom: {name:'KENDARAAN KUSTOM', price:num('inp-price', 275000000), fuel:num('inp-fuel-eff',13.5), service:num('inp-service',3500000), insurance:num('inp-insurance',4800000), tax:num('inp-tax',4200000)}
  };
  window.selectPreset = function (key) {
    const p = presets[key] || presets.custom;
    if (key !== 'custom') {
      if ($('inp-price')) $('inp-price').value = p.price;
      if ($('inp-fuel-eff')) $('inp-fuel-eff').value = p.fuel;
      if ($('inp-service')) $('inp-service').value = p.service;
      if ($('inp-insurance')) $('inp-insurance').value = p.insurance;
      if ($('inp-tax')) $('inp-tax').value = p.tax;
      if ($('step2-title')) $('step2-title').textContent = 'PARAMETER KENDARAAN: ' + p.name;
    }
    if ($('step2-section')) $('step2-section').scrollIntoView({behavior:'smooth', block:'start'});
  };
  window.setPeriod = function (years) {
    tcoPeriod = Number(years) || 3;
    document.querySelectorAll('.period-btn').forEach(btn => {
      const active = Number(btn.dataset.period) === tcoPeriod;
      btn.className = 'period-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-black uppercase border-2 border-[#162447] ' +
        (active ? 'bg-[#162447] text-white shadow-[2px_2px_0px_#94A3B8]' : 'bg-white text-[#162447]');
    });
    if ($('res-total')) window.calculateTCO();
  };
  window.toggleCreditInputs = function () {
    const cash = $('inp-method') && $('inp-method').value === 'tunai';
    if ($('col-dp')) $('col-dp').style.display = cash ? 'none' : '';
  };
  window.calculateTCO = function () {
    const price = Math.max(0, num('inp-price'));
    const fuelEff = num('inp-fuel-eff');
    const fuelPrice = Math.max(0, num('inp-fuel-price'));
    const kmYear = Math.max(0, num('inp-km-year'));
    const serviceYear = Math.max(0, num('inp-service'));
    const insuranceYear = Math.max(0, num('inp-insurance'));
    const taxYear = Math.max(0, num('inp-tax'));
    if (price <= 0 || fuelEff <= 0) {
      alert('Masukkan harga kendaraan dan konsumsi BBM yang lebih besar dari 0.');
      return;
    }
    const years = tcoPeriod;
    const fuel = (kmYear / fuelEff) * fuelPrice * years;
    const service = serviceYear * years;
    const insurance = insuranceYear * years;
    const tax = taxYear * years;
    // Depreciation is a transparent planning assumption, not a market appraisal.
    const residualRate = years === 1 ? 0.85 : years === 3 ? 0.70 : 0.55;
    const depreciation = price * (1 - residualRate);
    // Simplified credit estimate: 8% flat annual interest on financed amount.
    // Cash: no financing interest; credit: estimate down payment and flat interest.
    const method = $('inp-method') ? $('inp-method').value : 'kredit';
    const dpPct = Math.min(100, Math.max(0, num('inp-dp',20))) / 100;
    const financed = method === 'tunai' ? 0 : price * (1-dpPct);
    const interest = method === 'tunai' ? 0 : financed * 0.08 * years;
    const total = fuel + service + insurance + tax + depreciation + interest;
    text('res-total', money(total));
    text('res-monthly', money(total / (years*12)));
    text('res-perkm', money(total / Math.max(1, kmYear*years)));
    text('res-depreciation', money(depreciation));
    text('res-fuel', money(fuel));
    text('res-service', money(service));
    text('res-tax', money(tax));
    text('res-insurance', money(insurance));
    if ($('results-section')) $('results-section').scrollIntoView({behavior:'smooth',block:'start'});
  };

  // Rule-based vehicle risk estimator
  window.runRiskAnalysis = function () {
    const name = ($('risk-name')?.value || '').trim();
    const year = num('risk-year');
    const km = num('risk-km');
    const service = $('risk-service')?.value || 'tidak_lengkap';
    const incident = $('risk-incident')?.value || 'bebas';
    const currentYear = new Date().getFullYear();
    if (!name || year < 1995 || year > currentYear || km < 0) {
      alert('Periksa kembali nama kendaraan, tahun perakitan, dan odometer.');
      return;
    }
    const age = currentYear - year;
    const kmPerYear = km / Math.max(1, age);
    let score = 0;
    const factors = [];
    if (age >= 12) { score += 20; factors.push('Usia kendaraan sudah ≥12 tahun; periksa korosi, seal, dan komponen aus.'); }
    else if (age >= 8) { score += 12; factors.push('Usia kendaraan 8–11 tahun; periksa komponen yang menua dan riwayat perawatan.'); }
    else if (age >= 5) { score += 6; factors.push('Usia kendaraan 5–7 tahun; periksa kondisi sesuai umur dan pemakaian.'); }
    if (kmPerYear < 3000 && age >= 4) { score += 20; factors.push('Odometer relatif rendah untuk usia kendaraan; cocokkan dengan faktur servis, catatan inspeksi, dan kondisi interior.'); }
    else if (kmPerYear > 25000) { score += 12; factors.push('Pemakaian tahunan tinggi; periksa mesin, transmisi, suspensi, dan komponen aus.'); }
    else { factors.push('Angka odometer saja tidak dapat membuktikan keaslian; cocokkan dengan bukti servis dan kondisi fisik.'); }
    const servicePoints = {resmi_lengkap:0, spesialis_rutin:5, tidak_lengkap:15, hilang:25};
    score += servicePoints[service] ?? 15;
    if (service === 'resmi_lengkap') factors.push('Riwayat servis dilaporkan lengkap; verifikasi faktur dan catatan ke bengkel terkait.');
    if (service === 'spesialis_rutin') factors.push('Riwayat bengkel spesialis perlu dicocokkan dengan faktur dan interval servis.');
    if (service === 'tidak_lengkap') factors.push('Catatan servis tidak lengkap; kondisi dan riwayat perawatan perlu diverifikasi lebih lanjut.');
    if (service === 'hilang') factors.push('Tidak ada riwayat servis; minta inspeksi menyeluruh sebelum mengambil keputusan.');
    const incidentPoints = {bebas:0, minor:8, sasis:30, banjir:35};
    score += incidentPoints[incident] ?? 10;
    if (incident === 'minor') factors.push('Penjual menyebut insiden minor; periksa keselarasan panel, cat, dan titik perbaikan.');
    if (incident === 'sasis') factors.push('Ada riwayat perbaikan sasis/rangka; wajib diperiksa oleh inspektor independen sebelum membeli.');
    if (incident === 'banjir') factors.push('Ada riwayat banjir/genangan tinggi; periksa ECU, konektor, karat tersembunyi, dan kelistrikan.');
    if (incident === 'bebas') factors.push('Klaim bebas tabrak/banjir belum merupakan bukti; lakukan pemeriksaan fisik independen.');
    score = Math.min(100, score);
    const level = score >= 60 ? 'RISIKO TINGGI' : score >= 30 ? 'RISIKO SEDANG' : 'RISIKO AWAL RENDAH';
    text('res-unit-name', name);
    text('res-score', String(score));
    text('res-badge', level);
    text('res-score-desc', score >= 60 ? 'Diperlukan verifikasi ketat sebelum pembelian.' : score >= 30 ? 'Periksa faktor risiko dan dokumen pendukung.' : 'Skor awal relatif rendah, tetapi bukan jaminan kendaraan bebas masalah.');
    text('res-kmyear', Math.round(kmPerYear).toLocaleString('id-ID') + ' km/tahun');
    const list = $('res-factors');
    if (list) list.innerHTML = factors.map(f => '<li class="mb-2">' + escapeHtml(f) + '</li>').join('');
    if ($('risk-placeholder')) $('risk-placeholder').classList.add('hidden');
    if ($('risk-result')) $('risk-result').classList.remove('hidden');
    if ($('risk-result')) $('risk-result').scrollIntoView({behavior:'smooth',block:'start'});
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  // Comparison page -> result page. Shared assumptions shown in page copy:
  // 13,300 IDR/litre and 15,000 km/year. Fuel price and distance are fixed.
  let comparisonPeriod = 3;
  window.setCompPeriod = function (years) {
    comparisonPeriod = Number(years) || 3;
    document.querySelectorAll('.comp-period-btn').forEach(btn => {
      const active = Number(btn.dataset.p) === comparisonPeriod;
      btn.className = 'comp-period-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-black uppercase border-2 border-[#162447] ' +
        (active ? 'bg-[#162447] text-white shadow-[2px_2px_0px_#94A3B8]' : 'bg-white text-[#162447]');
    });
  };
  function vehicle(prefix) {
    return {
      name: ($(`${prefix}-name`)?.value || `Kendaraan ${prefix}`).trim(),
      price: Math.max(0, num(`${prefix}-price`)),
      fuelEff: num(`${prefix}-fuel-eff`),
      service: Math.max(0, num(`${prefix}-service`)),
      tax: Math.max(0, num(`${prefix}-tax`)),
      insurance: Math.max(0, num(`${prefix}-insurance`))
    };
  }
  window.submitComparisonAndNavigate = function () {
    const a = vehicle('v1'), b = vehicle('v2');
    if (!a.name || !b.name || a.price <= 0 || b.price <= 0 || a.fuelEff <= 0 || b.fuelEff <= 0) {
      alert('Lengkapi nama, harga, dan konsumsi BBM kedua kendaraan dengan nilai yang valid.');
      return;
    }
    const years = comparisonPeriod;
    const calculate = v => {
      const fuel = (15000 / v.fuelEff) * 13300 * years;
      const service = v.service * years, tax = v.tax * years, insurance = v.insurance * years;
      const depRate = years === 1 ? .15 : years === 3 ? .30 : .45;
      const depreciation = v.price * depRate;
      return {...v, fuel, service, tax, insurance, depreciation, total: fuel+service+tax+insurance+depreciation};
    };
    store('ravenmilleComparison', {a:calculate(a), b:calculate(b), years});
    window.location.href = 'hasil-komparasi.html';
  };

  // Render saved comparison result page
  function renderComparisonResult() {
    if (!$('verdict-title')) return;
    const data = read('ravenmilleComparison', null);
    if (!data) {
      text('verdict-title', 'DATA KOMPARASI BELUM TERSEDIA');
      text('verdict-desc', 'Kembali ke halaman Komparasi, masukkan data dua kendaraan, lalu tekan tombol analisis.');
      return;
    }
    const {a,b,years} = data;
    const diff = (x,y) => x-y;
    const lower = a.total <= b.total ? a : b;
    text('verdict-title', `${lower.name.toUpperCase()} LEBIH HEMAT`);
    text('verdict-desc', `Berdasarkan asumsi biaya yang dimasukkan untuk ${years} tahun. Hasil ini estimasi, bukan penawaran atau prediksi harga jual. Selisih total: ${money(Math.abs(a.total-b.total))}.`);
    text('card-monthly-save', money(Math.abs(a.total-b.total)/(years*12)));
    text('card-monthly-desc', `${lower.name} memiliki estimasi biaya bulanan lebih rendah.`);
    text('card-fuel-save', money(Math.abs(a.fuel-b.fuel)));
    text('card-fuel-desc', `Selisih estimasi biaya BBM selama ${years} tahun.`);
    text('card-dep-diff', money(Math.abs(a.depreciation-b.depreciation)));
    text('card-dep-desc', `Selisih asumsi depresiasi selama ${years} tahun.`);
    text('matrix-period-badge', `${years} TAHUN`);
    text('th-v1-name', a.name); text('th-v2-name', b.name);
    const rows = [
      ['price',a.price,b.price,'m-v1-price','m-v2-price','m-diff-price'],
      ['dep',a.depreciation,b.depreciation,'m-v1-dep','m-v2-dep','m-diff-dep'],
      ['fuel',a.fuel,b.fuel,'m-v1-fuel','m-v2-fuel','m-diff-fuel'],
      ['service',a.service,b.service,'m-v1-service','m-v2-service','m-diff-service'],
      ['tax',a.tax,b.tax,'m-v1-tax','m-v2-tax','m-diff-tax'],
      ['insurance',a.insurance,b.insurance,'m-v1-ins','m-v2-ins','m-diff-ins'],
      ['total',a.total,b.total,'m-v1-total','m-v2-total','m-diff-total']
    ];
    rows.forEach(r => { text(r[3],money(r[1])); text(r[4],money(r[2])); text(r[5],money(Math.abs(r[1]-r[2]))); });
    text('m-v1-month',money(a.total/(years*12))); text('m-v2-month',money(b.total/(years*12)));
    text('m-diff-month',money(Math.abs(a.total-b.total)/(years*12)));
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.toggleCreditInputs();
    if ($('results-section')) window.calculateTCO();
    renderComparisonResult();
  });
})();