"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 100;
const FRAME_PATH = "/frames/frame_";
const EXT = ".webp";

function getFrameUrl(index: number) {
  const paddedIndex = index.toString().padStart(3, "0");
  return `${FRAME_PATH}${paddedIndex}${EXT}`;
}

export function CinematicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(0);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        loadedCount++;
        setLoaded(loadedCount);
      };
      imagesRef.current.push(img);
    }
  }, []);

  // Auto-play animation
  useEffect(() => {
    if (loaded < TOTAL_FRAMES) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-res canvas
    canvas.width = 1920;
    canvas.height = 1080;

    let currentFrame = 0;
    let animationFrameId: number;
    let lastTime = performance.now();
    const fps = 24; // 24 FPS para um giro majestoso
    const frameInterval = 1000 / fps;

    const render = (time: number) => {
      const deltaTime = time - lastTime;
      
      if (deltaTime > frameInterval) {
        currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
        const img = imagesRef.current[currentFrame];
        
        if (img && img.complete) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        lastTime = time - (deltaTime % frameInterval);
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    // Draw first frame immediately
    if (imagesRef.current[0] && imagesRef.current[0].complete) {
      ctx.drawImage(imagesRef.current[0], 0, 0, canvas.width, canvas.height);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [loaded]);

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />
        {/* Vignette Overlays para legibilidade dos nós */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.7)_0%,transparent_20%,transparent_80%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
      </div>

      {loaded < TOTAL_FRAMES && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black">
          <div className="text-violet-400 font-mono text-sm animate-pulse flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
            INITIALIZING NEURAL CORE: {Math.round((loaded / TOTAL_FRAMES) * 100)}%
          </div>
        </div>
      )}
    </>
  );
}
