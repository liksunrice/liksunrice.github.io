import React, { useState, useRef, useEffect } from 'react';
import './MangaOCR.css';
import { sortDetectionsManga } from './sortDetections';

const env = (import.meta as any).env ?? {};
// Public: base URL of your FastAPI backend
const API_BASE: string = env.VITE_MANGA_OCR_API_BASE ?? 'http://127.0.0.1:8000';

export type OcrBoxTuple = [number, number, number, number];

export class OcrDetection {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  translation: string;

  constructor(
    id: number,
    box: OcrBoxTuple,
    text: string,
    translation: string = ''
  ) {
    this.id = id;
    this.x1 = box[0];
    this.y1 = box[1];
    this.x2 = box[2];
    this.y2 = box[3];
    this.text = text;
    this.translation = translation;
  }

  get width() {
    return this.x2 - this.x1;
  }

  get height() {
    return this.y2 - this.y1;
  }
}

interface PredictResponse {
  detections: { box: OcrBoxTuple; text: string }[];
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MangaOCR: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [displayWidth, setDisplayWidth] = useState<number | null>(null);
  const [displayHeight, setDisplayHeight] = useState<number | null>(null);
  const [detections, setDetections] = useState<OcrDetection[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingTranslationId, setEditingTranslationId] = useState<number | null>(null);
  const [editingTranslationText, setEditingTranslationText] = useState<string>('');

  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  type DrawnBox = { x1: number; y1: number; x2: number; y2: number };
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawnBoxes, setDrawnBoxes] = useState<DrawnBox[]>([]);
  const [drawingBox, setDrawingBox] = useState<DrawnBox | null>(null);
  const [isSendingBoxes, setIsSendingBoxes] = useState(false);

  const processFile = async (file: File) => {
    setError(null);
    setDetections([]);
    setActiveId(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File is too large. Max size is 10MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    fileRef.current = file;
    setDrawnBoxes([]);
    setDrawingBox(null);
    setIsDrawMode(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const json = (await res.json()) as PredictResponse;
      const mapped = (json.detections || []).map(
        (d, idx) => new OcrDetection(idx, d.box, d.text)
      );
      const ordered = sortDetectionsManga(mapped);
      setDetections(ordered);
      if (ordered.length > 0) {
        setActiveId(ordered[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to run OCR. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const img = e.currentTarget;
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
    setDisplayWidth(img.clientWidth);
    setDisplayHeight(img.clientHeight);
  };

  // Keep displayWidth / displayHeight in sync with layout changes
  // (e.g. window resize or browser zoom that causes the image to reflow).
  useEffect(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const updateSize = () => {
      if (!img) return;
      setDisplayWidth(img.clientWidth);
      setDisplayHeight(img.clientHeight);
    };

    updateSize();

    // Prefer ResizeObserver when available
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updateSize());
      ro.observe(img);
      return () => ro.disconnect();
    }

    // Fallback to window resize listener
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const getScale = () => {
    if (
      !naturalWidth ||
      !naturalHeight ||
      !displayWidth ||
      !displayHeight
    ) {
      return { sx: 1, sy: 1 };
    }
    return {
      sx: displayWidth / naturalWidth,
      sy: displayHeight / naturalHeight,
    };
  };

  const { sx, sy } = getScale();

  const handleDeleteDetection = (id: number) => {
    setDetections((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      // Update active highlight if needed
      if (filtered.length === 0) {
        setActiveId(null);
      } else if (id === activeId) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleTranslate = async () => {
    if (detections.length === 0) return;
    setError(null);
    try {
      setIsTranslating(true);
      const texts = detections.map((d) => d.text);
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      });
      if (!res.ok) {
        throw new Error(`Translation failed: ${res.status}`);
      }
      const raw = await res.json();
      const translated: string[] = Array.isArray(raw)
        ? raw
        : (raw?.translations ?? raw?.texts ?? []);
      if (!Array.isArray(translated) || translated.length !== texts.length) {
        throw new Error('Invalid translation response');
      }
      setDetections((prev) =>
        prev.map((d, i) =>
          new OcrDetection(
            d.id,
            [d.x1, d.y1, d.x2, d.y2],
            d.text,
            translated[i] ?? ''
          )
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Translation failed. Please try again.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const runOcrOnDrawnBoxes = async () => {
    if (drawnBoxes.length === 0 || !fileRef.current) return;
    setError(null);
    try {
      setIsSendingBoxes(true);
      const formData = new FormData();
      formData.append('file', fileRef.current);
      formData.append(
        'boxes',
        JSON.stringify(drawnBoxes.map((b) => [b.x1, b.y1, b.x2, b.y2]))
      );
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const json = (await res.json()) as PredictResponse;
      const newDetections = (json.detections || []).map(
        (d, i) =>
          new OcrDetection(
            Math.max(-1, ...detections.map((x) => x.id)) + 1 + i,
            d.box,
            d.text
          )
      );
      const merged = sortDetectionsManga([...detections, ...newDetections]);
      setDetections(merged);
      setDrawnBoxes([]);
      if (newDetections.length > 0) {
        setActiveId(newDetections[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to run OCR on drawn boxes.'
      );
    } finally {
      setIsSendingBoxes(false);
    }
  };

  const getNaturalCoords = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null => {
    const img = imgRef.current;
    if (!img || naturalWidth == null || naturalHeight == null) return null;
    const rect = img.getBoundingClientRect();
    const { sx: scaleX, sy: scaleY } = getScale();
    const x = (clientX - rect.left) / scaleX;
    const y = (clientY - rect.top) / scaleY;
    return {
      x: Math.max(0, Math.min(naturalWidth, x)),
      y: Math.max(0, Math.min(naturalHeight, y)),
    };
  };

  const handleDrawStart = (e: React.MouseEvent) => {
    if (!isDrawMode || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const coords = getNaturalCoords(e.clientX, e.clientY);
    if (!coords) return;
    setDrawingBox({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
  };

  const handleDrawMove = (e: React.MouseEvent) => {
    if (!isDrawMode || !drawingBox) return;
    const coords = getNaturalCoords(e.clientX, e.clientY);
    if (!coords) return;
    setDrawingBox((prev) =>
      prev
        ? {
            ...prev,
            x2: coords.x,
            y2: coords.y,
          }
        : null
    );
  };

  useEffect(() => {
    if (!isDrawMode || !drawingBox) return;
    const onMove = (e: MouseEvent) => {
      const coords = getNaturalCoords(e.clientX, e.clientY);
      if (!coords) return;
      setDrawingBox((prev) =>
        prev ? { ...prev, x2: coords.x, y2: coords.y } : null
      );
    };
    const onUp = () => {
      const box = drawingBox;
      if (box) {
        const minX = Math.min(box.x1, box.x2);
        const maxX = Math.max(box.x1, box.x2);
        const minY = Math.min(box.y1, box.y2);
        const maxY = Math.max(box.y1, box.y2);
        if (maxX - minX > 2 && maxY - minY > 2) {
          setDrawnBoxes((prev) => [
            ...prev,
            { x1: minX, y1: minY, x2: maxX, y2: maxY },
          ]);
        }
      }
      setDrawingBox(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDrawMode, drawingBox]);

  return (
    <div className="mangaocr-page">
<<<<<<< Updated upstream
      <h1 className="mangaocr-title">Manga OCR v0.1.0</h1>
=======
      <h1 className="mangaocr-title">Manga OCR v0.3.0</h1>
>>>>>>> Stashed changes

      <div className="mangaocr-layout">
        <div className="mangaocr-left">
          {imageUrl ? (
            <div className="mangaocr-imageSection">
              <div className="mangaocr-imageToolbar">
                <button
                  type="button"
                  className={
                    'mangaocr-toolbarBtn' +
                    (isDrawMode ? ' mangaocr-toolbarBtn--active' : '')
                  }
                  onClick={() => {
                    setIsDrawMode((v) => !v);
                    if (isDrawMode) {
                      setDrawingBox(null);
                    }
                  }}
                >
                  {isDrawMode ? 'Cancel draw' : 'Add box'}
                </button>
                {drawnBoxes.length > 0 && (
                  <button
                    type="button"
                    className="mangaocr-toolbarBtn mangaocr-toolbarBtn--primary"
                    disabled={isSendingBoxes || !fileRef.current}
                    onClick={runOcrOnDrawnBoxes}
                  >
                    {isSendingBoxes
                      ? 'Running…'
                      : `Run OCR on drawn (${drawnBoxes.length})`}
                  </button>
                )}
              </div>
              <div
                className={
                  'mangaocr-imageWrapper' +
                  (isDrawMode ? ' mangaocr-imageWrapper--drawMode' : '')
                }
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Uploaded page"
                  className="mangaocr-image"
                  draggable={false}
                  onLoad={handleImageLoad}
                />
                {naturalWidth &&
                  naturalHeight &&
                  detections.map((d) => {
                    const left = d.x1 * sx;
                    const top = d.y1 * sy;
                    const width = d.width * sx;
                    const height = d.height * sy;
                    const isActive = d.id === activeId;
                    return (
                      <div
                        key={d.id}
                        className={
                          'mangaocr-box' +
                          (isActive ? ' mangaocr-box--active' : '')
                        }
                        style={{
                          left,
                          top,
                          width,
                          height,
                        }}
                      />
                    );
                  })}
                {naturalWidth &&
                  naturalHeight &&
                  [...drawnBoxes, drawingBox].filter(Boolean).map((box, i) => {
                    const b = box!;
                    const left = Math.min(b.x1, b.x2) * sx;
                    const top = Math.min(b.y1, b.y2) * sy;
                    const width = Math.abs(b.x2 - b.x1) * sx;
                    const height = Math.abs(b.y2 - b.y1) * sy;
                    return (
                      <div
                        key={i}
                        className={
                          'mangaocr-box mangaocr-box--drawn' +
                          (box === drawingBox ? ' mangaocr-box--drawing' : '')
                        }
                        style={{ left, top, width, height }}
                      />
                    );
                  })}
              </div>
            </div>
          ) : (
            <div
              className={
                'mangaocr-dropzone' +
                (isDragActive ? ' mangaocr-dropzone--active' : '')
              }
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void processFile(file);
              }}
            >
              <input
                ref={fileInputRef}
                className="mangaocr-fileInput"
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
              />
              <div className="mangaocr-dropzoneInner">
                <div className="mangaocr-dropzoneTitle">
                  Drag &amp; drop an image here
                </div>
                <div className="mangaocr-dropzoneHint">
                  or click to upload (JPEG, PNG, WEBP — up to 10MB)
                </div>
                {error && <p className="mangaocr-error">{error}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="mangaocr-right">
          <div className="mangaocr-panelHeader">
            <h2>Detected text</h2>
            <div className="mangaocr-panelHeaderActions">
              {isLoading && (
                <span className="mangaocr-spinner" role="status" aria-label="Running" />
              )}
              {detections.length > 0 && !isLoading && (
                <button
                  type="button"
                  className="mangaocr-btnTranslate"
                  disabled={isTranslating}
                  onClick={handleTranslate}
                >
                  {isTranslating ? (
                    <span className="mangaocr-spinner mangaocr-spinner--sm" role="status" aria-label="Translating" />
                  ) : (
                    'Translate'
                  )}
                </button>
              )}
            </div>
          </div>
          {error && detections.length > 0 && (
            <p className="mangaocr-error mangaocr-errorInPanel">{error}</p>
          )}
          {detections.length === 0 && !isLoading && (
            <p className="mangaocr-muted">
              No detections yet. Upload an image to run OCR.
            </p>
          )}
          <ul className="mangaocr-detections">
            {detections.map((d, index) => {
              const isEditing = editingId === d.id;
              const isEditingTranslation = editingTranslationId === d.id;
              const anyEditing = isEditing || isEditingTranslation;
              return (
                <li
                  key={d.id}
                  draggable={!anyEditing && !isTranslating && !isSendingBoxes}
                  className={
                    'mangaocr-detectionItem' +
                    (d.id === activeId ? ' mangaocr-detectionItem--active' : '')
                  }
                  onMouseEnter={() => setActiveId(d.id)}
                  onDragStart={() => {
                    if (anyEditing || isTranslating || isSendingBoxes) return;
                    setDragIndex(index);
                  }}
                  onDragOver={(e) => {
                    if (!anyEditing && !isTranslating && !isSendingBoxes)
                      e.preventDefault();
                  }}
                  onDrop={() => {
                    if (
                      dragIndex === null ||
                      dragIndex === index ||
                      anyEditing ||
                      isTranslating ||
                      isSendingBoxes
                    )
                      return;
                    setDetections((prev) => {
                      const next = [...prev];
                      const [moved] = next.splice(dragIndex, 1);
                      next.splice(index, 0, moved);
                      return next;
                    });
                    setDragIndex(null);
                  }}
                >
                  <div className="mangaocr-detectionHeader">
                    <div className="mangaocr-detectionLabel">
                      Box {index + 1}
                    </div>
                    <div className="mangaocr-detectionHeaderActions">
                      {!isEditing && (
                        <button
                          type="button"
                          className="mangaocr-detectionEdit"
                          title="Edit text"
                          aria-label="Edit text"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(d.id);
                            setEditingText(d.text);
                          }}
                        >
                          <svg
                            className="mangaocr-icon mangaocr-icon-pencil"
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                          >
                            <path
                              d="M12.854.146a.5.5 0 0 0-.708 0L10.5 1.793 14.207 5.5l1.646-1.646a.5.5 0 0 0 0-.708l-3-3ZM9.793 2.5 2 10.293V13.5H5.207L13 5.707 9.793 2.5Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        className="mangaocr-detectionDelete"
                        title="Delete detection"
                        aria-label="Delete detection"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              'Are you sure you want to delete this detection?'
                            )
                          ) {
                            handleDeleteDetection(d.id);
                          }
                        }}
                      >
                        <svg
                          className="mangaocr-icon mangaocr-icon-trash"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            d="M7.5 3 8.25 2h3.5L12.5 3H15v1.5h-10V3h2.5Zm-1 3h7l-.5 8.5a1 1 0 0 1-1 .9h-4a1 1 0 0 1-1-.9L6.5 6Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mangaocr-detectionEditBody">
                      <textarea
                        className="mangaocr-detectionTextarea"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="mangaocr-detectionEditActions">
                        <button
                          type="button"
                          className="mangaocr-btnSecondary"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="mangaocr-btnPrimary"
                          onClick={() => {
                            const text = editingText.trim();
                            setDetections((prev) =>
                              prev.map((det) =>
                                det.id === d.id
                                  ? new OcrDetection(
                                      det.id,
                                      [det.x1, det.y1, det.x2, det.y2],
                                      text,
                                      det.translation
                                    )
                                  : det
                              )
                            );
                            setEditingId(null);
                            setEditingText('');
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mangaocr-detectionContent">
                      <div className="mangaocr-detectionText">{d.text}</div>
                      {isEditingTranslation ? (
                        <div className="mangaocr-detectionEditBody mangaocr-detectionEditBody--translation">
                          <textarea
                            className="mangaocr-detectionTextarea mangaocr-detectionTextarea--sm"
                            value={editingTranslationText}
                            onChange={(e) =>
                              setEditingTranslationText(e.target.value)
                            }
                            placeholder="Translation"
                          />
                          <div className="mangaocr-detectionEditActions">
                            <button
                              type="button"
                              className="mangaocr-btnSecondary"
                              onClick={() => {
                                setEditingTranslationId(null);
                                setEditingTranslationText('');
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="mangaocr-btnPrimary"
                              onClick={() => {
                                setDetections((prev) =>
                                  prev.map((det) =>
                                    det.id === d.id
                                      ? new OcrDetection(
                                          det.id,
                                          [det.x1, det.y1, det.x2, det.y2],
                                          det.text,
                                          editingTranslationText.trim()
                                        )
                                      : det
                                  )
                                );
                                setEditingTranslationId(null);
                                setEditingTranslationText('');
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mangaocr-detectionTranslationRow">
                          {d.translation ? (
                            <div className="mangaocr-detectionTranslation">
                              {d.translation}
                            </div>
                          ) : (
                            <span className="mangaocr-detectionTranslationEmpty">
                              No translation
                            </span>
                          )}
                          <button
                            type="button"
                            className="mangaocr-detectionEdit mangaocr-detectionEditTranslation"
                            title="Edit translation"
                            aria-label="Edit translation"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTranslationId(d.id);
                              setEditingTranslationText(d.translation);
                            }}
                          >
                            <svg
                              className="mangaocr-icon mangaocr-icon-pencil"
                              viewBox="0 0 16 16"
                              aria-hidden="true"
                            >
                              <path
                                d="M12.854.146a.5.5 0 0 0-.708 0L10.5 1.793 14.207 5.5l1.646-1.646a.5.5 0 0 0 0-.708l-3-3ZM9.793 2.5 2 10.293V13.5H5.207L13 5.707 9.793 2.5Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MangaOCR;

