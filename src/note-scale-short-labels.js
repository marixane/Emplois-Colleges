function updateNoteScaleLabels() {
  document.querySelectorAll('.note-scale-button').forEach(function (button) {
    var text = (button.textContent || '').trim();
    if (text === 'Sur 10') button.textContent = '/ 10';
    if (text === 'Sur 20') button.textContent = '/ 20';
  });

  document.querySelectorAll('.note-scale-counter').forEach(function (counter) {
    var text = counter.textContent || '';
    var match = text.match(/Total\s*:\s*([0-9]+(?:[,.][0-9]+)?)/i);
    if (match) counter.textContent = match[1].replace('.', ',');
  });
}

updateNoteScaleLabels();
setTimeout(updateNoteScaleLabels, 200);
setTimeout(updateNoteScaleLabels, 700);

document.addEventListener('click', function () {
  setTimeout(updateNoteScaleLabels, 80);
});

window.updateNoteScaleLabels = updateNoteScaleLabels;
