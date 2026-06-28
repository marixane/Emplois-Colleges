import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_EXERCISES = [
  { id: 'ex1', title: 'Exercice 1', points: 7, image: null, size: 80, zoom: 100, x: 0, y: 0 },
  { id: 'ex2', title: 'Exercice 2', points: 7, image: null, size: 0, zoom: 100, x: 0, y: 0 },
  { id: 'ex3', title: 'Exercice 3', points: 6, image: null, size: 0, zoom: 100, x: 0, y: 0 },
];

const DURATION_OPTIONS = ['30 min', '1 h', '1 h 30', '2 h', '2 h 30', '3 h'];
const DEFAULT_DURATION_INDEX = 3;
const POINT_STEP = 0.25;
const MIN_POINTS = 1;
const MAX_POINTS = 20;
const TOTAL_EXERCISE_HEIGHT = 986;
const MIN_EXERCISE_HEIGHT = 120;

const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);

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

function App() {
  const [studentLevel, setStudentLevel] = useState('2 Bac SPF');
  const [durationIndex, setDurationIndex] = useState(DEFAULT_DURATION_INDEX);
  const [testTitle, setTestTitle] = useState('Devoir individuel de Mathématique');
  const [teacher, setTeacher] = useState('Prof : Marwane.R');
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [exerciseHeights, setExerciseHeights] = useState([430, 278, 278]);
  const [isExporting, setIsExporting] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const pageRef = useRef(null);
  const fileInputRefs = useRef({});

  const duration = DURATION_OPTIONS[durationIndex];
  const totalPoints = exercises.reduce((sum, exercise) => sum + exercise.points, 0);

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
    return index < exercises.length - 1 ? index + 1 : index - 1;
  };

  const canChangeExercisePoints = (index, step) => {
    const compensationIndex = getCompensationIndex(index);
    if (compensationIndex < 0) return false;

    const nextTargetPoints = Math.round((exercises[index].points + step * POINT_STEP) * 100) / 100;
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

  const updateHeightByPercent = (index, value) => {
    const targetHeight = Math.round((clamp(value, 12, 76) / 100) * TOTAL_EXERCISE_HEIGHT);
    const compensationIndex = getCompensationIndex(index);
    const delta = targetHeight - exerciseHeights[index];
    const upperIndex = index < compensationIndex ? index : compensationIndex;
    const lowerIndex = index < compensationIndex ? compensationIndex : index;
    const signedDelta = index === upperIndex ? delta : -delta;

    setExerciseHeights(applyHeightDelta(upperIndex, lowerIndex, signedDelta, exerciseHeights));
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
      id: exercise.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: exercise.x,
      startY: exercise.y,
    });
  };

  const moveDrag = (event) => {
    if (!dragState) return;

    const deltaX = event.clientX - dragState.startClientX;
    const deltaY = event.clientY - dragState.startClientY;

    updateImagePosition(dragState.id, dragState.startX + deltaX, dragState.startY + deltaY);
  };

  const endDrag = () => {
    setDragState(null);
  };

  const resetPhotoPosition = (id) => {
    setExercises((items) =>
      items.map((item) => (item.id === id ? { ...item, zoom: 100, x: 0, y: 0 } : item))
    );
  };

  const getHeightPercentage = (height) => Math.round((height / TOTAL_EXERCISE_HEIGHT) * 100);

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
            }
          : item
      )
    );
  };

  const clearExerciseImage = (id) => {
    updateExercise(id, 'image', null);
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
          Classe, durée, titre et professeur se modifient directement dans l’entête de l’épreuve.
        </p>

        <hr />

        <p className="points-total">Total : {formatPoints(totalPoints)}</p>

        {exercises.map((exercise, index) => (
          <fieldset className="exercise-control-card" key={exercise.id}>
            <legend>{exercise.title} :</legend>

            <div className="form-group compact-group">
              <label>Hauteur</label>
              <input
                type="range"
                min="12"
                max="76"
                value={getHeightPercentage(exerciseHeights[index])}
                onChange={(e) => updateHeightByPercent(index, e.target.value)}
              />
              <small>Hauteur actuelle : {getHeightPercentage(exerciseHeights[index])} %</small>
            </div>

            <input
              ref={(input) => {
                fileInputRefs.current[exercise.id] = input;
              }}
              className="hidden-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleExerciseImage(exercise.id, e.target.files?.[0])}
            />

            {exercise.image && (
              <div className="photo-controls">
                <label>Déplacement horizontal</label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={exercise.x}
                  onChange={(e) => updatePhotoControl(exercise.id, 'x', e.target.value)}
                />
                <small>{exercise.x}px</small>

                <label>Déplacement vertical</label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={exercise.y}
                  onChange={(e) => updatePhotoControl(exercise.id, 'y', e.target.value)}
                />
                <small>{exercise.y}px</small>

                <button type="button" className="secondary" onClick={() => resetPhotoPosition(exercise.id)}>
                  Réinitialiser position
                </button>
              </div>
            )}
          </fieldset>
        ))}

        <button type="button" onClick={exportPdf} disabled={isExporting}>
          {isExporting ? 'Export en cours...' : 'Exporter PDF A4'}
        </button>
      </section>

      <section className="preview-zone">
        <div className="a4-page exam-page" ref={pageRef}>
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

          <p className="phone-rule">
            L'usage du téléphone portable est interdit, même comme calculatrice.
          </p>

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
                  onClick={() => triggerExerciseFileInput(exercise.id)}
                  title="Cliquer pour choisir ou remplacer la photo"
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
                  ) : (
                    <div className="empty-zone">Clique ici pour choisir la photo</div>
                  )}
                </div>
                {index === 1 && <span className="side-mark top">1P</span>}
                {index === 1 && <span className="side-mark middle">1P</span>}
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
