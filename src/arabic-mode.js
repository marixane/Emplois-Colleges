window.__examLanguage = window.__examLanguage || 'fr';

const FR = {
  rightTop: 'Lycée El jamai ,Tanger',
  rightBottom: 'Matière: Mathématique',
  individualTitle: 'Devoir individuel',
  freeTitle: 'Devoir libre',
  homeworkTitle: 'Devoir à la maison',
  subject: 'N° : 1 Semestre : 1',
  level: 'Classe : 2 Bac SPF',
  notes: 'Notes :',
  langButton: 'العربية',
  freeButton: 'Devoir\nlibre',
  individualButton: 'Devoir\nindividuel',
  page: 'Page ',
  exercise: 'Exercice '
};

const AR = {
  rightTop: 'ثانوية الجامعي، طنجة',
  rightBottom: 'مادة : الرياضيات',
  individualTitle: 'فرض محروس',
  freeTitle: 'فرض منزلي',
  homeworkTitle: 'فرض منزلي',
  subject: 'رقم 1 الدورة 1',
  level: 'قسم : 2 باك ع.ف',
  notes: ': النقط',
  langButton: 'Français',
  freeButton: 'فرض\nمنزلي',
  individualButton: 'فرض\nمحروس',
  page: 'الصفحة ',
  exercise: 'تمرين '
};

const DUR_FR_AR = {
  '30 min': '30 د',
  '1 h': '1 س',
  '1 h 30': '1 س 30 د',
  '2 h': '2 س',
  '2 h 30': '2 س 30 د',
  '3 h': '3 س',
  '3 h 30': '3 س 30 د',
  '4 h': '4 س'
};
const DUR_AR_FR = {};
Object.keys(DUR_FR_AR).forEach(function (k) { DUR_AR_FR[DUR_FR_AR[k]] = k; });

function pack() { return window.__examLanguage === 'ar' ? AR : FR; }

function setTextArea(selector, value) {
  var el = document.querySelector(selector);
  if (!el || el.value === value) return;
  var d = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  if (d && d.set) d.set.call(el, value); else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function setIfKnown(selector, known, next) {
  var el = document.querySelector(selector);
  if (el && known.indexOf(el.value || '') !== -1) setTextArea(selector, next);
}

function syncHeader() {
  var p = pack();
  setIfKnown('.right-line-top', [FR.rightTop, AR.rightTop], p.rightTop);
  setIfKnown('.right-line-bottom', ['N° : 1 Semestre : 1', FR.rightBottom, AR.rightBottom], p.rightBottom);
  setIfKnown('.inline-class-input', [FR.level, AR.level], p.level);
  setIfKnown('.title-line-middle', ['Mathématique', FR.subject, AR.subject], p.subject);
  var top = document.querySelector('.title-line-top');
  if (!top) return;
  var v = top.value || '';
  if ([FR.individualTitle, AR.individualTitle].indexOf(v) !== -1) setTextArea('.title-line-top', p.individualTitle);
  if ([FR.freeTitle, AR.freeTitle].indexOf(v) !== -1) setTextArea('.title-line-top', p.freeTitle);
  if ([FR.homeworkTitle, AR.homeworkTitle].indexOf(v) !== -1) setTextArea('.title-line-top', p.homeworkTitle);
}

function syncLabels() {
  var p = pack();
  var notes = document.querySelector('.note-scale-title');
  if (notes) notes.textContent = p.notes;
  document.querySelectorAll('.page-number').forEach(function (n) {
    var m = (n.textContent || '').match(/(?:Page|الصفحة)\s*(\d+)\s*\/\s*(\d+)/);
    if (m) n.textContent = p.page + m[1] + '/' + m[2];
  });
  document.querySelectorAll('.page-count-card > label').forEach(function (n) {
    var m = (n.textContent || '').match(/(?:Page|الصفحة)\s*(\d+)/);
    if (m) n.textContent = p.page + m[1];
  });
  document.querySelectorAll('.exam-exercise:not(.blank-exercise) .exercise-title-controls > span:first-child').forEach(function (s) {
    var m = (s.textContent || '').match(/(?:Exercice|تمرين)\s*(\d+)/i);
    if (!m) return;
    var c = s.closest('.exercise-title-controls');
    var isHomework = c && !c.querySelector('button');
    s.textContent = p.exercise + m[1] + (isHomework ? '' : ' :');
  });
}

function syncDuration() {
  document.querySelectorAll('.tiny-duration-control strong').forEach(function (n) {
    var t = (n.textContent || '').trim();
    var next = window.__examLanguage === 'ar' ? DUR_FR_AR[t] : DUR_AR_FR[t];
    if (next) n.textContent = next;
  });
}

function syncDurationAfterReact() {
  if (window.__examLanguage !== 'ar') return;
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(syncDuration);
  });
}

function setFreeTitle(active) {
  var p = pack();
  setTextArea('.title-line-top', active ? p.freeTitle : p.individualTitle);
}

function setBarRibbonVisible(visible) {
  var button = document.querySelector('.bar-ribbon-toggle');
  if (!button) return;
  var isVisible = button.classList.contains('on');
  if (visible !== isVisible) button.click();
}

function syncButtons() {
  var panel = document.querySelector('.panel');
  if (!panel) return;
  var lang = document.querySelector('.language-toggle');
  if (!lang) {
    lang = document.createElement('button');
    lang.className = 'language-toggle';
    lang.type = 'button';
    lang.addEventListener('click', function () {
      window.__examLanguage = window.__examLanguage === 'ar' ? 'fr' : 'ar';
      syncLanguageMode();
    });
    var title = panel.querySelector('.eyebrow');
    if (title && title.nextSibling) panel.insertBefore(lang, title.nextSibling); else panel.insertBefore(lang, panel.firstChild);
  }
  var free = document.querySelector('.individual-toggle');
  if (!free) {
    free = document.createElement('button');
    free.className = 'individual-toggle';
    free.type = 'button';
    free.addEventListener('click', function () {
      document.body.classList.toggle('no-title-points');
      var isFree = document.body.classList.contains('no-title-points');
      setFreeTitle(isFree);
      setBarRibbonVisible(!isFree);
      syncButtons();
    });
    if (lang.nextSibling) panel.insertBefore(free, lang.nextSibling); else panel.appendChild(free);
  }
  var p = pack();
  var isFree = document.body.classList.contains('no-title-points');
  lang.textContent = p.langButton;
  free.textContent = isFree ? p.individualButton : p.freeButton;
  free.classList.toggle('active', !isFree);
}

function bindDurationButtons() {
  document.querySelectorAll('.tiny-duration-control button').forEach(function (b) {
    if (b.dataset.durationSyncBound === 'true') return;
    b.dataset.durationSyncBound = 'true';
    b.addEventListener('click', syncDurationAfterReact);
  });
}

function syncLanguageMode() {
  if (!document.body) return;
  document.body.classList.toggle('arabic-mode', window.__examLanguage === 'ar');
  document.documentElement.setAttribute('dir', 'ltr');
  syncButtons();
  syncHeader();
  syncLabels();
  syncDuration();
  bindDurationButtons();
  if (typeof window.formatExercisePointLabels === 'function') window.formatExercisePointLabels();
}

syncLanguageMode();
setTimeout(syncButtons, 250);
