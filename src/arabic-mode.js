window.__examLanguage = window.__examLanguage || 'fr';

const FR_HEADER = {
  rightTop: 'Lycée El jamai ,Tanger',
  rightBottom: 'Matière: Mathématique',
  individualTitle: 'Devoir individuel',
  freeTitle: 'Devoir libre',
  homeworkTitle: 'Devoir à la maison',
  subject: 'N° : 1 Semestre : 1',
  level: 'Classe : 2 Bac SPF'
};

const AR_HEADER = {
  rightTop: 'ثانوية الجامعي، طنجة',
  rightBottom: 'مادة : الرياضيات',
  individualTitle: 'فرض محروس',
  freeTitle: 'فرض منزلي',
  homeworkTitle: 'فرض منزلي',
  subject: 'رقم 1 الدورة 1',
  level: 'قسم : 2 باك ع.ف'
};

const DURATION_FR_TO_AR = {
  '30 min': '30 د',
  '1 h': '1 س',
  '1 h 30': '1 س 30 د',
  '2 h': '2 س',
  '2 h 30': '2 س 30 د',
  '3 h': '3 س',
  '3 h 30': '3 س 30 د',
  '4 h': '4 س'
};

const DURATION_AR_TO_FR = Object.fromEntries(
  Object.entries(DURATION_FR_TO_AR).map(([fr, ar]) => [ar, fr])
);

function setInputValue(selector, value) {
  var input = document.querySelector(selector);
  if (!input || input.value === value) return;
  var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function syncHeaderLanguage() {
  var header = window.__examLanguage === 'ar' ? AR_HEADER : FR_HEADER;
  setInputValue('.right-line-top', header.rightTop);

  var rightBottom = document.querySelector('.right-line-bottom');
  if (rightBottom) {
    var currentRightBottom = rightBottom.value || '';
    var isRightBottom = currentRightBottom === 'N° : 1 Semestre : 1' || currentRightBottom === FR_HEADER.rightBottom || currentRightBottom === AR_HEADER.rightBottom;
    if (isRightBottom) setInputValue('.right-line-bottom', header.rightBottom);
  }

  var levelInput = document.querySelector('.inline-class-input');
  if (levelInput) {
    var currentLevel = levelInput.value || '';
    var isLevel = currentLevel === FR_HEADER.level || currentLevel === AR_HEADER.level;
    if (isLevel) setInputValue('.inline-class-input', header.level);
  }

  var titleTop = document.querySelector('.title-line-top');
  if (titleTop) {
    var currentTop = titleTop.value || '';
    var isIndividual = currentTop === FR_HEADER.individualTitle || currentTop === AR_HEADER.individualTitle;
    var isFree = currentTop === FR_HEADER.freeTitle || currentTop === AR_HEADER.freeTitle;
    var isHomework = currentTop === FR_HEADER.homeworkTitle || currentTop === AR_HEADER.homeworkTitle;
    if (isIndividual) setInputValue('.title-line-top', header.individualTitle);
    if (isFree) setInputValue('.title-line-top', header.freeTitle);
    if (isHomework) setInputValue('.title-line-top', header.homeworkTitle);
  }

  var titleMiddle = document.querySelector('.title-line-middle');
  if (titleMiddle) {
    var currentMiddle = titleMiddle.value || '';
    var isSubject = currentMiddle === 'Mathématique' || currentMiddle === FR_HEADER.subject || currentMiddle === 'الرياضيات' || currentMiddle === AR_HEADER.subject;
    if (isSubject) setInputValue('.title-line-middle', header.subject);
  }
}

function setIndividualHeaderTitle(isActive) {
  var titleTop = document.querySelector('.title-line-top');
  if (!titleTop) return;
  if (window.__examLanguage === 'ar') {
    setInputValue('.title-line-top', isActive ? AR_HEADER.freeTitle : AR_HEADER.individualTitle);
  } else {
    setInputValue('.title-line-top', isActive ? FR_HEADER.freeTitle : FR_HEADER.individualTitle);
  }
}

function syncLanguageButton() {
  var panel = document.querySelector('.panel');
  if (!panel) return;

  var button = document.querySelector('.language-toggle');
  if (!button) {
    button = document.createElement('button');
    button.className = 'language-toggle';
    button.type = 'button';
    button.addEventListener('click', function () {
      window.__examLanguage = window.__examLanguage === 'ar' ? 'fr' : 'ar';
      syncLanguageMode();
      setIndividualHeaderTitle(document.body.classList.contains('no-title-points'));
    });

    var title = panel.querySelector('.eyebrow');
    if (title && title.nextSibling) panel.insertBefore(button, title.nextSibling);
    else panel.insertBefore(button, panel.firstChild);
  }

  var individualButton = document.querySelector('.individual-toggle');
  if (!individualButton) {
    individualButton = document.createElement('button');
    individualButton.className = 'individual-toggle';
    individualButton.type = 'button';
    individualButton.textContent = 'Devoir\nlibre';
    individualButton.addEventListener('click', function () {
      document.body.classList.toggle('no-title-points');
      var active = document.body.classList.contains('no-title-points');
      setIndividualHeaderTitle(active);
      var barButton = document.querySelector('.bar-ribbon-toggle');
      if (barButton) barButton.click();
      syncLanguageButton();
    });

    if (button.nextSibling) panel.insertBefore(individualButton, button.nextSibling);
    else panel.appendChild(individualButton);
  }

  var isActive = document.body.classList.contains('no-title-points');
  individualButton.classList.toggle('active', !isActive);
  if (window.__examLanguage === 'ar') {
    individualButton.textContent = isActive ? 'فرض\nمحروس' : 'فرض\nمنزلي';
  } else {
    individualButton.textContent = isActive ? 'Devoir\nindividuel' : 'Devoir\nlibre';
  }
  button.textContent = window.__examLanguage === 'ar' ? 'Français' : 'العربية';
}

function syncDurationLabels() {
  document.querySelectorAll('.tiny-duration-control strong').forEach(function (duration) {
    var text = (duration.textContent || '').trim();
    var next = window.__examLanguage === 'ar' ? DURATION_FR_TO_AR[text] : DURATION_AR_TO_FR[text];
    if (next) duration.textContent = next;
  });
}

function scheduleDurationSync() {
  syncDurationLabels();
  setTimeout(syncDurationLabels, 0);
  setTimeout(syncDurationLabels, 40);
  setTimeout(syncDurationLabels, 120);
}

function bindDurationButtons() {
  document.querySelectorAll('.tiny-duration-control button').forEach(function (button) {
    if (button.dataset.durationSyncBound === 'true') return;
    button.dataset.durationSyncBound = 'true';
    button.addEventListener('click', scheduleDurationSync);
  });
}

function syncExerciseTitles() {
  document.querySelectorAll('.exam-exercise:not(.blank-exercise) .exercise-title-controls > span:first-child').forEach(function (span) {
    var controls = span.closest('.exercise-title-controls');
    var text = span.textContent || '';
    var match = text.match(/(?:Exercice|\u062a\u0645\u0631\u064a\u0646)\s*(\d+)/i);
    if (!match) return;
    var isHomeworkTitle = controls && !controls.querySelector('button');
    var next = window.__examLanguage === 'ar'
      ? '\u062a\u0645\u0631\u064a\u0646 ' + match[1] + (isHomeworkTitle ? '' : ' :')
      : 'Exercice ' + match[1] + (isHomeworkTitle ? '' : ' :');
    if (span.textContent !== next) span.textContent = next;
  });
}

function syncLanguageMode() {
  document.body.classList.toggle('arabic-mode', window.__examLanguage === 'ar');
  document.documentElement.setAttribute('dir', 'ltr');
  syncLanguageButton();
  syncHeaderLanguage();
  bindDurationButtons();
  scheduleDurationSync();
  syncExerciseTitles();
  if (typeof formatExercisePointLabels === 'function') formatExercisePointLabels();
}

syncLanguageMode();
setTimeout(syncLanguageMode, 100);
setTimeout(syncLanguageMode, 400);

new MutationObserver(function () {
  syncLanguageButton();
  syncHeaderLanguage();
  bindDurationButtons();
  scheduleDurationSync();
  syncExerciseTitles();
}).observe(document.body, { childList: true, subtree: true });
