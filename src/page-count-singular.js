function syncPageCountLabels() {
  document.querySelectorAll('.page-count-card .compact-control strong').forEach(function (node) {
    var value = parseInt(String(node.textContent || '').match(/\d+/)?.[0] || '0', 10);
    if (window.__examLanguage === 'ar') {
      var nextHtml = '<span class="arabic-count-letter">ت</span><span class="arabic-count-number">' + value + '</span>';
      if (node.innerHTML !== nextHtml) node.innerHTML = nextHtml;
      return;
    }

    var next = value + (value <= 1 ? ' Ex' : ' Exs');
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
