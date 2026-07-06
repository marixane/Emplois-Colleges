const LYCEE_INLINE_EVENTS = [
  {
    key: 'lycee-2027-01-04',
    sort: 20270104,
    color: '#38bdf8',
    date: 'LUNDI 04/01 - SAMEDI 09/01',
    label: 'Lycée',
    text: 'Réalisation des derniers devoirs de contrôle continu'
  },
  {
    key: 'lycee-2027-01-16',
    sort: 20270116,
    color: '#38bdf8',
    date: 'SAMEDI 16/01',
    label: 'Lycée',
    text: 'Fin de saisie des notes des derniers devoirs de contrôle continu'
  },
  {
    key: 'lycee-2027-01-21',
    sort: 20270121,
    color: '#38bdf8',
    date: 'JEUDI 21/01',
    label: 'Lycée',
    text: 'Édition des relevés de notes via la plateforme Massar'
  },
  {
    key: 'lycee-2027-05-17',
    sort: 20270517,
    color: '#38bdf8',
    date: 'LUNDI 17/05 - SAMEDI 22/05',
    label: 'Lycée',
    text: 'Réalisation des derniers devoirs de contrôle continu'
  },
  {
    key: 'lycee-2027-05-28',
    sort: 20270528,
    color: '#38bdf8',
    date: 'VENDREDI 28/05 - SAMEDI 29/05',
    label: 'Lycée',
    text: 'Fin de saisie des notes des derniers devoirs de contrôle continu'
  }
];

const parseEntrySort = (entry) => {
  if (entry.dataset.sort) return Number(entry.dataset.sort);
  const text = entry.querySelector('.homework-date')?.textContent || '';
  const match = text.match(/(\d{2})\/(\d{2})/);
  if (!match) return 99999999;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = month >= 9 ? 2026 : 2027;
  return year * 10000 + month * 100 + day;
};

const makeLyceeEntry = (event) => {
  const entry = document.createElement('section');
  entry.className = 'homework-entry cahier-exam-entry cahier-lycee-inline-event';
  entry.dataset.lyceeEvent = event.key;
  entry.dataset.sort = String(event.sort);
  entry.style.setProperty('--homework-color', event.color);
  entry.innerHTML = `
    <div class="homework-date" contenteditable="true">${event.date}</div>
    <div class="homework-content">
      <div class="homework-subject" style="display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:6px;padding:8px 10px;text-align:center;overflow:hidden;">
        <div style="display:grid;grid-template-columns:52px 1fr;align-items:center;gap:6px;min-height:24px;padding:4px 7px;border:1px solid rgba(63,64,80,.18);border-radius:8px;background:rgba(63,64,80,.045);color:#343545;font-family:Arial,sans-serif;line-height:1;overflow:hidden;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:72px;height:22px;border-radius:999px;background:var(--homework-color);color:white;font-size:12px;font-weight:900;white-space:nowrap;">${event.label}</span>
          <span style="display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:900;text-transform:uppercase;"></span>
        </div>
      </div>
      <div class="homework-text" contenteditable="true" style="color:#1e3a8a;font-size:20px;font-weight:900;line-height:1.25;letter-spacing:.2px;text-align:center;justify-content:center;background:linear-gradient(90deg,rgba(191,219,254,.45),rgba(219,234,254,.82));border:1px solid rgba(37,99,235,.28);border-radius:12px;margin:8px 18px;padding:10px 16px;overflow:hidden;">${event.text}</div>
    </div>
  `;
  return entry;
};

const insertEventInGroupPages = (groupFirstPage, event) => {
  const pages = [];
  let node = groupFirstPage;
  while (node?.classList?.contains('homework-page')) {
    pages.push(node);
    node = node.nextElementSibling;
  }
  if (!pages.length) return;

  if (pages.some((page) => page.querySelector(`[data-lycee-event="${event.key}"]`))) return;

  const allEntries = pages.flatMap((page) => Array.from(page.querySelectorAll('.homework-entry')));
  const nextEntry = allEntries.find((entry) => parseEntrySort(entry) > event.sort);
  const newEntry = makeLyceeEntry(event);

  if (nextEntry) {
    nextEntry.insertAdjacentElement('beforebegin', newEntry);
    return;
  }

  pages[pages.length - 1].append(newEntry);
};

const getGroupBlockTitle = (cover) => String(cover.querySelector('h1, [style*="groupCoverTitleStyle"]')?.textContent || cover.textContent || '').toUpperCase();

const getGroupRank = (cover) => {
  const title = getGroupBlockTitle(cover);
  if (title.includes('TRONC') || title.includes('AUTRES')) return 1;
  if (title.includes('1È') || title.includes('1ERE') || title.includes('1ÈRE') || title.includes('1ERES') || title.includes('1ÈRES')) return 2;
  if (title.includes('2È') || title.includes('2EME') || title.includes('2ÈME')) return 3;
  return 9;
};

const collectGroupBlocks = () => {
  const covers = Array.from(document.querySelectorAll('.homework-cover-page'));
  return covers.map((cover, index) => {
    const nodes = [cover];
    let node = cover.nextElementSibling;
    while (node && !node.classList.contains('homework-cover-page')) {
      if (node.classList.contains('homework-page')) nodes.push(node);
      node = node.nextElementSibling;
    }
    return { cover, nodes, rank: getGroupRank(cover), index };
  });
};

const renameAutresGroupTitles = () => {
  document.querySelectorAll('.homework-cover-page h1, .homework-page [style*="text-transform: uppercase"]').forEach((node) => {
    if (String(node.textContent || '').trim().toUpperCase() === 'AUTRES') node.textContent = 'Tronc Commun';
  });
};

const orderGroupPages = () => {
  const zone = document.querySelector('.cahier-preview-zone');
  if (!zone) return;
  const blocks = collectGroupBlocks().sort((a, b) => a.rank - b.rank || a.index - b.index);
  blocks.forEach((block) => block.nodes.forEach((node) => zone.append(node)));
  renameAutresGroupTitles();
};

const insertLyceeEventsInline = () => {
  document.getElementById('cahier-lycee-events-page')?.remove();
  document.querySelectorAll('.cahier-cover-level-buttons').forEach((buttons) => buttons.remove());

  const groupPages = Array.from(document.querySelectorAll('.homework-page'))
    .filter((page) => !page.previousElementSibling?.classList?.contains('homework-page'));

  groupPages.forEach((firstPage) => {
    LYCEE_INLINE_EVENTS.forEach((event) => insertEventInGroupPages(firstPage, event));
  });

  orderGroupPages();
};

const scheduleLyceeEventsInline = () => window.requestAnimationFrame(insertLyceeEventsInline);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleLyceeEventsInline, { once: true });
} else {
  scheduleLyceeEventsInline();
}

document.addEventListener('focusout', scheduleLyceeEventsInline, true);
document.addEventListener('drop', scheduleLyceeEventsInline, true);
document.addEventListener('click', (event) => {
  if (event.target?.closest?.('.timetable-table, .span-tools, .cahier-tab')) scheduleLyceeEventsInline();
}, true);
