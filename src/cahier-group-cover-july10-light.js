const EXIT_TEXT = 'Le procès-verbal de sortie';

const dateInfo = (text) => {
  const match = String(text || '').match(/(\d{2})\/(\d{2})/);
  return match ? { day: Number(match[1]), month: Number(match[2]) } : null;
};

const afterJuly10 = (text) => {
  const date = dateInfo(text);
  return date?.month === 7 && date.day > 10;
};

const pageTitle = (page) => String(
  page.firstElementChild?.firstElementChild?.textContent ||
  page.querySelector(':scope > div:first-child > div:first-child')?.textContent ||
  ''
).trim();

const isEventEntry = (entry) => {
  const text = String(entry.textContent || '').toLowerCase();
  return entry.classList.contains('cahier-extra-holiday-entry') ||
    entry.classList.contains('cahier-exam-entry') ||
    text.includes('vacance') ||
    text.includes('examen') ||
    text.includes('rattrapage') ||
    text.includes('procès-verbal');
};

const groupHasRealClass = (pages) => pages.some((page) => Array.from(page.querySelectorAll('.homework-entry')).some((entry) => {
  if (isEventEntry(entry)) return false;
  const subject = String(entry.querySelector('.homework-subject')?.textContent || '').trim();
  return subject.length > 0;
}));

const getGroups = () => {
  const list = [];
  document.querySelectorAll('.homework-page').forEach((page) => {
    const title = pageTitle(page);
    if (!title) return;
    let group = list.find((item) => item.title === title);
    if (!group) {
      group = { title, pages: [], color: page.style.getPropertyValue('--group-color') || '#e0f2fe' };
      list.push(group);
    }
    group.pages.push(page);
  });
  return list.filter((group) => groupHasRealClass(group.pages));
};

const coverPage = (group) => {
  const page = document.createElement('div');
  page.className = 'a4-page cahier-page cahier-light-group-cover';
  page.style.cssText = `position:relative;display:flex;align-items:center;justify-content:center;padding:70px;--group-color:${group.color};`;
  page.innerHTML = `<div style="width:100%;min-height:620px;border-radius:32px;border:5px solid rgba(17,24,39,.18);background:linear-gradient(180deg, ${group.color}, white);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 18px 45px rgba(17,24,39,.14)"><div style="font-size:32px;font-weight:900;color:#111827;text-transform:uppercase;margin-bottom:24px">${group.title}</div><div style="width:70%;height:3px;background:rgba(17,24,39,.2);border-radius:999px;margin-bottom:26px"></div><div style="font-size:20px;font-weight:800;color:#374151">Cahier de texte annuel</div></div>`;
  return page;
};

const exitEntry = () => {
  const entry = document.createElement('section');
  entry.className = 'homework-entry cahier-extra-holiday-entry cahier-light-exit-entry';
  entry.style.setProperty('--homework-color', '#f97316');
  entry.innerHTML = `<div class="homework-date">VENDREDI 10/07</div><div class="homework-content"><div class="homework-subject"><div><span>Administration</span></div></div><div class="homework-text" style="color:#9a3412;font-size:21px;font-weight:900;text-align:center;background:linear-gradient(90deg,rgba(254,215,170,.38),rgba(254,243,199,.62));border-radius:12px;margin:8px 18px;padding:10px 16px">${EXIT_TEXT}</div></div>`;
  return entry;
};

const exitPage = (group) => {
  const source = group.pages[group.pages.length - 1];
  const page = document.createElement('div');
  page.className = 'a4-page cahier-page homework-page cahier-light-exit-page';
  page.style.cssText = `position:relative;padding-top:60px;--group-color:${group.color};`;
  const header = source.firstElementChild?.cloneNode(true);
  if (header) page.append(header);
  page.append(exitEntry());
  return page;
};

const applyLightCovers = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;

  document.querySelectorAll('.cahier-light-group-cover,.cahier-light-exit-page,.cahier-light-exit-entry').forEach((node) => node.remove());

  document.querySelectorAll('.homework-entry').forEach((entry) => {
    if (afterJuly10(entry.querySelector('.homework-date')?.textContent)) entry.remove();
  });

  document.querySelectorAll('.homework-page').forEach((page) => {
    if (!page.querySelector('.homework-entry')) page.remove();
  });

  getGroups().forEach((group) => {
    const firstPage = group.pages[0];
    const lastPage = group.pages[group.pages.length - 1];
    if (!firstPage || !lastPage) return;
    firstPage.before(coverPage(group));
    lastPage.after(exitPage(group));
  });
};

const scheduleLightCovers = () => window.setTimeout(applyLightCovers, 250);

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleLightCovers, { once: true });
else scheduleLightCovers();

window.setTimeout(applyLightCovers, 1000);
window.setTimeout(applyLightCovers, 2500);
window.setTimeout(applyLightCovers, 5000);
document.addEventListener('change', scheduleLightCovers, { passive: true });
document.addEventListener('drop', scheduleLightCovers, { passive: true });
