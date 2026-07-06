const EXIT_TEXT = 'La signature de procès-verbal de sortie';
const APPLY_DELAY = 450;
let applyTimer = null;

const firstDateInfo = (text) => {
  const match = String(text || '').match(/(\d{2})\/(\d{2})/);
  return match ? { day: Number(match[1]), month: Number(match[2]) } : null;
};

const isAfterJuly10 = (text) => {
  const date = firstDateInfo(text);
  return date?.month === 7 && date.day > 10;
};

const isEditing = () => {
  const active = document.activeElement;
  return Boolean(active?.matches?.('textarea,input,[contenteditable="true"]'));
};

const getGroupKey = (page) => {
  const color = page.style.getPropertyValue('--group-color').trim();
  const title = page.firstElementChild?.textContent?.trim() || '';
  return color || title;
};

const makeFallbackHeader = () => {
  const header = document.createElement('div');
  header.style.cssText = 'position:absolute;top:10px;left:50px;right:18px;height:42px;display:grid;grid-template-columns:230px 1fr;align-items:center;gap:18px;border-radius:12px;background:#fef3c7;color:#111827;padding:0 18px;box-shadow:0 2px 6px rgba(17,17,17,.12);font:900 20px Arial,sans-serif;text-transform:uppercase;';
  header.textContent = 'Administration';
  return header;
};

const makeExitPage = (sourcePage) => {
  const color = sourcePage.style.getPropertyValue('--group-color').trim() || '#fef3c7';
  const page = document.createElement('div');
  page.className = 'a4-page cahier-page homework-page cahier-web-exit-page';
  page.style.cssText = `position:relative;padding-top:60px;--group-color:${color};`;

  page.append(sourcePage.firstElementChild?.cloneNode(true) || makeFallbackHeader());

  const section = document.createElement('section');
  section.className = 'homework-entry cahier-extra-holiday-entry cahier-web-exit-entry';
  section.style.setProperty('--homework-color', '#f97316');
  section.innerHTML = '<div class="homework-date">VENDREDI 10/07</div><div class="homework-content"><div class="homework-subject"><div><span>Administration</span></div></div><div class="homework-text" style="color:#9a3412;font-size:21px;font-weight:900;text-align:center;background:linear-gradient(90deg,rgba(254,215,170,.38),rgba(254,243,199,.62));border-radius:12px;margin:8px 18px;padding:10px 16px">' + EXIT_TEXT + '</div></div>';
  page.append(section);
  return page;
};

const removeAfterJuly10 = (root) => {
  root.querySelectorAll('.homework-entry').forEach((entry) => {
    if (entry.classList.contains('cahier-web-exit-entry')) return;
    const text = entry.querySelector('.homework-date')?.textContent || entry.textContent;
    if (isAfterJuly10(text)) entry.remove();
  });

  root.querySelectorAll('.homework-page:not(.cahier-web-exit-page)').forEach((page) => {
    if (!page.querySelector('.homework-entry')) page.remove();
  });
};

const appendExitPageForEachGroup = (root) => {
  const groups = [];
  root.querySelectorAll('.homework-page:not(.cahier-web-exit-page)').forEach((page) => {
    const key = getGroupKey(page);
    if (!key) return;
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = { key, pages: [] };
      groups.push(group);
    }
    group.pages.push(page);
  });

  groups.forEach((group) => {
    if (group.pages.some((page) => String(page.textContent || '').includes(EXIT_TEXT))) return;
    const lastPage = group.pages[group.pages.length - 1];
    if (lastPage) lastPage.after(makeExitPage(lastPage));
  });
};

const applyJuly10WebFinish = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;
  if (isEditing()) return;
  const root = document.querySelector('.cahier-preview-zone');
  if (!root) return;

  root.querySelectorAll('.cahier-web-exit-page').forEach((page) => page.remove());
  removeAfterJuly10(root);
  appendExitPageForEachGroup(root);
};

const scheduleJuly10WebFinish = () => {
  window.clearTimeout(applyTimer);
  applyTimer = window.setTimeout(applyJuly10WebFinish, APPLY_DELAY);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleJuly10WebFinish, { once: true });
} else {
  scheduleJuly10WebFinish();
}

window.setTimeout(scheduleJuly10WebFinish, 1200);
window.setTimeout(scheduleJuly10WebFinish, 3000);
document.addEventListener('focusout', scheduleJuly10WebFinish, true);
document.addEventListener('click', () => {
  if (!isEditing()) scheduleJuly10WebFinish();
}, true);
