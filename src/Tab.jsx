import { useState } from 'react';
import MoroccoHolidaysPage from './MoroccoHolidaysPage';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'];
const CELL_COLORS = ['#fff3bf', '#d8f3dc', '#dbeafe', '#ffe4e6', '#ede9fe', '#cffafe', '#fef3c7', '#dcfce7', '#e0e7ff', '#fce7f3', '#ccfbf1', '#f5f5f4', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa', '#ddd6fe', '#bae6fd', '#fecdd3', '#ccfbf1'];
const HOMEWORK_COLORS = ['#66c43f', '#b34bd7', '#2f80ed', '#ff3f5f', '#f2994a'];
const GROUP_COLORS = ['#e0f2fe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe'];
const GROUP_TITLES = ['Tronc Commun', '1ères Bac', '2ème Bac', 'Autres', 'Autres'];
const DOT_TEXT = Array.from({ length: 4 }, () => '.'.repeat(74)).join('\n');

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
const subjectTextStyle = { display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: '6px', padding: '8px 10px', textAlign: 'center', overflow: 'hidden' };
const sessionLineStyle = { display: 'grid', gridTemplateColumns: '52px 1fr', alignItems: 'center', gap: '6px', minHeight: '24px', padding: '4px 7px', border: '1px solid rgba(63, 64, 80, 0.18)', borderRadius: '8px', background: 'rgba(63, 64, 80, 0.045)', color: '#343545', fontFamily: 'Arial, sans-serif', lineHeight: 1, overflow: 'hidden' };
const sessionHourStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '18px', borderRadius: '6px', background: 'var(--homework-color)', color: 'white', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap' };
const sessionClassStyle = { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' };
const levelGroupsStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' };
const levelGroupTitleStyle = { marginBottom: '8px', color: '#111827', fontSize: '12px', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.3px' };
const levelGroupClassesStyle = { display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', gap: '7px', minHeight: '130px', color: 'rgba(17, 17, 17, 0.45)', fontSize: '10px', fontWeight: 800, lineHeight: 1.1, textAlign: 'center' };
const levelChipStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '28px', padding: '7px 9px', borderRadius: '9px', border: '1px solid rgba(17, 17, 17, 0.22)', color: '#111827', fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'grab', boxShadow: '0 1px 3px rgba(17, 17, 17, 0.12)' };
const groupHomeworkHeaderStyle = { position: 'absolute', top: '10px', left: '18px', right: '18px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'var(--group-color)', color: '#111827', fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4px', boxShadow: '0 2px 6px rgba(17, 17, 17, 0.12)' };

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
const createRows = () => DAYS.map((day) => ({ day, cells: HOURS.reduce((acc, hour) => ({ ...acc, [hour]: createCell() }), {}) }));
const getHourStart = (hour) => String(hour ?? '').split('-')[0].trim();
const getMondayBasedDayIndex = (date) => (date.getDay() + 6) % 7;
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
    const entries = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(getSchoolStartYear(), 8, index + 1);
      const dayIndex = getMondayBasedDayIndex(date);
      if (dayIndex >= rows.length || !classSet.size) return null;
      const sessions = (sessionsByDay[dayIndex] ?? []).filter((session) => classSet.has(session.className));
      if (!sessions.length) return null;
      const dayNumber = String(index + 1).padStart(2, '0');
      return { date: `${String(rows[dayIndex]?.day || DAYS[dayIndex]).toUpperCase()} ${dayNumber}/09`, sessions, text: DOT_TEXT, color: HOMEWORK_COLORS[dayIndex % HOMEWORK_COLORS.length] };
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
        <div style={levelGroupsStyle}>
          {classGroups.map((group, index) => <div key={`${GROUP_TITLES[index]}-${index}`} style={{ minHeight: '192px', padding: '11px 9px', border: '2px solid rgba(17, 17, 17, 0.55)', borderRadius: '14px', background: `linear-gradient(180deg, ${GROUP_COLORS[index]}, white)`, boxShadow: '0 4px 10px rgba(17, 17, 17, 0.12)', overflow: 'hidden' }} onDragOver={(event) => { if (draggedClass) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (draggedClass) moveClassToGroup(draggedClass, index); setDraggedClass(null); }}>
            <div style={levelGroupTitleStyle} contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter}>{GROUP_TITLES[index]}</div>
            <div style={levelGroupClassesStyle}>{group.classes.length ? group.classes.map((className) => <span key={className} style={{ ...levelChipStyle, background: getCellColor(className) }} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', className); setDraggedClass(className); }} onDragEnd={() => setDraggedClass(null)}>{className}</span>) : 'Déposer ici'}</div>
          </div>)}
        </div>
        <footer className="cahier-footer"><span>Signature :</span><span>Observations :</span></footer>
      </div>
      {groupedHomeworkPages.map((group, groupIndex) => group.pages.map((pageEntries, pageIndex) => <div className="a4-page cahier-page homework-page" key={`homework-page-${groupIndex}-${pageIndex}`} style={{ '--group-color': group.color, position: 'relative', paddingTop: '50px' }}>
        <div style={groupHomeworkHeaderStyle}>{group.title} - Mois 09</div>
        {pageEntries.map((entry) => <section className="homework-entry" key={`${group.title}-${entry.date}`} style={{ '--homework-color': entry.color }}>
          <div className="homework-date" contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter}>{entry.date}</div>
          <div className="homework-content"><div className="homework-subject" contentEditable={entry.sessions.length === 0} suppressContentEditableWarning onKeyDown={validateOnEnter} style={entry.sessions.length ? subjectTextStyle : undefined}>{entry.sessions.map((session) => <div key={`${group.title}-${entry.date}-${session.hour}-${session.className}`} style={sessionLineStyle}><span style={sessionHourStyle}>{session.hour}</span><span style={sessionClassStyle}>{session.className}</span></div>)}</div><div className="homework-text" contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={dotTextStyle}>{entry.text}</div></div>
        </section>)}
      </div>))}
    </section>
  </main>;
}
