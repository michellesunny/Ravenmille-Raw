const SUPABASE_URL = 'https://ibrynhidfiqbvirasqul.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_SU67SAN1WwLBQK94-srzPA_LxV1mfuo';

window.RAVENMILLE_SUPABASE = null;
(function () {
    const belumDiisi = SUPABASE_URL.includes('GANTI-DENGAN') || SUPABASE_ANON_KEY.includes('GANTI-DENGAN');
    if (belumDiisi || !window.supabase) {
        console.warn('[Ravenmille] Supabase belum dikonfigurasi — memakai data lokal (fallback).');
        return;
    }
    window.RAVENMILLE_SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();

window.ravenmilleUploadImage = async function (file, folder) {
    if (!window.RAVENMILLE_SUPABASE) throw new Error('Supabase belum dikonfigurasi');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const { error } = await window.RAVENMILLE_SUPABASE.storage
        .from('vehicle-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return window.RAVENMILLE_SUPABASE.storage.from('vehicle-images').getPublicUrl(path).data.publicUrl;
};