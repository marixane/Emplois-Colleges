function ensureBarRibbonPageStyle() {
  var style = document.getElementById('bar-ribbon-page-position-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'bar-ribbon-page-position-style';
    document.head.appendChild(style);
  }

  style.textContent = '.a4-page{position:relative!important}.a4-proxy-control{position:absolute!important;right:auto!important;inset-inline-start:auto!important;inset-inline-end:auto!important;z-index:1000!important;pointer-events:auto!important;margin:0!important;padding:0!important;border-radius:6px!important;border:1px solid #64748b!important;background:#ffffff!important;color:#0f172a!important;box-shadow:0 1px 3px rgba(15,23,42,.18)!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;white-space:nowrap!important;overflow:hidden!important;cursor:pointer!important;direction:ltr!important;unicode-bidi:isolate!important}.a4-proxy-control:hover{background:#e0f2fe!important;border-color:#2563eb!important;color:#1d4ed8!important}.a4-top-control{top:calc(var(--exam-header-height,104px) + 5px)!important;bottom:auto!important;transform:translateX(-50%)!important;width:48px!important;min-width:48px!important;height:24px!important;min-height:24px!important}.a4-text-control{font-size:13px!important;font-weight:900!important}.a4-icon-control{font-size:0!important}.a4-bar-proxy{left:calc(50% - 82px)!important}.a4-lines-proxy{left:calc(50% - 29px)!important}.a4-lang-proxy{left:calc(50% + 24px)!important}.a4-free-proxy{left:calc(50% + 77px)!important}body.arabic-mode .a4-bar-proxy{left:calc(50% - 82px)!important;right:auto!important}body.arabic-mode .a4-lines-proxy{left:calc(50% - 29px)!important;right:auto!important}body.arabic-mode .a4-lang-proxy{left:calc(50% + 24px)!important;right:auto!important}body.arabic-mode .a4-free-proxy{left:calc(50% + 77px)!important;right:auto!important}.a4-bar-proxy:after{content:""!important;width:10px!important;height:15px!important;display:block!important;border-left:3px solid currentColor!important;border-right:3px solid currentColor!important;border-top:2px solid currentColor!important;border-bottom:2px solid currentColor!important;box-sizing:border-box!important}.a4-lines-proxy:after{content:""!important;width:17px!important;height:13px!important;display:block!important;background:repeating-linear-gradient(to bottom,currentColor 0,currentColor 2px,transparent 2px,transparent 5px)!important;border-top:1px solid currentColor!important;border-bottom:1px solid currentColor!important;box-sizing:border-box!important}.a4-note-proxy-wrap{position:absolute!important;left:calc(50% + 158px)!important;right:auto!important;top:calc(var(--exam-header-height,104px) + 5px)!important;bottom:auto!important;transform:translateX(-50%)!important;z-index:1000!important;pointer-events:auto!important;margin:0!important;padding:0!important;display:inline-flex!important;flex-direction:row!important;gap:5px!important;direction:ltr!important;unicode-bidi:isolate!important}body.arabic-mode .a4-note-proxy-wrap{left:calc(50% + 158px)!important;right:auto!important;flex-direction:row!important;direction:ltr!important}.a4-note-proxy{position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:48px!important;min-width:48px!important;height:24px!important;min-height:24px!important;border-radius:6px!important;font-size:13px!important;font-weight:900!important}.a4-footer-preview{left:calc(50% + 54px)!important;right:auto!important;bottom:5px!important;width:58px!important;height:22px!important;font-size:10px!important;font-weight:900!important}.a4-footer-export{left:calc(50% - 70px)!important;right:auto!important;bottom:5px!important;width:68px!important;height:22px!important;font-size:10px!important;font-weight:900!important}.a4-footer-two-page{left:calc(50% + 104px)!important;right:auto!important;bottom:5px!important;width:28px!important;height:22px!important}body.arabic-mode .a4-footer-preview{left:calc(50% + 54px)!important;right:auto!important}body.arabic-mode .a4-footer-export{left:calc(50% - 70px)!important;right:auto!important}body.arabic-mode .a4-footer-two-page{left:calc(50% + 104px)!important;right:auto!important}.a4-proxy-control:disabled{opacity:.35!important;cursor:not-allowed!important}.exam-page.is-exporting .a4-proxy-control,.exam-page.is-exporting .a4-note-proxy-wrap{display:none!important}@media print{.a4-proxy-control,.a4-note-proxy-wrap{display:none!important}}';
}

function getOriginal(selector) {
  return document.querySelector('.panel ' + selector);
}

function findByText(selector, texts) {
  return Array.from(document.querySelectorAll('.panel ' + selector)).find(function (button) {
    return texts.indexOf(String(button.textContent || '').trim()) !== -1;
  }) || null;
}

function findNoteScaleOriginal(label) {
  return Array.from(document.querySelectorAll('.panel .note-scale-button')).find(function (button) {
    var text = String(button.textContent || '').trim();
    return text === label || text === label.replace('/', '/ ') || text === 'Sur ' + label.replace('/', '');
  }) || null;
}

function makeProxy(classes, title, text, action) {
  var page = document.querySelector('.a4-page');
  if (!page) return null;
  var mainClass = classes.split(' ')[classes.split(' ').length - 1];
  var button = page.querySelector('.' + mainClass);
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'a4-proxy-control ' + classes;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof button._proxyAction === 'function') button._proxyAction();
      setTimeout(syncA4ProxyControls, 80);
      setTimeout(syncA4ProxyControls, 250);
    });
    page.appendChild(button);
  }
  button._proxyAction = action;
  button.title = title;
  button.setAttribute('aria-label', title);
  if (typeof text === 'string') button.textContent = text;
  return button;
}

function syncA4ProxyControls() {
  ensureBarRibbonPageStyle();
  var page = document.querySelector('.a4-page');
  if (!page) return;

  makeProxy('a4-top-control a4-icon-control a4-bar-proxy', 'Ruban de barème', '', function () {
    var b = getOriginal('.bar-ribbon-toggle');
    if (b && !b.disabled) b.click();
  });

  makeProxy('a4-top-control a4-icon-control a4-lines-proxy', 'Lignes PDF', '', function () {
    var b = getOriginal('.pdf-lines-toggle');
    if (b && !b.disabled) b.click();
  });

  makeProxy('a4-top-control a4-text-control a4-lang-proxy', window.__examLanguage === 'ar' ? 'Français' : 'Arabe', window.__examLanguage === 'ar' ? 'Fr' : 'Ar', function () {
    var b = getOriginal('.language-toggle');
    if (b && !b.disabled) b.click();
  });

  makeProxy('a4-top-control a4-text-control a4-free-proxy', document.body.classList.contains('no-title-points') ? 'Devoir individuel' : 'Devoir libre', document.body.classList.contains('no-title-points') ? 'D' : 'L', function () {
    var b = getOriginal('.individual-toggle');
    if (b && !b.disabled) b.click();
  });

  var noteWrap = page.querySelector('.a4-note-proxy-wrap');
  if (!noteWrap) {
    noteWrap = document.createElement('div');
    noteWrap.className = 'a4-note-proxy-wrap';
    page.appendChild(noteWrap);
  }
  noteWrap.innerHTML = '';
  ['/10', '/20'].forEach(function (label) {
    var original = findNoteScaleOriginal(label);
    var proxy = document.createElement('button');
    proxy.type = 'button';
    proxy.className = 'a4-proxy-control a4-note-proxy';
    proxy.textContent = label;
    proxy.disabled = original ? original.disabled : true;
    proxy.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var current = findNoteScaleOriginal(label);
      if (current && !current.disabled) current.click();
      setTimeout(syncA4ProxyControls, 80);
    });
    noteWrap.appendChild(proxy);
  });

  var preview = findByText('button', ['Voir PDF', 'Préparation...']);
  var previewProxy = makeProxy('a4-footer-preview', 'Voir PDF', preview && preview.textContent.trim() === 'Préparation...' ? '...' : 'Voir PDF', function () {
    var b = findByText('button', ['Voir PDF', 'Préparation...']);
    if (b && !b.disabled) b.click();
  });
  if (previewProxy && preview) previewProxy.disabled = preview.disabled;

  var exportButton = findByText('button.secondary', ['Exporter PDF A4', 'Export en cours...']);
  var exportProxy = makeProxy('a4-footer-export', 'Exporter PDF A4', exportButton && exportButton.textContent.trim() === 'Export en cours...' ? '...' : 'Exporter', function () {
    var b = findByText('button.secondary', ['Exporter PDF A4', 'Export en cours...']);
    if (b && !b.disabled) b.click();
  });
  if (exportProxy && exportButton) exportProxy.disabled = exportButton.disabled;

  var two = getOriginal('.two-page-view-toggle');
  var twoProxy = makeProxy('a4-footer-two-page', 'Affichage côte à côte', '', function () {
    var b = getOriginal('.two-page-view-toggle');
    if (b && !b.disabled) b.click();
  });
  if (twoProxy && two) {
    twoProxy.disabled = two.disabled;
    twoProxy.innerHTML = two.innerHTML;
  }
}

syncA4ProxyControls();
setTimeout(syncA4ProxyControls, 100);
setTimeout(syncA4ProxyControls, 300);
setTimeout(syncA4ProxyControls, 700);
setInterval(syncA4ProxyControls, 500);
window.addEventListener('resize', syncA4ProxyControls);
window.moveBarRibbonToggleToPage = syncA4ProxyControls;
window.syncA4ProxyControls = syncA4ProxyControls;
