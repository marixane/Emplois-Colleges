import './cahier-calendar-2026-data.js';
import './cahier-pdf-export-button.css';
import './cahier-pdf-export-button.js';

const EVENT_FIXES_2026 = [
  ['Vacance religieuse : Aïd Al Mawlid Annabaoui', 'Fête nationale : Fête de l’Unité', 'SAMEDI 31/10'],
  ['Vacance scolaire : Vacances intermédiaires 1', 'Vacance scolaire : Vacances intermédiaires 1', 'DIMANCHE 18/10 - DIMANCHE 25/10'],
  ['Fête nationale : Marche Verte', 'Fête nationale : Marche Verte', 'VENDREDI 06/11'],
  ['Fête nationale : Fête de l’Indépendance', 'Fête nationale : Fête de l’Indépendance', 'MERCREDI 18/11'],
  ['Vacance scolaire : Vacances intermédiaires 2', 'Vacance scolaire : Vacances intermédiaires 2', 'DIMANCHE 06/12 - DIMANCHE 13/12'],
  ['Fête nationale : Nouvel An', 'Fête nationale : Nouvel An', 'VENDREDI 01/01'],
  ['Fête nationale : Manifeste de l’Indépendance', 'Fête nationale : Manifeste de l’Indépendance', 'LUNDI 11/01'],
  ['Fête nationale : Nouvel An Amazigh', 'Fête nationale : Nouvel An Amazigh', 'JEUDI 14/01'],
  ['Vacance scolaire : Vacances de mi-année', 'Vacance scolaire : Vacances de mi-année', 'DIMANCHE 24/01 - DIMANCHE 31/01'],
  ['Vacance religieuse : Aïd Al-Fitr', 'Vacance religieuse : Aïd Al-Fitr', '29 RAMADAN - 02 CHAWWAL 1448'],
  ['Fête nationale : Fête du Travail', 'Fête nationale : Fête du Travail', 'SAMEDI 01/05'],
  ['Vacance scolaire : Vacances intermédiaires 4', 'Vacance scolaire : Vacances intermédiaires 4', 'DIMANCHE 09/05 - DIMANCHE 16/05'],
  ['Vacance religieuse : Aïd Al-Adha', 'Vacance religieuse : Aïd Al-Adha', '09 - 11 DHOU AL-HIJJA 1448'],
  ['Vacance religieuse : 1er Moharram', 'Vacance religieuse : 1er Moharram', '01 MOHARRAM 1449'],
  ['Examen : Examen normalisé local', 'Examen : Examen normalisé local', 'LUNDI 18/01 - MARDI 19/01'],
  ['Examen : Examen régional 1ère Bac', 'Examen : Examen régional 1ère Bac', 'VENDREDI 28/05 - SAMEDI 29/05'],
  ['Examen : Examen national 2ème Bac', 'Examen : Examen national 2ème Bac', 'MARDI 01/06 - JEUDI 03/06'],
  ['Examen : Examen régional', 'Examen : Examen régional', 'MERCREDI 23/06 - JEUDI 24/06'],
  ['Examen : Examen normalisé provincial', 'Examen : Examen normalisé provincial', 'VENDREDI 25/06 - SAMEDI 26/06'],
  ['Rattrapage : 1ère Bac', 'Rattrapage : 1ère Bac', 'LUNDI 28/06 - MARDI 29/06'],
  ['Rattrapage : 2ème Bac', 'Rattrapage : 2ème Bac', 'JEUDI 01/07 - SAMEDI 03/07']
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

const fixCahierDates2026 = () => {
  if (!document.body.classList.contains('cahier-tab-active')) return;
  fixYears2026();

  document.querySelectorAll('.homework-entry').forEach((entry) => {
    const textNode = entry.querySelector('.homework-text');
    const dateNode = entry.querySelector('.homework-date');
    if (!textNode || !dateNode) return;

    const title = String(textNode.textContent || '').trim();
    const match = EVENT_FIXES_2026.find(([oldTitle]) => title === oldTitle);
    if (!match) return;

    textNode.textContent = match[1];
    dateNode.textContent = match[2];
  });
};

let cahierDateFixTimer = 0;
const scheduleCahierDateFix2026 = () => {
  clearTimeout(cahierDateFixTimer);
  cahierDateFixTimer = window.setTimeout(fixCahierDates2026, 220);
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
