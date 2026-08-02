import React, { useState } from 'react';
import { Sparkles, Workflow, Code, Cloud, Network, Wand2, Loader2, HelpCircle } from 'lucide-react';
import { AIService } from '../../services/ai';
import { useCanvasStore } from '../../store/canvasStore';
import { useToast } from '../ui/Toast';
import { AIAssistantAction } from '../../types';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'architecture' | 'uml' | 'mindmap' | 'assistant'>('flowchart');
  const [prompt, setPrompt] = useState('');
  const [assistantAction, setAssistantAction] = useState<AIAssistantAction>('improve');
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { elements, selectedElementIds, setElements } = useCanvasStore();
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (activeTab !== 'assistant' && !prompt.trim()) return;
    setLoading(true);
    setExplanationText(null);

    try {
      if (activeTab === 'assistant') {
        const targetElements = selectedElementIds.length > 0 
          ? elements.filter(el => selectedElementIds.includes(el.id))
          : elements;

        const res = await AIService.runDiagramAssistant(assistantAction, targetElements, prompt);
        if (res.explanation) {
          setExplanationText(res.explanation);
          toast("AI Explanation", "Generated breakdown below.", "ai");
        } else if (res.elements) {
          const updated = elements.map(el => {
            const match = res.elements?.find(e => e.id === el.id);
            return match ? { ...el, ...match } : el;
          });
          setElements(updated);
          toast("AI Assistant Executed", `Action ${assistantAction} completed successfully!`, "success");
          onClose();
        }
      } else {
        const generated = await AIService.generateDiagram(activeTab, prompt);
        if (generated.length > 0) {
          setElements([...elements, ...generated]);
          toast("AI Generation Complete", `Generated ${generated.length} editable canvas objects!`, "success");
          onClose();
          setPrompt('');
        }
      }
    } catch (e) {
      toast("AI Error", "Failed to generate diagram. Please check backend connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl figma-dropdown rounded-2xl p-6 shadow-2xl border border-slate-200 bg-white flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Studio & Diagram Assistant</h2>
              <p className="text-xs text-slate-500">Secure backend OpenAI & Gemini API integration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-sm">✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl my-4 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('flowchart')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${activeTab === 'flowchart' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Flowchart</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${activeTab === 'architecture' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('uml')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${activeTab === 'uml' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>UML</span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${activeTab === 'mindmap' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Mind Map</span>
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg transition-all ${activeTab === 'assistant' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-purple-600 hover:bg-purple-50'}`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>
        </div>

        {/* Input Area */}
        {activeTab !== 'assistant' ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              {activeTab === 'flowchart' && 'Describe the workflow (e.g., "User Registration with Email & 2FA Verification"): '}
              {activeTab === 'architecture' && 'Describe cloud architecture (e.g., "Netflix Microservices with API Gateway, K8s, and Redis Cache"): '}
              {activeTab === 'uml' && 'Describe class model or paste code snippet: '}
              {activeTab === 'mindmap' && 'Central topic for mind map (e.g., "Product Launch Strategy Q3"): '}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type prompt here..."
              className="w-full p-3 bg-slate-50 rounded-xl text-xs text-slate-900 border border-slate-200 outline-none focus:border-blue-500 font-mono"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Select Diagram Assistant Action:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'improve', label: 'Improve Selected Diagram', desc: 'Standardize colors & layout' },
                { id: 'add_missing', label: 'Add Missing Components', desc: 'Detect missing services/cache' },
                { id: 'optimize_layout', label: 'Optimize Layout', desc: 'Re-align bounding boxes' },
                { id: 'explain', label: 'Explain Diagram', desc: 'Generate text summary' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAssistantAction(opt.id as AIAssistantAction)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    assistantAction === opt.id
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
            {explanationText && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950 font-mono leading-relaxed">
                {explanationText}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-[11px] text-slate-400">Generates structured JSON editable canvas objects</span>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              disabled={loading || (activeTab !== 'assistant' && !prompt.trim())}
              onClick={handleGenerate}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Processing...' : 'Run AI Action'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
