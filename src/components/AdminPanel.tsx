
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Plus, Trash2, Globe, Palette, Database, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { themeConfig as initialTheme } from '../themeConfig';
import { adminSettings as initialAdmin } from '../adminSettings';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (newTheme: any, newAdmin: any) => void;
  onResetData: (people: any[], items: any[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onApply, onResetData }) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'defaults' | 'general'>('theme');
  const [theme, setTheme] = useState(initialTheme);
  const [admin, setAdmin] = useState(initialAdmin);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('splitter_theme_config');
    const savedAdmin = localStorage.getItem('splitter_admin_config');
    if (savedTheme) setTheme(JSON.parse(savedTheme));
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
  }, []);

  const handleThemeChange = (key: string, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleAdminChange = (key: string, value: any) => {
    setAdmin(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('splitter_theme_config', JSON.stringify(theme));
    localStorage.setItem('splitter_admin_config', JSON.stringify(admin));
    onApply(theme, admin);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setTheme(initialTheme);
      setAdmin(initialAdmin);
      localStorage.removeItem('splitter_theme_config');
      localStorage.removeItem('splitter_admin_config');
      onApply(initialTheme, initialAdmin);
    }
  };

  const addDefaultPerson = () => {
    const newPerson = { id: Date.now().toString(), name: 'NEW PERSON', paid: 0 };
    setAdmin(prev => ({ ...prev, defaultPeople: [...prev.defaultPeople, newPerson] }));
  };

  const removeDefaultPerson = (id: string) => {
    setAdmin(prev => ({ ...prev, defaultPeople: prev.defaultPeople.filter(p => p.id !== id) }));
  };

  const addDefaultItem = () => {
    const newItem = { id: Date.now().toString(), name: 'NEW ITEM', amount: 0, paidById: '' };
    setAdmin(prev => ({ ...prev, defaultCostItems: [...prev.defaultCostItems, newItem] }));
  };

  const removeDefaultItem = (id: string) => {
    setAdmin(prev => ({ ...prev, defaultCostItems: prev.defaultCostItems.filter(i => i.id !== id) }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col relative z-10"
          >
            {/* Header */}
            <div className="p-6 border-b-4 border-black flex items-center justify-between bg-p5-purple">
              <div className="flex items-center gap-3">
                <Settings className="text-black" size={28} />
                <h2 className="font-display text-3xl uppercase italic tracking-tight text-black">Admin Panel</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/10 transition-colors rounded-full">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-black bg-slate-50">
              <button
                onClick={() => setActiveTab('theme')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'theme' ? 'bg-white border-b-4 border-p5-purple' : 'hover:bg-slate-100'}`}
              >
                <Palette size={16} />
                Theme
              </button>
              <button
                onClick={() => setActiveTab('defaults')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'defaults' ? 'bg-white border-b-4 border-p5-purple' : 'hover:bg-slate-100'}`}
              >
                <Database size={16} />
                Defaults
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'general' ? 'bg-white border-b-4 border-p5-purple' : 'hover:bg-slate-100'}`}
              >
                <Globe size={16} />
                General
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(theme).map(([key, value]) => {
                      const isColor = typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgba') || value.startsWith('var'));
                      return (
                        <div key={key} className="space-y-2">
                          <label className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <div className="flex gap-2">
                            {isColor && (
                              <input
                                type="color"
                                value={value.startsWith('#') ? value : '#000000'}
                                onChange={(e) => handleThemeChange(key, e.target.value)}
                                className="w-10 h-10 border-2 border-black p-0 cursor-pointer"
                              />
                            )}
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleThemeChange(key, e.target.value)}
                              className="flex-1 border-2 border-slate-200 px-3 py-2 font-mono text-sm focus:border-black outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'defaults' && (
                <div className="space-y-10">
                  {/* Default People */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl uppercase italic">Default People</h3>
                      <button onClick={addDefaultPerson} className="p5-button py-1 px-3 text-[10px]">Add Person</button>
                    </div>
                    <div className="space-y-2">
                      {admin.defaultPeople.map((p, idx) => (
                        <div key={p.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => {
                              const newList = [...admin.defaultPeople];
                              newList[idx].name = e.target.value.toUpperCase();
                              handleAdminChange('defaultPeople', newList);
                            }}
                            className="flex-1 border-2 border-slate-200 px-3 py-1 font-bold"
                          />
                          <input
                            type="number"
                            value={p.paid}
                            onChange={(e) => {
                              const newList = [...admin.defaultPeople];
                              newList[idx].paid = Number(e.target.value);
                              handleAdminChange('defaultPeople', newList);
                            }}
                            className="w-24 border-2 border-slate-200 px-3 py-1 font-mono"
                          />
                          <button onClick={() => removeDefaultPerson(p.id)} className="text-rose-500 p-1">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Default Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl uppercase italic">Default Cost Items</h3>
                      <button onClick={addDefaultItem} className="p5-button py-1 px-3 text-[10px]">Add Item</button>
                    </div>
                    <div className="space-y-2">
                      {admin.defaultCostItems.map((item, idx) => (
                        <div key={item.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const newList = [...admin.defaultCostItems];
                              newList[idx].name = e.target.value.toUpperCase();
                              handleAdminChange('defaultCostItems', newList);
                            }}
                            className="flex-1 border-2 border-slate-200 px-3 py-1 font-bold"
                          />
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const newList = [...admin.defaultCostItems];
                              newList[idx].amount = Number(e.target.value);
                              handleAdminChange('defaultCostItems', newList);
                            }}
                            className="w-24 border-2 border-slate-200 px-3 py-1 font-mono"
                          />
                          <button onClick={() => removeDefaultItem(item.id)} className="text-rose-500 p-1">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                      Default Language
                    </label>
                    <select
                      value={admin.defaultLanguage}
                      onChange={(e) => handleAdminChange('defaultLanguage', e.target.value)}
                      className="w-full border-2 border-slate-200 px-4 py-3 font-bold outline-none focus:border-black"
                    >
                      <option value="en">English (EN)</option>
                      <option value="es">Español (ES)</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-p5-cyan/10 border-2 border-p5-cyan border-dashed rounded-lg flex items-center justify-between gap-4">
                    <p className="text-xs font-mono text-slate-600 leading-relaxed">
                      Changes to defaults will apply next time the application is reset or when a new session starts.
                    </p>
                    <button 
                      onClick={() => {
                        if (window.confirm('Replace current people and items with these defaults?')) {
                          onResetData(admin.defaultPeople, admin.defaultCostItems);
                        }
                      }}
                      className="whitespace-nowrap p5-button py-2 px-4 text-[10px] bg-p5-cyan"
                    >
                      Apply to Session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t-4 border-black bg-slate-50 flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 p5-button-secondary flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset Defaults
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] p5-button bg-p5-pink flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save & Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
