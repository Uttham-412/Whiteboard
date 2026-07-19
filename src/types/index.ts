export type ElementType = 
  | 'pencil' 
  | 'brush' 
  | 'marker' 
  | 'highlighter' 
  | 'laser' 
  | 'text' 
  | 'sticky' 
  | 'arrow' 
  | 'curved-arrow' 
  | 'double-arrow' 
  | 'connector' 
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
  | 'image';

export type ToolType = ElementType | 'select' | 'hand' | 'eraser';

export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type ShadowStyle = 'none' | 'soft' | 'hard';
export type GridType = 'none' | 'dots' | 'lines';

export interface Point {
  x: number;
  y: number;
}

export interface TextStyles {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0-360
  
  // Freehand paths or multi-point shapes (lines, arrows)
  points?: Point[];
  
  // Custom styling
  color: string; // Border or stroke color
  fillColor?: string; // Solid or gradient code
  strokeWidth: number;
  strokeStyle: BorderStyle;
  opacity: number; // 0-1
  shadow: ShadowStyle;
  rounded?: boolean; // For rects
  aspectRatioLocked?: boolean;

  // Text details
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: TextStyles;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;

  // Image details
  src?: string; // Base64 or Firebase Storage url
  flipX?: boolean;
  flipY?: boolean;

  // Locking & Grouping
  locked?: boolean;
  groupId?: string;

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
