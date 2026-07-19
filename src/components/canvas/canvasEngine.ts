import { BoardElement, Point, GridType, BorderStyle, ShadowStyle } from '../../types';

// Convert Screen coordinates to World coordinates
export const screenToWorld = (screenX: number, screenY: number, panX: number, panY: number, scale: number): Point => {
  return {
    x: (screenX - panX) / scale,
    y: (screenY - panY) / scale
  };
};

// Convert World coordinates to Screen coordinates
export const worldToScreen = (worldX: number, worldY: number, panX: number, panY: number, scale: number): Point => {
  return {
    x: worldX * scale + panX,
    y: worldY * scale + panY
  };
};

// Setup shadow styles on context
const applyShadow = (ctx: CanvasRenderingContext2D, style: ShadowStyle) => {
  if (style === 'none') {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else if (style === 'soft') {
    ctx.shadowColor = 'rgba(23, 23, 37, 0.08)'; // Premium Slate shadow tint
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  } else if (style === 'hard') {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
  }
};

// Setup border stroke styles (solid, dashed, dotted)
const applyBorderStroke = (ctx: CanvasRenderingContext2D, style: BorderStyle, width: number) => {
  if (style === 'dashed') {
    ctx.setLineDash([width * 3, width * 3]);
  } else if (style === 'dotted') {
    ctx.setLineDash([width, width * 2]);
  } else {
    ctx.setLineDash([]);
  }
};

// Render the grid background
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  panX: number,
  panY: number,
  scale: number,
  gridType: GridType,
  isBlueprint = false
) => {
  if (gridType === 'none') return;

  const gridStep = 40;
  const scaledStep = gridStep * scale;
  
  // Calculate starting positions to draw grid
  const startX = (panX % scaledStep) - scaledStep;
  const startY = (panY % scaledStep) - scaledStep;
  
  ctx.save();
  ctx.strokeStyle = isBlueprint ? 'rgba(30, 64, 175, 0.15)' : 'rgba(0, 0, 0, 0.04)';
  ctx.fillStyle = isBlueprint ? 'rgba(30, 64, 175, 0.15)' : 'rgba(0, 0, 0, 0.04)';
  if (!isBlueprint && document.documentElement.classList.contains('dark')) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  }
  ctx.lineWidth = 1;

  if (gridType === 'dots') {
    const dotRadius = Math.max(0.6 * scale, 0.5);
    for (let x = startX; x < width + scaledStep; x += scaledStep) {
      for (let y = startY; y < height + scaledStep; y += scaledStep) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'lines') {
    // Draw vertical lines
    for (let x = startX; x < width + scaledStep; x += scaledStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Draw horizontal lines
    for (let y = startY; y < height + scaledStep; y += scaledStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  ctx.restore();
};

// Draw a single element
export const drawElement = (
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  imagesCache: Record<string, HTMLImageElement>
) => {
  ctx.save();
  ctx.globalAlpha = el.opacity;

  // Move context coordinate system to shape's center for clean rotation
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  // Setup styles
  ctx.strokeStyle = el.color;
  ctx.lineWidth = el.strokeWidth;
  applyBorderStroke(ctx, el.strokeStyle, el.strokeWidth);
  applyShadow(ctx, el.shadow);

  // Set line endings
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (el.type) {
    case 'pencil':
    case 'brush':
    case 'marker':
    case 'highlighter':
      if (el.points && el.points.length > 1) {
        if (el.type === 'highlighter') {
          ctx.globalAlpha = el.opacity * 0.4; // Semi-transparent highlighter
          ctx.lineWidth = el.strokeWidth * 6;
        } else if (el.type === 'brush') {
          ctx.lineWidth = el.strokeWidth * 3;
        } else if (el.type === 'marker') {
          ctx.lineWidth = el.strokeWidth * 2.2;
        }

        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        
        // Use quadratic curves for smooth lines instead of jagged corners
        for (let i = 1; i < el.points.length - 1; i++) {
          const xc = (el.points[i].x + el.points[i + 1].x) / 2;
          const yc = (el.points[i].y + el.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
        }
        
        ctx.lineTo(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y);
        ctx.stroke();
      }
      break;

    case 'rect':
    case 'rounded-rect':
      ctx.beginPath();
      const rounded = el.rounded || el.type === 'rounded-rect';
      if (rounded) {
        const radius = Math.min(el.width, el.height) * 0.12;
        ctx.roundRect(el.x, el.y, el.width, el.height, radius);
      } else {
        ctx.rect(el.x, el.y, el.width, el.height);
      }
      
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'circle':
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(el.width / 2), Math.abs(el.height / 2), 0, 0, Math.PI * 2);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(cx, el.y); // Top
      ctx.lineTo(el.x + el.width, el.y + el.height); // Bottom Right
      ctx.lineTo(el.x, el.y + el.height); // Bottom Left
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(cx, el.y); // Top
      ctx.lineTo(el.x + el.width, cy); // Right
      ctx.lineTo(cx, el.y + el.height); // Bottom
      ctx.lineTo(el.x, cy); // Left
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'pentagon':
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = cx + Math.cos(angle) * (el.width / 2);
        const py = cy + Math.sin(angle) * (el.height / 2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'hexagon':
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
        const px = cx + Math.cos(angle) * (el.width / 2);
        const py = cy + Math.sin(angle) * (el.height / 2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'star':
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = Math.min(el.width, el.height) / 2;
      const innerRadius = outerRadius * 0.4;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      for (let i = 0; i < spikes; i++) {
        let px = cx + Math.cos(rot) * outerRadius;
        let py = cy + Math.sin(rot) * outerRadius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        
        rot += step;

        px = cx + Math.cos(rot) * innerRadius;
        py = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(px, py);
        
        rot += step;
      }
      ctx.closePath();
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillStyle = el.fillColor;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'line':
      if (el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        ctx.lineTo(el.points[1].x, el.points[1].y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
      }
      break;

    case 'arrow':
    case 'double-arrow':
      const p1 = el.points && el.points[0] ? el.points[0] : { x: el.x, y: el.y };
      const p2 = el.points && el.points[1] ? el.points[1] : { x: el.x + el.width, y: el.y + el.height };
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Render arrowhead at end (p2)
      const arrowLength = 16 + el.strokeWidth * 1.5;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - arrowLength * Math.cos(angle - 0.4), p2.y - arrowLength * Math.sin(angle - 0.4));
      ctx.lineTo(p2.x - arrowLength * Math.cos(angle + 0.4), p2.y - arrowLength * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = el.color;
      ctx.fill();

      // If double arrow, also render at start (p1)
      if (el.type === 'double-arrow') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x + arrowLength * Math.cos(angle - 0.4), p1.y + arrowLength * Math.sin(angle - 0.4));
        ctx.lineTo(p1.x + arrowLength * Math.cos(angle + 0.4), p1.y + arrowLength * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      }
      break;

    case 'curved-arrow': {
      const cp1 = el.points && el.points[0] ? el.points[0] : { x: el.x, y: el.y };
      const cp2 = el.points && el.points[1] ? el.points[1] : { x: el.x + el.width, y: el.y + el.height };
      
      const midX = (cp1.x + cp2.x) / 2;
      const midY = (cp1.y + cp2.y) / 2;
      const dx = cp2.x - cp1.x;
      const dy = cp2.y - cp1.y;
      const len = Math.hypot(dx, dy) || 1;
      const offset = len * 0.15;
      const cx_val = midX - (dy / len) * offset;
      const cy_val = midY + (dx / len) * offset;

      ctx.beginPath();
      ctx.moveTo(cp1.x, cp1.y);
      ctx.quadraticCurveTo(cx_val, cy_val, cp2.x, cp2.y);
      ctx.stroke();

      const tangentX = cp2.x - cx_val;
      const tangentY = cp2.y - cy_val;
      const rotAngle = Math.atan2(tangentY, tangentX);
      const aLen = 16 + el.strokeWidth * 1.5;

      ctx.beginPath();
      ctx.moveTo(cp2.x, cp2.y);
      ctx.lineTo(cp2.x - aLen * Math.cos(rotAngle - 0.4), cp2.y - aLen * Math.sin(rotAngle - 0.4));
      ctx.lineTo(cp2.x - aLen * Math.cos(rotAngle + 0.4), cp2.y - aLen * Math.sin(rotAngle + 0.4));
      ctx.closePath();
      ctx.fillStyle = el.color;
      ctx.fill();
      break;
    }

    case 'connector': {
      const cp1 = el.points && el.points[0] ? el.points[0] : { x: el.x, y: el.y };
      const cp2 = el.points && el.points[1] ? el.points[1] : { x: el.x + el.width, y: el.y + el.height };
      
      const midX = (cp1.x + cp2.x) / 2;
      ctx.beginPath();
      ctx.moveTo(cp1.x, cp1.y);
      ctx.bezierCurveTo(midX, cp1.y, midX, cp2.y, cp2.x, cp2.y);
      ctx.stroke();

      const aLen = 14 + el.strokeWidth * 1.5;
      ctx.beginPath();
      ctx.moveTo(cp2.x, cp2.y);
      ctx.lineTo(cp2.x - aLen, cp2.y - 6);
      ctx.lineTo(cp2.x - aLen, cp2.y + 6);
      ctx.closePath();
      ctx.fillStyle = el.color;
      ctx.fill();
      break;
    }

    case 'sticky':
      // Sticky Notes are always drawn yellow/custom fill, flat 3D-ish feel
      ctx.fillStyle = el.fillColor || '#fef08a';
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, 8);
      ctx.fill();
      
      // Fine dark border
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text drawing
      if (el.text) {
        ctx.fillStyle = el.color || '#854d0e';
        ctx.font = `500 ${el.fontSize || 14}px ${el.fontFamily || 'Outfit'}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Wrap text
        const words = el.text.split('\n');
        let currentY = el.y + 16;
        const lineH = (el.fontSize || 14) * 1.4;

        words.forEach(line => {
          ctx.fillText(line, el.x + 16, currentY);
          currentY += lineH;
        });
      }
      break;

    case 'text':
      if (el.text) {
        ctx.fillStyle = el.color;
        const isBold = el.fontStyle?.bold ? 'bold' : '';
        const isItalic = el.fontStyle?.italic ? 'italic' : '';
        ctx.font = `${isBold} ${isItalic} ${el.fontSize || 16}px ${el.fontFamily || 'Outfit'}`;
        ctx.textAlign = el.align || 'left';
        ctx.textBaseline = 'top';
        
        const lineH = (el.fontSize || 16) * (el.lineHeight || 1.3);
        const lines = el.text.split('\n');
        
        lines.forEach((line, idx) => {
          let tx = el.x;
          if (el.align === 'center') tx = el.x + el.width / 2;
          if (el.align === 'right') tx = el.x + el.width;
          
          ctx.fillText(line, tx, el.y + idx * lineH);
          
          // Custom render for underline & strike through
          if (el.fontStyle?.underline || el.fontStyle?.strike) {
            const metrics = ctx.measureText(line);
            const textW = metrics.width;
            let underlineX = el.x;
            if (el.align === 'center') underlineX = el.x + el.width / 2 - textW / 2;
            if (el.align === 'right') underlineX = el.x + el.width - textW;

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = el.color;
            ctx.beginPath();
            
            if (el.fontStyle.underline) {
              ctx.moveTo(underlineX, el.y + idx * lineH + (el.fontSize || 16));
              ctx.lineTo(underlineX + textW, el.y + idx * lineH + (el.fontSize || 16));
            }
            if (el.fontStyle.strike) {
              ctx.moveTo(underlineX, el.y + idx * lineH + (el.fontSize || 16) / 2);
              ctx.lineTo(underlineX + textW, el.y + idx * lineH + (el.fontSize || 16) / 2);
            }
            ctx.stroke();
          }
        });
      }
      break;

    case 'image':
      if (el.src && imagesCache[el.src]) {
        const img = imagesCache[el.src];
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } else {
        // Fallback placeholder during image load
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText("Loading Image...", cx, cy);
      }
      break;
  }

  ctx.restore();
};

// Check if a point (x, y) hits an element
export const hitTestElement = (x: number, y: number, el: BoardElement): boolean => {
  // Simple check for bounding box (taking rotation into account)
  // For standard rectangular elements, compute local coordinates
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  // Translate point back relative to center
  const dx = x - cx;
  const dy = y - cy;

  // Unrotate point
  const rad = (-el.rotation * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  const halfW = Math.abs(el.width / 2);
  const halfH = Math.abs(el.height / 2);

  // Check if unrotated point falls inside bounding box
  const insideBox = rx >= -halfW && rx <= halfW && ry >= -halfH && ry <= halfH;
  
  if (insideBox) return true;

  // For paths/pencils, test if coordinate is close to any point on path
  if (['pencil', 'brush', 'marker', 'highlighter'].includes(el.type) && el.points) {
    const threshold = el.strokeWidth * 4;
    for (let i = 0; i < el.points.length; i++) {
      const p = el.points[i];
      const dist = Math.hypot(x - p.x, y - p.y);
      if (dist < threshold) return true;
    }
  }

  return false;
};

// Return elements inside a selection rectangle
export const getElementsInBox = (x1: number, y1: number, x2: number, y2: number, elements: BoardElement[]): string[] => {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return elements
    .filter(el => {
      // Check if bounding box overlaps/is fully inside selection box
      const ex1 = el.x;
      const ex2 = el.x + el.width;
      const ey1 = el.y;
      const ey2 = el.y + el.height;
      
      const elMinX = Math.min(ex1, ex2);
      const elMaxX = Math.max(ex1, ex2);
      const elMinY = Math.min(ey1, ey2);
      const elMaxY = Math.max(ey1, ey2);

      return elMinX >= minX && elMaxX <= maxX && elMinY >= minY && elMaxY <= maxY;
    })
    .map(el => el.id);
};

// Get the collective bounding box of multiple elements
export const getSelectionBoundingBox = (selectedIds: string[], elements: BoardElement[]) => {
  if (selectedIds.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  selectedIds.forEach(id => {
    const el = elements.find(e => e.id === id);
    if (el) {
      minX = Math.min(minX, el.x, el.x + el.width);
      maxX = Math.max(maxX, el.x, el.x + el.width);
      minY = Math.min(minY, el.y, el.y + el.height);
      maxY = Math.max(maxY, el.y, el.y + el.height);
    }
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'se' | 'sw' | 'rotation' | null;

// Find which resize/rotation handle was hit
export const getHandleAtPosition = (
  x: number,
  y: number,
  el: BoardElement,
  scale: number
): ResizeHandle => {
  const handleSize = 8 / scale;
  const rotDist = 30 / scale;

  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  // Unrotate point
  const dx = x - cx;
  const dy = y - cy;
  const rad = (-el.rotation * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;

  const left = el.x;
  const right = el.x + el.width;
  const top = el.y;
  const bottom = el.y + el.height;
  const hMidX = el.x + el.width / 2;
  const vMidY = el.y + el.height / 2;

  // Check rotation handle
  if (Math.hypot(rx - hMidX, ry - (top - rotDist)) < handleSize * 1.5) {
    return 'rotation';
  }

  // Corners
  if (Math.hypot(rx - left, ry - top) < handleSize) return 'nw';
  if (Math.hypot(rx - right, ry - top) < handleSize) return 'ne';
  if (Math.hypot(rx - right, ry - bottom) < handleSize) return 'se';
  if (Math.hypot(rx - left, ry - bottom) < handleSize) return 'sw';

  // Edges
  if (Math.hypot(rx - hMidX, ry - top) < handleSize) return 'n';
  if (Math.hypot(rx - hMidX, ry - bottom) < handleSize) return 's';
  if (Math.hypot(rx - right, ry - vMidY) < handleSize) return 'e';
  if (Math.hypot(rx - left, ry - vMidY) < handleSize) return 'w';

  return null;
};

// Snap value to nearest step
export const snapTo = (val: number, step: number): number => {
  return Math.round(val / step) * step;
};

// Alignment guides calculation
export interface AlignmentGuide {
  x?: number; // X-coord for vertical guide lines
  y?: number; // Y-coord for horizontal guide lines
}

export const getSmartGuides = (
  draggedEl: BoardElement,
  otherElements: BoardElement[],
  threshold = 6
): { snappedX: number; snappedY: number; guides: AlignmentGuide[] } => {
  let snappedX = draggedEl.x;
  let snappedY = draggedEl.y;
  const guides: AlignmentGuide[] = [];

  const bounds = {
    l: draggedEl.x,
    r: draggedEl.x + draggedEl.width,
    cx: draggedEl.x + draggedEl.width / 2,
    t: draggedEl.y,
    b: draggedEl.y + draggedEl.height,
    cy: draggedEl.y + draggedEl.height / 2
  };

  otherElements.forEach(el => {
    const ob = {
      l: el.x,
      r: el.x + el.width,
      cx: el.x + el.width / 2,
      t: el.y,
      b: el.y + el.height,
      cy: el.y + el.height / 2
    };

    // Horizontal alignments (snapping Y-coord)
    if (Math.abs(bounds.t - ob.t) < threshold) {
      snappedY = ob.t;
      guides.push({ y: ob.t });
    } else if (Math.abs(bounds.t - ob.b) < threshold) {
      snappedY = ob.b;
      guides.push({ y: ob.b });
    } else if (Math.abs(bounds.b - ob.t) < threshold) {
      snappedY = ob.t - draggedEl.height;
      guides.push({ y: ob.t });
    } else if (Math.abs(bounds.b - ob.b) < threshold) {
      snappedY = ob.b - draggedEl.height;
      guides.push({ y: ob.b });
    } else if (Math.abs(bounds.cy - ob.cy) < threshold) {
      snappedY = ob.cy - draggedEl.height / 2;
      guides.push({ y: ob.cy });
    }

    // Vertical alignments (snapping X-coord)
    if (Math.abs(bounds.l - ob.l) < threshold) {
      snappedX = ob.l;
      guides.push({ x: ob.l });
    } else if (Math.abs(bounds.l - ob.r) < threshold) {
      snappedX = ob.r;
      guides.push({ x: ob.r });
    } else if (Math.abs(bounds.r - ob.l) < threshold) {
      snappedX = ob.l - draggedEl.width;
      guides.push({ x: ob.l });
    } else if (Math.abs(bounds.r - ob.r) < threshold) {
      snappedX = ob.r - draggedEl.width;
      guides.push({ x: ob.r });
    } else if (Math.abs(bounds.cx - ob.cx) < threshold) {
      snappedX = ob.cx - draggedEl.width / 2;
      guides.push({ x: ob.cx });
    }
  });

  return { snappedX, snappedY, guides };
};
