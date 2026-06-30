window.__examLanguage = window.__examLanguage || localStorage.getItem('examLanguage') || 'fr';

const FR_HEADER = {
  rightTop: 'Lycée El jamai ,Tanger',
  individualTitle: 'Devoir individuel',
  subject: 'Mathématique'
};

const AR_HEADER = {
  rightTop: 'ثانوية الجامعي، طنجة',
  individualTitle: 'فرض محروس',
  subject: 'الرياضيات'
};

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

  var titleTop = document.querySelector('.title-line-top');
  if (titleTop) {
    var currentTop = titleTop.value || '';
    var isIndividual = currentTop === FR_HEADER.individualTitle || currentTop === AR_HEADER.individualTitle;
    if (isIndividual) setInputValue('.title-line-top', header.individualTitle);
  }

  var titleMiddle = document.querySelector('.title-line-middle');
  if (titleMiddle) {
    var currentMiddle = titleMiddle.value || '';
    var isSubject = currentMiddle === FR_HEADER.subject || currentMiddle === AR_HEADER.subject;
    if (isSubject) setInputValue('.title-line-middle', header.subject);
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
      localStorage.setItem('examLanguage', window.__examLanguage);
      syncLanguageMode();
    });

    var title = panel.querySelector('.eyebrow');
    if (title && title.nextSibling) panel.insertBefore(button, title.nextSibling);
    else panel.insertBefore(button, panel.firstChild);
  }

  button.textContent = window.__examLanguage === 'ar' ? 'Français' : 'العربية';
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
  syncExerciseTitles();
  if (typeof formatExercisePointLabels === 'function') formatExercisePointLabels();
}

syncLanguageMode();
setTimeout(syncLanguageMode, 100);
setTimeout(syncLanguageMode, 400);

new MutationObserver(function () {
  syncLanguageButton();
  syncHeaderLanguage();
  syncExerciseTitles();
}).observe(document.body, { childList: true, subtree: true });
