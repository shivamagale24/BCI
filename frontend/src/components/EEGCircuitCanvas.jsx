import React, { useEffect, useRef } from 'react';

export default function EEGCircuitCanvas({
  activeCondition = 'rest', // 'right_hand', 'rest', 'left_hand'
  previewSignal = null,
  isSimulating = false
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);

  // Key sensorimotor channels to visualize
  const channels = [
    { name: 'C3 (Left Motor)', color: '#06b6d4', baseMu: 10, isContralateralRight: true },
    { name: 'Cz (Vertex)', color: '#3b82f6', baseMu: 10 },
    { name: 'C4 (Right Motor)', color: '#a855f7', baseMu: 10, isContralateralLeft: true },
    { name: 'F3 (Frontal L)', color: '#10b981', baseMu: 8 },
    { name: 'F4 (Frontal R)', color: '#14b8a6', baseMu: 8 },
    { name: 'Pz (Parietal)', color: '#f59e0b', baseMu: 12 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      phaseRef.current += isSimulating ? 0.08 : 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // Dark background with subtle grid
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Draw faint vertical time grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const numChannels = channels.length;
      const channelHeight = height / numChannels;

      channels.forEach((ch, idx) => {
        const centerY = idx * channelHeight + channelHeight / 2;

        // Channel separator line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(0, idx * channelHeight);
        ctx.lineTo(width, idx * channelHeight);
        ctx.stroke();

        // Channel label
        ctx.fillStyle = ch.color;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(ch.name, 12, centerY - 12);

        // ERD (Event-Related Desynchronization) modulation calculation:
        // Contralateral attenuation:
        // Right Hand Movement -> desynchronizes C3 (decreased mu amplitude)
        // Left Hand Movement -> desynchronizes C4 (decreased mu amplitude)
        let erdFactor = 1.0;
        if (activeCondition === 'right_hand' && ch.isContralateralRight) {
          erdFactor = 0.35; // Mu suppression over left hemisphere C3
        } else if (activeCondition === 'left_hand' && ch.isContralateralLeft) {
          erdFactor = 0.35; // Mu suppression over right hemisphere C4
        } else if (activeCondition === 'rest') {
          erdFactor = 1.2; // Prominent idling sensorimotor rhythm
        }

        // Draw Waveform trace
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const maxPoints = width - 110;
        const startX = 110;

        for (let i = 0; i < maxPoints; i++) {
          const t = i * 0.04 + phaseRef.current;
          
          // Realistic superposition of Mu rhythm (8-12Hz) + Beta rhythm (18-24Hz) + slight drift
          let amp;
          if (previewSignal && previewSignal.length > 0 && idx === 0) {
            // Incorporate actual signal preview point if available
            const sigIdx = (i + Math.floor(phaseRef.current * 10)) % previewSignal.length;
            amp = previewSignal[sigIdx] * 0.25 * erdFactor;
          } else {
            const mu = Math.sin(t * ch.baseMu) * 14 * erdFactor;
            const beta = Math.sin(t * (ch.baseMu * 2.1) + idx) * 5;
            const alphaHarmonic = Math.cos(t * 3 + idx) * 3;
            amp = mu + beta + alphaHarmonic;
          }

          const y = centerY + amp;
          const x = startX + i;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Draw active oscillating cursor head
        const headX = width - 4;
        ctx.fillStyle = ch.color;
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(headX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeCondition, previewSignal, isSimulating]);

  return (
    <div className="eeg-canvas-box">
      <div className="eeg-canvas-header">
        <div className="title">
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', marginRight: 6 }}></span>
          Multi-Channel EEG Stream (10-20 Montage, Bandpass: 8.0 - 30.0 Hz)
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          <span>FS: 1024 Hz</span>
          <span>Window: 2.5s</span>
          <span style={{ color: activeCondition !== 'rest' ? '#06b6d4' : '#10b981' }}>
            State: {activeCondition.toUpperCase().replace('_', ' ')}
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={760}
        height={260}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
      />
    </div>
  );
}
