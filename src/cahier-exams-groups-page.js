import './cahier-progress-sept-may-v3.js';

const SECOND_PAGE_ID = 'cahier-exams-groups-page';
const SECOND_PAGE_TITLE_CLASS = 'cahier-exams-groups-main-title';

const findTimetablePage = () => document.querySelector('.timetable-table')?.closest?.('.a4-page.cahier-page');

const findGroupsBlock = (page) => Array.from(page?.children || []).find((node) => {
  if (node.id === SECOND_PAGE_ID || node.classList?.contains(SECOND_PAGE_TITLE_CLASS)) return false;
  if (node.querySelector?.('.cahier-exams-list, .timetable-table')) return false;
  const text = String(node.textContent || '').toUpperCase();
  const oldTitles = text.includes('TRONC COMMUN') && text.includes('1ÈRES BAC') && text.includes('2ÈME BAC');
  const collegeTitles = text.includes('1 AC') && text.includes('2 AC') && text.includes('3 AC');
  return oldTitles || collegeTitles;
});

const getOrCreateSecondPage = (timetablePage) => {
  let page = document.getElementById(SECOND_PAGE_ID);
  if (!page) {
    page = document.createElement('div');
    page.id = SECOND_PAGE_ID;
    page.className = 'a4-page cahier-page cahier-exams-groups-page';
    timetablePage.insertAdjacentElement('afterend', page);
  }

  let title = page.querySelector(`.${SECOND_PAGE_TITLE_CLASS}`);
  if (!title) {
    title = document.createElement('div');
    title.className = SECOND_PAGE_TITLE_CLASS;
    page.prepend(title);
  }
  title.textContent = 'Liste des groupes';

  return page;
};

const removeExamTables = () => {
  document.querySelectorAll('.cahier-exams-list').forEach((examList) => examList.remove());
};

const makeSecondPage = () => {
  const timetablePage = findTimetablePage();
  if (!timetablePage) return;

  const secondPage = getOrCreateSecondPage(timetablePage);
  const groups = findGroupsBlock(timetablePage) || findGroupsBlock(secondPage);
  if (!groups) return;

  removeExamTables();
  groups.style.removeProperty('display');

  if (groups.parentElement !== secondPage) secondPage.append(groups);
};

const scheduleSecondPage = () => {
  window.requestAnimationFrame(makeSecondPage);
  window.setTimeout(makeSecondPage, 120);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleSecondPage, { once: true });
} else {
  scheduleSecondPage();
}

document.addEventListener('focusout', scheduleSecondPage, true);
document.addEventListener('drop', scheduleSecondPage, true);
document.addEventListener('click', (event) => {
  if (event.target?.closest?.('.timetable-table, .span-tools, .cahier-tab, .cahier-preview-zone, .cahier-exams-groups-page')) scheduleSecondPage();
}, true);