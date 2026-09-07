import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
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
  ChevronDown,
  ChevronUp,
  Unlock,
  AlertTriangle,
  Trash2,
  Save
} from 'lucide-react';
import { ApartmentInspection, MaintenanceChoice, InspectionItemState, FinalizedInspection } from '../types';
import { MAINTENANCE_CATEGORIES } from '../data/categories';
import { exportApartmentToPDF } from '../utils/pdfExport';
import { saveFinalizedInspection, deleteFinalizedInspection, loadFinalizedInspections } from '../utils/historyStorage';

interface ApartmentSpreadsheetProps {
  apartment: ApartmentInspection;
  onUpdateApartment: (updated: ApartmentInspection) => void;
  onBack: () => void;
  onGoToHistory?: () => void;
  onDeleteApartmentSheet?: (apartmentId: string) => void;
  onStartNewInspection?: (apartmentId: string) => void;
  userRole: 'admin' | 'user';
}

export const ApartmentSpreadsheet: React.FC<ApartmentSpreadsheetProps> = ({
  apartment: initialApartment,
  onUpdateApartment,
  onBack,
  onGoToHistory,
  onDeleteApartmentSheet,
  onStartNewInspection,
  userRole
}) => {
  const [activeObservationField, setActiveObservationField] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Alterações Salvas!');
  const [showFinalizedModal, setShowFinalizedModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showFinalizationPrompt, setShowFinalizationPrompt] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isProcessingFinalization, setIsProcessingFinalization] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [localApartment, setLocalApartment] = useState(initialApartment);
  
  const [showReopenPasswordModal, setShowReopenPasswordModal] = useState(false);
  const [reopenPassword, setReopenPassword] = useState('');
  const [reopenPasswordError, setReopenPasswordError] = useState(false);

  useEffect(() => {
    setLocalApartment(initialApartment);
  }, [initialApartment]);

  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('userObservations');
    if (saved) {
      setUserSuggestions(JSON.parse(saved));
    }
  }, []);

  const saveObservationSuggestion = (obs: string) => {
    if (obs.trim() === '') return;
    const current = JSON.parse(localStorage.getItem('userObservations') || '[]');
    if (!current.includes(obs)) {
      const updated = [...current, obs];
      localStorage.setItem('userObservations', JSON.stringify(updated));
      setUserSuggestions(updated);
    }
  };

  const toggleRow = (key: string) => {
    setExpandedRows(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Save spreadsheet and permanently lock from direct open modification if 100% complete
  const handleSaveSpreadsheet = () => {
    // Check if all items are answered
    if (pendingCount > 0) {
      setToastMessage(`Atenção: A planilha só pode ser salva quando TODOS os itens forem respondidos. Restam ${pendingCount} item(ns) pendente(s).`);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
      return;
    }

    const is100PercentComplete = true; // Since pendingCount === 0
    
    const updatedApt: ApartmentInspection = {
      ...localApartment,
      isGenerated: true,
      isSaved: true,
      isLocked: true, // Lock automatically if 100% complete
      updatedAt: new Date().toISOString()
    };
    
    setLocalApartment(updatedApt);
    onUpdateApartment(updatedApt);
    
    setToastMessage('Planilha Salva com Sucesso! 100% concluído, planilha bloqueada.');
    
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Calculate totals
  let totalCount = 0;
  let simCount = 0;
  let naoCount = 0;
  let pendingCount = 0;

  (Object.values(localApartment.items || {}) as InspectionItemState[]).forEach(item => {
    totalCount++;
    if (item.status === 'sim') simCount++;
    else if (item.status === 'nao') naoCount++;
    else pendingCount++;
  });

  const progressPercent = totalCount > 0 ? Math.round(((simCount + naoCount) / totalCount) * 100) : 0;
  const is100Percent = totalCount > 0 && pendingCount === 0;

  // Directly check if spreadsheet is locked / finalized
  const isLocked = Boolean(localApartment.isLocked || localApartment.status === 'finalizada');

  // Helper to update a specific item status or observation
  const handleItemChange = (itemKey: string, field: 'status' | 'observation', value: any, bypassValidation: boolean = false) => {
    if (isLocked) return;
    const nowStr = new Date().toISOString();
    
    // Check if setting to 'sim' without observation
    if (!bypassValidation && field === 'status' && value === 'sim' && (!localApartment.items[itemKey].observation || localApartment.items[itemKey].observation.trim() === '')) {
      setToastMessage('Atenção: A observação é obrigatória para itens com "SIM".');
      triggerSavedToast();
      return;
    }

    const updatedItems = {
      ...localApartment.items,
      [itemKey]: {
        ...localApartment.items[itemKey],
        [field]: value
      }
    };

    // Automatically set status to 'sim' if observation is filled
    if (field === 'observation' && value && value.trim() !== '' && updatedItems[itemKey].status !== 'sim') {
      updatedItems[itemKey].status = 'sim';
    }

    setLocalApartment({
      ...localApartment,
      updatedAt: nowStr,
      items: updatedItems
    });

    setToastMessage('Alterações Pendentes (Salvar Manualmente)');
    triggerSavedToast();
  };

  const triggerSavedToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  // Bulk actions
  const handleSetAll = (choice: MaintenanceChoice) => {
    if (isLocked) return;
    const updatedItems = { ...localApartment.items };
    Object.keys(updatedItems).forEach(key => {
      updatedItems[key] = {
        ...updatedItems[key],
        status: choice
      };
    });

    setLocalApartment({
      ...localApartment,
      isGenerated: true,
      updatedAt: new Date().toISOString(),
      items: updatedItems
    });
    triggerSavedToast();
  };

  const handleInspectorChange = (name: string) => {
    if (isLocked) return;
    setLocalApartment({
      ...localApartment,
      inspectorName: name,
      updatedAt: new Date().toISOString()
    });
    triggerSavedToast();
  };

  const handleKeyCountChange = (count: '1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave') => {
    if (isLocked) return;
    setLocalApartment({
      ...localApartment,
      keyCount: count,
      updatedAt: new Date().toISOString()
    });
    triggerSavedToast();
  };

  const handleOccupancyChange = (status: 'ocupado' | 'desocupado') => {
    if (isLocked) return;
    setLocalApartment({
      ...localApartment,
      occupancyStatus: status,
      updatedAt: new Date().toISOString()
    });
    triggerSavedToast();
  };


  // Extract all repairs and observations for single-line summary
  const repairsArray: string[] = [];
  const observationsArray: string[] = [];
  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      const key = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      const it = localApartment.items ? localApartment.items[key] : null;
      if (it?.status === 'sim') {
        repairsArray.push(`${cat.name} (${itemName})`);
      }
      if (it?.observation && it.observation.trim()) {
        observationsArray.push(`${itemName}: ${it.observation.trim()}`);
      }
    });
  });

  const repairsSummaryText = repairsArray.length > 0 ? repairsArray.join(' | ') : 'Nenhum reparo necessário';
  const observationsSummaryText = observationsArray.length > 0 ? observationsArray.join(' | ') : 'Nenhuma observação informada';
  const dateFormatted = localApartment.updatedAt ? new Date(localApartment.updatedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

  // Finalize inspection and store in history database with strict validations
  const initiateFinalization = () => {
    // Validation: Check for repairs ('SIM')
    const hasRepairs = (Object.values(localApartment.items || {}) as InspectionItemState[]).some(item => item.status === 'sim');
    
    if (hasRepairs) {
      setValidationError(`A planilha só pode ser finalizada quando NÃO houver reparos pendentes (itens marcados com "SIM"). Verifique os itens e altere para "NÃO" quando o reparo for realizado.`);
      return;
    }

    // Validation: Still require no pending items
    if (pendingCount > 0) {
      setValidationError(`A planilha só pode ser finalizada quando TODOS os itens estiverem respondidos. Ainda restam ${pendingCount} item(ns) pendente(s) sem marcação.`);
      return;
    }

    setValidationError(null);
    setShowPasswordModal(true);
  };

  const confirmFinalization = () => {
    if (isProcessingFinalization || localApartment.status === 'finalizada') return;

    setIsProcessingFinalization(true);
    setIsFinalizing(false);

    const now = new Date();
    const isoString = now.toISOString();
    const dateStr = isoString.split('T')[0];
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const finalizedRecord: FinalizedInspection = {
      id: `${localApartment.apartmentId}_${Date.now()}`,
      apartmentId: localApartment.apartmentId,
      block: localApartment.block,
      number: localApartment.number,
      floor: localApartment.floor,
      inspectorName: localApartment.inspectorName || 'Técnico Unila',
      occupancyStatus: localApartment.occupancyStatus,
      keyCount: localApartment.keyCount,
      finalizedAt: isoString,
      inspectionDate: dateStr,
      inspectionTime: timeStr,
      items: localApartment.items,
      simCount,
      naoCount,
      pendingCount
    };

    saveFinalizedInspection(finalizedRecord);

    onUpdateApartment({
      ...localApartment,
      isGenerated: false,
      isSaved: true,
      isLocked: true,
      status: 'finalizada',
      finalizedAt: isoString,
      updatedAt: isoString
    });

    setShowFinalizedModal(true);
  };

  // Delete current spreadsheet
  const handleDeleteSpreadsheet = () => {
    if (onDeleteApartmentSheet) {
      onDeleteApartmentSheet(localApartment.apartmentId);
    }
    setShowDeleteModal(false);
    onBack();
  };

  let rowCounter = 0;

  return (
    <div className="space-y-6">


      {/* Main Spreadsheet Card */}
      <div className="bg-white border-2 border-purple-800 rounded-2xl shadow-lg overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
                {/* Printable Standardized Header & In-Line Summary Box */}
        <div className="hidden print:block mb-4 text-black border-2 border-black p-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider">UNILA - PLANILHA DE VISTORIA E MANUTENÇÃO</h1>
              <p className="text-xs text-gray-700 font-medium">Relatório Oficial de Vistoria Predial e Reparos</p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold">Data: {dateFormatted}</div>
              <div>Vistoriador: <strong>{localApartment.inspectorName || 'Não informado'}</strong></div>
            </div>
          </div>

          {/* Resumo Geral em Linha com os 5 dados solicitados */}
          <div className="space-y-1.5 text-xs">
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-2 border border-gray-400 font-semibold">
              <div><strong>Nº Apartamento:</strong> {localApartment.apartmentId} (Bloco {localApartment.block} • {localApartment.floor})</div>
              <div><strong>Status:</strong> {(localApartment.occupancyStatus || 'Não informado').toUpperCase()}</div>
              <div><strong>Chaves:</strong> {localApartment.keyCount || 'Não informado'}</div>
            </div>
            <div className="border border-gray-400 p-2 bg-gray-50 space-y-1">
              <div><strong>Reparos Realizados (SIM):</strong> <span className="font-semibold text-red-900">{repairsSummaryText}</span></div>
              <div><strong>Observações Selecionadas:</strong> <span className="italic">{observationsSummaryText}</span></div>
            </div>
          </div>
        </div>

        {/* Lock Banner / Finalized Banner Warning */}
        {localApartment.status === 'finalizada' ? (
          <div className="bg-emerald-900 text-emerald-100 border-b-2 border-emerald-700 px-4 py-3 text-xs font-bold flex items-center justify-between gap-2 print:hidden shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Vistoria <strong>Finalizada (Apenas Visualização)</strong>: Esta planilha foi arquivada no banco de dados.
              </span>
            </div>
          </div>
        ) : isLocked ? (
          <div className="bg-purple-900 text-purple-100 border-b-2 border-purple-700 px-4 py-3 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shadow-inner">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                Planilha <strong>Salva e Bloqueada</strong>: Esta planilha não pode mais ser modificada aberta. Qualquer alteração de status (SIM/NÃO) só poderá ser feita através do botão <strong>"Reparos"</strong> na tela inicial.
              </span>
            </div>
          </div>
        ) : null}

        {/* Excel Header Metadata Table */}
        <div className="bg-purple-50/70 border-b-2 border-purple-200 p-3 sm:p-4 print:hidden">
          <button
            onClick={() => setIsMetadataOpen(!isMetadataOpen)}
            className="flex items-center gap-2 w-full text-purple-900 font-bold text-xs mb-2"
          >
            {isMetadataOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{isMetadataOpen ? 'Ocultar Detalhes do Apartamento' : 'Mostrar Detalhes do Apartamento'}</span>
          </button>
          {isMetadataOpen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fadeIn">
              
               {/* Apt & Block Info */}
              <div className="bg-white p-2 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-900 text-white font-black text-lg flex items-center justify-center shrink-0">
                  {localApartment.apartmentId}
                </div>
                <div>
                  <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">Loc.</span>
                  <span className="text-xs font-bold text-gray-900">
                    {localApartment.block} • {localApartment.floor}
                  </span>
                </div>
              </div>

              {/* Inspector Name Input */}
              <div className="bg-white p-2 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
                <User className="w-4 h-4 text-purple-700 shrink-0" />
                <div className="w-full">
                  <label className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                    Responsável
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    readOnly={isLocked}
                    value={localApartment.inspectorName || ''}
                    onChange={(e) => handleInspectorChange(e.target.value)}
                    placeholder={isLocked ? 'Não informado' : 'Nome...'}
                    className={`w-full text-xs font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-600 rounded px-1 py-0.5 ${
                      isLocked ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'bg-purple-50/30'
                    }`}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-white p-2 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                    Data
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {localApartment.updatedAt ? new Date(localApartment.updatedAt).toLocaleDateString('pt-BR') : 'Hoje'}
                  </span>
                </div>
              </div>
              
              {/* Occupancy & Keys */}
              <div className="bg-white p-2 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
                  <div className="flex flex-col gap-1 w-full">
                      <select
                          disabled={isLocked}
                          value={localApartment.occupancyStatus || ''}
                          onChange={(e) => handleOccupancyChange(e.target.value as 'ocupado' | 'desocupado')}
                          className={`w-full text-[10px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-600 rounded p-0.5 border border-gray-200 ${
                          isLocked ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-gray-50'
                          }`}
                      >
                          <option value="">Status...</option>
                          <option value="ocupado">Ocupado</option>
                          <option value="desocupado">Desocupado</option>
                      </select>
                      <select
                          disabled={isLocked}
                          value={localApartment.keyCount || ''}
                          onChange={(e) => handleKeyCountChange(e.target.value as '1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave')}
                          className={`w-full text-[10px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-600 rounded p-0.5 border border-gray-200 ${
                          isLocked ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-gray-50'
                          }`}
                      >
                          <option value="">Chaves...</option>
                          <option value="1 chave">1 chave</option>
                          <option value="2 chave">2 chave</option>
                          <option value="3 chave">3 chave</option>
                          <option value="4 chave">4 chave</option>
                          <option value="5 chave">5 chave</option>
                      </select>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm print:text-xs">
            
            {/* Table Column Headers */}
            <thead>
              <tr className="bg-purple-900 text-white font-bold text-xs uppercase tracking-wider border-b-2 border-purple-950 print:bg-gray-200 print:text-black print:border-black">
                <th className="py-3 px-3 w-12 text-center border-r border-purple-800 print:border-gray-400">#</th>
                <th className="hidden print:table-cell py-2 px-2 w-20 border-r border-purple-800 print:border-gray-400">Nº Apt</th>
                <th className="hidden print:table-cell py-2 px-2 w-24 border-r border-purple-800 print:border-gray-400">Status</th>
                <th className="hidden print:table-cell py-2 px-2 w-20 border-r border-purple-800 print:border-gray-400">Chaves</th>
                <th className="py-3 px-4 w-32 border-r border-purple-800 print:border-gray-400">Categoria</th>
                <th className="py-3 px-4 sm:w-64 border-r border-purple-800 print:border-gray-400">Item de Manutenção</th>
                <th className="py-3 px-4 text-center w-56 sm:w-64 border-r border-purple-800 print:border-gray-400">
                  Reparo Realizado?
                </th>
                <th className="py-3 px-4">Observação Selecionada</th>
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
                  if (localApartment.items[k]?.status === 'sim') catSim++;
                  if (localApartment.items[k]?.status === 'nao') catNao++;
                });

                return (
                  <React.Fragment key={catCategory.id}>
                    
                    {/* Category Divider Header Row (Excel Style) */}
                    <tr className="bg-purple-100/90 border-y-2 border-purple-300 font-bold text-purple-950 text-xs sm:text-sm print:bg-gray-100 print:text-black print:border-gray-400">
                      <td colSpan={8} className="py-2.5 px-4 bg-purple-100 print:bg-gray-100">
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
                      const itemState = localApartment.items[itemKey] || {
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

                          {/* Print Only: Apt Number */}
                          <td className="hidden print:table-cell py-2 px-2 font-bold text-xs text-black border-r border-gray-200">
                            {localApartment.apartmentId}
                          </td>

                          {/* Print Only: Occupancy Status */}
                          <td className="hidden print:table-cell py-2 px-2 uppercase text-[11px] font-semibold text-black border-r border-gray-200">
                            {localApartment.occupancyStatus || '-'}
                          </td>

                          {/* Print Only: Keys */}
                          <td className="hidden print:table-cell py-2 px-2 text-[11px] font-medium text-black border-r border-gray-200">
                            {localApartment.keyCount || '-'}
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
                                onClick={() => {
                                  const newStatus = isSim ? null : 'sim';
                                  handleItemChange(itemKey, 'status', newStatus);
                                  if (newStatus === 'sim') {
                                    setTimeout(() => {
                                      const el = document.getElementById(`obs-${itemKey}`);
                                      if (el) el.focus();
                                    }, 50);
                                  }
                                }}
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
                              {isSim ? 'SIM (REPARO)' : isNao ? 'NÃO (OK)' : '-'}
                            </div>
                          </td>

                          {/* Observation Cell */}
                          <td className="py-2 px-3 relative border-r border-gray-200 print:border-gray-300">
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`obs-${itemKey}`}
                                type="text"
                                disabled={isLocked}
                                readOnly={isLocked}
                                value={itemState.observation || ''}
                                onChange={(e) => handleItemChange(itemKey, 'observation', e.target.value)}
                                onBlur={(e) => saveObservationSuggestion(e.target.value)}
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
                                {itemState.observation || '-'}
                              </div>

                              {/* Quick Note Dropdown Suggestion Trigger */}
                              {!isLocked && (
                                <div className="relative print:hidden">
                                  <button
                                    type="button"
                                    onClick={() => setActiveObservationField(activeObservationField === itemKey ? null : itemKey)}
                                    className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 cursor-pointer"
                                    title="Inserir observação rápida"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>

                                  {activeObservationField === itemKey && (
                                    <div className="absolute right-0 bottom-full mb-1 w-64 bg-white rounded-xl shadow-xl border border-purple-200 p-2 z-50 text-xs space-y-1">
                                      <div className="font-bold text-purple-900 border-b border-purple-100 pb-1 mb-1 px-1 flex items-center justify-between">
                                        <span>Sugestões Rápidas</span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveObservationField(null)}
                                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                      <div className="max-h-40 overflow-y-auto space-y-1">
                                        {userSuggestions.map((sug) => (
                                          <button
                                            key={sug}
                                            type="button"
                                            onClick={() => {
                                              handleItemChange(itemKey, 'observation', sug);
                                              setActiveObservationField(null);
                                            }}
                                            className="w-full text-left p-1.5 hover:bg-purple-50 text-gray-800 rounded font-medium text-[11px] transition-colors border border-transparent hover:border-purple-200 cursor-pointer"
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
        <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col lg:flex-row items-center justify-between gap-4 print:hidden">

          {/* Left: Quick Export / PDF Tool */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center lg:justify-start">
            <button
              onClick={() => exportApartmentToPDF(localApartment)}
              className="px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Baixar a planilha completa de vistoria com cabeçalho e observações em formato PDF"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Baixar como PDF</span>
            </button>
          </div>

          {/* Right: State / Finalization Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-center lg:justify-end">

            {localApartment.status === 'finalizada' && userRole === 'admin' ? (
              <>
                <button
                  onClick={() => setShowReopenPasswordModal(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 border border-amber-500 cursor-pointer"
                  title="Reabrir vistoria para edição (Requer senha de administrador)"
                >
                  <Unlock className="w-4 h-4 text-amber-100" />
                  <span>Reabrir Vistoria</span>
                </button>
              </>
            ) : isLocked ? (
              <>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 bg-purple-100 px-4 py-2.5 rounded-xl border border-purple-300">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <span>Planilha Salva (Bloqueada)</span>
                </div>

                {/* Botão Finalizar Vistoria */}
                {userRole === 'admin' && (
                  <button
                    onClick={initiateFinalization}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 border border-emerald-500 cursor-pointer"
                    title="Finalizar esta vistoria e armazenar no banco de dados"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-100" />
                    <span>Finalizar Vistoria</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Botão Salvar Planilha */}
                <button
                  onClick={handleSaveSpreadsheet}
                  className="px-6 py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 border border-purple-700 cursor-pointer"
                  title="Salvar planilha (após salvar, ela não poderá mais ser modificada aberta, apenas via botão Reparos)"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Salvar Planilha</span>
                </button>

                {/* Botão Finalizar Vistoria */}
                <button
                  onClick={initiateFinalization}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 border border-emerald-500 cursor-pointer"
                  title="Finalizar esta vistoria e armazenar no banco de dados"
                >
                  <FileCheck className="w-4 h-4 text-emerald-100" />
                  <span>Finalizar Vistoria</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Finalization Confirmation Modal */}
      {isFinalizing && (
        <div className="fixed inset-0 bg-purple-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-emerald-500 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FileCheck className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-purple-950">
                Confirmar Finalização?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Ao confirmar, a vistoria do <strong>Apartamento {localApartment.apartmentId}</strong> será permanentemente finalizada e bloqueada para edições.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsFinalizing(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Voltar e Revisar
              </button>
              <button
                onClick={confirmFinalization}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Confirmar Finalização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalization Prompt Modal */}
      {showFinalizationPrompt && (
        <div className="fixed inset-0 bg-purple-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-emerald-500 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FileCheck className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-purple-950">
                Vistoria Concluída! Deseja Finalizar?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Todos os itens foram respondidos. Deseja finalizar a vistoria do <strong>Apartamento {localApartment.apartmentId}</strong> agora?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowFinalizationPrompt(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Não, Revisar Mais
              </button>
              <button
                onClick={() => {
                  setShowFinalizationPrompt(false);
                  initiateFinalization();
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Sim, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-purple-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-4 border-purple-800 text-center space-y-5">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-purple-950">
                Senha de Finalização
              </h3>
              <p className="text-xs text-gray-600 mt-2">
                Digite a senha para confirmar a finalização da vistoria.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full mt-4 p-3 border-2 rounded-xl text-center text-lg font-mono font-bold ${
                  passwordError ? 'border-red-500 bg-red-50' : 'border-purple-200 focus:ring-purple-500 focus:border-purple-500'
                }`}
                placeholder="****"
              />
              {passwordError && <p className="text-red-500 text-xs mt-2 font-bold">Senha incorreta!</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError(false);
                }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (password === '4526') {
                    setShowPasswordModal(false);
                    setPassword('');
                    setIsFinalizing(true);
                  } else {
                    setPasswordError(true);
                    setPassword('');
                  }
                }}
                className="flex-1 py-3 px-4 bg-purple-900 hover:bg-purple-800 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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
                A planilha de vistoria do <strong>Apartamento {localApartment.apartmentId}</strong> foi armazenada no banco de dados para pesquisa e consultas futuras.
              </p>
            </div>

            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Data e Hora de Registro:</span>
                <strong className="text-purple-950">{new Date().toLocaleString('pt-BR')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vistoriador:</span>
                <strong className="text-purple-950">{localApartment.inspectorName || 'Técnico Unila'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status do Apartamento:</span>
                <strong className="text-purple-950 capitalize">{localApartment.occupancyStatus || 'Não informado'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantidade de Chaves:</span>
                <strong className="text-purple-950">{localApartment.keyCount || 'Não informado'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Itens em Ordem (NÃO):</span>
                <strong className="text-emerald-800 font-bold">{naoCount} de {totalCount}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => exportApartmentToPDF(localApartment)}
                className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-800 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>Baixar Vistoria como PDF</span>
              </button>

              {onGoToHistory && (
                <button
                  onClick={() => {
                    setShowFinalizedModal(false);
                    onGoToHistory();
                  }}
                  className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl text-xs sm:text-sm border border-purple-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4 text-purple-700" />
                  <span>Pesquisar Vistorias no Banco de Dados</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowFinalizedModal(false);
                    onBack();
                  }}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Voltar ao Início
                </button>
                <button
                  onClick={() => setShowFinalizedModal(false)}
                  className="flex-1 py-2 px-3 text-gray-500 hover:text-gray-700 font-medium text-xs underline cursor-pointer"
                >
                  Ver Planilha Atual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save Toast notification */}
      {showSavedToast && (
        <div className="fixed bottom-4 right-4 bg-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-purple-400 flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
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
                Tem certeza que deseja excluir a planilha de vistoria do <strong>Apartamento {localApartment.apartmentId}</strong>? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                }}
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

      {/* Reopen Password Modal */}
      {showReopenPasswordModal && (
        <div className="fixed inset-0 bg-purple-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-4 border-amber-500 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Unlock className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-purple-950">
                Senha de Administrador
              </h3>
              <p className="text-xs text-gray-600 mt-2">
                Digite a senha de administrador para reabrir esta vistoria.
              </p>
              <input
                type="password"
                value={reopenPassword}
                onChange={(e) => {
                  setReopenPassword(e.target.value);
                  setReopenPasswordError(false);
                }}
                className={`w-full mt-4 p-3 border-2 rounded-xl text-center text-lg font-mono font-bold ${
                  reopenPasswordError ? 'border-red-500 bg-red-50' : 'border-amber-200 focus:ring-amber-500 focus:border-amber-500'
                }`}
                placeholder="****"
              />
              {reopenPasswordError && <p className="text-red-500 text-xs mt-2 font-bold">Senha incorreta!</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowReopenPasswordModal(false);
                  setReopenPassword('');
                  setReopenPasswordError(false);
                }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (reopenPassword === '2645') {
                    setShowReopenPasswordModal(false);
                    setReopenPassword('');
                    setReopenPasswordError(false);
                    
                    const nowIsoString = new Date().toISOString();
                    onUpdateApartment({
                      ...localApartment,
                      isGenerated: true,
                      isSaved: true,
                      isLocked: false,
                      status: 'em andamento',
                      finalizedAt: undefined,
                      updatedAt: nowIsoString
                    });
                    
                    setToastMessage('Vistoria reaberta com sucesso!');
                    setShowSavedToast(true);
                  } else {
                    setReopenPasswordError(true);
                    setReopenPassword('');
                  }
                }}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Reabrir Vistoria
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
