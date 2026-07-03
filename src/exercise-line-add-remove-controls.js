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
  var css = '.a4-page{position:relative!important}.exercise-line-count-overlay{position:absolute!important;left:calc(50% - 300px)!important;top:154px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:13px!important;z-index:99999!important;pointer-events:auto!important;transform:translateX(-50%)!important;opacity:.22!important;transition:opacity .12s ease!important}.exercise-line-count-overlay:hover{opacity:1!important}.exercise-line-count-overlay button{width:46px!important;min-width:46px!important;height:36px!important;min-height:36px!important;border-radius:7px!important;border:1px solid rgba(100,116,139,.35)!important;background:rgba(255,255,255,.32)!important;color:rgba(15,23,42,.45)!important;font-size:18px!important;font-weight:900!important;line-height:1!important;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-sizing:border-box!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent!important}.exercise-line-count-overlay:hover button{background:#ffffff!important;border-color:#64748b!important;color:#0f172a!important;box-shadow:0 1px 3px rgba(15,23,42,.18)!important}.exercise-line-count-overlay button:hover{background:#e0f2fe!important;border-color:#2563eb!important;color:#1d4ed8!important}.exercise-line-count-overlay button.minus:hover{background:#fee2e2!important;border-color:#dc2626!important;color:#b91c1c!important}.exercise-line-count-overlay button:disabled{opacity:.18!important;cursor:not-allowed!important}@media(max-width:1200px){.exercise-line-count-overlay{gap:11px!important;opacity:.28!important}.exercise-line-count-overlay:hover{opacity:1!important}.exercise-line-count-overlay button{width:46px!important;min-width:46px!important;height:36px!important;min-height:36px!important;font-size:18px!important;border-radius:7px!important}}@media print{.exercise-line-count-overlay{display:none!important}}';
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

  document.querySelectorAll('.a4-page').forEach(function (pageNode, pageIndex) {
    var rect = pageNode.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var controls = pageNode.querySelector('.exercise-line-count-overlay[data-page-index="' + pageIndex + '"]');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'exercise-line-count-overlay';
      controls.setAttribute('data-page-index', String(pageIndex));
      controls.appendChild(makeButton('−', 'minus', pageIndex, '-'));
      controls.appendChild(makeButton('+', 'plus', pageIndex, '+'));
      pageNode.appendChild(controls);
    }

    var count = getVisibleExerciseCount(pageIndex);
    var realCount = getRealExerciseCount(pageIndex);

    var minus = controls.querySelector('.minus');
    var plus = controls.querySelector('.plus');
    if (minus) minus.disabled = realCount <= 0;
    if (plus) plus.disabled = count >= 6 || (pageIndex > 0 && getVisibleExerciseCount(0) === 0);
  });

  document.querySelectorAll('.exercise-line-count-overlay').forEach(function (controls) {
    var pageIndex = Number(controls.getAttribute('data-page-index'));
    var pageNode = document.querySelectorAll('.a4-page')[pageIndex];
    if (!pageNode || controls.parentElement !== pageNode) controls.remove();
  });
}

syncExerciseLineControls();
setTimeout(syncExerciseLineControls, 100);
setTimeout(syncExerciseLineControls, 250);
setTimeout(syncExerciseLineControls, 700);
window.addEventListener('resize', syncExerciseLineControls);
window.syncExerciseLineControls = syncExerciseLineControls;
