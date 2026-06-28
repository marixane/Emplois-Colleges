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
const MIN_EXERCISE_HEIGHT = 120;
const MIN_EXERCISES = 1;
const MAX_EXERCISES = 6;

const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);

const roundToStep = (value) => Math.round(Number(value) / POINT_STEP) * POINT_STEP;

const formatPoints = (value) => {
  const rounded = Math.round(Number(value) * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace('.', ',');

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
  id: `ex${index + 1}-${Date.now()}`,
  title: `Exercice ${index + 1}`,
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

const createHeights = (count) => {
  const base = Math.floor(TOTAL_EXERCISE_HEIGHT / count);
  const heights = Array.from({ length: count }, () => base);
  heights[count - 1] = TOTAL_EXERCISE_HEIGHT - base * (count - 1);
  return heights;
};

function App() {
  const [studentLevel, setStudentLevel] = useState('2 Bac SPF');
  const [durationIndex, setDurationIndex] = useState(DEFAULT_DURATION_INDEX);
  const [testTitle, setTestTitle] = useState('Devoir individuel de Mathématique');
  const [teacher, setTeacher] = useState('Prof : Marwane.R');
  const [exercises, setExercises] = useState(() => createExercises(3));
  const [isTotalLocked, setIsTotalLocked] = useState(true);
  const [exerciseHeights, setExerciseHeights] = useState(() => [430, 278, 278]);
  const [isExporting, setIsExporting] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const pageRef = useRef(null);
  const fileInputRefs = useRef({});

  const duration = DURATION_OPTIONS[durationIndex];
  const totalPoints = Math.round(exercises.reduce((sum, exercise) => sum + exercise.points, 0) * 100) / 100;

  const changeDuration = (step) => {
    setDurationIndex((currentIndex) =>
      clamp(currentIndex + step, 0, DURATION_OPTIONS.length - 1)
    );
  };

  const updateExercise = (id, field, value) => {
    setExercises((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const getCompensationIndex = (index) => {
    if (exercises.length < 2) return -1;
    return index < exercises.length - 1 ? index + 1 : index - 1;
  };

  const canChangeExercisePoints = (index, step) => {
    const nextTargetPoints = Math.round((exercises[index].points + step * POINT_STEP) * 100) / 100;

    if (!isTotalLocked) {
      return nextTargetPoints >= MIN_POINTS && nextTargetPoints <= MAX_POINTS;
    }

    const compensationIndex = getCompensationIndex(index);
    if (compensationIndex < 0) return false;

    const nextCompensationPoints = Math.round((exercises[compensationIndex].points - step * POINT_STEP) * 100) / 100;

    return (
      nextTargetPoints >= MIN_POINTS &&
      nextTargetPoints <= MAX_POINTS &&
      nextCompensationPoints >= MIN_POINTS &&
      nextCompensationPoints <= MAX_POINTS
    );
  };

  const changeExercisePoints = (index, step) => {
    if (!canChangeExercisePoints(index, step)) return;

    if (!isTotalLocked) {
      setExercises((items) =>
        items.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                points: Math.round((item.points + step * POINT_STEP) * 100) / 100,
              }
            : item
        )
      );
      return;
    }

    const compensationIndex = getCompensationIndex(index);

    setExercises((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex === index) {
          return {
            ...item,
            points: Math.round((item.points + step * POINT_STEP) * 100) / 100,
          };
        }

        if (itemIndex === compensationIndex) {
          return {
            ...item,
            points: Math.round((item.points - step * POINT_STEP) * 100) / 100,
          };
        }

        return item;
      })
    );
  };

  const changeTotalLock = (checked) => {
    setIsTotalLocked(checked);

    if (!checked) return;

    setExercises((items) => {
      const balanced = getBalancedPoints(items.length);
      return items.map((item, index) => ({ ...item, points: balanced[index] }));
    });
  };

  const changeExerciseCount = (step) => {
    const nextCount = clamp(exercises.length + step, MIN_EXERCISES, MAX_EXERCISES);
    if (nextCount === exercises.length) return;

    setExercises((items) => {
      const balanced = getBalancedPoints(nextCount);
      return Array.from({ length: nextCount }, (_, index) => {
        const existing = items[index];
        const nextPoints = isTotalLocked ? balanced[index] : existing?.points ?? 5;

        return existing
          ? { ...existing, title: `Exercice ${index + 1}`, points: nextPoints, masks: existing.masks ?? [] }
          : createExercise(index, nextPoints);
      });
    });

    setExerciseHeights((heights) => {
      if (nextCount > heights.length) {
        return createHeights(nextCount);
      }

      const kept = heights.slice(0, nextCount);
      const sum = kept.reduce((total, height) => total + height, 0);
      const factor = TOTAL_EXERCISE_HEIGHT / sum;
      const resized = kept.map((height) => Math.max(MIN_EXERCISE_HEIGHT, Math.round(height * factor)));
      const diff = TOTAL_EXERCISE_HEIGHT - resized.reduce((total, height) => total + height, 0);
      resized[resized.length - 1] += diff;
      return resized;
    });
  };

  const updateImagePosition = (id, nextX, nextY) => {
    setExercises((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              x: clamp(nextX, -200, 200),
              y: clamp(nextY, -200, 200),
            }
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

  const startResize = (event, lowerExerciseIndex) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState(null);

    setResizeState({
      upperIndex: lowerExerciseIndex - 1,
      lowerIndex: lowerExerciseIndex,
      startClientY: event.clientY,
      startHeights: exerciseHeights,
    });
  };

  const moveResize = (event) => {
    if (!resizeState) return;

    const deltaY = event.clientY - resizeState.startClientY;
    setExerciseHeights(
      applyHeightDelta(
        resizeState.upperIndex,
        resizeState.lowerIndex,
        deltaY,
        resizeState.startHeights
      )
    );
  };

  const endResize = () => {
    setResizeState(null);
  };

  const updatePhotoControl = (id, field, value) => {
    const limits = {
      zoom: [60, 220],
      x: [-200, 200],
      y: [-200, 200],
    };

    updateExercise(id, field, clamp(value, limits[field][0], limits[field][1]));
  };

  const startDrag = (event, exercise) => {
    event.preventDefault();
    setResizeState(null);

    setDragState({
      type: 'photo',
      id: exercise.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: exercise.x,
      startY: exercise.y,
    });
  };

  const addMask = (exerciseId) => {
    setExercises((items) =>
      items.map((item) => {
        if (item.id !== exerciseId) return item;

        const nextMask = {
          id: `mask-${Date.now()}`,
          x: 120,
          y: 90,
          width: 160,
          height: 60,
        };

        return { ...item, masks: [...(item.masks ?? []), nextMask] };
      })
    );
  };

  const deleteMask = (exerciseId, maskId) => {
    setExercises((items) =>
      items.map((item) =>
        item.id === exerciseId
          ? { ...item, masks: (item.masks ?? []).filter((mask) => mask.id !== maskId) }
          : item
      )
    );
  };

  const updateMask = (exerciseId, maskId, updates) => {
    setExercises((items) =>
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

  const startMaskDrag = (event, exerciseId, mask) => {
    event.preventDefault();
    event.stopPropagation();
    setResizeState(null);
    setDragState({
      type: 'mask-move',
      exerciseId,
      maskId: mask.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: mask.x,
      startY: mask.y,
    });
  };

  const startMaskResize = (event, exerciseId, mask) => {
    event.preventDefault();
    event.stopPropagation();
    setResizeState(null);
    setDragState({
      type: 'mask-resize',
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
      updateImagePosition(dragState.id, dragState.startX + deltaX, dragState.startY + deltaY);
      return;
    }

    if (dragState.type === 'mask-move') {
      updateMask(dragState.exerciseId, dragState.maskId, {
        x: dragState.startX + deltaX,
        y: dragState.startY + deltaY,
      });
      return;
    }

    if (dragState.type === 'mask-resize') {
      updateMask(dragState.exerciseId, dragState.maskId, {
        width: dragState.startWidth + deltaX,
        height: dragState.startHeight + deltaY,
      });
    }
  };

  const endDrag = () => {
    setDragState(null);
  };

  const triggerExerciseFileInput = (id) => {
    if (isExporting) return;
    fileInputRefs.current[id]?.click();
  };

  const handleExerciseImage = (id, file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setExercises((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              image: {
                name: file.name,
                url: URL.createObjectURL(file),
              },
              zoom: 100,
              x: 0,
              y: 0,
              masks: [],
            }
          : item
      )
    );
  };

  const clearExerciseImage = (id) => {
    setExercises((items) =>
      items.map((item) =>
        item.id === id ? { ...item, image: null, masks: [] } : item
      )
    );
  };

  const exportPdf = async () => {
    if (!pageRef.current) return;

    setIsExporting(true);

    try {
      const canvas = await html2canvas(pageRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imageData = canvas.toDataURL('image/jpeg', 1);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297);
      pdf.save('devoir-a4.pdf');
    } finally {
      setIsExporting(false);
    }
  };

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
        <p className="intro">
          Choisis le nombre d’exercices, entre 1 et 6. Les contrôles de chaque exercice sont directement dans la page.
        </p>

        <label className="total-lock-control">
          <input
            type="checkbox"
            checked={isTotalLocked}
            onChange={(e) => changeTotalLock(e.target.checked)}
          />
          Total bloqué à 20 points
        </label>

        <p className={`points-total ${isTotalLocked ? 'locked' : 'free'}`}>
          {isTotalLocked ? 'Total bloqué : ' : 'Total libre : '}
          {formatPoints(totalPoints)}
        </p>

        <div className="form-group">
          <label>Nombre d’exercices</label>
          <div className="duration-control compact-control">
            <button
              type="button"
              onClick={() => changeExerciseCount(-1)}
              disabled={exercises.length === MIN_EXERCISES}
              aria-label="Diminuer le nombre d’exercices"
            >
              −
            </button>
            <strong>{exercises.length}</strong>
            <button
              type="button"
              onClick={() => changeExerciseCount(1)}
              disabled={exercises.length === MAX_EXERCISES}
              aria-label="Augmenter le nombre d’exercices"
            >
              +
            </button>
          </div>
          <small>Minimum 1, maximum 6 exercices.</small>
        </div>

        {exercises.map((exercise) => (
          <input
            key={exercise.id}
            ref={(input) => {
              fileInputRefs.current[exercise.id] = input;
            }}
            className="hidden-file-input"
            type="file"
            accept="image/*"
            onChange={(e) => handleExerciseImage(exercise.id, e.target.files?.[0])}
          />
        ))}

        <button type="button" onClick={exportPdf} disabled={isExporting}>
          {isExporting ? 'Export en cours...' : 'Exporter PDF A4'}
        </button>
      </section>

      <section className="preview-zone">
        <div className={`a4-page exam-page ${isExporting ? 'is-exporting' : ''}`} ref={pageRef}>
          <header className="exam-header three-cell-header">
            <div className="header-cell left-header-cell class-duration-header">
              <textarea
                className="inline-class-input"
                value={studentLevel}
                onChange={(e) => setStudentLevel(e.target.value)}
                rows="1"
                aria-label="Classe"
              />
              <div className="tiny-duration-control">
                <button
                  type="button"
                  onClick={() => changeDuration(-1)}
                  disabled={durationIndex === 0}
                  aria-label="Diminuer la durée"
                >
                  −
                </button>
                <strong>{duration}</strong>
                <button
                  type="button"
                  onClick={() => changeDuration(1)}
                  disabled={durationIndex === DURATION_OPTIONS.length - 1}
                  aria-label="Augmenter la durée"
                >
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

          <div className="exercise-list">
            {exercises.map((exercise, index) => (
              <section
                className={`exam-exercise ex-${index + 1}`}
                key={exercise.id}
                style={{ height: `${exerciseHeights[index]}px` }}
              >
                {index > 0 && (
                  <button
                    type="button"
                    className="resize-handle"
                    onMouseDown={(event) => startResize(event, index)}
                    aria-label={`Modifier la hauteur de ${exercise.title}`}
                  />
                )}
                <div className="exercise-title exercise-title-controls">
                  <span>{exercise.title} : * (</span>
                  <button
                    type="button"
                    onClick={() => changeExercisePoints(index, -1)}
                    disabled={!canChangeExercisePoints(index, -1)}
                    aria-label={`Diminuer les points de ${exercise.title}`}
                  >
                    −
                  </button>
                  <strong>{formatPoints(exercise.points)}</strong>
                  <button
                    type="button"
                    onClick={() => changeExercisePoints(index, 1)}
                    disabled={!canChangeExercisePoints(index, 1)}
                    aria-label={`Augmenter les points de ${exercise.title}`}
                  >
                    +
                  </button>
                  <span>) *</span>
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
                      <button
                        type="button"
                        className="photo-tool-button"
                        onClick={() => triggerExerciseFileInput(exercise.id)}
                      >
                        Changer photo
                      </button>
                      <button
                        type="button"
                        className="photo-tool-button"
                        onClick={() => addMask(exercise.id)}
                      >
                        Rectangle blanc
                      </button>
                      <button
                        type="button"
                        className="photo-tool-button danger"
                        onClick={() => clearExerciseImage(exercise.id)}
                      >
                        Supprimer
                      </button>
                      <label className="photo-zoom-control">
                        Zoom
                        <input
                          type="range"
                          min="60"
                          max="220"
                          value={exercise.zoom}
                          onChange={(e) => updatePhotoControl(exercise.id, 'zoom', e.target.value)}
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
                        onMouseDown={(event) => startDrag(event, exercise)}
                        draggable="false"
                        style={{
                          transform: `translate(${exercise.x}px, ${exercise.y}px) scale(${exercise.zoom / 100})`,
                        }}
                      />
                      {(exercise.masks ?? []).map((mask) => (
                        <div
                          className="white-mask"
                          key={mask.id}
                          onMouseDown={(event) => startMaskDrag(event, exercise.id, mask)}
                          style={{
                            left: `${mask.x}px`,
                            top: `${mask.y}px`,
                            width: `${mask.width}px`,
                            height: `${mask.height}px`,
                          }}
                        >
                          <button
                            type="button"
                            className="mask-delete-button"
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteMask(exercise.id, mask.id);
                            }}
                          >
                            ×
                          </button>
                          <span
                            className="mask-resize-handle"
                            onMouseDown={(event) => startMaskResize(event, exercise.id, mask)}
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="empty-zone">Clique ici pour choisir la photo</div>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="page-number">Page 1</div>
        </div>
      </section>
    </main>
  );
}

export default App;
