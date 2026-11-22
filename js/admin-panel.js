/* ==========================================================================
   Ravenmille – Panel Admin Kelola Data Supabase
   Mendukung Tambah, Edit, dan Hapus (dengan konfirmasi inline tanpa alert/confirm).
   ========================================================================== */

(function () {
  'use strict';

  var sb = null;
  var state = {
    vehicles: [],
    issues: [],
    inspectors: [],
    workshops: [],
    news: [],
    consultations: [],
    pendingDeleteKey: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function showStatus(msgId, text, isOk) {
    var node = el(msgId);
    if (!node) return;
    node.textContent = text;
    node.className = 'status-banner ' + (isOk ? 'is-success' : 'is-danger');
    node.hidden = false;
    if (isOk) {
      setTimeout(function () { node.hidden = true; }, 3500);
    }
  }

  function splitComma(str) {
    return String(str || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function showTab(tabName) {
    document.querySelectorAll('[data-admin-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-admin-tab') === tabName);
    });
    ['kendaraan', 'masalah', 'inspektor', 'bengkel', 'berita', 'konsultasi'].forEach(function (t) {
      var panel = el('admin-tab-' + t);
      if (panel) panel.hidden = t !== tabName;
    });
  }

  function renderDeleteButton(table, id) {
    var key = table + ':' + id;
    if (state.pendingDeleteKey === key) {
      return (
        '<button type="button" class="btn btn-danger btn-sm" data-confirm-delete="' + table + '" data-row-id="' + id + '">Yakin Hapus</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-cancel-delete="1">Batal</button>'
      );
    }
    return '<button type="button" class="btn btn-danger btn-sm" data-ask-delete="' + table + '" data-row-id="' + id + '">Hapus</button>';
  }

  /* ---------- KENDARAAN ---------- */
  function resetVehicleForm() {
    el('kendaraan-id').value = '';
    el('kendaraan-nama').value = '';
    el('kendaraan-merek').value = '';
    el('kendaraan-kategori').value = '';
    el('kendaraan-harga').value = '275000000';
    el('kendaraan-efisiensi').value = '13.5';
    el('kendaraan-servis').value = '3500000';
    el('kendaraan-asuransi').value = '4800000';
    el('kendaraan-pajak').value = '4200000';
    el('kendaraan-urutan').value = '0';
    el('kendaraan-gambar').value = '';
    el('btn-simpan-kendaraan').textContent = 'Simpan Kendaraan';
    el('btn-batal-kendaraan').hidden = true;
  }

  function editVehicle(id) {
    var v = state.vehicles.find(function (item) { return String(item.id) === String(id); });
    if (!v) return;
    el('kendaraan-id').value = v.id;
    el('kendaraan-nama').value = v.name || '';
    el('kendaraan-merek').value = v.brand || '';
    el('kendaraan-kategori').value = v.category || '';
    el('kendaraan-harga').value = v.price || 0;
    el('kendaraan-efisiensi').value = v.fuel_eff || 12;
    el('kendaraan-servis').value = v.service || 0;
    el('kendaraan-asuransi').value = v.insurance || 0;
    el('kendaraan-pajak').value = v.tax || 0;
    el('kendaraan-urutan').value = v.sort_order || 0;
    el('btn-simpan-kendaraan').textContent = 'Perbarui Kendaraan';
    el('btn-batal-kendaraan').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveVehicle() {
    if (!sb) return;
    var name = el('kendaraan-nama').value.trim();
    if (!name) {
      showStatus('kendaraan-status-msg', 'Nama model kendaraan wajib diisi.', false);
      return;
    }

    var id = el('kendaraan-id').value;
    var file = el('kendaraan-gambar').files[0];
    var btn = el('btn-simpan-kendaraan');
    btn.disabled = true;

    try {
      var imageUrl;
      if (file) {
        imageUrl = await window.ravenmilleUploadImage(file, 'vehicles');
      }
      var row = {
        name: name,
        brand: el('kendaraan-merek').value.trim(),
        category: el('kendaraan-kategori').value.trim(),
        price: Number(el('kendaraan-harga').value) || 0,
        fuel_eff: Number(el('kendaraan-efisiensi').value) || 12,
        service: Number(el('kendaraan-servis').value) || 0,
        insurance: Number(el('kendaraan-asuransi').value) || 0,
        tax: Number(el('kendaraan-pajak').value) || 0,
        sort_order: Number(el('kendaraan-urutan').value) || 0
      };
      if (imageUrl) row.image_url = imageUrl;

      var query = id
        ? sb.from('vehicles').update(row).eq('id', id)
        : sb.from('vehicles').insert(row);
      var res = await query;
      if (res.error) throw res.error;

      showStatus('kendaraan-status-msg', id ? 'Data kendaraan berhasil diperbarui.' : 'Kendaraan baru tersimpan.', true);
      resetVehicleForm();
      await loadVehicles();
    } catch (err) {
      showStatus('kendaraan-status-msg', 'Gagal menyimpan: ' + err.message, false);
    } finally {
      btn.disabled = false;
    }
  }

  function renderVehiclesList() {
    var ui = window.RavenmilleUI;
    var list = el('daftar-kendaraan-admin');
    var select = el('masalah-kendaraan-id');
    if (!state.vehicles.length) {
      list.innerHTML = '<p style="color: #64748b;">Belum ada data kendaraan di Supabase.</p>';
      select.innerHTML = '<option value="">Tambahkan kendaraan terlebih dahulu</option>';
      return;
    }

    list.innerHTML = state.vehicles.map(function (v) {
      return (
        '<div class="admin-list-item">' +
          '<div class="kendaraan-image-wrapper admin-thumb">' +
            ui.renderKendaraanImage(v.image_url, 'Kendaraan image ' + v.name, v.brand || 'Unit') +
          '</div>' +
          '<div class="admin-item-info">' +
            '<strong>' + ui.escapeHtml(v.name) + '</strong>' +
            '<small class="tabular-nums">' + ui.formatIDR(v.price) + ' · ' + v.fuel_eff + ' km/L' + (v.brand ? ' · ' + ui.escapeHtml(v.brand) : '') + '</small>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-edit-table="vehicles" data-row-id="' + v.id + '">Edit</button>' +
            renderDeleteButton('vehicles', v.id) +
          '</div>' +
        '</div>'
      );
    }).join('');

    select.innerHTML = state.vehicles.map(function (v) {
      return '<option value="' + v.id + '">' + ui.escapeHtml(v.name) + '</option>';
    }).join('');
  }

  async function loadVehicles() {
    if (!sb) return;
    var res = await sb.from('vehicles').select('*').order('sort_order').order('created_at');
    state.vehicles = res.data || [];
    renderVehiclesList();
    await loadIssues();
  }

  /* ---------- MASALAH KENDARAAN ---------- */
  function resetIssueForm() {
    el('masalah-id').value = '';
    el('masalah-nama').value = '';
    el('masalah-km').value = '';
    el('masalah-biaya').value = '';
    el('masalah-gejala').value = '';
    el('masalah-solusi').value = '';
    el('masalah-gambar').value = '';
    el('btn-simpan-masalah').textContent = 'Simpan Masalah';
    el('btn-batal-masalah').hidden = true;
  }

  function editIssue(id) {
    var item = state.issues.find(function (x) { return String(x.id) === String(id); });
    if (!item) return;
    el('masalah-id').value = item.id;
    if (item.vehicle_id) el('masalah-kendaraan-id').value = item.vehicle_id;
    el('masalah-nama').value = item.name || '';
    el('masalah-km').value = item.km || '';
    el('masalah-biaya').value = item.cost || '';
    el('masalah-gejala').value = item.symptom || '';
    el('masalah-solusi').value = item.solution || '';
    el('btn-simpan-masalah').textContent = 'Perbarui Masalah';
    el('btn-batal-masalah').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveIssue() {
    if (!sb) return;
    var name = el('masalah-nama').value.trim();
    var vehicleId = el('masalah-kendaraan-id').value;
    if (!vehicleId || !name) {
      showStatus('masalah-status-msg', 'Pilih kendaraan dan isi nama masalah terlebih dahulu.', false);
      return;
    }

    var id = el('masalah-id').value;
    var file = el('masalah-gambar').files[0];
    var btn = el('btn-simpan-masalah');
    btn.disabled = true;

    try {
      var imageUrl;
      if (file) {
        imageUrl = await window.ravenmilleUploadImage(file, 'issues');
      }
      var row = {
        vehicle_id: vehicleId,
        name: name,
        km: el('masalah-km').value.trim(),
        cost: el('masalah-biaya').value.trim(),
        symptom: el('masalah-gejala').value.trim(),
        solution: el('masalah-solusi').value.trim()
      };
      if (imageUrl) row.image_url = imageUrl;

      var query = id
        ? sb.from('vehicle_issues').update(row).eq('id', id)
        : sb.from('vehicle_issues').insert(row);
      var res = await query;
      if (res.error) throw res.error;

      showStatus('masalah-status-msg', id ? 'Data masalah diperbarui.' : 'Masalah kendaraan tersimpan.', true);
      resetIssueForm();
      await loadIssues();
    } catch (err) {
      showStatus('masalah-status-msg', 'Gagal menyimpan: ' + err.message, false);
    } finally {
      btn.disabled = false;
    }
  }

  function renderIssuesList() {
    var ui = window.RavenmilleUI;
    var list = el('daftar-masalah-admin');
    if (!state.issues.length) {
      list.innerHTML = '<p style="color: #64748b;">Belum ada data masalah kendaraan.</p>';
      return;
    }

    list.innerHTML = state.issues.map(function (i) {
      var vehicleLabel = i.vehicles && i.vehicles.name ? i.vehicles.name : 'Model Umum';
      return (
        '<div class="admin-list-item">' +
          (i.image_url
            ? '<div class="kendaraan-image-wrapper admin-thumb">' + ui.renderKendaraanImage(i.image_url, i.name, 'Masalah') + '</div>'
            : '') +
          '<div class="admin-item-info">' +
            '<strong>' + ui.escapeHtml(i.name) + '</strong>' +
            '<small>' + ui.escapeHtml(vehicleLabel) + ' · ' + ui.escapeHtml(i.km || '-') + ' · ' + ui.escapeHtml(i.cost || '-') + '</small>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-edit-table="vehicle_issues" data-row-id="' + i.id + '">Edit</button>' +
            renderDeleteButton('vehicle_issues', i.id) +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  async function loadIssues() {
    if (!sb) return;
    var res = await sb.from('vehicle_issues').select('*, vehicles(name)').order('created_at', { ascending: false });
    state.issues = res.data || [];
    renderIssuesList();
  }

  /* ---------- INSPEKTOR ---------- */
  function resetInspectorForm() {
    el('inspektor-id').value = '';
    el('inspektor-nama').value = '';
    el('inspektor-kota').value = '';
    el('inspektor-telepon').value = '';
    el('inspektor-keahlian').value = '';
    el('inspektor-gambar').value = '';
    el('btn-simpan-inspektor').textContent = 'Simpan Inspektor';
    el('btn-batal-inspektor').hidden = true;
  }

  function editInspector(id) {
    var r = state.inspectors.find(function (x) { return String(x.id) === String(id); });
    if (!r) return;
    el('inspektor-id').value = r.id;
    el('inspektor-nama').value = r.name || '';
    el('inspektor-kota').value = r.city || '';
    el('inspektor-telepon').value = r.phone || '';
    el('inspektor-keahlian').value = Array.isArray(r.specialties) ? r.specialties.join(', ') : '';
    el('btn-simpan-inspektor').textContent = 'Perbarui Inspektor';
    el('btn-batal-inspektor').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveInspector() {
    if (!sb) return;
    var name = el('inspektor-nama').value.trim();
    if (!name) {
      showStatus('inspektor-status-msg', 'Nama inspektor wajib diisi.', false);
      return;
    }

    var id = el('inspektor-id').value;
    var file = el('inspektor-gambar').files[0];
    var btn = el('btn-simpan-inspektor');
    btn.disabled = true;

    try {
      var imageUrl;
      if (file) {
        imageUrl = await window.ravenmilleUploadImage(file, 'inspectors');
      }
      var row = {
        name: name,
        city: el('inspektor-kota').value.trim(),
        phone: el('inspektor-telepon').value.trim(),
        specialties: splitComma(el('inspektor-keahlian').value)
      };
      if (imageUrl) row.image_url = imageUrl;

      var res = id
        ? await sb.from('inspectors').update(row).eq('id', id)
        : await sb.from('inspectors').insert(row);

      var imageSchemaWarning = false;
      if (res.error && imageUrl && /image_url/i.test(res.error.message || '')) {
        delete row.image_url;
        res = id
          ? await sb.from('inspectors').update(row).eq('id', id)
          : await sb.from('inspectors').insert(row);
        imageSchemaWarning = true;
      }

      if (res.error) throw res.error;

      showStatus(
        'inspektor-status-msg',
        imageSchemaWarning
          ? 'Data teks tersimpan, tetapi kolom image_url belum ditambahkan pada tabel inspectors di Supabase.'
          : (id ? 'Inspektor diperbarui.' : 'Inspektor tersimpan.'),
        true
      );
      resetInspectorForm();
      await loadInspectors();
    } catch (err) {
      showStatus('inspektor-status-msg', 'Gagal menyimpan: ' + err.message, false);
    } finally {
      btn.disabled = false;
    }
  }

  function renderInspectorsList() {
    var ui = window.RavenmilleUI;
    var list = el('daftar-inspektor-admin');
    if (!state.inspectors.length) {
      list.innerHTML = '<p style="color: #64748b;">Belum ada data inspektor.</p>';
      return;
    }
    list.innerHTML = state.inspectors.map(function (r) {
      return (
        '<div class="admin-list-item">' +
          '<div class="admin-avatar-thumb">' +
            ui.renderProfileAvatar(r.image_url || r.avatar_url || r.photo_url, r.name, 'inspector') +
          '</div>' +
          '<div class="admin-item-info">' +
            '<strong>' + ui.escapeHtml(r.name) + '</strong>' +
            '<small>' + ui.escapeHtml(r.city || '-') + ' · WA ' + ui.escapeHtml(r.phone || '-') + '</small>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-edit-table="inspectors" data-row-id="' + r.id + '">Edit</button>' +
            renderDeleteButton('inspectors', r.id) +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  async function loadInspectors() {
    if (!sb) return;
    var res = await sb.from('inspectors').select('*').order('created_at', { ascending: false });
    state.inspectors = res.data || [];
    renderInspectorsList();
  }

  /* ---------- BENGKEL ---------- */
  function resetWorkshopForm() {
    el('bengkel-id').value = '';
    el('bengkel-nama').value = '';
    el('bengkel-kota').value = '';
    el('bengkel-telepon').value = '';
    el('bengkel-layanan').value = '';
    el('bengkel-gambar').value = '';
    el('btn-simpan-bengkel').textContent = 'Simpan Bengkel';
    el('btn-batal-bengkel').hidden = true;
  }

  function editWorkshop(id) {
    var r = state.workshops.find(function (x) { return String(x.id) === String(id); });
    if (!r) return;
    el('bengkel-id').value = r.id;
    el('bengkel-nama').value = r.name || '';
    el('bengkel-kota').value = r.city || '';
    el('bengkel-telepon').value = r.phone || '';
    el('bengkel-layanan').value = Array.isArray(r.services) ? r.services.join(', ') : '';
    el('btn-simpan-bengkel').textContent = 'Perbarui Bengkel';
    el('btn-batal-bengkel').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveWorkshop() {
    if (!sb) return;
    var name = el('bengkel-nama').value.trim();
    if (!name) {
      showStatus('bengkel-status-msg', 'Nama bengkel wajib diisi.', false);
      return;
    }

    var id = el('bengkel-id').value;
    var file = el('bengkel-gambar').files[0];
    var btn = el('btn-simpan-bengkel');
    btn.disabled = true;

    try {
      var imageUrl;
      if (file) {
        imageUrl = await window.ravenmilleUploadImage(file, 'workshops');
      }
      var row = {
        name: name,
        city: el('bengkel-kota').value.trim(),
        phone: el('bengkel-telepon').value.trim(),
        services: splitComma(el('bengkel-layanan').value)
      };
      if (imageUrl) row.image_url = imageUrl;

      var res = id
        ? await sb.from('workshops').update(row).eq('id', id)
        : await sb.from('workshops').insert(row);

      var imageSchemaWarning = false;
      if (res.error && imageUrl && /image_url/i.test(res.error.message || '')) {
        delete row.image_url;
        res = id
          ? await sb.from('workshops').update(row).eq('id', id)
          : await sb.from('workshops').insert(row);
        imageSchemaWarning = true;
      }

      if (res.error) throw res.error;

      showStatus(
        'bengkel-status-msg',
        imageSchemaWarning
          ? 'Data teks tersimpan, tetapi kolom image_url belum ditambahkan pada tabel workshops di Supabase.'
          : (id ? 'Bengkel diperbarui.' : 'Bengkel tersimpan.'),
        true
      );
      resetWorkshopForm();
      await loadWorkshops();
    } catch (err) {
      showStatus('bengkel-status-msg', 'Gagal menyimpan: ' + err.message, false);
    } finally {
      btn.disabled = false;
    }
  }

  function renderWorkshopsList() {
    var ui = window.RavenmilleUI;
    var list = el('daftar-bengkel-admin');
    if (!state.workshops.length) {
      list.innerHTML = '<p style="color: #64748b;">Belum ada data bengkel.</p>';
      return;
    }
    list.innerHTML = state.workshops.map(function (r) {
      return (
        '<div class="admin-list-item">' +
          '<div class="admin-avatar-thumb">' +
            ui.renderProfileAvatar(r.image_url || r.avatar_url || r.photo_url, r.name, 'workshop') +
          '</div>' +
          '<div class="admin-item-info">' +
            '<strong>' + ui.escapeHtml(r.name) + '</strong>' +
            '<small>' + ui.escapeHtml(r.city || '-') + ' · WA ' + ui.escapeHtml(r.phone || '-') + '</small>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-edit-table="workshops" data-row-id="' + r.id + '">Edit</button>' +
            renderDeleteButton('workshops', r.id) +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  async function loadWorkshops() {
    if (!sb) return;
    var res = await sb.from('workshops').select('*').order('created_at', { ascending: false });
    state.workshops = res.data || [];
    renderWorkshopsList();
  }

  /* ---------- BERITA ---------- */
  function resetNewsForm() {
    el('berita-id').value = '';
    el('berita-judul').value = '';
    el('berita-kategori').value = '';
    el('berita-ringkasan').value = '';
    el('berita-isi').value = '';
    el('berita-gambar').value = '';
    el('btn-simpan-berita').textContent = 'Simpan Berita';
    el('btn-batal-berita').hidden = true;
  }

  function editNews(id) {
    var r = state.news.find(function (x) { return String(x.id) === String(id); });
    if (!r) return;
    el('berita-id').value = r.id;
    el('berita-judul').value = r.title || '';
    el('berita-kategori').value = r.category || '';
    el('berita-ringkasan').value = r.excerpt || '';
    el('berita-isi').value = r.content || '';
    el('btn-simpan-berita').textContent = 'Perbarui Berita';
    el('btn-batal-berita').hidden = false;
  }

  async function saveNews() {
    if (!sb) return;
    var title = el('berita-judul').value.trim();
    var content = el('berita-isi').value.trim();
    if (!title || !content) {
      showStatus('berita-status-msg', 'Judul dan isi berita wajib diisi.', false);
      return;
    }

    var id = el('berita-id').value;
    var file = el('berita-gambar').files[0];
    var btn = el('btn-simpan-berita');
    btn.disabled = true;

    try {
      var imageUrl;
      if (file) {
        imageUrl = await window.ravenmilleUploadImage(file, 'news');
      }
      var row = {
        title: title,
        category: el('berita-kategori').value.trim() || 'BERITA',
        excerpt: el('berita-ringkasan').value.trim(),
        content: content
      };
      if (imageUrl) row.image_url = imageUrl;

      var res = id
        ? await sb.from('news').update(row).eq('id', id)
        : await sb.from('news').insert(row);
      if (res.error) throw res.error;

      showStatus('berita-status-msg', id ? 'Berita diperbarui.' : 'Berita tersimpan.', true);
      resetNewsForm();
      await loadNews();
    } catch (err) {
      showStatus('berita-status-msg', 'Gagal menyimpan: ' + err.message, false);
    } finally {
      btn.disabled = false;
    }
  }

  function renderNewsList() {
    var ui = window.RavenmilleUI;
    var list = el('daftar-berita-admin');
    if (!state.news.length) {
      list.innerHTML = '<p style="color: #64748b;">Belum ada berita tersimpan.</p>';
      return;
    }
    list.innerHTML = state.news.map(function (r) {
      return (
        '<div class="admin-list-item">' +
          (r.image_url
            ? '<div class="kendaraan-image-wrapper admin-thumb">' + ui.renderKendaraanImage(r.image_url, r.title, 'Berita') + '</div>'
            : '') +
          '<div class="admin-item-info">' +
            '<strong>' + ui.escapeHtml(r.title) + '</strong>' +
            '<small>' + ui.escapeHtml(r.category || 'BERITA') + ' · ' + ui.escapeHtml(ui.formatDateID(r.created_at)) + '</small>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<a href="detail-berita.html?id=' + encodeURIComponent(r.id) + '" class="btn btn-secondary btn-sm">Lihat</a>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-edit-table="news" data-row-id="' + r.id + '">Edit</button>' +
            renderDeleteButton('news', r.id) +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  async function loadNews() {
    if (!sb) return;
    var res = await sb.from('news').select('*').order('created_at', { ascending: false });
    state.news = res.data || [];
    renderNewsList();
  }

  /* ---------- KONSULTASI MASUK ---------- */
  function renderConsultationsList() {
    var ui = window.RavenmilleUI;
    var list = el('daftar-konsultasi-admin');
    if (!list) return;
    if (!state.consultations.length) {
      list.innerHTML = '<p style="color: #64748b;">Belum ada permintaan konsultasi masuk dari halaman Beranda (atau tabel <code>consultations</code> belum dibuat di Supabase).</p>';
      return;
    }
    list.innerHTML = state.consultations.map(function (c) {
      return (
        '<div class="admin-list-item">' +
          '<div class="admin-item-info">' +
            '<strong>' + ui.escapeHtml(c.name) + ' · ' + ui.escapeHtml(c.vehicle_interest) + '</strong>' +
            '<small>' + ui.escapeHtml(c.email) + ' · Tujuan: ' + ui.escapeHtml(c.goal || '-') + ' · ' + ui.escapeHtml(ui.formatDateID(c.created_at)) + '</small>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            renderDeleteButton('consultations', c.id) +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  async function loadConsultations() {
    if (!sb) return;
    var res = await sb.from('consultations').select('*').order('created_at', { ascending: false });
    state.consultations = res.error ? [] : (res.data || []);
    renderConsultationsList();
  }

  async function checkAllTablesStatus() {
    var container = el('supabase-schema-status');
    if (!container || typeof window.ravenmilleCheckTable !== 'function') return;
    var tables = [
      { key: 'vehicles', label: 'Katalog Kendaraan' },
      { key: 'vehicle_issues', label: 'Masalah Khas' },
      { key: 'inspectors', label: 'Direktori Inspektor' },
      { key: 'workshops', label: 'Direktori Bengkel' },
      { key: 'news', label: 'Berita & Artikel' },
      { key: 'consultations', label: 'Konsultasi Masuk' },
      { key: 'tco_simulations', label: 'Log Simulasi TCO' },
      { key: 'risk_assessments', label: 'Log Analisis Risiko' }
    ];

    container.innerHTML = '<div class="status-banner is-info" style="grid-column: 1 / -1;">Memeriksa koneksi tabel Supabase...</div>';

    var checks = await Promise.all(tables.map(async function (t) {
      var res = await window.ravenmilleCheckTable(t.key);
      return { table: t, status: res };
    }));

    container.innerHTML = checks.map(function (c) {
      var ok = c.status.ready;
      return (
        '<div class="kartu-sekunder" style="padding: 14px; border-color:' + (ok ? '#047857' : '#b45309') + ';">' +
          '<div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color:' + (ok ? '#047857' : '#b45309') + ';">' +
            (ok ? 'Terhubung' : 'Belum Siap') +
          '</div>' +
          '<strong style="display: block; font-size: 0.875rem; color: #162447; margin-top: 4px;">' + c.table.label + '</strong>' +
          '<small style="display: block; font-size: 0.75rem; color: #64748b; margin-top: 2px;">Tabel: <code>' + c.table.key + '</code>' + (ok ? ' (' + c.status.count + ' baris)' : '') + '</small>' +
        '</div>'
      );
    }).join('');
  }

  async function refreshAll() {
    await Promise.all([
      loadVehicles(),
      loadInspectors(),
      loadWorkshops(),
      loadNews(),
      loadConsultations(),
      checkAllTablesStatus()
    ]);
  }

  function rerenderCurrentLists() {
    renderVehiclesList();
    renderIssuesList();
    renderInspectorsList();
    renderWorkshopsList();
    renderNewsList();
    renderConsultationsList();
  }

  document.addEventListener('DOMContentLoaded', function () {
    sb = window.RAVENMILLE_SUPABASE;
    if (!sb) {
      el('supabase-config-warning').hidden = false;
    }

    document.querySelectorAll('[data-admin-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTab(btn.getAttribute('data-admin-tab'));
      });
    });

    el('btn-simpan-kendaraan').addEventListener('click', saveVehicle);
    el('btn-batal-kendaraan').addEventListener('click', resetVehicleForm);

    el('btn-simpan-masalah').addEventListener('click', saveIssue);
    el('btn-batal-masalah').addEventListener('click', resetIssueForm);

    el('btn-simpan-inspektor').addEventListener('click', saveInspector);
    el('btn-batal-inspektor').addEventListener('click', resetInspectorForm);

    el('btn-simpan-bengkel').addEventListener('click', saveWorkshop);
    el('btn-batal-bengkel').addEventListener('click', resetWorkshopForm);

    el('btn-simpan-berita').addEventListener('click', saveNews);
    el('btn-batal-berita').addEventListener('click', resetNewsForm);

    if (el('btn-cek-supabase')) {
      el('btn-cek-supabase').addEventListener('click', checkAllTablesStatus);
    }
    if (el('btn-muat-ulang-admin')) {
      el('btn-muat-ulang-admin').addEventListener('click', refreshAll);
    }
    if (el('btn-salin-sql-supabase')) {
      el('btn-salin-sql-supabase').addEventListener('click', function () {
        var btn = el('btn-salin-sql-supabase');
        var sqlText = el('supabase-sql-schema') ? el('supabase-sql-schema').textContent : '';
        if (navigator.clipboard && navigator.clipboard.writeText && sqlText) {
          navigator.clipboard.writeText(sqlText).then(function () {
            btn.textContent = 'Skema SQL Tersalin';
            setTimeout(function () { btn.textContent = 'Salin Skema SQL'; }, 2200);
          });
        }
      });
    }

    document.body.addEventListener('click', async function (e) {
      var editBtn = e.target.closest('[data-edit-table]');
      if (editBtn) {
        var table = editBtn.getAttribute('data-edit-table');
        var id = editBtn.getAttribute('data-row-id');
        if (table === 'vehicles') editVehicle(id);
        else if (table === 'vehicle_issues') editIssue(id);
        else if (table === 'inspectors') editInspector(id);
        else if (table === 'workshops') editWorkshop(id);
        else if (table === 'news') editNews(id);
        return;
      }

      var askBtn = e.target.closest('[data-ask-delete]');
      if (askBtn) {
        state.pendingDeleteKey = askBtn.getAttribute('data-ask-delete') + ':' + askBtn.getAttribute('data-row-id');
        rerenderCurrentLists();
        return;
      }

      if (e.target.closest('[data-cancel-delete]')) {
        state.pendingDeleteKey = null;
        rerenderCurrentLists();
        return;
      }

      var confirmBtn = e.target.closest('[data-confirm-delete]');
      if (confirmBtn && sb) {
        var delTable = confirmBtn.getAttribute('data-confirm-delete');
        var delId = confirmBtn.getAttribute('data-row-id');
        state.pendingDeleteKey = null;
        await sb.from(delTable).delete().eq('id', delId);
        await refreshAll();
      }
    });

    refreshAll();
  });
})();
