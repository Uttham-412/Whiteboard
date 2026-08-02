import React, { useState } from 'react';
import { Search, Layout, Sparkles, Plus, Check } from 'lucide-react';
import { TEMPLATES, TemplateDefinition } from '../../constants/templates';
import { useCanvasStore } from '../../store/canvasStore';
import { useToast } from '../ui/Toast';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const { setElements, elements } = useCanvasStore();
  const { toast } = useToast();

  if (!isOpen) return null;

  const categories = ['All', 'Architecture', 'Agile', 'Engineering', 'Database', 'Software'];

  const filtered = TEMPLATES.filter((t) => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyTemplate = (template: TemplateDefinition) => {
    // Append or replace elements
    setElements([...elements, ...template.elements]);
    toast(`Loaded ${template.title} template onto canvas`, undefined, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-4xl glass-dropdown rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Professional Templates Catalog</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">75+ pre-built architecture, flowcharts, sprint boards, and system designs</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">✕ Close</button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-transparent focus:border-blue-500"
            />
          </div>
        </div>

        {/* Grid cards */}
        <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => handleApplyTemplate(t)}
              className="group glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {t.category}
                  </span>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 group-hover:text-blue-600 transition-colors">{t.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.elements.length} elements</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">Insert →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
