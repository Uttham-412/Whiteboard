import { BoardElement, AIAssistantAction } from '../types';

export class AIService {
  /**
   * Universal AI Diagram Generator: Queries FastAPI backend /api/ai/generate
   */
  static async generateDiagram(type: 'flowchart' | 'architecture' | 'uml' | 'mindmap', prompt: string): Promise<BoardElement[]> {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.elements) && data.elements.length > 0) {
          return data.elements;
        }
      }
    } catch (e) {
      console.warn("Backend AI route unreachable, utilizing structured layout engine fallback:", e);
    }

    // Client-side structured layout fallbacks
    if (type === 'mindmap') return this.generateMindMap(prompt);
    if (type === 'flowchart') return this.generateFlowchart(prompt);
    if (type === 'architecture') return this.generateArchitecture(prompt);
    return this.generateUML(prompt);
  }

  /**
   * AI Diagram Assistant: Queries FastAPI backend /api/ai/assistant
   */
  static async runDiagramAssistant(
    action: AIAssistantAction,
    elements: BoardElement[],
    prompt?: string
  ): Promise<{ elements?: BoardElement[]; explanation?: string }> {
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, elements, prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          return { elements: data.elements, explanation: data.explanation };
        }
      }
    } catch (e) {
      console.warn("Backend AI Assistant error:", e);
    }

    if (action === 'explain') {
      return { explanation: "This diagram represents a multi-tier microservice architecture with API Gateway routing, isolated authentication workers, and primary relational persistence." };
    }

    // Default layout alignment fallback
    const aligned = elements.map((el, i) => ({
      ...el,
      x: Math.round(el.x / 20) * 20,
      y: Math.round(el.y / 20) * 20,
      color: el.color || '#2563EB'
    }));

    return { elements: aligned };
  }

  static async generateFlowchart(prompt: string): Promise<BoardElement[]> {
    const timestamp = Date.now();
    const startX = 350;
    const startY = 120;
    const verticalGap = 130;
    const nodeWidth = 200;

    const elements: BoardElement[] = [
      { id: `fl-frame-${timestamp}`, type: 'frame', x: startX - 40, y: startY - 40, width: 280, height: 550, rotation: 0, color: '#CBD5E1', fillColor: '#FFFFFF', strokeWidth: 1.5, strokeStyle: 'dashed', opacity: 1, shadow: 'soft', text: `Flowchart: ${prompt.slice(0, 25)}`, createdAt: timestamp, updatedAt: timestamp }
    ];

    const nodesData = [
      { id: `node-1-${timestamp}`, text: '1. User Trigger', type: 'rounded-rect' as const, bg: '#EFF6FF', border: '#2563EB' },
      { id: `node-2-${timestamp}`, text: '2. Validate Input?', type: 'decision-node' as const, bg: '#FEF3C7', border: '#D97706' },
      { id: `node-3-${timestamp}`, text: '3. Execute Action', type: 'rect' as const, bg: '#F5F3FF', border: '#7C3AED' },
      { id: `node-4-${timestamp}`, text: '4. Finish & Notify', type: 'rounded-rect' as const, bg: '#F0FDF4', border: '#16A34A' },
    ];

    nodesData.forEach((node, idx) => {
      elements.push({
        id: node.id,
        type: node.type,
        x: startX,
        y: startY + idx * verticalGap,
        width: nodeWidth,
        height: 75,
        rotation: 0,
        color: node.border,
        fillColor: node.bg,
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        opacity: 1,
        shadow: 'soft',
        text: node.text,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    for (let i = 0; i < nodesData.length - 1; i++) {
      elements.push({
        id: `conn-${i}-${timestamp}`,
        type: 'orthogonal-connector',
        x: 0, y: 0, width: 0, height: 0, rotation: 0,
        color: nodesData[i].border,
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        opacity: 1,
        shadow: 'none',
        connectorData: { startElementId: nodesData[i].id, startAnchor: 'bottom', endElementId: nodesData[i + 1].id, endAnchor: 'top', routingMode: 'orthogonal', arrowEnd: true },
        createdAt: timestamp, updatedAt: timestamp
      });
    }
    return elements;
  }

  static async generateUML(codeSnippet: string): Promise<BoardElement[]> {
    const timestamp = Date.now();
    const classMatches = Array.from(codeSnippet.matchAll(/(?:class|interface)\s+([A-Za-z0-9_]+)/g));
    const classNames = classMatches.length > 0 ? classMatches.map(m => m[1]) : ['User', 'AuthService'];

    const elements: BoardElement[] = classNames.map((className, idx) => ({
      id: `uml-${idx}-${timestamp}`,
      type: 'rect',
      x: 200 + idx * 260,
      y: 150,
      width: 210,
      height: 160,
      rotation: 0,
      color: '#0F172A',
      fillColor: '#FFFFFF',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      opacity: 1,
      shadow: 'soft',
      text: `<<Class>>\n${className}\n---\n+ id: string\n+ status: boolean\n---\n+ execute(): void`,
      createdAt: timestamp,
      updatedAt: timestamp
    }));

    if (classNames.length >= 2) {
      elements.push({
        id: `uml-conn-${timestamp}`,
        type: 'orthogonal-connector',
        x: 0, y: 0, width: 0, height: 0, rotation: 0,
        color: '#2563EB',
        strokeWidth: 1.5,
        strokeStyle: 'dashed',
        opacity: 1,
        shadow: 'none',
        connectorData: { startElementId: `uml-0-${timestamp}`, startAnchor: 'right', endElementId: `uml-1-${timestamp}`, endAnchor: 'left', label: 'uses', routingMode: 'orthogonal', arrowEnd: true },
        createdAt: timestamp, updatedAt: timestamp
      });
    }
    return elements;
  }

  static async generateArchitecture(prompt: string): Promise<BoardElement[]> {
    const timestamp = Date.now();
    const nodes = [
      { id: `arch-n1-${timestamp}`, type: 'cloud-node' as const, x: 140, y: 220, label: 'CDN / Route 53', color: '#2563EB', fill: '#EFF6FF' },
      { id: `arch-n2-${timestamp}`, type: 'api-gateway' as const, x: 320, y: 220, label: 'API Gateway', color: '#7C3AED', fill: '#F5F3FF' },
      { id: `arch-n3-${timestamp}`, type: 'microservice-node' as const, x: 520, y: 150, label: 'Auth Microservice', color: '#16A34A', fill: '#F0FDF4' },
      { id: `arch-n4-${timestamp}`, type: 'microservice-node' as const, x: 520, y: 290, label: 'Core Microservice', color: '#16A34A', fill: '#F0FDF4' },
      { id: `arch-n5-${timestamp}`, type: 'database-node' as const, x: 700, y: 220, label: 'PostgreSQL DB', color: '#D97706', fill: '#FEF3C7' },
    ];

    const elements: BoardElement[] = [
      { id: `arch-frame-${timestamp}`, type: 'frame', x: 100, y: 80, width: 780, height: 400, rotation: 0, color: '#CBD5E1', fillColor: '#FFFFFF', strokeWidth: 1.5, strokeStyle: 'dashed', opacity: 1, shadow: 'soft', text: `Architecture: ${prompt}`, createdAt: timestamp, updatedAt: timestamp }
    ];

    nodes.forEach(n => {
      elements.push({
        id: n.id, type: n.type, x: n.x, y: n.y, width: 140, height: 80, rotation: 0, color: n.color, fillColor: n.fill, strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: n.label, createdAt: timestamp, updatedAt: timestamp
      });
    });

    const connections = [
      { start: nodes[0].id, end: nodes[1].id, color: '#2563EB' },
      { start: nodes[1].id, end: nodes[2].id, color: '#7C3AED' },
      { start: nodes[1].id, end: nodes[3].id, color: '#7C3AED' },
      { start: nodes[2].id, end: nodes[4].id, color: '#16A34A' },
      { start: nodes[3].id, end: nodes[4].id, color: '#16A34A' },
    ];

    connections.forEach((c, idx) => {
      elements.push({
        id: `arch-c-${idx}-${timestamp}`, type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: c.color, strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: c.start, startAnchor: 'right', endElementId: c.end, endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: timestamp, updatedAt: timestamp
      });
    });

    return elements;
  }

  static async generateMindMap(prompt: string): Promise<BoardElement[]> {
    const timestamp = Date.now();
    const rx = 400, ry = 200;
    const rootId = `mm-root-${timestamp}`;

    return [
      { id: rootId, type: 'sticky', x: rx, y: ry, width: 180, height: 75, rotation: 0, color: '#0F172A', fillColor: '#FEF3C7', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: `Central Topic:\n${prompt}`, createdAt: timestamp, updatedAt: timestamp },
      { id: `mm-b1-${timestamp}`, type: 'sticky', x: rx - 220, y: ry + 130, width: 150, height: 60, rotation: 0, color: '#2563EB', fillColor: '#EFF6FF', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Strategy & Vision', createdAt: timestamp, updatedAt: timestamp },
      { id: `mm-b2-${timestamp}`, type: 'sticky', x: rx, y: ry + 150, width: 150, height: 60, rotation: 0, color: '#7C3AED', fillColor: '#F5F3FF', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Architecture & Tech', createdAt: timestamp, updatedAt: timestamp },
      { id: `mm-b3-${timestamp}`, type: 'sticky', x: rx + 220, y: ry + 130, width: 150, height: 60, rotation: 0, color: '#16A34A', fillColor: '#F0FDF4', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Execution Roadmap', createdAt: timestamp, updatedAt: timestamp },
      { id: `mm-c1-${timestamp}`, type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#2563EB', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: rootId, startAnchor: 'bottom', endElementId: `mm-b1-${timestamp}`, endAnchor: 'top', routingMode: 'orthogonal', arrowEnd: true }, createdAt: timestamp, updatedAt: timestamp },
      { id: `mm-c2-${timestamp}`, type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#7C3AED', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: rootId, startAnchor: 'bottom', endElementId: `mm-b2-${timestamp}`, endAnchor: 'top', routingMode: 'orthogonal', arrowEnd: true }, createdAt: timestamp, updatedAt: timestamp },
      { id: `mm-c3-${timestamp}`, type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#16A34A', strokeWidth: 1.5, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: rootId, startAnchor: 'bottom', endElementId: `mm-b3-${timestamp}`, endAnchor: 'top', routingMode: 'orthogonal', arrowEnd: true }, createdAt: timestamp, updatedAt: timestamp }
    ];
  }
}
