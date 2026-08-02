import { BoardElement, Point, GridType, BorderStyle, ShadowStyle } from '../../types';
import { resolveConnectorEndpoints } from '../../utils/connectorRouting';
import { getSmoothedPoints } from '../../utils/smoothPencil';

export const screenToWorld = (screenX: number, screenY: number, panX: number, panY: number, scale: number): Point => {
  return {
    x: (screenX - panX) / scale,
    y: (screenY - panY) / scale
  };
};

export const worldToScreen = (worldX: number, worldY: number, panX: number, panY: number, scale: number): Point => {
  return {
    x: worldX * scale + panX,
    y: worldY * scale + panY
  };
};

const applyShadow = (ctx: CanvasRenderingContext2D, style: ShadowStyle) => {
  if (style === 'none') {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else if (style === 'soft') {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.04)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  } else if (style === 'hard') {
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }
};

const applyBorderStroke = (ctx: CanvasRenderingContext2D, style: BorderStyle, width: number) => {
  if (style === 'dashed') {
    ctx.setLineDash([width * 3, width * 3]);
  } else if (style === 'dotted') {
    ctx.setLineDash([width, width * 2]);
  } else {
    ctx.setLineDash([]);
  }
};

/**
 * Renders the light workspace background (#F3F4F6) and infinite white canvas (#FFFFFF) with grid patterns
 */
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  panX: number,
  panY: number,
  scale: number,
  gridType: GridType
) => {
  // Fill workspace background with light neutral gray #F3F4F6
  ctx.save();
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, width, height);

  if (gridType === 'none' || gridType === 'blank') {
    ctx.restore();
    return;
  }

  const step = 40 * scale;
  const startX = (panX % step) - step;
  const startY = (panY % step) - step;

  ctx.strokeStyle = '#E2E8F0';
  ctx.fillStyle = '#94A3B8';
  ctx.lineWidth = 1;

  if (gridType === 'dots') {
    const radius = Math.max(0.6 * scale, 0.5);
    for (let x = startX; x < width + step; x += step) {
      for (let y = startY; y < height + step; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'lines' || gridType === 'graph' || gridType === 'blueprint') {
    for (let x = startX; x < width + step; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = startY; y < height + step; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }
  ctx.restore();
};

/**
 * Draws elements with crisp 1px borders, white fills, and modern enterprise node styling
 */
export const drawElement = (
  ctx: CanvasRenderingContext2D,
  el: BoardElement,
  imagesCache: Record<string, HTMLImageElement>,
  allElements: BoardElement[] = []
) => {
  if (el.visible === false) return;

  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1.0;

  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.strokeStyle = el.color || '#0F172A';
  ctx.lineWidth = el.strokeWidth || 1.5;
  applyBorderStroke(ctx, el.strokeStyle || 'solid', el.strokeWidth || 1.5);
  applyShadow(ctx, el.shadow || 'soft');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (el.type) {
    case 'pencil':
    case 'brush':
    case 'marker':
    case 'highlighter':
      if (el.points && el.points.length > 1) {
        const smoothed = getSmoothedPoints(el.points);

        if (el.type === 'highlighter') {
          ctx.globalAlpha = (el.opacity ?? 1.0) * 0.3;
          ctx.lineWidth = (el.strokeWidth || 2) * 5;
        } else if (el.type === 'brush') {
          ctx.lineWidth = (el.strokeWidth || 2) * 2.5;
        }

        ctx.beginPath();
        ctx.moveTo(smoothed[0].x, smoothed[0].y);
        for (let i = 1; i < smoothed.length - 1; i++) {
          const xc = (smoothed[i].x + smoothed[i + 1].x) / 2;
          const yc = (smoothed[i].y + smoothed[i + 1].y) / 2;
          ctx.quadraticCurveTo(smoothed[i].x, smoothed[i].y, xc, yc);
        }
        ctx.lineTo(smoothed[smoothed.length - 1].x, smoothed[smoothed.length - 1].y);
        ctx.stroke();
      }
      break;

    case 'frame':
      // Figma Style Frame Container
      ctx.fillStyle = el.fillColor || '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, 8);
      ctx.fill();
      ctx.strokeStyle = el.color || '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      if (el.text) {
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748B';
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(el.text, el.x, el.y - 4);
      }
      break;

    case 'sticky':
      ctx.fillStyle = el.fillColor || el.stickyColor || '#FEF9C3';
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (el.text) {
        ctx.fillStyle = '#1E293B';
        ctx.font = `500 ${el.fontSize || 13}px Inter`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const lines = el.text.split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, el.x + 14, el.y + 14 + idx * 18);
        });
      }
      break;

    case 'rect':
    case 'rounded-rect':
    case 'cloud-node':
    case 'server-node':
    case 'database-node':
    case 'api-gateway':
    case 'microservice-node':
    case 'k8s-pod':
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, 8);
      ctx.fillStyle = el.fillColor || '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = el.color || '#E2E8F0';
      ctx.stroke();
      if (el.text) drawShapeText(ctx, el);
      break;

    case 'circle':
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(el.width / 2), Math.abs(el.height / 2), 0, 0, Math.PI * 2);
      ctx.fillStyle = el.fillColor || '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = el.color || '#E2E8F0';
      ctx.stroke();
      if (el.text) drawShapeText(ctx, el);
      break;

    case 'triangle':
    case 'diamond':
    case 'decision-node':
      ctx.beginPath();
      if (el.type === 'triangle') {
        ctx.moveTo(cx, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.lineTo(el.x, el.y + el.height);
      } else {
        ctx.moveTo(cx, el.y);
        ctx.lineTo(el.x + el.width, cy);
        ctx.lineTo(cx, el.y + el.height);
        ctx.lineTo(el.x, cy);
      }
      ctx.closePath();
      ctx.fillStyle = el.fillColor || '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = el.color || '#E2E8F0';
      ctx.stroke();
      if (el.text) drawShapeText(ctx, el);
      break;

    case 'orthogonal-connector':
    case 'connector':
    case 'arrow':
    case 'curved-arrow':
      const { start, end, pathPoints } = resolveConnectorEndpoints(el, allElements);
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      ctx.strokeStyle = el.color || '#64748B';
      ctx.stroke();

      const lastP = pathPoints[pathPoints.length - 1];
      const prevP = pathPoints[pathPoints.length - 2] || pathPoints[0];
      const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x);
      const aLen = 12 + (el.strokeWidth || 1.5);

      ctx.beginPath();
      ctx.moveTo(lastP.x, lastP.y);
      ctx.lineTo(lastP.x - aLen * Math.cos(angle - 0.35), lastP.y - aLen * Math.sin(angle - 0.35));
      ctx.lineTo(lastP.x - aLen * Math.cos(angle + 0.35), lastP.y - aLen * Math.sin(angle + 0.35));
      ctx.closePath();
      ctx.fillStyle = el.color || '#64748B';
      ctx.fill();

      if (el.connectorData?.label) {
        const midP = pathPoints[Math.floor(pathPoints.length / 2)];
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(midP.x - 22, midP.y - 9, 44, 18);
        ctx.strokeStyle = '#E2E8F0';
        ctx.strokeRect(midP.x - 22, midP.y - 9, 44, 18);
        ctx.fillStyle = '#475569';
        ctx.font = '600 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.connectorData.label, midP.x, midP.y);
      }
      break;

    case 'text':
      if (el.text) {
        ctx.fillStyle = el.color || '#0F172A';
        ctx.font = `${el.fontStyle?.bold ? 'bold' : '500'} ${el.fontSize || 14}px Inter`;
        ctx.textAlign = el.align || 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(el.text, el.x, el.y);
      }
      break;
  }

  ctx.restore();
};

const drawShapeText = (ctx: CanvasRenderingContext2D, el: BoardElement) => {
  if (!el.text) return;
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  ctx.fillStyle = el.color || '#0F172A';
  ctx.font = `600 ${el.fontSize || 13}px Inter`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = el.text.split('\n');
  const lineH = (el.fontSize || 13) * 1.3;
  const startY = cy - ((lines.length - 1) * lineH) / 2;

  lines.forEach((line, idx) => {
    ctx.fillText(line, cx, startY + idx * lineH);
  });
};
