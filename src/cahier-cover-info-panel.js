const COVER_CLASS_COLORS = ['#fff3bf', '#d8f3dc', '#dbeafe', '#ffe4e6', '#ede9fe', '#cffafe', '#fef3c7', '#dcfce7', '#e0e7ff', '#fce7f3', '#ccfbf1', '#f5f5f4', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa', '#ddd6fe', '#bae6fd', '#fecdd3', '#ccfbf1'];
const COVER_FIELD_VALUES = { name: '', school: '', subject: '' };
let isEditingCoverField = false;

const getCoverClassColor = (text) => {
  const normalized = String(text ?? '').toLowerCase().replace(/[\s-]/g, '').trim();
  if (!normalized) return 'white';
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return COVER_CLASS_COLORS[Math.abs(hash) % COVER_CLASS_COLORS.length];
};

const getCoverHeaderValue = (index, fallback) => {
  const input = document.querySelectorAll('.cahier-header input')[index];
  const value = String(input?.value || '').trim();
  if (!value || value.endsWith(':') || /^Année scolaire\s*:/i.test(value)) return fallback;
  return value.replace(/^Établissement\s*:\s*/i, '').replace(/^Professeur\s*:\s*/i, '').trim() || fallback;
};

const getCoverFieldValue = (field, fallback) => COVER_FIELD_VALUES[field] || fallback;

const getCoverClasses = () => {
  const classes = [];
  document.querySelectorAll('.timetable-cell-content.colored-cell textarea').forEach((textarea) => {
    const className = String(textarea.value || textarea.textContent || '').trim().replace(/\s+/g, ' ');
    if (className && !classes.includes(className)) classes.push(className);
  });
  return classes;
};

const removeCoverSubtitleText = (cover) => {
  const forbiddenTexts = [
    'Langue française',
    'Enseignement – Apprentissage du',
    'Français au cycle secondaire'
  ];
  Array.from(cover.children).forEach((child) => {
    const text = String(child.textContent || '').trim();
    if (forbiddenTexts.includes(text)) child.remove();
  });
};

const makeInfoCard = ({ id, top, label, field, value }) => {
  const card = document.createElement('div');
  card.id = id;
  Object.assign(card.style, {
    position: 'absolute',
    left: '76px',
    right: '76px',
    top,
    minHeight: '42px',
    padding: '10px 16px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.56)',
    border: '1px solid rgba(120, 90, 55, 0.24)',
    boxShadow: '0 8px 18px rgba(70, 45, 25, 0.10)',
    backdropFilter: 'blur(2px)',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    zIndex: '20',
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    alignItems: 'center',
    gap: '10px',
    boxSizing: 'border-box'
  });

  const labelNode = document.createElement('span');
  labelNode.textContent = label;
  Object.assign(labelNode.style, {
    fontSize: '16px',
    fontWeight: '900',
    color: '#2f241c'
  });

  const input = document.createElement('input');
  input.value = value;
  input.placeholder = '........................................';
  Object.assign(input.style, {
    width: '100%',
    minHeight: '26px',
    padding: '1px 0 3px',
    border: '0',
    borderBottom: '1px dashed rgba(70,45,25,0.34)',
    outline: 'none',
    background: 'transparent',
    fontSize: '16px',
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box'
  });
  input.addEventListener('focus', () => { isEditingCoverField = true; });
  input.addEventListener('blur', () => {
    COVER_FIELD_VALUES[field] = input.value.trim();
    isEditingCoverField = false;
  });
  input.addEventListener('input', () => { COVER_FIELD_VALUES[field] = input.value; });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    }
  });

  card.append(labelNode, input);
  return card;
};

const makeClassesCard = (classes) => {
  const card = document.createElement('div');
  card.id = 'cahier-cover-classes-card';
  Object.assign(card.style, {
    position: 'absolute',
    left: '76px',
    right: '76px',
    top: '872px',
    minHeight: '80px',
    padding: '12px 16px 14px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.56)',
    border: '1px solid rgba(120, 90, 55, 0.24)',
    boxShadow: '0 8px 18px rgba(70, 45, 25, 0.10)',
    backdropFilter: 'blur(2px)',
    color: '#111827',
    fontFamily: 'Arial, sans-serif',
    zIndex: '20',
    boxSizing: 'border-box'
  });

  const label = document.createElement('div');
  label.textContent = 'Classes :';
  Object.assign(label.style, {
    fontSize: '16px',
    fontWeight: '900',
    marginBottom: '10px',
    color: '#2f241c'
  });

  const chips = document.createElement('div');
  Object.assign(chips.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center'
  });

  if (classes.length) {
    classes.forEach((className) => {
      const chip = document.createElement('span');
      chip.textContent = className;
      Object.assign(chip.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 12px',
        borderRadius: '999px',
        background: getCoverClassColor(className),
        border: '1px solid rgba(17,17,17,0.18)',
        boxShadow: '0 3px 8px rgba(17,17,17,0.10)',
        color: '#111827',
        fontSize: '14px',
        fontWeight: '900',
        textTransform: 'uppercase',
        lineHeight: '1'
      });
      chips.append(chip);
    });
  } else {
    const empty = document.createElement('span');
    empty.textContent = '........................................';
    Object.assign(empty.style, { fontSize: '14px', fontWeight: '800', color: 'rgba(17,17,17,0.55)' });
    chips.append(empty);
  }

  card.append(label, chips);
  return card;
};

const ensureCoverInfoPanel = () => {
  if (isEditingCoverField) return true;
  if (!document.body.classList.contains('cahier-tab-active')) return false;
  const cover = document.getElementById('cahier-cover-page');
  if (!cover) return false;

  removeCoverSubtitleText(cover);

  document.getElementById('cahier-cover-info-panel')?.remove();
  document.getElementById('cahier-cover-name-card')?.remove();
  document.getElementById('cahier-cover-school-card')?.remove();
  document.getElementById('cahier-cover-subject-card')?.remove();
  document.getElementById('cahier-cover-classes-card')?.remove();

  const schoolFallback = getCoverHeaderValue(0, '');
  const classes = getCoverClasses();

  cover.append(
    makeInfoCard({ id: 'cahier-cover-name-card', top: '690px', label: 'Nom :', field: 'name', value: getCoverFieldValue('name', '') }),
    makeInfoCard({ id: 'cahier-cover-school-card', top: '746px', label: 'Établissement :', field: 'school', value: getCoverFieldValue('school', schoolFallback) }),
    makeInfoCard({ id: 'cahier-cover-subject-card', top: '802px', label: 'Matière :', field: 'subject', value: getCoverFieldValue('subject', '') }),
    makeClassesCard(classes)
  );
  return true;
};

let coverInfoRetryCount = 0;
const scheduleCoverInfoPanel = () => window.requestAnimationFrame(() => {
  const done = ensureCoverInfoPanel();
  if (!done && coverInfoRetryCount < 18) {
    coverInfoRetryCount += 1;
    window.setTimeout(scheduleCoverInfoPanel, 250);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleCoverInfoPanel, { once: true });
} else {
  scheduleCoverInfoPanel();
}

document.addEventListener('input', (event) => {
  if (event.target?.closest?.('.timetable-table')) window.setTimeout(scheduleCoverInfoPanel, 120);
}, { passive: true });
