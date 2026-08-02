export type ElementType = 
  // Freehand drawing tools
  | 'pencil' 
  | 'brush' 
  | 'marker' 
  | 'highlighter' 
  | 'calligraphy'
  | 'laser' 
  // Standard shapes
  | 'rect' 
  | 'rounded-rect' 
  | 'circle' 
  | 'ellipse' 
  | 'triangle' 
  | 'diamond' 
  | 'hexagon' 
  | 'pentagon' 
  | 'star' 
  | 'line' 
  // Connectors & Arrows
  | 'arrow' 
  | 'curved-arrow' 
  | 'double-arrow' 
  | 'connector' 
  | 'orthogonal-connector'
  // Text & Sticky
  | 'text' 
  | 'sticky' 
  // Specialized Diagram Nodes (Cloud, Flowchart, UML, Architecture, Microservice, DB)
  | 'cloud-node'
  | 'server-node'
  | 'database-node'
  | 'queue-node'
  | 'api-gateway'
  | 'microservice-node'
  | 'uml-class'
  | 'uml-actor'
  | 'uml-state'
  | 'bpmn-task'
  | 'bpmn-gateway'
  | 'bpmn-event'
  | 'sequence-lifeline'
  | 'decision-node'
  | 'document-node'
  | 'subprocess-node'
  | 'k8s-pod'
  | 'docker-container'
  | 'mindmap-node'
  // Advanced Objects
  | 'frame'
  | 'table'
  | 'code-block'
  | 'math-formula'
  | 'video-embed'
  | 'website-embed'
  | 'image';

export type AIAssistantAction = 'improve' | 'add_missing' | 'optimize_layout' | 'explain' | 'convert';

export type ToolType = ElementType | 'select' | 'hand' | 'eraser' | 'frame' | 'laser';

export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type ShadowStyle = 'none' | 'soft' | 'hard';
export type GridType = 'none' | 'dots' | 'lines' | 'blueprint' | 'graph' | 'paper' | 'blank';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface TextStyles {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

export interface AnchorPoint {
  id: 'top' | 'right' | 'bottom' | 'left' | 'center';
  x: number;
  y: number;
}

export interface SmartConnectorData {
  startElementId?: string;
  startAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  endElementId?: string;
  endAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  label?: string;
  routingMode?: 'straight' | 'orthogonal' | 'curved';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface TableData {
  rows: number;
  cols: number;
  data: string[][];
}

export interface CodeBlockData {
  language: string;
  code: string;
}

export interface MathFormulaData {
  latex: string;
}

export interface EmbedData {
  url: string;
  title?: string;
  provider?: 'youtube' | 'vimeo' | 'generic';
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0-360 degrees
  
  // Freehand path points or multi-point lines
  points?: Point[];
  
  // Styling
  color: string; // Stroke / Text / Main border color
  fillColor?: string; // Interior fill code
  strokeWidth: number;
  strokeStyle: BorderStyle;
  opacity: number; // 0-1
  shadow: ShadowStyle;
  rounded?: boolean;
  aspectRatioLocked?: boolean;

  // Text details
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: TextStyles;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;

  // Sticky Note specific
  stickyColor?: string;

  // Image details
  src?: string;
  flipX?: boolean;
  flipY?: boolean;

  // Smart Connector Metadata
  connectorData?: SmartConnectorData;

  // Specialized Object Data
  tableData?: TableData;
  codeBlockData?: CodeBlockData;
  mathFormulaData?: MathFormulaData;
  embedData?: EmbedData;

  // Layering, Grouping & Frames
  locked?: boolean;
  visible?: boolean; // Layer visibility toggle
  groupId?: string;
  frameId?: string; // Id of parent frame container
  colorTag?: string; // Layer color label (e.g., #2563EB)
  name?: string; // Custom layer name

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastEditedBy?: string;
}

export interface CanvasComment {
  id: string;
  boardId: string;
  x: number;
  y: number;
  text: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: number;
  resolved?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface BoardVersion {
  id: string;
  boardId: string;
  elements: BoardElement[];
  createdAt: number;
  createdBy: string;
  tagName?: string;
}

export interface BoardFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface BoardMetadata {
  id: string;
  title: string;
  ownerId: string;
  starred: boolean;
  folderId: string | null;
  updatedAt: number;
  createdAt: number;
  thumbnail?: string;
}
