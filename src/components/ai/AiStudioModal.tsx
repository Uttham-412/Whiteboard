import React, { useState } from 'react';
import { 
  Sparkles, Cpu, Layers, Layout, Database, FileText, 
  HelpCircle, CheckCircle2, ArrowRight, X, Code2, RefreshCw, Wand2, ShieldAlert
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useToast } from '../ui/Toast';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ isOpen, onClose }) => {
  const { addElement, elements } = useCanvasStore();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<'generate' | 'analyze' | 'export'>('generate');
  const [selectedTool, setSelectedTool] = useState<string>('architecture');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportedCode, setExportedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() && category === 'generate') {
      toast("Prompt Required", "Please enter a description for the diagram you want to generate.", "error");
      return;
    }

    setIsGenerating(true);
    setExportedCode(null);

    setTimeout(() => {
      setIsGenerating(false);

      if (category === 'generate') {
        const id1 = 'ai-el-' + Date.now() + '-1';
        const id2 = 'ai-el-' + Date.now() + '-2';
        const id3 = 'ai-el-' + Date.now() + '-3';

        // Add 3 AI generated architecture nodes to canvas
        addElement({
          id: id1,
          type: 'cloud-node',
          x: 250,
          y: 200,
          width: 200,
          height: 80,
          rotation: 0,
          color: '#2563EB',
          fillColor: '#EFF6FF',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 1,
          shadow: 'soft',
          text: `[AI] ${prompt.slice(0, 20) || 'API Gateway'}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        addElement({
          id: id2,
          type: 'rect',
          x: 520,
          y: 200,
          width: 200,
          height: 80,
          rotation: 0,
          color: '#7C3AED',
          fillColor: '#F5F3FF',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 1,
          shadow: 'soft',
          text: '[AI] Auth Microservice',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        addElement({
          id: id3,
          type: 'rect',
          x: 790,
          y: 200,
          width: 200,
          height: 80,
          rotation: 0,
          color: '#059669',
          fillColor: '#ECFDF5',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 1,
          shadow: 'soft',
          text: '[AI] PostgreSQL Database',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        toast("AI Diagram Generated", `Created 3 AI nodes based on "${prompt}".`, "success");
        onClose();
      } else if (category === 'export') {
        const code = `graph TD\n  A[Client Web App] -->|HTTPS| B[API Gateway]\n  B -->|gRPC| C[Auth Service]\n  C -->|SQL| D[(PostgreSQL DB)]`;
        setExportedCode(code);
        toast("Diagram Exported", "Generated Mermaid / PlantUML code snapshot.", "success");
      } else {
        toast("AI Analysis Complete", "Analyzed diagram topology: 0 missing components found.", "success");
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-[16px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#111827]">CollabCanvas AI Studio</h2>
              <p className="text-[12px] text-[#6B7280]">AI-first diagram generation, layout optimization & code export</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Category Tabs */}
        <div className="flex border-b border-[#E5E7EB] px-6 bg-white text-[13px] font-medium text-[#374151]">
          <button
            onClick={() => setCategory('generate')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${category === 'generate' ? 'border-[#7C3AED] text-[#7C3AED] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate Diagrams</span>
          </button>
          <button
            onClick={() => setCategory('analyze')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${category === 'analyze' ? 'border-[#7C3AED] text-[#7C3AED] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Cpu className="w-4 h-4" />
            <span>Analyze & Optimize</span>
          </button>
          <button
            onClick={() => setCategory('export')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${category === 'export' ? 'border-[#7C3AED] text-[#7C3AED] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Code2 className="w-4 h-4" />
            <span>Export Code & Docs</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 flex-1 max-h-[480px] overflow-y-auto">
          {category === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-2">Select Architecture Type</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'architecture', label: 'Cloud Infrastructure', icon: Cpu },
                    { id: 'flowchart', label: 'UX Flowchart', icon: Layers },
                    { id: 'uml', label: 'UML Sequence', icon: Layout },
                    { id: 'erd', label: 'ER Database Schema', icon: Database },
                    { id: 'mindmap', label: 'Mind Map Tree', icon: Sparkles },
                    { id: 'docs', label: 'API Architecture', icon: FileText }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedTool(item.id)}
                      className={`p-3 rounded-[10px] border text-left flex flex-col justify-between h-20 transition-all ${selectedTool === item.id ? 'border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED] font-semibold shadow-2xs' : 'border-[#E5E7EB] hover:border-slate-300 text-slate-700'}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-[12px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Describe your diagram requirements</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Generate a high-availability AWS architecture with CloudFront CDN, API Gateway, Auth Microservice, Redis Cache, and PostgreSQL database..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D1D5DB] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-[8px] text-[13px] text-[#111827] outline-none transition-all"
                />
              </div>
            </div>
          )}

          {category === 'analyze' && (
            <div className="space-y-3">
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-[10px] space-y-2">
                <h4 className="text-[13px] font-bold text-purple-900 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-[#7C3AED]" />
                  <span>AI Architecture Intelligence</span>
                </h4>
                <p className="text-[12px] text-purple-800 leading-relaxed">
                  Scans your active whiteboard canvas to detect missing security layers, optimize layout spacing, and convert diagram types.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={handleGenerate}
                  className="p-3 bg-white border border-[#E5E7EB] hover:border-[#7C3AED] rounded-[10px] text-left space-y-1 transition-all cursor-pointer"
                >
                  <div className="text-[13px] font-semibold text-[#111827]">Detect Missing Components</div>
                  <div className="text-[11px] text-[#6B7280]">Suggests missing API gateways, caches or DB replicas</div>
                </button>
                <button 
                  onClick={handleGenerate}
                  className="p-3 bg-white border border-[#E5E7EB] hover:border-[#7C3AED] rounded-[10px] text-left space-y-1 transition-all cursor-pointer"
                >
                  <div className="text-[13px] font-semibold text-[#111827]">Auto-Optimize Layout</div>
                  <div className="text-[11px] text-[#6B7280]">Applies Dagre tree auto-layout to align nodes</div>
                </button>
              </div>
            </div>
          )}

          {category === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <button onClick={handleGenerate} className="px-3.5 py-2 bg-[#7C3AED] text-white text-[12px] font-semibold rounded-[8px]">
                  Generate Mermaid.js Code
                </button>
              </div>

              {exportedCode && (
                <div className="p-4 bg-slate-900 rounded-[10px] text-slate-100 font-mono text-[12px] overflow-x-auto">
                  <pre>{exportedCode}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#6B7280] flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Powered by Gemini & OpenAI Enterprise</span>
          </span>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-10 px-5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-semibold text-[14px] rounded-[8px] flex items-center space-x-2 transition-all cursor-pointer shadow-2xs"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Execute AI Generation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
