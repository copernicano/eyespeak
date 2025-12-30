import { useEffect, useRef } from "react";

export function Camera({ onInit, landmarks, isTracking }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && canvasRef.current && onInit) {
      onInit(videoRef.current, canvasRef.current);
    }
  }, [onInit]);

  useEffect(() => {
    if (!landmarks || !canvasRef.current || !isTracking) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Punti iride con glow
    const irisPoints = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477];
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#22c55e";
    irisPoints.forEach(idx => {
      if (landmarks[idx]) {
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [landmarks, isTracking]);

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        width: "120px", height: "90px",
        background: "linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
        border: isTracking ? "2px solid #22c55e" : "2px solid rgba(71,85,105,0.4)",
        boxShadow: isTracking ? "0 0 20px rgba(34,197,94,0.3)" : "0 4px 15px rgba(0,0,0,0.3)"
      }}>
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" 
        style={{transform:"scaleX(-1)"}} playsInline muted />
      <canvas ref={canvasRef} width={120} height={90} 
        className="absolute inset-0 w-full h-full" style={{transform:"scaleX(-1)"}} />
      {!isTracking && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-white/60 text-xs font-medium">Camera off</span>
        </div>
      )}
      {isTracking && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </div>
  );
}
