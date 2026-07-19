import React, { useRef, useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import { 
  screenToWorld, worldToScreen, drawGrid, drawElement, 
  hitTestElement, getElementsInBox, getSelectionBoundingBox, 
  getHandleAtPosition, snapTo, getSmartGuides, ResizeHandle, AlignmentGuide 
} from './canvasEngine';
import { Minimap } from './Minimap';
import { BoardElement, ElementType, ToolType, Point } from '../../types';
import { WebRTCManager } from '../../services/webRTC';
import { AIService } from '../../services/ai';
import { 
  MousePointer, Hand, Edit, CheckSquare, Layers, 
  ZoomIn, ZoomOut, Maximize, RotateCcw, Save, Trash2, 
  ChevronRight, Circle, Square, Type, StickyNote, ArrowRight,
  Maximize2, Minimize2, Copy, Lock, Unlock, Users, MessageSquare,
  Sparkles, Download, Upload, Clock, Check, Workflow, Spline, Zap, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const CanvasViewport: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rtcManagerRef = useRef<WebRTCManager | null>(null);

  const { user } = useAuthStore();
  const { toast } = useToast();

  // Pull Zustand Store state & actions
  const {
    elements, selectedElementIds, tool, brushColor, fillColor, strokeWidth, 
    strokeStyle, opacity, shadowStyle, scale, panX, panY, 
    boardId, boardTitle, gridType, snapToGrid, smartGuides, backgroundColor,
    cursors, saving, versions,
    setTool, setBrushColor, setFillColor, setStrokeWidth, setGridType,
    setShadowStyle, setElements, addElement, updateElement,
    deleteSelectedElements, duplicateSelectedElements, selectElements, 
    clearSelection, bringForward, sendBackward, zoom, pan, resetViewport, 
    undo, redo, copySelected, pasteCopied, saveBoard, renameBoard,
    updateCursor, clearCursors, createVersion, restoreVersion
  } = useCanvasStore();

  // Internal interaction state
  const [action, setAction] = useState<'none' | 'drawing' | 'dragging' | 'resizing' | 'rotating' | 'panning' | 'selecting'>('none');
  const [startPan, setStartPan] = useState<Point>({ x: 0, y: 0 });
  const [startPointer, setStartPointer] = useState<Point>({ x: 0, y: 0 });
  const [drawStart, setDrawStart] = useState<Point>({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [activePencilPoints, setActivePencilPoints] = useState<Point[]>([]);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [initialResizeBox, setInitialResizeBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [smartGuideLines, setSmartGuideLines] = useState<AlignmentGuide[]>([]);

  // Laser pointer — transient fading trail (world-space points with timestamps)
  const laserPointsRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const [laserTick, setLaserTick] = useState(0); // trigger re-render on trail update
  const LASER_FADE_MS = 900;

  // UI Drawer / Panel states
  const [showStylePanel, setShowStylePanel] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [showCommentModal, setShowCommentModal] = useState<Point | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [versionTagName, setVersionTagName] = useState('');

  // Inline editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textEditValue, setTextEditValue] = useState('');
  const [textEditPos, setTextEditPos] = useState<Point>({ x: 0, y: 0 });

  // Images loading cache
  const [imagesCache, setImagesCache] = useState<Record<string, HTMLImageElement>>({});

  // Establish WebRTC Signaling connection
  useEffect(() => {
    if (!boardId || !user) return;
    const colors = ['#6366f1', '#f43f5e', '#10b981', '#22d3ee', '#eab308', '#a855f7'];
    const userColor = colors[Math.abs(user.uid.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];

    rtcManagerRef.current = new WebRTCManager(boardId, user.uid, user.displayName, userColor, user.photoURL);
    rtcManagerRef.current.connect();

    // Bind event hooks
    rtcManagerRef.current.onCursorUpdate = (cursor) => {
      updateCursor(cursor.userId, cursor);
    };

    rtcManagerRef.current.onDrawCommand = (cmd) => {
      // Direct execute real-time edits
      if (cmd.type === 'addElement') {
        setElements([...elements, cmd.element], false);
      } else if (cmd.type === 'updateElement') {
        updateElement(cmd.id, cmd.updates);
      }
    };

    rtcManagerRef.current.onChatMessage = (msg) => {
      useCanvasStore.getState().receiveChatMessage(msg);
    };

    // Auto-save setup every 4 seconds
    const saveTimer = setInterval(() => {
      saveBoard();
    }, 4000);

    return () => {
      rtcManagerRef.current?.disconnect();
      clearInterval(saveTimer);
      clearCursors();
    };
  }, [boardId, user]);

  // Load and cache images
  useEffect(() => {
    elements.forEach(el => {
      if (el.type === 'image' && el.src && !imagesCache[el.src]) {
        const img = new Image();
        img.src = el.src;
        img.onload = () => {
          setImagesCache(prev => ({ ...prev, [el.src!]: img }));
        };
      }
    });
  }, [elements]);

  // Infinite Canvas Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions dynamically based on container size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    let animationFrameId: number;

    const render = () => {
      // Clear viewport
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw grid (zoomed/panned)
      drawGrid(ctx, canvas.width, canvas.height, panX, panY, scale, gridType, document.body.classList.contains('blueprint'));

      // Apply camera zoom/pan offsets to drawing coordinates
      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

      // 2. Draw all Board Elements
      elements.forEach((el) => {
        drawElement(ctx, el, imagesCache);
      });

      // 3. Draw active pencil path preview
      if (action === 'drawing' && activePencilPoints.length > 1 && ['pencil', 'brush', 'marker', 'highlighter'].includes(tool)) {
        ctx.save();
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = strokeWidth;
        if (tool === 'highlighter') {
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = strokeWidth * 6;
        } else if (tool === 'brush') {
          ctx.lineWidth = strokeWidth * 3;
        } else if (tool === 'marker') {
          ctx.lineWidth = strokeWidth * 2.2;
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(activePencilPoints[0].x, activePencilPoints[0].y);
        for (let i = 1; i < activePencilPoints.length - 1; i++) {
          const xc = (activePencilPoints[i].x + activePencilPoints[i + 1].x) / 2;
          const yc = (activePencilPoints[i].y + activePencilPoints[i + 1].y) / 2;
          ctx.quadraticCurveTo(activePencilPoints[i].x, activePencilPoints[i].y, xc, yc);
        }
        ctx.lineTo(activePencilPoints[activePencilPoints.length - 1].x, activePencilPoints[activePencilPoints.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw preview shape (e.g. circles, lines, rects during initial dragging draw)
      if (action === 'drawing' && !['pencil', 'brush', 'marker', 'highlighter', 'text', 'sticky', 'select', 'eraser'].includes(tool)) {
        const dummyEl: BoardElement = {
          id: 'preview',
          type: tool as ElementType,
          x: Math.min(drawStart.x, startPointer.x),
          y: Math.min(drawStart.y, startPointer.y),
          width: Math.abs(startPointer.x - drawStart.x),
          height: Math.abs(startPointer.y - drawStart.y),
          points: [drawStart, startPointer],
          rotation: 0,
          color: brushColor,
          fillColor,
          strokeWidth,
          strokeStyle,
          opacity,
          shadow: shadowStyle,
          createdAt: 0,
          updatedAt: 0
        };
        drawElement(ctx, dummyEl, imagesCache);
      }

      // 5. Draw Selection bounding Box and resize/rotate handles
      const selectBox = getSelectionBoundingBox(selectedElementIds, elements);
      if (selectBox && tool === 'select') {
        ctx.save();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5 / scale;
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.strokeRect(selectBox.x, selectBox.y, selectBox.width, selectBox.height);

        // Draw handles at corners & midpoints
        const handleSize = 7 / scale;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([]);

        const points = [
          { x: selectBox.x, y: selectBox.y }, // NW
          { x: selectBox.x + selectBox.width, y: selectBox.y }, // NE
          { x: selectBox.x + selectBox.width, y: selectBox.y + selectBox.height }, // SE
          { x: selectBox.x, y: selectBox.y + selectBox.height }, // SW
          { x: selectBox.x + selectBox.width / 2, y: selectBox.y }, // N
          { x: selectBox.x + selectBox.width / 2, y: selectBox.y + selectBox.height }, // S
          { x: selectBox.x, y: selectBox.y + selectBox.height / 2 }, // W
          { x: selectBox.x + selectBox.width, y: selectBox.y + selectBox.height / 2 }, // E
        ];

        points.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Rotation stem and handle
        const rotX = selectBox.x + selectBox.width / 2;
        const rotY = selectBox.y - 24 / scale;
        ctx.beginPath();
        ctx.moveTo(rotX, selectBox.y);
        ctx.lineTo(rotX, rotY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rotX, rotY, handleSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 6. Draw local smart guides
      if (smartGuides && smartGuideLines.length > 0 && action === 'dragging') {
        ctx.save();
        ctx.strokeStyle = '#ec4899'; // Hot pink guide lines
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([6 / scale, 6 / scale]);
        
        smartGuideLines.forEach(guide => {
          ctx.beginPath();
          if (guide.x !== undefined) {
            ctx.moveTo(guide.x, -5000);
            ctx.lineTo(guide.x, 5000);
          }
          if (guide.y !== undefined) {
            ctx.moveTo(-5000, guide.y);
            ctx.lineTo(5000, guide.y);
          }
          ctx.stroke();
        });
        ctx.restore();
      }

      // 7. Draw other collaborators' live cursors
      Object.keys(cursors).forEach(uid => {
        const cursor = cursors[uid];
        ctx.save();
        ctx.fillStyle = cursor.color;
        
        // Render pointer triangle
        ctx.beginPath();
        ctx.moveTo(cursor.x, cursor.y);
        ctx.lineTo(cursor.x + 12 / scale, cursor.y + 12 / scale);
        ctx.lineTo(cursor.x + 4 / scale, cursor.y + 15 / scale);
        ctx.closePath();
        ctx.fill();

        // Render name tag below pointer
        ctx.fillStyle = cursor.color;
        ctx.font = `${10 / scale}px Outfit`;
        ctx.fillText(cursor.name, cursor.x + 8 / scale, cursor.y + 24 / scale);
        ctx.restore();
      });

      // 8. Draw selection dragged outline
      if (action === 'selecting' && selectionBox) {
        ctx.save();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
        ctx.lineWidth = 1 / scale;
        const sx = Math.min(selectionBox.x1, selectionBox.x2);
        const sy = Math.min(selectionBox.y1, selectionBox.y2);
        const sw = Math.abs(selectionBox.x2 - selectionBox.x1);
        const sh = Math.abs(selectionBox.y2 - selectionBox.y1);
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.restore();
      }

      // 9. Draw laser pointer trail (fading neon red glow)
      const now = Date.now();
      const laserPts = laserPointsRef.current.filter(p => now - p.t < LASER_FADE_MS);
      laserPointsRef.current = laserPts;
      if (laserPts.length > 1) {
        for (let i = 1; i < laserPts.length; i++) {
          const age = now - laserPts[i].t;
          const alpha = Math.max(0, 1 - age / LASER_FADE_MS);
          const size = (3 + (1 - alpha) * 2) / scale;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#f87171';
          ctx.shadowBlur = 8 / scale;
          ctx.beginPath();
          ctx.moveTo(laserPts[i - 1].x, laserPts[i - 1].y);
          ctx.lineTo(laserPts[i].x, laserPts[i].y);
          ctx.stroke();
          ctx.restore();
        }
        // Bright dot at tip
        const tip = laserPts[laserPts.length - 1];
        ctx.save();
        ctx.fillStyle = '#fca5a5';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12 / scale;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4 / scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // Restore camera zooms

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [elements, activePencilPoints, selectionBox, scale, panX, panY, selectedElementIds, tool, brushColor, fillColor, strokeWidth, strokeStyle, opacity, shadowStyle, cursors, smartGuideLines, gridType, backgroundColor, laserTick]);

  // Pointer interactions handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate world coordinates
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPoint = screenToWorld(sx, sy, panX, panY, scale);
    
    setStartPointer(worldPoint);
    setDrawStart(worldPoint);

    // Context comments modal checker
    if (showCommentModal) {
      setShowCommentModal(null);
      return;
    }

    // 1. Hand tool / Space drag panning
    if (tool === 'hand' || e.button === 1 || e.shiftKey) {
      setAction('panning');
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }

    // 2. Select tool options
    if (tool === 'select') {
      // Check handles intersection
      const selectBox = getSelectionBoundingBox(selectedElementIds, elements);
      if (selectBox && selectedElementIds.length === 1) {
        const matchedEl = elements.find(el => el.id === selectedElementIds[0]);
        if (matchedEl && !matchedEl.locked) {
          const handle = getHandleAtPosition(worldPoint.x, worldPoint.y, matchedEl, scale);
          if (handle) {
            setAction(handle === 'rotation' ? 'rotating' : 'resizing');
            setResizeHandle(handle);
            setInitialResizeBox({
              x: matchedEl.x,
              y: matchedEl.y,
              width: matchedEl.width,
              height: matchedEl.height
            });
            return;
          }
        }
      }

      // Check shape click hit test
      // Start testing from top element layer down (reverse array search)
      const hitElement = [...elements].reverse().find(el => hitTestElement(worldPoint.x, worldPoint.y, el));
      
      if (hitElement) {
        // Double-click to edit text elements
        if (e.detail === 2 && hitElement.type === 'text') {
          setEditingTextId(hitElement.id);
          setTextEditValue(hitElement.text || '');
          setTextEditPos({ x: hitElement.x, y: hitElement.y });
          return;
        }

        if (e.ctrlKey || e.metaKey) {
          // Add/remove from selection list
          if (selectedElementIds.includes(hitElement.id)) {
            selectElements(selectedElementIds.filter(id => id !== hitElement.id));
          } else {
            selectElements([...selectedElementIds, hitElement.id]);
          }
        } else {
          // Select only this item if not already selected
          if (!selectedElementIds.includes(hitElement.id)) {
            selectElements([hitElement.id]);
          }
        }

        if (!hitElement.locked) {
          setAction('dragging');
          setDragOffset({
            x: worldPoint.x - hitElement.x,
            y: worldPoint.y - hitElement.y
          });
        }
      } else {
        // Clear selection, begin drag-select box
        clearSelection();
        setAction('selecting');
        setSelectionBox({
          x1: worldPoint.x,
          y1: worldPoint.y,
          x2: worldPoint.x,
          y2: worldPoint.y
        });
      }
      return;
    }

    // 3. Comments tool anchoring
    if (tool === 'text' && e.ctrlKey) {
      setShowCommentModal(worldPoint);
      return;
    }

    // 4. Laser pointer — no persistent element, just track trail
    if (tool === 'laser') {
      laserPointsRef.current = [{ ...worldPoint, t: Date.now() }];
      setLaserTick(t => t + 1);
      return;
    }

    // 5. Drawing shapes/pencils actions
    setAction('drawing');
    if (['pencil', 'brush', 'marker', 'highlighter'].includes(tool)) {
      setActivePencilPoints([worldPoint]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPoint = screenToWorld(sx, sy, panX, panY, scale);

    // Send cursor position over WebRTC channel
    if (rtcManagerRef.current && user) {
      rtcManagerRef.current.broadcastCursor(worldPoint.x, worldPoint.y);
    }

    setStartPointer(worldPoint);

    if (action === 'panning') {
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      pan(dx, dy);
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }

    if (action === 'selecting') {
      setSelectionBox(prev => prev ? { ...prev, x2: worldPoint.x, y2: worldPoint.y } : null);
      return;
    }

    // Laser trail update (not an action state, check tool directly)
    if (tool === 'laser') {
      laserPointsRef.current.push({ ...worldPoint, t: Date.now() });
      // Keep only last 80 points for performance
      if (laserPointsRef.current.length > 80) laserPointsRef.current.shift();
      setLaserTick(t => t + 1);
    }

    if (action === 'drawing') {
      if (['pencil', 'brush', 'marker', 'highlighter'].includes(tool)) {
        setActivePencilPoints(prev => [...prev, worldPoint]);
      }
      return;
    }

    if (action === 'dragging' && selectedElementIds.length > 0) {
      const targetEl = elements.find(el => el.id === selectedElementIds[0]);
      if (!targetEl || targetEl.locked) return;

      let newX = worldPoint.x - dragOffset.x;
      let newY = worldPoint.y - dragOffset.y;

      // Snap to Grid trigger
      if (snapToGrid) {
        newX = snapTo(newX, 20);
        newY = snapTo(newY, 20);
      }

      // Smart Alignment Guides check (single selection dragging)
      if (smartGuides && selectedElementIds.length === 1) {
        const others = elements.filter(el => el.id !== targetEl.id);
        const copyEl = { ...targetEl, x: newX, y: newY };
        const snapResults = getSmartGuides(copyEl, others);
        newX = snapResults.snappedX;
        newY = snapResults.snappedY;
        setSmartGuideLines(snapResults.guides);
      }

      // Apply coordinates offset shift to selection elements
      const dx = newX - targetEl.x;
      const dy = newY - targetEl.y;

      setElements(elements.map(el => {
        if (selectedElementIds.includes(el.id)) {
          const updatedEl = {
            ...el,
            x: el.x + dx,
            y: el.y + dy,
            updatedAt: Date.now()
          };
          if (el.points) {
            updatedEl.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          }
          // Notify peer updates
          rtcManagerRef.current?.broadcastDrawCommand({
            type: 'updateElement',
            id: el.id,
            updates: { x: updatedEl.x, y: updatedEl.y, points: updatedEl.points }
          });
          return updatedEl;
        }
        return el;
      }), false); // Skip record history during continuous drag updates
      return;
    }

    if (action === 'resizing' && selectedElementIds.length === 1 && initialResizeBox) {
      const targetEl = elements.find(el => el.id === selectedElementIds[0]);
      if (!targetEl || targetEl.locked) return;

      let dx = worldPoint.x - drawStart.x;
      let dy = worldPoint.y - drawStart.y;
      
      let newX = targetEl.x;
      let newY = targetEl.y;
      let newW = targetEl.width;
      let newH = targetEl.height;

      // Simplistic cardinal boundary math resize
      if (resizeHandle?.includes('e')) {
        newW = Math.max(10, initialResizeBox.width + dx);
      }
      if (resizeHandle?.includes('s')) {
        newH = Math.max(10, initialResizeBox.height + dy);
      }
      if (resizeHandle?.includes('w')) {
        newW = Math.max(10, initialResizeBox.width - dx);
        newX = initialResizeBox.x + dx;
      }
      if (resizeHandle?.includes('n')) {
        newH = Math.max(10, initialResizeBox.height - dy);
        newY = initialResizeBox.y + dy;
      }

      // Aspect ratio lock (Shift modifier)
      if (e.shiftKey) {
        const ratio = initialResizeBox.width / initialResizeBox.height;
        if (newW / newH > ratio) {
          newH = newW / ratio;
        } else {
          newW = newH * ratio;
        }
      }

      updateElement(targetEl.id, { x: newX, y: newY, width: newW, height: newH });
      
      rtcManagerRef.current?.broadcastDrawCommand({
        type: 'updateElement',
        id: targetEl.id,
        updates: { x: newX, y: newY, width: newW, height: newH }
      });
      return;
    }

    if (action === 'rotating' && selectedElementIds.length === 1) {
      const targetEl = elements.find(el => el.id === selectedElementIds[0]);
      if (!targetEl || targetEl.locked) return;

      const cx = targetEl.x + targetEl.width / 2;
      const cy = targetEl.y + targetEl.height / 2;
      
      // Compute angle
      const angleRad = Math.atan2(worldPoint.y - cy, worldPoint.x - cx);
      let angleDeg = (angleRad * 180) / Math.PI + 90; // Add 90 offset to snap upwards rotation point
      if (angleDeg < 0) angleDeg += 360;

      // Snap rotation to 15deg segments if Shift is held
      if (e.shiftKey) {
        angleDeg = snapTo(angleDeg, 15);
      }

      updateElement(targetEl.id, { rotation: angleDeg });
      rtcManagerRef.current?.broadcastDrawCommand({
        type: 'updateElement',
        id: targetEl.id,
        updates: { rotation: angleDeg }
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setAction('none');
    setSmartGuideLines([]);

    if (action === 'selecting' && selectionBox) {
      const ids = getElementsInBox(selectionBox.x1, selectionBox.y1, selectionBox.x2, selectionBox.y2, elements);
      selectElements(ids);
      setSelectionBox(null);
    }

    if (action === 'drawing') {
      const elId = 'el-' + Math.random().toString(36).substring(2, 9);
      
      let newElement: BoardElement | null = null;

      if (['pencil', 'brush', 'marker', 'highlighter'].includes(tool)) {
        if (activePencilPoints.length < 3) {
          setActivePencilPoints([]);
          return;
        }

        // Test Geometric Shape Recognition Algorithm!
        const recognized = AIService.recognizeShape(activePencilPoints);
        if (recognized.type && recognized.confidence > 0.72) {
          // Bounding dimensions
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          activePencilPoints.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });

          newElement = {
            id: elId,
            type: recognized.type,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rotation: 0,
            color: brushColor,
            fillColor,
            strokeWidth,
            strokeStyle,
            opacity,
            shadow: shadowStyle,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          toast("AI Shape Recognized!", `Morphed stroke to perfect ${recognized.type}.`, "ai");
        } else {
          // Keep handdrawn stroke
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          activePencilPoints.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });

          newElement = {
            id: elId,
            type: 'pencil', // standard freehand
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            points: activePencilPoints,
            rotation: 0,
            color: brushColor,
            strokeWidth,
            strokeStyle,
            opacity,
            shadow: shadowStyle,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
        }
        setActivePencilPoints([]);
      } else if (tool === 'text') {
        // Show inline editor
        setEditingTextId(elId);
        setTextEditValue('');
        setTextEditPos(startPointer);
        
        // Add element placeholder
        newElement = {
          id: elId,
          type: 'text',
          x: startPointer.x,
          y: startPointer.y,
          width: 150,
          height: 30,
          rotation: 0,
          text: '',
          color: brushColor,
          fontFamily: 'Outfit',
          fontSize: 18,
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          shadow: 'none',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      } else if (tool === 'sticky') {
        newElement = {
          id: elId,
          type: 'sticky',
          x: startPointer.x - 80,
          y: startPointer.y - 80,
          width: 160,
          height: 160,
          rotation: -1 + Math.random() * 2, // Slight organic rotation tilt
          text: 'Double click to edit note',
          color: '#854d0e',
          fillColor: fillColor === 'transparent' ? '#fef08a' : fillColor, // default yellow sticky note
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          shadow: 'soft',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      } else {
        // Shapes (rect, circle, arrow, line, star)
        let minX = Math.min(drawStart.x, startPointer.x);
        let minY = Math.min(drawStart.y, startPointer.y);
        let width = Math.abs(startPointer.x - drawStart.x);
        let height = Math.abs(startPointer.y - drawStart.y);

        if (width < 3 && height < 3) return; // avoid drawing empty zero-size shapes

        newElement = {
          id: elId,
          type: tool as ElementType,
          x: minX,
          y: minY,
          width,
          height,
          points: [drawStart, startPointer],
          rotation: 0,
          color: brushColor,
          fillColor,
          strokeWidth,
          strokeStyle,
          opacity,
          shadow: shadowStyle,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }

      if (newElement) {
        addElement(newElement);
        rtcManagerRef.current?.broadcastDrawCommand({
          type: 'addElement',
          element: newElement
        });
      }
    }
  };

  // Touch pinch to zoom gesture handler
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      setAction('panning');
      // Calculate mid points
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      setStartPan({
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && action === 'panning') {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const midX = (p1.clientX + p2.clientX) / 2;
      const midY = (p1.clientY + p2.clientY) / 2;
      
      const dx = midX - startPan.x;
      const dy = midY - startPan.y;
      
      pan(dx, dy);
      setStartPan({ x: midX, y: midY });
    }
  };

  // Keyboard hooks mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys triggers while editing text inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
          toast("History", "Redone change.", "info", 1500);
        } else {
          undo();
          toast("History", "Undone last action.", "info", 1500);
        }
      }
      else if (ctrl && e.key.toLowerCase() === 'c') {
        copySelected();
        toast("Clipboard", "Elements copied to clipboard.", "info", 1500);
      }
      else if (ctrl && e.key.toLowerCase() === 'v') {
        pasteCopied();
        toast("Clipboard", "Pasted elements.", "info", 1500);
      }
      else if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedElements();
        toast("Duplicate", "Selection duplicated.", "info", 1500);
      }
      else if (ctrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectElements(elements.map(el => el.id));
      }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedElements();
        toast("Delete", "Removed elements.", "info", 1500);
      }
      else if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveBoard();
        toast("Save", "Board state saved successfully.", "success", 1500);
      }
      else if (e.key === ' ') {
        // Toggle hand cursor pan and prevent screen jump
        e.preventDefault();
        setTool('hand');
      }
      // Single-key tool shortcuts (not ctrl)
      else if (!ctrl && !e.shiftKey) {
        const toolMap: Record<string, string> = {
          v: 'select', s: 'select', h: 'hand',
          p: 'pencil', r: 'rect', c: 'circle',
          a: 'arrow', t: 'text', n: 'sticky', l: 'laser'
        };
        if (toolMap[e.key.toLowerCase()]) {
          setTool(toolMap[e.key.toLowerCase()] as any);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementIds, elements, tool, copySelected, pasteCopied, undo, redo]);

  // Smooth wheel zoom and pan handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Smooth Zoom centered at cursor
        const zoomFactor = 1.08;
        const factor = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        zoom(factor, clientX, clientY);
      } else {
        // Smooth Pan based on scroll delta
        pan(-e.deltaX, -e.deltaY);
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan]);

  // Image File Uploader parsing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const elId = 'image-' + Math.random().toString(36).substring(2, 9);
        const newEl: BoardElement = {
          id: elId,
          type: 'image',
          x: 200,
          y: 200,
          width: img.width > 500 ? 500 : img.width,
          height: img.width > 500 ? (img.height * (500 / img.width)) : img.height,
          rotation: 0,
          color: '#ffffff',
          strokeWidth: 0,
          strokeStyle: 'solid',
          opacity: 1,
          shadow: 'none',
          src: base64,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        addElement(newEl);
        rtcManagerRef.current?.broadcastDrawCommand({
          type: 'addElement',
          element: newEl
        });
        setImageUploadLoading(false);
        toast("Image Uploaded", "Successfully placed image on workspace canvas.", "success");
      };
    };
    reader.readAsDataURL(file);
  };

  // Export board modules
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Confetti burst for premium touch!
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });

    const link = document.createElement('a');
    link.download = `${boardTitle.replace(/\s+/g, '_')}_export.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast("Export Success", "Downloaded high-res PNG canvas file.", "success");
  };

  // Export board as JSON (preserves all element data for re-import)
  const handleExportJSON = () => {
    const data = JSON.stringify({ boardTitle, elements }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${boardTitle.replace(/\s+/g, '_')}.whiteboard.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast("JSON Exported", "Board data saved as .whiteboard.json file.", "success");
  };

  // Import board from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.elements && Array.isArray(parsed.elements)) {
          setElements(parsed.elements);
          toast("Import Success", `Loaded ${parsed.elements.length} elements from file.`, "success");
        } else {
          toast("Import Failed", "Invalid .whiteboard.json file format.", "error");
        }
      } catch {
        toast("Import Failed", "Could not parse JSON file.", "error");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  // Export minimal SVG representation of board
  const handleExportSVG = () => {
    const padding = 40;
    const xs = elements.map(e => e.x);
    const ys = elements.map(e => e.y);
    const xe = elements.map(e => e.x + e.width);
    const ye = elements.map(e => e.y + e.height);
    const minX = xs.length ? Math.min(...xs) - padding : 0;
    const minY = ys.length ? Math.min(...ys) - padding : 0;
    const maxX = xe.length ? Math.max(...xe) + padding : 800;
    const maxY = ye.length ? Math.max(...ye) + padding : 600;
    const W = maxX - minX;
    const H = maxY - minY;

    const svgParts = elements.map(el => {
      const tx = el.x - minX;
      const ty = el.y - minY;
      const stroke = el.color || '#000';
      const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'none';
      const sw = el.strokeWidth || 2;
      if (el.type === 'rect') {
        return `<rect x="${tx}" y="${ty}" width="${el.width}" height="${el.height}" stroke="${stroke}" fill="${fill}" stroke-width="${sw}" opacity="${el.opacity ?? 1}"/>`;
      } else if (el.type === 'circle') {
        return `<ellipse cx="${tx + el.width / 2}" cy="${ty + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" stroke="${stroke}" fill="${fill}" stroke-width="${sw}" opacity="${el.opacity ?? 1}"/>`;
      } else if (el.type === 'text' && el.text) {
        return `<text x="${tx}" y="${ty + (el.fontSize || 18)}" font-family="${el.fontFamily || 'sans-serif'}" font-size="${el.fontSize || 18}" fill="${stroke}" opacity="${el.opacity ?? 1}">${el.text.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>`;
      } else if (el.type === 'sticky' && el.text) {
        return `<rect x="${tx}" y="${ty}" width="${el.width}" height="${el.height}" fill="${fill || '#fef08a'}" rx="6"/><text x="${tx + 8}" y="${ty + 20}" font-family="sans-serif" font-size="12" fill="#78350f">${el.text.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>`;
      }
      return '';
    }).join('\n  ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${svgParts}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${boardTitle.replace(/\s+/g, '_')}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast("SVG Exported", "Board exported as scalable SVG vector file.", "success");
  };

  // Copy share link (board URL) to clipboard
  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast("Link Copied!", "Board URL copied to clipboard. Share it with collaborators.", "success");
    });
  };



  // AI OCR extraction trigger
  const triggerAIOCR = async () => {
    // Look for image elements
    const imgEl = elements.find(el => el.type === 'image');
    if (!imgEl) {
      toast("No Image Found", "Please upload or drop an image onto the canvas first to parse OCR.", "error");
      return;
    }
    toast("AI OCR Parsing", "Scanning canvas image text nodes...", "ai");
    try {
      const text = await AIService.ocrImage(boardTitle);
      // Spawn sticky note with result text
      const elId = 'ai-sticky-' + Date.now();
      const ocrNote: BoardElement = {
        id: elId,
        type: 'sticky',
        x: imgEl.x + imgEl.width + 40,
        y: imgEl.y,
        width: 220,
        height: 220,
        rotation: 2,
        text,
        color: '#6b21a8',
        fillColor: '#f3e8ff', // beautiful purple sticky
        strokeWidth: 1,
        strokeStyle: 'solid',
        opacity: 1,
        shadow: 'soft',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addElement(ocrNote);
      toast("OCR Scanned", "Created purple AI Sticky Note with transcribed text.", "success");
    } catch (e) {
      toast("AI Error", "Could not complete OCR.", "error");
    }
  };

  // AI Flowchart Generator
  const triggerAIFlowchart = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setShowAiModal(false);
    toast("AI Generator", "Configuring flowchart coordinate nodes...", "ai");
    try {
      const newFlowElements = await AIService.generateFlowchart(aiPrompt, 400, 200);
      newFlowElements.forEach(el => {
        addElement(el);
        rtcManagerRef.current?.broadcastDrawCommand({
          type: 'addElement',
          element: el
        });
      });
      confetti({ particleCount: 40, spread: 30 });
      toast("Flowchart Generated", "Added system schema flowchart to canvas.", "success");
    } catch (e) {
      toast("AI Error", "Failed to build system flowchart.", "error");
    } finally {
      setAiLoading(false);
      setAiPrompt('');
    }
  };

  // AI Sticky Note Summarizer
  const triggerAISummarize = async () => {
    const stickies = elements.filter(el => el.type === 'sticky' && el.text);
    if (stickies.length === 0) {
      toast("No Content", "Create some sticky notes first to analyze.", "error");
      return;
    }
    toast("AI Summarizer", "Analyzing sticky notes board patterns...", "ai");
    try {
      const texts = stickies.map(s => s.text as string);
      const summaryText = await AIService.summarizeStickyNotes(texts);

      // Place a new clean summary card
      const summaryId = 'summary-' + Date.now();
      const summaryNode: BoardElement = {
        id: summaryId,
        type: 'sticky',
        x: 100,
        y: 400,
        width: 250,
        height: 250,
        rotation: 0,
        text: summaryText,
        color: '#064e3b',
        fillColor: '#d1fae5', // light green summary
        strokeWidth: 2,
        strokeStyle: 'solid',
        opacity: 1,
        shadow: 'hard',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addElement(summaryNode);
      toast("Board Summarized", "Placed green AI Summary Box on workspace.", "success");
    } catch (e) {
      toast("AI Summarizer Error", "Failed to generate summary.", "error");
    }
  };

  // Text box editing save
  const handleSaveTextEdit = () => {
    if (!editingTextId) return;
    
    // If text was deleted/empty, clean element
    if (!textEditValue.trim()) {
      setElements(elements.filter(el => el.id !== editingTextId));
    } else {
      updateElement(editingTextId, { text: textEditValue });
      rtcManagerRef.current?.broadcastDrawCommand({
        type: 'updateElement',
        id: editingTextId,
        updates: { text: textEditValue }
      });
    }
    setEditingTextId(null);
  };

  const centeredBoardIdRef = useRef<string | null>(null);

  const centerBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (elements.length === 0) {
      useCanvasStore.setState({
        panX: canvas.width / 2,
        panY: canvas.height / 2,
        scale: 1.0
      });
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    elements.forEach((el) => {
      minX = Math.min(minX, el.x);
      maxX = Math.max(maxX, el.x + el.width);
      minY = Math.min(minY, el.y);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const boardW = maxX - minX;
    const boardH = maxY - minY;
    const padding = 150;

    const scaleX = (canvas.width - padding * 2) / boardW;
    const scaleY = (canvas.height - padding * 2) / boardH;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 2.0);

    const boardCX = minX + boardW / 2;
    const boardCY = minY + boardH / 2;

    useCanvasStore.setState({
      panX: canvas.width / 2 - boardCX * newScale,
      panY: canvas.height / 2 - boardCY * newScale,
      scale: newScale
    });
  };

  useEffect(() => {
    if (boardId && centeredBoardIdRef.current !== boardId) {
      const t = setTimeout(() => {
        centerBoard();
        centeredBoardIdRef.current = boardId;
      }, 150);
      return () => clearTimeout(t);
    }
  }, [boardId]);

  return (
    <div className="relative h-screen w-screen bg-[#090e1a] text-white flex flex-col overflow-hidden" ref={containerRef}>
      
      {/* 1. Header Toolbar */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        
        {/* Board Title Card */}
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl pointer-events-auto border border-white/5 shadow-xl">
          <button 
            onClick={onBackToDashboard}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            Dashboard
          </button>
          <div className="h-4 w-px bg-white/10" />
          <input 
            type="text"
            value={boardTitle}
            onChange={(e) => renameBoard(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-sm text-white w-40"
          />
          {saving && <span className="text-[10px] text-slate-500 font-medium">Saving...</span>}
        </div>

        {/* Presence Indicators */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {Object.keys(cursors).map(uid => (
            <img 
              key={uid}
              src={cursors[uid].photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${uid}`}
              alt={cursors[uid].name}
              title={cursors[uid].name}
              className="w-8 h-8 rounded-full border bg-slate-800 shrink-0"
              style={{ borderColor: cursors[uid].color }}
            />
          ))}
          {Object.keys(cursors).length === 0 && (
            <span className="text-[10px] text-slate-500 font-semibold glass-panel px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-indigo-400" /> Only You Active
            </span>
          )}
        </div>
      </header>

      {/* 2. Drawing Canvas Board Workspace */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`w-full h-full select-none touch-none ${
          tool === 'hand' ? 'canvas-cursor-grab' : 'canvas-cursor-crosshair'
        }`}
      />

      {/* 3. HTML Input editing block overlay for Text */}
      {editingTextId && (
        <textarea
          value={textEditValue}
          onChange={(e) => setTextEditValue(e.target.value)}
          onBlur={handleSaveTextEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSaveTextEdit();
            }
          }}
          className="absolute z-50 bg-slate-900 border border-indigo-500 rounded p-2 text-white outline-none resize-none font-sans"
          style={{
            left: `${textEditPos.x * scale + panX}px`,
            top: `${textEditPos.y * scale + panY}px`,
            fontSize: `${18 * scale}px`,
            width: `${240 * scale}px`,
            height: `${80 * scale}px`
          }}
          autoFocus
        />
      )}

      {/* 4. Floating Main Drawing Toolbar (Excalidraw floating box style) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 glass-panel border border-white/10 rounded-2xl shadow-2xl p-1.5 flex gap-1 items-center pointer-events-auto">
        {[
          { type: 'select', label: 'Select (S)', icon: MousePointer },
          { type: 'hand', label: 'Pan (H / Space)', icon: Hand },
          { type: 'pencil', label: 'Pencil (P)', icon: Edit },
          { type: 'rect', label: 'Rectangle (R)', icon: Square },
          { type: 'circle', label: 'Circle (C)', icon: Circle },
          { type: 'arrow', label: 'Arrow (A)', icon: ArrowRight },
          { type: 'curved-arrow', label: 'Curved Arrow', icon: Spline },
          { type: 'connector', label: 'Connector Line', icon: Workflow },
          { type: 'laser', label: 'Laser Pointer (L)', icon: Zap },
          { type: 'text', label: 'Text (T)', icon: Type },
          { type: 'sticky', label: 'Sticky (N)', icon: StickyNote },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.type}
              onClick={() => setTool(t.type as ToolType)}
              title={t.label}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                tool === t.type 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-4. w-4." />
            </button>
          );
        })}
      </div>

      {/* 5. Left Styles & Inspector Panel */}
      {showStylePanel && tool !== 'hand' && (
        <div className="absolute top-20 left-6 z-40 w-52 glass-panel border border-white/5 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 pointer-events-auto max-h-[80vh] overflow-y-auto">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Border Colors</h4>
            <div className="grid grid-cols-5 gap-2">
              {['#6366f1', '#f43f5e', '#10b981', '#22d3ee', '#ffffff'].map(c => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${brushColor === c ? 'scale-125 border-white' : 'border-white/20'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Fill Styling</h4>
            <div className="grid grid-cols-5 gap-2">
              {['transparent', 'rgba(99,102,241,0.1)', 'rgba(244,63,94,0.1)', 'rgba(16,185,129,0.1)', '#fef08a'].map(c => (
                <button
                  key={c}
                  onClick={() => setFillColor(c)}
                  className={`w-6 h-6 rounded-lg border cursor-pointer transition-transform ${fillColor === c ? 'scale-125 border-white' : 'border-white/20'}`}
                  style={{ backgroundColor: c === 'transparent' ? 'rgba(0,0,0,0.2)' : c }}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Line Width</h4>
            <div className="flex gap-2">
              {[2, 4, 7].map(w => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`flex-1 py-1 rounded bg-slate-800 text-[10px] font-bold border transition-colors cursor-pointer ${strokeWidth === w ? 'border-indigo-500 text-indigo-400' : 'border-white/5 text-slate-400'}`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Shadow Effect</h4>
            <div className="flex gap-1.5">
              {[
                { type: 'none', label: 'Flat' },
                { type: 'soft', label: 'Soft' },
                { type: 'hard', label: 'Hard' }
              ].map(s => (
                <button
                  key={s.type}
                  onClick={() => setShadowStyle(s.type as any)}
                  className={`flex-1 py-1 rounded bg-slate-800 text-[10px] border transition-colors cursor-pointer ${shadowStyle === s.type ? 'border-indigo-500 text-indigo-400' : 'border-white/5 text-slate-400'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Grid Layout</h4>
            <div className="flex gap-1.5">
              {[
                { type: 'none', label: 'Blank' },
                { type: 'dots', label: 'Dots' },
                { type: 'lines', label: 'Lines' }
              ].map(g => (
                <button
                  key={g.type}
                  onClick={() => setGridType(g.type as any)}
                  className={`flex-1 py-1 rounded bg-slate-800 text-[10px] border transition-colors cursor-pointer ${gridType === g.type ? 'border-indigo-500 text-indigo-400' : 'border-white/5 text-slate-400'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          
          {selectedElementIds.length > 0 && (
            <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Arrange Layers</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={bringForward}
                  className="px-2 py-1 bg-slate-900 border border-white/5 rounded text-[10px] hover:text-white transition-colors cursor-pointer"
                >
                  Bring Up
                </button>
                <button 
                  onClick={sendBackward}
                  className="px-2 py-1 bg-slate-900 border border-white/5 rounded text-[10px] hover:text-white transition-colors cursor-pointer"
                >
                  Send Down
                </button>
              </div>
              <button 
                onClick={deleteSelectedElements}
                className="w-full py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-bold rounded cursor-pointer transition-all"
              >
                Delete Selected
              </button>
            </div>
          )}

        </div>
      )}

      {/* 6. Right Drawer Utilities Bar */}
      <div className="absolute right-6 top-20 z-40 flex flex-col gap-3 pointer-events-auto">
        {/* Share */}
        <button 
          onClick={() => setShowShareModal(true)}
          title="Share Board"
          className="p-3 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <Share2 className="h-4 w-4" />
        </button>

        {/* Export PNG */}
        <button 
          onClick={handleExportPNG}
          title="Export PNG"
          className="p-3 rounded-2xl glass-panel border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <Download className="h-4 w-4" />
        </button>

        {/* Export SVG */}
        <button
          onClick={handleExportSVG}
          title="Export SVG"
          className="p-3 rounded-2xl glass-panel border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <CheckSquare className="h-4 w-4" />
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExportJSON}
          title="Export Board JSON"
          className="p-3 rounded-2xl glass-panel border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <Save className="h-4 w-4" />
        </button>

        {/* Import JSON */}
        <label
          title="Import Board JSON"
          className="p-3 rounded-2xl glass-panel border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg flex items-center justify-center"
        >
          <Upload className="h-4 w-4" />
          <input
            type="file"
            accept=".json,.whiteboard.json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </label>

        <button 
          onClick={triggerAISummarize}
          title="AI Sticky Note Summarizer"
          className="p-3 rounded-2xl glass-panel border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        <button 
          onClick={() => setShowAiModal(true)}
          title="AI Node Generator"
          className="p-3 rounded-2xl glass-panel border border-[#a855f7]/20 bg-[#a855f7]/5 hover:bg-[#a855f7]/10 text-purple-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <Layers className="h-4 w-4" />
        </button>

        <button 
          onClick={() => {
            setShowVersions(!showVersions);
            setShowChat(false);
          }}
          title="Version History"
          className="p-3 rounded-2xl glass-panel border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>

      {/* 7. Bottom Navigation camera scale metrics */}
      <footer className="absolute bottom-6 left-6 z-40 flex items-center gap-3 pointer-events-auto">
        
        {/* Zoom Controls */}
        <div className="glass-panel border border-white/5 rounded-2xl shadow-xl flex items-center px-2 py-1.5 gap-1 text-slate-300 text-xs">
          <button 
            onClick={() => zoom(0.8)} 
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="font-mono w-12 text-center text-[11px]">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={() => zoom(1.2)} 
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-3 w-px bg-white/10 mx-1" />
          <button 
            onClick={resetViewport}
            className="p-1 rounded hover:bg-white/5 text-[10px] uppercase font-bold text-indigo-400 hover:text-white cursor-pointer"
          >
            Reset
          </button>
        </div>

        <button 
          onClick={() => {
            document.body.classList.toggle('blueprint');
            toast("Blueprint Mode", "Toggled engineering blueprint design styling.", "info");
          }}
          className="glass-panel border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white px-3 py-2.5 rounded-2xl text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-xl"
        >
          🔧 Blueprint Grid
        </button>
      </footer>

      {/* 8. Minimap viewport navigation */}
      <div className="absolute bottom-6 right-6 z-40 pointer-events-auto">
        <Minimap
          elements={elements}
          scale={scale}
          panX={panX}
          panY={panY}
          mainWidth={canvasRef.current?.width || window.innerWidth}
          mainHeight={canvasRef.current?.height || window.innerHeight}
          onPanTo={(wx, wy) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            useCanvasStore.setState({
              panX: canvas.width / 2 - wx * scale,
              panY: canvas.height / 2 - wy * scale
            });
          }}
        />
      </div>

      {/* AI Prompt Input overlay Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-96 p-6 rounded-2xl glass-panel border border-white/10 shadow-2xl flex flex-col gap-4 pointer-events-auto"
          >
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold">
              <Sparkles className="h-5 w-5 animate-pulse" /> AI Flowchart & Schema Generator
            </div>
            <textarea
              placeholder="e.g. User onboarding registration flow chart"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input text-white resize-none"
              rows={3}
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerAIFlowchart}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Generate Nodes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Version History Sidebar Drawer */}
      <AnimatePresence>
        {showVersions && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a0f1d] border-l border-white/10 z-40 p-6 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-5 overflow-y-auto flex-1">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock className="h-4. w-4." /> Save Versions
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Snapshot and restore board structures.</p>
              </div>

              <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                <input
                  type="text"
                  placeholder="Version name/tag"
                  value={versionTagName}
                  onChange={(e) => setVersionTagName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg glass-input text-white"
                />
                <button
                  onClick={async () => {
                    await createVersion(user?.displayName || 'User', versionTagName);
                    setVersionTagName('');
                    toast("Version Logged", "Logged new tagged board instance.", "success");
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Create Snapshot
                </button>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
                {versions.map((v) => (
                  <div key={v.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold truncate max-w-[80%]">{v.tagName}</span>
                      <button
                        onClick={async () => {
                          await restoreVersion(v);
                          toast("Version Restored", "Canvas state reverted to version snapshot.", "success");
                        }}
                        className="text-[10px] text-indigo-400 hover:text-white"
                      >
                        Restore
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">Created by {v.createdBy}</span>
                    <span className="text-[9px] text-slate-500">{new Date(v.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {versions.length === 0 && (
                  <span className="text-[10px] text-slate-500 italic text-center">No logged versions.</span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowVersions(false)}
              className="w-full py-2 text-xs text-slate-400 hover:text-white border border-white/5 rounded-lg mt-4"
            >
              Close History
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-[480px] p-7 rounded-3xl glass-panel border border-white/10 shadow-2xl flex flex-col gap-5 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/20 rounded-xl">
                    <Share2 className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-white">Share Board</h2>
                    <p className="text-[11px] text-slate-400">Invite collaborators or export</p>
                  </div>
                </div>
                <button onClick={() => setShowShareModal(false)} className="text-slate-500 hover:text-white cursor-pointer">×</button>
              </div>

              {/* Collaborator presence */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Collaborators</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Current user */}
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                    <img
                      src={user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.uid}`}
                      alt={user?.displayName || 'You'}
                      className="w-6 h-6 rounded-full border-2 border-indigo-500"
                    />
                    <span className="text-xs font-semibold text-white">{user?.displayName || 'You'}</span>
                    <span className="text-[9px] bg-indigo-600/40 text-indigo-300 px-1.5 py-0.5 rounded-full">Owner</span>
                  </div>
                  {Object.values(cursors).map(c => (
                    <div key={c.name} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                      <img
                        src={c.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${c.name}`}
                        alt={c.name}
                        className="w-6 h-6 rounded-full"
                        style={{ borderColor: c.color, borderWidth: 2, borderStyle: 'solid' }}
                      />
                      <span className="text-xs text-slate-200">{c.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  ))}
                  {Object.keys(cursors).length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">No other collaborators online right now.</span>
                  )}
                </div>
              </div>

              {/* Share Link */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Board Link</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate">
                    {window.location.origin}/board/{boardId}
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="h-3 w-3" /> Copy Link
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Anyone with this link can view and edit the board in real-time.</p>
              </div>

              {/* Export Section */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Export Board</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { handleExportPNG(); setShowShareModal(false); }}
                    className="py-3 flex flex-col items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] text-slate-300 hover:text-white cursor-pointer transition-all"
                  >
                    <Download className="h-4 w-4 text-rose-400" />
                    PNG Image
                  </button>
                  <button
                    onClick={() => { handleExportSVG(); setShowShareModal(false); }}
                    className="py-3 flex flex-col items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] text-slate-300 hover:text-white cursor-pointer transition-all"
                  >
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                    SVG Vector
                  </button>
                  <button
                    onClick={() => { handleExportJSON(); setShowShareModal(false); }}
                    className="py-3 flex flex-col items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[11px] text-slate-300 hover:text-white cursor-pointer transition-all"
                  >
                    <Save className="h-4 w-4 text-indigo-400" />
                    JSON Data
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
