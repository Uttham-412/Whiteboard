import { Point, BoardElement } from '../types';
import { getElementAnchors } from './geometry';

/**
 * Calculates orthogonal Manhattan routing points between two connected shapes or coordinates.
 */
export const getOrthogonalPath = (
  start: Point,
  end: Point,
  startAnchorDir: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'right',
  endAnchorDir: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'left'
): Point[] => {
  const margin = 24; // Obstacle offset clearance

  // Calculate direction vectors
  let p1 = { ...start };
  let p2 = { ...end };

  if (startAnchorDir === 'top') p1.y -= margin;
  if (startAnchorDir === 'bottom') p1.y += margin;
  if (startAnchorDir === 'left') p1.x -= margin;
  if (startAnchorDir === 'right') p1.x += margin;

  if (endAnchorDir === 'top') p2.y -= margin;
  if (endAnchorDir === 'bottom') p2.y += margin;
  if (endAnchorDir === 'left') p2.x -= margin;
  if (endAnchorDir === 'right') p2.x += margin;

  const points: Point[] = [start, p1];

  // Route intermediate corner
  if (startAnchorDir === 'left' || startAnchorDir === 'right') {
    const midX = (p1.x + p2.x) / 2;
    points.push({ x: midX, y: p1.y });
    points.push({ x: midX, y: p2.y });
  } else {
    const midY = (p1.y + p2.y) / 2;
    points.push({ x: p1.x, y: midY });
    points.push({ x: p2.x, y: midY });
  }

  points.push(p2);
  points.push(end);

  return points;
};

/**
 * Resolves connector endpoints dynamically if linked to target elements.
 */
export const resolveConnectorEndpoints = (
  el: BoardElement,
  elements: BoardElement[]
): { start: Point; end: Point; pathPoints: Point[] } => {
  const cData = el.connectorData;
  let start: Point = el.points && el.points[0] ? el.points[0] : { x: el.x, y: el.y };
  let end: Point = el.points && el.points[1] ? el.points[1] : { x: el.x + el.width, y: el.y + el.height };

  let startDir: 'top' | 'right' | 'bottom' | 'left' | 'center' = cData?.startAnchor || 'right';
  let endDir: 'top' | 'right' | 'bottom' | 'left' | 'center' = cData?.endAnchor || 'left';

  if (cData?.startElementId) {
    const target = elements.find(e => e.id === cData.startElementId);
    if (target) {
      const anchors = getElementAnchors(target);
      const a = anchors[cData.startAnchor || 'right'];
      if (a) start = { x: a.x, y: a.y };
    }
  }

  if (cData?.endElementId) {
    const target = elements.find(e => e.id === cData.endElementId);
    if (target) {
      const anchors = getElementAnchors(target);
      const a = anchors[cData.endAnchor || 'left'];
      if (a) end = { x: a.x, y: a.y };
    }
  }

  const mode = cData?.routingMode || (el.type === 'orthogonal-connector' ? 'orthogonal' : 'curved');

  if (mode === 'orthogonal') {
    const pathPoints = getOrthogonalPath(start, end, startDir, endDir);
    return { start, end, pathPoints };
  }

  return { start, end, pathPoints: [start, end] };
};
