/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, User, DollarSign, ArrowRight, Calculator, AlertCircle, CheckCircle2, Languages, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    title: "Splitwise Lite",
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
    syncContributions: "Sincronizar aportes con artículos"
  },
  en: {
    title: "Splitwise Lite",
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
    syncContributions: "Sync contributions with items"
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
    
    if (selectedPayerId) {
      setPeople(people.map(p => p.id === selectedPayerId ? { ...p, paid: p.paid + amount } : p));
    }
    
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
    const item = costItems.find(i => i.id === id);
    if (item?.paidById) {
      setPeople(people.map(p => p.id === item.paidById ? { ...p, paid: Math.max(0, p.paid - item.amount) } : p));
    }
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
      const oldItem = costItems.find(i => i.id === editingId);
      if (oldItem?.paidById) {
        setPeople(people.map(p => p.id === oldItem.paidById ? { ...p, paid: p.paid - oldItem.amount + newAmount } : p));
      }
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
    // Attempt to match item names to people names to sync contributions
    const newPeople = [...people];
    costItems.forEach(item => {
      const person = newPeople.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (person) {
        person.paid = item.amount;
      }
    });
    setPeople(newPeople);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Calculator size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${lang === 'es' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${lang === 'en' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                EN
              </button>
            </div>
            <div className="hidden sm:block text-sm font-medium text-zinc-500">
              {new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          {/* Cost Items Section */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-600" />
                {t.costItems}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={addCost} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t.itemName}
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                  <input
                    type="number"
                    placeholder={t.amount}
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedPayerId}
                    onChange={(e) => setSelectedPayerId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm bg-white"
                  >
                    <option value="">{t.whoPaid} ({t.external})</option>
                    {people.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {costItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl group relative"
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
                            className="w-full bg-white px-2 py-1 rounded border border-emerald-500 text-sm focus:outline-none"
                          />
                        ) : (
                          <span 
                            onClick={() => startEditing(item.id, 'name', item.name)}
                            className="text-sm font-medium cursor-pointer hover:text-emerald-600 transition-colors"
                          >
                            {item.name}
                          </span>
                        )}
                        {item.paidById && (
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                            {t.paid} por {people.find(p => p.id === item.paidById)?.name}
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
                            className="w-20 bg-white px-2 py-1 rounded border border-emerald-500 text-sm font-mono focus:outline-none"
                          />
                        ) : (
                          <span 
                            onClick={() => startEditing(item.id, 'amount', item.amount)}
                            className="text-sm font-mono cursor-pointer hover:text-emerald-600 transition-colors"
                          >
                            ${item.amount.toLocaleString()}
                          </span>
                        )}
                        
                        <button
                          onClick={() => removeCost(item.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {costItems.length === 0 && (
                  <p className="text-center py-4 text-sm text-zinc-400 italic">{t.noItems}</p>
                )}
              </div>
            </div>
          </section>

          {/* People Section */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User size={20} className="text-emerald-600" />
                {t.people}
              </h2>
              {Math.abs(totals.discrepancy) > 0.01 && (
                <button 
                  onClick={syncContributions}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-tight"
                >
                  {t.syncContributions}
                </button>
              )}
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={addPerson} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.name}
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                />
                <input
                  type="number"
                  placeholder={t.paid}
                  value={newPersonPaid}
                  onChange={(e) => setNewPersonPaid(e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </form>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {people.map((person) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl group"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        {editingId === person.id && editingField === 'name' ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-white px-2 py-1 rounded border border-emerald-500 text-sm focus:outline-none"
                          />
                        ) : (
                          <span 
                            onClick={() => startEditing(person.id, 'name', person.name)}
                            className="text-sm font-medium cursor-pointer hover:text-emerald-600 transition-colors"
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
                            className="w-20 bg-white px-2 py-1 rounded border border-emerald-500 text-sm font-mono focus:outline-none"
                          />
                        ) : (
                          <span 
                            onClick={() => startEditing(person.id, 'paid', person.paid)}
                            className="text-sm font-mono cursor-pointer hover:text-emerald-600 transition-colors"
                          >
                            ${person.paid.toLocaleString()}
                          </span>
                        )}

                        <button
                          onClick={() => removePerson(person.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {people.length === 0 && (
                  <p className="text-center py-4 text-sm text-zinc-400 italic">{t.noPeople}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t.totalCost}</p>
              <p className="text-3xl font-bold text-zinc-900">${totals.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{t.costPerPerson}</p>
              <p className="text-3xl font-bold text-emerald-600">${Math.round(totals.costEach).toLocaleString()}</p>
            </div>
          </div>

          {/* Calculation Mode Toggle */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-zinc-400" />
              <span className="text-sm font-medium text-zinc-600">{t.settleBasedOn}</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setCalculationMode('items')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${calculationMode === 'items' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                {t.itemsTotal}
              </button>
              <button
                onClick={() => setCalculationMode('paid')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${calculationMode === 'paid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
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
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                totals.discrepancy > 0 
                  ? 'bg-amber-50 border-amber-200 text-amber-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <AlertCircle size={20} />
              <div className="text-sm">
                <span className="font-semibold">
                  {totals.discrepancy > 0 ? t.missingFunds : t.extraFunds}
                </span>
                {' '}${Math.abs(totals.discrepancy).toLocaleString()}
              </div>
            </motion.div>
          )}

          {/* Individual Balances Table */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-lg font-semibold">{t.individualBalances}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.name}</th>
                    <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.paid}</th>
                    <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.netBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {balances.map((b, i) => (
                    <tr key={i} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{b.name}</td>
                      <td className="px-6 py-4 text-sm font-mono">${b.paid.toLocaleString()}</td>
                      <td className={`px-6 py-4 text-sm font-mono font-semibold ${
                        b.net > 0 ? 'text-emerald-600' : b.net < 0 ? 'text-red-600' : 'text-zinc-400'
                      }`}>
                        {b.net > 0 ? '+' : ''}{Math.round(b.net).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {balances.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-zinc-400 italic">{t.noPeople}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Transactions Section */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-lg font-semibold">{t.suggestedTransactions}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {transactions.map((t_item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl"
                  >
                    <div className="flex-1 text-sm">
                      <span className="font-semibold text-red-600">{t_item.from}</span>
                      <span className="mx-2 text-zinc-400">{t.pays}</span>
                      <span className="font-semibold text-emerald-600">{t_item.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={16} className="text-zinc-300" />
                      <span className="text-lg font-bold font-mono text-zinc-900">${t_item.amount.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
                
                {transactions.length === 0 && people.length > 0 && (
                  <div className="text-center py-8">
                    {calculationMode === 'items' && Math.abs(totals.discrepancy) > 0.01 ? (
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle size={24} />
                        </div>
                        <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
                          {t.discrepancyWarning}
                        </p>
                        <button 
                          onClick={() => setCalculationMode('paid')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase underline underline-offset-4"
                        >
                          {t.settleBasedOn} {t.actualPaid}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 size={24} />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">{t.allSettled}</p>
                      </>
                    )}
                  </div>
                )}
                
                {people.length === 0 && (
                  <p className="text-center py-4 text-sm text-zinc-400 italic">{t.addPeopleToSee}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-zinc-200 mt-12">
        <p className="text-center text-sm text-zinc-400">
          {t.title} &bull; {t.builtWith}
        </p>
      </footer>
    </div>
  );
}
