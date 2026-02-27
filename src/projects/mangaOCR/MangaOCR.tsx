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

  constructor(id: number, box: OcrBoxTuple, text: string) {
    this.id = id;
    this.x1 = box[0];
    this.y1 = box[1];
    this.x2 = box[2];
    this.y2 = box[3];
    this.text = text;
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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

  return (
    <div className="mangaocr-page">
      <h1 className="mangaocr-title">Manga OCR v0.1.0</h1>

      <div className="mangaocr-layout">
        <div className="mangaocr-left">
          {imageUrl ? (
            <div className="mangaocr-imageWrapper">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Uploaded page"
                className="mangaocr-image"
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
            {isLoading && <span className="mangaocr-spinner" role="status" aria-label="Running" />}
          </div>
          {detections.length === 0 && !isLoading && (
            <p className="mangaocr-muted">
              No detections yet. Upload an image to run OCR.
            </p>
          )}
          <ul className="mangaocr-detections">
            {detections.map((d, index) => {
              const isEditing = editingId === d.id;
              return (
                <li
                  key={d.id}
                  draggable={!isEditing}
                  className={
                    'mangaocr-detectionItem' +
                    (d.id === activeId ? ' mangaocr-detectionItem--active' : '')
                  }
                  onMouseEnter={() => setActiveId(d.id)}
                  onDragStart={() => {
                    if (isEditing) return;
                    setDragIndex(index);
                  }}
                  onDragOver={(e) => {
                    if (!isEditing) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index || isEditing)
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
                                      text
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
                    <div className="mangaocr-detectionText">{d.text}</div>
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

