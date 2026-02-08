
import React, { useState, useEffect, useMemo } from 'react';
import { X, Info, Package, Trash2, ChevronDown } from 'lucide-react';
import { Sale, SaleType, InventoryItem, SaleItem } from '../types';

interface SalesFormProps {
  onAddSale: (sale: Sale) => void;
  onClose: () => void;
  inventory: InventoryItem[];
  initialData?: {
    clientName: string;
    productName: string;
  } | null;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onAddSale, onClose, inventory, initialData }) => {
  const [isKit, setIsKit] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  
  const [formData, setFormData] = useState({
    clientName: '',
    productName: '',
    amount: '',
    freight: '',
    commissionRate: '10',
    fixedCommission: '', // Valor em reais para indicação
    date: new Date().toISOString().split('T')[0],
    saleType: 'Instagram' as SaleType,
    adCost: '', // Valor investido para Tráfego Pago
    discount: '',
  });

  useEffect(() => {
    if (initialData) {
      const product = inventory.find(p => p.productName === initialData.productName);
      setFormData(prev => ({
        ...prev,
        clientName: initialData.clientName,
        productName: initialData.productName,
        amount: product?.defaultSellPrice?.toString() || prev.amount
      }));
    }
  }, [initialData, inventory]);

  const autoCost = useMemo(() => {
    if (isKit) {
      return selectedItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    }
    const item = inventory.find(i => i.productName === formData.productName);
    return item ? item.costPrice : 0;
  }, [formData.productName, inventory, isKit, selectedItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'productName' && !isKit) {
      const selectedProduct = inventory.find(p => p.productName === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productName: value,
          amount: selectedProduct.defaultSellPrice?.toString() || ''
        }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItemToKit = (productName: string) => {
    const product = inventory.find(p => p.productName === productName);
    if (!product) return;

    const newItem: SaleItem = {
      productName: product.productName,
      quantity: 1,
      cost: product.costPrice
    };

    // Liberado: permite adicionar o mesmo produto várias vezes
    setSelectedItems(prev => [...prev, newItem]);
  };

  const handleRemoveItemFromKit = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const isReferral = formData.saleType === 'Indicacao';
  const isPaidTraffic = formData.saleType === 'Trafego Pago';
  
  const amountVal = parseFloat(formData.amount || '0');
  const discountVal = parseFloat(formData.discount || '0');
  const freightVal = parseFloat(formData.freight || '0');
  
  const commissionVal = isReferral 
    ? (parseFloat(formData.fixedCommission) || 0)
    : (formData.saleType === 'Instagram' || formData.saleType === 'Trafego Pago' || formData.saleType === 'Pessoal' 
        ? 0 
        : amountVal * (parseFloat(formData.commissionRate || '0') / 100));

  const adCostVal = isPaidTraffic ? (parseFloat(formData.adCost) || 0) : 0;
  
  const netProfit = amountVal - discountVal - commissionVal - autoCost - freightVal - adCostVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalProductName = isKit 
      ? `Combo: ${selectedItems.map(i => i.productName).join(' + ')}`
      : formData.productName;

    const newSale: Sale = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      productName: finalProductName,
      items: isKit ? selectedItems : undefined,
      amount: amountVal,
      cost: autoCost,
      freight: freightVal,
      commissionRate: isReferral ? 0 : (isPaidTraffic || formData.saleType === 'Instagram' || formData.saleType === 'Pessoal' ? 0 : parseFloat(formData.commissionRate)),
      commissionValue: commissionVal,
      date: formData.date,
      status: 'Pending',
      saleType: formData.saleType,
      adCost: adCostVal,
      discount: discountVal,
    };

    if (isKit && selectedItems.length === 0) {
      alert("Por favor, adicione pelo menos um item ao combo.");
      return;
    }

    onAddSale(newSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-50">
          <h2 className="text-2xl font-black text-slate-800">Registrar Venda</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
          
          {/* Combo Toggle */}
          <div className="bg-slate-50/80 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
             <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2.5 rounded-xl text-[#920074]">
                  <Package size={20} />
                </div>
                <div>
                   <p className="text-[13px] font-black text-slate-700">Venda Casada (Combo)?</p>
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Selecione múltiplos produtos</p>
                </div>
             </div>
             <button 
               type="button"
               onClick={() => setIsKit(!isKit)}
               className={`w-12 h-6 rounded-full transition-all duration-300 relative ${isKit ? 'bg-[#920074]' : 'bg-slate-300'}`}
             >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isKit ? 'left-7' : 'left-1'}`}></div>
             </button>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
            <input
              required
              name="clientName"
              className="w-full px-5 py-3.5 bg-slate-50/50 text-slate-900 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none font-bold"
              value={formData.clientName}
              onChange={handleChange}
            />
          </div>

          {/* Itens / Produto */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {isKit ? 'Itens do Combo' : 'Produto em Estoque'}
            </label>
            
            {isKit ? (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    className="w-full px-5 py-3.5 bg-white border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl focus:border-[#920074] outline-none appearance-none font-black text-sm"
                    value=""
                    onChange={(e) => {
                        if(e.target.value) handleAddItemToKit(e.target.value);
                    }}
                  >
                    <option value="">+ Adicionar ao combo</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.productName}>
                          {item.productName} ({item.quantity} un.)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="space-y-2 animate-fade-in">
                    {selectedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                        <span className="text-xs font-black text-slate-700">{item.productName}</span>
                        <button type="button" onClick={() => handleRemoveItemFromKit(index)} className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <select
                  required
                  name="productName"
                  className="w-full px-5 py-3.5 bg-slate-50/50 text-slate-900 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#920074] outline-none appearance-none font-bold"
                  value={formData.productName}
                  onChange={handleChange}
                >
                  <option value="" disabled></option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.productName}>
                        {item.productName} ({item.quantity} un.)
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>
          
          {/* Data e Origem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                <input required name="date" type="date" className="w-full px-5 py-3.5 bg-slate-50/50 text-slate-900 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.date} onChange={handleChange} />
            </div>
             <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origem</label>
                <div className="relative">
                  <select name="saleType" className="w-full px-5 py-3.5 bg-slate-50/50 text-slate-900 border border-slate-100 rounded-2xl outline-none font-bold appearance-none" value={formData.saleType} onChange={handleChange}>
                      <option value="Instagram">Instagram</option>
                      <option value="Indicacao">Indicação</option>
                      <option value="Trafego Pago">Tráfego Pago</option>
                      <option value="Pessoal">Venda Pessoal</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>
          </div>

          {/* Valor Venda */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Venda (R$)</label>
            <input required name="amount" type="number" step="0.01" className="w-full px-5 py-3.5 bg-slate-50/50 text-slate-900 border border-slate-100 rounded-2xl outline-none font-black text-lg" value={formData.amount} onChange={handleChange} />
          </div>

          {/* Seção Dinâmica de Custos Adicionais */}
          <div className="space-y-4">
             {(isReferral || isPaidTraffic) && (
               <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1.5">
                    {isReferral ? (
                      <>
                        <label className="block text-[10px] font-black text-[#920074] uppercase tracking-widest ml-1">Comissão (R$)</label>
                        <input name="fixedCommission" type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-3.5 bg-purple-50/30 text-slate-900 border border-purple-100 rounded-2xl outline-none font-bold" value={formData.fixedCommission} onChange={handleChange} />
                      </>
                    ) : (
                      <>
                        <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Investimento (R$)</label>
                        <input name="adCost" type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-3.5 bg-amber-50/30 text-slate-900 border border-amber-100 rounded-2xl outline-none font-bold" value={formData.adCost} onChange={handleChange} />
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Frete (R$)</label>
                    <input name="freight" type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-3.5 bg-blue-50/30 text-slate-900 border border-blue-100 rounded-2xl outline-none font-bold" value={formData.freight} onChange={handleChange} />
                  </div>
               </div>
             )}

             {(!isReferral && !isPaidTraffic) ? (
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Desconto (R$)</label>
                    <input name="discount" type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-3.5 bg-red-50/30 text-slate-900 border border-red-100 rounded-2xl outline-none font-bold" value={formData.discount} onChange={handleChange} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Frete (R$)</label>
                    <input name="freight" type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-3.5 bg-blue-50/30 text-slate-900 border border-blue-100 rounded-2xl outline-none font-bold" value={formData.freight} onChange={handleChange} />
                  </div>
               </div>
             ) : (
               <div className="animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">Desconto (R$)</label>
                    <input name="discount" type="number" step="0.01" placeholder="0.00" className="w-full px-5 py-3.5 bg-red-50/30 text-slate-900 border border-red-100 rounded-2xl outline-none font-bold" value={formData.discount} onChange={handleChange} />
                  </div>
               </div>
             )}
          </div>

          {/* Detalhamento de Lucro */}
          <div className="bg-[#fdf4fa] p-5 rounded-[28px] space-y-3.5 border border-[#f5d0ed]">
             <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">DETALHAMENTO DE LUCRO</div>
                <Info size={16} />
             </div>
             <div className="flex justify-between text-sm font-black text-slate-600">
                <span>Custo Unitário do Produto:</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(autoCost)}</span>
             </div>
             <div className="flex justify-between border-t border-purple-100 pt-3.5 items-center">
                <span className="text-base font-black text-slate-800">Lucro Líquido:</span>
                <span className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfit)}
                </span>
             </div>
          </div>

          <button type="submit" className="w-full bg-[#920074] hover:bg-[#74005c] text-white font-black py-4.5 rounded-[22px] shadow-xl shadow-purple-200 transition transform active:scale-[0.98] text-lg mt-1">
            Finalizar Venda
          </button>
        </form>
      </div>
    </div>
  );
};
