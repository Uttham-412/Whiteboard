import React, { useRef, useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { screenToWorld, drawGrid, drawElement } from './canvasEngine';
import { Minimap } from './Minimap';
import { BoardElement, Point } from '../../types';
import { WebRTCManager } from '../../services/webRTC';
import { TopNav } from '../navigation/TopNav';
import { LeftToolbar } from '../navigation/LeftToolbar';
import { PropertyInspector } from '../inspector/PropertyInspector';
import { CommandPalette } from '../navigation/CommandPalette';
import { LayersPanel } from '../layers/LayersPanel';
import { TemplateGallery } from '../templates/TemplateGallery';
import { AIGeneratorModal } from '../ai/AIGeneratorModal';
import { ShareModal } from '../navigation/ShareModal';

export const CanvasViewport: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rtcManagerRef = useRef<WebRTCManager | null>(null);

  const { user } = useAuthStore();

  const {
    elements, selectedElementIds, tool, brushColor, fillColor, strokeWidth,
    strokeStyle, opacity, shadowStyle, scale, panX, panY,
    boardId, gridType, saving, cursors,
    setTool, setElements, addElement, selectElements, clearSelection,
    zoom, pan, saveBoard, updateCursor, clearCursors
  } = useCanvasStore();

  // Internal Interaction State
  const [action, setAction] = useState<'none' | 'drawing' | 'panning' | 'selecting'>('none');
  const [startPan, setStartPan] = useState<Point>({ x: 0, y: 0 });
  const [drawStart, setDrawStart] = useState<Point>({ x: 0, y: 0 });
  const [activePoints, setActivePoints] = useState<Point[]>([]);

  // Modals & Panels State
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // WebRTC Setup
  useEffect(() => {
    if (!boardId || !user) return;
    const colors = ['#2563EB', '#7C3AED', '#059669', '#0284C7', '#D97706', '#DC2626'];
    const userColor = colors[Math.abs(user.uid.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];

    rtcManagerRef.current = new WebRTCManager(boardId, user.uid, user.displayName, userColor, user.photoURL);
    rtcManagerRef.current.connect();

    rtcManagerRef.current.onCursorUpdate = (cursor) => {
      updateCursor(cursor.userId, cursor);
    };

    rtcManagerRef.current.onDrawCommand = (cmd) => {
      if (cmd && cmd.id) {
        const existing = useCanvasStore.getState().elements;
        if (!existing.some(e => e.id === cmd.id)) {
          useCanvasStore.getState().addElement(cmd);
        }
      }
    };

    const saveTimer = setInterval(() => {
      saveBoard();
    }, 5000);

    return () => {
      rtcManagerRef.current?.disconnect();
      clearInterval(saveTimer);
      clearCursors();
    };
  }, [boardId, user]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Light Workspace & Grid
    drawGrid(ctx, canvas.width, canvas.height, panX, panY, scale, gridType);

    // 2. Draw Elements in Viewport
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    elements.forEach((el) => {
      drawElement(ctx, el, {}, elements);
    });

    // 3. Draw Active Freehand Stroke
    if (action === 'drawing' && activePoints.length > 1) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(activePoints[0].x, activePoints[0].y);
      for (let i = 1; i < activePoints.length; i++) {
        ctx.lineTo(activePoints[i].x, activePoints[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [elements, panX, panY, scale, gridType, action, activePoints, brushColor, strokeWidth]);

  // Wheel Zoom & Pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      zoom(zoomFactor, e.clientX, e.clientY);
    } else {
      pan(-e.deltaX, -e.deltaY);
    }
  };

  // Pointer Down Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || tool === 'hand') {
      setAction('panning');
      setStartPan({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    const worldPoint = screenToWorld(e.clientX, e.clientY, panX, panY, scale);
    setDrawStart(worldPoint);

    if (['pencil', 'brush', 'marker', 'highlighter'].includes(tool)) {
      setAction('drawing');
      setActivePoints([worldPoint]);
    } else if (['rect', 'circle', 'triangle', 'diamond', 'sticky', 'text', 'frame', 'cloud-node', 'orthogonal-connector'].includes(tool)) {
      const newEl: BoardElement = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: tool as any,
        x: worldPoint.x - (tool === 'sticky' ? 80 : 100),
        y: worldPoint.y - (tool === 'sticky' ? 80 : 50),
        width: tool === 'sticky' ? 160 : tool === 'frame' ? 400 : 200,
        height: tool === 'sticky' ? 160 : tool === 'frame' ? 300 : 90,
        rotation: 0,
        color: '#0F172A',
        fillColor: tool === 'sticky' ? '#FEF9C3' : '#FFFFFF',
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        opacity: 1.0,
        shadow: 'soft',
        text: tool === 'sticky' ? 'New Note' : tool === 'frame' ? 'Frame Container' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addElement(newEl);
      setTool('select');
      selectElements([newEl.id]);
    } else if (tool === 'select') {
      // Find clicked element
      const clicked = [...elements].reverse().find(el => {
        return (
          worldPoint.x >= el.x &&
          worldPoint.x <= el.x + el.width &&
          worldPoint.y >= el.y &&
          worldPoint.y <= el.y + el.height
        );
      });
      if (clicked) {
        selectElements([clicked.id]);
      } else {
        clearSelection();
      }
    }
  };

  // Pointer Move Interaction
  const handlePointerMove = (e: React.PointerEvent) => {
    if (action === 'panning') {
      useCanvasStore.setState({ panX: e.clientX - startPan.x, panY: e.clientY - startPan.y });
      return;
    }

    const worldPoint = screenToWorld(e.clientX, e.clientY, panX, panY, scale);

    if (user) {
      rtcManagerRef.current?.broadcastCursor(worldPoint.x, worldPoint.y);
    }

    if (action === 'drawing') {
      setActivePoints((prev) => [...prev, worldPoint]);
    }
  };

  // Pointer Up Interaction
  const handlePointerUp = () => {
    if (action === 'drawing' && activePoints.length > 1) {
      const newEl: BoardElement = {
        id: `draw-${Date.now()}`,
        type: tool as any,
        x: Math.min(...activePoints.map((p) => p.x)),
        y: Math.min(...activePoints.map((p) => p.y)),
        width: Math.max(...activePoints.map((p) => p.x)) - Math.min(...activePoints.map((p) => p.x)) || 10,
        height: Math.max(...activePoints.map((p) => p.y)) - Math.min(...activePoints.map((p) => p.y)) || 10,
        rotation: 0,
        points: activePoints,
        color: brushColor,
        strokeWidth: strokeWidth,
        strokeStyle: strokeStyle,
        opacity: opacity,
        shadow: shadowStyle,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addElement(newEl);
      rtcManagerRef.current?.broadcastDrawCommand(newEl);
    }

    setAction('none');
    setActivePoints([]);
  };

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-slate-100 flex flex-col select-none">
      {/* Top Header Nav */}
      <TopNav
        onBackToDashboard={onBackToDashboard}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenShareModal={() => setShowShareModal(true)}
      />

      {/* Main Center Area: Canvas + Left Toolbar + Right Property Inspector */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Compact Left Vertical Toolbar */}
        <LeftToolbar
          onOpenAI={() => setShowAIModal(true)}
          onOpenTemplates={() => setShowTemplates(true)}
          onToggleLayers={() => setShowLayers(!showLayers)}
        />

        {/* HTML5 Canvas Viewport */}
        <div className="flex-1 h-full relative">
          <canvas
            ref={canvasRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`w-full h-full ${tool === 'hand' || action === 'panning' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
          />
        </div>

        {/* Right Figma-Style Property Inspector */}
        <PropertyInspector />
      </div>

      {/* Minimap Preview */}
      <div className="fixed bottom-6 right-80 z-30">
        <Minimap
          elements={elements}
          scale={scale}
          panX={panX}
          panY={panY}
          mainWidth={typeof window !== 'undefined' ? window.innerWidth : 1200}
          mainHeight={typeof window !== 'undefined' ? window.innerHeight : 800}
          onPanTo={(wx, wy) => {
            const wWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const wHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
            useCanvasStore.setState({ panX: wWidth / 2 - wx * scale, panY: wHeight / 2 - wy * scale });
          }}
        />
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenTemplates={() => setShowTemplates(true)}
        onOpenAI={() => setShowAIModal(true)}
      />

      {/* Collapsible Layers Panel */}
      <LayersPanel isOpen={showLayers} onClose={() => setShowLayers(false)} />

      {/* Template Gallery */}
      <TemplateGallery isOpen={showTemplates} onClose={() => setShowTemplates(false)} />

      {/* AI Studio Modal */}
      <AIGeneratorModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />

      {/* Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
};
