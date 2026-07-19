import React, { useRef, useEffect } from 'react';
import { BoardElement } from '../../types';

interface MinimapProps {
  elements: BoardElement[];
  scale: number;
  panX: number;
  panY: number;
  mainWidth: number;
  mainHeight: number;
  onPanTo: (x: number, y: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  elements,
  scale,
  panX,
  panY,
  mainWidth,
  mainHeight,
  onPanTo
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed size for minimap
    const mapW = canvas.width;
    const mapH = canvas.height;

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, mapW, mapH);
    
    // Add micro grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < mapW; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapH);
      ctx.stroke();
    }
    for (let y = 0; y < mapH; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapW, y);
      ctx.stroke();
    }

    // Determine current viewport bounds in world coordinates
    const viewLeft = -panX / scale;
    const viewTop = -panY / scale;
    const viewRight = (mainWidth - panX) / scale;
    const viewBottom = (mainHeight - panY) / scale;

    // Bounding box of elements + viewport bounds to ensure all fit
    let minX = Math.min(viewLeft, -500);
    let maxX = Math.max(viewRight, 500);
    let minY = Math.min(viewTop, -500);
    let maxY = Math.max(viewBottom, 500);

    elements.forEach(el => {
      minX = Math.min(minX, el.x);
      maxX = Math.max(maxX, el.x + el.width);
      minY = Math.min(minY, el.y);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    // Map world coordinates to minimap coordinates
    const padding = 8;
    const scaleX = (mapW - padding * 2) / contentW;
    const scaleY = (mapH - padding * 2) / contentH;
    const mapScale = Math.min(scaleX, scaleY);

    const worldToMap = (wx: number, wy: number) => {
      // Center the map content
      const mapOffsetX = (mapW - contentW * mapScale) / 2;
      const mapOffsetY = (mapH - contentH * mapScale) / 2;
      return {
        x: mapOffsetX + (wx - minX) * mapScale,
        y: mapOffsetY + (wy - minY) * mapScale
      };
    };

    // Draw elements
    elements.forEach(el => {
      const pos1 = worldToMap(el.x, el.y);
      const pos2 = worldToMap(el.x + el.width, el.y + el.height);
      const elW = Math.max(1.5, pos2.x - pos1.x);
      const elH = Math.max(1.5, pos2.y - pos1.y);

      ctx.fillStyle = el.type === 'sticky' ? '#fef08a' : (el.color === '#ffffff' ? '#cbd5e1' : el.color);
      ctx.globalAlpha = 0.6;
      ctx.fillRect(pos1.x, pos1.y, elW, elH);
    });

    // Draw current screen viewport box
    ctx.globalAlpha = 1.0;
    const viewPos1 = worldToMap(viewLeft, viewTop);
    const viewPos2 = worldToMap(viewRight, viewBottom);
    
    ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.fillRect(viewPos1.x, viewPos1.y, viewPos2.x - viewPos1.x, viewPos2.y - viewPos1.y);
    ctx.strokeRect(viewPos1.x, viewPos1.y, viewPos2.x - viewPos1.x, viewPos2.y - viewPos1.y);

    // Save mapping coordinates for click actions
    canvas.setAttribute('data-min-x', minX.toString());
    canvas.setAttribute('data-min-y', minY.toString());
    canvas.setAttribute('data-content-w', contentW.toString());
    canvas.setAttribute('data-content-h', contentH.toString());
    canvas.setAttribute('data-map-scale', mapScale.toString());
  }, [elements, scale, panX, panY, mainWidth, mainHeight]);

  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const minX = parseFloat(canvas.getAttribute('data-min-x') || '0');
    const minY = parseFloat(canvas.getAttribute('data-min-y') || '0');
    const contentW = parseFloat(canvas.getAttribute('data-content-w') || '1000');
    const contentH = parseFloat(canvas.getAttribute('data-content-h') || '1000');
    const mapScale = parseFloat(canvas.getAttribute('data-map-scale') || '0.1');

    const mapW = canvas.width;
    const mapH = canvas.height;

    const mapOffsetX = (mapW - contentW * mapScale) / 2;
    const mapOffsetY = (mapH - contentH * mapScale) / 2;

    // Convert map click to world coordinates
    const worldX = minX + (clickX - mapOffsetX) / mapScale;
    const worldY = minY + (clickY - mapOffsetY) / mapScale;

    onPanTo(worldX, worldY);
  };

  return (
    <div className="glass-panel border border-white/10 rounded-2xl shadow-2xl p-1 overflow-hidden pointer-events-auto bg-white/80 backdrop-blur-md">
      <canvas
        ref={canvasRef}
        width={180}
        height={100}
        onClick={handleMapClick}
        className="rounded-xl cursor-crosshair hover:opacity-95 transition-opacity"
      />
    </div>
  );
};
