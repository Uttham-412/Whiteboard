import React from 'react';

interface ConstellationLogoProps {
  size?: number;
  className?: string;
}

export const ConstellationLogo: React.FC<ConstellationLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer subtle glow aura */}
      <div 
        className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#2563EB]/20 via-[#7C3AED]/20 to-[#4F46E5]/20 blur-sm animate-pulse-slow"
      />
      
      {/* Main Logo Container */}
      <div 
        className="relative rounded-xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-center p-1.5"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size * 0.75} 
          height={size * 0.75} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Neural Constellation Connections */}
          <path d="M6 18L12 6L18 18" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 18L18 18" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 12H15" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
          
          {/* Constellation Vertex Nodes */}
          <circle cx="12" cy="6" r="2.5" fill="#7C3AED" className="animate-ping-slow" />
          <circle cx="6" cy="18" r="2.5" fill="#2563EB" />
          <circle cx="18" cy="18" r="2.5" fill="#2563EB" />
          <circle cx="9" cy="12" r="1.5" fill="#4F46E5" />
          <circle cx="15" cy="12" r="1.5" fill="#4F46E5" />
        </svg>
      </div>
    </div>
  );
};
