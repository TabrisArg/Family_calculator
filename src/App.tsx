/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, User, DollarSign, ArrowRight, Calculator, AlertCircle, CheckCircle2, Languages, Check, X, Info, Share2, Download } from 'lucide-react';
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
    settlementSummary: "Resumen de Liquidación"
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
    settlementSummary: "Settlement Summary"
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
      // Small delay to ensure any animations settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(shareRef.current, {
        quality: 0.95,
        backgroundColor: '#fdfcf0', // p5-white
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
    <div className="min-h-screen bg-p5-white text-p5-black font-sans selection:bg-p5-purple selection:text-p5-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 -z-10">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-p5-purple rotate-12 p5-halftone opacity-20" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-p5-purple -rotate-12 p5-halftone opacity-20" />
        
        {/* Shards */}
        <div className="absolute top-1/4 -left-10 w-64 h-32 bg-p5-black rotate-[30deg] p5-jagged-border opacity-5" />
        <div className="absolute top-1/2 -right-10 w-80 h-40 bg-p5-purple -rotate-[15deg] p5-jagged-border opacity-10" />
        <div className="absolute bottom-1/4 left-1/3 w-40 h-80 bg-p5-white rotate-[45deg] p5-jagged-border opacity-40 border-4 border-p5-black" />
        
        {/* Halftone Overlay */}
        <div className="absolute inset-0 p5-halftone opacity-5" />
      </div>

      <header className="relative z-20 bg-p5-purple py-6 border-b-8 border-p5-black p5-skew-left -mt-4 shadow-[0_10px_0_rgba(0,0,0,1)]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between p5-skew-right">
          <div className="flex items-center gap-6">
            <motion.div 
              animate={{ rotate: [12, 15, 12] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-16 h-16 bg-p5-black text-p5-white flex items-center justify-center border-4 border-p5-white shadow-[4px_4px_0_rgba(255,255,255,0.5)]"
            >
              <Calculator size={36} />
            </motion.div>
            <h1 className="p5-header-text text-5xl md:text-6xl">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 bg-p5-black text-p5-white px-4 py-2 border-2 border-p5-white hover:bg-p5-purple hover:text-p5-black transition-all disabled:opacity-50"
            >
              {isSharing ? <div className="animate-spin h-4 w-4 border-2 border-p5-white border-t-transparent rounded-full" /> : <Share2 size={18} />}
              <span className="font-display text-sm uppercase tracking-widest hidden sm:inline">
                {isSharing ? t.sharing : t.share}
              </span>
            </button>
            <div className="flex items-center gap-2 bg-p5-black p-1 border-2 border-p5-white">
              <button
                onClick={() => setLang('es')}
                className={`px-4 py-1 text-sm font-display uppercase transition-all ${lang === 'es' ? 'bg-p5-white text-p5-black' : 'text-p5-white hover:bg-p5-purple hover:text-p5-black'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-4 py-1 text-sm font-display uppercase transition-all ${lang === 'en' ? 'bg-p5-white text-p5-black' : 'text-p5-white hover:bg-p5-purple hover:text-p5-black'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-12">
          {/* People Section */}
          <section className="p5-card p-8 -rotate-1 relative">
            <div className="absolute -top-6 -right-4 bg-p5-purple text-p5-white px-6 py-2 p5-skew-right border-2 border-p5-black z-30">
              <h2 className="font-display text-2xl uppercase italic tracking-tighter flex items-center gap-2 p5-skew-left p5-text-white-shadow">
                <User size={20} className="text-p5-black" />
                {t.people}
              </h2>
            </div>
            
            <div className="mt-4">
              <div className="mb-6 flex justify-end">
                <button 
                  onClick={syncContributions}
                  className="font-marker text-p5-purple hover:scale-110 transition-transform text-sm bg-p5-black px-3 py-1 p5-skew-left"
                >
                  <span className="p5-skew-right inline-block">{t.syncContributions}</span>
                </button>
              </div>
              
              <form onSubmit={addPerson} className="flex gap-4 mb-8">
                <input
                  type="text"
                  placeholder={t.name}
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="p5-input flex-1"
                />
                <input
                  type="number"
                  placeholder={t.paid}
                  value={newPersonPaid}
                  onChange={(e) => setNewPersonPaid(e.target.value)}
                  className="p5-input w-32"
                />
                <button type="submit" className="p5-button-yellow text-2xl px-4">
                  +
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {people.map((person) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, x: -50, skewX: 20 }}
                    animate={{ opacity: 1, x: 0, skewX: 6 }}
                    exit={{ opacity: 0, x: 50, skewX: -20 }}
                    className="flex items-center justify-between p-4 bg-p5-black text-p5-white border-r-8 border-p5-purple group"
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
                          className="bg-p5-white text-p5-black px-2 py-1 font-bebas text-lg focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(person.id, 'name', person.name)}
                          className="font-bebas text-2xl uppercase tracking-wide cursor-pointer hover:text-p5-purple transition-colors"
                        >
                          {person.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {editingId === person.id && editingField === 'paid' ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-24 bg-p5-white text-p5-black px-2 py-1 font-bebas text-lg focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(person.id, 'paid', person.paid)}
                          className="font-bebas text-3xl cursor-pointer hover:text-p5-purple transition-colors"
                        >
                          ${person.paid.toLocaleString()}
                        </span>
                      )}

                      <button
                        onClick={() => removePerson(person.id)}
                        className="text-p5-white hover:text-p5-purple transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Cost Items Section */}
          <section className="p5-card p-8 rotate-1 relative">
            <div className="absolute -top-6 -left-4 bg-p5-black text-p5-white px-6 py-2 p5-skew-left border-2 border-p5-white z-30">
              <h2 className="font-display text-2xl uppercase italic tracking-tighter flex items-center gap-2 p5-skew-right">
                <DollarSign size={20} className="text-p5-purple" />
                {t.costItems}
              </h2>
            </div>
            
            <div className="mt-4">
              <form onSubmit={addCost} className="space-y-6 mb-8">
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder={t.itemName}
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="p5-input w-full"
                  />
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder={t.amount}
                      value={newCostAmount}
                      onChange={(e) => setNewCostAmount(e.target.value)}
                      className="p5-input flex-1"
                    />
                    <select
                      value={selectedPayerId}
                      onChange={(e) => setSelectedPayerId(e.target.value)}
                      className="p5-input flex-1 bg-white cursor-pointer"
                    >
                      <option value="">{t.whoPaid}</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="p5-button-yellow w-full text-xl py-3">
                  {t.itemName} +
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {costItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -50, skewX: -20 }}
                    animate={{ opacity: 1, x: 0, skewX: -6 }}
                    exit={{ opacity: 0, x: 50, skewX: 20 }}
                    className="flex items-center justify-between p-4 bg-p5-black text-p5-white border-l-8 border-p5-purple group"
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
                          className="bg-p5-white text-p5-black px-2 py-1 font-bebas text-lg focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'name', item.name)}
                          className="font-bebas text-2xl uppercase tracking-wide cursor-pointer hover:text-p5-purple transition-colors"
                        >
                          {item.name}
                        </span>
                      )}
                      {item.paidById && (
                        <span className="text-[10px] text-p5-purple uppercase font-black tracking-widest">
                          BY {people.find(p => p.id === item.paidById)?.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {editingId === item.id && editingField === 'amount' ? (
                        <input
                          ref={editInputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={handleKeyDown}
                          className="w-24 bg-p5-white text-p5-black px-2 py-1 font-bebas text-lg focus:outline-none"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item.id, 'amount', item.amount)}
                          className="font-bebas text-3xl cursor-pointer hover:text-p5-purple transition-colors"
                        >
                          ${item.amount.toLocaleString()}
                        </span>
                      )}
                      
                      <button
                        onClick={() => removeCost(item.id)}
                        className="text-p5-white hover:text-p5-purple transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-12">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="p5-card-purple p-8"
            >
              <p className="font-display text-xl uppercase italic text-p5-white p5-text-white-shadow mb-2">{t.totalCost}</p>
              <p className="font-bebas text-7xl tracking-tighter p5-text-white-shadow drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">${totals.totalCost.toLocaleString()}</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="p5-card p-8 bg-p5-black text-p5-white border-p5-purple shadow-[8px_8px_0px_var(--color-p5-purple)]"
            >
              <p className="font-display text-xl uppercase italic text-p5-purple mb-2">{t.costPerPerson}</p>
              <p className="font-bebas text-7xl tracking-tighter p5-text-white-shadow drop-shadow-[4px_4px_0_rgba(177,156,217,0.5)]">${Math.round(totals.costEach).toLocaleString()}</p>
            </motion.div>
          </div>

          {/* Calculation Mode Toggle */}
          <div className="p5-card p-6 flex items-center justify-between rotate-1">
            <div className="flex items-center gap-3">
              <Info size={24} className="text-p5-purple animate-p5-float" />
              <span className="font-display text-xl uppercase italic">{t.settleBasedOn}</span>
            </div>
            <div className="flex items-center gap-2 bg-p5-black p-1 border-2 border-p5-black">
              <button
                onClick={() => setCalculationMode('items')}
                className={`px-6 py-2 font-display uppercase transition-all ${calculationMode === 'items' ? 'bg-p5-purple text-p5-white p5-text-white-shadow' : 'text-p5-white hover:bg-p5-purple/50'}`}
              >
                {t.itemsTotal}
              </button>
              <button
                onClick={() => setCalculationMode('paid')}
                className={`px-6 py-2 font-display uppercase transition-all ${calculationMode === 'paid' ? 'bg-p5-purple text-p5-white p5-text-white-shadow' : 'text-p5-white hover:bg-p5-purple/50'}`}
              >
                {t.actualPaid}
              </button>
            </div>
          </div>

          {/* Discrepancy Alert */}
          {Math.abs(totals.discrepancy) > 0.01 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className={`p-8 border-8 border-p5-black shadow-[12px_12px_0_rgba(0,0,0,1)] flex items-center gap-8 relative overflow-hidden ${
                totals.discrepancy > 0 ? 'bg-p5-yellow text-p5-black' : 'bg-p5-white text-p5-black'
              }`}
              style={{ clipPath: 'polygon(0% 5%, 95% 0%, 100% 95%, 5% 100%)' }}
            >
              <div className="absolute top-0 left-0 w-full h-full p5-halftone opacity-10 pointer-events-none" />
              <div className="relative z-10 w-20 h-20 bg-p5-black text-p5-white flex items-center justify-center rotate-12 border-4 border-p5-white shrink-0">
                <AlertCircle size={48} />
              </div>
              <div className="relative z-10">
                <p className="font-display text-3xl uppercase italic leading-none mb-1 tracking-tighter">
                  {totals.discrepancy > 0 ? t.missingFunds : t.extraFunds}
                </p>
                <p className="font-bebas text-6xl leading-none drop-shadow-[4px_4px_0_rgba(177,156,217,0.8)]">
                  ${Math.abs(totals.discrepancy).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}

          {/* Individual Balances Table */}
          <section className="p5-card rotate-1 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-p5-purple" />
            <div className="p-8 bg-p5-black text-p5-white border-b-8 border-p5-purple">
              <h2 className="font-display text-4xl uppercase italic tracking-tighter p5-text-white-shadow drop-shadow-[4px_4px_0_rgba(177,156,217,0.5)]">
                {t.individualBalances}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-p5-white text-p5-black border-b-4 border-p5-black">
                    <th className="px-8 py-6 font-display uppercase italic text-2xl tracking-tighter">{t.name}</th>
                    <th className="px-8 py-6 font-display uppercase italic text-2xl tracking-tighter">{t.paid}</th>
                    <th className="px-8 py-6 font-display uppercase italic text-2xl tracking-tighter">{t.netBalance}</th>
                  </tr>
                </thead>
                <tbody className="bg-p5-white">
                  {balances.map((b, i) => (
                    <tr key={i} className="hover:bg-p5-purple hover:text-p5-white transition-all group border-b-2 border-p5-black/10">
                      <td className="px-8 py-4 font-bebas text-3xl uppercase tracking-wider group-hover:p5-text-white-shadow">{b.name}</td>
                      <td className="px-8 py-4 font-bebas text-4xl group-hover:p5-text-white-shadow">${b.paid.toLocaleString()}</td>
                      <td className={`px-8 py-4 font-bebas text-5xl transition-colors ${
                         b.net > 0 ? 'text-emerald-600 group-hover:text-p5-white group-hover:p5-text-white-shadow' : b.net < 0 ? 'text-p5-purple-dark group-hover:text-p5-white group-hover:p5-text-white-shadow' : 'text-zinc-400'
                      }`}>
                        <div className="flex items-center gap-2">
                          {b.net > 0 ? '+' : ''}{Math.round(b.net).toLocaleString()}
                          {b.net < 0 && <span className="text-sm font-display uppercase italic ml-2">DEBT</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Transactions Section */}
          <section className="p5-card p-8 -rotate-1 min-h-[400px] flex flex-col relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-p5-purple p5-halftone opacity-10 -mr-16 -mt-16 rotate-45" />
            
            <div className="mb-8 relative z-10">
              <h2 className="font-display text-5xl uppercase italic tracking-tighter text-p5-purple drop-shadow-[4px_4px_0_rgba(61,61,61,0.8)]">
                {t.suggestedTransactions}
              </h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center relative z-10">
              <div className="space-y-6">
                {transactions.map((t_item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 100, skewX: 20 }}
                    animate={{ opacity: 1, x: 0, skewX: 6 }}
                    transition={{ type: "spring", damping: 12, delay: i * 0.1 }}
                    className="flex items-center gap-6 p-6 bg-p5-black text-p5-white relative group border-l-8 border-p5-yellow"
                  >
                    <div className="absolute inset-0 bg-p5-purple opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="flex-1 p5-skew-left">
                      <p className="font-display text-3xl uppercase italic leading-none">
                        <span className="text-p5-purple group-hover:text-p5-white transition-colors">{t_item.from}</span>
                        <span className="mx-4 text-p5-white text-xl opacity-50">{t.pays}</span>
                        <span className="text-p5-yellow group-hover:text-p5-white transition-colors">{t_item.to}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 p5-skew-left">
                      <ArrowRight size={24} className="text-p5-white group-hover:translate-x-2 transition-transform" />
                      <span className="font-bebas text-6xl text-p5-white p5-text-white-shadow drop-shadow-[4px_4px_0_rgba(177,156,217,0.8)]">${t_item.amount.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
                
                {transactions.length === 0 && people.length > 0 && (
                  <div className="text-center py-12">
                    {calculationMode === 'items' && Math.abs(totals.discrepancy) > 0.01 ? (
                      <div className="space-y-6">
                        <motion.div 
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-20 h-20 bg-p5-yellow text-p5-black rounded-full flex items-center justify-center mx-auto border-4 border-p5-black"
                        >
                          <AlertCircle size={40} />
                        </motion.div>
                        <p className="font-marker text-2xl text-p5-purple max-w-xs mx-auto leading-tight">
                          {t.discrepancyWarning}
                        </p>
                        <button 
                          onClick={() => setCalculationMode('paid')}
                          className="p5-button text-xl"
                        >
                          {t.settleBasedOn} {t.actualPaid}
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="space-y-4"
                      >
                        <div className="w-24 h-24 bg-emerald-500 text-p5-white flex items-center justify-center mx-auto border-8 border-p5-black rotate-12 shadow-[8px_8px_0px_#000]">
                          <CheckCircle2 size={48} />
                        </div>
                        <p className="font-display text-3xl uppercase italic tracking-tighter">{t.allSettled}</p>
                      </motion.div>
                    )}
                  </div>
                )}
                
                {people.length === 0 && (
                  <p className="text-center font-marker text-2xl text-zinc-400">{t.addPeopleToSee}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 max-w-5xl mx-auto px-4 py-16 border-t-4 border-p5-purple mt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="p5-card px-8 py-2 bg-p5-black text-p5-white -rotate-2">
            <p className="font-display text-xl uppercase italic tracking-widest">
              {t.title} &bull; {t.builtWith}
            </p>
          </div>
          <p className="font-marker text-p5-purple-dark">TAKE YOUR TIME</p>
        </div>
      </footer>

      {/* Hidden Share Card for Image Generation */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={shareRef}
          className="w-[600px] p-10 bg-p5-white text-p5-black font-sans relative overflow-hidden"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-4 bg-p5-purple" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-p5-purple rotate-12 p5-halftone opacity-20" />
          <div className="absolute bottom-0 right-0 w-full h-4 bg-p5-black" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-p5-black text-p5-white flex items-center justify-center border-2 border-p5-white shadow-[2px_2px_0_rgba(0,0,0,0.5)] rotate-6">
                <Calculator size={24} />
              </div>
              <h1 className="font-display text-4xl uppercase italic tracking-tighter text-p5-black">
                {t.title}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-p5-purple text-p5-white border-4 border-p5-black shadow-[4px_4px_0_#000]">
                <p className="font-display text-xs uppercase italic mb-1">{t.totalCost}</p>
                <p className="font-bebas text-4xl">${totals.totalCost.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-p5-black text-p5-white border-4 border-p5-purple shadow-[4px_4px_0_var(--color-p5-purple)]">
                <p className="font-display text-xs uppercase italic text-p5-purple mb-1">{t.costPerPerson}</p>
                <p className="font-bebas text-4xl">${Math.round(totals.costEach).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 bg-p5-white border-4 border-p5-black relative">
              <div className="absolute -top-4 -left-2 bg-p5-black text-p5-white px-4 py-1 text-xs font-display uppercase italic">
                {t.suggestedTransactions}
              </div>
              <div className="space-y-4 pt-2">
                {transactions.map((t_item, i) => (
                  <div key={i} className="flex items-center justify-between border-b-2 border-p5-black/10 pb-2">
                    <p className="font-display text-lg uppercase italic">
                      <span className="text-p5-purple-dark">{t_item.from}</span>
                      <span className="mx-2 text-xs opacity-50">{t.pays}</span>
                      <span className="text-p5-black">{t_item.to}</span>
                    </p>
                    <span className="font-bebas text-2xl">${t_item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-center font-marker text-p5-purple py-4">{t.allSettled}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <p className="font-marker text-p5-purple-dark text-sm">Spending Splitter &bull; {new Date().toLocaleDateString()}</p>
              <div className="w-16 h-16 p5-halftone opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
