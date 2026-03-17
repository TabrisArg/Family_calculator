/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, User, DollarSign, ArrowRight, Calculator, AlertCircle, CheckCircle2, Languages, Check, X, Info, Share2, Download, Palette, Settings, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { themeConfig } from './themeConfig';
import { adminSettings } from './adminSettings';
import { AdminPanel } from './components/AdminPanel';
import { FloatingColorPicker } from './components/FloatingColorPicker';

interface CostItem {
  id: string;
  name: string;
  amount: number;
  paidById?: string;
}

interface Person {
  id: string;
  name: string;
  paid: number;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

type Language = 'es' | 'en';

const translations = {
  es: {
    title: "Divisor de Gastos",
    costItems: "Artículos de Costo",
    people: "Personas y Aportes",
    itemName: "Nombre del artículo",
    amount: "Monto",
    name: "Nombre",
    paid: "Pagado",
    totalCost: "Costo Total",
    costPerPerson: "Costo por Persona",
    missingFunds: "Faltan fondos:",
    extraFunds: "Sobran fondos:",
    noDiscrepancy: "¡No hay discrepancia! Todo coincide.",
    individualBalances: "Balances Individuales",
    netBalance: "Balance Neto",
    suggestedTransactions: "Transacciones Sugeridas",
    pays: "paga a",
    debtor: "Deudor",
    creditor: "Acreedor",
    to: "a",
    amountLabel: "Monto",
    pastelEdition: "Edición Pastel",
    allSettled: "¡Todo liquidado! No se necesitan transacciones.",
    noItems: "No se han añadido artículos aún",
    noPeople: "No se han añadido personas aún",
    addPeopleToSee: "Añade personas para ver transacciones",
    builtWith: "Construido con React y Tailwind CSS",
    language: "Idioma",
    editHint: "Haz clic para editar",
    whoPaid: "¿Quién pagó?",
    external: "Externo / Nadie",
    settleBasedOn: "Liquidar basado en:",
    itemsTotal: "Total de Artículos",
    actualPaid: "Total Pagado Real",
    discrepancyWarning: "No se pueden calcular transacciones porque nadie ha pagado más que el costo promedio. Prueba a aumentar los aportes.",
    syncContributions: "Sincronizar aportes con artículos",
    share: "Compartir Resumen",
    sharing: "Generando...",
    shareSuccess: "¡Imagen lista!",
    summaryFor: "Resumen para",
    settlementSummary: "Resumen de Liquidación",
    clearPeople: "Borrar Personas",
    clearItems: "Borrar Artículos",
  },
  en: {
    title: "Spending Splitter",
    costItems: "Cost Items",
    people: "People & Contributions",
    itemName: "Item name",
    amount: "Amount",
    name: "Name",
    paid: "Paid",
    totalCost: "Total Cost",
    costPerPerson: "Cost Per Person",
    missingFunds: "Missing funds:",
    extraFunds: "Extra funds:",
    noDiscrepancy: "No discrepancy! Everything matches.",
    individualBalances: "Individual Balances",
    netBalance: "Net Balance",
    suggestedTransactions: "Suggested Transactions",
    pays: "pays",
    debtor: "Debtor",
    creditor: "Creditor",
    to: "to",
    amountLabel: "Amount",
    pastelEdition: "Pastel Edition",
    allSettled: "All settled! No transactions needed.",
    noItems: "No items added yet",
    noPeople: "No people added yet",
    addPeopleToSee: "Add people to see transactions",
    builtWith: "Built with React & Tailwind CSS",
    language: "Language",
    editHint: "Click to edit",
    whoPaid: "Who paid?",
    external: "External / Nobody",
    settleBasedOn: "Settle based on:",
    itemsTotal: "Items Total",
    actualPaid: "Actual Paid Total",
    discrepancyWarning: "Transactions can't be calculated because no one has paid more than the average cost. Try to increase contributions.",
    syncContributions: "Sync contributions with items",
    share: "Share Summary",
    sharing: "Generating...",
    shareSuccess: "Image ready!",
    summaryFor: "Summary for",
    settlementSummary: "Settlement Summary",
    clearPeople: "Clear People",
    clearItems: "Clear Items",
  }
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('splitter_theme_config');
    return saved ? JSON.parse(saved) : themeConfig;
  });

  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const saved = localStorage.getItem('splitter_admin_config');
    return saved ? JSON.parse(saved) : adminSettings;
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('splitter_lang');
    if (saved) return saved as Language;
    return currentAdmin.defaultLanguage;
  });
  const t = translations[lang];

  const [costItems, setCostItems] = useState<CostItem[]>(() => {
    const saved = localStorage.getItem('splitter_cost_items');
    return saved ? JSON.parse(saved) : currentAdmin.defaultCostItems;
  });

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('splitter_people');
    return saved ? JSON.parse(saved) : currentAdmin.defaultPeople;
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isColorChangeMode, setIsColorChangeMode] = useState(false);
  const [activePicker, setActivePicker] = useState<{ key: string; color: string; x: number; y: number } | null>(null);

  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPaid, setNewPersonPaid] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'amount' | 'paid' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  // Persistence
  useEffect(() => {
    localStorage.setItem('splitter_people', JSON.stringify(people));
    localStorage.setItem('splitter_cost_items', JSON.stringify(costItems));
    localStorage.setItem('splitter_lang', lang);
  }, [people, costItems, lang]);

  const handleAdminApply = (newTheme: any, newAdmin: any) => {
    setCurrentTheme(newTheme);
    setCurrentAdmin(newAdmin);
    // If language was changed in admin, update it if it matches the old default
    if (newAdmin.defaultLanguage !== currentAdmin.defaultLanguage) {
      setLang(newAdmin.defaultLanguage);
    }
  };

  const handleElementClick = (e: React.MouseEvent) => {
    if (!isColorChangeMode) return;
    
    // Find the closest element with a data-theme-key
    const target = e.target as HTMLElement;
    const themeElement = target.closest('[data-theme-key]');
    
    if (themeElement) {
      e.preventDefault();
      e.stopPropagation();
      
      const key = themeElement.getAttribute('data-theme-key')!;
      const color = currentTheme[key as keyof typeof currentTheme];
      
      setActivePicker({
        key,
        color: typeof color === 'string' ? color : '#000000',
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleLiveColorChange = (newColor: string) => {
    if (activePicker) {
      const newTheme = { ...currentTheme, [activePicker.key]: newColor };
      setCurrentTheme(newTheme);
      setActivePicker({ ...activePicker, color: newColor });
    }
  };

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleClearPeople = () => {
    setPeople([]);
  };

  const handleClearItems = () => {
    setCostItems([]);
  };

  const totals = useMemo(() => {
    const totalCost = costItems.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = people.reduce((sum, person) => sum + person.paid, 0);
    const targetTotal = totalCost;
    const costEach = people.length > 0 ? targetTotal / people.length : 0;
    const discrepancy = totalCost - totalPaid;

    return { totalCost, totalPaid, costEach, discrepancy, targetTotal };
  }, [costItems, people]);

  const { transactions, balances } = useMemo(() => {
    if (people.length === 0) return { transactions: [], balances: [] };

    const balances = people.map(p => ({
      name: p.name,
      paid: p.paid,
      net: p.paid - totals.costEach
    }));

    const payers = balances
      .filter(b => b.net < -0.01)
      .map(b => ({ name: b.name, amount: Math.abs(b.net) }))
      .sort((a, b) => b.amount - a.amount);

    const receivers = balances
      .filter(b => b.net > 0.01)
      .map(b => ({ name: b.name, amount: b.net }))
      .sort((a, b) => b.amount - a.amount);

    const transactions: Transaction[] = [];
    let pIdx = 0;
    let rIdx = 0;

    const tempPayers = [...payers];
    const tempReceivers = [...receivers];

    while (pIdx < tempPayers.length && rIdx < tempReceivers.length) {
      const payer = tempPayers[pIdx];
      const receiver = tempReceivers[rIdx];
      const amount = Math.min(payer.amount, receiver.amount);

      if (amount > 0.01) {
        transactions.push({
          from: payer.name,
          to: receiver.name,
          amount: Math.round(amount * 100) / 100
        });
      }

      payer.amount -= amount;
      receiver.amount -= amount;

      if (payer.amount < 0.01) pIdx++;
      if (receiver.amount < 0.01) rIdx++;
    }

    return { transactions, balances };
  }, [people, totals.costEach]);

  const roundToNearest500 = (num: number) => {
    if (num <= 0) return 0;
    return Math.max(500, Math.round(num / 500) * 500);
  };

  const addCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostName || !newCostAmount) return;
    const amount = roundToNearest500(parseFloat(newCostAmount));
    const newItem: CostItem = {
      id: crypto.randomUUID(),
      name: newCostName,
      amount,
      paidById: selectedPayerId || undefined
    };
    
    setCostItems([...costItems, newItem]);
    
    setNewCostName('');
    setNewCostAmount('');
    setSelectedPayerId('');
  };

  const addPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName) return;
    const paid = roundToNearest500(parseFloat(newPersonPaid || '0'));
    setPeople([...people, {
      id: crypto.randomUUID(),
      name: newPersonName,
      paid
    }]);
    setNewPersonName('');
    setNewPersonPaid('');
  };

  const removeCost = (id: string) => {
    setCostItems(costItems.filter(i => i.id !== id));
  };

  const removePerson = (id: string) => setPeople(people.filter(p => p.id !== id));

  const startEditing = (id: string, field: 'name' | 'amount' | 'paid', value: string | number) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(value.toString());
  };

  const saveEdit = () => {
    if (!editingId || !editingField) return;

    if (editingField === 'name') {
      setCostItems(costItems.map(item => item.id === editingId ? { ...item, name: editValue } : item));
      setPeople(people.map(person => person.id === editingId ? { ...person, name: editValue } : person));
    } else if (editingField === 'amount') {
      const newAmount = roundToNearest500(parseFloat(editValue) || 0);
      setCostItems(costItems.map(item => item.id === editingId ? { ...item, amount: newAmount } : item));
    } else if (editingField === 'paid') {
      const newPaid = roundToNearest500(parseFloat(editValue) || 0);
      setPeople(people.map(person => person.id === editingId ? { ...person, paid: newPaid } : person));
    }

    setEditingId(null);
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const syncContributions = () => {
    const newPeople = [...people];
    costItems.forEach(item => {
      const person = newPeople.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (person) {
        person.paid = item.amount;
      }
    });
    setPeople(newPeople);
  };
  
  const handleShare = async () => {
    if (!shareRef.current) return;
    setIsSharing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(shareRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'spending-summary.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t.title,
          text: t.settlementSummary,
        });
      } else {
        const link = document.createElement('a');
        link.download = 'spending-summary.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div 
      className={`min-h-screen selection:bg-p5-yellow selection:text-black ${isColorChangeMode ? 'cursor-crosshair' : ''}`}
      onClick={handleElementClick}
    >
      <style>{`
        :root {
          --main-text: ${currentTheme.mainTextColor};
          --muted-text: ${currentTheme.mutedTextColor};
          --sync-text: ${currentTheme.syncContributionsTextColor};
          --footer-text: ${currentTheme.footerTextColor};
          
          --header-title: ${currentTheme.headerTitleColor};
          --header-title-shadow: ${currentTheme.headerTitleShadow};
          --header-icon-color: ${currentTheme.headerIconColor};
          --header-icon-bg: ${currentTheme.headerIconBg};
          
          --section-header: ${currentTheme.sectionHeaderTextColor};
          --section-header-shadow: ${currentTheme.sectionHeaderShadowColor};
          --section-icon: ${currentTheme.sectionIconColor};
          
          --form-label: ${currentTheme.formLabelColor};
          --form-input: ${currentTheme.formInputTextColor};
          --button-text: ${currentTheme.buttonTextColor};
          --button-text-shadow: ${currentTheme.buttonTextShadow};
          
          --person-name: ${currentTheme.personNameColor};
          --person-paid: ${currentTheme.personPaidColor};
          --person-paid-label: ${currentTheme.personPaidLabelColor};
          --person-remove: ${currentTheme.personRemoveIconColor};
          
          --cost-items-bg: ${currentTheme.costItemsCardBg};
          --cost-item-name: ${currentTheme.costItemNameColor};
          --cost-item-amount: ${currentTheme.costItemAmountColor};
          --cost-item-paid-by: ${currentTheme.costItemPaidByColor};
          --cost-item-label: ${currentTheme.costItemLabelColor};
          --cost-item-remove: ${currentTheme.costItemRemoveIconColor};
          
          --table-header-bg: ${currentTheme.tableHeaderBg};
          --table-header-text: ${currentTheme.tableHeaderTextColor};
          --table-name: ${currentTheme.tableNameColor};
          --table-paid: ${currentTheme.tablePaidColor};
          --table-net-pos: ${currentTheme.tableNetPositiveColor};
          --table-net-neg: ${currentTheme.tableNetNegativeColor};
          --table-net-neu: ${currentTheme.tableNetNeutralColor};
          --table-net-shadow: ${currentTheme.tableNetShadow};
          
          --trans-bg: ${currentTheme.transactionsCardBg};
          --trans-header: ${currentTheme.transactionsHeaderColor};
          --trans-header-shadow: ${currentTheme.transactionsHeaderShadow};
          --trans-debtor: ${currentTheme.transactionDebtorLabel};
          --trans-creditor: ${currentTheme.transactionCreditorLabel};
          --trans-pays: ${currentTheme.transactionPaysLabel};
          --trans-to: ${currentTheme.transactionToLabel};
          --trans-amount: ${currentTheme.transactionAmountColor};
          --trans-amount-shadow: ${currentTheme.transactionAmountShadow};
          --trans-name: ${currentTheme.transactionNameColor};
          --trans-name-shadow: ${currentTheme.transactionNameShadow};
          
          --no-people-text: ${currentTheme.noPeopleTextColor};
          --add-people-text: ${currentTheme.addPeopleToSeeTextColor};
          --discrepancy-text: ${currentTheme.discrepancyWarningTextColor};
          --all-settled-text: ${currentTheme.allSettledTextColor};
          
          --total-cost-bg: ${currentTheme.totalCostCardBg};
          --total-cost-label: ${currentTheme.totalCostLabelColor};
          --total-cost-value: ${currentTheme.totalCostValueColor};
          --cpp-bg: ${currentTheme.costPerPersonCardBg};
          --cpp-label: ${currentTheme.costPerPersonLabelColor};
          --cpp-value: ${currentTheme.costPerPersonValueColor};
          --summary-shadow: ${currentTheme.summaryCardShadow};
          
          --share-bg: ${currentTheme.shareBackground};
          --share-title: ${currentTheme.shareTitleColor};
          --share-date: ${currentTheme.shareDateColor};
          --share-stat-label: ${currentTheme.shareStatLabelColor};
          --share-stat-value: ${currentTheme.shareStatValueColor};
          --share-section: ${currentTheme.shareSectionHeaderColor};
          --share-item-name: ${currentTheme.shareItemNameColor};
          --share-pays-label: ${currentTheme.sharePaysLabelColor};
          --share-amount-label: ${currentTheme.shareAmountLabelColor};
          --share-amount-value: ${currentTheme.shareAmountValueColor};
          --share-footer: ${currentTheme.shareFooterColor};
          --share-shadow: ${currentTheme.shareShadow};
          --share-icon-bg: ${currentTheme.shareIconBg};
          --share-icon-color: ${currentTheme.shareIconColor};
        }
        
        ${isColorChangeMode ? `
          [data-theme-key] {
            outline: 2px dashed #FF69B4 !important;
            outline-offset: 2px;
            cursor: pointer !important;
            transition: outline-color 0.2s;
          }
          [data-theme-key]:hover {
            outline-color: #00FFFF !important;
            background-color: rgba(255, 105, 180, 0.1) !important;
          }
        ` : ''}
      `}</style>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-p5-cyan rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-p5-pink rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-p5-yellow p5-halftone opacity-30" />
      </div>

      <header className="bg-white border-b-[4px] border-black py-6 sticky top-0 z-30 p5-jagged-border shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-black border-[3px] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                 style={{ backgroundColor: 'var(--header-icon-bg)', color: 'var(--header-icon-color)' }}
                 data-theme-key="headerIconBg">
              <Calculator size={28} />
            </div>
            <h1 className="p5-header-text" 
                style={{ color: 'var(--header-title)', textShadow: 'var(--header-title-shadow)' }}
                data-theme-key="headerTitleColor">
              {t.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentAdmin.SHOW_ADMIN_PANEL && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border-2 border-black">
                <button
                  onClick={() => {
                    setIsColorChangeMode(!isColorChangeMode);
                    setActivePicker(null);
                  }}
                  className={`p-2 rounded-full transition-all ${isColorChangeMode ? 'bg-p5-pink text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]' : 'hover:bg-black/5 text-slate-400'}`}
                  title={isColorChangeMode ? "Disable Color Change Mode" : "Enable Color Change Mode"}
                >
                  <MousePointer2 size={18} />
                </button>
                <div className="w-[2px] h-4 bg-black/10" />
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-black"
                  title="Admin Panel"
                >
                  <Settings size={18} />
                </button>
              </div>
            )}
            <div className="flex bg-black p-1">
              <button
                onClick={() => setLang('es')}
                className={`px-4 py-1.5 text-xs font-black transition-all ${lang === 'es' ? 'bg-p5-yellow text-black' : 'text-white hover:text-p5-yellow'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-1.5 text-xs font-black transition-all ${lang === 'en' ? 'bg-p5-yellow text-black' : 'text-white hover:text-p5-yellow'}`}
              >
                EN
              </button>
            </div>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p5-button flex items-center gap-2"
              style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
            >
              {isSharing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Share2 size={18} />}
              <span className="hidden sm:inline">{isSharing ? t.sharing : t.share}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          {/* People Section */}
          <section className="p5-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display uppercase italic flex items-center gap-2" 
                  style={{ color: 'var(--section-header)', textShadow: '2px 2px 0px var(--section-header-shadow)' }}
                  data-theme-key="sectionHeaderTextColor">
                <User size={20} style={{ color: 'var(--section-icon)' }} data-theme-key="sectionIconColor" />
                {t.people}
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={syncContributions}
                  className="text-[10px] font-black uppercase tracking-widest hover:text-p5-purple border-b-2 transition-colors"
                  style={{ color: 'var(--sync-text)', borderColor: 'var(--sync-text)' }}
                  data-theme-key="syncContributionsTextColor"
                >
                  {t.syncContributions}
                </button>
                <button 
                  onClick={handleClearPeople}
                  className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 border-b-2 border-rose-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {t.clearPeople}
                </button>
              </div>
            </div>
            
            <form onSubmit={addPerson} className="flex gap-3 mb-6">
              <div className="flex-1">
                <label className="p5-label" style={{ color: 'var(--form-label)', textShadow: 'none' }} data-theme-key="formLabelColor">{t.name}</label>
                <input
                  type="text"
                  placeholder={t.name}
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="p5-input"
                  style={{ color: 'var(--form-input)' }}
                />
              </div>
              <div className="w-28">
                <label className="p5-label" style={{ color: 'var(--form-label)', textShadow: 'none' }} data-theme-key="formLabelColor">{t.paid}</label>
                <input
                  type="number"
                  placeholder={t.paid}
                  value={newPersonPaid}
                  onChange={(e) => setNewPersonPaid(e.target.value)}
                  className="p5-input"
                  style={{ color: 'var(--form-input)' }}
                />
              </div>
              <button type="submit" className="p5-button self-end h-[46px] w-[46px] flex items-center justify-center p-0" style={{ color: 'var(--button-text)', textShadow: 'var(--button-text-shadow)' }}>
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {people.map((person) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 bg-white border-black border-[2px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group"
                  >
                    <div className="flex-1">
                      {editingId === person.id && editingField === 'name' ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-p5-yellow/10 border-black border-b-2 px-2 py-1 text-sm focus:outline-none"
                          style={{ color: 'var(--person-name)' }}
                          data-theme-key="personNameColor"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(person.id, 'name', person.name)}
                          className="font-black uppercase tracking-tight cursor-pointer hover:text-p5-purple transition-colors"
                          style={{ color: 'var(--person-name)' }}
                          data-theme-key="personNameColor"
                        >
                          {person.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {editingId === person.id && editingField === 'paid' ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-20 bg-p5-yellow/10 border-black border-b-2 px-2 py-1 text-sm focus:outline-none"
                          style={{ color: 'var(--person-paid)' }}
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(person.id, 'paid', person.paid)}
                          className="font-mono font-bold bg-p5-cyan/20 px-2 py-0.5 cursor-pointer hover:bg-p5-cyan/40 transition-colors"
                          style={{ color: 'var(--person-paid)' }}
                          data-theme-key="personPaidColor"
                        >
                          ${person.paid.toLocaleString()}
                        </span>
                      )}

                      <button
                        onClick={() => removePerson(person.id)}
                        className="transition-colors opacity-0 group-hover:opacity-100"
                        style={{ color: 'var(--person-remove)' }}
                        data-theme-key="personRemoveIconColor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {people.length === 0 && (
                <p className="text-center py-4 font-mono text-xs uppercase tracking-widest" 
                   style={{ color: 'var(--no-people-text)' }}
                   data-theme-key="noPeopleTextColor">
                  {t.noPeople}
                </p>
              )}
            </div>
          </section>

          {/* Cost Items Section */}
          <section className="p5-card p-6" style={{ backgroundColor: 'var(--cost-items-bg)' }} data-theme-key="costItemsCardBg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display uppercase italic flex items-center gap-2" 
                  style={{ color: 'var(--cost-item-name)', textShadow: '2px 2px 0px var(--section-header-shadow)' }}
                  data-theme-key="costItemNameColor">
                <DollarSign size={20} style={{ color: 'var(--section-icon)' }} data-theme-key="sectionIconColor" />
                {t.costItems}
              </h2>
              <button 
                onClick={handleClearItems}
                className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-100 border-b-2 border-rose-300 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                {t.clearItems}
              </button>
            </div>
            
            <form onSubmit={addCost} className="space-y-4 mb-6">
              <div>
                <label className="p5-label" style={{ color: 'var(--cost-item-label)', textShadow: 'none' }} data-theme-key="costItemLabelColor">{t.itemName}</label>
                <input
                  type="text"
                  placeholder={t.itemName}
                  value={newCostName}
                  onChange={(e) => setNewCostName(e.target.value)}
                  className="p5-input"
                  style={{ color: 'var(--form-input)' }}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="p5-label" style={{ color: 'var(--cost-item-label)', textShadow: 'none' }} data-theme-key="costItemLabelColor">{t.amount}</label>
                  <input
                    type="number"
                    placeholder={t.amount}
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    className="p5-input"
                    style={{ color: 'var(--form-input)' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="p5-label" style={{ color: 'var(--cost-item-label)', textShadow: 'none' }} data-theme-key="costItemLabelColor">{t.whoPaid}</label>
                  <select
                    value={selectedPayerId}
                    onChange={(e) => setSelectedPayerId(e.target.value)}
                    className="p5-input bg-white cursor-pointer appearance-none"
                    style={{ color: 'var(--form-input)' }}
                  >
                    <option value="">{t.whoPaid}</option>
                    {people.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="p5-button w-full flex items-center justify-center gap-2" style={{ color: 'var(--button-text)', textShadow: 'var(--button-text-shadow)' }}>
                <Plus size={20} />
                {t.costItems}
              </button>
            </form>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {costItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 bg-white/10 border-white/20 border-[2px] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] group"
                  >
                    <div className="flex-1 flex flex-col">
                      {editingId === item.id && editingField === 'name' ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white/10 border-white/20 border-b-2 px-2 py-1 text-sm focus:outline-none"
                          style={{ color: 'var(--cost-item-name)' }}
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'name', item.name)}
                          className="font-black uppercase tracking-tight cursor-pointer hover:text-p5-purple transition-colors"
                          style={{ color: 'var(--cost-item-name)' }}
                          data-theme-key="costItemNameColor"
                        >
                          {item.name}
                        </span>
                      )}
                      {item.paidById && (
                        <span className="font-mono text-[9px] font-black uppercase tracking-widest" 
                              style={{ color: 'var(--cost-item-paid-by)' }}
                              data-theme-key="costItemPaidByColor">
                          {t.paid} <span className="text-p5-purple">{people.find(p => p.id === item.paidById)?.name}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {editingId === item.id && editingField === 'amount' ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-20 bg-white/10 border-white/20 border-b-2 px-2 py-1 text-sm focus:outline-none"
                          style={{ color: 'var(--cost-item-amount)' }}
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'amount', item.amount)}
                          className="font-mono font-bold bg-white/5 px-2 py-0.5 cursor-pointer hover:bg-white/10 transition-colors"
                          style={{ color: 'var(--cost-item-amount)' }}
                          data-theme-key="costItemAmountColor"
                        >
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                      
                      <button
                        onClick={() => removeCost(item.id)}
                        className="transition-colors opacity-0 group-hover:opacity-100"
                        style={{ color: 'var(--cost-item-remove)' }}
                        data-theme-key="costItemRemoveIconColor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {costItems.length === 0 && (
                <p className="text-center py-4 font-mono text-xs uppercase tracking-widest" 
                   style={{ color: 'var(--cost-item-label)' }}
                   data-theme-key="costItemLabelColor">
                  {t.noItems}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p5-card p-8 border-black" 
                 style={{ backgroundColor: 'var(--total-cost-bg)', color: 'var(--total-cost-value)', shadow: 'var(--summary-shadow)' }}
                 data-theme-key="summaryTotalCardBg">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] mb-2" 
                 style={{ color: 'var(--total-cost-label)' }}
                 data-theme-key="summaryTotalLabelColor">
                {t.totalCost}
              </p>
              <p className="text-5xl font-display italic tracking-tighter" data-theme-key="summaryTotalValueColor">${totals.totalCost.toLocaleString()}</p>
            </div>
            <div className="p5-card p-8 border-black" 
                 style={{ backgroundColor: 'var(--cpp-bg)', color: 'var(--cpp-value)', shadow: 'var(--summary-shadow)' }}
                 data-theme-key="costPerPersonCardBg">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] mb-2" 
                 style={{ color: 'var(--cpp-label)' }}
                 data-theme-key="costPerPersonLabelColor">
                {t.costPerPerson}
              </p>
              <p className="text-5xl font-display italic tracking-tighter" data-theme-key="costPerPersonValueColor">${Math.round(totals.costEach).toLocaleString()}</p>
            </div>
          </div>

          {/* Discrepancy Alert */}
          {Math.abs(totals.discrepancy) > 0.01 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 border-black border-[3px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 ${
                totals.discrepancy > 0 
                  ? 'bg-p5-yellow text-black' 
                  : 'bg-p5-green text-black'
              }`}
            >
              <div className="w-12 h-12 bg-black/10 border-black border-2 flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black">
                  {totals.discrepancy > 0 ? t.missingFunds : t.extraFunds}
                </p>
                <p className="text-3xl font-display italic tracking-tighter">
                  ${Math.abs(totals.discrepancy).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}

          {/* Individual Balances Table */}
          <section className="p5-card overflow-hidden">
            <div className="p-6 border-b-[3px] border-black bg-p5-pink/10">
              <h2 className="text-xl font-display uppercase italic" 
                  style={{ color: 'var(--section-header)', textShadow: '2px 2px 0px var(--section-header-shadow)' }}
                  data-theme-key="sectionHeaderTextColor">
                {t.individualBalances}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }} 
                      className="font-mono text-[10px] uppercase tracking-[0.2em]"
                      data-theme-key="tableHeaderBg">
                    <th className="px-6 py-4" data-theme-key="tableHeaderTextColor">{t.name}</th>
                    <th className="px-6 py-4" data-theme-key="tableHeaderTextColor">{t.paid}</th>
                    <th className="px-6 py-4 text-right" data-theme-key="tableHeaderTextColor">{t.netBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[2px] divide-black/10">
                  {balances.map((b, i) => (
                    <tr key={i} className="hover:bg-p5-yellow/5 transition-colors">
                      <td className="px-6 py-4 font-black uppercase tracking-tight" 
                          style={{ color: 'var(--table-name)' }}
                          data-theme-key="tableNameColor">
                        {b.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm" 
                          style={{ color: 'var(--table-paid)' }}
                          data-theme-key="tablePaidColor">
                        ${b.paid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-display italic text-2xl" style={{ 
                         color: b.net > 0 ? 'var(--table-net-pos)' : b.net < 0 ? 'var(--table-net-neg)' : 'var(--table-net-neu)',
                         textShadow: 'var(--table-net-shadow)' 
                      }}
                      data-theme-key={b.net > 0 ? 'tableNetPositiveColor' : b.net < 0 ? 'tableNetNegativeColor' : 'tableNetNeutralColor'}>
                        {b.net > 0 ? '+' : ''}{Math.round(b.net).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Transactions Section */}
          <section className="p5-card p-8 border-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)]" 
                   style={{ backgroundColor: 'var(--trans-bg)' }}
                   data-theme-key="transactionsCardBg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-display uppercase italic flex items-center gap-3" 
                  style={{ color: 'var(--trans-header)', textShadow: '2px 2px 0px var(--trans-header-shadow)' }}
                  data-theme-key="transactionsHeaderColor">
                <ArrowRight className="animate-bounce-x" />
                {t.suggestedTransactions}
              </h2>
            </div>
            
            <div className="space-y-4">
              {transactions.map((t_item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 bg-white/10 border-white/10 border-[2px] group hover:bg-white/15 transition-colors relative overflow-hidden rounded-xl"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-p5-yellow/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-p5-yellow/20 transition-colors" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-14 h-14 bg-p5-purple border-white border-[3px] flex items-center justify-center font-display text-2xl italic shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] text-slate-800">
                          {t_item.from[0].toUpperCase()}
                        </div>
                        <span className="font-mono text-[8px] uppercase tracking-widest font-bold" 
                              style={{ color: 'var(--trans-debtor)' }}
                              data-theme-key="transactionDebtorLabel">
                          {t.debtor}
                        </span>
                      </div>
 
                      <div className="flex-1 flex flex-col items-center px-2">
                        <div className="w-full h-[2px] bg-white/40 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 border-t-2 border-r-2 border-white/60" />
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] my-1" 
                              style={{ color: 'var(--trans-pays)', textShadow: 'var(--trans-header-shadow)' }}
                              data-theme-key="transactionPaysLabel">
                          {t.pays}
                        </span>
                        <div className="w-full h-[2px] bg-white/40" />
                      </div>
 
                      <div className="flex flex-col items-center gap-1 text-right">
                        <div className="w-14 h-14 bg-white border-slate-800 border-[3px] flex items-center justify-center font-display text-2xl italic text-slate-900 shadow-[4px_4px_0px_0px_var(--color-p5-cyan)]">
                          {t_item.to[0].toUpperCase()}
                        </div>
                        <span className="font-mono text-[8px] uppercase tracking-widest font-bold" 
                              style={{ color: 'var(--trans-creditor)', textShadow: 'var(--trans-header-shadow)' }}
                              data-theme-key="transactionCreditorLabel">
                          {t.creditor}
                        </span>
                      </div>
                    </div>
 
                    <div className="flex flex-col items-start sm:items-end justify-center min-w-[120px]">
                      <div className="flex flex-col">
                        <span className="font-display text-xl leading-none mb-1 tracking-tight" 
                              style={{ color: 'var(--trans-name)', textShadow: 'var(--trans-name-shadow)' }}
                              data-theme-key="transactionNameColor">
                          {t_item.from}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest mb-3" 
                              style={{ color: 'var(--trans-to)', textShadow: 'var(--trans-header-shadow)' }}
                              data-theme-key="transactionToLabel">
                          {t.to} {t_item.to}
                        </span>
                      </div>
                      <p className="text-4xl font-display italic tracking-tighter" 
                         style={{ color: 'var(--trans-amount)', textShadow: 'var(--trans-amount-shadow)' }}
                         data-theme-key="transactionAmountColor">
                        ${t_item.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {transactions.length === 0 && people.length > 0 && (
                <div className="text-center py-12">
                  {Math.abs(totals.discrepancy) > 0.01 ? (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-p5-yellow/10 border-p5-yellow border-2 flex items-center justify-center mx-auto animate-p5-glitch">
                        <AlertCircle size={40} className="text-p5-yellow" />
                      </div>
                      <p className="font-mono text-xs uppercase tracking-widest font-bold max-w-xs mx-auto leading-relaxed" 
                         style={{ color: 'var(--discrepancy-text)' }}
                         data-theme-key="discrepancyWarningTextColor">
                        {t.discrepancyWarning}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="w-20 h-20 bg-p5-green/20 text-p5-green border-p5-green border-2 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} />
                      </div>
                      <p className="text-3xl font-display italic tracking-tighter uppercase" 
                         style={{ color: 'var(--all-settled-text)' }}
                         data-theme-key="allSettledTextColor">
                        {t.allSettled}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
              
              {people.length === 0 && (
                <p className="text-center py-12 font-mono text-xs uppercase tracking-[0.3em]" 
                   style={{ color: 'var(--add-people-text)' }}
                   data-theme-key="addPeopleToSeeTextColor">
                  {t.addPeopleToSee}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t-[3px] border-black mt-12 text-center bg-white p5-jagged-border">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em]" 
           style={{ color: 'var(--footer-text)' }}
           data-theme-key="footerTextColor">
          {t.title} &bull; {t.builtWith}
        </p>
      </footer>

      {/* Hidden Share Card for Image Generation */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={shareRef}
          className="w-[600px] p-10 font-sans relative overflow-hidden"
          style={{ backgroundColor: 'var(--share-bg)', color: 'var(--share-text)' }}
          data-theme-key="shareBg"
        >
          {/* Background pattern for share image */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border-white border-[2px] flex items-center justify-center shadow-[4px_4px_0px_0px_var(--share-shadow)]" 
                     style={{ backgroundColor: 'var(--share-icon-bg)', color: 'var(--share-icon-color)' }}
                     data-theme-key="shareIconBg">
                  <Calculator size={28} />
                </div>
                <h1 className="font-display text-3xl uppercase italic tracking-normal" 
                    style={{ color: 'var(--share-text)' }}
                    data-theme-key="shareTitleColor">
                  {t.title}
                </h1>
              </div>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest" 
                 style={{ color: 'var(--share-date)' }}
                 data-theme-key="shareDateColor">
                {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-p5-purple p-8 border-white/20 border-[2px] shadow-[6px_6px_0px_0px_var(--share-shadow)] text-slate-800">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest mb-2" 
                   style={{ color: 'var(--share-stat-label)' }}
                   data-theme-key="shareStatLabelColor">
                  {t.totalCost}
                </p>
                <p className="text-4xl font-display italic tracking-tighter" 
                   style={{ color: 'var(--share-stat-value)' }}
                   data-theme-key="shareStatValueColor">
                  ${totals.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="bg-p5-cyan p-8 border-white/20 border-[2px] shadow-[6px_6px_0px_0px_var(--share-shadow)] text-slate-800">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest mb-2" 
                   style={{ color: 'var(--share-stat-label)' }}
                   data-theme-key="shareStatLabelColor">
                  {t.costPerPerson}
                </p>
                <p className="text-4xl font-display italic tracking-tighter" 
                   style={{ color: 'var(--share-stat-value)' }}
                   data-theme-key="shareStatValueColor">
                  ${Math.round(totals.costEach).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white/10 border-white/10 border-[2px] shadow-[6px_6px_0px_0px_var(--share-shadow)] p-8 rounded-xl">
              <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.2em] mb-6 border-b-2 border-white/5 pb-2" style={{ color: 'var(--share-sec-header)' }}>
                {t.suggestedTransactions}
              </h2>
              <div className="space-y-6">
                {transactions.map((t_item, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-white/5 border-white/10 border-[2px] rounded-lg">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-p5-purple border-white border-2 flex items-center justify-center text-slate-800 font-display text-lg italic">
                          {t_item.from[0].toUpperCase()}
                        </div>
                        <span className="font-black uppercase tracking-tight text-[10px] mt-1" style={{ color: 'var(--share-item-name)' }}>{t_item.from}</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full h-[1px] bg-white/20 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-1.5 h-1.5 border-t-2 border-r-2 border-white/30" />
                        </div>
                        <span className="font-mono text-[8px] uppercase tracking-[0.2em] my-1" style={{ color: 'var(--share-pays)' }}>{t.pays}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-p5-cyan border-white border-2 flex items-center justify-center text-slate-800 font-display text-lg italic">
                          {t_item.to[0].toUpperCase()}
                        </div>
                        <span className="font-black uppercase tracking-tight text-[10px] mt-1" style={{ color: 'var(--share-item-name)' }}>{t_item.to}</span>
                      </div>
                    </div>
                    
                    <div className="text-right border-l-2 border-white/10 pl-6 py-2">
                      <p className="font-mono text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--share-amount-label)' }}>{t.amountLabel}</p>
                      <p className="text-3xl font-display italic tracking-tighter" style={{ color: 'var(--share-amount-value)' }}>${t_item.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-white/40 font-mono text-xs uppercase tracking-widest py-8 italic">{t.allSettled}</p>
                )}
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="font-mono text-[9px] font-black tracking-[0.4em] uppercase" style={{ color: 'var(--share-footer)' }}>{t.title} &bull; {t.pastelEdition}</p>
            </div>
          </div>
        </div>
      </div>
      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onApply={handleAdminApply}
        onResetData={(newPeople, newItems) => {
          setPeople(newPeople);
          setCostItems(newItems);
        }}
      />
      
      <FloatingColorPicker
        isOpen={!!activePicker}
        onClose={() => setActivePicker(null)}
        color={activePicker?.color || ''}
        onChange={handleLiveColorChange}
        position={{ x: activePicker?.x || 0, y: activePicker?.y || 0 }}
        label={activePicker?.key || ''}
      />
    </div>
  );
}
