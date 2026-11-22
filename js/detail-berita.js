/* ==========================================================================
   Ravenmille – Detail Artikel Otomotif
   ========================================================================== */

(function () {
  'use strict';

  var FALLBACK_ARTICLES = [
    {
      id: 'panduan-tco-mobil-bekas',
      title: 'Mengapa Harga Murah di Showroom Sering Lebih Mahal Setelah 3 Tahun?',
      category: 'ANALISIS',
      excerpt: 'Membedah biaya tersembunyi suspensi, transmisi CVT, dan pajak progresif yang kerap luput dari perhitungan DP awal pembeli mobil bekas.',
      content: 'Banyak calon pembeli mobil bekas terpaku pada angka harga jual atau cicilan bulanan semata. Padahal, komponen seperti bushing kaki-kaki, radiator, dan fluida transmisi matik yang memasuki usia 5 hingga 7 tahun sering memicu pengeluaran mendadak di tahun pertama.\n\nDengan memetakan Total Cost of Ownership (TCO) sejak awal, pembeli dapat membandingkan dua unit berbeda secara objektif—termasuk depresiasi harga jual kembali, efisiensi BBM aktual, dan premi asuransi.\n\nGunakan Kalkulator TCO Ravenmille sebelum menyepakati harga final di showroom.',
      image_url: 'images/laporan-audit-tco-kendaraan.png',
      created_at: '2026-10-18T09:00:00Z'
    },
    {
      id: 'ciri-odometer-diputar',
      title: '5 Indikator Fisik untuk Mendeteksi Odometer Mobil Bekas yang Diputar',
      category: 'TIPS',
      excerpt: 'Selain angka di layar digital, periksa keausan karet pedal, tekstur kulit setir, hingga catatan interval bengkel resmi.',
      content: 'Manipulasi odometer masih menjadi salah satu risiko terbesar saat berburu mobil bekas di Indonesia. Mobil dengan jarak tempuh rendah yang tidak sepadan dengan usianya perlu diperiksa secara saksama.\n\nPertama, periksa ketebalan tekstur setir dan karet pedal rem. Kedua, cek riwayat servis pada buku manual dan cocokkan dengan database bengkel resmi atau aplikasi Samsat.\n\nKetiga, manfaatkan Analisis Risiko Unit di Ravenmille untuk memperoleh daftar cek lapangan sesuai profil usia dan transmisi kendaraan.',
      image_url: '',
      created_at: '2026-10-10T09:00:00Z'
    },
    {
      id: 'hybrid-vs-diesel-tco',
      title: 'Perbandingan Biaya Kepemilikan: MPV Hybrid Baru vs MPV Diesel Bekas',
      category: 'BERITA',
      excerpt: 'Simulasi pemakaian 15.000 km per tahun menunjukkan selisih signifikan antara biaya bahan bakar, pajak tahunan, dan nilai residu.',
      content: 'Tren mobil hybrid di segmen MPV keluarga mulai menantang dominasi MPV diesel bekas yang selama ini dikenal memiliki nilai jual kembali tinggi.\n\nMeskipun harga beli MPV hybrid baru lebih tinggi di awal, konsumsi BBM di kemacetan kota serta insentif pajak tertentu dapat memangkas biaya operasional harian secara nyata.\n\nAnda dapat mensimulasikan skenario ini langsung pada halaman Komparasi Kendaraan Ravenmille.',
      image_url: '',
      created_at: '2026-10-02T09:00:00Z'
    }
  ];

  function renderArticle(article) {
    var ui = window.RavenmilleUI;
    var container = document.getElementById('detail-berita-artikel');
    if (!container) return;

    document.title = article.title + ' | Ravenmille';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && article.excerpt) {
      metaDesc.setAttribute('content', article.excerpt.slice(0, 155));
    }

    var paragraphs = (article.content || '')
      .split(/\n+/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);

    container.innerHTML =
      '<div class="kartu-utama" style="padding: 0; overflow: hidden;">' +
        (article.image_url
          ? '<div class="kendaraan-image-wrapper" style="max-height: 420px; border-bottom: 2px solid #162447;">' +
              ui.renderKendaraanImage(article.image_url, 'Ilustrasi berita ' + article.title, article.title) +
            '</div>'
          : '') +
        '<div style="padding: 32px;">' +
          '<div class="meta-row" style="margin-bottom: 12px;">' +
            '<span>' + ui.escapeHtml((article.category || 'BERITA').toUpperCase()) + '</span>' +
            '<span aria-hidden="true">·</span>' +
            '<span>' + ui.escapeHtml(ui.formatDateID(article.created_at)) + '</span>' +
          '</div>' +
          '<h1 class="judul-halaman">' + ui.escapeHtml(article.title) + '</h1>' +
          '<div class="artikel-isi-paragraf">' +
            paragraphs.map(function (p) { return '<p>' + ui.escapeHtml(p) + '</p>'; }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  async function loadDetail() {
    var container = document.getElementById('detail-berita-artikel');
    var id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
      container.innerHTML =
        '<div class="kartu-utama" style="text-align: center;">' +
          '<p style="font-weight: 700;">Artikel tidak ditemukan.</p>' +
          '<a href="berita-otomotif.html" class="btn btn-primary" style="margin-top: 14px;">Kembali ke Daftar Berita</a>' +
        '</div>';
      return;
    }

    var localFallback = FALLBACK_ARTICLES.find(function (a) { return a.id === id; });
    if (localFallback) {
      renderArticle(localFallback);
      return;
    }

    if (window.RAVENMILLE_SUPABASE) {
      try {
        var res = await window.RAVENMILLE_SUPABASE
          .from('news')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (!res.error && res.data) {
          renderArticle(res.data);
          return;
        }
      } catch (e) {
        // Fall through to not found state
      }
    }

    container.innerHTML =
      '<div class="kartu-utama" style="text-align: center;">' +
        '<p style="font-weight: 700;">Artikel tidak ditemukan atau telah dihapus.</p>' +
        '<a href="berita-otomotif.html" class="btn btn-primary" style="margin-top: 14px;">Kembali ke Daftar Berita</a>' +
      '</div>';
  }

  document.addEventListener('DOMContentLoaded', loadDetail);
})();
