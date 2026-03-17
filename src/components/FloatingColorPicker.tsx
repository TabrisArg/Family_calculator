
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  onChange: (color: string) => void;
  position: { x: number; y: number };
  label: string;
}

export const FloatingColorPicker: React.FC<FloatingColorPickerProps> = ({
  isOpen,
  onClose,
  color,
  onChange,
  position,
  label
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Adjust position to keep picker on screen
  const adjustedX = Math.min(position.x, window.innerWidth - 250);
  const adjustedY = Math.min(position.y, window.innerHeight - 300);

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        style={{
          position: 'fixed',
          left: adjustedX,
          top: adjustedY,
          zIndex: 200,
        }}
        className="color-picker-container bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 w-56 space-y-4"
      >
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500 truncate pr-2">
            {label.replace(/([A-Z])/g, ' $1')}
          </span>
          <button onClick={onClose} className="hover:bg-slate-100 p-1 rounded-full">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="color"
            value={color.startsWith('#') ? color : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 border-2 border-black p-0 cursor-pointer"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 border-2 border-slate-200 px-2 py-1 font-mono text-xs focus:border-black outline-none"
            />
          </div>
        </div>
        
        <p className="text-[9px] font-mono text-slate-400 italic">
          Changes are applied instantly. Save in Admin Panel to persist.
        </p>
      </motion.div>
    </AnimatePresence>
  );
};
