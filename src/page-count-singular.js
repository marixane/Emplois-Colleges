function syncPageCountLabels() {
  document.querySelectorAll('.page-count-card .compact-control strong').forEach(function (node) {
    var value = parseInt(String(node.textContent || '').match(/\d+/)?.[0] || '0', 10);
    var next = window.__examLanguage === 'ar' ? value + ' ت' : value + (value <= 1 ? ' Ex' : ' Exs');
    if (node.textContent !== next) node.textContent = next;
  });
}

syncPageCountLabels();
setTimeout(syncPageCountLabels, 100);
setTimeout(syncPageCountLabels, 400);
setInterval(syncPageCountLabels, 250);

new MutationObserver(function () {
  syncPageCountLabels();
}).observe(document.body, { childList: true, subtree: true, characterData: true });
