/* ==========================================================================
   Ravenmille – Berita & Artikel Otomotif
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

  window.RAVENMILLE_FALLBACK_ARTICLES = FALLBACK_ARTICLES;

  var state = {
    articles: [],
    isLoading: true,
    searchQuery: '',
    selectedCategory: 'SEMUA'
  };

  function el(id) {
    return document.getElementById(id);
  }

  function renderArticles() {
    var grid = el('berita-grid-container');
    if (!grid) return;
    var ui = window.RavenmilleUI;

    if (state.isLoading) {
      grid.innerHTML = '<div class="status-banner is-info" style="grid-column: 1 / -1;">Memuat berita otomotif...</div>';
      return;
    }

    var query = state.searchQuery.trim().toLowerCase();
    var filtered = state.articles.filter(function (article) {
      var cat = (article.category || 'BERITA').toUpperCase();
      var matchCat = state.selectedCategory === 'SEMUA' || cat === state.selectedCategory;
      var matchQuery = !query ||
        article.title.toLowerCase().indexOf(query) !== -1 ||
        (article.excerpt || '').toLowerCase().indexOf(query) !== -1 ||
        cat.toLowerCase().indexOf(query) !== -1;
      return matchCat && matchQuery;
    });

    if (!filtered.length) {
      grid.innerHTML = '<div class="kartu-utama" style="grid-column: 1 / -1; text-align: center;">Belum ada artikel yang sesuai dengan kata kunci Anda.</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (article) {
      var cat = (article.category || 'BERITA').toUpperCase();
      var detailUrl = 'detail-berita.html?id=' + encodeURIComponent(article.id);
      return (
        '<article class="kartu-utama berita-card">' +
          '<a href="' + detailUrl + '" class="berita-card-link">' +
            '<div class="kendaraan-image-wrapper berita-card-thumb">' +
              ui.renderKendaraanImage(article.image_url, 'Ilustrasi artikel ' + article.title, cat) +
            '</div>' +
            '<div class="berita-card-body">' +
              '<div class="meta-row">' +
                '<span>' + ui.escapeHtml(cat) + '</span>' +
                '<span aria-hidden="true">·</span>' +
                '<span>' + ui.escapeHtml(ui.formatDateID(article.created_at)) + '</span>' +
              '</div>' +
              '<h2 class="berita-card-title">' + ui.escapeHtml(article.title) + '</h2>' +
              '<p class="berita-card-excerpt">' + ui.escapeHtml(article.excerpt || '') + '</p>' +
              '<span class="berita-read-more">Baca Selengkapnya →</span>' +
            '</div>' +
          '</a>' +
        '</article>'
      );
    }).join('');
  }

  async function loadNews() {
    var liveArticles = [];
    if (window.RAVENMILLE_SUPABASE) {
      try {
        var res = await window.RAVENMILLE_SUPABASE
          .from('news')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!res.error && res.data && res.data.length > 0) {
          liveArticles = res.data;
        }
      } catch (e) {
        liveArticles = [];
      }
    }

    state.articles = liveArticles.length ? liveArticles.concat(FALLBACK_ARTICLES) : FALLBACK_ARTICLES;
    state.isLoading = false;
    renderArticles();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var searchEl = el('cari-berita-input');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.searchQuery = this.value;
        renderArticles();
      });
    }

    document.querySelectorAll('[data-kategori-berita]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.selectedCategory = btn.getAttribute('data-kategori-berita');
        document.querySelectorAll('[data-kategori-berita]').forEach(function (other) {
          other.classList.toggle('is-active', other === btn);
        });
        renderArticles();
      });
    });

    renderArticles();
    loadNews();
  });
})();
