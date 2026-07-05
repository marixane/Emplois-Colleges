import './cahier-calendar-2026-data.js';

const DATE_FIXES_2026 = [
  ['Examen : Examen normalisé local', 'LUNDI 18/01 - MARDI 19/01'],
  ['Examen : Examen régional 1ère Bac', 'VENDREDI 28/05 - SAMEDI 29/05'],
  ['Examen : Examen national 2ème Bac', 'MARDI 01/06 - JEUDI 03/06'],
  ['Examen : Examen régional', 'MERCREDI 23/06 - JEUDI 24/06'],
  ['Examen : Examen normalisé provincial', 'VENDREDI 25/06 - SAMEDI 26/06'],
  ['Rattrapage : 1ère Bac', 'LUNDI 28/06 - MARDI 29/06'],
  ['Rattrapage : 2ème Bac', 'JEUDI 01/07 - SAMEDI 03/07']
];

const YEAR_TEXT_FIXES_2026 = [
  [/2025\s*\/\s*2026/g, '2026/2027'],
  [/2025-2026/g, '2026-2027']
];

const fixYears2026 = () => {
  document.querySelectorAll('input, h1, h2, h3, div, span, td, th').forEach((node) => {
    if (node.tagName === 'INPUT') {
      let value = node.value;
      YEAR_TEXT_FIXES_2026.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
      if (value !== node.value) node.value = value;
      return;
    }
    if (node.childNodes.length !== 1 || node.firstChild?.nodeType !== Node.TEXT_NODE) return;
    let text = node.textContent || '';
    YEAR_TEXT_FIXES_2026.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
    if (text !== node.textContent) node.textContent = text;
  });
};

const fixExamDates2026 = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;
  fixYears2026();

  document.querySelectorAll('.homework-entry').forEach((entry) => {
    const textNode = entry.querySelector('.homework-text');
    const dateNode = entry.querySelector('.homework-date');
    if (!textNode || !dateNode) return;

    const title = String(textNode.textContent || '').trim();
    const match = DATE_FIXES_2026.find(([eventTitle]) => title === eventTitle);
    if (!match) return;

    dateNode.textContent = match[1];
  });
};

let cahierDateFixTimer = 0;
const scheduleCahierDateFix2026 = () => {
  clearTimeout(cahierDateFixTimer);
  cahierDateFixTimer = window.setTimeout(fixExamDates2026, 220);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleCahierDateFix2026, { once: true });
} else {
  scheduleCahierDateFix2026();
}

window.setTimeout(scheduleCahierDateFix2026, 600);
window.setTimeout(scheduleCahierDateFix2026, 1400);
window.setTimeout(scheduleCahierDateFix2026, 2600);

document.addEventListener('input', (event) => {
  if (event.target?.closest?.('.timetable-table')) scheduleCahierDateFix2026();
}, { passive: true });
document.addEventListener('drop', scheduleCahierDateFix2026, { passive: true });
document.addEventListener('mouseup', scheduleCahierDateFix2026, { passive: true });
