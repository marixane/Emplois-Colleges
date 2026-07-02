function getPageCards() {
  return Array.from(document.querySelectorAll('.page-count-card'));
}

function getVisibleExerciseCount(pageIndex) {
  var card = getPageCards()[pageIndex];
  var strong = card && card.querySelector('strong');
  var match = String((strong && strong.textContent) || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function clickExerciseCountButton(pageIndex, wanted) {
  var card = getPageCards()[pageIndex];
  if (!card) return false;
  var buttons = Array.from(card.querySelectorAll('.compact-control button'));
  var button = buttons.find(function (b) {
    var text = String(b.textContent || '').trim();
    return !b.disabled && (text === wanted || (wanted === '-' && text === '−'));
  });
  if (!button) return false;
  button.click();
  setTimeout(syncExerciseLineControls, 90);
  setTimeout(syncExerciseLineControls, 220);
  return true;
}

function ensureExerciseLineControlStyle() {
  if (document.getElementById('exercise-line-add-remove-style')) return;
  var style = document.createElement('style');
  style.id = 'exercise-line-add-remove-style';
  style.textContent = '.exercise-line-count-controls{position:absolute!important;left:calc(50% + 190px)!important;top:16px!important;transform:translateX(-50%)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;pointer-events:auto!important;z-index:999!important}.exercise-line-count-controls button{width:34px!important;min-width:34px!important;height:24px!important;min-height:24px!important;border-radius:6px!important;border:1px solid #64748b!important;background:#ffffff!important;color:#0f172a!important;font-size:17px!important;font-weight:900!important;line-height:1!important;padding:0!important;margin:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-sizing:border-box!important;box-shadow:0 1px 3px rgba(15,23,42,.18)!important}.exercise-line-count-controls button:hover{background:#e0f2fe!important;border-color:#2563eb!important;color:#1d4ed8!important}.exercise-line-count-controls button.minus:hover{background:#fee2e2!important;border-color:#dc2626!important;color:#b91c1c!important}.exercise-line-count-controls button:disabled{opacity:.35!important;cursor:not-allowed!important}@media(max-width:1200px){.exercise-line-count-controls{left:calc(50% + 95px)!important;top:13px!important;gap:10px!important}.exercise-line-count-controls button{width:30px!important;min-width:30px!important;height:22px!important;min-height:22px!important;font-size:15px!important;border-radius:5px!important}}@media print{.exercise-line-count-controls{display:none!important}}';
  document.head.appendChild(style);
}

function makeExerciseLineControls(pageIndex) {
  var controls = document.createElement('div');
  controls.className = 'exercise-line-count-controls';

  var minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'minus';
  minus.textContent = '−';
  minus.title = 'Supprimer un exercice';

  var plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'plus';
  plus.textContent = '+';
  plus.title = 'Ajouter un exercice';

  minus.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    clickExerciseCountButton(pageIndex, '-');
  });

  plus.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    clickExerciseCountButton(pageIndex, '+');
  });

  controls.appendChild(minus);
  controls.appendChild(plus);
  return controls;
}

function syncExerciseLineControls() {
  ensureExerciseLineControlStyle();

  document.querySelectorAll('.a4-page').forEach(function (pageNode, pageIndex) {
    pageNode.querySelectorAll('.exercise-line-count-controls').forEach(function (old) { old.remove(); });

    var exercises = Array.from(pageNode.querySelectorAll('.exam-exercise')).filter(function (exercise) {
      return !exercise.classList.contains('blank-exercise');
    });
    if (!exercises.length) return;

    var lastExercise = exercises[exercises.length - 1];
    var title = lastExercise.querySelector('.exercise-title');
    if (!title) return;

    if (getComputedStyle(title).position === 'static') title.style.position = 'relative';

    var controls = makeExerciseLineControls(pageIndex);
    var count = getVisibleExerciseCount(pageIndex);
    var minus = controls.querySelector('.minus');
    var plus = controls.querySelector('.plus');
    if (minus) minus.disabled = count <= 0;
    if (plus) plus.disabled = count >= 6 || (pageIndex > 0 && getVisibleExerciseCount(0) === 0);

    title.appendChild(controls);
  });
}

syncExerciseLineControls();
setTimeout(syncExerciseLineControls, 200);
setTimeout(syncExerciseLineControls, 700);
setInterval(syncExerciseLineControls, 1200);
window.addEventListener('resize', syncExerciseLineControls);
