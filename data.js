/**
 * Ayat v2 — Verse Data
 * Each section contains metadata for display and Quran API audio fetching.
 * Audio: api.alquran.cloud using Mishary Al-Afasy (ar.alafasy)
 */

const AUDIO_EDITION = 'ar.alafasy';
const API_BASE = 'https://api.alquran.cloud/v1';

const SECTIONS = [
  {
    id: 'muawwidhataan',
    titleAr: 'المعوذتان',
    subtitleAr: 'سورة الفلق + سورة الناس',
    icon: '🌙',
    color: '#10b981',
    ayahs: [
      { surah: 113, start: 1, end: 5, label: 'سورة الفلق' },
      { surah: 114, start: 1, end: 6, label: 'سورة الناس' },
    ],
    repeat: 3,
    repeatLabel: '(تُقرأ ٣ مرات)',
  },
  {
    id: 'fatiha',
    titleAr: 'سورة الفاتحة',
    subtitleAr: 'أم الكتاب',
    icon: '✨',
    color: '#f59e0b',
    ayahs: [
      { surah: 1, start: 1, end: 7, label: 'سورة الفاتحة' },
    ],
    repeat: 7,
    repeatLabel: '(تُقرأ ٧ مرات)',
  },
  {
    id: 'ayat-kursi',
    titleAr: 'آية الكرسي',
    subtitleAr: 'البقرة : ٢٥٥',
    icon: '🕌',
    color: '#6366f1',
    ayahs: [
      { surah: 2, start: 255, end: 255, label: 'آية الكرسي' },
    ],
    repeat: 1,
    repeatLabel: null,
  },
  {
    id: 'akhir-baqarah',
    titleAr: 'آخر آيتين من سورة البقرة',
    subtitleAr: 'البقرة : ٢٨٥ – ٢٨٦',
    icon: '📖',
    color: '#8b5cf6',
    ayahs: [
      { surah: 2, start: 285, end: 286, label: 'خاتمة سورة البقرة' },
    ],
    repeat: 1,
    repeatLabel: null,
  },
  {
    id: 'hasad',
    titleAr: 'آيات الحسد',
    subtitleAr: 'القلم : ٥١ – ٥٢',
    icon: '🛡️',
    color: '#ec4899',
    ayahs: [
      { surah: 68, start: 51, end: 52, label: 'سورة القلم' },
    ],
    repeat: 1,
    repeatLabel: null,
  },
];

// Construct full ayah number range for Quran API
function buildAyahRange(surah, start, end) {
  const range = [];
  for (let i = start; i <= end; i++) {
    range.push({ surah, ayah: i });
  }
  return range;
}

// Build audio URL from Quran API response ayah object
function getAudioUrl(ayah) {
  return ayah.audio || `https://cdn.islamic.network/quran/audio/128/${AUDIO_EDITION}/${ayah.number}.mp3`;
}
