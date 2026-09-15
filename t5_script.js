/**
 * Wedding T5: premium monochrome invitation with envelope opener.
 */
(function () {
  'use strict';

  // Dev skips (keep false for production flow). Priority: details > hero > envelope.
  var DEV_SKIP_TO_DETAILS = false;
  var DEV_SKIP_TO_HERO = false;
  var DEV_HOLD_ON_MONOGRAM = false;

  var body = document.body;
  if (!body) return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEAL_GLOW_MS = prefersReducedMotion ? 0 : 1500;
  var SEAL_DROP_MS = prefersReducedMotion ? 0 : 900;
  var INTERSTITIAL_START_MS = SEAL_GLOW_MS + SEAL_DROP_MS + (prefersReducedMotion ? 0 : 420);
  var INTERSTITIAL_DURATION_MS = prefersReducedMotion ? 60 : 2200;
  var BUTTERFLY_FADE_MS = prefersReducedMotion ? 0 : 1150;
  var LETTER_FADE_DELAY_MS = prefersReducedMotion ? 0 : 450;
  var LETTER_FADE_MS = prefersReducedMotion ? 0 : 950;
  var MONOGRAM_HOLD_MS = prefersReducedMotion ? 0 : 1000;
  var MONOGRAM_FADE_MS = prefersReducedMotion ? 0 : 1100;
  var DECOR_HOLD_MS = prefersReducedMotion ? 0 : 900;
  var TITLE_REVEAL_MS = prefersReducedMotion ? 0 : 1050;
  var SUBTITLE_REVEAL_MS = prefersReducedMotion ? 0 : 1050;
  var RING_REVEAL_MS = prefersReducedMotion ? 0 : 1100;
  var NAME_REVEAL_DELAY_MS = prefersReducedMotion ? 0 : 220;
  var DATE_DECOR_FADE_MS = prefersReducedMotion ? 0 : 1050;
  var DATE_TYPE_MS = prefersReducedMotion ? 0 : 48;
  var NAME_TYPE_MS = prefersReducedMotion ? 0 : 110;
  var COUPLE_SKETCH_MS = prefersReducedMotion ? 0 : 1050;
  var COUPLE_META_MS = prefersReducedMotion ? 0 : 850;
  var PAGE_TURN_MS = prefersReducedMotion ? 0 : 980;

  var scenes = {
    envelope: document.getElementById('wed5-scene-envelope'),
    interstitial: document.getElementById('wed5-scene-interstitial'),
    hero: document.getElementById('wed5-scene-hero'),
    details: document.getElementById('wed5-scene-details')
  };

  var envelope = document.getElementById('wed5-envelope');
  var openBtn = document.getElementById('wed5-open-btn');
  var openNote = document.getElementById('wed5-open-note');
  var envelopeNames = document.getElementById('wed5-envelope-names');
  var saveDateText = document.getElementById('wed5-save-date-text');
  var monogramGroom = document.getElementById('wed5-monogram-groom');
  var monogramBride = document.getElementById('wed5-monogram-bride');
  var monogramBlock = document.getElementById('wed5-monogram-block');
  var namesBlock = document.getElementById('wed5-names-block');
  var heroSheet = document.getElementById('wed5-hero-sheet');
  var groomNameEl = document.getElementById('wed5-groom-name');
  var brideNameEl = document.getElementById('wed5-bride-name');
  var ampEl = document.getElementById('wed5-name-amp');
  var namesDateEl = document.getElementById('wed5-names-date');
  var continueBtn = document.getElementById('wed5-continue-btn');
  var backBtn = document.getElementById('wed5-back-btn');
  var heroFooter = document.getElementById('wed5-hero-footer');
  var detailsSpread = document.getElementById('wed5-details-spread');
  var coupleColumns = document.getElementById('wed5-couple-columns');
  var detailGroomNameEl = document.getElementById('wed5-detail-groom-name');
  var detailBrideNameEl = document.getElementById('wed5-detail-bride-name');
  var mapLinkEl = document.getElementById('wed5-map-link');
  var audio = document.getElementById('wed5-music');
  var muteBtn = document.getElementById('wed5-mute-btn');
  var pageRoot = document.getElementById('wed5-page') || document.querySelector('.wed5-page');
  var pointerTrail = document.getElementById('wed5-pointer-trail');

  var introStarted = false;
  var heroStarted = false;
  var detailsOpened = false;
  var detailsIntroCompleted = false;
  var pointerTrailInit = false;
  var lastTrailAt = 0;
  var lastTrailX = 0;
  var lastTrailY = 0;

  function getAttr(name, fallback) {
    var val = body.getAttribute(name);
    if (val === null || val === '') return fallback;
    return val;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHtml(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  function formatParentLinesHtml(value) {
    if (!value) return '';
    var parts;
    if (value.indexOf('|') !== -1) {
      parts = value.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    } else if (value.indexOf('&') !== -1) {
      parts = value.split('&').map(function (s) { return s.trim(); }).filter(Boolean);
    } else {
      return '<span class="wed5-parent-line">' + value + '</span>';
    }
    return parts.map(function (part) {
      return '<span class="wed5-parent-line">' + part + '</span>';
    }).join('');
  }

  function formatBlessingsNames(value) {
    var text = (value || '').trim();
    return text.replace(/^best wishes from\s+/i, '').trim();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function splitBlessingsNames(value) {
    return formatBlessingsNames(value)
      .split(/,|&/)
      .map(function (part) { return part.trim(); })
      .filter(Boolean);
  }

  function hydrateBlessingsNames() {
    var el = document.getElementById('wed5-blessings-text');
    if (!el) return;
    var names = splitBlessingsNames(getAttr('data-blessings', ''));
    el.classList.remove('is-names-in');
    if (!names.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = names.map(function (name, index) {
      var html = '<span class="wed5-blessings-name" style="--i:' + index + '">' + escapeHtml(name) + '</span>';
      if (index >= names.length - 1) return html;
      var sep = index === names.length - 2 ? '&amp;' : ',';
      return html + '<span class="wed5-blessings-sep" style="--i:' + index + '">' + sep + '</span>';
    }).join('');
  }

  function playBlessingsNamesAnim() {
    var el = document.getElementById('wed5-blessings-text');
    if (!el) return;
    el.classList.remove('is-names-in');
    if (prefersReducedMotion) {
      el.classList.add('is-names-in');
      return;
    }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        el.classList.add('is-names-in');
      });
    });
  }

  function setDisplayTitle(value) {
    var line1 = document.getElementById('wed5-title-line-1');
    var line2 = document.getElementById('wed5-title-line-2');
    var title = (value || 'Wedding Ceremony').trim();
    var parts = title.split(/\s+/);
    var custom1 = getAttr('data-display-title-line-1', '');
    var custom2 = getAttr('data-display-title-line-2', '');
    var first;
    var rest;
    if (custom1 || custom2) {
      first = custom1 || parts[0] || 'Wedding';
      rest = custom2 || '';
    } else {
      first = parts[0] || 'Wedding';
      rest = parts.slice(1).join(' ') || 'Ceremony';
    }

    if (line1 && line2) {
      var butterfly = document.getElementById('wed5-details-butterfly');
      if (first.indexOf('&') !== -1) {
        line1.innerHTML = escapeHtml(first).replace(
          /\s*&amp;\s*/g,
          ' <span class="wed5-title-amp">&amp;</span> '
        );
      } else {
        line1.textContent = first;
      }
      if (butterfly) line1.appendChild(butterfly);
      line2.textContent = rest;
      return;
    }

    setText('wed5-display-title', title);
  }

  function capitalize(name) {
    var value = (name || '').trim();
    if (!value) return '';
    return value;
  }

  function parseDateOnly(raw) {
    if (!raw) return null;
    var parsed = new Date(raw + 'T00:00:00');
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  }

  function getDateObject() {
    return parseDateOnly(getAttr('data-event-date', ''));
  }

  function getCalendarMarkDates() {
    var marks = [];
    var primary = getDateObject();
    if (primary) marks.push(primary);

    var extra = getAttr('data-calendar-mark-dates', '');
    if (extra) {
      extra.split(',').forEach(function (part) {
        var d = parseDateOnly(part.trim());
        if (!d) return;
        var dup = marks.some(function (m) {
          return m.toDateString() === d.toDateString();
        });
        if (!dup) marks.push(d);
      });
    }

    marks.sort(function (a, b) {
      return a.getTime() - b.getTime();
    });
    return marks;
  }

  function formatEventDate() {
    var d = getDateObject();
    if (!d) return '';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function isBrideFirst() {
    return getAttr('data-bride-first', '') === 'true';
  }

  function applyBrideFirstOrder() {
    if (!isBrideFirst()) return;
    body.classList.add('wed5-bride-first');

    var namesCopy = namesBlock ? namesBlock.querySelector('.wed5-names-copy') : null;
    if (namesCopy && groomNameEl && brideNameEl) {
      var groomIndex = Array.prototype.indexOf.call(namesCopy.children, groomNameEl);
      var brideIndex = Array.prototype.indexOf.call(namesCopy.children, brideNameEl);
      if (groomIndex !== -1 && brideIndex !== -1 && groomIndex < brideIndex) {
        namesCopy.insertBefore(brideNameEl, groomNameEl);
        if (ampEl) namesCopy.insertBefore(ampEl, groomNameEl);
      }
    }
  }

  function buildSealMonogram() {
    var groom = capitalize(getAttr('data-groom-name', 'A'));
    var bride = capitalize(getAttr('data-bride-name', 'C'));
    var groomInitial = getAttr('data-groom-initial', groom.charAt(0) || 'A').charAt(0).toUpperCase();
    var brideInitial = getAttr('data-bride-initial', bride.charAt(0) || 'C').charAt(0).toUpperCase();
    if (monogramGroom) monogramGroom.textContent = groomInitial;
    if (monogramBride) monogramBride.textContent = brideInitial;
  }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function buildFlyLetters(lineEl, options) {
    if (!lineEl) return;
    var text = (lineEl.getAttribute('data-full-text') || lineEl.textContent || '').trim();
    if (!text) return;

    lineEl.setAttribute('data-full-text', text);
    lineEl.innerHTML = '';
    lineEl.classList.add('wed5-fly-line');

    Array.from(text).forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'wed5-fly-letter';
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      span.style.setProperty('--sx', randomInRange(options.minX, options.maxX).toFixed(0) + 'px');
      span.style.setProperty('--sy', randomInRange(options.minY, options.maxY).toFixed(0) + 'px');
      span.style.setProperty('--rot', randomInRange(-35, 35).toFixed(1) + 'deg');
      var delay = options.baseDelay + i * options.stepDelay + randomInRange(0, options.jitter);
      span.style.setProperty('--delay', delay.toFixed(0) + 'ms');
      lineEl.appendChild(span);
    });
  }

  function runCoupleLetterIntro() {
    var namesCopy = namesBlock ? namesBlock.querySelector('.wed5-names-copy') : null;
    if (!namesCopy) return;

    var firstNameEl = isBrideFirst() ? brideNameEl : groomNameEl;
    var secondNameEl = isBrideFirst() ? groomNameEl : brideNameEl;

    buildFlyLetters(firstNameEl, {
      minX: -180,
      maxX: -40,
      minY: -140,
      maxY: 120,
      baseDelay: 40,
      stepDelay: prefersReducedMotion ? 0 : 36,
      jitter: prefersReducedMotion ? 0 : 120
    });
    buildFlyLetters(ampEl, {
      minX: -80,
      maxX: 80,
      minY: -160,
      maxY: -20,
      baseDelay: prefersReducedMotion ? 0 : 240,
      stepDelay: prefersReducedMotion ? 0 : 44,
      jitter: prefersReducedMotion ? 0 : 80
    });
    buildFlyLetters(secondNameEl, {
      minX: 40,
      maxX: 200,
      minY: -120,
      maxY: 140,
      baseDelay: prefersReducedMotion ? 0 : 140,
      stepDelay: prefersReducedMotion ? 0 : 36,
      jitter: prefersReducedMotion ? 0 : 120
    });

    namesCopy.classList.remove('is-fly-active');
    if (namesBlock) namesBlock.classList.add('is-animated');

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        namesCopy.classList.add('is-fly-active');
        scheduleDateReveal();
      });
    });
  }

  function getNamesFlyDurationMs() {
    if (!namesBlock) return prefersReducedMotion ? 0 : 1200;
    var letters = namesBlock.querySelectorAll('.wed5-fly-letter');
    var maxDelayMs = 0;
    letters.forEach(function (letter) {
      var delayRaw = letter.style.getPropertyValue('--delay') || '0ms';
      var delay = parseFloat(delayRaw);
      if (!isNaN(delay) && delay > maxDelayMs) maxDelayMs = delay;
    });
    return prefersReducedMotion ? 0 : maxDelayMs + 1150 + 80;
  }

  function typewriterDate(el, text, speedMs, onDone) {
    if (!el) {
      if (onDone) onDone();
      return;
    }
    el.textContent = '';
    el.classList.remove('is-typed');
    el.classList.add('is-typing');

    if (prefersReducedMotion || !text) {
      el.textContent = text || '';
      el.classList.remove('is-typing');
      el.classList.add('is-typed');
      if (onDone) onDone();
      return;
    }

    var index = 0;
    function tick() {
      index += 1;
      el.textContent = text.slice(0, index);
      if (index < text.length) {
        window.setTimeout(tick, speedMs);
        return;
      }
      el.classList.remove('is-typing');
      el.classList.add('is-typed');
      if (onDone) onDone();
    }
    window.setTimeout(tick, speedMs);
  }

  function scheduleDateReveal() {
    var waitMs = getNamesFlyDurationMs();
    window.setTimeout(function () {
      if (namesBlock) namesBlock.classList.add('is-date-in');
      window.setTimeout(function () {
        var dateText = namesDateEl
          ? (namesDateEl.getAttribute('data-full-text') || formatEventDate() || '')
          : formatEventDate();
        typewriterDate(namesDateEl, dateText, DATE_TYPE_MS, function () {
          if (heroFooter) heroFooter.classList.remove('is-hidden');
        });
      }, DATE_DECOR_FADE_MS);
    }, waitMs);
  }

  function showScene(target) {
    Object.keys(scenes).forEach(function (key) {
      var scene = scenes[key];
      if (!scene) return;
      var active = scene === target;
      scene.classList.toggle('is-active', active);
      if (active) scene.removeAttribute('aria-hidden');
      else scene.setAttribute('aria-hidden', 'true');
    });
    setMuteVisible(target !== scenes.envelope);
    // Details is its own scrollport (like t4) — keep body locked.
    document.documentElement.classList.remove('wed5-scroll-unlocked');
    body.classList.remove('wed5-scroll-unlocked');
    if (target === scenes.details && scenes.details) {
      scenes.details.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }

  function setMuteVisible(visible) {
    if (!muteBtn) return;
    muteBtn.classList.toggle('is-visible', !!visible);
    muteBtn.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function hydrateText() {
    var groom = capitalize(getAttr('data-groom-name', 'Adrian'));
    var bride = capitalize(getAttr('data-bride-name', 'Celeste'));
    var groomDisplay = capitalize(getAttr('data-groom-display-name', groom));
    var brideDisplay = capitalize(getAttr('data-bride-display-name', bride));
    var dateText = formatEventDate();

    setText('wed5-groom-name', groomDisplay);
    setText('wed5-bride-name', brideDisplay);
    if (detailGroomNameEl) {
      detailGroomNameEl.setAttribute('data-full-text', groom);
      detailGroomNameEl.textContent = '';
      detailGroomNameEl.classList.remove('is-typing', 'is-typed');
    }
    if (detailBrideNameEl) {
      detailBrideNameEl.setAttribute('data-full-text', bride);
      detailBrideNameEl.textContent = '';
      detailBrideNameEl.classList.remove('is-typing', 'is-typed');
    }
    if (envelopeNames) envelopeNames.textContent = getAttr('data-envelope-title', 'Wedding Invitation');
    setText('wed5-groom-parent-prefix', getAttr('data-groom-parent-prefix', 'Son of'));
    setHtml('wed5-groom-parents-name', formatParentLinesHtml(getAttr('data-groom-parents-name', '')));
    setText('wed5-bride-parent-prefix', getAttr('data-bride-parent-prefix', 'Daughter of'));
    setHtml('wed5-bride-parents-name', formatParentLinesHtml(getAttr('data-bride-parents-name', '')));
    setDisplayTitle(getAttr('data-display-title', 'Wedding Ceremony'));
    setText('wed5-address-text', getAttr('data-event-address', ''));
    setText('wed5-invite-message', getAttr('data-invite-message', ''));
    hydrateBlessingsNames();
    setText('wed5-save-date-text', getAttr('data-save-the-date', 'Save the Date'));
    setText('wed5-open-note', getAttr('data-open-label', 'Tap seal to open'));
    if (namesDateEl) {
      namesDateEl.setAttribute('data-full-text', dateText || '');
      namesDateEl.textContent = '';
    }

    if (continueBtn) {
      var continueLabel = document.getElementById('wed5-continue-label');
      var labelText = getAttr('data-continue-label', 'Join us');
      if (continueLabel) continueLabel.textContent = labelText;
      else continueBtn.textContent = labelText;
    }
    if (mapLinkEl) mapLinkEl.href = getAttr('data-map-link', '#');
    hydrateContacts();

    if (groomNameEl) groomNameEl.setAttribute('data-full-text', groomDisplay);
    if (brideNameEl) brideNameEl.setAttribute('data-full-text', brideDisplay);
    if (ampEl) ampEl.setAttribute('data-full-text', (ampEl.textContent || 'weds').trim());

    buildSealMonogram();
    buildCalendar();
    hydrateTimeline();
  }

  function hydrateContacts() {
    for (var i = 1; i <= 2; i++) {
      var phone = getAttr('data-contact-' + i, '').trim();
      var link = document.getElementById('wed5-contact-' + i);
      if (!link) continue;
      if (!phone) {
        link.classList.add('is-hidden');
        link.removeAttribute('href');
        link.textContent = '';
        continue;
      }
      link.classList.remove('is-hidden');
      link.textContent = phone;
      link.href = 'tel:' + phone.replace(/[^\d+]/g, '');
      link.setAttribute('aria-label', 'Call ' + phone);
    }
  }

  function hydrateTimeline() {
    for (var i = 1; i <= 3; i++) {
      var title = getAttr('data-event-' + i + '-title', '');
      var when = getAttr('data-event-' + i + '-when', '');
      if (!title && !when && i === 1) {
        title = 'Ceremony';
        when = formatTimelineWhen(getAttr('data-event-time', '11:00 AM'));
      }
      setText('wed5-event-' + i + '-title', title);
      setText('wed5-event-' + i + '-when', when);
      var item = document.querySelector('.wed5-timeline-item[data-slot="' + i + '"]');
      if (item) item.classList.toggle('is-hidden', !title && !when);
    }
  }

  function formatTimelineWhen(timeText) {
    var d = getDateObject();
    var dayPart = '';
    if (d) {
      var day = String(d.getDate()).padStart(2, '0');
      var mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
      dayPart = day + ' ' + mon;
    }
    var time = (timeText || '').trim();
    if (dayPart && time) return dayPart + ' - ' + time;
    return dayPart || time;
  }

  function initTimelineFlower() {
    var flower = document.getElementById('wed5-timeline-flower');
    var timelineSection = document.getElementById('wed5-timeline');
    var spine = document.querySelector('.wed5-timeline-spine');
    var scrollPage = scenes.details;
    if (!flower || !timelineSection || !scrollPage) return;

    function updateFlowerPosition() {
      var sectionRect = timelineSection.getBoundingClientRect();
      var scrollRect = scrollPage.getBoundingClientRect();
      var spineHeight = spine ? spine.offsetHeight : sectionRect.height;
      var visibleTop = Math.max(sectionRect.top, scrollRect.top);
      var visibleBottom = Math.min(sectionRect.bottom, scrollRect.bottom);
      var visibleHeight = Math.max(0, visibleBottom - visibleTop);
      if (visibleHeight <= 0) return;

      var progress = (sectionRect.bottom - scrollRect.bottom) / (sectionRect.height - scrollRect.height + 1);
      progress = Math.max(0, Math.min(1, progress));
      var maxTravel = Math.max(0, spineHeight - (flower.offsetHeight || 40));
      flower.style.transform = 'translate(-50%, ' + (progress * maxTravel).toFixed(1) + 'px)';
    }

    scrollPage.addEventListener('scroll', updateFlowerPosition, { passive: true });
    window.addEventListener('resize', updateFlowerPosition);
    updateFlowerPosition();
  }

  function buildCalendar() {
    var calendarEl = document.getElementById('wed5-calendar');
    var monthEl = document.getElementById('wed5-calendar-month');
    var marks = getCalendarMarkDates();
    var primary = getDateObject();
    if (!calendarEl || !marks.length || !primary) return;

    if (monthEl) {
      monthEl.textContent = primary.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
    }

    var earliest = marks[0];
    var latest = marks[marks.length - 1];
    var weekStart = new Date(earliest);
    weekStart.setDate(earliest.getDate() - earliest.getDay());
    var weekEnd = new Date(latest);
    weekEnd.setDate(latest.getDate() + (6 - latest.getDay()));

    var dayCount = Math.round((weekEnd.getTime() - weekStart.getTime()) / 86400000) + 1;
    if (dayCount < 7) dayCount = 7;
    if (dayCount > 14) dayCount = 14;

    calendarEl.classList.toggle('is-multi-week', dayCount > 7);
    calendarEl.innerHTML = '';

    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(function (name) {
      var nameEl = document.createElement('div');
      nameEl.className = 'wed5-calendar-dayname';
      nameEl.textContent = name;
      calendarEl.appendChild(nameEl);
    });

    for (var i = 0; i < dayCount; i++) {
      var current = new Date(weekStart);
      current.setDate(weekStart.getDate() + i);
      var isPrimary = current.toDateString() === primary.toDateString();
      var isMarked = marks.some(function (m) {
        return m.toDateString() === current.toDateString();
      });

      var dayEl = document.createElement('div');
      dayEl.className =
        'wed5-calendar-day' +
        (isPrimary ? ' is-target' : '') +
        (isMarked && !isPrimary ? ' is-marked' : '');

      var numberWrap = document.createElement('div');
      numberWrap.className = 'wed5-calendar-number-wrap';

      var dayNumber = document.createElement('div');
      dayNumber.className = 'wed5-calendar-number';
      dayNumber.textContent = current.getDate();
      numberWrap.appendChild(dayNumber);

      if (isMarked) {
        var heart = document.createElement('span');
        heart.className = 'wed5-calendar-heart';
        heart.setAttribute('aria-hidden', 'true');
        heart.innerHTML =
          '<svg viewBox="0 0 32 30" focusable="false">' +
          '<path d="M16 27.2C16 27.2 3.2 18.6 3.2 10.6C3.2 6.4 6.4 3.4 10.4 3.4C13 3.4 15 4.9 16 6.6C17 4.9 19 3.4 21.6 3.4C25.6 3.4 28.8 6.4 28.8 10.6C28.8 18.6 16 27.2 16 27.2Z" ' +
          'fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1.6 2.2"/>' +
          '</svg>';
        numberWrap.appendChild(heart);

        if (isPrimary) {
          var stem = document.createElement('span');
          stem.className = 'wed5-calendar-stem';
          stem.setAttribute('aria-hidden', 'true');
          numberWrap.appendChild(stem);
        }
      }

      dayEl.appendChild(numberWrap);
      calendarEl.appendChild(dayEl);
    }
  }

  function updateMuteLabel() {
    if (!muteBtn || !audio) return;
    muteBtn.textContent = audio.muted ? '🔈' : '🔊';
    muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
  }

  function startMusic() {
    if (!audio) return;
    var volume = parseFloat(getAttr('data-music-volume', '0.08'));
    if (!isNaN(volume)) audio.volume = Math.max(0, Math.min(1, volume));
    var promise = audio.play();
    if (promise && typeof promise.catch === 'function') promise.catch(function () {});
  }

  function runHeroIntro() {
    if (heroStarted) return;
    heroStarted = true;

    if (heroFooter) heroFooter.classList.add('is-hidden');
    if (heroSheet) heroSheet.classList.remove('is-names-in');
    if (namesBlock) {
      namesBlock.classList.remove('is-visible', 'is-title-in', 'is-subtitle-in', 'is-ring-in', 'is-animated', 'is-date-in');
      var namesCopyReset = namesBlock.querySelector('.wed5-names-copy');
      if (namesCopyReset) namesCopyReset.classList.remove('is-fly-active');
    }
    if (namesDateEl) {
      namesDateEl.textContent = '';
      namesDateEl.classList.remove('is-typing', 'is-typed');
    }
    if (monogramBlock) {
      monogramBlock.classList.remove('is-faded');
      monogramBlock.classList.remove('is-butterfly-in');
      monogramBlock.classList.remove('is-letters-in');
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (monogramBlock) monogramBlock.classList.add('is-butterfly-in');
      });
    });

    var lettersAt = BUTTERFLY_FADE_MS + LETTER_FADE_DELAY_MS;
    var decorAt = lettersAt + LETTER_FADE_MS + MONOGRAM_HOLD_MS;
    var titleAt = decorAt + DECOR_HOLD_MS;
    var subtitleAt = titleAt + TITLE_REVEAL_MS;
    var ringAt = subtitleAt + SUBTITLE_REVEAL_MS;
    var namesAt = ringAt + RING_REVEAL_MS;

    window.setTimeout(function () {
      if (monogramBlock) monogramBlock.classList.add('is-letters-in');
    }, lettersAt);

    if (DEV_HOLD_ON_MONOGRAM) return;

    window.setTimeout(function () {
      if (monogramBlock) monogramBlock.classList.add('is-faded');
      if (heroSheet) heroSheet.classList.add('is-names-in');
      if (namesBlock) namesBlock.classList.add('is-visible');
    }, decorAt);

    window.setTimeout(function () {
      if (namesBlock) namesBlock.classList.add('is-title-in');
    }, titleAt);

    window.setTimeout(function () {
      if (namesBlock) namesBlock.classList.add('is-subtitle-in');
    }, subtitleAt);

    window.setTimeout(function () {
      if (namesBlock) namesBlock.classList.add('is-ring-in');
    }, ringAt);

    window.setTimeout(function () {
      runCoupleLetterIntro();
    }, namesAt + NAME_REVEAL_DELAY_MS);
  }

  function openEnvelopeSequence() {
    if (introStarted) return;
    introStarted = true;

    if (openBtn) {
      openBtn.disabled = true;
      openBtn.setAttribute('aria-hidden', 'true');
    }
    startMusic();

    if (envelope) envelope.classList.add('is-seal-glowing');

    window.setTimeout(function () {
      if (envelope) envelope.classList.add('is-seal-dropping');
    }, SEAL_GLOW_MS);

    window.setTimeout(function () {
      if (envelope) {
        envelope.classList.remove('is-seal-glowing');
        envelope.classList.add('is-open');
      }
    }, SEAL_GLOW_MS + SEAL_DROP_MS);

    window.setTimeout(function () {
      showScene(scenes.interstitial);
      if (scenes.interstitial) scenes.interstitial.classList.add('is-animating');

      function goToHero() {
        showScene(scenes.hero);
        if (scenes.interstitial) scenes.interstitial.classList.remove('is-animating');
        runHeroIntro();
      }

      if (prefersReducedMotion || !saveDateText) {
        window.setTimeout(goToHero, INTERSTITIAL_DURATION_MS);
        return;
      }

      var finished = false;
      function goToHeroWhenClear(framesLeft) {
        if (finished) return;
        var remaining = typeof framesLeft === 'number' ? framesLeft : 90;
        var rect = saveDateText.getBoundingClientRect();
        if (rect.right > 0 && remaining > 0) {
          window.requestAnimationFrame(function () {
            goToHeroWhenClear(remaining - 1);
          });
          return;
        }
        finished = true;
        saveDateText.removeEventListener('animationend', onSweepEnd);
        goToHero();
      }

      function onSweepEnd(event) {
        if (event && event.animationName && event.animationName !== 'wed5Sweep') return;
        goToHeroWhenClear();
      }

      saveDateText.addEventListener('animationend', onSweepEnd);
      window.setTimeout(onSweepEnd, INTERSTITIAL_DURATION_MS + 800);
    }, INTERSTITIAL_START_MS);
  }

  function resetCoupleCardIntro() {
    if (!coupleColumns) return;
    coupleColumns.classList.remove('is-sketch-in', 'is-meta-in', 'is-names-typed');
    [detailGroomNameEl, detailBrideNameEl].forEach(function (el) {
      if (!el) return;
      el.textContent = '';
      el.classList.remove('is-typing', 'is-typed');
    });
    stopAllCardFlameHolds();
    clearCardSparks();
  }

  function clearCardSparks(hostId) {
    var ids = hostId ? [hostId] : ['wed5-groom-sparks', 'wed5-bride-sparks'];
    ids.forEach(function (id) {
      var host = document.getElementById(id);
      if (host) host.innerHTML = '';
    });
  }

  var cardHoldState = {
    groom: { active: false, timer: null, pointerId: null },
    bride: { active: false, timer: null, pointerId: null }
  };

  function spawnSparkBurst(hostId, side, count) {
    var host = document.getElementById(hostId);
    if (!host || prefersReducedMotion) return;

    var burstCount = typeof count === 'number' ? count : 12;
    for (var i = 0; i < burstCount; i++) {
      var spark = document.createElement('span');
      spark.className = 'wed5-card-spark';
      if (Math.random() > 0.55) spark.classList.add('is-hot');
      else if (Math.random() > 0.45) spark.classList.add('is-ember');

      var startX = side === 'left' ? randomInRange(4, 42) : randomInRange(58, 96);
      var endX = startX + randomInRange(-10, 10);
      var startY = randomInRange(-4, 12);
      var endY = randomInRange(88, 108);

      spark.style.setProperty('--spark-x', startX.toFixed(1) + '%');
      spark.style.setProperty('--spark-y', startY.toFixed(1) + '%');
      spark.style.setProperty('--spark-end-x', endX.toFixed(1) + '%');
      spark.style.setProperty('--spark-end-y', endY.toFixed(1) + '%');
      spark.style.setProperty('--spark-size', randomInRange(1.6, 3.8).toFixed(1) + 'px');
      spark.style.setProperty('--spark-dur', randomInRange(0.95, 1.55).toFixed(2) + 's');
      spark.style.setProperty('--spark-delay', (i * 12 + randomInRange(0, 40)).toFixed(0) + 'ms');
      spark.addEventListener('animationend', function (event) {
        var node = event.currentTarget;
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });
      host.appendChild(spark);
    }
  }

  function windDownSparks(hostId) {
    var host = document.getElementById(hostId);
    if (!host) return;

    var hostW = host.clientWidth || 1;
    var hostH = host.clientHeight || 1;

    Array.prototype.forEach.call(host.querySelectorAll('.wed5-card-spark:not(.is-dying)'), function (spark) {
      var style = window.getComputedStyle(spark);
      var fromOpacity = parseFloat(style.opacity);

      // Not yet lit — drop silently so they don't start a new top→bottom cascade.
      if (!isFinite(fromOpacity) || fromOpacity < 0.18) {
        if (spark.parentNode) spark.parentNode.removeChild(spark);
        return;
      }

      var leftPx = parseFloat(style.left);
      var topPx = parseFloat(style.top);
      if (!isFinite(leftPx)) leftPx = hostW * 0.5;
      if (!isFinite(topPx)) topPx = hostH * 0.25;

      var fromX = (leftPx / hostW) * 100;
      var fromY = (topPx / hostH) * 100;
      if (fromY < 14 && fromOpacity < 0.35) {
        if (spark.parentNode) spark.parentNode.removeChild(spark);
        return;
      }

      var frozenTransform = style.transform && style.transform !== 'none'
        ? style.transform
        : 'translate(-50%, -50%) scale(1)';
      var frozenFilter = style.filter && style.filter !== 'none' ? style.filter : 'blur(0px)';
      var frozenShadow = style.boxShadow;

      // Lock the live frame onto the element, then cancel the flight animation.
      if (typeof spark.getAnimations === 'function') {
        spark.getAnimations().forEach(function (anim) {
          try {
            if (anim.commitStyles) anim.commitStyles();
            anim.cancel();
          } catch (err) { /* older browsers */ }
        });
      }

      spark.classList.add('is-dying');
      spark.style.animation = 'none';
      spark.style.transition = 'none';
      spark.style.left = fromX.toFixed(2) + '%';
      spark.style.top = fromY.toFixed(2) + '%';
      spark.style.opacity = String(fromOpacity);
      spark.style.transform = frozenTransform;
      spark.style.filter = frozenFilter;
      spark.style.boxShadow = frozenShadow;
      spark.style.width = style.width;
      spark.style.height = style.height;
      void spark.offsetWidth;

      var toX = fromX + randomInRange(-6, 6);
      var toY = randomInRange(98, 112);
      var settleMs = randomInRange(900, 1300);

      spark.style.transition =
        'top ' + settleMs + 'ms cubic-bezier(0.22, 0.55, 0.35, 1), ' +
        'left ' + settleMs + 'ms cubic-bezier(0.22, 0.55, 0.35, 1), ' +
        'opacity ' + settleMs + 'ms ease-out, ' +
        'filter ' + settleMs + 'ms ease-out, ' +
        'transform ' + settleMs + 'ms ease-out, ' +
        'box-shadow ' + Math.round(settleMs * 0.85) + 'ms ease-out';
      spark.style.left = toX.toFixed(2) + '%';
      spark.style.top = toY.toFixed(2) + '%';
      spark.style.opacity = '0';
      spark.style.filter = 'blur(1.8px)';
      spark.style.transform = 'translate(-50%, -50%) scale(0.2)';
      spark.style.boxShadow = 'none';

      spark.addEventListener('transitionend', function onSettle(event) {
        if (event.propertyName && event.propertyName !== 'opacity' && event.propertyName !== 'top') return;
        spark.removeEventListener('transitionend', onSettle);
        if (spark.parentNode) spark.parentNode.removeChild(spark);
      });
      window.setTimeout(function () {
        if (spark.parentNode) spark.parentNode.removeChild(spark);
      }, settleMs + 120);
    });
  }

  function stopCardFlameHold(key) {
    var state = cardHoldState[key];
    if (!state) return;
    state.active = false;
    state.pointerId = null;
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }
    if (state.hostId) windDownSparks(state.hostId);
  }

  function startCardFlameHold(key) {
    var state = cardHoldState[key];
    if (!state || state.active || prefersReducedMotion) return;
    state.active = true;

    function tick() {
      if (!state.active) return;
      spawnSparkBurst(state.hostId, state.side, 10);
      state.timer = window.setTimeout(tick, 220);
    }
    tick();
  }

  function playCardSparks(hostId, side) {
    var host = document.getElementById(hostId);
    if (!host || prefersReducedMotion) return;
    host.innerHTML = '';

    var count = 36;
    for (var i = 0; i < count; i++) {
      var spark = document.createElement('span');
      spark.className = 'wed5-card-spark';
      if (Math.random() > 0.55) spark.classList.add('is-hot');
      else if (Math.random() > 0.45) spark.classList.add('is-ember');

      var startX = side === 'left' ? randomInRange(4, 42) : randomInRange(58, 96);
      var endX = startX + randomInRange(-10, 10);
      var startY = randomInRange(-4, 12);
      var endY = randomInRange(88, 108);

      spark.style.setProperty('--spark-x', startX.toFixed(1) + '%');
      spark.style.setProperty('--spark-y', startY.toFixed(1) + '%');
      spark.style.setProperty('--spark-end-x', endX.toFixed(1) + '%');
      spark.style.setProperty('--spark-end-y', endY.toFixed(1) + '%');
      spark.style.setProperty('--spark-size', randomInRange(1.6, 3.8).toFixed(1) + 'px');
      spark.style.setProperty('--spark-dur', randomInRange(1.05, 1.7).toFixed(2) + 's');
      spark.style.setProperty('--spark-delay', (i * 22 + randomInRange(0, 70)).toFixed(0) + 'ms');
      spark.addEventListener('animationend', function (event) {
        var node = event.currentTarget;
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });
      host.appendChild(spark);
    }
  }

  function playCoupleNameSparks() {
    playCardSparks('wed5-groom-sparks', 'left');
    playCardSparks('wed5-bride-sparks', 'right');
  }

  function stopAllCardFlameHolds() {
    stopCardFlameHold('groom');
    stopCardFlameHold('bride');
  }

  function wireCardFlameHold() {
    var cards = [
      {
        key: 'groom',
        el: document.querySelector('.wed5-person-col-groom'),
        hostId: 'wed5-groom-sparks',
        side: 'left'
      },
      {
        key: 'bride',
        el: document.querySelector('.wed5-person-col-bride'),
        hostId: 'wed5-bride-sparks',
        side: 'right'
      }
    ];

    cards.forEach(function (card) {
      if (!card.el) return;
      var state = cardHoldState[card.key];
      state.card = card.el;
      state.hostId = card.hostId;
      state.side = card.side;
      card.el.setAttribute('tabindex', '0');
      card.el.setAttribute('role', 'button');
      card.el.setAttribute(
        'aria-label',
        (card.key === 'groom' ? 'Groom' : 'Bride') + ' card. Press and hold for sparks.'
      );

      card.el.addEventListener('pointerdown', function (event) {
        if (event.button != null && event.button !== 0) return;
        if (state.active) return;
        state.pointerId = event.pointerId;
        try {
          card.el.setPointerCapture(event.pointerId);
        } catch (err) { /* ignore */ }
        startCardFlameHold(card.key);
      });

      function endHold(event) {
        if (state.pointerId != null && event.pointerId !== state.pointerId) return;
        stopCardFlameHold(card.key);
      }

      card.el.addEventListener('pointerup', endHold);
      card.el.addEventListener('pointercancel', endHold);
      card.el.addEventListener('lostpointercapture', function () {
        stopCardFlameHold(card.key);
      });

      card.el.addEventListener('keydown', function (event) {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        if (!state.active) startCardFlameHold(card.key);
      });
      card.el.addEventListener('keyup', function (event) {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        stopCardFlameHold(card.key);
      });
      card.el.addEventListener('blur', function () {
        stopCardFlameHold(card.key);
      });
    });
  }

  function runCoupleCardIntro(onDone) {
    if (!coupleColumns) {
      if (onDone) onDone();
      return;
    }

    if (prefersReducedMotion) {
      coupleColumns.classList.add('is-sketch-in', 'is-meta-in', 'is-names-typed');
      if (detailGroomNameEl) {
        detailGroomNameEl.textContent = detailGroomNameEl.getAttribute('data-full-text') || '';
        detailGroomNameEl.classList.add('is-typed');
      }
      if (detailBrideNameEl) {
        detailBrideNameEl.textContent = detailBrideNameEl.getAttribute('data-full-text') || '';
        detailBrideNameEl.classList.add('is-typed');
      }
      if (onDone) onDone();
      return;
    }

    window.setTimeout(function () {
      coupleColumns.classList.add('is-sketch-in');
    }, 180);

    window.setTimeout(function () {
      coupleColumns.classList.add('is-meta-in');
    }, 180 + COUPLE_SKETCH_MS);

    window.setTimeout(function () {
      var groomText = detailGroomNameEl
        ? (detailGroomNameEl.getAttribute('data-full-text') || '')
        : '';
      var brideText = detailBrideNameEl
        ? (detailBrideNameEl.getAttribute('data-full-text') || '')
        : '';
      var pending = 2;
      function finishOne() {
        pending -= 1;
        if (pending > 0) return;
        coupleColumns.classList.add('is-names-typed');
        playCoupleNameSparks();
        if (onDone) onDone();
      }
      typewriterDate(detailGroomNameEl, groomText, NAME_TYPE_MS, finishOne);
      typewriterDate(detailBrideNameEl, brideText, NAME_TYPE_MS, finishOne);
    }, 180 + COUPLE_SKETCH_MS + COUPLE_META_MS);
  }

  function showDetailsStatic() {
    if (!detailsSpread) return;

    if (detailsRevealObserver) {
      detailsRevealObserver.disconnect();
      detailsRevealObserver = null;
    }

    detailsSpread.classList.remove('is-turning');
    detailsSpread.classList.add('is-decor-in', 'is-revealed', 'is-static');
    detailsSpread.querySelectorAll('.wed5-reveal-section').forEach(function (section) {
      section.classList.add('is-in');
    });

    if (coupleColumns) {
      coupleColumns.classList.add('is-sketch-in', 'is-meta-in', 'is-names-typed');
    }
    if (detailGroomNameEl) {
      detailGroomNameEl.textContent = detailGroomNameEl.getAttribute('data-full-text') || '';
      detailGroomNameEl.classList.remove('is-typing');
      detailGroomNameEl.classList.add('is-typed');
    }
    if (detailBrideNameEl) {
      detailBrideNameEl.textContent = detailBrideNameEl.getAttribute('data-full-text') || '';
      detailBrideNameEl.classList.remove('is-typing');
      detailBrideNameEl.classList.add('is-typed');
    }

    hydrateBlessingsNames();
    var blessingsEl = document.getElementById('wed5-blessings-text');
    if (blessingsEl) blessingsEl.classList.add('is-names-in');
    coupleIntroStarted = true;
    stopAllCardFlameHolds();
    clearCardSparks();
  }

  function openDetailsPage() {
    if (detailsOpened) return;
    detailsOpened = true;
    showScene(scenes.details);

    if (detailsIntroCompleted) {
      showDetailsStatic();
      return;
    }

    if (detailsSpread) {
      detailsSpread.classList.remove('is-decor-in', 'is-revealed', 'is-static');
      resetDetailsReveals();
      resetCoupleCardIntro();
      detailsSpread.classList.add('is-turning');
    }
    window.setTimeout(function () {
      if (detailsSpread) detailsSpread.classList.remove('is-turning');
      runDetailsIntro();
    }, PAGE_TURN_MS + 80);
  }

  var detailsRevealObserver = null;
  var coupleIntroStarted = false;

  function resetDetailsReveals() {
    coupleIntroStarted = false;
    if (detailsRevealObserver) {
      detailsRevealObserver.disconnect();
      detailsRevealObserver = null;
    }
    if (!detailsSpread) return;
    detailsSpread.querySelectorAll('.wed5-reveal-section').forEach(function (section) {
      section.classList.remove('is-in');
    });
    var blessingsEl = document.getElementById('wed5-blessings-text');
    if (blessingsEl) blessingsEl.classList.remove('is-names-in');
  }

  function maybeRunCoupleIntro(section) {
    if (coupleIntroStarted || detailsIntroCompleted) return;
    if (!section) return;
    if (section === coupleColumns || section.id === 'wed5-couple-columns') {
      coupleIntroStarted = true;
      runCoupleCardIntro();
    }
  }

  function maybeRunBlessingsAnim(section) {
    if (detailsIntroCompleted) return;
    if (!section || !section.classList.contains('wed5-message-block')) return;
    window.setTimeout(playBlessingsNamesAnim, prefersReducedMotion ? 0 : 280);
  }

  function ensureDetailsScrollHint() {
    var hint = document.getElementById('wed5-details-scroll-hint');
    if (hint) return hint;
    if (!detailsSpread) return null;

    hint = document.createElement('div');
    hint.className = 'wed5-details-scroll-hint';
    hint.id = 'wed5-details-scroll-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML =
      '<span class="wed5-details-scroll-hint-chevrons" aria-hidden="true">' +
      '<span></span><span></span>' +
      '</span>' +
      '<span class="wed5-details-scroll-hint-label">Scroll</span>';

    var couple = document.getElementById('wed5-couple-columns');
    if (couple && couple.parentNode) {
      couple.parentNode.insertBefore(hint, couple.nextSibling);
    } else {
      detailsSpread.appendChild(hint);
    }
    return hint;
  }

  function initDetailsScrollHint() {
    // Default on for all t5 pages; set data-details-scroll-hint="false" to disable.
    if (getAttr('data-details-scroll-hint', 'true') === 'false') return;
    var hint = ensureDetailsScrollHint();
    var scrollRoot = scenes.details;
    if (!hint || !scrollRoot) return;

    var bound = hint.getAttribute('data-wed5-scroll-hint-bound') === 'true';
    function updateHint() {
      var canScroll = scrollRoot.scrollHeight > scrollRoot.clientHeight + 24;
      var scrolled = scrollRoot.scrollTop > 28;
      if (!canScroll || scrolled) {
        hint.classList.remove('is-visible');
        hint.classList.add('is-hidden');
        hint.setAttribute('aria-hidden', 'true');
        return;
      }
      hint.classList.add('is-visible');
      hint.classList.remove('is-hidden');
      hint.setAttribute('aria-hidden', 'false');
    }

    if (!bound) {
      hint.setAttribute('data-wed5-scroll-hint-bound', 'true');
      scrollRoot.addEventListener('scroll', updateHint, { passive: true });
      window.addEventListener('resize', updateHint);
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(updateHint);
    });
    window.setTimeout(updateHint, prefersReducedMotion ? 80 : 700);
  }

  function initDetailsScrollReveals() {
    if (!detailsSpread || !scenes.details) return;

    var sections = detailsSpread.querySelectorAll('.wed5-reveal-section');
    detailsSpread.classList.add('is-revealed');
    detailsSpread.classList.remove('is-static');
    hydrateBlessingsNames();
    initDetailsScrollHint();

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      sections.forEach(function (section) {
        section.classList.add('is-in');
        maybeRunCoupleIntro(section);
        maybeRunBlessingsAnim(section);
      });
      return;
    }

    if (detailsRevealObserver) detailsRevealObserver.disconnect();

    detailsRevealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          maybeRunCoupleIntro(entry.target);
          maybeRunBlessingsAnim(entry.target);
          if (detailsRevealObserver) detailsRevealObserver.unobserve(entry.target);
        });
      },
      {
        root: scenes.details,
        threshold: 0.16,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    sections.forEach(function (section) {
      detailsRevealObserver.observe(section);
    });
  }

  function runDetailsIntro() {
    if (!detailsSpread) return;

    window.requestAnimationFrame(function () {
      detailsSpread.classList.add('is-decor-in');
    });

    window.setTimeout(function () {
      initDetailsScrollReveals();
    }, prefersReducedMotion ? 0 : 180);
  }

  function returnToNamesSession() {
    detailsOpened = false;
    detailsIntroCompleted = true;
    if (detailsRevealObserver) {
      detailsRevealObserver.disconnect();
      detailsRevealObserver = null;
    }
    clearCardSparks();
    stopAllCardFlameHolds();
    if (detailsSpread) {
      detailsSpread.classList.remove('is-turning');
    }
    showScene(scenes.hero);
    if (heroFooter) heroFooter.classList.remove('is-hidden');
  }

  function wireEvents() {
    if (openBtn) {
      openBtn.addEventListener('click', openEnvelopeSequence);
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', openDetailsPage);
    }

    if (backBtn) {
      backBtn.addEventListener('click', returnToNamesSession);
    }

    if (muteBtn && audio) {
      muteBtn.addEventListener('click', function () {
        audio.muted = !audio.muted;
        updateMuteLabel();
        if (!audio.muted) startMusic();
      });
    }

    wireCardFlameHold();
    initPointerTrail();
  }

  function spawnTrailParticle(x, y) {
    if (!pointerTrail || prefersReducedMotion) return;
    var particle = document.createElement('span');
    var glyphs = ['✦', '✧', '♥', '❋'];
    particle.className = 'wed5-trail-particle';
    particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    particle.style.left = x.toFixed(1) + 'px';
    particle.style.top = y.toFixed(1) + 'px';
    particle.style.fontSize = randomInRange(0.8, 1.3).toFixed(2) + 'rem';
    particle.style.animationDuration = randomInRange(650, 980).toFixed(0) + 'ms';
    particle.style.color = Math.random() > 0.25 ? '#f1e0b0' : 'var(--wed5-accent)';
    pointerTrail.appendChild(particle);
    setTimeout(function () {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 1100);
  }

  function maybeSpawnTrail(x, y) {
    if (!pointerTrail) return;
    var now = Date.now();
    var dx = x - lastTrailX;
    var dy = y - lastTrailY;
    if (now - lastTrailAt < 45 && (dx * dx + dy * dy) < 196) return;
    lastTrailAt = now;
    lastTrailX = x;
    lastTrailY = y;
    spawnTrailParticle(x + randomInRange(-8, 8), y + randomInRange(-8, 8));
  }

  function initPointerTrail() {
    if (pointerTrailInit || !pointerTrail || !pageRoot || prefersReducedMotion) return;
    pointerTrailInit = true;

    pageRoot.addEventListener('pointermove', function (e) {
      maybeSpawnTrail(e.clientX, e.clientY);
    }, { passive: true });

    pageRoot.addEventListener('touchmove', function (e) {
      var touch = e.touches && e.touches[0];
      if (!touch) return;
      maybeSpawnTrail(touch.clientX, touch.clientY);
    }, { passive: true });

    pageRoot.addEventListener('pointerdown', function (e) {
      maybeSpawnTrail(e.clientX, e.clientY);
      spawnTrailParticle(e.clientX + randomInRange(-10, 10), e.clientY + randomInRange(-10, 10));
    }, { passive: true });
  }

  function applyFirebaseAudio() {
    if (!audio) return;
    var source = audio.querySelector('source[data-storage-path]');
    if (!source) return;
    var storagePath = source.getAttribute('data-storage-path');
    var token = source.getAttribute('data-token');
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!storagePath || !baseUrl || !token) return;
    source.src = baseUrl + storagePath.replace(/^\//, '') + '?alt=media&token=' + token;
    audio.load();
  }

  function encodedStoragePath(attr) {
    return attr ? attr.replace(/^\//, '') : '';
  }

  function decodedStoragePath(attr) {
    if (!attr) return '';
    var raw = attr.replace(/^\//, '');
    try {
      return decodeURIComponent(raw);
    } catch (err) {
      return raw.replace(/%2F/g, '/');
    }
  }

  function resolvePathOnlyImageUrl(storagePath, baseUrl, cb) {
    var path = decodedStoragePath(storagePath);
    var encoded = encodedStoragePath(storagePath);
    var bucket = 'my-bel0ved.firebasestorage.app';

    function setUrl(url) {
      if (url && typeof cb === 'function') cb(url);
    }

    function tryPublicMedia() {
      if (baseUrl) setUrl(baseUrl + encoded + '?alt=media');
    }

    function tryRestFallback() {
      fetch('https://firebasestorage.googleapis.com/v0/b/' + bucket + '/o/' + encoded)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var token = data && (data.downloadTokens || (data.metadata && data.metadata.firebaseStorageDownloadTokens));
          if (token) setUrl(baseUrl + encoded + '?alt=media&token=' + String(token).split(',')[0]);
          else tryPublicMedia();
        })
        .catch(function () { tryPublicMedia(); });
    }

    function trySdk() {
      if (!window.FirebaseStorage || !window.FirebaseStorage.getDownloadUrlByPath) {
        tryRestFallback();
        return;
      }
      window.FirebaseStorage.getDownloadUrlByPath(path)
        .then(function (url) {
          if (url) setUrl(url);
          else tryRestFallback();
        })
        .catch(function () { tryRestFallback(); });
    }

    trySdk();
    setTimeout(trySdk, 300);
  }

  var wed5AssetInitDone = false;

  function applyFirebaseAsset(el) {
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!el) return;

    var storagePath = el.getAttribute('data-storage-path');
    if (!storagePath) return;

    var existingSrc = el.getAttribute('src');
    var token = el.getAttribute('data-token');
    var encoded = encodedStoragePath(storagePath);

    function setSrc(url) {
      if (!url) {
        if (existingSrc && !el.getAttribute('src')) el.setAttribute('src', existingSrc);
        return;
      }
      if (el.tagName === 'SOURCE') {
        el.src = url;
        var audioEl = el.closest('audio');
        if (audioEl) audioEl.load();
      } else {
        el.src = url;
      }
    }

    if (baseUrl && token) {
      setSrc(baseUrl + encoded + '?alt=media&token=' + token);
      return;
    }

    if (baseUrl) {
      resolvePathOnlyImageUrl(storagePath, baseUrl, setSrc);
    } else if (existingSrc) {
      el.setAttribute('src', existingSrc);
    }
  }

  function initializeFirebaseImages() {
    if (wed5AssetInitDone) return;
    wed5AssetInitDone = true;
    document.querySelectorAll('img[data-storage-path]').forEach(function (el) {
      applyFirebaseAsset(el);
    });
  }

  function runFirebaseImageInit() {
    if (window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl) {
      initializeFirebaseImages();
      return;
    }
    var checkFirebase = setInterval(function () {
      if (window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl) {
        clearInterval(checkFirebase);
        initializeFirebaseImages();
      }
    }, 100);
    setTimeout(function () { clearInterval(checkFirebase); }, 12000);
  }

  applyBrideFirstOrder();
  hydrateText();
  applyFirebaseAudio();
  runFirebaseImageInit();
  wireEvents();
  updateMuteLabel();
  initTimelineFlower();

  if (DEV_SKIP_TO_DETAILS) {
    detailsOpened = true;
    showScene(scenes.details);
    if (detailsSpread) {
      detailsSpread.classList.add('is-decor-in');
      initDetailsScrollReveals();
    }
  } else if (DEV_SKIP_TO_HERO) {
    introStarted = true;
    showScene(scenes.hero);
    startMusic();
    runHeroIntro();
    initPointerTrail();
  } else {
    showScene(scenes.envelope);
  }
})();
