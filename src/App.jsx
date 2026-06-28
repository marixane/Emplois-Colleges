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
  const [isExporting, setIsExporting] = useState(false);
  const [dragState, setDragState] = useState(null);
  const pageRef = useRef(null);

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

  const updateSize = (id, value, index) => {
    const max = index === 0 ? 220 : 120;
    updateExercise(id, 'size', clamp(value, 0, max));
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

  const getExerciseHeights = () => {
    const totalHeight = 986;
    const minSmallHeight = 150;
    const firstHeight = 350 + exercises[0].size;
    const remaining = totalHeight - firstHeight;
    const balance = exercises[1].size - exercises[2].size;
    const secondHeight = clamp(Math.round(remaining / 2 + balance), minSmallHeight, remaining - minSmallHeight);
    const thirdHeight = remaining - secondHeight;

    return [firstHeight, secondHeight, thirdHeight];
  };

  const exerciseHeights = getExerciseHeights();

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
    <main className="app-shell" onMouseMove={moveDrag} onMouseUp={endDrag} onMouseLeave={endDrag}>
      <section className="panel">
        <p className="eyebrow">A4 Exam Maker</p>
        <h1>Créer une feuille A4 avec entête fixe</h1>
        <p className="intro">
          Les noms des exercices sont fixes. La somme des points reste exactement 20.
        </p>

        <div className="form-group">
          <label>Classe</label>
          <input value={studentLevel} onChange={(e) => setStudentLevel(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Durée</label>
          <div className="duration-control">
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

        <div className="form-group">
          <label>Titre du devoir</label>
          <textarea
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            rows="2"
            placeholder="Exemple : Devoir individuel de Mathématique"
          />
        </div>

        <div className="form-group">
          <label>Professeur</label>
          <textarea
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            rows="2"
            placeholder="Exemple : Prof : Marwane.R"
          />
        </div>

        <hr />

        <p className="points-total">Total : {formatPoints(totalPoints)}</p>

        {exercises.map((exercise, index) => (
          <div className="exercise-control" key={exercise.id}>
            <div className="two-cols">
              <div>
                <label>Nom exercice</label>
                <div className="exercise-name-display">{exercise.title}</div>
              </div>
              <div>
                <label>Points</label>
                <div className="points-control">
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
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Hauteur de {exercise.title}</label>
              <input
                type="range"
                min="0"
                max={index === 0 ? '220' : '120'}
                value={exercise.size}
                onChange={(e) => updateSize(exercise.id, e.target.value, index)}
              />
              <small>Hauteur actuelle : {exerciseHeights[index]} px</small>
            </div>

            <label>Photo pour {exercise.title}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleExerciseImage(exercise.id, e.target.files?.[0])}
            />

            {exercise.image && (
              <div className="photo-controls">
                <label>Zoom photo</label>
                <input
                  type="range"
                  min="60"
                  max="220"
                  value={exercise.zoom}
                  onChange={(e) => updatePhotoControl(exercise.id, 'zoom', e.target.value)}
                />
                <small>{exercise.zoom}%</small>

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

                <div className="two-cols">
                  <button type="button" className="secondary" onClick={() => resetPhotoPosition(exercise.id)}>
                    Réinitialiser position
                  </button>
                  <button type="button" className="secondary" onClick={() => clearExerciseImage(exercise.id)}>
                    Supprimer photo
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={exportPdf} disabled={isExporting}>
          {isExporting ? 'Export en cours...' : 'Exporter PDF A4'}
        </button>
      </section>

      <section className="preview-zone">
        <div className="a4-page exam-page" ref={pageRef}>
          <header className="exam-header three-cell-header">
            <div className="header-cell left-header-cell">
              <strong>Classe : {studentLevel}</strong>
              <strong>Durée : {duration}</strong>
            </div>

            <div className="header-cell middle-header-cell">
              <strong style={{ fontSize: `${getTitleFontSize(testTitle)}px` }}>{testTitle}</strong>
            </div>

            <div className="header-cell right-header-cell">
              <strong style={{ fontSize: `${getProfessorFontSize(teacher)}px` }}>{teacher}</strong>
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
                <div className="exercise-title">
                  {exercise.title} : * ( {formatPoints(exercise.points)} ) *
                </div>
                <div className="exercise-body">
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
                    <div className="empty-zone">Photo de {exercise.title}</div>
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
