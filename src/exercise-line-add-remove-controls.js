function getPageCards() {
  return Array.from(document.querySelectorAll('.page-count-card'));
}

function getVisibleExerciseCount(pageIndex) {
  var card = getPageCards()[pageIndex];
  var strong = card && card.querySelector('strong');
  var match = String((strong && strong.textContent) || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getRealExerciseCount(pageIndex) {
  var pageNode = document.querySelectorAll('.a4-page')[pageIndex];
  if (!pageNode) return getVisibleExerciseCount(pageIndex);
  return Array.from(pageNode.querySelectorAll('.exam-exercise')).filter(function (exercise) {
    return !exercise.classList.contains('blank-exercise');
  }).length;
}

function findCountButton(pageIndex, wanted) {
  var card = getPageCards()[pageIndex];
  if (!card) return null;
  var buttons = Array.from(card.querySelectorAll('.compact-control button'));
  return buttons.find(function (b) {
    var text = String(b.textContent || '').trim();
    return !b.disabled && (text === wanted || (wanted === '-' && text === '−'));
  }) || null;
}

function refreshSoon() {
  setTimeout(syncExerciseLineControls, 20);
  setTimeout(syncExerciseLineControls, 70);
  setTimeout(syncExerciseLineControls, 160);
  setTimeout(syncExerciseLineControls, 340);
}

function pressOriginalCount(pageIndex, wanted) {
  var button = findCountButton(pageIndex, wanted);
  if (!button) return false;
  button.click();
  refreshSoon();
  return true;
}

function retryFirstAdd(pageIndex, triesLeft) {
  if (getRealExerciseCount(pageIndex) > 0 || triesLeft <= 0) {
    refreshSoon();
    return;
  }
  pressOriginalCount(pageIndex, '+');
  setTimeout(function () { retryFirstAdd(pageIndex, triesLeft - 1); }, 120);
}

function runCountAction(pageIndex, wanted) {
  var before = getRealExerciseCount(pageIndex);
  var ok = pressOriginalCount(pageIndex, wanted);
  if (!ok) return;

  if ((wanted === '-' || wanted === '−') && before === 1) {
    setTimeout(function () {
      if (getRealExerciseCount(pageIndex) !== 0) pressOriginalCount(pageIndex, '-');
    }, 90);
  }

  if (wanted === '+' && before === 0) {
    setTimeout(function () { retryFirstAdd(pageIndex, 6); }, 90);
  }
}

function ensureExerciseLineControlStyle() {
  var css = '.exercise-line-count-overlay{position:fixed!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;z-index:99999!important;pointer-events:auto!important;transform:translateX(-50%)!important;opacity:.22!important;transition:opacity .12s ease!important}.exercise-line-count-overlay:hover,.exercise-line-count-overlay.is-near{opacity:1!important}.exercise-line-count-overlay button{width:42px!important;min-width:42px!important;height:26px!important;min-height:26px!important;border-radius:6px!important;border:1px solid rgba(100,116,139,.35)!important;background:rgba(255,255,255,.32)!important;color:rgba(15,23,42,.45)!important;font-size:16px!important;font-weight:900!important;line-height:1!important;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-sizing:border-box!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent!important}.exercise-line-count-overlay:hover button,.exercise-line-count-overlay.is-near button{background:#ffffff!important;border-color:#64748b!important;color:#0f172a!important;box-shadow:0 1px 3px rgba(15,23,42,.18)!important}.exercise-line-count-overlay button:hover{background:#e0f2fe!important;border-color:#2563eb!important;color:#1d4ed8!important}.exercise-line-count-overlay button.minus:hover{background:#fee2e2!important;border-color:#dc2626!important;color:#b91c1c!important}.exercise-line-count-overlay button:disabled{opacity:.18!important;cursor:not-allowed!important}@media(max-width:1200px){.exercise-line-count-overlay{gap:10px!important;opacity:.28!important}.exercise-line-count-overlay:hover,.exercise-line-count-overlay.is-near{opacity:1!important}.exercise-line-count-overlay button{width:42px!important;min-width:42px!important;height:28px!important;min-height:28px!important;font-size:17px!important;border-radius:6px!important}}@media print{.exercise-line-count-overlay{display:none!important}}';
  var style = document.getElementById('exercise-line-add-remove-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'exercise-line-add-remove-style';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

function makeButton(label, className, pageIndex, wanted) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    event.stopPropagation();
    runCountAction(pageIndex, wanted);
  });
  button.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
  return button;
}

function syncExerciseLineControls() {
  ensureExerciseLineControlStyle();
  document.querySelectorAll('.exercise-line-count-controls,.exercise-line-count-overlay').forEach(function (old) { old.remove(); });

  document.querySelectorAll('.a4-page').forEach(function (pageNode, pageIndex) {
    var rect = pageNode.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var count = getVisibleExerciseCount(pageIndex);
    var realCount = getRealExerciseCount(pageIndex);
    var controls = document.createElement('div');
    controls.className = 'exercise-line-count-overlay';
    controls.style.left = (rect.left + rect.width / 2) + 'px';
    controls.style.top = (rect.top + Math.max(20, rect.height * 0.1 - 20)) + 'px';

    var minus = makeButton('−', 'minus', pageIndex, '-');
    var plus = makeButton('+', 'plus', pageIndex, '+');
    minus.disabled = realCount <= 0;
    plus.disabled = count >= 6 || (pageIndex > 0 && getVisibleExerciseCount(0) === 0);

    controls.appendChild(minus);
    controls.appendChild(plus);
    document.body.appendChild(controls);
  });
}

syncExerciseLineControls();
setTimeout(syncExerciseLineControls, 100);
setTimeout(syncExerciseLineControls, 250);
setTimeout(syncExerciseLineControls, 700);
setInterval(syncExerciseLineControls, 500);
window.addEventListener('resize', syncExerciseLineControls);
window.addEventListener('scroll', syncExerciseLineControls, true);
window.syncExerciseLineControls = syncExerciseLineControls;
