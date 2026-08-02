import React from 'react';

export type IconType = 
  | 'aws' | 'azure' | 'gcp' | 'k8s' | 'docker' 
  | 'database' | 'redis' | 'postgres' | 'api-gateway' 
  | 'microservice' | 'server' | 'router' | 'uml-actor' 
  | 'uml-class' | 'bpmn-task';

export const CloudIcon: React.FC<{ type: IconType; className?: string; size?: number }> = ({ type, className = '', size = 20 }) => {
  switch (type) {
    case 'aws':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 16.5A4.5 4.5 0 0 1 7.5 7.6 6 6 0 0 1 18 10a4.5 4.5 0 0 1 1.5 8.9" />
          <path d="M12 12v9" />
          <path d="m15 18-3 3-3-3" />
        </svg>
      );

    case 'azure':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );

    case 'gcp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 14.89 12 20l8-5.11V9.11L12 4 4 9.11z" />
          <path d="m12 12.5 8-5.11" />
          <path d="m12 12.5-8-5.11" />
          <path d="M12 12.5V20" />
        </svg>
      );

    case 'k8s':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" />
          <polygon points="12 6 17 9 17 15 12 18 7 15 7 9 12 6" />
        </svg>
      );

    case 'docker':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="2" y="12" width="20" height="8" rx="2" />
          <path d="M6 12V8h4v4" />
          <path d="M12 12V6h4v6" />
        </svg>
      );

    case 'database':
    case 'postgres':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
        </svg>
      );

    case 'api-gateway':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 12h8" />
          <path d="m12 8 4 4-4 4" />
        </svg>
      );

    case 'microservice':
    case 'server':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
};
