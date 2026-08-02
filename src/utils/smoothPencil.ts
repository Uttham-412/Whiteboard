import { Point } from '../types';

/**
 * Catmull-Rom spline interpolation to turn raw mouse/touch input points into silky smooth curves.
 */
export const getSmoothedPoints = (points: Point[], samplesPerSegment = 6): Point[] => {
  if (points.length < 3) return points;

  const smoothed: Point[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    for (let t = 1; t <= samplesPerSegment; t++) {
      const u = t / samplesPerSegment;
      const u2 = u * u;
      const u3 = u2 * u;

      // Catmull-Rom matrix calculation
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
      );

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
      );

      smoothed.push({ x, y });
    }
  }

  return smoothed;
};

/**
 * Computes simulated stroke width based on drawing speed/velocity.
 */
export const getVelocityStrokeWidth = (p1: Point, p2: Point, baseWidth: number): number => {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  // Faster movements produce finer taper, slower movements produce richer strokes
  const velocityFactor = Math.max(0.4, Math.min(1.6, 15 / (dist + 5)));
  return baseWidth * velocityFactor;
};
