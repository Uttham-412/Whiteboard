import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'ai';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((title: string, message?: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl glass-panel p-4 shadow-xl border border-white/10"
            >
              <div className="mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-indigo-400" />}
                {t.type === 'ai' && <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />}
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                  {t.title}
                </span>
                {t.message && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {t.message}
                  </span>
                )}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
