/**
 * Retinal Fundus Image Validator
 * 
 * Uses canvas pixel analysis to check whether an uploaded image
 * is likely a retinal fundus photograph before sending to the AI models.
 * 
 * Retinal fundus images have distinctive characteristics:
 *   - Predominantly dark/black border (circular fundus within black frame)
 *   - Strong red/orange dominant color channel (the choroid/blood vessels)
 *   - Near-circular bright region in the centre of the image
 *   - Low mean brightness overall (due to large black border area)
 *   - High red-to-blue channel ratio
 * 
 * We use three fast heuristics on a 128×128 downsampled version:
 *   1. Dark border fraction  – outer ring of pixels must be mostly dark
 *   2. Red channel dominance – average R >> average G >> average B
 *   3. Central brightness    – centre region is significantly brighter than border
 */

const SAMPLE_SIZE = 128; // downscale target (fast analysis)
const OUTER_RING_FRACTION = 0.2; // 20% from each edge counts as "border"

/** Load an image File into an HTMLImageElement */
const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Cannot decode image')); };
    img.src = url;
  });

/** Sample the image onto a small canvas and extract RGBA pixel data */
const samplePixels = async (file) => {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data; // Uint8ClampedArray
};

/**
 * Run all heuristics.
 * Returns { isValid: boolean, score: number (0-100), reasons: string[] }
 */
export const validateFundusImage = async (file) => {
  // 1. File type check
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif', 'image/bmp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      score: 0,
      reasons: [`Unsupported file type: ${file.type}. Please upload a JPG, PNG, or TIFF fundus image.`]
    };
  }

  // 2. File size: fundus images are usually > 50 KB and < 50 MB
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB < 0.005) {
    return {
      isValid: false,
      score: 0,
      reasons: ['File is too small (< 5 KB). This does not look like a valid fundus scan.']
    };
  }
  if (sizeMB > 50) {
    return {
      isValid: false,
      score: 0,
      reasons: ['File is too large (> 50 MB). Please upload a standard fundus photograph.']
    };
  }

  // 3. Pixel-level analysis
  let pixels;
  try {
    pixels = await samplePixels(file);
  } catch {
    return { isValid: false, score: 0, reasons: ['Cannot read image pixels. The file may be corrupted.'] };
  }

  const n = SAMPLE_SIZE;
  const outerRing = Math.floor(n * OUTER_RING_FRACTION); // pixels from edge = "border"

  let totalR = 0, totalG = 0, totalB = 0, totalPixels = 0;
  let borderR = 0, borderG = 0, borderB = 0, borderPixels = 0;
  let centerR = 0, centerG = 0, centerB = 0, centerPixels = 0;
  let darkBorderCount = 0;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const idx = (y * n + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      const brightness = (r + g + b) / 3;

      totalR += r; totalG += g; totalB += b; totalPixels++;

      const isBorder = x < outerRing || x >= n - outerRing || y < outerRing || y >= n - outerRing;
      if (isBorder) {
        borderR += r; borderG += g; borderB += b; borderPixels++;
        if (brightness < 40) darkBorderCount++; // very dark pixel
      } else {
        centerR += r; centerG += g; centerB += b; centerPixels++;
      }
    }
  }

  const avgR = totalR / totalPixels;
  const avgG = totalG / totalPixels;
  const avgB = totalB / totalPixels;
  const avgBrightness = (avgR + avgG + avgB) / 3;

  const borderAvgBrightness = borderPixels > 0 ? (borderR + borderG + borderB) / (borderPixels * 3) : 0;
  const centerAvgBrightness = centerPixels > 0 ? (centerR + centerG + centerB) / (centerPixels * 3) : 0;
  const darkBorderFraction = darkBorderCount / borderPixels;
  const redDominance = avgR / Math.max(avgG, 1);
  const redOverBlueDominance = avgR / Math.max(avgB, 1);

  // Score accumulation (0-100)
  let score = 0;
  const reasons = [];

  // Heuristic A: Dark border (fundus has black background frame)
  // Genuine fundus: >40% of border pixels should be very dark
  if (darkBorderFraction >= 0.35) {
    score += 40;
  } else if (darkBorderFraction >= 0.2) {
    score += 20;
  } else {
    reasons.push('The image does not have the characteristic dark circular border of a fundus photograph.');
  }

  // Heuristic B: Red channel dominance (retina is orange/red due to choroidal vasculature)
  // R should dominate G, G should dominate B
  if (redDominance >= 1.15 && redOverBlueDominance >= 1.4) {
    score += 30;
  } else if (redDominance >= 1.05) {
    score += 15;
  } else {
    reasons.push('The image does not show the expected red/orange colour profile of a retinal fundus scan.');
  }

  // Heuristic C: Centre brighter than border (bright fundus disc vs dark surround)
  const centerBorderRatio = centerAvgBrightness / Math.max(borderAvgBrightness, 1);
  if (centerBorderRatio >= 2.5) {
    score += 20;
  } else if (centerBorderRatio >= 1.5) {
    score += 10;
  } else {
    reasons.push('The centre of the image is not significantly brighter than the border, unlike typical fundus photos.');
  }

  // Heuristic D: Overall brightness should be moderate — not too bright (screenshot/white bg) 
  //              and not uniformly dark (plain black image)
  if (avgBrightness >= 20 && avgBrightness <= 180) {
    score += 10;
  } else if (avgBrightness > 180) {
    score = Math.max(score - 20, 0);
    reasons.push('The image appears too bright overall — this looks like a document, screenshot, or natural photograph rather than a fundus scan.');
  } else {
    score = Math.max(score - 10, 0);
    reasons.push('The image appears too dark or uniformly black.');
  }

  // Decision threshold: require score >= 45 to pass
  const isValid = score >= 45;

  if (!isValid && reasons.length === 0) {
    reasons.push('This image does not appear to be a retinal fundus photograph. Please upload a genuine fundus scan.');
  }

  return { isValid, score, reasons };
};
