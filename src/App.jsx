import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MAX_IMAGES = 4;
const MIN_IMAGES = 3;

function App() {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [layout, setLayout] = useState('auto');
  const [isExporting, setIsExporting] = useState(false);
  const pageRef = useRef(null);

  const selectedLayout = useMemo(() => {
    if (layout !== 'auto') return layout;
    return images.length === 3 ? 'three' : 'four';
  }, [images.length, layout]);

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith('image/'));

    const nextImages = validFiles.slice(0, MAX_IMAGES).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImages(nextImages);
  };

  const removeImage = (id) => {
    setImages((currentImages) => currentImages.filter((image) => image.id !== id));
  };

  const clearImages = () => {
    setImages([]);
  };

  const exportPdf = async () => {
    if (!pageRef.current || images.length < MIN_IMAGES) return;

    setIsExporting(true);

    try {
      const canvas = await html2canvas(pageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imageData = canvas.toDataURL('image/jpeg', 1);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297);
      pdf.save('page-a4-photos.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = images.length >= MIN_IMAGES && images.length <= MAX_IMAGES;

  return (
    <main className="app-shell">
      <section className="panel">
        <div>
          <p className="eyebrow">A4 Photo Maker</p>
          <h1>Créer une page A4 avec 3 ou 4 photos</h1>
          <p className="intro">
            Importe tes photos, choisis le modèle, puis exporte une page A4 prête à imprimer.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="title">Titre optionnel</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Exemple : Photos de classe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="layout">Modèle</label>
          <select
            id="layout"
            value={layout}
            onChange={(event) => setLayout(event.target.value)}
          >
            <option value="auto">Automatique</option>
            <option value="three">3 photos</option>
            <option value="four">4 photos</option>
          </select>
        </div>

        <div className="upload-box">
          <label htmlFor="images">Importer 3 ou 4 photos</label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
          />
          <p>{images.length}/4 photos sélectionnées</p>
        </div>

        {images.length > 0 && (
          <div className="thumb-list">
            {images.map((image) => (
              <button key={image.id} type="button" onClick={() => removeImage(image.id)}>
                <img src={image.url} alt={image.name} />
                <span>Supprimer</span>
              </button>
            ))}
          </div>
        )}

        <div className="actions">
          <button type="button" className="secondary" onClick={clearImages} disabled={!images.length}>
            Réinitialiser
          </button>
          <button type="button" onClick={exportPdf} disabled={!canExport || isExporting}>
            {isExporting ? 'Export en cours...' : 'Exporter en PDF'}
          </button>
        </div>

        {!canExport && (
          <p className="warning">Ajoute exactement 3 ou 4 photos pour exporter.</p>
        )}
      </section>

      <section className="preview-zone" aria-label="Aperçu A4">
        <div ref={pageRef} className={`a4-page layout-${selectedLayout}`}>
          {title && <h2>{title}</h2>}

          <div className="photo-grid">
            {images.map((image) => (
              <figure key={image.id}>
                <img src={image.url} alt={image.name} />
              </figure>
            ))}

            {Array.from({ length: Math.max(0, MAX_IMAGES - images.length) }).map((_, index) => (
              <figure key={`placeholder-${index}`} className="placeholder">
                <span>Photo</span>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
