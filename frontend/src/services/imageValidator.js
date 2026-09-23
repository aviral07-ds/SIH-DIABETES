/**
 * Retinal Fundus Image Validator v2 — Strict
 *
 * Performs deep pixel-level analysis to determine whether an uploaded image
 * is a genuine retinal fundus photograph. Non-fundus images (wallpapers,
 * screenshots, selfies, documents, blur art, etc.) are rejected.
 *
 * === How real fundus images look (the invariants we exploit) ===
 *
 *  1. CIRCULAR DISC: A roughly circular bright retinal region sits inside
 *     a black/very-dark rectangular frame. The four *corners* of the image
 *     are always nearly black.
 *
 *  2. WARM HUE ONLY: The bright region is exclusively in the red/orange
 *     spectrum (R >> G > B). There is virtually *no* significant blue or
 *     cyan or green saturation anywhere in a fundus photo.
 *
 *  3. BIMODAL BRIGHTNESS: The histogram is distinctly bimodal — a large
 *     peak near 0 (the black frame) and a broad mid-range peak (the retina
 *     at ~60-160 brightness). Natural photos/wallpapers have smooth or
 *     uniform distributions instead.
 *
 *  4. LOW COLOUR ENTROPY: Fundus images use a very narrow colour palette
 *     (reds, oranges, dark maroons, yellows for exudates). Screenshots and
 *     wallpapers have wide colour diversity.
 *
 *  5. CORNER DARKNESS: All four corners of a fundus image are essentially
 *     black (brightness < 25). This is almost never true for screenshots,
 *     wallpapers, or natural photos.
 *
 * We score across 7 heuristics on a 128×128 downsampled canvas and require
 * a total score ≥ 65 / 100 to pass.
 */

const SAMPLE_SIZE = 128;

/** Load an image File into an HTMLImageElement */
const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Cannot decode image')); };
    img.src = url;
  });

/** Downsample and return RGBA pixel buffer + natural dimensions */
const samplePixels = async (file) => {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return {
    data: ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  };
};

/**
 * Main validation entry point.
 * Returns { isValid: boolean, score: number (0–100), reasons: string[] }
 */
export const validateFundusImage = async (file) => {
  // ── 0. Pre-checks ───────────────────────────────────────────────
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png',
    'image/tiff', 'image/tif', 'image/bmp',
  ];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { isValid: false, score: 0,
      reasons: [`Unsupported file type: ${file.type}. Upload a JPG, PNG, or TIFF fundus image.`] };
  }

  const sizeKB = file.size / 1024;
  if (sizeKB < 5) {
    return { isValid: false, score: 0,
      reasons: ['File is too small (< 5 KB). Not a valid fundus scan.'] };
  }
  if (sizeKB > 50 * 1024) {
    return { isValid: false, score: 0,
      reasons: ['File is too large (> 50 MB). Upload a standard fundus photograph.'] };
  }

  // ── 1. Sample pixels ────────────────────────────────────────────
  let pixels, naturalWidth, naturalHeight;
  try {
    const sampled = await samplePixels(file);
    pixels = sampled.data;
    naturalWidth = sampled.naturalWidth;
    naturalHeight = sampled.naturalHeight;
  } catch {
    return { isValid: false, score: 0,
      reasons: ['Cannot read image pixels. The file may be corrupted.'] };
  }

  const n = SAMPLE_SIZE;
  const cx = n / 2, cy = n / 2; // image centre
  const maxRadius = n / 2;      // half-width = maximum radius

  // ── 2. Gather per-pixel statistics ──────────────────────────────

  // Corner regions: 16×16 blocks at each corner
  const CORNER_SIZE = 16;
  let cornerBrightTotal = 0, cornerPixels = 0;

  // Radial zones: inner disc (r < 0.45·maxR) vs outer ring (r > 0.7·maxR)
  let innerR = 0, innerG = 0, innerB = 0, innerPx = 0;
  let outerR = 0, outerG = 0, outerB = 0, outerPx = 0;
  let outerDarkCount = 0;

  // Full image accumulators
  let totalR = 0, totalG = 0, totalB = 0;
  let brightnessBins = new Uint32Array(256); // histogram
  let highSatBlueGreenCount = 0; // pixels with strong blue/green saturation
  let totalPixels = n * n;

  // Colour bucket tracking (coarse 4×4×4 = 64-bin colour cube)
  const COLOR_BINS = 4;
  const colorCube = new Uint32Array(COLOR_BINS * COLOR_BINS * COLOR_BINS);

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const idx = (y * n + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      const brightness = Math.round((r + g + b) / 3);

      totalR += r; totalG += g; totalB += b;
      brightnessBins[brightness]++;

      // Colour cube
      const cr = Math.min(Math.floor(r / 64), COLOR_BINS - 1);
      const cg = Math.min(Math.floor(g / 64), COLOR_BINS - 1);
      const cb = Math.min(Math.floor(b / 64), COLOR_BINS - 1);
      colorCube[cr * COLOR_BINS * COLOR_BINS + cg * COLOR_BINS + cb]++;

      // High-saturation blue/green detection
      // A pixel is "blue/green saturated" if B > R+20 or G > R+20 (and bright enough to matter)
      if (brightness > 30 && (b > r + 20 || (g > r + 20 && g > b))) {
        highSatBlueGreenCount++;
      }

      // Corner check
      const isCorner =
        (x < CORNER_SIZE && y < CORNER_SIZE) ||
        (x >= n - CORNER_SIZE && y < CORNER_SIZE) ||
        (x < CORNER_SIZE && y >= n - CORNER_SIZE) ||
        (x >= n - CORNER_SIZE && y >= n - CORNER_SIZE);
      if (isCorner) {
        cornerBrightTotal += brightness;
        cornerPixels++;
      }

      // Radial zones
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normDist = dist / maxRadius;

      if (normDist <= 0.45) {
        innerR += r; innerG += g; innerB += b; innerPx++;
      } else if (normDist >= 0.7) {
        outerR += r; outerG += g; outerB += b; outerPx++;
        if (brightness < 30) outerDarkCount++;
      }
    }
  }

  // ── 3. Derived metrics ──────────────────────────────────────────
  const avgR = totalR / totalPixels;
  const avgG = totalG / totalPixels;
  const avgB = totalB / totalPixels;
  const avgBrightness = (avgR + avgG + avgB) / 3;

  const cornerAvgBright = cornerBrightTotal / cornerPixels;

  const innerAvgR = innerPx > 0 ? innerR / innerPx : 0;
  const innerAvgG = innerPx > 0 ? innerG / innerPx : 0;
  const innerAvgB = innerPx > 0 ? innerB / innerPx : 0;
  const innerAvgBright = (innerAvgR + innerAvgG + innerAvgB) / 3;

  const outerAvgBright = outerPx > 0 ? (outerR + outerG + outerB) / (outerPx * 3) : 0;
  const outerDarkFrac = outerPx > 0 ? outerDarkCount / outerPx : 0;

  const innerOuterRatio = innerAvgBright / Math.max(outerAvgBright, 1);

  const globalRedDom = avgR / Math.max(avgG, 1);
  const globalRedOverBlue = avgR / Math.max(avgB, 1);

  // Inner disc red dominance (more important — the retina itself)
  const innerRedDom = innerAvgR / Math.max(innerAvgG, 1);
  const innerRedOverBlue = innerAvgR / Math.max(innerAvgB, 1);

  const blueGreenFrac = highSatBlueGreenCount / totalPixels;

  // Colour diversity: count occupied bins in the 64-bin colour cube
  let occupiedBins = 0;
  for (let i = 0; i < colorCube.length; i++) {
    if (colorCube[i] > totalPixels * 0.005) occupiedBins++; // bin needs >0.5% to count
  }

  // Bimodality: check if brightness histogram has a dark peak (0–30)
  // and a mid-range spread (50–170) with a valley in between
  let darkPeakMass = 0, midMass = 0, brightMass = 0;
  for (let i = 0; i <= 30; i++) darkPeakMass += brightnessBins[i];
  for (let i = 50; i <= 170; i++) midMass += brightnessBins[i];
  for (let i = 200; i <= 255; i++) brightMass += brightnessBins[i];
  const darkFrac = darkPeakMass / totalPixels;
  const midFrac = midMass / totalPixels;
  const brightFrac = brightMass / totalPixels;

  // Aspect ratio (fundus images are roughly square, rarely ultra-wide)
  const aspectRatio = naturalWidth / Math.max(naturalHeight, 1);

  // ── 4. Score heuristics (total possible = 100) ──────────────────
  let score = 0;
  const reasons = [];

  // H1: CORNER DARKNESS (max 20 pts)
  // All four corners of fundus images are pitch black
  if (cornerAvgBright < 15) {
    score += 20;
  } else if (cornerAvgBright < 30) {
    score += 10;
  } else {
    reasons.push('Image corners are not dark — fundus photos have black corners from the circular aperture.');
  }

  // H2: OUTER RING DARKNESS (max 15 pts)
  // The outer annulus (r > 0.7) should be mostly very dark
  if (outerDarkFrac >= 0.55) {
    score += 15;
  } else if (outerDarkFrac >= 0.35) {
    score += 7;
  } else {
    reasons.push('The outer region of the image is not dark enough — real fundus images have a dark circular frame.');
  }

  // H3: INNER-DISC RED/ORANGE DOMINANCE (max 20 pts)
  // The retinal disc must be strongly red/orange (R >> G >> B)
  if (innerRedDom >= 1.25 && innerRedOverBlue >= 1.6) {
    score += 20;
  } else if (innerRedDom >= 1.1 && innerRedOverBlue >= 1.3) {
    score += 8;
  } else {
    reasons.push('The central region does not show the red/orange colour profile of choroidal vasculature.');
  }

  // H4: INNER-OUTER BRIGHTNESS CONTRAST (max 15 pts)
  // Bright retinal disc vs dark surround
  if (innerOuterRatio >= 3.0) {
    score += 15;
  } else if (innerOuterRatio >= 2.0) {
    score += 7;
  } else {
    reasons.push('No significant bright-centre / dark-surround contrast found (characteristic of fundus circular aperture).');
  }

  // H5: NO BLUE/GREEN SATURATION (max 10 pts)
  // Fundus images have essentially zero blue/green saturated pixels
  if (blueGreenFrac < 0.02) {
    score += 10;
  } else if (blueGreenFrac < 0.08) {
    score += 4;
  } else {
    reasons.push('Image contains significant blue/green tones — not consistent with retinal fundus photography.');
  }

  // H6: BIMODAL HISTOGRAM (max 10 pts)
  // Must have substantial dark mass (>25%) AND mid-range mass (>15%), with little very-bright mass
  if (darkFrac >= 0.25 && midFrac >= 0.15 && brightFrac < 0.10) {
    score += 10;
  } else if (darkFrac >= 0.15 && midFrac >= 0.10) {
    score += 4;
  } else {
    reasons.push('Brightness distribution does not match the dark-frame + mid-tone retina pattern of fundus images.');
  }

  // H7: LOW COLOUR DIVERSITY (max 10 pts)
  // Fundus images occupy very few colour bins (reds/oranges/blacks only)
  // Screenshots and wallpapers spread across many bins
  if (occupiedBins <= 10) {
    score += 10;
  } else if (occupiedBins <= 18) {
    score += 5;
  } else {
    reasons.push('Image has too much colour diversity — fundus photos use only red/orange/black tones.');
  }

  // ── 5. Penalty checks ──────────────────────────────────────────

  // P1: Very bright overall → screenshot/document
  if (avgBrightness > 160) {
    score = Math.max(score - 25, 0);
    reasons.push('Image is very bright overall — likely a screenshot, document, or daylight photograph.');
  }

  // P2: Ultra-wide or ultra-tall aspect ratio → not fundus
  if (aspectRatio > 2.0 || aspectRatio < 0.5) {
    score = Math.max(score - 15, 0);
    reasons.push('Extreme aspect ratio — fundus images are approximately square.');
  }

  // P3: Uniformly dark image (not a fundus, just a dark photo)
  if (avgBrightness < 12) {
    score = Math.max(score - 20, 0);
    reasons.push('Image is almost entirely black — not a valid fundus scan.');
  }

  // P4: Very high bright-pixel fraction → washed out / screenshot
  if (brightFrac > 0.25) {
    score = Math.max(score - 20, 0);
    reasons.push('Too many bright white pixels — this looks like a screenshot or UI image.');
  }

  // ── 6. Decision ────────────────────────────────────────────────
  // Require ≥ 65 to pass (strict)
  const isValid = score >= 65;

  if (!isValid && reasons.length === 0) {
    reasons.push('This image does not match the expected characteristics of a retinal fundus photograph.');
  }

  return { isValid, score, reasons };
};
