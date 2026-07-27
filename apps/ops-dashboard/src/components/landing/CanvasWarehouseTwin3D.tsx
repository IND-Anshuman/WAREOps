import React, { useEffect, useRef } from 'react';

interface CanvasWarehouseTwin3DProps {
  isPaused?: boolean;
}

export const CanvasWarehouseTwin3D: React.FC<CanvasWarehouseTwin3DProps> = ({ isPaused = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - width / 2) / (width / 2);
      const y = (e.clientY - rect.top - height / 2) / (height / 2);
      mouseRef.current.targetX = x * 35;
      mouseRef.current.targetY = y * 20;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // 3D Isometric projection constants
    const angleX = Math.PI / 6; // 30 degrees
    const isoScale = 28;

    // Convert 3D grid coords to 2D screen coordinates
    const project = (x: number, y: number, z: number, offsetX: number, offsetY: number) => {
      const isoX = (x - y) * Math.cos(angleX) * isoScale + offsetX;
      const isoY = (x + y) * Math.sin(angleX) * isoScale - z * isoScale * 0.9 + offsetY;
      return { x: isoX, y: isoY };
    };

    // Simulated AMR Robots
    const robots = [
      { id: 1, x: 2, y: 3, targetX: 8, targetY: 3, speed: 0.02, color: '#6366f1', angle: 0 },
      { id: 2, x: 10, y: 8, targetX: 10, targetY: 1, speed: 0.018, color: '#06b6d4', angle: Math.PI / 2 },
      { id: 3, x: 5, y: 12, targetX: 12, targetY: 12, speed: 0.022, color: '#10b981', angle: 0 },
    ];

    // Simulated Floating Particles
    const particles = Array.from({ length: 40 }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: Math.random() * 8,
      vy: Math.random() * 0.02 + 0.005,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    let tick = 0;

    const render = () => {
      if (isPaused) return;

      tick += 1;

      // Smooth camera dampening
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const originX = width / 2 + mouseRef.current.x;
      const originY = height / 2.3 + mouseRef.current.y;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle background radial mesh glow
      const radialGlow = ctx.createRadialGradient(originX, originY, 50, originX, originY, width * 0.6);
      radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.07)');
      radialGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
      radialGlow.addColorStop(1, 'rgba(5, 5, 7, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Floor Isometric Grid
      const gridSize = 16;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';

      for (let i = -gridSize / 2; i <= gridSize / 2; i++) {
        const start1 = project(i, -gridSize / 2, 0, originX, originY);
        const end1 = project(i, gridSize / 2, 0, originX, originY);
        ctx.beginPath();
        ctx.moveTo(start1.x, start1.y);
        ctx.lineTo(end1.x, end1.y);
        ctx.stroke();

        const start2 = project(-gridSize / 2, i, 0, originX, originY);
        const end2 = project(gridSize / 2, i, 0, originX, originY);
        ctx.beginPath();
        ctx.moveTo(start2.x, start2.y);
        ctx.lineTo(end2.x, end2.y);
        ctx.stroke();
      }

      // 3. Draw 3D Warehouse Rack Structures
      const rackRows = [-6, -2, 2, 6];
      const rackLength = 12;

      rackRows.forEach((rx, rIdx) => {
        for (let ry = -rackLength / 2; ry < rackLength / 2; ry += 2) {
          const isPulse = (tick + rIdx * 15 + ry * 8) % 120 < 20;

          // Draw vertical columns
          const base = project(rx, ry, 0, originX, originY);
          const top = project(rx, ry, 3.5, originX, originY);

          ctx.strokeStyle = isPulse ? 'rgba(99, 102, 241, 0.6)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = isPulse ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(top.x, top.y);
          ctx.stroke();

          // Draw horizontal shelf tiers
          [1, 2, 3].forEach((tier) => {
            const p1 = project(rx, ry, tier, originX, originY);
            const p2 = project(rx + 1.2, ry, tier, originX, originY);

            ctx.strokeStyle = isPulse ? 'rgba(6, 182, 212, 0.7)' : 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Draw bin node highlights
            const binP = project(rx + 0.6, ry, tier + 0.15, originX, originY);
            ctx.fillStyle = isPulse 
              ? '#10b981' 
              : (rIdx + tier) % 5 === 0 ? 'rgba(244, 63, 94, 0.7)' : 'rgba(99, 102, 241, 0.3)';
            ctx.beginPath();
            ctx.arc(binP.x, binP.y, isPulse ? 2.5 : 1.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // 4. Update and Render Autonomous AMR Robots
      robots.forEach((bot) => {
        // Move towards target
        const dx = bot.targetX - bot.x;
        const dy = bot.targetY - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) {
          // Swap target
          bot.targetX = (Math.random() - 0.5) * 12;
          bot.targetY = (Math.random() - 0.5) * 12;
        } else {
          bot.x += (dx / dist) * bot.speed;
          bot.y += (dy / dist) * bot.speed;
        }

        const pos = project(bot.x, bot.y, 0.1, originX, originY);

        // Draw Robot Chassis Glow
        const botGlow = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, 14);
        botGlow.addColorStop(0, bot.color);
        botGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = botGlow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Draw Solid Robot Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Scanning Ray Cone to Rack
        const scanHeight = 1.5 + Math.sin(tick * 0.08) * 1.2;
        const scanTarget = project(bot.x + 1.2, bot.y, scanHeight, originX, originY);
        
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(scanTarget.x, scanTarget.y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      });

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause rendering when tab loses focus for optimal performance
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
    />
  );
};
