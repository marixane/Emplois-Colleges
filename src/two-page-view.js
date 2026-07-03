const TWO_PAGE_VIEW_KEY = 'exam-two-page-view';

function pageCount() {
  return document.querySelectorAll('.preview-zone .a4-page').length;
}

function hasMultiplePages() {
  return pageCount() > 1;
}

function isTwoPageViewEnabled() {
  return localStorage.getItem(TWO_PAGE_VIEW_KEY) === 'true';
}

function setTwoPageView(enabled) {
  localStorage.setItem(TWO_PAGE_VIEW_KEY, enabled ? 'true' : 'false');
  syncTwoPageView();
}

function getSteppedScale(rawScale) {
  if (rawScale >= 0.98) return 1;
  if (rawScale >= 0.94) return 0.95;
  if (rawScale >= 0.88) return 0.90;
  if (rawScale >= 0.82) return 0.84;
  if (rawScale >= 0.76) return 0.78;
  if (rawScale >= 0.70) return 0.72;
  if (rawScale >= 0.64) return 0.66;
  if (rawScale >= 0.58) return 0.60;
  if (rawScale >= 0.52) return 0.54;
  if (rawScale >= 0.46) return 0.48;
  if (rawScale >= 0.40) return 0.42;
  if (rawScale >= 0.34) return 0.36;
  if (rawScale >= 0.28) return 0.30;
  return 0.24;
}

function updateSheetZoom(twoPageEnabled) {
  const panel = document.querySelector('.panel');
  const panelWidth = (panel && panel.getBoundingClientRect().width) || 180;
  const gap = twoPageEnabled ? 10 : 6;
  const available = Math.max(120, window.innerWidth - panelWidth - gap - 18);
  const natural = twoPageEnabled ? 794 * 2 + 16 : 794;
  const scale = getSteppedScale(Math.min(1, available / natural));

  document.documentElement.style.setProperty('--sheet-scale', String(scale));
  document.documentElement.style.setProperty('--sheet-columns', twoPageEnabled ? '2' : '1');
  document.body.classList.toggle('sheet-zoom-active', scale < 0.999);
}

function syncTwoPageView() {
  const multiple = hasMultiplePages();
  const enabled = isTwoPageViewEnabled() && multiple;
  document.body.classList.toggle('two-page-view', enabled);
  updateSheetZoom(enabled);

  const button = document.querySelector('.two-page-view-toggle');
  if (!button) return;

  button.classList.toggle('on', enabled);
  button.classList.toggle('off', !enabled);
  button.disabled = !multiple;
  button.innerHTML = enabled ? '<span class="two-page-icon two-page-icon-2" aria-hidden="true"><i></i><i></i></span>' : '<span class="two-page-icon two-page-icon-1" aria-hidden="true"><i></i></span>';
  button.setAttribute('aria-label', enabled ? 'Affichage 2 pages côte à côte' : 'Affichage 1 page');
  button.title = multiple ? (enabled ? 'Afficher 1 page' : 'Afficher 2 pages côte à côte') : 'Ajoute une 2e feuille pour activer cet affichage';
}

function ensureTwoPageViewButton() {
  const panel = document.querySelector('.panel');
  if (!panel || panel.querySelector('.two-page-view-toggle')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'two-page-view-toggle off';
  button.addEventListener('click', function () {
    if (!hasMultiplePages()) return;
    setTwoPageView(!isTwoPageViewEnabled());
  });

  const barButton = panel.querySelector('.bar-ribbon-toggle');
  if (barButton && barButton.nextSibling) panel.insertBefore(button, barButton.nextSibling);
  else panel.appendChild(button);

  syncTwoPageView();
}

function initTwoPageView() {
  ensureTwoPageViewButton();
  syncTwoPageView();
}

localStorage.setItem(TWO_PAGE_VIEW_KEY, 'false');
initTwoPageView();
setTimeout(initTwoPageView, 200);
setTimeout(initTwoPageView, 700);
setInterval(initTwoPageView, 500);
window.addEventListener('resize', syncTwoPageView);

window.syncTwoPageView = syncTwoPageView;
