import { useEffect, useState } from "react";

export function GazeIndicator({ gazePosition, isTracking, isVisible = true }) {
  const [smoothPos, setSmoothPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!isTracking || !isVisible) return;
    // Converti da 0-1 a percentuale schermo
    const targetX = gazePosition.x * 100;
    const targetY = gazePosition.y * 100;
    // Smooth animation
    setSmoothPos(prev => ({
      x: prev.x + (targetX - prev.x) * 0.3,
      y: prev.y + (targetY - prev.y) * 0.3
    }));
  }, [gazePosition, isTracking, isVisible]);

  if (!isTracking || !isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-40"
      style={{
        left: `${smoothPos.x}%`,
        top: `${smoothPos.y}%`,
        transform: "translate(-50%, -50%)",
        transition: "left 0.05s linear, top 0.05s linear"
      }}
    >
      {/* Cerchio esterno pulsante */}
      <div
        className="absolute rounded-full animate-ping"
        style={{
          width: 40,
          height: 40,
          left: -20,
          top: -20,
          background: "rgba(245, 158, 11, 0.3)",
        }}
      />
      {/* Cerchio principale */}
      <div
        className="absolute rounded-full"
        style={{
          width: 24,
          height: 24,
          left: -12,
          top: -12,
          background: "radial-gradient(circle, #f59e0b 0%, #d97706 100%)",
          boxShadow: "0 0 20px rgba(245, 158, 11, 0.6), 0 0 40px rgba(245, 158, 11, 0.3)",
          border: "2px solid rgba(255, 255, 255, 0.8)"
        }}
      />
      {/* Punto centrale */}
      <div
        className="absolute rounded-full bg-white"
        style={{
          width: 6,
          height: 6,
          left: -3,
          top: -3,
        }}
      />
    </div>
  );
}
