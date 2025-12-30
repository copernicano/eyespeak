// Punti chiave MediaPipe Face Landmarker
export const LANDMARKS = {
  // Centro iride (Face Landmarker model)
  LEFT_IRIS: 468,
  RIGHT_IRIS: 473,
  
  // Bordi occhio sinistro
  LEFT_EYE_INNER: 133,
  LEFT_EYE_OUTER: 33,
  
  // Bordi occhio destro
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  
  // Palpebre (per blink detection)
  LEFT_UPPER: 159,
  LEFT_LOWER: 145,
  RIGHT_UPPER: 386,
  RIGHT_LOWER: 374
};

// Smoothing per ridurre rumore
let smoothedX = 0.5;
let smoothedY = 0.5;

export function smoothGaze(rawX, rawY, alpha = 0.3) {
  smoothedX = alpha * rawX + (1 - alpha) * smoothedX;
  smoothedY = alpha * rawY + (1 - alpha) * smoothedY;
  return { x: smoothedX, y: smoothedY };
}

export function resetSmoothing() {
  smoothedX = 0.5;
  smoothedY = 0.5;
}

// Helper per accedere ai landmarks in modo sicuro
function getLandmark(landmarks, index) {
  if (!landmarks || !landmarks[index]) return null;
  return landmarks[index];
}

// Calcola posizione relativa dell'iride nell'occhio (0-1)
export function getIrisPosition(landmarks) {
  if (!landmarks || landmarks.length < 400) return null;
  
  // Occhio sinistro - usa punti eye corners come fallback se iris non disponibile
  const leftIris = getLandmark(landmarks, LANDMARKS.LEFT_IRIS) || getLandmark(landmarks, 473);
  const leftInner = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
  const leftOuter = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  
  if (!leftIris || !leftInner || !leftOuter) {
    // Fallback: usa centro occhio
    return { x: 0.5, y: 0.5 };
  }
  
  // Occhio destro
  const rightIris = getLandmark(landmarks, LANDMARKS.RIGHT_IRIS) || getLandmark(landmarks, 468);
  const rightInner = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_INNER);
  const rightOuter = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);
  
  // Calcola posizione X relativa
  const leftEyeWidth = Math.abs(leftInner.x - leftOuter.x) || 0.1;
  const rightEyeWidth = Math.abs(rightInner.x - rightOuter.x) || 0.1;
  
  const leftIrisX = (leftIris.x - leftOuter.x) / leftEyeWidth;
  const rightIrisX = rightIris && rightOuter ? (rightIris.x - rightOuter.x) / rightEyeWidth : leftIrisX;
  
  const avgX = (leftIrisX + rightIrisX) / 2;
  
  // Calcola posizione Y
  const leftUpper = getLandmark(landmarks, LANDMARKS.LEFT_UPPER);
  const leftLower = getLandmark(landmarks, LANDMARKS.LEFT_LOWER);
  
  if (!leftUpper || !leftLower) {
    return { x: avgX, y: 0.5 };
  }
  
  const leftEyeHeight = Math.abs(leftLower.y - leftUpper.y) || 0.05;
  const leftIrisY = (leftIris.y - leftUpper.y) / leftEyeHeight;
  
  const rightUpper = getLandmark(landmarks, LANDMARKS.RIGHT_UPPER);
  const rightLower = getLandmark(landmarks, LANDMARKS.RIGHT_LOWER);
  const rightEyeHeight = rightUpper && rightLower ? Math.abs(rightLower.y - rightUpper.y) || 0.05 : leftEyeHeight;
  const rightIrisY = rightIris && rightUpper ? (rightIris.y - rightUpper.y) / rightEyeHeight : leftIrisY;
  
  const avgY = (leftIrisY + rightIrisY) / 2;
  
  // Clamp values
  return { 
    x: Math.max(0, Math.min(1, avgX)), 
    y: Math.max(0, Math.min(1, avgY)) 
  };
}

// Determina quale zona (0-3 per 4 zone)
export function getZoneFromGaze(gazeX, gazeY, numZones = 4) {
  const x = Math.max(0, Math.min(1, gazeX));
  const y = Math.max(0, Math.min(1, gazeY));
  
  if (numZones === 4) {
    const col = x < 0.5 ? 0 : 1;
    const row = y < 0.5 ? 0 : 1;
    return row * 2 + col;
  } else if (numZones === 6) {
    const col = x < 0.5 ? 0 : 1;
    const row = y < 0.33 ? 0 : y < 0.66 ? 1 : 2;
    return row * 2 + col;
  } else if (numZones === 9) {
    const col = x < 0.33 ? 0 : x < 0.66 ? 1 : 2;
    const row = y < 0.33 ? 0 : y < 0.66 ? 1 : 2;
    return row * 3 + col;
  }
  
  return 0;
}

// Calcola EAR (Eye Aspect Ratio) per blink detection
export function getEAR(landmarks) {
  if (!landmarks || landmarks.length < 400) return 1;
  
  const leftUpper = getLandmark(landmarks, LANDMARKS.LEFT_UPPER);
  const leftLower = getLandmark(landmarks, LANDMARKS.LEFT_LOWER);
  const leftInner = getLandmark(landmarks, LANDMARKS.LEFT_EYE_INNER);
  const leftOuter = getLandmark(landmarks, LANDMARKS.LEFT_EYE_OUTER);
  
  if (!leftUpper || !leftLower || !leftInner || !leftOuter) return 1;
  
  const leftVertical = Math.abs(leftUpper.y - leftLower.y);
  const leftHorizontal = Math.abs(leftInner.x - leftOuter.x) || 0.1;
  const leftEAR = leftVertical / leftHorizontal;
  
  const rightUpper = getLandmark(landmarks, LANDMARKS.RIGHT_UPPER);
  const rightLower = getLandmark(landmarks, LANDMARKS.RIGHT_LOWER);
  const rightInner = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_INNER);
  const rightOuter = getLandmark(landmarks, LANDMARKS.RIGHT_EYE_OUTER);
  
  if (!rightUpper || !rightLower || !rightInner || !rightOuter) return leftEAR;
  
  const rightVertical = Math.abs(rightUpper.y - rightLower.y);
  const rightHorizontal = Math.abs(rightInner.x - rightOuter.x) || 0.1;
  const rightEAR = rightVertical / rightHorizontal;
  
  return (leftEAR + rightEAR) / 2;
}

// Rileva blink
export function isBlinking(landmarks, threshold = 0.02) {
  return getEAR(landmarks) < threshold;
}
