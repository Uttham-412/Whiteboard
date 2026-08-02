import { BoardElement } from '../types';

export interface TemplateDefinition {
  id: string;
  title: string;
  category: 'Engineering' | 'Business' | 'AI' | 'Marketing' | 'Education' | 'Product' | 'Agile' | 'Architecture' | 'UX' | 'Database' | 'Networking' | 'Software';
  description: string;
  thumbnailColor: string;
  elements: BoardElement[];
}

export const TEMPLATES: TemplateDefinition[] = [
  // 1. AWS Cloud Architecture
  {
    id: 'aws-microservices-arch',
    title: 'AWS Cloud Microservices Architecture',
    category: 'Architecture',
    description: 'Production-ready AWS serverless microservices setup with CloudFront, API Gateway, Lambda, DynamoDB, and SQS.',
    thumbnailColor: '#2563EB',
    elements: [
      { id: 't1-f1', type: 'frame', x: 50, y: 50, width: 900, height: 500, rotation: 0, color: '#2563EB', fillColor: 'rgba(37, 99, 235, 0.03)', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'AWS Production Stack', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-e1', type: 'cloud-node', x: 100, y: 150, width: 140, height: 90, rotation: 0, color: '#2563EB', fillColor: '#EFF6FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Route 53 / CDN', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-e2', type: 'api-gateway', x: 300, y: 150, width: 140, height: 90, rotation: 0, color: '#7C3AED', fillColor: '#F5F3FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'API Gateway', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-e3', type: 'microservice-node', x: 500, y: 110, width: 150, height: 80, rotation: 0, color: '#059669', fillColor: '#ECFDF5', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Auth Service (Lambda)', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-e4', type: 'microservice-node', x: 500, y: 220, width: 150, height: 80, rotation: 0, color: '#059669', fillColor: '#ECFDF5', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Order Service (ECR)', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-e5', type: 'database-node', x: 720, y: 110, width: 140, height: 90, rotation: 0, color: '#D97706', fillColor: '#FEF3C7', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'DynamoDB (Users)', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-e6', type: 'database-node', x: 720, y: 220, width: 140, height: 90, rotation: 0, color: '#D97706', fillColor: '#FEF3C7', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'PostgreSQL RDS', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-c1', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#2563EB', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't1-e1', startAnchor: 'right', endElementId: 't1-e2', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-c2', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#7C3AED', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't1-e2', startAnchor: 'right', endElementId: 't1-e3', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-c3', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#7C3AED', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't1-e2', startAnchor: 'right', endElementId: 't1-e4', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-c4', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#059669', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't1-e3', startAnchor: 'right', endElementId: 't1-e5', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't1-c5', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#059669', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't1-e4', startAnchor: 'right', endElementId: 't1-e6', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
    ]
  },

  // 2. Agile Sprint Kanban
  {
    id: 'agile-sprint-board',
    title: 'Agile Sprint Planning & Kanban Board',
    category: 'Agile',
    description: 'Sprint backlog, work-in-progress (WIP), code review, and done swimlanes with color-coded story point sticky notes.',
    thumbnailColor: '#7C3AED',
    elements: [
      { id: 't2-f1', type: 'frame', x: 40, y: 40, width: 240, height: 500, rotation: 0, color: '#6B7280', fillColor: '#F3F4F6', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '📋 Backlog', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-f2', type: 'frame', x: 300, y: 40, width: 240, height: 500, rotation: 0, color: '#2563EB', fillColor: '#EFF6FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '⚡ In Progress', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-f3', type: 'frame', x: 560, y: 40, width: 240, height: 500, rotation: 0, color: '#7C3AED', fillColor: '#F5F3FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '🔍 Code Review', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-f4', type: 'frame', x: 820, y: 40, width: 240, height: 500, rotation: 0, color: '#22C55E', fillColor: '#ECFDF5', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '✅ Done', createdAt: Date.now(), updatedAt: Date.now() },
      
      { id: 't2-s1', type: 'sticky', x: 60, y: 100, width: 200, height: 120, rotation: -1, color: '#1E293B', fillColor: '#FEF08A', strokeWidth: 1, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '[FE-102] Refactor Canvas Engine to WebGL\nPoints: 8\nAssignee: Alex', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-s2', type: 'sticky', x: 60, y: 240, width: 200, height: 120, rotation: 1, color: '#1E293B', fillColor: '#BAE6FD', strokeWidth: 1, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '[BE-204] Add Redis Caching Layer\nPoints: 5\nAssignee: Sarah', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-s3', type: 'sticky', x: 320, y: 100, width: 200, height: 120, rotation: 0, color: '#1E293B', fillColor: '#BBF7D0', strokeWidth: 1, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '[AI-11] Flowchart Auto-routing\nPoints: 13\nAssignee: Uttham', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-s4', type: 'sticky', x: 580, y: 100, width: 200, height: 120, rotation: -2, color: '#1E293B', fillColor: '#DDD6FE', strokeWidth: 1, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '[UX-401] Dark Mode Color Tokens\nPoints: 3\nAssignee: Mia', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't2-s5', type: 'sticky', x: 840, y: 100, width: 200, height: 120, rotation: 1, color: '#1E293B', fillColor: '#FBCFE8', strokeWidth: 1, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: '[OPS-01] CI/CD Github Actions Setup\nPoints: 5\nAssignee: Chris', createdAt: Date.now(), updatedAt: Date.now() },
    ]
  },

  // 3. User Authentication Flowchart
  {
    id: 'user-auth-flowchart',
    title: 'User Registration & OAuth Flowchart',
    category: 'Engineering',
    description: 'Comprehensive flowchart covering Email/Password registration, Google OAuth, JWT generation, and 2FA verification.',
    thumbnailColor: '#22C55E',
    elements: [
      { id: 't3-e1', type: 'rounded-rect', x: 300, y: 60, width: 160, height: 60, rotation: 0, color: '#2563EB', fillColor: '#EFF6FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Start: User Visit', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-e2', type: 'decision-node', x: 300, y: 160, width: 160, height: 100, rotation: 0, color: '#F59E0B', fillColor: '#FEF3C7', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Has Account?', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-e3', type: 'rect', x: 100, y: 310, width: 160, height: 70, rotation: 0, color: '#7C3AED', fillColor: '#F5F3FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Render Signup Form', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-e4', type: 'rect', x: 500, y: 310, width: 160, height: 70, rotation: 0, color: '#22C55E', fillColor: '#ECFDF5', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Prompt Password / OAuth', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-e5', type: 'rounded-rect', x: 300, y: 440, width: 160, height: 60, rotation: 0, color: '#2563EB', fillColor: '#EFF6FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Issue JWT & Redirect', createdAt: Date.now(), updatedAt: Date.now() },

      { id: 't3-c1', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#2563EB', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't3-e1', startAnchor: 'bottom', endElementId: 't3-e2', endAnchor: 'top', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-c2', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#F59E0B', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't3-e2', startAnchor: 'left', endElementId: 't3-e3', endAnchor: 'top', label: 'No', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-c3', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#F59E0B', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't3-e2', startAnchor: 'right', endElementId: 't3-e4', endAnchor: 'top', label: 'Yes', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-c4', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#22C55E', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't3-e3', startAnchor: 'bottom', endElementId: 't3-e5', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't3-c5', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#22C55E', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't3-e4', startAnchor: 'bottom', endElementId: 't3-e5', endAnchor: 'right', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
    ]
  },

  // 4. Kubernetes Cluster Infrastructure
  {
    id: 'k8s-cluster-infra',
    title: 'Kubernetes Multi-Node Cluster Topology',
    category: 'Software',
    description: 'Ingress Controller, Pod Replicas, Service Discovery, ConfigMaps, and Persistent Volume Claims in K8s.',
    thumbnailColor: '#0284C7',
    elements: [
      { id: 't4-f1', type: 'frame', x: 50, y: 50, width: 800, height: 460, rotation: 0, color: '#0284C7', fillColor: 'rgba(2, 132, 199, 0.03)', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'K8s Cluster (us-east-1)', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-e1', type: 'server-node', x: 100, y: 150, width: 140, height: 80, rotation: 0, color: '#0284C7', fillColor: '#E0F2FE', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'NGINX Ingress', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-e2', type: 'k8s-pod', x: 340, y: 100, width: 150, height: 80, rotation: 0, color: '#7C3AED', fillColor: '#F5F3FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Pod: API-Worker-1', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-e3', type: 'k8s-pod', x: 340, y: 220, width: 150, height: 80, rotation: 0, color: '#7C3AED', fillColor: '#F5F3FF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Pod: API-Worker-2', createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-e4', type: 'database-node', x: 600, y: 160, width: 150, height: 90, rotation: 0, color: '#D97706', fillColor: '#FEF3C7', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'StatefulSet Redis', createdAt: Date.now(), updatedAt: Date.now() },

      { id: 't4-c1', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#0284C7', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't4-e1', startAnchor: 'right', endElementId: 't4-e2', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-c2', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#0284C7', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't4-e1', startAnchor: 'right', endElementId: 't4-e3', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-c3', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#7C3AED', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't4-e2', startAnchor: 'right', endElementId: 't4-e4', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't4-c4', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#7C3AED', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'none', connectorData: { startElementId: 't4-e3', startAnchor: 'right', endElementId: 't4-e4', endAnchor: 'left', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
    ]
  },

  // 5. Database ER Diagram
  {
    id: 'database-er-diagram',
    title: 'Relational Database Schema (ERD)',
    category: 'Database',
    description: 'Entities, attributes, primary keys, and foreign key relationships for e-commerce platforms.',
    thumbnailColor: '#D97706',
    elements: [
      { id: 't5-e1', type: 'table', x: 80, y: 80, width: 220, height: 180, rotation: 0, color: '#111827', fillColor: '#FFFFFF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Users Table', tableData: { rows: 4, cols: 2, data: [['PK', 'id (UUID)'], ['VARCHAR', 'email'], ['VARCHAR', 'password_hash'], ['TIMESTAMP', 'created_at']] }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't5-e2', type: 'table', x: 420, y: 80, width: 220, height: 180, rotation: 0, color: '#111827', fillColor: '#FFFFFF', strokeWidth: 2, strokeStyle: 'solid', opacity: 1, shadow: 'soft', text: 'Orders Table', tableData: { rows: 4, cols: 2, data: [['PK', 'id (UUID)'], ['FK', 'user_id'], ['DECIMAL', 'total_amount'], ['VARCHAR', 'status']] }, createdAt: Date.now(), updatedAt: Date.now() },
      { id: 't5-c1', type: 'orthogonal-connector', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#2563EB', strokeWidth: 2, strokeStyle: 'dashed', opacity: 1, shadow: 'none', connectorData: { startElementId: 't5-e1', startAnchor: 'right', endElementId: 't5-e2', endAnchor: 'left', label: '1 : N', routingMode: 'orthogonal', arrowEnd: true }, createdAt: Date.now(), updatedAt: Date.now() },
    ]
  }
];
