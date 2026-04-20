/**
 * Ayat v2 — Main Application Logic
 * Islamic Ruqyah & Protection Verses
 */

'use strict';

// ══════════════════════════════════════════════
// QURAN API MODULE
// ══════════════════════════════════════════════

const QuranAPI = (() => {
  const BASE = 'https://api.alquran.cloud/v1';
  const EDITION = 'ar.alafasy';
  const AUDIO_CDN = 'https://everyayah.com/data/Alafasy_128kbps';
  const cache = new Map();

  async function fetchAyahs(surah, start, end) {
    const key = `${surah}:${start}-${end}`;
    if (cache.has(key)) return cache.get(key);

    try {
      const response = await fetch(`${BASE}/surah/${surah}/${EDITION}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.code !== 200) throw new Error('API error');

      const ayahs = data.data.ayahs
        .filter(a => a.numberInSurah >= start && a.numberInSurah <= end)
        .map(a => ({
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: a.text,
          audio: a.audio || buildCdnUrl(surah, a.numberInSurah),
          surah: surah,
        }));

      cache.set(key, ayahs);
      return ayahs;
    } catch (err) {
      console.warn(`API fetch failed for ${key}, using CDN fallback:`, err);
      // Fallback: built-in text, CDN audio
      return buildFallbackAyahs(surah, start, end);
    }
  }

  function buildFallbackAyahs(surah, start, end) {
    const ayahs = [];
    for (let i = start; i <= end; i++) {
      const globalNum = getGlobalAyahNumber(surah, i);
      ayahs.push({
        number: globalNum,
        numberInSurah: i,
        text: FALLBACK_TEXTS[`${surah}:${i}`] || '...',
        audio: buildCdnUrl(surah, i),
        surah,
      });
    }
    return ayahs;
  }

  // everyayah.com uses zero-padded format: SSSAAA (surah 3-digit, ayah 3-digit)
  function buildCdnUrl(surah, ayah) {
    const s = String(surah).padStart(3, '0');
    const a = String(ayah).padStart(3, '0');
    return `${AUDIO_CDN}/${s}${a}.mp3`;
  }

  return { fetchAyahs };
})();


// ══════════════════════════════════════════════
// FALLBACK ARABIC TEXTS (built-in)
// ══════════════════════════════════════════════

const FALLBACK_TEXTS = {
  // Al-Fatihah
  '1:1': 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  '1:2': 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
  '1:3': 'الرَّحْمَٰنِ الرَّحِيمِ',
  '1:4': 'مَالِكِ يَوْمِ الدِّينِ',
  '1:5': 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
  '1:6': 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
  '1:7': 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
  // Ayatul Kursi
  '2:255': 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  // Al-Baqarah 285-286
  '2:285': 'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ',
  '2:286': 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
  // Al-Qalam 51-52
  '68:51': 'وَإِن يَكَادُ الَّذِينَ كَفَرُوا لَيُزْلِقُونَكَ بِأَبْصَارِهِمْ لَمَّا سَمِعُوا الذِّكْرَ وَيَقُولُونَ إِنَّهُ لَمَجْنُونٌ',
  '68:52': 'وَمَا هُوَ إِلَّا ذِكْرٌ لِّلْعَالَمِينَ',
  // Al-Falaq
  '113:1': 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
  '113:2': 'مِن شَرِّ مَا خَلَقَ',
  '113:3': 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
  '113:4': 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
  '113:5': 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  // An-Nas
  '114:1': 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
  '114:2': 'مَلِكِ النَّاسِ',
  '114:3': 'إِلَٰهِ النَّاسِ',
  '114:4': 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
  '114:5': 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
  '114:6': 'مِنَ الْجِنَّةِ وَالنَّاسِ',
};


// ══════════════════════════════════════════════
// AUDIO PLAYER MODULE
// ══════════════════════════════════════════════

const AudioPlayer = (() => {
  let audio = new Audio();
  let queue = [];          // array of audio URLs
  let currentIndex = 0;
  let isPlaying = false;
  let onEndCallback = null;

  const elPlay = document.getElementById('btn-play');
  const elPrev = document.getElementById('btn-prev-section');
  const elNext = document.getElementById('btn-next-section');
  const elProgressFill = document.getElementById('progress-fill');
  const elProgressBar = document.getElementById('progress-bar');
  const elTimeElapsed = document.getElementById('time-elapsed');
  const elTimeTotal = document.getElementById('time-total');
  const elVerseIndicator = document.getElementById('verse-indicator');
  const elVolume = document.getElementById('volume-slider');
  const elVolumeIcon = document.getElementById('volume-icon');
  const elFetchingStatus = document.getElementById('fetching-status');
  const elSectionName = document.getElementById('player-section-name');

  function formatTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function updatePlayIcon() {
    elPlay.innerHTML = isPlaying
      ? '<i class="fas fa-pause"></i>'
      : '<i class="fas fa-play"></i>';
    elPlay.classList.remove('loading');
  }

  function setLoading(state) {
    if (state) {
      elPlay.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      elPlay.classList.add('loading');
    } else {
      updatePlayIcon();
    }
  }

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    elProgressFill.style.width = `${pct}%`;
    elTimeElapsed.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    elTimeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    currentIndex++;
    if (currentIndex < queue.length) {
      playIndex(currentIndex);
    } else {
      isPlaying = false;
      currentIndex = 0;
      updatePlayIcon();
      if (onEndCallback) onEndCallback();
    }
  });

  audio.addEventListener('playing', () => {
    setLoading(false);
    isPlaying = true;
    updatePlayIcon();
  });

  audio.addEventListener('waiting', () => {
    setLoading(true);
  });

  audio.addEventListener('error', () => {
    console.warn('Audio error, skipping:', queue[currentIndex]);
    currentIndex++;
    if (currentIndex < queue.length) playIndex(currentIndex);
    else {
      isPlaying = false;
      updatePlayIcon();
    }
  });

  function playIndex(i) {
    currentIndex = i;
    audio.src = queue[i];
    elVerseIndicator.textContent = `آية ${i + 1} / ${queue.length}`;
    
    // Highlight currently playing verse
    document.querySelectorAll('.ayah.playing').forEach(el => el.classList.remove('playing'));
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
      const activeAyah = activeSection.querySelector(`.ayah[data-idx="${i}"]`);
      if (activeAyah) {
        activeAyah.classList.add('playing');
        // Optional: Ensure it flashes briefly to draw attention
        activeAyah.style.animation = 'none';
        activeAyah.offsetHeight; /* trigger reflow */
        activeAyah.style.animation = null;
      }
    }

    setLoading(true);
    audio.play().catch(() => {
      isPlaying = false;
      updatePlayIcon();
    });
  }

  function togglePlay() {
    if (queue.length === 0) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      updatePlayIcon();
    } else {
      // If no src loaded yet (first play), load the track first
      if (!audio.src || audio.src === window.location.href) {
        playIndex(currentIndex);
      } else {
        isPlaying = true;
        audio.play().catch(() => {
          isPlaying = false;
          updatePlayIcon();
        });
      }
    }
  }

  function loadSection(ayahs, sectionName, autoPlay = false) {
    audio.pause();
    isPlaying = false;
    currentIndex = 0;
    queue = ayahs.map(a => a.audio);
    elSectionName.textContent = sectionName;
    elVerseIndicator.textContent = `${ayahs.length} آيات`;
    elProgressFill.style.width = '0%';
    elTimeElapsed.textContent = '0:00';
    elTimeTotal.textContent = '0:00';
    // Pre-load src so play button works immediately on first click
    if (queue.length > 0) {
      audio.src = queue[0];
      audio.load();
    }
    updatePlayIcon();
    if (autoPlay && queue.length > 0) {
      playIndex(0);
    }
  }

  function setOnEnd(cb) {
    onEndCallback = cb;
  }

  function showFetching(show) {
    elFetchingStatus.style.display = show ? 'flex' : 'none';
  }

  // Progress bar seek
  elProgressBar.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = elProgressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  // Volume
  audio.volume = 0.9;
  elVolume.value = 90;
  elVolume.addEventListener('input', () => {
    audio.volume = elVolume.value / 100;
    elVolumeIcon.className = audio.volume === 0 ? 'fas fa-volume-mute volume-icon' : 'fas fa-volume-up volume-icon';
  });

  elVolumeIcon.addEventListener('click', () => {
    audio.muted = !audio.muted;
    elVolumeIcon.className = audio.muted ? 'fas fa-volume-mute volume-icon' : 'fas fa-volume-up volume-icon';
  });

  // Key: Space
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      togglePlay();
    }
  });

  elPlay.addEventListener('click', togglePlay);

  return {
    loadSection,
    togglePlay,
    setOnEnd,
    showFetching,
    playIndex: (i) => {
      if (i >= 0 && i < queue.length) playIndex(i);
    },
    playNext: () => {
      currentIndex++;
      if (currentIndex < queue.length) playIndex(currentIndex);
    },
    stop: () => {
      audio.pause();
      isPlaying = false;
      updatePlayIcon();
    },
  };
})();


// ══════════════════════════════════════════════
// SECTION MANAGER
// ══════════════════════════════════════════════

const SectionManager = (() => {
  let currentIndex = 0;
  let isScrolling = false;
  let sectionAyahs = [];  // cached ayahs per section

  const scrollContainer = document.getElementById('scroll-container');
  const sectionEls = document.querySelectorAll('.section');
  const navDots = document.querySelectorAll('.nav-dot');
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const progressLine = document.getElementById('progress-line');

  function updateUI(idx) {
    // Progress bar
    const pct = sectionEls.length > 1
      ? (idx / (sectionEls.length - 1)) * 100
      : 100;
    progressLine.style.width = `${pct}%`;

    // Dots
    navDots.forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });

    // Arrows
    btnUp.disabled = idx === 0;
    btnDown.disabled = idx === sectionEls.length - 1;

    // Active section class
    sectionEls.forEach((s, i) => {
      s.classList.toggle('active', i === idx);
      s.classList.remove('entering');
      if (i === idx) {
        setTimeout(() => s.classList.add('entering'), 50);
      }
    });
  }

  async function goTo(idx, autoPlayAudio = false) {
    if (idx < 0 || idx >= sectionEls.length || isScrolling) return;
    isScrolling = true;
    currentIndex = idx;

    const target = sectionEls[idx];
    scrollContainer.scrollTo({
      top: target.offsetTop,
      behavior: 'smooth',
    });

    updateUI(idx);

    // Load audio for this section
    const sectionData = SECTIONS[idx];
    if (sectionData && sectionAyahs[idx]) {
      AudioPlayer.loadSection(sectionAyahs[idx], sectionData.titleAr, autoPlayAudio);
    }

    setTimeout(() => { isScrolling = false; }, 700);
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  // Wheel navigation
  let wheelTimer = null;
  scrollContainer.addEventListener('wheel', e => {
    e.preventDefault();
    if (isScrolling) return;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      if (e.deltaY > 0) next();
      else prev();
    }, 50);
  }, { passive: false });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.code === 'ArrowDown' || e.code === 'PageDown') { e.preventDefault(); next(); }
    if (e.code === 'ArrowUp' || e.code === 'PageUp') { e.preventDefault(); prev(); }
  });

  // Touch navigation
  let touchStartY = 0;
  scrollContainer.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  scrollContainer.addEventListener('touchend', e => {
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) {
      if (dy > 0) next();
      else prev();
    }
  }, { passive: true });

  // Arrow buttons
  btnDown.addEventListener('click', next);
  btnUp.addEventListener('click', prev);

  // Section nav buttons (player)
  document.getElementById('btn-prev-section').addEventListener('click', prev);
  document.getElementById('btn-next-section').addEventListener('click', () => {
    goTo(currentIndex + 1, true);
  });

  // Dot navigation
  navDots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  // IntersectionObserver for fade-in
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.3, root: scrollContainer });

  sectionEls.forEach(s => observer.observe(s));

  function cacheAyahs(idx, ayahs) {
    sectionAyahs[idx] = ayahs;
  }

  function getAyahs(idx) {
    return sectionAyahs[idx] || [];
  }

  function init() {
    updateUI(0);
  }

  return { goTo, next, prev, cacheAyahs, getAyahs, init, getCurrent: () => currentIndex };
})();


// ══════════════════════════════════════════════
// APP INIT — Fetch texts + build DOM
// ══════════════════════════════════════════════

async function buildSection(sectionEl, sectionData) {
  const contentEl = sectionEl.querySelector('.verse-content');
  if (!contentEl) return [];

  contentEl.innerHTML = '';
  const allAyahs = [];

  for (const group of sectionData.ayahs) {
    const groupEl = document.createElement('div');
    groupEl.className = 'verse-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'group-label';
    labelEl.textContent = group.label;
    groupEl.appendChild(labelEl);

    const textEl = document.createElement('div');
    textEl.className = 'arabic-text loading';
    textEl.textContent = 'جاري التحميل...';
    groupEl.appendChild(textEl);
    contentEl.appendChild(groupEl);

    const startIdx = allAyahs.length;
    const ayahs = await QuranAPI.fetchAyahs(group.surah, group.start, group.end);
    allAyahs.push(...ayahs);

    // Build text with ayah markers using ornate parentheses ﴿ ﴾
    textEl.innerHTML = ayahs.map((a, i) => {
      let text = a.text;
      // Remove Bismillah from the first verse except Surah Al-Fatihah
      if (group.surah !== 1 && a.numberInSurah === 1) {
        text = text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '')
                   .replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, '')
                   .trim();
      }
      return `<span class="ayah" data-idx="${startIdx + i}" title="انقر للاستماع للآية">${text} <span class="ayah-num">﴿${toArabicNum(a.numberInSurah)}﴾</span></span>`;
    }).join(' ');
    textEl.classList.remove('loading');
  }

  // Click listener for verses
  contentEl.addEventListener('click', async (e) => {
    const ayahSpan = e.target.closest('.ayah');
    if (!ayahSpan) return;
    
    const idx = parseInt(ayahSpan.getAttribute('data-idx'), 10);
    const sectionIdx = parseInt(sectionEl.getAttribute('data-section-idx'), 10);
    
    if (SectionManager.getCurrent() !== sectionIdx) {
      await SectionManager.goTo(sectionIdx);
      setTimeout(() => AudioPlayer.playIndex(idx), 300);
    } else {
      AudioPlayer.playIndex(idx);
    }
  });

  return allAyahs;
}

function toArabicNum(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function setLoaderProgress(pct) {
  const fill = document.getElementById('loader-bar-fill');
  if (fill) fill.style.width = `${pct}%`;
}

async function initApp() {
  const overlay = document.getElementById('loading-overlay');
  const sectionEls = document.querySelectorAll('.section[data-section-idx]');

  setLoaderProgress(10);

  // Pre-fetch all section data
  for (let i = 0; i < SECTIONS.length; i++) {
    const sectionEl = document.querySelector(`[data-section-idx="${i}"]`);
    if (!sectionEl) continue;

    const sectionData = SECTIONS[i];

    // Set accent color
    sectionEl.style.setProperty('--accent', sectionData.color);

    const ayahs = await buildSection(sectionEl, sectionData);
    SectionManager.cacheAyahs(i, ayahs);

    setLoaderProgress(10 + ((i + 1) / SECTIONS.length) * 80);
  }

  setLoaderProgress(100);

  // Load first section audio from cache (already fetched in buildSection loop)
  const firstSection = SECTIONS[0];
  const cachedSection0 = SectionManager.getAyahs(0);
  AudioPlayer.loadSection(cachedSection0, firstSection.titleAr, false);

  // Auto-advance audio to next section
  AudioPlayer.setOnEnd(() => {
    const next = SectionManager.getCurrent() + 1;
    if (next < SECTIONS.length) {
      SectionManager.goTo(next, true);
    }
  });

  // Hide overlay
  setTimeout(() => {
    overlay.classList.add('hidden');
    SectionManager.init();
    
    // Auto-play the first verse. 
    // Browser might block this if the user hasn't interacted with the document yet.
    setTimeout(() => {
      AudioPlayer.togglePlay();
    }, 300);
  }, 400);
}

// ── Start ──
document.addEventListener('DOMContentLoaded', initApp);
