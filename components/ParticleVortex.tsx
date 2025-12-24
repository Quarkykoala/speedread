import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  opacity: number;
}

const PARTICLE_COUNT = 800;
const COLORS = [
  '#7AA89B', // Sage
  '#9FA56A', // Olive
  '#C49B68', // Sand
  '#D4B48A', // Light sand
  '#89B0A4', // Pale teal
  '#6F8F86', // Deep sage
  '#B59B7B', // Warm taupe
  '#A77A5A', // Clay
];

export const ParticleVortex: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  const initParticles = useCallback((width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * Math.min(width, height) * 0.4;
      const z = Math.random() * 200 - 100;
      
      particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        z,
        angle,
        radius,
        speed: 0.002 + Math.random() * 0.004,
        size: 1 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.3 + Math.random() * 0.7,
      });
    }

    particlesRef.current = particles;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear with fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, width, height);

    // Sort particles by z for depth effect
    const sortedParticles = [...particlesRef.current].sort((a, b) => a.z - b.z);

    sortedParticles.forEach((particle) => {
      // Update angle for spiral motion
      particle.angle += particle.speed;
      
      // Slight radius oscillation for organic feel
      const radiusOscillation = Math.sin(particle.angle * 3) * 20;
      const currentRadius = particle.radius + radiusOscillation;
      
      // Update position
      particle.x = centerX + Math.cos(particle.angle) * currentRadius;
      particle.y = centerY + Math.sin(particle.angle) * currentRadius * 0.6; // Elliptical
      
      // Z-axis oscillation for depth
      particle.z += Math.sin(particle.angle) * 0.5;
      if (particle.z > 100) particle.z = -100;
      if (particle.z < -100) particle.z = 100;

      // Calculate scale based on z position (perspective)
      const scale = (particle.z + 150) / 250;
      const size = particle.size * scale;
      const opacity = particle.opacity * scale;

      // Draw particle with glow
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Outer glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, size * 3
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.4, particle.color + '80');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Core particle
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};
