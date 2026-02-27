import type { OcrDetection } from './MangaOCR';

// Sort detections into approximate manga reading order using rows:
// 1) Primary: top → bottom (based on y1)
// 2) Secondary (same row-ish): right → left (based on x2)
export const sortDetectionsManga = (items: OcrDetection[]): OcrDetection[] => {
  if (!items || items.length === 0) return items;

  const withTR = items.map((d) => ({
    d,
    top: d.y1,
    right: d.x2,
    height: d.y2 - d.y1,
  }));

  // Estimate vertical tolerance for "same row" from median height
  const heights = withTR.map((b) => b.height);
  heights.sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 1;
  const rowThreshold = medianHeight * 0.5;

  withTR.sort((a, b) => {
    const dy = a.top - b.top;
    if (Math.abs(dy) > rowThreshold) {
      // clearly above / below
      return dy;
    }
    // same row-ish: right → left
    return b.right - a.right;
  });

  return withTR.map((b) => b.d);
};


