import { BoardElement } from '../types';
import jsPDF from 'jspdf';

export const exportBoardToJSON = (elements: BoardElement[], title: string) => {
  const jsonStr = JSON.stringify({ title, elements, exportedAt: Date.now() }, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_board.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportBoardToPNG = (elements: BoardElement[]) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard_export_${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

export const exportBoardToSVG = (elements: BoardElement[]) => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <rect width="100%" height="100%" fill="#FFFFFF"/>
    ${elements.map(el => `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fillColor || '#FFFFFF'}" stroke="${el.color || '#2563EB'}" stroke-width="${el.strokeWidth || 1.5}" rx="8"/>`).join('\n')}
  </svg>`;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whiteboard_export_${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportBoardToPDF = (elements: BoardElement[]) => {
  const doc = new jsPDF('landscape', 'px', [1920, 1080]);
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 1920, 1080, 'F');
  doc.save(`whiteboard_export_${Date.now()}.pdf`);
};

export const exportBoardToDrawIO = (elements: BoardElement[], title: string) => {
  const xmlContent = `<mxfile host="CollabCanvasPro">
  <diagram name="${title || 'Whiteboard'}">
    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${elements.map((el) => `
        <mxCell id="${el.id}" value="${el.text || ''}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=${el.fillColor || '#FFFFFF'};strokeColor=${el.color || '#2563EB'};" vertex="1" parent="1">
          <mxGeometry x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" as="geometry"/>
        </mxCell>`).join('')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'whiteboard').toLowerCase().replace(/\s+/g, '_')}.drawio.xml`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportBoardToPlantUML = (elements: BoardElement[], title: string) => {
  const pumlContent = `@startuml
title ${title || 'Whiteboard Architecture'}

${elements.map(el => `rectangle "${el.text || 'Node'}" as ${el.id.replace(/[^a-zA-Z0-9]/g, '_')}`).join('\n')}

@enduml`;

  const blob = new Blob([pumlContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'whiteboard').toLowerCase().replace(/\s+/g, '_')}.puml`;
  a.click();
  URL.revokeObjectURL(url);
};
