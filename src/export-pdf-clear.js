function syncExportPdfButton() {
  document.querySelectorAll('.panel button.secondary').forEach(function (button) {
    var text = button.textContent || '';
    if (text.includes('Export en cours')) return;
    if (text !== 'Exporter PDF') button.textContent = 'Exporter PDF';
  });
}

syncExportPdfButton();
setTimeout(syncExportPdfButton, 100);
setTimeout(syncExportPdfButton, 400);

new MutationObserver(function () {
  syncExportPdfButton();
}).observe(document.body, { childList: true, subtree: true, characterData: true });
