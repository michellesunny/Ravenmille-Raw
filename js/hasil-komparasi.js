/* ==========================================================================
   Ravenmille – Hasil Komparasi Finansial Kendaraan
   ========================================================================== */

(function () {
  'use strict';

  var DEFAULT_COMPARISON = {
    period: 3,
    v1: {
      name: 'Toyota Avanza 1.5 G CVT',
      price: 276700000,
      condition: 'baru',
      paymentMethod: 'kredit',
      dpPct: 20,
      creditRatePct: 6.5,
      fuelType: 'ron92',
      fuelPrice: 12950,
      fuelEff: 13.5,
      kmYear: 15000,
      service: 3500000,
      tax: 4200000,
      insurance: 4800000
    },
    v2: {
      name: 'Mitsubishi Xpander Ultimate CVT',
      price: 315900000,
      condition: 'baru',
      paymentMethod: 'kredit',
      dpPct: 20,
      creditRatePct: 6.5,
      fuelType: 'ron92',
      fuelPrice: 12950,
      fuelEff: 12.0,
      kmYear: 15000,
      service: 4100000,
      tax: 4850000,
      insurance: 5600000
    }
  };

  var state = {
    data: null,
    periodYears: 3,
    computed: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function calculateVehicleMetrics(v, periodYears) {
    var depRate = periodYears === 1 ? 0.15 : (periodYears === 3 ? 0.32 : 0.46);
    var depreciation = v.price * depRate;
    var fuelPrice = v.fuelPrice || 12950;
    var fuelEff = Math.max(0.1, v.fuelEff || 12);
    var kmYear = v.kmYear || 15000;
    var fuelCost = (kmYear / fuelEff) * fuelPrice * periodYears;
    var fuelVolume = (kmYear / fuelEff) * periodYears;
    var serviceCost = (v.service || 0) * periodYears;
    var taxCost = (v.tax || 0) * periodYears;
    var insuranceCost = (v.insurance || 0) * periodYears;

    var isCredit = v.paymentMethod === 'kredit';
    var dpPct = v.dpPct != null ? v.dpPct : 20;
    var ratePct = v.creditRatePct != null ? v.creditRatePct : 6.5;
    var interestCost = isCredit ? v.price * (1 - dpPct / 100) * (ratePct / 100) * periodYears : 0;

    var totalTco = depreciation + fuelCost + serviceCost + taxCost + insuranceCost + interestCost;
    var monthlyCost = totalTco / (periodYears * 12);
    var perKmCost = totalTco / Math.max(1, kmYear * periodYears);
    var residualValue = v.price * (1 - depRate);

    return {
      name: v.name,
      price: v.price,
      fuelType: v.fuelType || 'ron92',
      fuelEff: fuelEff,
      fuelVolume: fuelVolume,
      depreciation: depreciation,
      fuelCost: fuelCost,
      serviceCost: serviceCost,
      taxCost: taxCost,
      insuranceCost: insuranceCost,
      interestCost: interestCost,
      totalTco: totalTco,
      monthlyCost: monthlyCost,
      perKmCost: perKmCost,
      residualValue: residualValue
    };
  }

  function renderResults() {
    var ui = window.RavenmilleUI;
    var P = state.periodYears;
    var c1 = calculateVehicleMetrics(state.data.v1, P);
    var c2 = calculateVehicleMetrics(state.data.v2, P);
    state.computed = { c1: c1, c2: c2, period: P };

    var isV1Cheaper = c1.totalTco <= c2.totalTco;
    var winner = isV1Cheaper ? c1 : c2;
    var loser = isV1Cheaper ? c2 : c1;
    var diffTotal = Math.abs(c1.totalTco - c2.totalTco);
    var pctSave = Math.round((diffTotal / Math.max(1, loser.totalTco)) * 100);
    var diffMonthly = Math.abs(c1.monthlyCost - c2.monthlyCost);

    el('hasil-verdict-judul').textContent =
      winner.name + ' Lebih Hemat ' + ui.formatIDR(diffTotal) + ' (' + pctSave + '%)';
    el('hasil-verdict-deskripsi').textContent =
      'Dalam proyeksi kepemilikan ' + P + ' tahun, total biaya ekonomi riil ' + winner.name +
      ' tercatat ' + ui.formatIDR(winner.totalTco) + ' dibandingkan ' + loser.name + ' (' + ui.formatIDR(loser.totalTco) + ').';

    el('kartu-hemat-bulanan').textContent = ui.formatIDR(diffMonthly) + ' / bln';
    el('kartu-hemat-bulanan-desc').textContent = winner.name + ' lebih ringan ' + ui.formatIDR(diffMonthly) + ' setiap bulan.';

    var annualFuel1 = c1.fuelCost / P;
    var annualFuel2 = c2.fuelCost / P;
    var fuelDiffYear = Math.abs(annualFuel1 - annualFuel2);
    var fuelCheaper = annualFuel1 <= annualFuel2 ? c1.name : c2.name;
    el('kartu-hemat-bbm').textContent = ui.formatIDR(fuelDiffYear) + ' / thn';
    el('kartu-hemat-bbm-desc').textContent = fuelCheaper + ' lebih hemat pengeluaran energi tahunan.';

    var depDiff = Math.abs(c1.depreciation - c2.depreciation);
    var betterRetention = c1.depreciation <= c2.depreciation ? c1.name : c2.name;
    el('kartu-selisih-depresiasi').textContent = ui.formatIDR(depDiff);
    el('kartu-selisih-depresiasi-desc').textContent = betterRetention + ' menanggung penyusutan nominal lebih kecil selama ' + P + ' tahun.';

    el('badge-durasi-matriks').textContent = 'Durasi Proyeksi: ' + P + ' Tahun';
    el('th-kandidat-1').textContent = c1.name;
    el('th-kandidat-2').textContent = c2.name;

    var rows = [
      ['Harga Beli Kendaraan (OTR)', c1.price, c2.price],
      ['Depresiasi Nilai Jual', c1.depreciation, c2.depreciation],
      ['Total Biaya BBM / Energi', c1.fuelCost, c2.fuelCost],
      ['Total Biaya Servis Berkala', c1.serviceCost, c2.serviceCost],
      ['Total Pajak Kendaraan (PKB)', c1.taxCost, c2.taxCost],
      ['Total Biaya Asuransi', c1.insuranceCost, c2.insuranceCost],
      ['Total Bunga Pembiayaan', c1.interestCost, c2.interestCost]
    ];

    var tbodyHtml = rows.map(function (r) {
      var diff = Math.abs(r[1] - r[2]);
      return (
        '<tr>' +
          '<td>' + r[0] + '</td>' +
          '<td>' + ui.formatIDR(r[1]) + '</td>' +
          '<td>' + ui.formatIDR(r[2]) + '</td>' +
          '<td style="font-weight: 800; color: #162447;">' + ui.formatIDR(diff) + '</td>' +
        '</tr>'
      );
    }).join('');

    tbodyHtml +=
      '<tr class="is-total">' +
        '<td>Total Biaya TCO Riil (' + P + ' Tahun)</td>' +
        '<td class="is-highlight">' + ui.formatIDR(c1.totalTco) + '</td>' +
        '<td class="is-highlight">' + ui.formatIDR(c2.totalTco) + '</td>' +
        '<td>' + ui.formatIDR(diffTotal) + ' (' + ui.escapeHtml(winner.name) + ' lebih hemat)</td>' +
      '</tr>' +
      '<tr>' +
        '<td>Beban Biaya per Bulan</td>' +
        '<td>' + ui.formatIDR(c1.monthlyCost) + '</td>' +
        '<td>' + ui.formatIDR(c2.monthlyCost) + '</td>' +
        '<td style="font-weight: 800;">' + ui.formatIDR(diffMonthly) + ' / bln</td>' +
      '</tr>' +
      '<tr>' +
        '<td>Biaya Riil per Kilometer</td>' +
        '<td>' + ui.formatIDR(c1.perKmCost) + ' / km</td>' +
        '<td>' + ui.formatIDR(c2.perKmCost) + ' / km</td>' +
        '<td style="font-weight: 800;">' + ui.formatIDR(Math.abs(c1.perKmCost - c2.perKmCost)) + ' / km</td>' +
      '</tr>' +
      '<tr>' +
        '<td>Estimasi Sisa Nilai Jual Kembali</td>' +
        '<td>' + ui.formatIDR(c1.residualValue) + '</td>' +
        '<td>' + ui.formatIDR(c2.residualValue) + '</td>' +
        '<td style="font-weight: 800;">' + ui.formatIDR(Math.abs(c1.residualValue - c2.residualValue)) + '</td>' +
      '</tr>';

    el('tabel-matriks-komparasi').innerHTML = tbodyHtml;

    // Visual Comparison Bars
    var maxBar = Math.max(c1.totalTco, c2.totalTco) || 1;
    var w1 = Math.round((c1.totalTco / maxBar) * 100);
    var w2 = Math.round((c2.totalTco / maxBar) * 100);
    el('grafik-perbandingan-tco').innerHTML =
      '<div class="komparasi-bar-item">' +
        '<div class="komparasi-bar-head"><span>' + ui.escapeHtml(c1.name) + '</span><strong class="tabular-nums">' + ui.formatIDR(c1.totalTco) + '</strong></div>' +
        '<div class="komparasi-bar-track"><div class="komparasi-bar-fill" style="width:' + w1 + '%; background: #162447;"></div></div>' +
      '</div>' +
      '<div class="komparasi-bar-item">' +
        '<div class="komparasi-bar-head"><span>' + ui.escapeHtml(c2.name) + '</span><strong class="tabular-nums">' + ui.formatIDR(c2.totalTco) + '</strong></div>' +
        '<div class="komparasi-bar-track"><div class="komparasi-bar-fill" style="width:' + w2 + '%; background: #f59e0b;"></div></div>' +
      '</div>';
  }

  function downloadComparisonCSV() {
    if (!state.computed) return;
    var c1 = state.computed.c1;
    var c2 = state.computed.c2;
    var P = state.computed.period;
    var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var lines = [
      [q('Komponen'), q(c1.name), q(c2.name), q('Selisih')].join(','),
      [q('Harga Beli'), Math.round(c1.price), Math.round(c2.price), Math.round(Math.abs(c1.price - c2.price))].join(','),
      [q('Depresiasi'), Math.round(c1.depreciation), Math.round(c2.depreciation), Math.round(Math.abs(c1.depreciation - c2.depreciation))].join(','),
      [q('BBM / Energi'), Math.round(c1.fuelCost), Math.round(c2.fuelCost), Math.round(Math.abs(c1.fuelCost - c2.fuelCost))].join(','),
      [q('Servis'), Math.round(c1.serviceCost), Math.round(c2.serviceCost), Math.round(Math.abs(c1.serviceCost - c2.serviceCost))].join(','),
      [q('Pajak PKB'), Math.round(c1.taxCost), Math.round(c2.taxCost), Math.round(Math.abs(c1.taxCost - c2.taxCost))].join(','),
      [q('Asuransi'), Math.round(c1.insuranceCost), Math.round(c2.insuranceCost), Math.round(Math.abs(c1.insuranceCost - c2.insuranceCost))].join(','),
      [q('Bunga Kredit'), Math.round(c1.interestCost), Math.round(c2.interestCost), Math.round(Math.abs(c1.interestCost - c2.interestCost))].join(','),
      [q('Total TCO ' + P + ' Tahun'), Math.round(c1.totalTco), Math.round(c2.totalTco), Math.round(Math.abs(c1.totalTco - c2.totalTco))].join(',')
    ];

    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ravenmille-komparasi-' + P + 'tahun.csv';
    a.click();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var parsed = null;
    try {
      var raw = localStorage.getItem('ravenmille_komparasi_data');
      if (raw) parsed = JSON.parse(raw);
    } catch (e) {
      parsed = null;
    }

    state.data = parsed && parsed.v1 && parsed.v2 ? parsed : DEFAULT_COMPARISON;
    state.periodYears = Number(state.data.period) || 3;

    document.querySelectorAll('.tombol-periode-hasil').forEach(function (btn) {
      var p = Number(btn.getAttribute('data-period'));
      btn.classList.toggle('is-active', p === state.periodYears);
      btn.addEventListener('click', function () {
        state.periodYears = p;
        document.querySelectorAll('.tombol-periode-hasil').forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        renderResults();
      });
    });

    if (el('btn-cetak-komparasi')) {
      el('btn-cetak-komparasi').addEventListener('click', function () {
        window.print();
      });
    }
    if (el('btn-unduh-csv-komparasi')) {
      el('btn-unduh-csv-komparasi').addEventListener('click', downloadComparisonCSV);
    }

    renderResults();
  });
})();
