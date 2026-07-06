import { useState } from 'react';
import MoroccoHolidaysPage from './MoroccoHolidaysPage';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const CALENDAR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'];
const CELL_COLORS = ['#fff3bf', '#d8f3dc', '#dbeafe', '#ffe4e6', '#ede9fe', '#cffafe', '#fef3c7', '#dcfce7', '#e0e7ff', '#fce7f3', '#ccfbf1', '#f5f5f4', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa', '#ddd6fe', '#bae6fd', '#fecdd3', '#ccfbf1'];
const HOMEWORK_COLORS = ['#66c43f', '#b34bd7', '#2f80ed', '#ff3f5f', '#f2994a'];
const GROUP_COLORS = ['#e0f2fe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe'];
const GROUP_TITLES = ['Tronc Commun', '1ères Bac', '2ème Bac', 'Autres', 'Autres'];
const DOT_TEXT = Array.from({ length: 3 }, () => '.'.repeat(74)).join('\n');
const MANDATORY_EVENTS = [
  { start: '05/09', end: '06/09', label: 'Religieuse', text: 'Vacance religieuse : Aïd Al Mawlid Annabaoui', type: 'holiday' },
  { start: '19/10', end: '26/10', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 1', type: 'holiday' },
  { start: '06/11', end: '06/11', label: 'Nationale', text: 'Fête nationale : Marche Verte', type: 'holiday' },
  { start: '18/11', end: '18/11', label: 'Nationale', text: 'Fête nationale : Fête de l’Indépendance', type: 'holiday' },
  { start: '07/12', end: '14/12', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 2', type: 'holiday' },
  { start: '01/01', end: '01/01', label: 'Nationale', text: 'Fête nationale : Nouvel An', type: 'holiday' },
  { start: '11/01', end: '11/01', label: 'Nationale', text: 'Fête nationale : Manifeste de l’Indépendance', type: 'holiday' },
  { start: '14/01', end: '14/01', label: 'Nationale', text: 'Fête nationale : Nouvel An Amazigh', type: 'holiday' },
  { start: '20/01', end: '24/01', label: 'Primaire', text: 'Examen : Examen normalisé local', type: 'exam' },
  { start: '25/01', end: '01/02', label: 'Scolaire', text: 'Vacance scolaire : Vacances de mi-année', type: 'holiday' },
  { start: '15/03', end: '22/03', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 3', type: 'holiday' },
  { start: '20/03', end: '22/03', label: 'Religieuse', text: 'Vacance religieuse : Aïd Al-Fitr', type: 'holiday' },
  { start: '01/05', end: '01/05', label: 'Nationale', text: 'Fête nationale : Fête du Travail', type: 'holiday' },
  { start: '03/05', end: '10/05', label: 'Scolaire', text: 'Vacance scolaire : Vacances intermédiaires 4', type: 'holiday' },
  { start: '27/05', end: '30/05', label: 'Religieuse', text: 'Vacance religieuse : Aïd Al-Adha', type: 'holiday' },
  { start: '29/05', end: '30/05', label: 'Lycée', text: 'Examen : Examen régional 1ère Bac', type: 'exam' },
  { start: '01/06', end: '04/06', label: 'Lycée', text: 'Examen : Examen national 2ème Bac', type: 'exam' },
  { start: '16/06', end: '16/06', label: 'Religieuse', text: 'Vacance religieuse : 1er Moharram', type: 'holiday' },
  { start: '16/06', end: '17/06', label: 'Collège', text: 'Examen : Examen régional', type: 'exam' },
  { start: '23/06', end: '24/06', label: 'Primaire', text: 'Examen : Examen normalisé provincial', type: 'exam' },
  { start: '03/07', end: '04/07', label: 'Lycée', text: 'Rattrapage : 1ère Bac', type: 'exam' },
  { start: '06/07', end: '09/07', label: 'Lycée', text: 'Rattrapage : 2ème Bac', type: 'exam' }
];
const EXAM_EVENTS = MANDATORY_EVENTS.filter((event) => event.type === 'exam');
const SCHOOL_PROGRESS_FLAGS = [
  { date: '19/10', label: 'Vacances intermédiaires 1' },
  { date: '07/12', label: 'Vacances intermédiaires 2' },
  { date: '15/03', label: 'Vacances intermédiaires 3' },
  { date: '03/05', label: 'Vacances intermédiaires 4' }
];

const createCell = () => ({ text: '', room: 1, span: 1, hidden: false });
const clampRoom = (value) => Math.min(Math.max(Number(value) || 1, 1), 80);
const normalizeCell = (cell) => typeof cell === 'object' && cell !== null ? {
  text: String(cell.text ?? ''),
  room: clampRoom(cell.room ?? 1),
  span: Math.max(Number(cell.span) || 1, 1),
  hidden: Boolean(cell.hidden)
} : { text: String(cell ?? ''), room: 1, span: 1, hidden: false };
const cloneCell = (cell) => ({ ...normalizeCell(cell), hidden: false });

const dotTextStyle = { color: 'rgba(63, 64, 80, 0.28)', fontSize: '22px', fontWeight: 900, lineHeight: 1.35, letterSpacing: '1px', whiteSpace: 'pre-wrap', overflow: 'hidden' };
const holidayTextStyle = { color: '#9a3412', fontSize: '21px', fontWeight: 900, lineHeight: 1.25, letterSpacing: '0.2px', textAlign: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, rgba(254,215,170,0.38), rgba(254,243,199,0.62))', borderRadius: '12px', margin: '8px 18px', padding: '10px 16px', overflow: 'hidden' };
const examTextStyle = { color: '#1e3a8a', fontSize: '20px', fontWeight: 900, lineHeight: 1.25, letterSpacing: '0.2px', textAlign: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, rgba(191,219,254,0.45), rgba(219,234,254,0.82))', border: '1px solid rgba(37,99,235,0.28)', borderRadius: '12px', margin: '8px 18px', padding: '10px 16px', overflow: 'hidden' };
const subjectTextStyle = { display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: '6px', padding: '8px 10px', textAlign: 'center', overflow: 'hidden' };
const sessionLineStyle = { display: 'grid', gridTemplateColumns: '52px 1fr', alignItems: 'center', gap: '6px', minHeight: '24px', padding: '4px 7px', border: '1px solid rgba(63, 64, 80, 0.18)', borderRadius: '8px', background: 'rgba(63, 64, 80, 0.045)', color: '#343545', fontFamily: 'Arial, sans-serif', lineHeight: 1, overflow: 'hidden' };
const sessionHourStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '72px', height: '22px', borderRadius: '999px', background: 'var(--homework-color)', color: 'white', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' };
const sessionClassStyle = { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' };
const levelGroupsStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' };
const levelGroupTitleStyle = { marginBottom: '8px', color: '#111827', fontSize: '12px', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.3px' };
const levelGroupClassesStyle = { display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', gap: '7px', minHeight: '130px', color: 'rgba(17, 17, 17, 0.45)', fontSize: '10px', fontWeight: 800, lineHeight: 1.1, textAlign: 'center' };
const levelChipStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '28px', padding: '7px 9px', borderRadius: '9px', border: '1px solid rgba(17, 17, 17, 0.22)', color: '#111827', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'grab', boxShadow: '0 1px 3px rgba(17, 17, 17, 0.12)' };
const examListWrapStyle = { marginTop: '10px', border: '2px solid rgba(30, 58, 138, 0.35)', borderRadius: '14px', overflow: 'hidden', background: 'rgba(219, 234, 254, 0.45)' };
const examListTitleStyle = { padding: '7px 12px', background: 'linear-gradient(90deg, rgba(191,219,254,0.9), rgba(239,246,255,0.95))', color: '#111827', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3px' };
const examListTableStyle = { width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', background: 'white' };
const examListHeaderCellStyle = { padding: '6px 7px', border: '1px solid rgba(30, 58, 138, 0.18)', background: '#dbeafe', color: '#111827', fontSize: '11px', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase' };
const examListCellStyle = { padding: '6px 7px', border: '1px solid rgba(30, 58, 138, 0.16)', color: '#1f2937', fontSize: '11px', fontWeight: 800, textAlign: 'center', lineHeight: 1.2 };
const groupHomeworkHeaderStyle = { position: 'absolute', top: '10px', left: '50px', right: '18px', height: '42px', display: 'grid', gridTemplateColumns: '230px 1fr', alignItems: 'center', gap: '18px', borderRadius: '12px', background: 'var(--group-color)', color: '#111827', padding: '0 18px', boxShadow: '0 2px 6px rgba(17, 17, 17, 0.12)' };
const groupHomeworkTitleStyle = { fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const progressWrapStyle = { display: 'grid', gridTemplateColumns: '1fr 46px', alignItems: 'center', gap: '10px' };
const progressBarStyle = { position: 'relative', height: '12px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(17, 24, 39, 0.12)', boxShadow: 'inset 0 1px 3px rgba(17, 24, 39, 0.10)' };
const progressFillStyle = { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: '999px', background: 'linear-gradient(90deg, #22c55e, #16a34a)' };
const progressFlagStyle = { position: 'absolute', top: '-15px', transform: 'translateX(-50%)', fontSize: '13px', lineHeight: 1, filter: 'drop-shadow(0 1px 1px rgba(17, 24, 39, 0.25))' };
const progressPercentStyle = { fontSize: '12px', fontWeight: 900, textAlign: 'right', color: '#111827' };

const getCellColor = (text) => {
  const normalized = String(text ?? '').toLowerCase().replace(/[\s-]/g, '').trim();
  if (!normalized) return 'white';
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return CELL_COLORS[Math.abs(hash) % CELL_COLORS.length];
};

const getSchoolStartYear = () => {
  const today = new Date();
  return today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
};
const getSchoolYear = () => {
  const startYear = getSchoolStartYear();
  return `Année scolaire : ${startYear} / ${startYear + 1}`;
};
const getSchoolProgressBounds = () => {
  const startYear = getSchoolStartYear();
  return { start: new Date(startYear, 8, 1), end: new Date(startYear + 1, 6, 31) };
};
const getSchoolProgressPercentForDate = (date) => {
  const { start, end } = getSchoolProgressBounds();
  const percent = ((date - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(percent)));
};
const getMonthDateAsSchoolDate = (monthDate) => {
  const [day, month] = String(monthDate).split('/').map(Number);
  const startYear = getSchoolStartYear();
  return new Date(month >= 9 ? startYear : startYear + 1, month - 1, day);
};
const getFlagPercent = (dateText) => {
  const flagDate = getMonthDateAsSchoolDate(dateText);
  const { start, end } = getSchoolProgressBounds();
  return Math.min(100, Math.max(0, ((flagDate - start) / (end - start)) * 100));
};
const getPageProgressPercent = (entries) => getSchoolProgressPercentForDate(getMonthDateAsSchoolDate(entries?.[0]?.progressDate || '01/09'));
const createRows = () => DAYS.map((day) => ({ day, cells: HOURS.reduce((acc, hour) => ({ ...acc, [hour]: createCell() }), {}) }));
const getHourStart = (hour) => String(hour ?? '').split('-')[0].trim();
const getMondayBasedDayIndex = (date) => (date.getDay() + 6) % 7;
const getDisplayDay = (date, rows) => getMondayBasedDayIndex(date) < rows.length ? String(rows[getMondayBasedDayIndex(date)]?.day || DAYS[getMondayBasedDayIndex(date)]).toUpperCase() : CALENDAR_DAYS[date.getDay()].toUpperCase();
const formatMonthDate = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
const getSchoolHomeworkDates = () => {
  const startYear = getSchoolStartYear();
  const dates = [];
  const current = new Date(startYear, 8, 1);
  const end = new Date(startYear + 1, 6, 31);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};
const chunkEntries = (entries, size) => entries.reduce((pages, entry, index) => {
  if (index % size === 0) pages.push([]);
  pages[pages.length - 1].push(entry);
  return pages;
}, []);
const getClassLevel = (className) => {
  const normalized = String(className ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (normalized.startsWith('TC') || normalized.includes('TRONCCOMMUN')) return 'Tronc Commun';
  if (normalized.startsWith('1BAC') || normalized.startsWith('1ERE') || normalized.startsWith('1ÈRE')) return '1ères Bac';
  if (normalized.startsWith('2BAC') || normalized.startsWith('2EME') || normalized.startsWith('2ÈME')) return '2ème Bac';
  return 'Autres';
};
const getGroupIndex = (className) => {
  const level = getClassLevel(className);
  return level === 'Tronc Commun' ? 0 : level === '1ères Bac' ? 1 : level === '2ème Bac' ? 2 : 3;
};
const getMandatoryEventStart = (monthDate) => MANDATORY_EVENTS.filter((event) => event.start === monthDate);
const isInsideMandatoryEventAfterStart = (monthDate) => MANDATORY_EVENTS.some((event) => {
  const date = getMonthDateAsSchoolDate(monthDate);
  return date > getMonthDateAsSchoolDate(event.start) && date <= getMonthDateAsSchoolDate(event.end);
});

export default function Tab() {
  const [school, setSchool] = useState('Établissement :');
  const [teacher, setTeacher] = useState('Professeur :');
  const [hours, setHours] = useState(HOURS);
  const [rows, setRows] = useState(createRows);
  const [copiedCell, setCopiedCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [draggedCell, setDraggedCell] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [manualGroups, setManualGroups] = useState(null);
  const [draggedClass, setDraggedClass] = useState(null);
  const schoolYear = getSchoolYear();

  const validateOnEnter = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const updateHour = (index, value) => {
    const oldHour = hours[index];
    setHours((current) => current.map((hour, i) => i === index ? value : hour));
    setRows((current) => current.map((row) => {
      const nextCells = { ...row.cells, [value]: normalizeCell(row.cells[oldHour]) };
      delete nextCells[oldHour];
      return { ...row, cells: nextCells };
    }));
  };
  const updateDay = (index, value) => setRows((current) => current.map((row, i) => i === index ? { ...row, day: value } : row));
  const updateCellText = (dayIndex, hour, value) => {
    setRows((current) => current.map((row, i) => i === dayIndex ? { ...row, cells: { ...row.cells, [hour]: { ...normalizeCell(row.cells[hour]), text: value } } } : row));
  };
  const updateRoom = (dayIndex, hour, value) => setRows((current) => current.map((row, i) => i === dayIndex ? { ...row, cells: { ...row.cells, [hour]: { ...normalizeCell(row.cells[hour]), room: clampRoom(value) } } } : row));

  const sessionsByDay = rows.map((row) => hours.reduce((list, hour) => {
    const cell = normalizeCell(row.cells[hour]);
    if (!cell.hidden && cell.text.trim()) list.push({ hour: getHourStart(hour), className: cell.text.trim() });
    return list;
  }, []));

  const tableClasses = rows.reduce((classes, row) => {
    hours.forEach((hour) => {
      const cell = normalizeCell(row.cells[hour]);
      const className = cell.text.trim();
      if (!cell.hidden && className && !classes.includes(className)) classes.push(className);
    });
    return classes;
  }, []);
  const autoGroups = GROUP_TITLES.map((title) => ({ title, classes: [] }));
  tableClasses.forEach((className) => {
    const targetIndex = getGroupIndex(className);
    autoGroups[targetIndex].classes.push(className);
  });
  const reconciledManualGroups = manualGroups ? GROUP_TITLES.map((title, index) => ({ title, classes: (manualGroups[index]?.classes ?? []).filter((className) => tableClasses.includes(className)) })) : null;
  if (reconciledManualGroups) {
    tableClasses.forEach((className) => {
      const alreadyGrouped = reconciledManualGroups.some((group) => group.classes.includes(className));
      if (!alreadyGrouped) reconciledManualGroups[getGroupIndex(className)].classes.push(className);
    });
  }
  const classGroups = reconciledManualGroups ?? autoGroups;

  const moveClassToGroup = (className, targetIndex) => {
    setManualGroups((current) => {
      const base = (current ?? classGroups).map((group, index) => ({ title: GROUP_TITLES[index], classes: [...(group.classes ?? [])] }));
      const next = base.map((group) => ({ ...group, classes: group.classes.filter((item) => item !== className) }));
      if (!next[targetIndex].classes.includes(className)) next[targetIndex].classes.push(className);
      return next;
    });
  };

  const groupedHomeworkPages = classGroups.map((group, groupIndex) => {
    const classSet = new Set(group.classes);
    const entries = getSchoolHomeworkDates().flatMap((date) => {
      const dayIndex = getMondayBasedDayIndex(date);
      const monthDate = formatMonthDate(date);
      if (isInsideMandatoryEventAfterStart(monthDate)) return [];

      const eventEntries = getMandatoryEventStart(monthDate).map((event, eventIndex) => {
        const endDate = getMonthDateAsSchoolDate(event.end);
        const displayDate = event.start === event.end ? `${getDisplayDay(date, rows)} ${event.start}` : `${getDisplayDay(date, rows)} ${event.start} - ${getDisplayDay(endDate, rows)} ${event.end}`;
        return { date: displayDate, sessions: [{ hour: event.label, className: '' }], text: event.text, isHoliday: event.type === 'holiday', isExam: event.type === 'exam', progressDate: event.start, color: event.type === 'exam' ? '#38bdf8' : '#f97316', eventKey: `${event.start}-${eventIndex}` };
      });

      if (dayIndex >= rows.length || !classSet.size) return eventEntries;
      const sessions = (sessionsByDay[dayIndex] ?? []).filter((session) => classSet.has(session.className));
      if (!sessions.length) return eventEntries;
      return [...eventEntries, { date: `${getDisplayDay(date, rows)} ${monthDate}`, sessions, text: DOT_TEXT, isHoliday: false, isExam: false, progressDate: monthDate, color: HOMEWORK_COLORS[dayIndex % HOMEWORK_COLORS.length] }];
    }).filter(Boolean);

    return { title: GROUP_TITLES[groupIndex], color: GROUP_COLORS[groupIndex], pages: chunkEntries(entries, 5) };
  }).filter((group) => group.pages.length > 0);

  const canExtendLeft = (row, hourIndex) => hourIndex > 0 && Boolean(normalizeCell(row.cells[hours[hourIndex]]).text.trim()) && !normalizeCell(row.cells[hours[hourIndex - 1]]).hidden && !normalizeCell(row.cells[hours[hourIndex - 1]]).text.trim();
  const canExtendRight = (row, hourIndex) => {
    const cell = normalizeCell(row.cells[hours[hourIndex]]);
    const nextIndex = hourIndex + cell.span;
    return Boolean(cell.text.trim()) && nextIndex < hours.length && !normalizeCell(row.cells[hours[nextIndex]]).hidden && !normalizeCell(row.cells[hours[nextIndex]]).text.trim();
  };
  const canPasteCell = (row, hourIndex, cellToPaste) => {
    const sourceCell = normalizeCell(cellToPaste);
    if (!sourceCell.text.trim() || hourIndex + sourceCell.span > hours.length) return false;
    for (let index = hourIndex; index < hourIndex + sourceCell.span; index += 1) {
      const target = normalizeCell(row.cells[hours[index]]);
      if (target.hidden || target.text.trim()) return false;
    }
    return true;
  };

  const duplicateCellTo = (dayIndex, hourIndex, cellToPaste) => {
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex || !canPasteCell(row, hourIndex, cellToPaste)) return row;
      const pasted = cloneCell(cellToPaste);
      const nextCells = { ...row.cells, [hours[hourIndex]]: pasted };
      for (let index = hourIndex + 1; index < hourIndex + pasted.span; index += 1) nextCells[hours[index]] = { ...createCell(), hidden: true };
      return { ...row, cells: nextCells };
    }));
    setCopiedCell(cloneCell(cellToPaste));
    setSelectedCell(`${dayIndex}-${hourIndex}`);
  };

  const handleCellClick = (dayIndex, hourIndex, cell) => {
    const normalized = normalizeCell(cell);
    if (!normalized.text.trim()) return;
    setCopiedCell(cloneCell(normalized));
    setSelectedCell(`${dayIndex}-${hourIndex}`);
  };
  const handleDragStart = (event, dayIndex, hourIndex, cell) => {
    const normalized = normalizeCell(cell);
    if (!normalized.text.trim()) return event.preventDefault();
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', normalized.text);
    setDraggedCell(cloneCell(normalized));
    setCopiedCell(cloneCell(normalized));
    setSelectedCell(`${dayIndex}-${hourIndex}`);
  };
  const handleDragOver = (event, dayIndex, hourIndex, row, hasClass) => {
    if (!draggedCell || hasClass || !canPasteCell(row, hourIndex, draggedCell)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragOverCell(`${dayIndex}-${hourIndex}`);
  };
  const handleDrop = (event, dayIndex, hourIndex, row, hasClass) => {
    if (!draggedCell || hasClass || !canPasteCell(row, hourIndex, draggedCell)) return;
    event.preventDefault();
    duplicateCellTo(dayIndex, hourIndex, draggedCell);
    setDraggedCell(null);
    setDragOverCell(null);
  };

  const extendCellLeft = (dayIndex, hourIndex) => {
    if (hourIndex <= 0) return;
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex || !canExtendLeft(row, hourIndex)) return row;
      const cell = normalizeCell(row.cells[hours[hourIndex]]);
      return { ...row, cells: { ...row.cells, [hours[hourIndex - 1]]: { ...cell, span: cell.span + 1, hidden: false }, [hours[hourIndex]]: { ...createCell(), hidden: true } } };
    }));
  };
  const extendCellRight = (dayIndex, hourIndex) => setRows((current) => current.map((row, i) => {
    if (i !== dayIndex || !canExtendRight(row, hourIndex)) return row;
    const cell = normalizeCell(row.cells[hours[hourIndex]]);
    return { ...row, cells: { ...row.cells, [hours[hourIndex]]: { ...cell, span: cell.span + 1, hidden: false }, [hours[hourIndex + cell.span]]: { ...createCell(), hidden: true } } };
  }));
  const shrinkCellLeft = (dayIndex, hourIndex) => setRows((current) => current.map((row, i) => {
    if (i !== dayIndex) return row;
    const cell = normalizeCell(row.cells[hours[hourIndex]]);
    if (cell.span <= 1 || hourIndex + 1 >= hours.length) return row;
    return { ...row, cells: { ...row.cells, [hours[hourIndex]]: createCell(), [hours[hourIndex + 1]]: { ...cell, span: cell.span - 1, hidden: false } } };
  }));
  const shrinkCellRight = (dayIndex, hourIndex) => setRows((current) => current.map((row, i) => {
    if (i !== dayIndex) return row;
    const cell = normalizeCell(row.cells[hours[hourIndex]]);
    if (cell.span <= 1) return row;
    return { ...row, cells: { ...row.cells, [hours[hourIndex]]: { ...cell, span: cell.span - 1, hidden: false }, [hours[hourIndex + cell.span - 1]]: createCell() } };
  }));
  const deleteCell = (dayIndex, hourIndex) => {
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex) return row;
      const cell = normalizeCell(row.cells[hours[hourIndex]]);
      const nextCells = { ...row.cells, [hours[hourIndex]]: createCell() };
      for (let index = hourIndex + 1; index < hourIndex + cell.span && index < hours.length; index += 1) nextCells[hours[index]] = createCell();
      return { ...row, cells: nextCells };
    }));
    setCopiedCell(null);
    setSelectedCell(null);
  };

  const totalHours = rows.reduce((total, row) => total + hours.reduce((subtotal, hour) => {
    const cell = normalizeCell(row.cells[hour]);
    return subtotal + (!cell.hidden && cell.text.trim() ? cell.span : 0);
  }, 0), 0);

  return <main className="cahier-shell clean-cahier-shell">
    <section className="cahier-preview-zone">
      <MoroccoHolidaysPage />
      <div className="a4-page cahier-page">
        <header className="cahier-header">
          <input value={school} onChange={(e) => setSchool(e.target.value)} onKeyDown={validateOnEnter} />
          <h2>Cahier de texte</h2>
          <input value={teacher} onChange={(e) => setTeacher(e.target.value)} onKeyDown={validateOnEnter} />
          <input value={schoolYear} readOnly aria-label="Année scolaire automatique" />
        </header>
        <div className="total-hours-control"><span>Total heures :</span><strong>{totalHours} h</strong></div>
        <table className="timetable-table">
          <thead><tr><th>Jour</th>{hours.map((hour, index) => <th key={`${hour}-${index}`}><textarea value={hour} onChange={(e) => updateHour(index, e.target.value)} onKeyDown={validateOnEnter} rows="2" /></th>)}</tr></thead>
          <tbody>{rows.map((row, dayIndex) => <tr key={dayIndex}>
            <td className="hour-cell day-cell"><textarea value={row.day} onChange={(e) => updateDay(dayIndex, e.target.value)} onKeyDown={validateOnEnter} rows="2" /></td>
            {hours.map((hour, hourIndex) => {
              const cell = normalizeCell(row.cells[hour]);
              if (cell.hidden) return null;
              const hasClass = Boolean(cell.text.trim());
              const cellKey = `${dayIndex}-${hourIndex}`;
              const canDropHere = !hasClass && draggedCell && canPasteCell(row, hourIndex, draggedCell);
              return <td key={`${hour}-${hourIndex}`} colSpan={cell.span}><div className={`timetable-cell-content ${hasClass ? 'colored-cell draggable-cell clickable-cell' : ''} ${selectedCell === cellKey ? 'selected-cell' : ''} ${canDropHere || dragOverCell === cellKey ? 'drop-ready-cell' : ''}`} style={hasClass ? { '--cell-color': getCellColor(cell.text) } : undefined} draggable={hasClass} onDragStart={(e) => handleDragStart(e, dayIndex, hourIndex, cell)} onDragEnd={() => { setDraggedCell(null); setDragOverCell(null); }} onDragOver={(e) => handleDragOver(e, dayIndex, hourIndex, row, hasClass)} onDragLeave={() => setDragOverCell(null)} onDrop={(e) => handleDrop(e, dayIndex, hourIndex, row, hasClass)} onClick={hasClass ? () => handleCellClick(dayIndex, hourIndex, cell) : undefined} title={hasClass ? 'Cliquer pour sélectionner ou glisser pour dupliquer' : draggedCell ? 'Déposer ici pour dupliquer' : ''}>
                {hasClass && <div className="span-tools no-print" onClick={(e) => e.stopPropagation()}><button type="button" onClick={() => extendCellLeft(dayIndex, hourIndex)} disabled={!canExtendLeft(row, hourIndex)}>‹</button>{cell.span > 1 && <button type="button" className="span-remove-button" onClick={() => shrinkCellLeft(dayIndex, hourIndex)} title="Réduire depuis la gauche">▷</button>}<button type="button" className="cell-delete-button" onClick={() => deleteCell(dayIndex, hourIndex)} title="Supprimer la cellule">×</button>{cell.span > 1 && <button type="button" className="span-remove-button" onClick={() => shrinkCellRight(dayIndex, hourIndex)} title="Réduire depuis la droite">◁</button>}<button type="button" onClick={() => extendCellRight(dayIndex, hourIndex)} disabled={!canExtendRight(row, hourIndex)}>›</button></div>}
                <textarea value={cell.text} onChange={(e) => updateCellText(dayIndex, hour, e.target.value)} onClick={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()} onKeyDown={validateOnEnter} placeholder="Classe" rows="4" />
                {hasClass && <label className="room-control" onClick={(e) => e.stopPropagation()}><span>Salle</span><input type="number" min="1" max="80" value={cell.room} onChange={(e) => updateRoom(dayIndex, hour, e.target.value)} onKeyDown={validateOnEnter} /></label>}
              </div></td>;
            })}
          </tr>)}</tbody>
        </table>
        <section className="cahier-exams-list" style={examListWrapStyle}>
          <div style={examListTitleStyle}>Liste des examens</div>
          <table style={examListTableStyle}>
            <thead><tr><th style={examListHeaderCellStyle}>Début</th><th style={examListHeaderCellStyle}>Fin</th><th style={examListHeaderCellStyle}>Cycle</th><th style={examListHeaderCellStyle}>Examen</th></tr></thead>
            <tbody>{EXAM_EVENTS.map((exam) => <tr key={`${exam.start}-${exam.end}-${exam.text}`}><td style={examListCellStyle}>{exam.start}</td><td style={examListCellStyle}>{exam.end}</td><td style={examListCellStyle}>{exam.label}</td><td style={{ ...examListCellStyle, textAlign: 'left' }}>{exam.text.replace('Examen : ', '').replace('Rattrapage : ', 'Rattrapage - ')}</td></tr>)}</tbody>
          </table>
        </section>
        <div style={levelGroupsStyle}>
          {classGroups.map((group, index) => <div key={`${GROUP_TITLES[index]}-${index}`} style={{ minHeight: '192px', padding: '11px 9px', border: '2px solid rgba(17, 17, 17, 0.55)', borderRadius: '14px', background: `linear-gradient(180deg, ${GROUP_COLORS[index]}, white)`, boxShadow: '0 4px 10px rgba(17, 17, 17, 0.12)', overflow: 'hidden' }} onDragOver={(event) => { if (draggedClass) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (draggedClass) moveClassToGroup(draggedClass, index); setDraggedClass(null); }}>
            <div style={levelGroupTitleStyle} contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter}>{GROUP_TITLES[index]}</div>
            <div style={levelGroupClassesStyle}>{group.classes.length ? group.classes.map((className) => <span key={className} style={{ ...levelChipStyle, background: getCellColor(className) }} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', className); setDraggedClass(className); }} onDragEnd={() => setDraggedClass(null)}>{className}</span>) : 'Déposer ici'}</div>
          </div>)}
        </div>
        <footer className="cahier-footer"><span>Signature :</span><span>Observations :</span></footer>
      </div>
      {groupedHomeworkPages.map((group, groupIndex) => group.pages.map((pageEntries, pageIndex) => <div className="a4-page cahier-page homework-page" key={`homework-page-${groupIndex}-${pageIndex}`} style={{ '--group-color': group.color, position: 'relative', paddingTop: '60px' }}>
        <div style={groupHomeworkHeaderStyle}>
          <div style={groupHomeworkTitleStyle}>{group.title}</div>
          <div style={progressWrapStyle}>
            <div style={progressBarStyle}>
              <div style={{ ...progressFillStyle, width: `${getPageProgressPercent(pageEntries)}%` }} />
              {SCHOOL_PROGRESS_FLAGS.map((flag) => <span key={flag.date} style={{ ...progressFlagStyle, left: `${getFlagPercent(flag.date)}%` }} title={flag.label}>⚑</span>)}
            </div>
            <div style={progressPercentStyle}>{getPageProgressPercent(pageEntries)}%</div>
          </div>
        </div>
        {pageEntries.map((entry) => <section className={`homework-entry ${entry.isExam ? 'cahier-exam-entry' : ''} ${entry.isHoliday ? 'cahier-extra-holiday-entry' : ''}`} key={`${group.title}-${entry.date}-${entry.eventKey || entry.text}`} style={{ '--homework-color': entry.color }}>
          <div className="homework-date" contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter}>{entry.date}</div>
          <div className="homework-content"><div className="homework-subject" contentEditable={entry.sessions.length === 0} suppressContentEditableWarning onKeyDown={validateOnEnter} style={entry.sessions.length ? subjectTextStyle : undefined}>{entry.sessions.map((session) => <div key={`${group.title}-${entry.date}-${session.hour}-${session.className}`} style={sessionLineStyle}><span style={sessionHourStyle}>{session.hour}</span><span style={sessionClassStyle}>{session.className}</span></div>)}</div><div className="homework-text" contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={entry.isHoliday ? holidayTextStyle : entry.isExam ? examTextStyle : dotTextStyle}>{entry.text}</div></div>
        </section>)}
      </div>))}
    </section>
  </main>;
}
