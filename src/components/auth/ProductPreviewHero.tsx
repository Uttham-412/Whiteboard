import React from 'react';
import { Cloud, Database, Server, Cpu, Shield, Sparkles, MessageSquare, MousePointer } from 'lucide-react';
import { AiAtmosphere } from '../ui/AiAtmosphere';

export const ProductPreviewHero: React.FC = () => {
  return (
    <div className="w-full max-w-4xl h-[620px] bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col relative select-none">
      {/* Subtle background AI particle constellation */}
      <AiAtmosphere />
      {/* Top Window Bar */}
      <div className="h-11 bg-[#F8FAFC] border-b border-[#E5E7EB] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs font-semibold text-slate-600 font-mono">collabcanvas-pro / architecture-v2.board</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-1.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">A</div>
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">S</div>
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">M</div>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">3 Collaborators Live</span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-[#F8FAFC] relative overflow-hidden flex">
        {/* Subtle Canvas Dot Grid Background */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
            backgroundSize: `24px 24px`
          }}
        />

        {/* Floating Left Mini Toolbar */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-xl border border-[#E5E7EB] shadow-md p-1.5 flex flex-col space-y-1 z-10">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MousePointer className="w-4 h-4" /></div>
          <div className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><Cloud className="w-4 h-4" /></div>
          <div className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><Database className="w-4 h-4" /></div>
          <div className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><MessageSquare className="w-4 h-4" /></div>
        </div>

        {/* Mock Whiteboard Diagram Objects */}
        <div className="relative w-full h-full p-12 flex items-center justify-center">
          {/* Node 1: Cloud CDN */}
          <div className="absolute left-20 top-24 w-44 p-4 bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <Cloud className="w-4 h-4" />
              <span className="text-xs font-bold">CloudFront CDN</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Edge Latency: 12ms</span>
          </div>

          {/* SVG Connector 1 to 2 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path d="M 240 135 L 340 135" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            <path d="M 490 135 L 590 135" stroke="#7C3AED" strokeWidth="2" fill="none" />
            <path d="M 415 175 L 415 280" stroke="#7C3AED" strokeWidth="2" fill="none" />
          </svg>

          {/* Node 2: API Gateway */}
          <div className="absolute left-80 top-24 w-44 p-4 bg-white rounded-xl border border-purple-200 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-purple-600">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold">API Gateway</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Rate Limit: 10k req/s</span>
          </div>

          {/* Node 3: Auth Microservice */}
          <div className="absolute right-20 top-24 w-44 p-4 bg-white rounded-xl border border-emerald-200 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold">Auth Service</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">JWT & OAuth 2.0</span>
          </div>

          {/* Node 4: PostgreSQL Database */}
          <div className="absolute left-80 bottom-28 w-44 p-4 bg-white rounded-xl border border-amber-200 shadow-sm flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-amber-600">
              <Database className="w-4 h-4" />
              <span className="text-xs font-bold">PostgreSQL Primary</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Multi-AZ Storage</span>
          </div>

          {/* Sticky Note Pin */}
          <div className="absolute right-24 bottom-20 w-48 p-4 bg-[#FEF9C3] rounded-xl border border-amber-300 shadow-md rotate-2">
            <span className="text-[11px] font-bold text-amber-900 block mb-1">📌 Q3 Architecture Review</span>
            <span className="text-[10px] text-amber-800 leading-snug">Ensure WebSockets connection uses VITE_API_URL backend server.</span>
          </div>

          {/* Realtime Cursor Badge 1: Alex */}
          <div className="absolute left-[330px] top-[140px] flex items-center space-x-1 transition-all">
            <MousePointer className="w-4 h-4 text-blue-600 fill-blue-600 -rotate-45" />
            <div className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold shadow-sm">
              Alex (Lead Architect)
            </div>
          </div>

          {/* Realtime Cursor Badge 2: Sarah */}
          <div className="absolute right-[160px] top-[150px] flex items-center space-x-1 transition-all">
            <MousePointer className="w-4 h-4 text-purple-600 fill-purple-600 -rotate-45" />
            <div className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-bold shadow-sm">
              Sarah (Security Lead)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
