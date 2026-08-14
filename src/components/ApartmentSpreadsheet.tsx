import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Save,
  MessageSquare,
  AlertCircle,
  User,
  Calendar,
  Check,
  FileCheck,
  PlusCircle,
  History,
  FolderCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { ApartmentInspection, MaintenanceChoice, InspectionItemState, FinalizedInspection } from '../types';
import { MAINTENANCE_CATEGORIES, COMMON_OBSERVATION_SUGGESTIONS } from '../data/categories';
import { exportSingleApartmentToCSV } from '../utils/excel';
import { saveFinalizedInspection, deleteFinalizedInspection, loadFinalizedInspections } from '../utils/historyStorage';

interface ApartmentSpreadsheetProps {
  apartment: ApartmentInspection;
  onUpdateApartment: (updated: ApartmentInspection) => void;
  onBack: () => void;
  onGoToHistory?: () => void;
  onStartNewInspectionForApartment?: (apartmentId: string) => void;
  onDeleteApartmentSheet?: (apartmentId: string) => void;
}

export const ApartmentSpreadsheet: React.FC<ApartmentSpreadsheetProps> = ({
  apartment,
  onUpdateApartment,
  onBack,
  onGoToHistory,
  onStartNewInspectionForApartment,
  onDeleteApartmentSheet
}) => {
  const [activeObservationField, setActiveObservationField] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showFinalizedModal, setShowFinalizedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper to update a specific item status or observation
  const handleItemChange = (itemKey: string, field: 'status' | 'observation', value: any) => {
    if (isLocked) return;
    const nowStr = new Date().toISOString();
    const updatedItems = {
      ...apartment.items,
      [itemKey]: {
        ...apartment.items[itemKey],
        [field]: value
      }
    };

    const updatedApt: ApartmentInspection = {
      ...apartment,
      isGenerated: true,
      updatedAt: nowStr,
      items: updatedItems
    };

    onUpdateApartment(updatedApt);
    triggerSavedToast();
  };

  const triggerSavedToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  // Bulk actions
  const handleSetAll = (choice: MaintenanceChoice) => {
    if (isLocked) return;
    const updatedItems = { ...apartment.items };
    Object.keys(updatedItems).forEach(key => {
      updatedItems[key] = {
        ...updatedItems[key],
        status: choice
      };
    });

    onUpdateApartment({
      ...apartment,
      isGenerated: true,
      updatedAt: new Date().toISOString(),
      items: updatedItems
    });
    triggerSavedToast();
  };

  const handleInspectorChange = (name: string) => {
    if (isLocked) return;
    onUpdateApartment({
      ...apartment,
      inspectorName: name,
      updatedAt: new Date().toISOString()
    });
    triggerSavedToast();
  };

  const handleGeneralNotesChange = (notes: string) => {
    if (isLocked) return;
    onUpdateApartment({
      ...apartment,
      generalNotes: notes,
      updatedAt: new Date().toISOString()
    });
    triggerSavedToast();
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  let totalCount = 0;
  let simCount = 0;
  let naoCount = 0;
  let pendingCount = 0;

  (Object.values(apartment.items || {}) as InspectionItemState[]).forEach(item => {
    totalCount++;
    if (item.status === 'sim') simCount++;
    else if (item.status === 'nao') naoCount++;
    else pendingCount++;
  });

  const progressPercent = totalCount > 0 ? Math.round(((simCount + naoCount) / totalCount) * 100) : 0;

  // Finalize inspection and store in history database with strict validations
  const handleFinalize = () => {
    // Validation: ALL items MUST be marked with 'NÃO' (zero SIM and zero pending)
    if (naoCount < totalCount) {
      if (simCount > 0 && pendingCount > 0) {
        setValidationError(`A planilha só pode ser finalizada quando TODOS os itens estiverem marcados com "NÃO". Atualmente existem ${simCount} item(ns) com "SIM" (necessita reparo) e ${pendingCount} item(ns) pendente(s).`);
      } else if (simCount > 0) {
        setValidationError(`A planilha só pode ser finalizada quando TODOS os itens estiverem marcados com "NÃO". Atualmente existem ${simCount} item(ns) marcado(s) com "SIM" (reparos pendentes).`);
      } else {
        setValidationError(`A planilha só pode ser finalizada quando TODOS os itens estiverem marcados com "NÃO". Ainda restam ${pendingCount} item(ns) pendente(s) sem marcação.`);
      }
      return;
    }

    setValidationError(null);

    const now = new Date();
    const isoString = now.toISOString();
    const dateStr = isoString.split('T')[0];
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const finalizedRecord: FinalizedInspection = {
      id: `${apartment.apartmentId}_${Date.now()}`,
      apartmentId: apartment.apartmentId,
      block: apartment.block,
      number: apartment.number,
      floor: apartment.floor,
      inspectorName: apartment.inspectorName || 'Técnico Unila',
      generalNotes: apartment.generalNotes || '',
      finalizedAt: isoString,
      inspectionDate: dateStr,
      inspectionTime: timeStr,
      items: apartment.items,
      simCount,
      naoCount,
      pendingCount
    };

    saveFinalizedInspection(finalizedRecord);

    onUpdateApartment({
      ...apartment,
      status: 'finalizada',
      finalizedAt: isoString,
      updatedAt: isoString
    });

    setIsLocked(true); // Automatically lock upon finalization
    setShowFinalizedModal(true);
  };

  // Create new inspection for same apartment
  const handleCreateNewInspection = () => {
    if (onStartNewInspectionForApartment) {
      onStartNewInspectionForApartment(apartment.apartmentId);
    }
    setIsLocked(false);
    setShowFinalizedModal(false);
  };

  // Delete current spreadsheet (both active and historical)
  const handleDeleteSpreadsheet = () => {
    if (apartment.status === 'finalizada' || apartment.finalizedAt) {
      const historyList = loadFinalizedInspections();
      const match = historyList.find(h => h.apartmentId === apartment.apartmentId);
      if (match) {
        deleteFinalizedInspection(match.id);
      }
    }
    if (onDeleteApartmentSheet) {
      onDeleteApartmentSheet(apartment.apartmentId);
    }
    setShowDeleteModal(false);
    onBack();
  };

  let rowCounter = 0;

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar (Screen view, hidden during print) */}
      <div className="print:hidden bg-white border border-purple-200 rounded-2xl p-4 shadow-xs flex items-center justify-end gap-4">
        <button
          onClick={handleCreateNewInspection}
          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-lg text-xs border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
          title="Criar nova planilha de vistoria para este mesmo apartamento com outra data"
        >
          <PlusCircle className="w-3.5 h-3.5 text-purple-700" />
          <span>Nova Vistoria (Outra Data)</span>
        </button>
      </div>

      {/* Main Spreadsheet Card */}
      <div className="bg-white border-2 border-purple-800 rounded-2xl shadow-lg overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
        {/* Minimal Print Header (Appears ONLY during print) */}
        <div className="hidden print:block text-center py-3 border-b-2 border-black mb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-widest">
            APARTAMENTO {apartment.apartmentId}
          </h1>
        </div>

        {/* Lock Banner Warning */}
        {isLocked && (
          <div className="bg-amber-100 border-b-2 border-amber-300 px-4 py-2.5 text-amber-950 text-xs font-bold flex items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Planilha salva e protegida contra edições. Para realizar alterações, clique no botão <strong>"Editar"</strong>.</span>
            </div>
            <button
              onClick={() => setIsLocked(false)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-[11px] transition-colors shrink-0"
            >
              Habilitar Edição
            </button>
          </div>
        )}

        {/* Spreadsheet Purple Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-white p-5 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-widest text-white border-b-2 border-purple-400 pb-0.5">
                  UNILA
                </span>
                <span className="text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded-md font-semibold">
                  PLANILHA DE MANUTENÇÃO
                </span>
                {isLocked && (
                  <span className="text-xs bg-amber-500 text-amber-950 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bloqueada
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-1 text-purple-50">
                Vistoria do Apartamento {apartment.apartmentId}
              </h2>
            </div>

            {/* Progress Badge and Actions */}
            <div className="bg-purple-950/70 border border-purple-600/60 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-purple-200 font-medium">Progresso da Vistoria</div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-32 bg-purple-900 rounded-full h-2.5 overflow-hidden border border-purple-600/40">
                    <div
                      className="bg-emerald-400 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white font-mono">{progressPercent}%</span>
                </div>
                <div className="text-[11px] text-purple-300 mt-1">
                  {simCount + naoCount} de {totalCount} itens verificados {pendingCount > 0 ? `(${pendingCount} pendentes)` : '(Completo)'}
                </div>
              </div>

              {/* Botões Exportar Excel e Imprimir dentro do processo de vistoria */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-purple-700/60 sm:pl-4 w-full sm:w-auto justify-end">
                <button
                  onClick={() => exportSingleApartmentToCSV(apartment)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Exportar planilha para Excel (.csv)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Imprimir planilha de vistoria"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Excel Header Metadata Table */}
        <div className="bg-purple-50/70 border-b-2 border-purple-200 p-4 sm:p-5 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Apt & Block Info */}
            <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-900 text-white font-black text-xl flex items-center justify-center shrink-0">
                {apartment.apartmentId}
              </div>
              <div>
                <span className="text-xs text-purple-700 font-bold uppercase tracking-wider block">Localização</span>
                <span className="text-sm font-bold text-gray-900">
                  Bloco {apartment.block} • {apartment.floor}
                </span>
              </div>
            </div>

            {/* Inspector Name Input */}
            <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
              <User className="w-5 h-5 text-purple-700 shrink-0" />
              <div className="w-full">
                <label className="text-[11px] text-purple-700 font-bold uppercase tracking-wider block">
                  Vistoriador / Responsável
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  readOnly={isLocked}
                  value={apartment.inspectorName || ''}
                  onChange={(e) => handleInspectorChange(e.target.value)}
                  placeholder={isLocked ? 'Vistoriador não informado' : 'Nome do técnico / vistoriador'}
                  className={`w-full text-xs font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-600 rounded px-1 py-0.5 ${
                    isLocked ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'bg-purple-50/30'
                  }`}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <span className="text-[11px] text-purple-700 font-bold uppercase tracking-wider block">
                  Data da Vistoria
                </span>
                <span className="text-xs font-semibold text-gray-900">
                  {apartment.updatedAt ? new Date(apartment.updatedAt).toLocaleString('pt-BR') : 'Hoje / Não iniciada'}
                </span>
              </div>
            </div>

          </div>

          {/* General Notes */}
          <div className="mt-3 bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
            <label className="text-[11px] text-purple-700 font-bold uppercase tracking-wider block mb-1">
              Observações Gerais do Apartamento {apartment.apartmentId}
            </label>
            <input
              type="text"
              disabled={isLocked}
              readOnly={isLocked}
              value={apartment.generalNotes || ''}
              onChange={(e) => handleGeneralNotesChange(e.target.value)}
              placeholder={isLocked ? 'Nenhuma observação geral' : 'Ex: Apartamento desocupado, chaves na recepção, precisa pintura urgente...'}
              className={`w-full text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-600 rounded p-1.5 border border-gray-200 ${
                isLocked ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-gray-50'
              }`}
            />
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm print:text-xs">
            
            {/* Table Column Headers */}
            <thead>
              <tr className="bg-purple-900 text-white font-bold text-xs uppercase tracking-wider border-b-2 border-purple-950 print:bg-gray-200 print:text-black print:border-black">
                <th className="py-3 px-3 w-12 text-center border-r border-purple-800 print:border-gray-400">#</th>
                <th className="py-3 px-4 w-32 border-r border-purple-800 print:border-gray-400">Categoria</th>
                <th className="py-3 px-4 sm:w-64 border-r border-purple-800 print:border-gray-400">Item de Manutenção</th>
                <th className="py-3 px-4 text-center w-56 sm:w-64 border-r border-purple-800 print:border-gray-400">
                  Serviço de Manutenção?
                </th>
                <th className="py-3 px-4">Observação / Detalhes</th>
              </tr>
            </thead>

            {/* Table Content by Category */}
            <tbody className="divide-y divide-purple-100 bg-white print:divide-gray-300">
              {MAINTENANCE_CATEGORIES.map((catCategory) => {
                
                // Count items in this category
                let catSim = 0;
                let catNao = 0;
                catCategory.items.forEach(item => {
                  const k = `${catCategory.id}-${item.toLowerCase().replace(/\s+/g, '_')}`;
                  if (apartment.items[k]?.status === 'sim') catSim++;
                  if (apartment.items[k]?.status === 'nao') catNao++;
                });

                return (
                  <React.Fragment key={catCategory.id}>
                    
                    {/* Category Divider Header Row (Excel Style) */}
                    <tr className="bg-purple-100/90 border-y-2 border-purple-300 font-bold text-purple-950 text-xs sm:text-sm print:bg-gray-100 print:text-black print:border-gray-400">
                      <td colSpan={5} className="py-2.5 px-4 bg-purple-100 print:bg-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-purple-950 font-extrabold uppercase tracking-wide print:text-black">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-700 print:bg-black inline-block" />
                            Categoria: {catCategory.name}
                          </span>
                          <span className="text-xs font-semibold text-purple-800 bg-white px-2.5 py-0.5 rounded-full border border-purple-300 print:hidden">
                            {catSim > 0 ? `${catSim} SIM (Reparo)` : ''} {catSim > 0 && catNao > 0 ? ' • ' : ''} {catNao > 0 ? `${catNao} OK` : ''} {catSim === 0 && catNao === 0 ? 'Aguardando marcação' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Category Items */}
                    {catCategory.items.map((itemName) => {
                      rowCounter++;
                      const currentCounter = rowCounter;
                      const itemKey = `${catCategory.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
                      const itemState = apartment.items[itemKey] || {
                        id: itemKey,
                        category: catCategory.name,
                        name: itemName,
                        status: null,
                        observation: ''
                      };

                      const isSim = itemState.status === 'sim';
                      const isNao = itemState.status === 'nao';

                      return (
                        <tr
                          key={itemKey}
                          className={`hover:bg-purple-50/50 transition-colors border-b border-gray-200 ${
                            isSim ? 'bg-amber-50/40 print:bg-transparent' : isNao ? 'bg-emerald-50/20 print:bg-transparent' : ''
                          }`}
                        >
                          {/* Row Index */}
                          <td className="py-2.5 px-3 text-center text-xs font-mono text-purple-800 bg-purple-50/30 border-r border-gray-200 font-semibold print:text-black print:bg-transparent">
                            {currentCounter}
                          </td>

                          {/* Category Name */}
                          <td className="py-2.5 px-4 font-semibold text-xs text-purple-900 border-r border-gray-200 print:text-black">
                            {catCategory.name}
                          </td>

                          {/* Item Name */}
                          <td className="py-2.5 px-4 font-bold text-gray-900 border-r border-gray-200 print:text-black">
                            <div className="flex items-center justify-between gap-2">
                              <span>{itemName}</span>
                              {isSim && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300 font-bold print:hidden">
                                  Atenção
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Choice Cell: SIM or NÃO */}
                          <td className="py-2 px-3 text-center border-r border-gray-200 print:border-gray-300">
                            {/* Screen Buttons */}
                            <div className="flex items-center justify-center gap-2 print:hidden">
                              
                              {/* Option SIM */}
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleItemChange(itemKey, 'status', isSim ? null : 'sim')}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                                  isSim
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                                } ${isLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                              >
                                {isSim && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                <span>SIM</span>
                              </button>

                              {/* Option NÃO */}
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleItemChange(itemKey, 'status', isNao ? null : 'nao')}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs border transition-all flex items-center justify-center gap-1.5 ${
                                  isNao
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                                } ${isLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                              >
                                {isNao && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                <span>NÃO</span>
                              </button>

                            </div>

                            {/* Print Text Display */}
                            <div className="hidden print:block font-extrabold text-xs text-black uppercase">
                              {isSim ? 'SIM' : isNao ? 'NÃO' : ''}
                            </div>
                          </td>

                          {/* Observation Cell */}
                          <td className="py-2 px-3 relative">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                disabled={isLocked}
                                readOnly={isLocked}
                                value={itemState.observation || ''}
                                onChange={(e) => handleItemChange(itemKey, 'observation', e.target.value)}
                                onFocus={() => !isLocked && setActiveObservationField(itemKey)}
                                placeholder={isLocked ? '' : (isSim ? 'Descreva o problema / observação...' : 'Observações (opcional)...')}
                                className={`w-full py-1.5 px-2.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-600 print:hidden ${
                                  isSim && !itemState.observation
                                    ? 'border-amber-400 bg-amber-50/50 text-gray-900 placeholder-amber-600/70 font-medium'
                                    : 'border-gray-200 bg-white text-gray-800'
                                } ${isLocked ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}
                              />

                              {/* Print Observation Text */}
                              <div className="hidden print:block text-xs text-black font-normal">
                                {itemState.observation || ''}
                              </div>

                              {/* Quick Note Dropdown Suggestion Trigger */}
                              {!isLocked && (
                                <div className="relative print:hidden">
                                  <button
                                    type="button"
                                    onClick={() => setActiveObservationField(activeObservationField === itemKey ? null : itemKey)}
                                    className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                                    title="Inserir observação rápida"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>

                                  {activeObservationField === itemKey && (
                                    <div className="absolute right-0 bottom-full mb-1 w-64 bg-white rounded-xl shadow-xl border border-purple-200 p-2 z-50 text-xs space-y-1">
                                      <div className="font-bold text-purple-900 border-b border-purple-100 pb-1 mb-1 px-1 flex items-center justify-between">
                                        <span>Sugestões Rápidas</span>
                                        <button
                                          onClick={() => setActiveObservationField(null)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                      <div className="max-h-40 overflow-y-auto space-y-1">
                                        {COMMON_OBSERVATION_SUGGESTIONS.map((sug) => (
                                          <button
                                            key={sug}
                                            type="button"
                                            onClick={() => {
                                              handleItemChange(itemKey, 'observation', sug);
                                              setActiveObservationField(null);
                                            }}
                                            className="w-full text-left p-1.5 hover:bg-purple-50 text-gray-800 rounded font-medium text-[11px] transition-colors border border-transparent hover:border-purple-200"
                                          >
                                            {sug}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}

                  </React.Fragment>
                );
              })}
            </tbody>

          </table>
        </div>

        {/* Bottom Action Bar (At the end of the spreadsheet) */}
        <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-purple-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Lista</span>
          </button>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            {/* Botão Salvar (Bloquear Edição) */}
            <button
              onClick={() => {
                setIsLocked(true);
                triggerSavedToast();
              }}
              className={`px-5 py-2.5 font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                isLocked
                  ? 'bg-indigo-900 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title="Salvar planilha e bloquear para edições"
            >
              <Lock className="w-4 h-4" />
              <span>Salvar</span>
            </button>

            {/* Botão Editar (Habilitar Edição) */}
            <button
              onClick={() => {
                setIsLocked(false);
              }}
              className={`px-5 py-2.5 font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                !isLocked
                  ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300'
              }`}
              title="Liberar planilha para edições"
            >
              <Unlock className="w-4 h-4" />
              <span>Editar</span>
            </button>

            {/* Botão Finalizar Vistoria */}
            <button
              onClick={handleFinalize}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 border border-emerald-500 cursor-pointer"
              title="Finalizar esta vistoria e armazenar no banco de dados"
            >
              <FileCheck className="w-4 h-4 text-emerald-100" />
              <span>Finalizar Vistoria</span>
            </button>

            {/* Botão Excluir Planilha */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-red-200 transition-all cursor-pointer"
              title="Excluir esta planilha de vistoria"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

      </div>

      {/* Validation Error Modal */}
      {validationError && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-300 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Não é possível finalizar a vistoria
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                {validationError}
              </p>
            </div>

            <button
              onClick={() => setValidationError(null)}
              className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md"
            >
              Entendido / Continuar Preenchendo
            </button>
          </div>
        </div>
      )}

      {/* Finalized Modal Popup */}
      {showFinalizedModal && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-purple-300 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FileCheck className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-purple-950">
                Vistoria Finalizada com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                A planilha de vistoria do <strong>Apartamento {apartment.apartmentId}</strong> foi registrada no banco de dados com a data e hora atuais.
              </p>
            </div>

            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Data e Hora:</span>
                <strong className="text-purple-950">{new Date().toLocaleString('pt-BR')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vistoriador:</span>
                <strong className="text-purple-950">{apartment.inspectorName || 'Técnico Unila'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Itens com Reparo (SIM):</span>
                <strong className="text-amber-800 font-bold">{simCount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Itens em Ordem (NÃO):</span>
                <strong className="text-emerald-800 font-bold">{naoCount}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCreateNewInspection}
                className="w-full py-3 px-4 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4 text-purple-300" />
                <span>Criar Nova Vistoria (Outra Data) para o Apt {apartment.apartmentId}</span>
              </button>

              {onGoToHistory && (
                <button
                  onClick={() => {
                    setShowFinalizedModal(false);
                    onGoToHistory();
                  }}
                  className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl text-xs sm:text-sm border border-purple-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <History className="w-4 h-4 text-purple-700" />
                  <span>Ir para o Banco de Vistorias / Pesquisar por Data</span>
                </button>
              )}

              <button
                onClick={() => setShowFinalizedModal(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-xs underline"
              >
                Continuar Visualizando esta Planilha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save Toast notification */}
      {showSavedToast && (
        <div className="fixed bottom-4 right-4 bg-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-purple-400 flex items-center gap-2 z-50 animate-bounce">
          <Save className="w-4 h-4 text-emerald-400" />
          <span>{isLocked ? 'Planilha Salva e Bloqueada!' : 'Planilha Unila Salva!'}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-300 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Excluir Planilha de Vistoria
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Tem certeza que deseja excluir a planilha de vistoria do <strong>Apartamento {apartment.apartmentId}</strong>? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSpreadsheet}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
