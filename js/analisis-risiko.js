/* ==========================================================================
   Ravenmille – Analisis Risiko & Checklist Inspeksi Mobil Bekas
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY_CHECKLIST = 'ravenmille_risiko_checklist_v2';
  var state = {
    hasAnalyzed: false,
    checklistFilter: 'all',
    checkedItems: {},
    supabaseVehicles: [],
    supabaseIssues: [],
    lastLoggedKey: ''
  };

  function el(id) {
    return document.getElementById(id);
  }

  function loadCheckedItems() {
    try {
      state.checkedItems = JSON.parse(localStorage.getItem(STORAGE_KEY_CHECKLIST) || '{}') || {};
    } catch (e) {
      state.checkedItems = {};
    }
  }

  function saveCheckedItems() {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKLIST, JSON.stringify(state.checkedItems));
    } catch (e) {
      // Ignore storage failures
    }
  }

  function populateYearOptions() {
    var select = el('risiko-tahun');
    if (!select) return;
    var currentYear = new Date().getFullYear();
    var html = '';
    for (var i = 0; i < 25; i++) {
      var year = currentYear - i;
      var age = currentYear - year;
      html += '<option value="' + year + '"' + (year === 2018 ? ' selected' : '') + '>' + year + ' (Usia ' + age + ' Tahun)</option>';
    }
    select.innerHTML = html;
  }

  function getFormValues() {
    return {
      vehicleName: (el('risiko-model').value || '').trim(),
      vehicleYear: parseInt(el('risiko-tahun').value, 10) || 2018,
      odometerKm: parseFloat(el('risiko-odometer').value) || 0,
      transmission: el('risiko-transmisi').value,
      bodyType: el('risiko-bodi').value,
      serviceHistory: el('risiko-servis').value,
      incidentHistory: el('risiko-insiden').value
    };
  }

  function evaluateRisk(input) {
    var currentYear = new Date().getFullYear();
    var age = Math.max(0, currentYear - input.vehicleYear);
    var km = input.odometerKm;
    var kmPerYear = age > 0 ? Math.round(km / age) : km;

    var score = 15;
    var factors = [];
    var suspiciousOdometer = false;

    if (age >= 8 || km >= 120000) {
      score += 30;
      factors.push({
        title: 'Usia Kendaraan / Jarak Tempuh Tinggi',
        category: 'Mesin & Kaki-kaki',
        severity: 'high',
        desc: 'Unit berusia ' + age + ' tahun dengan jarak tempuh ' + km.toLocaleString('id-ID') + ' km. Komponen slow-moving seperti radiator, engine mounting, dan bushing kaki-kaki memasuki masa peremajaan.',
        cost: 'Rp 4.000.000 – Rp 10.000.000'
      });
    } else if (age >= 5 || km >= 75000) {
      score += 18;
      factors.push({
        title: 'Mendekati Siklus Servis Besar 80.000 km',
        category: 'Suspensi & AC',
        severity: 'moderate',
        desc: 'Kompresor AC, shockbreaker, dan kampas rem membutuhkan pemeriksaan fisik menyeluruh.',
        cost: 'Rp 2.000.000 – Rp 5.000.000'
      });
    }

    if (age >= 4 && kmPerYear < 4000) {
      suspiciousOdometer = true;
      score += 15;
      factors.push({
        title: 'Anomali Odometer Rendah (Perlu Verifikasi Reset)',
        category: 'Riwayat Unit',
        severity: 'moderate',
        desc: 'Rata-rata pemakaian hanya ' + kmPerYear.toLocaleString('id-ID') + ' km/tahun untuk usia ' + age + ' tahun. Cocokkan dengan keausan pedal, setir, dan faktur bengkel resmi.',
        cost: 'Risiko manipulasi riwayat odometer'
      });
    } else if (kmPerYear > 30000) {
      score += 16;
      factors.push({
        title: 'Intensitas Pemakaian Sangat Tinggi',
        category: 'Mesin & Sasis',
        severity: 'high',
        desc: 'Rata-rata pemakaian ' + kmPerYear.toLocaleString('id-ID') + ' km/tahun melampaui pemakaian normal harian. Periksa keausan silinder dan kaki-kaki.',
        cost: 'Rp 5.000.000 – Rp 12.000.000'
      });
    }

    if (input.serviceHistory === 'tanpa_riwayat') {
      score += 25;
      factors.push({
        title: 'Tanpa Buku atau Riwayat Servis',
        category: 'Perawatan',
        severity: 'high',
        desc: 'Tidak ada bukti penggantian oli mesin, oli transmisi, maupun minyak rem berkala.',
        cost: 'Wajib kuras seluruh fluida (Rp 2.500.000 – Rp 4.500.000)'
      });
    } else if (input.serviceHistory === 'tidak_lengkap') {
      score += 14;
      factors.push({
        title: 'Catatan Servis Tidak Lengkap',
        category: 'Perawatan',
        severity: 'moderate',
        desc: 'Catatan perawatan terputus. Perlu pemeriksaan kondisi oil sludge di ruang katup.',
        cost: 'Inspeksi ruang silinder & fluida'
      });
    } else if (input.serviceHistory === 'resmi_lengkap') {
      score = Math.max(5, score - 10);
    }

    if (input.transmission === 'matic_cvt' && (km > 70000 || age >= 5)) {
      score += 12;
      factors.push({
        title: 'Transmisi CVT Usia > 5 Tahun atau > 70.000 km',
        category: 'Transmisi',
        severity: 'moderate',
        desc: 'Transmisi CVT sensitif terhadap keterlambatan ganti oli. Uji akselerasi untuk mendeteksi gejala slip belt atau dengung.',
        cost: 'Rp 6.000.000 – Rp 15.000.000'
      });
    } else if (input.transmission === 'matic_dct') {
      score += 15;
      factors.push({
        title: 'Transmisi Dual Clutch (DCT) Pemakaian Tropis',
        category: 'Transmisi',
        severity: 'moderate',
        desc: 'Kopling ganda rentan panas berlebih saat macet. Verifikasi riwayat perbaikan modul mekatronik.',
        cost: 'Rp 8.000.000 – Rp 18.000.000'
      });
    }

    if (input.incidentHistory === 'tabrak_sasis') {
      score += 45;
      factors.push({
        title: 'Bekas Perbaikan Rangka / Sasis Utama',
        category: 'Struktur',
        severity: 'high',
        desc: 'Struktur crumple zone atau tiang pilar pernah dilas/tarik. Kelurusan roda sulit presisi dan nilai jual kembali turun drastis.',
        cost: 'Penurunan nilai jual 25–40%'
      });
    } else if (input.incidentHistory === 'kena_banjir') {
      score += 40;
      factors.push({
        title: 'Riwayat Terendam Air / Banjir',
        category: 'Kelistrikan',
        severity: 'high',
        desc: 'Air memicu korosi pada soket kabel, sensor airbag di bawah kursi, modul BCM/ECU, dan bearing alternator.',
        cost: 'Rp 5.000.000 – Rp 20.000.000'
      });
    }

    // Gabungkan catatan masalah spesifik model dari tabel Supabase vehicle_issues jika cocok
    var queryTokens = input.vehicleName.toLowerCase().split(/\s+/).filter(function (w) {
      return w.length >= 3 && !/^(pt|cv|at|mt|cvt|20\d\d|19\d\d|1\.5|1\.3|1\.2|2\.0|2\.4)$/.test(w);
    });
    if (queryTokens.length && state.supabaseIssues.length) {
      state.supabaseIssues.forEach(function (issue) {
        var vName = issue.vehicles && issue.vehicles.name ? issue.vehicles.name.toLowerCase() : '';
        if (!vName) return;
        var matched = queryTokens.some(function (tok) { return vName.indexOf(tok) !== -1; });
        if (matched) {
          score += 6;
          factors.push({
            title: 'Catatan Database: ' + issue.name,
            category: issue.km ? 'KM ' + issue.km : 'Database Model',
            severity: 'moderate',
            desc: issue.symptom || issue.solution || 'Temuan umum tercatat pada model kendaraan terkait.',
            cost: issue.cost || 'Periksa kondisi di bengkel spesialis'
          });
        }
      });
    }

    score = Math.min(100, Math.max(5, score));

    var riskLevel = 'Rendah';
    var summary = 'Parameter menunjukkan risiko awal tergolong rendah. Tetap lakukan inspeksi fisik dan pengecekan dokumen sebelum pembayaran.';
    if (score >= 55) {
      riskLevel = 'Tinggi';
      summary = 'Risiko tinggi terdeteksi. Unit memiliki potensi perbaikan besar atau cacat riwayat; wajib didampingi inspektor profesional sebelum transaksi.';
    } else if (score >= 28) {
      riskLevel = 'Sedang';
      summary = 'Unit berada pada kategori risiko sedang. Beberapa komponen mendekati masa peremajaan atau memerlukan verifikasi faktur servis asli.';
    }

    var checklist = [
      {
        id: 'doc-bpkb-stnk',
        label: 'Kesesuaian Dokumen BPKB, STNK, dan Faktur Pembelian',
        howToCheck: 'Cocokkan nomor mesin dan nomor rangka fisik dengan STNK dan BPKB. Pastikan bukan STNK duplikat.',
        priority: false
      },
      {
        id: 'doc-etle',
        label: 'Cek Blokir Tilang ETLE dan Tunggakan Pajak Tahunan',
        howToCheck: 'Periksa aplikasi Samsat Online provinsi terkait untuk memastikan tidak ada blokir ETLE atau denda pajak.',
        priority: false
      },
      {
        id: 'engine-oil-cap',
        label: 'Periksa Bawah Tutup Pengisian Oli Mesin (Oil Sludge)',
        howToCheck: 'Buka tutup oli saat mesin dingin. Kerak hitam pekat atau busa putih menandakan keterlambatan ganti oli atau kebocoran coolant.',
        priority: input.serviceHistory !== 'resmi_lengkap'
      },
      {
        id: 'engine-dipstick',
        label: 'Cek Dipstick Oli dan Asap Knalpot',
        howToCheck: 'Tarik dipstick saat mesin menyala. Pastikan tidak ada tiupan asap putih (blow-by gas) keluar dari lubang dipstick.',
        priority: km > 80000
      },
      {
        id: 'radiator-coolant',
        label: 'Kondisi Radiator dan Cairan Pendingin (Coolant)',
        howToCheck: 'Pastikan tabung reservoir berisi cairan coolant asli, bukan air keran berwarna karat kecokelatan.',
        priority: age >= 5
      },
      input.transmission !== 'manual'
        ? {
            id: 'trans-delay',
            label: 'Respons Perpindahan Tuas Transmisi (P-R-N-D)',
            howToCheck: 'Injak rem lalu geser N ke D dan N ke R. Perpindahan harus responsif di bawah 1 detik tanpa hentakan keras.',
            priority: true
          }
        : {
            id: 'trans-clutch-slip',
            label: 'Ketinggian Pedal dan Gigitan Plat Kopling Manual',
            howToCheck: 'Tarik rem tangan, masuk gigi 2, lepas kopling perlahan. Mesin harus segera mati jika plat kopling masih tebal.',
            priority: km > 60000
          },
      {
        id: 'trans-road-test',
        label: 'Uji Jalan Akselerasi Datar dan Tanjakan',
        howToCheck: 'Akselerasi bertahap dari 0–80 km/jam. Pastikan putaran mesin tidak melonjak tanpa peningkatan kecepatan.',
        priority: input.transmission === 'matic_cvt'
      },
      {
        id: 'susp-speedbump',
        label: 'Uji Jalan di Polisi Tidur atau Jalan Bergelombang',
        howToCheck: 'Matikan audio, tutup jendela, lewati jalan tidak rata. Dengarkan ketukan pada rack end atau link stabilizer.',
        priority: km > 50000 || age >= 4
      },
      {
        id: 'steering-rack',
        label: 'Pengecekan Karet Boot As Roda dan Steering Rack',
        howToCheck: 'Periksa kolong roda depan; pastikan karet boot tidak robek dan tidak ada rembesan gemuk atau oli power steering.',
        priority: age >= 5
      },
      {
        id: 'ac-cold-test',
        label: 'Uji Dingin AC Saat Mesin Berhenti (Idle 10 Menit)',
        howToCheck: 'Nyalakan AC suhu terendah selama 10 menit saat parkir. Pastikan embusan tetap dingin dan kompresor tidak berisik.',
        priority: age >= 4
      },
      {
        id: 'dash-indicators',
        label: 'Pemeriksaan Lampu Indikator Speedometer (MID)',
        howToCheck: 'Putar kunci ke ON. Lampu Check Engine, ABS, Airbag, dan EPS wajib menyala lalu padam 3 detik setelah mesin hidup.',
        priority: suspiciousOdometer || input.incidentHistory !== 'bebas_insiden'
      },
      {
        id: 'flood-frame-check',
        label: 'Inspeksi Rel Bawah Kursi, Baut Kap Mesin, dan Sealant Pintu',
        howToCheck: 'Cek karat atau lumpur pada rel jok serta kelenturan lem sealant pabrik di pinggir pintu dan kap mesin.',
        priority: input.incidentHistory !== 'bebas_insiden' || score >= 40
      }
    ];

    return {
      score: score,
      riskLevel: riskLevel,
      summary: summary,
      kmPerYear: kmPerYear,
      factors: factors,
      checklist: checklist
    };
  }

  function updateValidationState() {
    var input = getFormValues();
    var ready = Boolean(input.vehicleName && input.odometerKm > 0);
    var btn = el('btn-analisis-risiko');
    var helper = el('risiko-helper-text');

    el('status-model-text').textContent = input.vehicleName ? 'Siap (' + input.vehicleName + ')' : 'Belum diisi';
    el('status-model-text').style.color = input.vehicleName ? '#047857' : '#b45309';

    el('status-odometer-text').textContent = input.odometerKm > 0 ? 'Siap (' + input.odometerKm.toLocaleString('id-ID') + ' km)' : 'Belum diisi';
    el('status-odometer-text').style.color = input.odometerKm > 0 ? '#047857' : '#b45309';

    btn.disabled = !ready;
    helper.hidden = ready;
  }

  function renderChecklist() {
    var ui = window.RavenmilleUI;
    var input = getFormValues();
    var analysis = evaluateRisk(input);
    var grid = el('checklist-grid');
    if (!grid) return;

    el('checklist-judul').textContent = input.vehicleName
      ? 'Checklist Inspeksi: ' + input.vehicleName
      : 'Checklist Inspeksi Lapangan Unit Bekas';

    var totalItems = analysis.checklist.length;
    var completedCount = 0;
    analysis.checklist.forEach(function (item) {
      if (state.checkedItems[item.id]) completedCount++;
    });

    var filtered = analysis.checklist.filter(function (item) {
      if (state.checklistFilter === 'priority') return item.priority;
      if (state.checklistFilter === 'pending') return !state.checkedItems[item.id];
      return true;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="status-banner is-success" style="grid-column: 1 / -1;">Tidak ada item pada filter ini. Semua pemeriksaan terkait telah selesai.</div>';
    } else {
      grid.innerHTML = filtered.map(function (item, idx) {
        var checked = Boolean(state.checkedItems[item.id]);
        return (
          '<button type="button" class="checklist-card' + (checked ? ' is-checked' : '') + (item.priority ? ' is-priority' : '') + '" data-check-id="' + ui.escapeHtml(item.id) + '" aria-pressed="' + checked + '">' +
            '<span class="checklist-box" aria-hidden="true">' + (checked ? '✓' : '') + '</span>' +
            '<span class="checklist-body">' +
              '<span class="checklist-header-line">' +
                '<strong>' + (idx + 1) + '. ' + ui.escapeHtml(item.label) + '</strong>' +
                (item.priority ? '<span class="checklist-priority-tag">Prioritas Tinggi</span>' : '') +
              '</span>' +
              '<span class="checklist-desc">Cara cek: ' + ui.escapeHtml(item.howToCheck) + '</span>' +
            '</span>' +
          '</button>'
        );
      }).join('');
    }

    var pct = Math.round((completedCount / Math.max(1, totalItems)) * 100);
    el('checklist-counter').textContent = completedCount + ' / ' + totalItems + ' Selesai';
    el('checklist-percent').textContent = pct + '% Terverifikasi';
    el('checklist-progress-fill').style.width = pct + '%';
  }

  function runRiskEvaluation() {
    var ui = window.RavenmilleUI;
    var input = getFormValues();
    if (!input.vehicleName || input.odometerKm <= 0) return;

    state.hasAnalyzed = true;
    var result = evaluateRisk(input);

    el('risiko-placeholder').hidden = true;
    el('risiko-hasil').hidden = false;

    el('hasil-nama-unit').textContent = input.vehicleName;
    el('hasil-skor').textContent = String(result.score);
    el('hasil-km-tahun').textContent = '~' + result.kmPerYear.toLocaleString('id-ID') + ' km/tahun';
    el('hasil-ringkasan').textContent = result.summary;

    var badge = el('hasil-level-badge');
    var bar = el('hasil-skor-bar');
    bar.style.width = result.score + '%';

    if (result.riskLevel === 'Rendah') {
      badge.textContent = 'Risiko Rendah';
      badge.className = 'risiko-level-tag is-low';
      bar.style.backgroundColor = '#10b981';
    } else if (result.riskLevel === 'Sedang') {
      badge.textContent = 'Risiko Sedang';
      badge.className = 'risiko-level-tag is-medium';
      bar.style.backgroundColor = '#fbbf24';
    } else {
      badge.textContent = 'Risiko Tinggi';
      badge.className = 'risiko-level-tag is-high';
      bar.style.backgroundColor = '#f43f5e';
    }

    el('hasil-faktor-judul').textContent = 'Faktor Pemicu Risiko (' + result.factors.length + ')';
    var factorsContainer = el('hasil-daftar-faktor');

    if (!result.factors.length) {
      factorsContainer.innerHTML =
        '<div class="status-banner is-success">Tidak ditemukan faktor risiko kritis berdasarkan parameter yang diinput.</div>';
    } else {
      factorsContainer.innerHTML = result.factors.map(function (f) {
        return (
          '<div class="faktor-risiko-item">' +
            '<div class="faktor-risiko-head">' +
              '<strong>' + ui.escapeHtml(f.title) + '</strong>' +
              '<span>' + ui.escapeHtml(f.category) + '</span>' +
            '</div>' +
            '<p>' + ui.escapeHtml(f.desc) + '</p>' +
            (f.cost ? '<div class="faktor-risiko-cost tabular-nums">Potensi biaya: ' + ui.escapeHtml(f.cost) + '</div>' : '') +
          '</div>'
        );
      }).join('');
    }

    renderChecklist();

    var logKey = input.vehicleName + '|' + input.vehicleYear + '|' + input.odometerKm + '|' + result.score;
    if (state.lastLoggedKey !== logKey && typeof window.ravenmilleSafeInsert === 'function') {
      state.lastLoggedKey = logKey;
      window.ravenmilleSafeInsert('risk_assessments', {
        vehicle_name: input.vehicleName,
        vehicle_year: input.vehicleYear,
        odometer_km: input.odometerKm,
        transmission: input.transmission,
        body_type: input.bodyType,
        service_history: input.serviceHistory,
        incident_history: input.incidentHistory,
        risk_score: result.score,
        risk_level: result.riskLevel
      });
    }
  }

  async function loadSupabaseReferenceData() {
    if (!window.RAVENMILLE_SUPABASE) return;
    try {
      var vRes = await window.RAVENMILLE_SUPABASE
        .from('vehicles')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');
      if (!vRes.error && vRes.data) {
        state.supabaseVehicles = vRes.data;
        var dataList = el('risiko-model-list');
        if (dataList) {
          dataList.innerHTML = vRes.data.map(function (v) {
            return '<option value="' + window.RavenmilleUI.escapeHtml(v.name) + '"></option>';
          }).join('');
        }
      }

      var iRes = await window.RAVENMILLE_SUPABASE
        .from('vehicle_issues')
        .select('*, vehicles(name)')
        .order('created_at', { ascending: false });
      if (!iRes.error && iRes.data) {
        state.supabaseIssues = iRes.data;
      }
    } catch (e) {
      // Keep built-in risk heuristics
    }
  }

  function applySampleCase(sampleKey) {
    if (sampleKey === 'hrv-2017') {
      el('risiko-model').value = 'Honda HR-V 1.5 E CVT 2017';
      el('risiko-tahun').value = '2017';
      el('risiko-odometer').value = '88000';
      el('risiko-transmisi').value = 'matic_cvt';
      el('risiko-bodi').value = 'suv';
      el('risiko-servis').value = 'tidak_lengkap';
      el('risiko-insiden').value = 'bebas_insiden';
    } else if (sampleKey === 'avanza-2020') {
      el('risiko-model').value = 'Toyota Avanza 1.3 G AT 2020';
      el('risiko-tahun').value = '2020';
      el('risiko-odometer').value = '48000';
      el('risiko-transmisi').value = 'matic_at';
      el('risiko-bodi').value = 'mpv';
      el('risiko-servis').value = 'resmi_lengkap';
      el('risiko-insiden').value = 'bebas_insiden';
    }
    updateValidationState();
    runRiskEvaluation();
  }

  function onFormChanged() {
    updateValidationState();
    renderChecklist();
    if (state.hasAnalyzed) {
      var input = getFormValues();
      if (input.vehicleName && input.odometerKm > 0) {
        runRiskEvaluation();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadCheckedItems();
    populateYearOptions();
    loadSupabaseReferenceData();

    ['risiko-model', 'risiko-tahun', 'risiko-odometer', 'risiko-transmisi', 'risiko-bodi', 'risiko-servis', 'risiko-insiden'].forEach(function (id) {
      var node = el(id);
      if (node) {
        node.addEventListener('input', onFormChanged);
        node.addEventListener('change', onFormChanged);
      }
    });

    if (el('btn-analisis-risiko')) {
      el('btn-analisis-risiko').addEventListener('click', runRiskEvaluation);
    }

    if (el('btn-cetak-checklist')) {
      el('btn-cetak-checklist').addEventListener('click', function () {
        window.print();
      });
    }

    if (el('btn-reset-checklist')) {
      el('btn-reset-checklist').addEventListener('click', function () {
        state.checkedItems = {};
        saveCheckedItems();
        renderChecklist();
      });
    }

    document.querySelectorAll('[data-contoh-risiko]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applySampleCase(btn.getAttribute('data-contoh-risiko'));
      });
    });

    document.querySelectorAll('[data-checklist-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.checklistFilter = btn.getAttribute('data-checklist-filter');
        document.querySelectorAll('[data-checklist-filter]').forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        renderChecklist();
      });
    });

    var grid = el('checklist-grid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('[data-check-id]');
        if (!card) return;
        var id = card.getAttribute('data-check-id');
        state.checkedItems[id] = !state.checkedItems[id];
        saveCheckedItems();
        renderChecklist();
      });
    }

    updateValidationState();
    renderChecklist();
  });
})();
