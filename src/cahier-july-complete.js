const JULY_DAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JULY_DOTS = Array.from({ length: 4 }, () => '.'.repeat(74)).join('\n');
const JULY_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];

const getJulyGroups = () => {
  const table = document.querySelector('.timetable-table');
  const wrap = Array.from(table?.parentElement?.children || []).find((node) => String(node.getAttribute('style') || '').includes('grid-template-columns: repeat(5'));
  return Array.from(wrap?.children || []).map((node, index) => ({
    title: String(node.children?.[0]?.textContent || '').trim(),
    color: JULY_COLORS[index % JULY_COLORS.length],
    classes: Array.from(node.children?.[1]?.querySelectorAll('span') || []).map((span) => String(span.textContent || '').trim()).filter(Boolean)
  })).filter((group) => group.title && group.classes.length);
};

const makeJulyEntry = ({ date, subject, text, type }) => {
  const entry = document.createElement('section');
  entry.className = `homework-entry ${type === 'exam' ? 'cahier-exam-entry' : ''} ${type === 'holiday' ? 'cahier-extra-holiday-entry' : ''}`;
  entry.style.setProperty('--homework-color', type === 'holiday' ? '#f97316' : type === 'exam' ? '#38bdf8' : '#2f80ed');

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
  if (type) {
    textNode.style.color = type === 'holiday' ? '#9a3412' : '#1e3a8a';
    textNode.style.fontSize = '20px';
    textNode.style.fontWeight = '900';
    textNode.style.textAlign = 'center';
    textNode.style.justifyContent = 'center';
  } else {
    textNode.style.color = 'rgba(63, 64, 80, 0.28)';
    textNode.style.fontSize = '22px';
    textNode.style.fontWeight = '900';
    textNode.style.lineHeight = '1.35';
    textNode.style.whiteSpace = 'pre-wrap';
  }

  content.append(subjectNode, textNode);
  entry.append(dateNode, content);
  return entry;
};

const getJulyEntries = (group) => {
  const entries = [
    { date: 'JEUDI 01/07 - SAMEDI 03/07', subject: 'Lycée', text: 'Rattrapage : 2ème Bac', type: 'exam' }
  ];

  for (let day = 4; day <= 10; day += 1) {
    const date = new Date(2027, 6, day);
    if (date.getDay() === 0) continue;
    const monthDate = `${String(day).padStart(2, '0')}/07`;
    if (day === 30) {
      entries.push({ date: 'VENDREDI 30/07', subject: 'Nationale', text: 'Fête nationale : Fête du Trône', type: 'holiday' });
      continue;
    }
    entries.push({ date: `${JULY_DAYS[date.getDay()]} ${monthDate}`, subject: group.classes.join(' / '), text: JULY_DOTS, type: '' });
  }
  return entries;
};

const makeJulyPage = (group, entries) => {
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
  entries.forEach((entry) => page.append(makeJulyEntry(entry)));
  return page;
};

const addJulyComplete = () => {
  const shell = document.querySelector('.cahier-preview-zone');
  if (!shell) return;
  document.querySelectorAll('[data-cahier-july-complete="true"]').forEach((page) => page.remove());
  getJulyGroups().forEach((group) => {
    const entries = getJulyEntries(group);
    for (let index = 0; index < entries.length; index += 5) {
      shell.append(makeJulyPage(group, entries.slice(index, index + 5)));
    }
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
