const JULY_DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JULY_DOTS = Array.from({ length: 4 }, () => '.'.repeat(74)).join('\n');
const JULY_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];

const getJulyDate = (text) => {
  const match = String(text || '').match(/(\d{2})\/(\d{2})/);
  if (!match) return null;
  return { day: Number(match[1]), month: Number(match[2]) };
};

const getJulyPageTitle = (page) => String(
  page.querySelector('.homework-page > div:first-child > div:first-child')?.textContent ||
  page.firstElementChild?.firstElementChild?.textContent ||
  ''
).trim();

const getJulyGroups = () => {
  const table = document.querySelector('.timetable-table');
  const wrap = Array.from(table?.parentElement?.children || []).find((node) => String(node.getAttribute('style') || '').includes('grid-template-columns: repeat(5'));
  return Array.from(wrap?.children || []).map((node, index) => ({
    title: String(node.children?.[0]?.textContent || '').trim(),
    color: JULY_COLORS[index % JULY_COLORS.length],
    classes: Array.from(node.children?.[1]?.querySelectorAll('span') || []).map((span) => String(span.textContent || '').trim()).filter(Boolean)
  })).filter((group) => group.title && group.classes.length);
};

const removeWrongNativeJulyEntries = () => {
  document.querySelectorAll('.homework-page:not([data-cahier-july-complete="true"]) .homework-entry:not(.cahier-exam-entry):not(.cahier-extra-holiday-entry)').forEach((entry) => {
    const date = getJulyDate(entry.querySelector('.homework-date')?.textContent || '');
    if (date?.month === 7 && date.day >= 4) entry.remove();
  });
};

const makeJulyEntry = ({ date, subject, text }) => {
  const entry = document.createElement('section');
  entry.className = 'homework-entry';
  entry.dataset.cahierJulyEntry = 'true';
  entry.style.setProperty('--homework-color', '#2f80ed');

  const dateNode = document.createElement('div');
  dateNode.className = 'homework-date';
  dateNode.textContent = date;

  const content = document.createElement('div');
  content.className = 'homework-content';

  const subjectNode = document.createElement('div');
  subjectNode.className = 'homework-subject';
  subjectNode.textContent = subject;

  const textNode = document.createElement('div');
  textNode.className = 'homework-text';
  textNode.textContent = text;
  textNode.style.color = 'rgba(63, 64, 80, 0.28)';
  textNode.style.fontSize = '22px';
  textNode.style.fontWeight = '900';
  textNode.style.lineHeight = '1.35';
  textNode.style.whiteSpace = 'pre-wrap';

  content.append(subjectNode, textNode);
  entry.append(dateNode, content);
  return entry;
};

const getJulyEntries = (group) => {
  const entries = [];
  for (let day = 4; day <= 10; day += 1) {
    const date = new Date(2027, 6, day);
    if (date.getDay() === 0) continue;
    const monthDate = `${String(day).padStart(2, '0')}/07`;
    entries.push({ date: `${JULY_DAYS[date.getDay()]} ${monthDate}`, subject: group.classes.join(' / '), text: JULY_DOTS });
  }
  return entries;
};

const countEntries = (page) => page.querySelectorAll('.homework-entry').length;

const makeJulyPage = (group) => {
  const page = document.createElement('div');
  page.className = 'a4-page cahier-page homework-page cahier-visible-group-page';
  page.dataset.cahierJulyComplete = 'true';
  page.style.setProperty('--group-color', group.color);
  page.style.position = 'relative';
  page.style.paddingTop = '60px';
  page.style.display = 'block';

  const header = document.createElement('div');
  header.style.position = 'absolute';
  header.style.top = '10px';
  header.style.left = '50px';
  header.style.right = '18px';
  header.style.height = '42px';
  header.style.display = 'grid';
  header.style.gridTemplateColumns = '230px 1fr';
  header.style.alignItems = 'center';
  header.style.borderRadius = '12px';
  header.style.background = 'var(--group-color)';
  header.style.padding = '0 18px';

  const title = document.createElement('div');
  title.style.fontSize = '20px';
  title.style.fontWeight = '900';
  title.style.textTransform = 'uppercase';
  title.textContent = group.title;

  const label = document.createElement('div');
  label.style.fontSize = '13px';
  label.style.fontWeight = '900';
  label.style.textAlign = 'right';
  label.textContent = 'MOIS 07';

  header.append(title, label);
  page.append(header);
  return page;
};

const findTargetJulyPage = (group) => {
  const pages = Array.from(document.querySelectorAll('.homework-page:not([data-cahier-july-complete="true"])'))
    .filter((page) => getJulyPageTitle(page) === group.title);
  return pages.reverse().find((page) => String(page.textContent || '').includes('Rattrapage : 2ème Bac')) || pages[0] || null;
};

const addJulyComplete = () => {
  const shell = document.querySelector('.cahier-preview-zone');
  if (!shell) return;

  document.querySelectorAll('[data-cahier-july-entry="true"]').forEach((entry) => entry.remove());
  document.querySelectorAll('[data-cahier-july-complete="true"]').forEach((page) => page.remove());
  removeWrongNativeJulyEntries();

  getJulyGroups().forEach((group) => {
    let page = findTargetJulyPage(group);
    if (!page) return;

    getJulyEntries(group).forEach((entryData) => {
      if (countEntries(page) >= 5) {
        const nextPage = makeJulyPage(group);
        page.after(nextPage);
        page = nextPage;
      }
      page.append(makeJulyEntry(entryData));
    });
  });
};

let julyCompleteTimer = 0;
const scheduleJulyComplete = () => {
  clearTimeout(julyCompleteTimer);
  julyCompleteTimer = setTimeout(addJulyComplete, 900);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleJulyComplete, { once: true });
else scheduleJulyComplete();
window.setTimeout(scheduleJulyComplete, 2500);
window.setTimeout(scheduleJulyComplete, 5000);
document.addEventListener('input', scheduleJulyComplete, { passive: true });
document.addEventListener('drop', scheduleJulyComplete, { passive: true });
document.addEventListener('mouseup', scheduleJulyComplete, { passive: true });
