export interface AIShapeResult {
  type: 'rect' | 'circle' | 'triangle' | 'diamond' | 'arrow' | 'line' | 'star' | null;
  confidence: number;
}

export class AIService {
  /**
   * Generates a flowchart from a prompt (mocked endpoint returning positioned elements)
   */
  public static async generateFlowchart(prompt: string, startX = 300, startY = 300): Promise<any[]> {
    console.log(`AI Flowchart Generation requested for prompt: "${prompt}"`);
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));
    
    const elements: any[] = [];
    const baseId = 'ai-flow-' + Date.now().toString().slice(-4);
    
    // Default mock flowchart components based on standard prompts
    const steps = [
      { text: 'Start: ' + prompt.slice(0, 20), type: 'rect', rounded: true, color: '#6366f1' },
      { text: 'Analyze Criteria', type: 'diamond', color: '#f43f5e' },
      { text: 'Execute Plan A', type: 'rect', rounded: false, color: '#3b82f6' },
      { text: 'Finish Success', type: 'rect', rounded: true, color: '#10b981' }
    ];

    let currentY = startY;
    
    steps.forEach((step, idx) => {
      const elId = `${baseId}-${idx}`;
      const textId = `${baseId}-${idx}-text`;
      
      // Node Shape
      elements.push({
        id: elId,
        type: step.type,
        x: startX,
        y: currentY,
        width: 180,
        height: step.type === 'diamond' ? 120 : 60,
        rotation: 0,
        color: step.color,
        fillColor: `${step.color}15`,
        strokeWidth: 3,
        rounded: (step as any).rounded || false,
        lastEditedBy: 'AI Generator'
      });

      // Node Text
      elements.push({
        id: textId,
        type: 'text',
        x: startX + 10,
        y: currentY + (step.type === 'diamond' ? 50 : 20),
        width: 160,
        height: 20,
        rotation: 0,
        text: step.text,
        fontSize: 13,
        fontFamily: 'Outfit',
        align: 'center',
        color: step.color
      });

      // Connective Arrow to next node
      if (idx < steps.length - 1) {
        const nextY = currentY + (step.type === 'diamond' ? 120 : 60) + 60;
        elements.push({
          id: `${baseId}-arrow-${idx}`,
          type: 'arrow',
          x: startX + 90,
          y: currentY + (step.type === 'diamond' ? 120 : 60),
          width: 0,
          height: 0,
          points: [
            { x: startX + 90, y: currentY + (step.type === 'diamond' ? 120 : 60) },
            { x: startX + 90, y: nextY }
          ],
          color: '#94a3b8',
          strokeWidth: 2,
          strokeStyle: 'solid'
        });
        currentY = nextY;
      }
    });

    return elements;
  }

  /**
   * Generates a mindmap from a prompt
   */
  public static async generateMindmap(prompt: string, startX = 400, startY = 300): Promise<any[]> {
    console.log(`AI Mindmap Generation requested for prompt: "${prompt}"`);
    await new Promise(r => setTimeout(r, 1500));

    const elements: any[] = [];
    const baseId = 'ai-mm-' + Date.now().toString().slice(-4);
    
    // Core Central Node
    elements.push({
      id: `${baseId}-core`,
      type: 'ellipse',
      x: startX,
      y: startY,
      width: 180,
      height: 80,
      rotation: 0,
      color: '#a855f7',
      fillColor: 'rgba(168, 85, 247, 0.08)',
      strokeWidth: 3
    });
    elements.push({
      id: `${baseId}-core-text`,
      type: 'text',
      x: startX + 10,
      y: startY + 30,
      width: 160,
      height: 20,
      text: prompt,
      fontSize: 15,
      fontFamily: 'Outfit',
      fontStyle: { bold: true },
      align: 'center',
      color: '#a855f7'
    });

    // 4 Branches
    const branches = ['Marketing', 'Development', 'Product Design', 'Analytics'];
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // right, down, left, up
    const distance = 250;

    branches.forEach((branch, idx) => {
      const angle = angles[idx];
      const targetX = startX + Math.cos(angle) * distance;
      const targetY = startY + Math.sin(angle) * distance;
      const branchId = `${baseId}-branch-${idx}`;
      
      // Node
      elements.push({
        id: branchId,
        type: 'rounded-rect',
        x: targetX,
        y: targetY,
        width: 140,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
        fillColor: 'rgba(59, 130, 246, 0.05)',
        strokeWidth: 2
      });
      elements.push({
        id: `${branchId}-text`,
        type: 'text',
        x: targetX + 10,
        y: targetY + 15,
        width: 120,
        height: 20,
        text: branch,
        fontSize: 13,
        fontFamily: 'Outfit',
        align: 'center',
        color: '#3b82f6'
      });

      // Connector line
      elements.push({
        id: `${baseId}-conn-${idx}`,
        type: 'line',
        x: startX + 90,
        y: startY + 40,
        width: 0,
        height: 0,
        points: [
          { x: startX + 90, y: startY + 40 },
          { x: targetX + 70, y: targetY + 25 }
        ],
        color: '#d1d5db',
        strokeWidth: 2
      });
    });

    return elements;
  }

  /**
   * Summarizes a list of sticky note text contents
   */
  public static async summarizeStickyNotes(contents: string[]): Promise<string> {
    console.log("Summarizing sticky notes content:", contents);
    await new Promise(r => setTimeout(r, 1200));
    
    if (contents.length === 0) return "No content found to summarize.";
    
    return `📝 AI Summary Matrix:\n\n` + 
      `• Key Theme: Projects sync and delivery execution.\n` + 
      `• Core Strengths: Shipped design structures, responsive styles, clean tests.\n` + 
      `• Action Items: Refactor signal connectivity layers and implement fallback controllers.\n\n` +
      `[Summarized from ${contents.length} stickies]`;
  }

  /**
   * Performs OCR on an image (returns mock text block)
   */
  public static async ocrImage(imageName: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1000));
    return `[AI OCR text extraction from "${imageName}"]\n` +
           `Title: Technical Framework Notes\n` +
           `1. Scaled vector points\n` +
           `2. Dynamic UI layouts\n` +
           `3. Firebase credentials routing`;
  }

  /**
   * Heuristic shape recognition algorithm:
   * Classifies a series of coordinates into a geometric shape (rect, circle, triangle, line, arrow, diamond, star).
   */
  public static recognizeShape(points: { x: number; y: number }[]): AIShapeResult {
    if (points.length < 5) return { type: null, confidence: 0 };

    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const center = { x: minX + width / 2, y: minY + height / 2 };

    if (width < 10 || height < 10) return { type: null, confidence: 0 };

    // Compute stats
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const startEndDist = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

    // Is it a straight line or an open path?
    const totalPathLength = points.reduce((acc, p, i) => {
      if (i === 0) return 0;
      return acc + Math.hypot(p.x - points[i-1].x, p.y - points[i-1].y);
    }, 0);

    const lineRatio = startEndDist / totalPathLength;
    const isClosed = lineRatio < 0.25; // Loop closed back on itself

    // 1. Check for simple straight line
    if (!isClosed && lineRatio > 0.85 && points.length < 30) {
      // Check if it's an arrow (e.g. rapid changes at the end of the stroke might signify drawing a head, 
      // but for basic heuristic we label line).
      return { type: 'line', confidence: 0.9 };
    }

    // 2. Closed shapes heuristics
    if (isClosed || points.length > 20) {
      // Calculate distances from center to all points
      const distances = points.map(p => Math.hypot(p.x - center.x, p.y - center.y));
      const meanDistance = distances.reduce((acc, d) => acc + d, 0) / distances.length;
      const variance = distances.reduce((acc, d) => acc + Math.pow(d - meanDistance, 2), 0) / distances.length;
      const stdDev = Math.sqrt(variance);
      const devRatio = stdDev / meanDistance;

      // Circle has a very low variation in distance from center
      if (devRatio < 0.12) {
        return { type: 'circle', confidence: 0.85 - devRatio };
      }

      // Check for triangle: generally has 3 corners (vertices).
      // We can look at direction changes (angles) between lines.
      // But a simpler, reliable bounding box fill check:
      // A rectangle fills about ~100% of its bounding box.
      // A circle fills ~78% (pi/4).
      // A triangle fills ~50%.
      // A diamond fills ~50%.
      // Let's do corner counts using simplified Ramer-Douglas-Peucker (RDP) or simple directional analysis.
      // Let's count corners by checking local curvature peaks.
      let cornersCount = 0;
      for (let i = 2; i < points.length - 2; i += 2) {
        const p1 = points[i - 2];
        const p2 = points[i];
        const p3 = points[i + 2];
        
        const a1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const a2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        let diff = Math.abs(a2 - a1);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        
        if (diff > 0.6) { // Large angle change
          cornersCount++;
        }
      }

      // If corners are about 3, it's a triangle
      if (cornersCount >= 2 && cornersCount <= 4 && !isClosed) {
        return { type: 'triangle', confidence: 0.7 };
      }

      // Check if it fits a diamond (aspect ratio close to 1, points concentrated on axes)
      // Check coordinates of points compared to diamond shape boundary
      let diamondError = 0;
      points.forEach(p => {
        // normalized position from -1 to 1 relative to center
        const dx = (p.x - center.x) / (width / 2);
        const dy = (p.y - center.y) / (height / 2);
        // Diamond formula: |dx| + |dy| = 1
        const err = Math.abs(Math.abs(dx) + Math.abs(dy) - 1.0);
        diamondError += err;
      });
      const avgDiamondError = diamondError / points.length;

      if (avgDiamondError < 0.22) {
        return { type: 'diamond', confidence: 0.85 };
      }

      // Check if it fits a rectangle (coordinates should align with min/max bounds)
      let rectError = 0;
      points.forEach(p => {
        const dx = Math.abs(p.x - center.x) / (width / 2);
        const dy = Math.abs(p.y - center.y) / (height / 2);
        // Rectangle formula: max(|dx|, |dy|) = 1
        const err = 1.0 - Math.max(dx, dy);
        rectError += err;
      });
      const avgRectError = rectError / points.length;

      if (avgRectError < 0.25) {
        return { type: 'rect', confidence: 0.8 };
      }
    }

    // Default to brush path (null means no shape match, draw standard pencil lines)
    return { type: null, confidence: 0 };
  }
}
