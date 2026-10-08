import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function InteractiveBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking & soft cursor aura
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
      active: false,
    };

    let scrollY = window.scrollY;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Generate floating clinical/molecular nodes
    const nodeCount = Math.min(42, Math.floor((width * height) / 28000));
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.5 + 1.5,
      depth: Math.random() * 0.6 + 0.4, // Parallax depth factor
      pulse: Math.random() * Math.PI * 2,
      type: i % 5 === 0 ? 'molar' : 'molecule', // Distinct medical abstract glyphs
    }));

    const render = () => {
      // Smooth cursor interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const isNight = theme === 'night';

      // 1. Interactive Mouse Glow (Bioluminescent aura)
      if (mouse.active) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * (isNight ? 1.6 : 1.2),
        );
        if (isNight) {
          glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
          glowGrad.addColorStop(0.5, 'rgba(13, 148, 136, 0.06)');
          glowGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
        } else {
          glowGrad.addColorStop(0, 'rgba(13, 148, 136, 0.12)');
          glowGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.04)');
          glowGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');
        }
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Update and Draw Nodes
      const linkDist = 140;
      const primaryColor = isNight ? '56, 189, 248' : '13, 148, 136';
      const secondaryColor = isNight ? '45, 212, 191' : '2, 132, 199';

      // Update positions with subtle floating physics & parallax
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.02;

        // Soft bounce at boundaries
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        // Interactive cursor repulsion / gentle reaction
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius && mouse.active) {
          const force = (1 - dist / mouse.radius) * 0.8;
          node.x += (dx / dist) * force;
          node.y += (dy / dist) * force;
        }

        // Parallax offset on Y based on scroll
        const parallaxY = node.y - (scrollY * 0.12 * node.depth) % height;
        const renderY = parallaxY < 0 ? parallaxY + height : parallaxY;

        // Draw node
        const pulseFactor = 0.85 + Math.sin(node.pulse) * 0.15;
        const alpha = isNight ? 0.35 * node.depth : 0.28 * node.depth;

        ctx.save();
        ctx.translate(node.x, renderY);

        if (node.type === 'molar') {
          // Abstract dental crown contour
          ctx.strokeStyle = `rgba(${primaryColor}, ${alpha * 1.2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          const r = node.radius * 2.2 * pulseFactor;
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(${secondaryColor}, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard molecular node
          ctx.fillStyle = `rgba(${primaryColor}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, node.radius * pulseFactor, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 3. Connect close nodes (Inter-molecular lattice)
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const oParallaxY = other.y - (scrollY * 0.12 * other.depth) % height;
          const oRenderY = oParallaxY < 0 ? oParallaxY + height : oParallaxY;

          const ldx = node.x - other.x;
          const ldy = renderY - oRenderY;
          const ldist = Math.sqrt(ldx * ldx + ldy * ldy);

          if (ldist < linkDist) {
            const linkAlpha = (1 - ldist / linkDist) * (isNight ? 0.12 : 0.08);
            ctx.strokeStyle = `rgba(${primaryColor}, ${linkAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(node.x, renderY);
            ctx.lineTo(other.x, oRenderY);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [theme]);

  return (
    <div className="living-canvas-container" aria-hidden="true">
      <canvas ref={canvasRef} className="living-canvas" />
    </div>
  );
}
