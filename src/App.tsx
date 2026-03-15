/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, User, DollarSign, ArrowRight, Calculator, AlertCircle, CheckCircle2, Languages, Check, X, Info, Share2, Download, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';

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
    discrepancyWarning: "No se pueden calcular transacciones porque nadie ha pagado más que el costo promedio. Prueba a usar 'Total Pagado Real' o aumenta los aportes.",
    syncContributions: "Sincronizar aportes con artículos",
    share: "Compartir Resumen",
    sharing: "Generando...",
    shareSuccess: "¡Imagen lista!",
    summaryFor: "Resumen para",
    settlementSummary: "Resumen de Liquidación",
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
    discrepancyWarning: "Transactions can't be calculated because no one has paid more than the average cost. Try using 'Actual Paid Total' or increase contributions.",
    syncContributions: "Sync contributions with items",
    share: "Share Summary",
    sharing: "Generating...",
    shareSuccess: "Image ready!",
    summaryFor: "Summary for",
    settlementSummary: "Settlement Summary",
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];

  const [costItems, setCostItems] = useState<CostItem[]>([
    { id: '1', name: 'cosa 1', amount: 1870 },
    { id: '2', name: 'cosa 2', amount: 500 },
  ]);

  const [people, setPeople] = useState<Person[]>([
    { id: '1', name: 'person 1', paid: 500 },
    { id: '2', name: 'person 2', paid: 1870 },
  ]);

  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPaid, setNewPersonPaid] = useState('');
  const [calculationMode, setCalculationMode] = useState<'items' | 'paid'>('items');
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'amount' | 'paid' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const totals = useMemo(() => {
    const totalCost = costItems.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = people.reduce((sum, person) => sum + person.paid, 0);
    const targetTotal = calculationMode === 'items' ? totalCost : totalPaid;
    const costEach = people.length > 0 ? targetTotal / people.length : 0;
    const discrepancy = totalCost - totalPaid;

    return { totalCost, totalPaid, costEach, discrepancy, targetTotal };
  }, [costItems, people, calculationMode]);

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

  const addCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostName || !newCostAmount) return;
    const amount = parseFloat(newCostAmount);
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
    setPeople([...people, {
      id: crypto.randomUUID(),
      name: newPersonName,
      paid: parseFloat(newPersonPaid || '0')
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
      const newAmount = parseFloat(editValue) || 0;
      setCostItems(costItems.map(item => item.id === editingId ? { ...item, amount: newAmount } : item));
    } else if (editingField === 'paid') {
      setPeople(people.map(person => person.id === editingId ? { ...person, paid: parseFloat(editValue) || 0 } : person));
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
    <div className="min-h-screen selection:bg-p5-yellow selection:text-black">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-p5-cyan rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-p5-pink rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-p5-yellow p5-halftone opacity-30" />
      </div>

      <header className="bg-white border-b-[4px] border-black py-6 sticky top-0 z-30 p5-jagged-border shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-p5-purple border-black border-[3px] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Calculator size={28} />
            </div>
            <h1 className="p5-header-text">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
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
              <h2 className="text-xl font-display uppercase italic flex items-center gap-2 text-black">
                <User size={20} className="text-p5-purple" />
                {t.people}
              </h2>
              <button 
                onClick={syncContributions}
                className="text-[10px] font-black uppercase tracking-widest text-p5-purple hover:text-black border-b-2 border-p5-purple transition-colors"
              >
                {t.syncContributions}
              </button>
            </div>
            
            <form onSubmit={addPerson} className="flex gap-3 mb-6">
              <div className="flex-1">
                <label className="p5-label">{t.name}</label>
                <input
                  type="text"
                  placeholder={t.name}
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="p5-input"
                />
              </div>
              <div className="w-28">
                <label className="p5-label">{t.paid}</label>
                <input
                  type="number"
                  placeholder={t.paid}
                  value={newPersonPaid}
                  onChange={(e) => setNewPersonPaid(e.target.value)}
                  className="p5-input"
                />
              </div>
              <button type="submit" className="p5-button self-end h-[46px] w-[46px] flex items-center justify-center p-0">
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
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(person.id, 'name', person.name)}
                          className="font-black uppercase tracking-tight text-black cursor-pointer hover:text-p5-purple transition-colors"
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
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(person.id, 'paid', person.paid)}
                          className="font-mono font-bold text-black bg-p5-cyan/20 px-2 py-0.5 cursor-pointer hover:bg-p5-cyan/40 transition-colors"
                        >
                          ${person.paid.toLocaleString()}
                        </span>
                      )}

                      <button
                        onClick={() => removePerson(person.id)}
                        className="text-black/30 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {people.length === 0 && (
                <p className="text-center py-4 text-black/40 font-mono text-xs uppercase tracking-widest">{t.noPeople}</p>
              )}
            </div>
          </section>

          {/* Cost Items Section */}
          <section className="p5-card p-6">
            <h2 className="text-xl font-display uppercase italic flex items-center gap-2 text-black mb-6">
              <DollarSign size={20} className="text-p5-purple" />
              {t.costItems}
            </h2>
            
            <form onSubmit={addCost} className="space-y-4 mb-6">
              <div>
                <label className="p5-label">{t.itemName}</label>
                <input
                  type="text"
                  placeholder={t.itemName}
                  value={newCostName}
                  onChange={(e) => setNewCostName(e.target.value)}
                  className="p5-input"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="p5-label">{t.amount}</label>
                  <input
                    type="number"
                    placeholder={t.amount}
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    className="p5-input"
                  />
                </div>
                <div className="flex-1">
                  <label className="p5-label">{t.whoPaid}</label>
                  <select
                    value={selectedPayerId}
                    onChange={(e) => setSelectedPayerId(e.target.value)}
                    className="p5-input bg-white cursor-pointer appearance-none"
                  >
                    <option value="">{t.whoPaid}</option>
                    {people.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="p5-button w-full flex items-center justify-center gap-2">
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
                    className="flex items-center justify-between p-3 bg-white border-black border-[2px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group"
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
                          className="w-full bg-p5-yellow/10 border-black border-b-2 px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'name', item.name)}
                          className="font-black uppercase tracking-tight text-black cursor-pointer hover:text-p5-purple transition-colors"
                        >
                          {item.name}
                        </span>
                      )}
                      {item.paidById && (
                        <span className="font-mono text-[9px] text-p5-purple font-black uppercase tracking-tighter">
                          {t.paid} {people.find(p => p.id === item.paidById)?.name}
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
                          className="w-20 bg-p5-yellow/10 border-black border-b-2 px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'amount', item.amount)}
                          className="font-mono font-bold text-black bg-p5-pink/20 px-2 py-0.5 cursor-pointer hover:bg-p5-pink/40 transition-colors"
                        >
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                      
                      <button
                        onClick={() => removeCost(item.id)}
                        className="text-black/30 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {costItems.length === 0 && (
                <p className="text-center py-4 text-black/40 font-mono text-xs uppercase tracking-widest">{t.noItems}</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p5-card p-8 bg-p5-purple text-white border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-white/80">{t.totalCost}</p>
              <p className="text-5xl font-display italic tracking-tighter">${totals.totalCost.toLocaleString()}</p>
            </div>
            <div className="p5-card p-8 bg-p5-cyan text-black border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-black/60">{t.costPerPerson}</p>
              <p className="text-5xl font-display italic tracking-tighter">${Math.round(totals.costEach).toLocaleString()}</p>
            </div>
          </div>

          {/* Calculation Mode Toggle */}
          <div className="p5-card p-4 flex items-center justify-between bg-white border-black">
            <div className="flex items-center gap-3 ml-2">
              <Info size={20} className="text-p5-purple" />
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/70">{t.settleBasedOn}</span>
            </div>
            <div className="flex bg-black p-1">
              <button
                onClick={() => setCalculationMode('items')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${calculationMode === 'items' ? 'bg-p5-yellow text-black' : 'text-white hover:text-p5-yellow'}`}
              >
                {t.itemsTotal}
              </button>
              <button
                onClick={() => setCalculationMode('paid')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${calculationMode === 'paid' ? 'bg-p5-yellow text-black' : 'text-white hover:text-p5-yellow'}`}
              >
                {t.actualPaid}
              </button>
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
                <p className="font-mono text-[10px] font-black uppercase tracking-widest opacity-70">
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
              <h2 className="text-xl font-display uppercase italic text-black">
                {t.individualBalances}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white font-mono text-[10px] uppercase tracking-[0.2em]">
                    <th className="px-6 py-4">{t.name}</th>
                    <th className="px-6 py-4">{t.paid}</th>
                    <th className="px-6 py-4 text-right">{t.netBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[2px] divide-black/10">
                  {balances.map((b, i) => (
                    <tr key={i} className="hover:bg-p5-yellow/5 transition-colors">
                      <td className="px-6 py-4 font-black uppercase tracking-tight text-black">{b.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-black/70">${b.paid.toLocaleString()}</td>
                      <td className={`px-6 py-4 text-right font-display italic text-2xl ${
                         b.net > 0 ? 'text-emerald-600' : b.net < 0 ? 'text-rose-600' : 'text-black/30'
                      }`}>
                        {b.net > 0 ? '+' : ''}{Math.round(b.net).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Transactions Section */}
          <section className="p5-card p-8 bg-black text-white border-none shadow-[12px_12px_0px_0px_var(--color-p5-purple)]">
            <h2 className="text-2xl font-display uppercase italic mb-8 flex items-center gap-3 text-p5-cyan">
              <ArrowRight className="animate-bounce-x" />
              {t.suggestedTransactions}
            </h2>
            
            <div className="space-y-4">
              {transactions.map((t_item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 border-white/20 border-[2px] group hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-p5-purple border-white border-2 flex items-center justify-center font-display text-xl italic">
                      {t_item.from[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-p5-cyan">{t_item.from}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">{t.pays} <span className="text-white">{t_item.to}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-display italic tracking-tighter text-p5-yellow">${t_item.amount.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
              
              {transactions.length === 0 && people.length > 0 && (
                <div className="text-center py-12">
                  {calculationMode === 'items' && Math.abs(totals.discrepancy) > 0.01 ? (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-p5-yellow/10 border-p5-yellow border-2 flex items-center justify-center mx-auto animate-p5-glitch">
                        <AlertCircle size={40} className="text-p5-yellow" />
                      </div>
                      <p className="font-mono text-xs uppercase tracking-widest text-white/60 max-w-xs mx-auto leading-relaxed">
                        {t.discrepancyWarning}
                      </p>
                      <button 
                        onClick={() => setCalculationMode('paid')}
                        className="p5-button bg-p5-yellow text-black border-white"
                      >
                        {t.settleBasedOn} {t.actualPaid}
                      </button>
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
                      <p className="text-3xl font-display italic tracking-tighter text-p5-green uppercase">{t.allSettled}</p>
                    </motion.div>
                  )}
                </div>
              )}
              
              {people.length === 0 && (
                <p className="text-center py-12 font-mono text-xs uppercase tracking-[0.3em] text-white/20">{t.addPeopleToSee}</p>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t-[3px] border-black mt-12 text-center bg-white p5-jagged-border">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-black/40">
          {t.title} &bull; {t.builtWith}
        </p>
      </footer>

      {/* Hidden Share Card for Image Generation */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={shareRef}
          className="w-[600px] p-10 bg-[#f0f0f0] text-black font-sans relative overflow-hidden"
          style={{ backgroundColor: '#f0f0f0' }}
        >
          {/* Background pattern for share image */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-p5-purple border-black border-[3px] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Calculator size={28} />
                </div>
                <h1 className="font-display text-3xl uppercase italic tracking-tighter">{t.title}</h1>
              </div>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-black/40">{new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-p5-purple p-8 border-black border-[3px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest mb-2 text-white/70">{t.totalCost}</p>
                <p className="text-4xl font-display italic tracking-tighter">${totals.totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-p5-cyan p-8 border-black border-[3px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest mb-2 text-black/60">{t.costPerPerson}</p>
                <p className="text-4xl font-display italic tracking-tighter">${Math.round(totals.costEach).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white border-black border-[3px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-6 border-b-2 border-black/10 pb-2">
                {t.suggestedTransactions}
              </h2>
              <div className="space-y-4">
                {transactions.map((t_item, i) => (
                  <div key={i} className="flex items-center justify-between border-b-2 border-black/5 pb-4 last:border-0 last:pb-0">
                    <p className="font-black uppercase tracking-tight text-lg">
                      <span className="text-p5-purple">{t_item.from}</span>
                      <span className="mx-3 font-mono text-[10px] text-black/30 font-normal uppercase tracking-widest">{t.pays}</span>
                      <span className="text-black">{t_item.to}</span>
                    </p>
                    <span className="text-3xl font-display italic tracking-tighter text-black">${t_item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center text-black/30 font-mono text-xs uppercase tracking-widest py-8 italic">{t.allSettled}</p>
                )}
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="font-mono text-[9px] text-black/30 font-black tracking-[0.4em] uppercase">Spending Splitter Summary &bull; 90s Edition</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
