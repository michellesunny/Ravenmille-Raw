/* ==========================================================================
   Ravenmille – Konfigurasi & Utilitas Supabase Client
   Menggunakan proyek Supabase yang sudah ada beserta helper aman per tabel.
   ========================================================================== */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://ibrynhidfiqbvirasqul.supabase.co/';
  var SUPABASE_ANON_KEY = 'sb_publishable_SU67SAN1WwLBQK94-srzPA_LxV1mfuo';
  var STORAGE_BUCKET = 'vehicle-images';

  window.RAVENMILLE_SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    bucket: STORAGE_BUCKET
  };

  window.RAVENMILLE_SUPABASE = null;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.RAVENMILLE_SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  window.ravenmilleUploadImage = async function (file, folder) {
    if (!window.RAVENMILLE_SUPABASE) {
      throw new Error('Koneksi Supabase belum tersedia.');
    }
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var filePath = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    var uploadResult = await window.RAVENMILLE_SUPABASE.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    return window.RAVENMILLE_SUPABASE.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath).data.publicUrl;
  };

  window.ravenmilleSafeInsert = async function (tableName, payload) {
    if (!window.RAVENMILLE_SUPABASE) {
      return { ok: false, skipped: true };
    }
    try {
      var res = await window.RAVENMILLE_SUPABASE.from(tableName).insert(payload);
      if (res.error) {
        return { ok: false, error: res.error };
      }
      return { ok: true, data: res.data };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  window.ravenmilleCheckTable = async function (tableName) {
    if (!window.RAVENMILLE_SUPABASE) {
      return { ready: false, count: 0, error: 'SDK Supabase tidak dimuat' };
    }
    try {
      var res = await window.RAVENMILLE_SUPABASE
        .from(tableName)
        .select('id', { count: 'exact', head: true });
      if (res.error) {
        return { ready: false, count: 0, error: res.error.message };
      }
      return { ready: true, count: res.count || 0 };
    } catch (err) {
      return { ready: false, count: 0, error: err.message || 'Gagal menghubungi Supabase' };
    }
  };
})();
