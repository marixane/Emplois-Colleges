import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DURATION_OPTIONS = ['30 min', '1 h', '1 h 30', '2 h', '2 h 30', '3 h'];
const DEFAULT_DURATION_INDEX = 3;
const POINT_STEP = 0.25;
const MIN_POINTS = 1;
const MAX_POINTS = 20;
const TOTAL_POINTS = 20;
const TOTAL_EXERCISE_HEIGHT = 986;
const TOTAL_SECOND_PAGE_HEIGHT = 1065;
const MIN_EXERCISE_HEIGHT = 120;
const MIN_EXERCISES = 1;
const MAX_EXERCISES = 6;
const INDIVIDUAL_TITLE = 'Devoir individuel de Mathématique\nN°: 1 Semestre: 1 Lycée El jamai ,Tanger';
const HOMEWORK_TITLE = 'Devoir à la maison de Mathématique\nN°: 1 Semestre: 1 Lycée El jamai ,Tanger';

const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);
const roundToStep = (value) => Math.round(Number(value) / POINT_STEP) * POINT_STEP;

const waitForExportStyles = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 80);
      });
    });
  });

const formatPoints = (value) => {
  const rounded = Math.round(Number(value) * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
  return `${text} ${rounded === 1 ? 'Point' : 'Points'}`;
};

const getTitleFontSize = (text) => {
  const length = text.trim().length;
  if (length > 115) return 11;
  if (length > 90) return 12;
  if (length > 65) return 14;
  if (length > 42) return 16;
  return 18;
};

const getProfessorFontSize = (text) => {
  const length = text.trim().length;
  if (length > 38) return 12;
  if (length > 26) return 14;
  return 16;
};

const getBalancedPoints = (count) => {
  const base = roundToStep(TOTAL_POINTS / count);
  const points = Array.from({ length: count }, () => base);
  const diff = Math.round((TOTAL_POINTS - points.reduce((sum, value) => sum + value, 0)) * 100) / 100;
  points[count - 1] = Math.round((points[count - 1] + diff) * 100) / 100;
  return points;
};

const createExercise = (index, points = 5) => ({
  id: `ex${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  points,
  image: null,
  zoom: 100,
  x: 0,
  y: 0,
  masks: [],
});

const createExercises = (count) => {
  const points = getBalancedPoints(count);
  return Array.from({ length: count }, (_, index) => createExercise(index, points[index]));
};

const createHeights = (count, totalHeight = TOTAL_EXERCISE_HEIGHT) => {
  const base = Math.floor(totalHeight / count);
  const heights = Array.from({ length: count }, () => base);
  heights[count - 1] = totalHeight - base * (count - 1);
  return heights;
};

function App() {
  const [studentLevel, setStudentLevel] = useState('2 Bac SPF');
  const [durationIndex, setDurationIndex] = useState(DEFAULT_DURATION_INDEX);
  const [assignmentType, setAssignmentType] = useState('individual');
  const [testTitle, setTestTitle] = useState(INDIVIDUAL_TITLE);
  const [teacher, setTeacher] = useState('Prof : Marwane.R');
  const [exercises, setExercises] = useState(() => createExercises(3));
  const [secondPageExercises, setSecondPageExercises] = useState(() => createExercises(3));
  const [isSecondPageEnabled, setIsSecondPageEnabled] = useState(true);
  const [isTotalLocked, setIsTotalLocked] = useState(true);
  const [exerciseHeights, setExerciseHeights] = useState(() => [430, 278, 278]);
  const [secondPageHeights, setSecondPageHeights] = useState(() => createHeights(3, TOTAL_SECOND_PAGE_HEIGHT));
  const [isExporting, setIsExporting] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const pageRefs = useRef([]);
  const fileInputRefs = useRef({});

  const duration = DURATION_OPTIONS[durationIndex];
  const isHomework = assignmentType === 'homework';
  const totalPoints = Math.round(exercises.reduce((sum, exercise) => sum + exercise.points, 0) * 100) / 100;

  const changeAssignmentType = (nextType) => {
    setAssignmentType(nextType);
    setTestTitle(nextType === 'homework' ? HOMEWORK_TITLE : INDIVIDUAL_TITLE);
  };

  const changeDuration = (step) => {
    setDurationIndex((currentIndex) => clamp(currentIndex + step, 0, DURATION_OPTIONS.length - 1));
  };

  const setPageExercises = (page, updater) => {
    if (page === 2) setSecondPageExercises(updater);
    else setExercises(updater);
  };

  const getPageExercises = (page) => (page === 2 ? secondPageExercises : exercises);

  const updateExerciseOnPage = (page, id, field, value) => {
    setPageExercises(page, (items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const getCompensationIndex = (items, index) => {
    if (items.length < 2) return -1;
    return index < items.length - 1 ? index + 1 : index - 1;
  };

  const canChangeExercisePoints = (page, index, step) => {
    const items = getPageExercises(page);
    const nextTargetPoints = Math.round((items[index].points + step * POINT_STEP) * 100) / 100;

    if (!isTotalLocked || page === 2) {
      return nextTargetPoints >= MIN_POINTS && nextTargetPoints <= MAX_POINTS;
    }

    const compensationIndex = getCompensationIndex(items, index);
    if (compensationIndex < 0) return false;

    const nextCompensationPoints = Math.round((items[compensationIndex].points - step * POINT_STEP) * 100) / 100;

    return (
      nextTargetPoints >= MIN_POINTS &&
      nextTargetPoints <= MAX_POINTS &&
      nextCompensationPoints >= MIN_POINTS &&
      nextCompensationPoints <= MAX_POINTS
    );
  };

  const changeExercisePoints = (page, index, step) => {
    if (!canChangeExercisePoints(page, index, step)) return;

    setPageExercises(page, (items) => {
      if (!isTotalLocked || page === 2) {
        return items.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, points: Math.round((item.points + step * POINT_STEP) * 100) / 100 }
            : item
        );
      }

      const compensationIndex = getCompensationIndex(items, index);
      return items.map((item, itemIndex) => {
        if (itemIndex === index) {
          return { ...item, points: Math.round((item.points + step * POINT_STEP) * 100) / 100 };
        }

        if (itemIndex === compensationIndex) {
          return { ...item, points: Math.round((item.points - step * POINT_STEP) * 100) / 100 };
        }

        return item;
      });
    });
  };

  const changeTotalLock = (checked) => {
    setIsTotalLocked(checked);

    if (!checked) return;

    setExercises((items) => {
      const balanced = getBalancedPoints(items.length);
      return items.map((item, index) => ({ ...item, points: balanced[index] }));
    });
  };

  const changeExerciseCount = (page, step) => {
    const items = getPageExercises(page);
    const nextCount = clamp(items.length + step, MIN_EXERCISES, MAX_EXERCISES);
    if (nextCount === items.length) return;

    const totalHeight = page === 2 ? TOTAL_SECOND_PAGE_HEIGHT : TOTAL_EXERCISE_HEIGHT;

    setPageExercises(page, (currentItems) => {
      const balanced = getBalancedPoints(nextCount);
      return Array.from({ length: nextCount }, (_, index) => {
        const existing = currentItems[index];
        const nextPoints = page === 1 && isTotalLocked ? balanced[index] : existing?.points ?? 5;
        return existing ? { ...existing, points: nextPoints, masks: existing.masks ?? [] } : createExercise(index, nextPoints);
      });
    });

    const setHeights = page === 2 ? setSecondPageHeights : setExerciseHeights;
    setHeights((heights) => {
      if (nextCount > heights.length) return createHeights(nextCount, totalHeight);

      const kept = heights.slice(0, nextCount);
      const sum = kept.reduce((total, height) => total + height, 0);
      const factor = totalHeight / sum;
      const resized = kept.map((height) => Math.max(MIN_EXERCISE_HEIGHT, Math.round(height * factor)));
      const diff = totalHeight - resized.reduce((total, height) => total + height, 0);
      resized[resized.length - 1] += diff;
      return resized;
    });
  };

  const updateImagePosition = (page, id, nextX, nextY) => {
    setPageExercises(page, (items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, x: clamp(nextX, -200, 200), y: clamp(nextY, -200, 200) }
          : item
      )
    );
  };

  const applyHeightDelta = (upperIndex, lowerIndex, deltaY, startHeights) => {
    const maxDelta = startHeights[lowerIndex] - MIN_EXERCISE_HEIGHT;
    const minDelta = MIN_EXERCISE_HEIGHT - startHeights[upperIndex];
    const safeDelta = clamp(deltaY, minDelta, maxDelta);

    return startHeights.map((height, index) => {
      if (index === upperIndex) return Math.round(height + safeDelta);
      if (index === lowerIndex) return Math.round(height - safeDelta);
      return height;
    });
  };

  const startResize = (event, page, lowerExerciseIndex) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState(null);

    setResizeState({
      page,
      upperIndex: lowerExerciseIndex - 1,
      lowerIndex: lowerExerciseIndex,
      startClientY: event.clientY,
      startHeights: page === 2 ? secondPageHeights : exerciseHeights,
    });
  };

  const moveResize = (event) => {
    if (!resizeState) return;

    const deltaY = event.clientY - resizeState.startClientY;
    const nextHeights = applyHeightDelta(
      resizeState.upperIndex,
      resizeState.lowerIndex,
      deltaY,
      resizeState.startHeights
    );

    if (resizeState.page === 2) setSecondPageHeights(nextHeights);
    else setExerciseHeights(nextHeights);
  };

  const endResize = () => setResizeState(null);

  const updatePhotoControl = (page, id, field, value) => {
    const limits = { zoom: [60, 220], x: [-200, 200], y: [-200, 200] };
    updateExerciseOnPage(page, id, field, clamp(value, limits[field][0], limits[field][1]));
  };

  const startDrag = (event, page, exercise) => {
    event.preventDefault();
    setResizeState(null);

    setDragState({
      type: 'photo',
      page,
      id: exercise.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: exercise.x,
      startY: exercise.y,
    });
  };

  const addMask = (page, exerciseId) => {
    setPageExercises(page, (items) =>
      items.map((item) => {
        if (item.id !== exerciseId) return item;
        const nextMask = { id: `mask-${Date.now()}`, x: 120, y: 90, width: 160, height: 60 };
        return { ...item, masks: [...(item.masks ?? []), nextMask] };
      })
    );
  };

  const deleteMask = (page, exerciseId, maskId) => {
    setPageExercises(page, (items) =>
      items.map((item) =>
        item.id === exerciseId ? { ...item, masks: (item.masks ?? []).filter((mask) => mask.id !== maskId) } : item
      )
    );
  };

  const updateMask = (page, exerciseId, maskId, updates) => {
    setPageExercises(page, (items) =>
      items.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              masks: (item.masks ?? []).map((mask) =>
                mask.id === maskId
                  ? {
                      ...mask,
                      ...updates,
                      x: clamp(updates.x ?? mask.x, 0, 720),
                      y: clamp(updates.y ?? mask.y, 0, 980),
                      width: clamp(updates.width ?? mask.width, 24, 720),
                      height: clamp(updates.height ?? mask.height, 18, 980),
                    }
                  : mask
              ),
            }
          : item
      )
    );
  };

  const startMaskDrag = (event, page, exerciseId, mask) => {
    event.preventDefault();
    event.stopPropagation();
    setResizeState(null);
    setDragState({
      type: 'mask-move',
      page,
      exerciseId,
      maskId: mask.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: mask.x,
      startY: mask.y,
    });
  };

  const startMaskResize = (event, page, exerciseId, mask) => {
    event.preventDefault();
    event.stopPropagation();
    setResizeState(null);
    setDragState({
      type: 'mask-resize',
      page,
      exerciseId,
      maskId: mask.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: mask.width,
      startHeight: mask.height,
    });
  };

  const moveDrag = (event) => {
    if (!dragState) return;

    const deltaX = event.clientX - dragState.startClientX;
    const deltaY = event.clientY - dragState.startClientY;

    if (dragState.type === 'photo') {
      updateImagePosition(dragState.page, dragState.id, dragState.startX + deltaX, dragState.startY + deltaY);
      return;
    }

    if (dragState.type === 'mask-move') {
      updateMask(dragState.page, dragState.exerciseId, dragState.maskId, {
        x: dragState.startX + deltaX,
        y: dragState.startY + deltaY,
      });
      return;
    }

    if (dragState.type === 'mask-resize') {
      updateMask(dragState.page, dragState.exerciseId, dragState.maskId, {
        width: dragState.startWidth + deltaX,
        height: dragState.startHeight + deltaY,
      });
    }
  };

  const endDrag = () => setDragState(null);

  const triggerExerciseFileInput = (id) => {
    if (isExporting) return;
    fileInputRefs.current[id]?.click();
  };

  const handleExerciseImage = (page, id, file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setPageExercises(page, (items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, image: { name: file.name, url: URL.createObjectURL(file) }, zoom: 100, x: 0, y: 0, masks: [] }
          : item
      )
    );
  };

  const clearExerciseImage = (page, id) => {
    setPageExercises(page, (items) => items.map((item) => (item.id === id ? { ...item, image: null, masks: [] } : item)));
  };

  const createPdf = async () => {
    const pages = pageRefs.current.filter((page, index) => Boolean(page) && (index === 0 || isSecondPageEnabled));
    if (pages.length === 0) return null;

    setIsExporting(true);
    endDrag();
    endResize();

    await waitForExportStyles();

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const page = pages[pageIndex];
      page.querySelectorAll('textarea').forEach((field) => {
        field.blur();
        field.scrollLeft = 0;
        field.scrollTop = 0;
      });

      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        ignoreElements: (element) =>
          element.classList?.contains('photo-overlay-tools') ||
          element.classList?.contains('mask-delete-button') ||
          element.classList?.contains('mask-resize-handle'),
      });

      const imageData = canvas.toDataURL('image/jpeg', 1);
      if (pageIndex > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297);
    }

    return pdf;
  };

  const exportPdf = async () => {
    try {
      const pdf = await createPdf();
      pdf?.save('devoir-a4.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  const previewPdf = async () => {
    try {
      const pdf = await createPdf();
      if (!pdf) return;

      const pdfUrl = pdf.output('bloburl');
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsExporting(false);
    }
  };

  const renderExerciseList = (page, items, heights, startNumber) => (
    <div className="exercise-list">
      {items.map((exercise, index) => {
        const exerciseTitle = `Exercice ${startNumber + index}`;
        return (
          <section
            className={`exam-exercise ex-${index + 1}`}
            key={exercise.id}
            style={{ height: `${heights[index]}px` }}
          >
            {index > 0 && (
              <button
                type="button"
                className="resize-handle"
                onMouseDown={(event) => startResize(event, page, index)}
                aria-label={`Modifier la hauteur de ${exerciseTitle}`}
              />
            )}
            <div className="exercise-title exercise-title-controls">
              {isHomework ? (
                <span>{exerciseTitle}</span>
              ) : (
                <>
                  <span>{exerciseTitle} : </span>
                  <span className="points-decoration">* (</span>
                  <button
                    type="button"
                    onClick={() => changeExercisePoints(page, index, -1)}
                    disabled={!canChangeExercisePoints(page, index, -1)}
                    aria-label={`Diminuer les points de ${exerciseTitle}`}
                  >
                    −
                  </button>
                  <strong>{formatPoints(exercise.points)}</strong>
                  <button
                    type="button"
                    onClick={() => changeExercisePoints(page, index, 1)}
                    disabled={!canChangeExercisePoints(page, index, 1)}
                    aria-label={`Augmenter les points de ${exerciseTitle}`}
                  >
                    +
                  </button>
                  <span className="points-decoration">) *</span>
                </>
              )}
            </div>
            <div
              className="exercise-body clickable-photo-zone"
              onClick={() => {
                if (!exercise.image) triggerExerciseFileInput(exercise.id);
              }}
              title={exercise.image ? '' : 'Cliquer pour choisir la photo'}
            >
              {exercise.image && (
                <div className="photo-overlay-tools" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="photo-tool-button" onClick={() => triggerExerciseFileInput(exercise.id)}>
                    Changer photo
                  </button>
                  <button type="button" className="photo-tool-button" onClick={() => addMask(page, exercise.id)}>
                    Rectangle blanc
                  </button>
                  <button type="button" className="photo-tool-button danger" onClick={() => clearExerciseImage(page, exercise.id)}>
                    Supprimer
                  </button>
                  <label className="photo-zoom-control">
                    Zoom
                    <input
                      type="range"
                      min="60"
                      max="220"
                      value={exercise.zoom}
                      onChange={(e) => updatePhotoControl(page, exercise.id, 'zoom', e.target.value)}
                    />
                    <span>{exercise.zoom}%</span>
                  </label>
                </div>
              )}
              {exercise.image ? (
                <>
                  <img
                    className="draggable-photo"
                    src={exercise.image.url}
                    alt={exercise.image.name}
                    onMouseDown={(event) => startDrag(event, page, exercise)}
                    draggable="false"
                    style={{ transform: `translate(${exercise.x}px, ${exercise.y}px) scale(${exercise.zoom / 100})` }}
                  />
                  {(exercise.masks ?? []).map((mask) => (
                    <div
                      className="white-mask"
                      key={mask.id}
                      onMouseDown={(event) => startMaskDrag(event, page, exercise.id, mask)}
                      style={{ left: `${mask.x}px`, top: `${mask.y}px`, width: `${mask.width}px`, height: `${mask.height}px` }}
                    >
                      <button
                        type="button"
                        className="mask-delete-button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteMask(page, exercise.id, mask.id);
                        }}
                      >
                        ×
                      </button>
                      <span className="mask-resize-handle" onMouseDown={(event) => startMaskResize(event, page, exercise.id, mask)} />
                    </div>
                  ))}
                </>
              ) : (
                <div className="empty-zone">Clique ici pour choisir la photo</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );

  const visibleFileInputs = [
    ...exercises.map((exercise) => ({ exercise, page: 1 })),
    ...(isSecondPageEnabled ? secondPageExercises.map((exercise) => ({ exercise, page: 2 })) : []),
  ];

  return (
    <main
      className={`app-shell ${resizeState ? 'is-resizing' : ''}`}
      onMouseMove={(event) => {
        moveDrag(event);
        moveResize(event);
      }}
      onMouseUp={() => {
        endDrag();
        endResize();
      }}
      onMouseLeave={() => {
        endDrag();
        endResize();
      }}
    >
      <section className="panel">
        <p className="eyebrow">A4 Exam Maker</p>
        <h1>Créer une feuille A4 avec entête fixe</h1>
        <p className="intro">Choisis le type de devoir, puis le nombre d’exercices par page.</p>

        <div className="form-group">
          <label>Type de devoir</label>
          <div className="duration-control compact-control assignment-control">
            <button type="button" onClick={() => changeAssignmentType('individual')} disabled={assignmentType === 'individual'}>
              Individuel
            </button>
            <button type="button" onClick={() => changeAssignmentType('homework')} disabled={assignmentType === 'homework'}>
              À la maison
            </button>
          </div>
        </div>

        <label className="total-lock-control">
          <input
            type="checkbox"
            checked={isSecondPageEnabled}
            onChange={(e) => setIsSecondPageEnabled(e.target.checked)}
          />
          Afficher la page 2
        </label>

        {!isHomework && (
          <>
            <label className="total-lock-control">
              <input type="checkbox" checked={isTotalLocked} onChange={(e) => changeTotalLock(e.target.checked)} />
              Total page 1 bloqué à 20 points
            </label>

            <p className={`points-total ${isTotalLocked ? 'locked' : 'free'}`}>
              {isTotalLocked ? 'Total page 1 bloqué : ' : 'Total page 1 libre : '}
              {formatPoints(totalPoints)}
            </p>
          </>
        )}

        <div className="form-group">
          <label>Nombre d’exercices page 1</label>
          <div className="duration-control compact-control">
            <button type="button" onClick={() => changeExerciseCount(1, -1)} disabled={exercises.length === MIN_EXERCISES}>
              −
            </button>
            <strong>{exercises.length}</strong>
            <button type="button" onClick={() => changeExerciseCount(1, 1)} disabled={exercises.length === MAX_EXERCISES}>
              +
            </button>
          </div>
        </div>

        {isSecondPageEnabled && (
          <div className="form-group">
            <label>Nombre d’exercices page 2</label>
            <div className="duration-control compact-control">
              <button type="button" onClick={() => changeExerciseCount(2, -1)} disabled={secondPageExercises.length === MIN_EXERCISES}>
                −
              </button>
              <strong>{secondPageExercises.length}</strong>
              <button type="button" onClick={() => changeExerciseCount(2, 1)} disabled={secondPageExercises.length === MAX_EXERCISES}>
                +
              </button>
            </div>
          </div>
        )}

        {visibleFileInputs.map(({ exercise, page }) => (
          <input
            key={exercise.id}
            ref={(input) => {
              fileInputRefs.current[exercise.id] = input;
            }}
            className="hidden-file-input"
            type="file"
            accept="image/*"
            onChange={(e) => handleExerciseImage(page, exercise.id, e.target.files?.[0])}
          />
        ))}

        <button type="button" onClick={previewPdf} disabled={isExporting}>
          {isExporting ? 'Préparation...' : 'Voir PDF'}
        </button>

        <button type="button" className="secondary" onClick={exportPdf} disabled={isExporting}>
          {isExporting ? 'Export en cours...' : 'Exporter PDF A4'}
        </button>
      </section>

      <section className="preview-zone">
        <div className={`a4-page exam-page ${isExporting ? 'is-exporting' : ''}`} ref={(element) => { pageRefs.current[0] = element; }}>
          <header className="exam-header three-cell-header">
            <div className="header-cell left-header-cell class-duration-header">
              <textarea className="inline-class-input" value={studentLevel} onChange={(e) => setStudentLevel(e.target.value)} rows="1" aria-label="Classe" />
              <div className="tiny-duration-control">
                <button type="button" onClick={() => changeDuration(-1)} disabled={durationIndex === 0} aria-label="Diminuer la durée">
                  −
                </button>
                <strong>{duration}</strong>
                <button type="button" onClick={() => changeDuration(1)} disabled={durationIndex === DURATION_OPTIONS.length - 1} aria-label="Augmenter la durée">
                  +
                </button>
              </div>
            </div>

            <div className="header-cell middle-header-cell">
              <textarea
                className="inline-title-input"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                rows="2"
                aria-label="Titre du devoir"
                style={{ fontSize: `${getTitleFontSize(testTitle)}px` }}
              />
            </div>

            <div className="header-cell right-header-cell">
              <textarea
                className="inline-prof-input"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                rows="2"
                aria-label="Professeur"
                style={{ fontSize: `${getProfessorFontSize(teacher)}px` }}
              />
            </div>
          </header>

          {renderExerciseList(1, exercises, exerciseHeights, 1)}
        </div>

        {isSecondPageEnabled && (
          <div className={`a4-page exam-page second-page ${isExporting ? 'is-exporting' : ''}`} ref={(element) => { pageRefs.current[1] = element; }}>
            {renderExerciseList(2, secondPageExercises, secondPageHeights, exercises.length + 1)}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
