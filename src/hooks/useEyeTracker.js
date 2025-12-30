import { useState, useEffect, useRef, useCallback } from 'react';
import { getIrisPosition, smoothGaze, getEAR, resetSmoothing } from '../utils/gazeUtils';

// Import MediaPipe Vision Tasks
let FaceLandmarker, FilesetResolver;

async function loadMediaPipe() {
  if (FaceLandmarker) return { FaceLandmarker, FilesetResolver };
  
  const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs');
  FaceLandmarker = vision.FaceLandmarker;
  FilesetResolver = vision.FilesetResolver;
  
  return { FaceLandmarker, FilesetResolver };
}

export function useEyeTracker() {
  const [isReady, setIsReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [gazePosition, setGazePosition] = useState({ x: 0.5, y: 0.5 });
  const [isBlinkDetected, setIsBlinkDetected] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const blinkTimeoutRef = useRef(null);
  const lastEARRef = useRef(1);

  const initialize = useCallback(async (videoElement, canvasElement) => {
    videoRef.current = videoElement;
    canvasRef.current = canvasElement;
    
    try {
      setError(null);
      
      // Carica MediaPipe Vision Tasks
      const { FaceLandmarker, FilesetResolver } = await loadMediaPipe();
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
      );
      
      const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      
      faceLandmarkerRef.current = faceLandmarker;
      setIsReady(true);
      
    } catch (err) {
      setError('Errore caricamento MediaPipe: ' + err.message);
      console.error('Errore inizializzazione:', err);
    }
  }, []);

  const processFrame = useCallback(() => {
    if (!faceLandmarkerRef.current || !videoRef.current || !isTracking) return;
    
    const video = videoRef.current;
    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }
    
    try {
      const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const lm = results.faceLandmarks[0];
        setLandmarks(lm);
        
        // Calcola posizione sguardo (X invertita per camera selfie specchiata)
        const irisPos = getIrisPosition(lm);
        if (irisPos) {
          const smoothed = smoothGaze(1 - irisPos.x, irisPos.y, 0.5);
          setGazePosition(smoothed);
        }
        
        // Rileva blink
        const ear = getEAR(lm);
        const wasOpen = lastEARRef.current > 0.15;
        const isClosed = ear < 0.12;
        
        if (wasOpen && isClosed) {
          setIsBlinkDetected(true);
          if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
          blinkTimeoutRef.current = setTimeout(() => setIsBlinkDetected(false), 300);
        }
        
        lastEARRef.current = ear;
      }
    } catch (err) {
      console.error('Errore frame:', err);
    }
    
    animationRef.current = requestAnimationFrame(processFrame);
  }, [isTracking]);

  const startTracking = useCallback(async () => {
    if (!faceLandmarkerRef.current || !videoRef.current) {
      setError('Inizializza prima la camera');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      streamRef.current = stream;
      setIsTracking(true);
      resetSmoothing();
      
    } catch (err) {
      setError('Impossibile accedere alla camera: ' + err.message);
      console.error('Errore camera:', err);
    }
  }, []);

  // Avvia processing quando isTracking cambia
  useEffect(() => {
    if (isTracking) {
      animationRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTracking, processFrame]);

  const stopTracking = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isReady,
    isTracking,
    gazePosition,
    isBlinkDetected,
    landmarks,
    error,
    initialize,
    startTracking,
    stopTracking
  };
}
