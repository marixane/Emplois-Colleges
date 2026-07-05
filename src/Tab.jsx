import { useState } from 'react';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00'];
const CELL_COLORS = ['#fff3bf', '#d8f3dc', '#dbeafe', '#ffe4e6', '#ede9fe', '#cffafe', '#fef3c7', '#dcfce7', '#e0e7ff', '#fce7f3', '#ccfbf1', '#f5f5f4', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa', '#ddd6fe', '#bae6fd', '#fecdd3', '#ccfbf1'];

const createCell = () => ({ text: '', room: 1, span: 1, hidden: false });
const cloneCell = (cell) => ({ ...normalizeCell(cell), hidden: false });
const clampRoom = (value) => Math.min(Math.max(Number(value) || 1, 1), 80);

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

const getSchoolYear = () => {
  const today = new Date();
  const startYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  return `Année scolaire : ${startYear} / ${startYear + 1}`;
};

const createRows = () => DAYS.map((day) => ({
  day,
  cells: HOURS.reduce((acc, hour) => ({ ...acc, [hour]: createCell() }), {})
}));

const normalizeCell = (cell) => {
  if (typeof cell === 'object' && cell !== null) {
    return {
      text: String(cell.text ?? ''),
      room: clampRoom(cell.room ?? 1),
      span: Math.max(Number(cell.span) || 1, 1),
      hidden: Boolean(cell.hidden)
    };
  }

  return { text: String(cell ?? ''), room: 1, span: 1, hidden: false };
};

const activityText = `Activité du jour: ....................
Titre..............................
Supports:..........................
....................................
Objectifs:..........................
....................................
....................................`;

export default function Tab() {
  const [school, setSchool] = useState('Établissement :');
  const [teacher, setTeacher] = useState('Professeur :');
  const [hours, setHours] = useState(HOURS);
  const [rows, setRows] = useState(createRows);
  const [copiedCell, setCopiedCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [draggedCell, setDraggedCell] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const schoolYear = getSchoolYear();

  const validateOnEnter = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.currentTarget.blur();
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

  const updateDay = (index, value) => {
    setRows((current) => current.map((row, i) => i === index ? { ...row, day: value } : row));
  };

  const updateCellText = (dayIndex, hour, value) => {
    setRows((current) => current.map((row, i) => i === dayIndex ? {
      ...row,
      cells: { ...row.cells, [hour]: { ...normalizeCell(row.cells[hour]), text: value } }
    } : row));
  };

  const updateRoom = (dayIndex, hour, value) => {
    setRows((current) => current.map((row, i) => i === dayIndex ? {
      ...row,
      cells: { ...row.cells, [hour]: { ...normalizeCell(row.cells[hour]), room: clampRoom(value) } }
    } : row));
  };

  const canExtendLeft = (row, hourIndex) => {
    if (hourIndex <= 0) return false;
    const cell = normalizeCell(row.cells[hours[hourIndex]]);
    const previous = normalizeCell(row.cells[hours[hourIndex - 1]]);
    return Boolean(cell.text.trim()) && !previous.hidden && !previous.text.trim();
  };

  const canExtendRight = (row, hourIndex) => {
    const cell = normalizeCell(row.cells[hours[hourIndex]]);
    const nextIndex = hourIndex + cell.span;
    if (!cell.text.trim() || nextIndex >= hours.length) return false;
    const next = normalizeCell(row.cells[hours[nextIndex]]);
    return !next.hidden && !next.text.trim();
  };

  const canPasteCell = (row, hourIndex, cellToPaste) => {
    const sourceCell = normalizeCell(cellToPaste);
    if (!sourceCell.text.trim()) return false;
    if (hourIndex + sourceCell.span > hours.length) return false;

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

      for (let index = hourIndex + 1; index < hourIndex + pasted.span; index += 1) {
        nextCells[hours[index]] = { ...createCell(), hidden: true };
      }

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
    if (!normalized.text.trim()) {
      event.preventDefault();
      return;
    }

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
      const currentHour = hours[hourIndex];
      const previousHour = hours[hourIndex - 1];
      const cell = normalizeCell(row.cells[currentHour]);

      return {
        ...row,
        cells: {
          ...row.cells,
          [previousHour]: { ...cell, span: cell.span + 1, hidden: false },
          [currentHour]: { ...createCell(), hidden: true }
        }
      };
    }));
  };

  const extendCellRight = (dayIndex, hourIndex) => {
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex || !canExtendRight(row, hourIndex)) return row;
      const currentHour = hours[hourIndex];
      const cell = normalizeCell(row.cells[currentHour]);
      const nextHour = hours[hourIndex + cell.span];

      return {
        ...row,
        cells: {
          ...row.cells,
          [currentHour]: { ...cell, span: cell.span + 1, hidden: false },
          [nextHour]: { ...createCell(), hidden: true }
        }
      };
    }));
  };

  const shrinkCellLeft = (dayIndex, hourIndex) => {
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex) return row;
      const currentHour = hours[hourIndex];
      const cell = normalizeCell(row.cells[currentHour]);
      if (cell.span <= 1 || hourIndex + 1 >= hours.length) return row;
      const nextHour = hours[hourIndex + 1];

      return {
        ...row,
        cells: {
          ...row.cells,
          [currentHour]: createCell(),
          [nextHour]: { ...cell, span: cell.span - 1, hidden: false }
        }
      };
    }));
  };

  const shrinkCellRight = (dayIndex, hourIndex) => {
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex) return row;
      const currentHour = hours[hourIndex];
      const cell = normalizeCell(row.cells[currentHour]);
      if (cell.span <= 1) return row;
      const releasedHour = hours[hourIndex + cell.span - 1];

      return {
        ...row,
        cells: {
          ...row.cells,
          [currentHour]: { ...cell, span: cell.span - 1, hidden: false },
          [releasedHour]: createCell()
        }
      };
    }));
  };

  const deleteCell = (dayIndex, hourIndex) => {
    setRows((current) => current.map((row, i) => {
      if (i !== dayIndex) return row;
      const currentHour = hours[hourIndex];
      const cell = normalizeCell(row.cells[currentHour]);
      const nextCells = { ...row.cells, [currentHour]: createCell() };

      for (let index = hourIndex + 1; index < hourIndex + cell.span && index < hours.length; index += 1) {
        nextCells[hours[index]] = createCell();
      }

      return { ...row, cells: nextCells };
    }));

    setCopiedCell(null);
    setSelectedCell(null);
  };

  const totalHours = rows.reduce((total, row) => total + hours.reduce((subtotal, hour) => {
    const cell = normalizeCell(row.cells[hour]);
    return subtotal + (!cell.hidden && cell.text.trim() ? cell.span : 0);
  }, 0), 0);

  const activityTitleStyle = {
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    outline: 'none',
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: 900,
    lineHeight: 1.05
  };

  const activityLabelStyle = {
    ...activityTitleStyle,
    fontSize: '22px',
    lineHeight: 1.05,
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  };

  const activityRemarksStyle = {
    ...activityLabelStyle,
    fontSize: '14px',
    lineHeight: 1.05,
    overflowWrap: 'anywhere'
  };

  return <main className="cahier-shell clean-cahier-shell">
    <section className="cahier-preview-zone">
      <div className="a4-page cahier-page">
        <header className="cahier-header">
          <input value={school} onChange={(e) => setSchool(e.target.value)} onKeyDown={validateOnEnter} />
          <h2>Cahier de texte</h2>
          <input value={teacher} onChange={(e) => setTeacher(e.target.value)} onKeyDown={validateOnEnter} />
          <input value={schoolYear} readOnly aria-label="Année scolaire automatique" />
        </header>

        <div className="total-hours-control">
          <span>Total heures :</span>
          <strong>{totalHours} h</strong>
        </div>

        <table className="timetable-table">
          <thead>
            <tr>
              <th>Jour</th>
              {hours.map((hour, index) => <th key={`${hour}-${index}`}>
                <textarea value={hour} onChange={(e) => updateHour(index, e.target.value)} onKeyDown={validateOnEnter} rows="2" />
              </th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, dayIndex) => <tr key={dayIndex}>
              <td className="hour-cell day-cell">
                <textarea value={row.day} onChange={(e) => updateDay(dayIndex, e.target.value)} onKeyDown={validateOnEnter} rows="2" />
              </td>
              {hours.map((hour, hourIndex) => {
                const cell = normalizeCell(row.cells[hour]);
                if (cell.hidden) return null;
                const hasClass = Boolean(cell.text.trim());
                const cellKey = `${dayIndex}-${hourIndex}`;
                const canDropHere = !hasClass && draggedCell && canPasteCell(row, hourIndex, draggedCell);

                return <td key={`${hour}-${hourIndex}`} colSpan={cell.span}>
                  <div
                    className={`timetable-cell-content ${hasClass ? 'colored-cell draggable-cell clickable-cell' : ''} ${selectedCell === cellKey ? 'selected-cell' : ''} ${canDropHere || dragOverCell === cellKey ? 'drop-ready-cell' : ''}`}
                    style={hasClass ? { '--cell-color': getCellColor(cell.text) } : undefined}
                    draggable={hasClass}
                    onDragStart={(e) => handleDragStart(e, dayIndex, hourIndex, cell)}
                    onDragEnd={() => {
                      setDraggedCell(null);
                      setDragOverCell(null);
                    }}
                    onDragOver={(e) => handleDragOver(e, dayIndex, hourIndex, row, hasClass)}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={(e) => handleDrop(e, dayIndex, hourIndex, row, hasClass)}
                    onClick={hasClass ? () => handleCellClick(dayIndex, hourIndex, cell) : undefined}
                    title={hasClass ? 'Cliquer pour sélectionner ou glisser pour dupliquer' : draggedCell ? 'Déposer ici pour dupliquer' : ''}
                  >
                    {hasClass && <div className="span-tools no-print" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => extendCellLeft(dayIndex, hourIndex)} disabled={!canExtendLeft(row, hourIndex)}>‹</button>
                      {cell.span > 1 && <button type="button" className="span-remove-button" onClick={() => shrinkCellLeft(dayIndex, hourIndex)} title="Réduire depuis la gauche">▷</button>}
                      <button type="button" className="cell-delete-button" onClick={() => deleteCell(dayIndex, hourIndex)} title="Supprimer la cellule">×</button>
                      {cell.span > 1 && <button type="button" className="span-remove-button" onClick={() => shrinkCellRight(dayIndex, hourIndex)} title="Réduire depuis la droite">◁</button>}
                      <button type="button" onClick={() => extendCellRight(dayIndex, hourIndex)} disabled={!canExtendRight(row, hourIndex)}>›</button>
                    </div>}
                    <textarea
                      value={cell.text}
                      onChange={(e) => updateCellText(dayIndex, hour, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => e.preventDefault()}
                      onKeyDown={validateOnEnter}
                      placeholder="Classe"
                      rows="4"
                    />
                    {hasClass && <label className="room-control" onClick={(e) => e.stopPropagation()}>
                      <span>Salle</span>
                      <input
                        type="number"
                        min="1"
                        max="80"
                        value={cell.room}
                        onChange={(e) => updateRoom(dayIndex, hour, e.target.value)}
                        onKeyDown={validateOnEnter}
                      />
                    </label>}
                  </div>
                </td>;
              })}
            </tr>)}
          </tbody>
        </table>

        <footer className="cahier-footer">
          <span>Signature :</span>
          <span>Observations :</span>
        </footer>
      </div>

      <div className="a4-page cahier-page activity-page">
        <table className="activity-table">
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="activity-top-row">
              <th colSpan="3"><div contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={activityTitleStyle}>Séquence:</div></th>
              <th colSpan="3"><div contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={activityTitleStyle}>Compétences:</div></th>
            </tr>
            <tr className="activity-label-row">
              <th><div contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={activityLabelStyle}>Date</div></th>
              <th><div contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={activityLabelStyle}>Heure</div></th>
              <th><div contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={activityLabelStyle}>Classe</div></th>
              <th colSpan="2"><textarea aria-label="Espace libre" /></th>
              <th><div contentEditable suppressContentEditableWarning onKeyDown={validateOnEnter} style={activityRemarksStyle}>Remarques</div></th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4, 5].map((rowIndex) => <tr key={rowIndex}>
              <td><textarea aria-label="Date" /></td>
              <td><textarea aria-label="Heure" /></td>
              <td><textarea aria-label="Classe" /></td>
              <td colSpan="2" className="activity-main-cell"><textarea defaultValue={activityText} /></td>
              <td><textarea aria-label="Remarques" /></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  </main>;
}
