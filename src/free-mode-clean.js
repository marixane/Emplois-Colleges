function cleanFreeModeExerciseTitles() {
  if (!document.body.classList.contains('no-title-points')) return;
  document.querySelectorAll('.exam-exercise:not(.blank-exercise) .exercise-title-controls > span:first-child').forEach(function (span) {
    var text = span.textContent || '';
    var match = text.match(/(Exercice|\u062a\u0645\u0631\u064a\u0646)\s*(\d+)/i);
    if (!match) return;
    span.textContent = match[1] + ' ' + match[2] + ' :';
  });
}

function syncFreeModeClean() {
  cleanFreeModeExerciseTitles();
}

syncFreeModeClean();
setTimeout(syncFreeModeClean, 200);
setTimeout(syncFreeModeClean, 700);

document.addEventListener('click', function () {
  setTimeout(syncFreeModeClean, 80);
});

window.cleanFreeModeExerciseTitles = cleanFreeModeExerciseTitles;
