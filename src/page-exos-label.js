function updatePageExosLabels() {
  document.querySelectorAll('.page-count-card').forEach(function (card) {
    var value = card.querySelector('strong');
    if (!value) return;

    value.removeAttribute('data-exos-label-ready');

    var match = (value.textContent || '').match(/\d+/);
    if (!match) return;

    var number = match[0];
    if (window.__examLanguage === 'ar') {
      value.innerHTML = '<span class="exos-ar-letter">ت</span><span class="exos-ar-number">' + number + '</span>';
    } else {
      value.textContent = number + ' Exos';
    }
    value.setAttribute('data-exos-label-ready', 'true');
  });
}

updatePageExosLabels();
setTimeout(updatePageExosLabels, 0);
setTimeout(updatePageExosLabels, 50);
setTimeout(updatePageExosLabels, 100);
setTimeout(updatePageExosLabels, 300);
setTimeout(updatePageExosLabels, 700);

document.addEventListener('click', function () {
  setTimeout(updatePageExosLabels, 0);
  setTimeout(updatePageExosLabels, 40);
  setTimeout(updatePageExosLabels, 100);
});
