import { BoardElement, Point, AnchorPoint } from '../types';

export const getElementCenter = (el: BoardElement): Point => {
  return {
    x: el.x + el.width / 2,
    y: el.y + el.height / 2
  };
};

export const getElementAnchors = (el: BoardElement): Record<string, AnchorPoint> => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  return {
    top: { id: 'top', x: cx, y: el.y },
    right: { id: 'right', x: el.x + el.width, y: cy },
    bottom: { id: 'bottom', x: cx, y: el.y + el.height },
    left: { id: 'left', x: el.x, y: cy },
    center: { id: 'center', x: cx, y: cy }
  };
};

export const distanceToPoint = (p1: Point, p2: Point): number => {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
};

export const getClosestAnchor = (
  point: Point,
  element: BoardElement
): { anchor: AnchorPoint; distance: number } => {
  const anchors = getElementAnchors(element);
  let minDistance = Infinity;
  let closest: AnchorPoint = anchors.center;

  Object.values(anchors).forEach(a => {
    const dist = distanceToPoint(point, a);
    if (dist < minDistance) {
      minDistance = dist;
      closest = a;
    }
  });

  return { anchor: closest, distance: minDistance };
};

export const getElementsInFrame = (frame: BoardElement, elements: BoardElement[]): BoardElement[] => {
  if (frame.type !== 'frame') return [];

  return elements.filter(el => {
    if (el.id === frame.id || el.type === 'frame') return false;
    return (
      el.x >= frame.x &&
      el.x + el.width <= frame.x + frame.width &&
      el.y >= frame.y &&
      el.y + el.height <= frame.y + frame.height
    );
  });
};
