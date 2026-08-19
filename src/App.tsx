import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ApartmentCard } from './components/ApartmentCard';
import { ApartmentSpreadsheet } from './components/ApartmentSpreadsheet';
import { GeneralDashboard } from './components/GeneralDashboard';
import { InspectionHistory } from './components/InspectionHistory';
import { QuickFixView } from './components/QuickFixView';
import { SearchAndGenerator } from './components/SearchAndGenerator';
import { ApartmentInspection, BuildingBlock, InspectionItemState, FinalizedInspection } from './types';
import { loadStoredApartments, saveApartmentsState } from './utils/storage';
import { createEmptyItemsMap } from './data/apartments';
import { Sparkles, Building2, Search, PlusCircle, CheckCircle2, Trash2, User, Home, Key, AlertTriangle, ArrowRight, X, Wrench } from 'lucide-react';

export default function App() {
  const [apartments, setApartments] = useState<ApartmentInspection[]>([]);
  const [activeView, setActiveView] = useState<'search' | 'dashboard' | 'spreadsheet' | 'history' | 'quick-fix'>('search');
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [aptToDelete, setAptToDelete] = useState<string | null>(null);
  
  // Unified Generation Modal State
  const [generationTarget, setGenerationTarget] = useState<string | 'FILTERED' | null>(null);
  const [inspectorName, setInspectorName] = useState<string>('');
  const [apartmentStatus, setApartmentStatus] = useState<'ocupado' | 'desocupado' | ''>('');
  const [keyCount, setKeyCount] = useState<'1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave' | ''>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Temporary snapshot when viewing a historical finalized inspection
  const [historicalViewApt, setHistoricalViewApt] = useState<ApartmentInspection | null>(null);
  const [showQuickFixSearchModal, setShowQuickFixSearchModal] = useState(false);
  const [quickFixSearchId, setQuickFixSearchId] = useState('');

  // Handle service completion
  const handleServiceCompleted = (aptId: string, itemId: string) => {
    setApartments(prev => {
      const next = prev.map(a => {
        if (a.apartmentId === aptId && a.items[itemId]) {
          return {
            ...a,
            items: {
              ...a.items,
              [itemId]: { ...a.items[itemId], status: 'nao', observation: '' } // Mark as done and clear observation
            },
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });
      saveApartmentsState(next);
      return next;
    });
  };

  // Open quick fix / repairs view directly for a specified or searched apartment
  const handleOpenRepairsForApartment = (targetAptInput?: string) => {
    let query = (targetAptInput || searchTerm || '').trim().toUpperCase();

    if (query) {
      // 1. Direct exact match by apartmentId (e.g. A001, B102, E205)
      let target = apartments.find(a => a.apartmentId.toUpperCase() === query);

      // 2. If no exact match and only 1 filtered apartment, use it
      if (!target && filteredApartments.length === 1) {
        target = filteredApartments[0];
      }

      // 3. Match without block prefix (e.g. user typed "001" or "101")
      if (!target) {
        target = apartments.find(a => a.number === query || a.apartmentId.endsWith(query));
      }

      if (target && target.isGenerated) {
        setSelectedAptId(target.apartmentId);
        setActiveView('quick-fix');
        setShowQuickFixSearchModal(false);
        setQuickFixSearchId('');
        return;
      }
    }

    // If no inspection was generated or no direct target found, open the popup modal
    setQuickFixSearchId(query);
    setShowQuickFixSearchModal(true);
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<BuildingBlock | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GENERATED' | 'WITH_ISSUES' | 'COMPLETED'>('ALL');

  // Initial load
  useEffect(() => {
    const { apartments: loadedApts } = loadStoredApartments();
    setApartments(loadedApts);
  }, []);

  // Sync state changes to storage
  const updateApartmentInState = (updatedApt: ApartmentInspection) => {
    setHistoricalViewApt(null);
    setApartments(prev => {
      const next = prev.map(a => a.apartmentId === updatedApt.apartmentId ? updatedApt : a);
      saveApartmentsState(next);
      return next;
    });
  };

  // Open the unified configuration modal for generating spreadsheet(s)
  const handleOpenGenerationModal = (target: string | 'FILTERED') => {
    setGenerationTarget(target);
    setModalError(null);
    // If targeting a specific apartment that already has some metadata, pre-fill it
    if (target !== 'FILTERED') {
      const existing = apartments.find(a => a.apartmentId === target);
      if (existing) {
        if (existing.inspectorName) setInspectorName(existing.inspectorName);
        if (existing.occupancyStatus) setApartmentStatus(existing.occupancyStatus);
        if (existing.keyCount) setKeyCount(existing.keyCount);
      }
    }
  };

  // Start a fresh, new inspection for an apartment (e.g. for a new date)
  const handleStartNewInspectionForApartment = (aptId: string) => {
    setHistoricalViewApt(null);
    setSelectedAptId(aptId);
    handleOpenGenerationModal(aptId);
  };

  // Delete / reset an apartment spreadsheet
  const handleDeleteApartmentSheet = (aptId: string) => {
    const newEmptyItems = createEmptyItemsMap();
    setApartments(prev => {
      const next = prev.map(a => {
        if (a.apartmentId === aptId) {
          return {
            ...a,
            isGenerated: false,
            status: 'rascunho' as const,
            updatedAt: undefined,
            finalizedAt: undefined,
            inspectorName: '',
            occupancyStatus: undefined,
            keyCount: undefined,
            items: newEmptyItems
          };
        }
        return a;
      });
      saveApartmentsState(next);
      return next;
    });
    if (selectedAptId === aptId) {
      setSelectedAptId(null);
      setHistoricalViewApt(null);
    }
  };

  // Callback when a finalized inspection is deleted from the database
  const handleDeleteFinalizedInspection = (aptId: string, _inspectionId: string) => {
    const newEmptyItems = createEmptyItemsMap();
    setApartments(prev => {
      const next = prev.map(a => {
        if (a.apartmentId === aptId) {
          return {
            ...a,
            isGenerated: false,
            status: 'rascunho' as const,
            updatedAt: undefined,
            finalizedAt: undefined,
            inspectorName: '',
            occupancyStatus: undefined,
            keyCount: undefined,
            items: newEmptyItems
          };
        }
        return a;
      });
      saveApartmentsState(next);
      return next;
    });
    if (selectedAptId === aptId) {
      setSelectedAptId(null);
      setHistoricalViewApt(null);
    }
  };

  // View a historical finalized inspection snapshot
  const handleSelectHistoricalInspection = (historical: FinalizedInspection) => {
    const historicalApt: ApartmentInspection = {
      apartmentId: historical.apartmentId,
      block: historical.block,
      number: historical.number,
      floor: historical.floor,
      isGenerated: true,
      updatedAt: historical.finalizedAt,
      inspectorName: historical.inspectorName,
      occupancyStatus: historical.occupancyStatus,
      keyCount: historical.keyCount,
      items: historical.items,
      status: 'finalizada',
      finalizedAt: historical.finalizedAt
    };
    setHistoricalViewApt(historicalApt);
    setSelectedAptId(historical.apartmentId);
    setActiveView('spreadsheet');
  };

  // Confirm generation from the unified modal
  const handleConfirmGeneration = () => {
    if (!inspectorName.trim()) {
      setModalError('Por favor, informe o nome do vistoriador / responsável.');
      return;
    }
    if (!apartmentStatus) {
      setModalError('Por favor, selecione o status do apartamento (ocupado ou desocupado).');
      return;
    }
    if (!keyCount) {
      setModalError('Por favor, selecione a quantidade de chaves.');
      return;
    }

    setModalError(null);
    setHistoricalViewApt(null);
    const nowIso = new Date().toISOString();
    const finalInspector = inspectorName.trim();
    const finalStatus = apartmentStatus as 'ocupado' | 'desocupado';
    const finalKeys = keyCount as '1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave';

    if (generationTarget === 'FILTERED') {
      let firstAptIdToOpen: string | null = null;
      setApartments(prev => {
        const next = prev.map(a => {
          if (filteredApartments.some(fa => fa.apartmentId === a.apartmentId)) {
            if (!firstAptIdToOpen) firstAptIdToOpen = a.apartmentId;
            const shouldReset = a.status === 'finalizada' || !a.items || a.isSaved;
            return {
              ...a,
              isGenerated: true,
              isSaved: false,
              isLocked: false,
              status: 'rascunho' as const,
              finalizedAt: undefined,
              inspectorName: finalInspector,
              occupancyStatus: finalStatus,
              keyCount: finalKeys,
              items: shouldReset ? createEmptyItemsMap() : a.items,
              updatedAt: nowIso
            };
          }
          return a;
        });
        saveApartmentsState(next, { allGenerated: false, defaultInspector: finalInspector });
        return next;
      });

      if (firstAptIdToOpen) {
        setSelectedAptId(firstAptIdToOpen);
        setActiveView('spreadsheet');
      }
    } else if (generationTarget) {
      const targetId = generationTarget;
      setApartments(prev => {
        const next = prev.map(a => {
          if (a.apartmentId === targetId) {
            const shouldReset = a.status === 'finalizada' || !a.items || a.isSaved;
            return {
              ...a,
              isGenerated: true,
              isSaved: false,
              isLocked: false,
              status: 'rascunho' as const,
              finalizedAt: undefined,
              inspectorName: finalInspector,
              occupancyStatus: finalStatus,
              keyCount: finalKeys,
              items: shouldReset ? createEmptyItemsMap() : a.items,
              updatedAt: nowIso
            };
          }
          return a;
        });
        saveApartmentsState(next);
        return next;
      });

      setSelectedAptId(targetId);
      setActiveView('spreadsheet');
    }

    setGenerationTarget(null);
    setSearchTerm('');
  };

  // Select apartment to open spreadsheet
  const handleSelectApartment = (aptId: string) => {
    setHistoricalViewApt(null);
    // Ensure marked generated when opened
    const target = apartments.find(a => a.apartmentId === aptId);
    if (target && !target.isGenerated) {
      handleOpenGenerationModal(aptId);
    } else {
      setSelectedAptId(aptId);
      setActiveView('spreadsheet');
    }
  };

  // Compute stats for active non-finalized sheets
  const totalApartments = apartments.length;
  const generatedCount = apartments.filter(a => a.isGenerated && a.status !== 'finalizada').length;

  let simCountTotal = 0;
  apartments.forEach(a => {
    if (a.isGenerated && a.status !== 'finalizada' && a.items) {
      (Object.values(a.items) as InspectionItemState[]).forEach(item => {
        if (item.status === 'sim') simCountTotal++;
      });
    }
  });

  // Apartments that currently have pending repairs
  const apartmentsWithRepairs = useMemo(() => {
    return apartments
      .filter(a => a.isGenerated && a.status !== 'finalizada')
      .map(a => {
        let count = 0;
        if (a.items) {
          (Object.values(a.items) as InspectionItemState[]).forEach(it => {
            if (it.status === 'sim') count++;
          });
        }
        return { apartmentId: a.apartmentId, repairsCount: count };
      })
      .filter(a => a.repairsCount > 0);
  }, [apartments]);

  // Target apartment in quick fix search popup
  const searchedQuickFixApt = useMemo(() => {
    const q = quickFixSearchId.trim().toUpperCase();
    if (!q) return null;
    return (
      apartments.find(a => a.apartmentId.toUpperCase() === q) ||
      apartments.find(a => a.number === q || a.apartmentId.endsWith(q)) ||
      null
    );
  }, [quickFixSearchId, apartments]);

  const hasInspectionForSearchedApt = Boolean(searchedQuickFixApt && searchedQuickFixApt.isGenerated);

  // Filter apartments list according to search term
  const filteredApartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // If user typed a search term, match ANY apartment in the condominium matching the term
    if (term.length > 0) {
      return apartments.filter(apt => {
        const matchId = apt.apartmentId.toLowerCase().includes(term);
        const matchInspector = (apt.inspectorName || '').toLowerCase().includes(term);
        const matchNumber = apt.number.toLowerCase().includes(term);
        return matchId || matchInspector || matchNumber;
      });
    }

    // When not searching: show active generated sheets that are not finalized
    return apartments.filter(apt => apt.isGenerated && apt.status !== 'finalizada');
  }, [apartments, searchTerm]);

  const activeApartment = useMemo(() => {
    if (historicalViewApt) return historicalViewApt;
    if (!selectedAptId) return null;
    return apartments.find(a => a.apartmentId === selectedAptId) || null;
  }, [apartments, selectedAptId, historicalViewApt]);

  return (
    <div className="min-h-screen bg-purple-50/40 text-gray-900 flex flex-col font-sans selection:bg-purple-800 selection:text-white">
      
      {/* Top Unila Header (Hidden on spreadsheet and history views for a cleaner layout) */}
      {activeView !== 'spreadsheet' && activeView !== 'history' && (
        <Header
          totalApartments={totalApartments}
          generatedCount={generatedCount}
          simCountTotal={simCountTotal}
          activeView={activeView}
          setActiveView={(view) => {
            if (view !== 'spreadsheet') setHistoricalViewApt(null);
            setActiveView(view);
          }}
          selectedAptId={selectedAptId}
        />
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: SEARCH & APARTMENT LIST */}
        {activeView === 'search' && (
          <div className="space-y-6">
            <SearchAndGenerator
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onGenerateFiltered={() => handleOpenGenerationModal('FILTERED')}
              onOpenQuickFixSearch={(term) => handleOpenRepairsForApartment(term)}
              filteredCount={filteredApartments.length}
              totalApartments={totalApartments}
            />

            {/* Apartment Cards Grid */}
            {(generatedCount > 0 || searchTerm || selectedBlock !== 'ALL' || selectedFloor !== 'ALL') && (
              <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <span>
                      {filteredApartments.length} Planilha{filteredApartments.length === 1 ? '' : 's'}
                      {searchTerm ? ` para "${searchTerm}"` : ''}
                      {selectedBlock !== 'ALL' ? ` (Bloco ${selectedBlock})` : ''}
                    </span>
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    Exibindo vistorias dos Blocos A, B e E
                  </span>
                </div>

                {filteredApartments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-purple-100 text-gray-500 text-sm">
                    Nenhum apartamento encontrado para os filtros selecionados. Tente buscar por "A001", "B102" ou "E205".
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {filteredApartments.map(apt => (
                      <ApartmentCard
                        key={apt.apartmentId}
                        apartment={apt}
                        onSelect={handleSelectApartment}
                        onGenerate={(aptId) => handleOpenGenerationModal(aptId)}
                        onOpenRepairs={(aptId) => handleOpenRepairsForApartment(aptId)}
                        onDelete={(aptId) => setAptToDelete(aptId)}
                        onNewInspection={handleStartNewInspectionForApartment}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: SPREADSHEET VIEW */}
        {activeView === 'spreadsheet' && activeApartment && (
          <ApartmentSpreadsheet
            apartment={activeApartment}
            onUpdateApartment={updateApartmentInState}
            onBack={() => setActiveView('search')}
            onGoToHistory={() => setActiveView('history')}
            onDeleteApartmentSheet={handleDeleteApartmentSheet}
            onStartNewInspection={handleStartNewInspectionForApartment}
          />
        )}

        {/* VIEW 3: INSPECTION HISTORY / DATABASE VIEW */}
        {activeView === 'history' && (
          <InspectionHistory
            onSelectHistoricalInspection={handleSelectHistoricalInspection}
            onCreateNewForApartment={handleStartNewInspectionForApartment}
            onDeleteFinalizedInspection={handleDeleteFinalizedInspection}
            onBack={() => setActiveView('search')}
          />
        )}

        {/* VIEW 5: QUICK FIX / REPAIRS VIEW */}
        {activeView === 'quick-fix' && selectedAptId && (
          <QuickFixView
            apartmentId={selectedAptId}
            apartments={apartments}
            onSaveApartment={updateApartmentInState}
            onOpenSpreadsheet={(aptId) => {
              setSelectedAptId(aptId);
              setActiveView('spreadsheet');
            }}
            onBack={() => setActiveView('search')}
          />
        )}

        {/* VIEW 4: GENERAL DASHBOARD */}
        {activeView === 'dashboard' && (
          <GeneralDashboard
            apartments={apartments}
            onSelectApartment={handleSelectApartment}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-purple-950 text-purple-300 py-6 border-t border-purple-800 text-center text-xs mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-wider">UNILA</span>
            <span>• Planilhas de Vistoria e Manutenção de Apartamentos</span>
          </div>
          <div className="text-purple-400">
            Blocos A (001-216) • Bloco B (001-216) • Bloco E (001-216)
          </div>
        </div>
      </footer>

      {/* Delete Confirmation Modal for Apartment Cards */}
      {aptToDelete && (
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
                Tem certeza que deseja excluir / resetar a planilha do <strong>Apartamento {aptToDelete}</strong>? Todas as respostas preenchidas nesta planilha serão limpas.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAptToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDeleteApartmentSheet(aptToDelete);
                  setAptToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED GENERATION CONFIGURATION MODAL (Same for search bar & apartment cards) */}
      {generationTarget && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border-2 border-purple-300 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-purple-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
                  {generationTarget === 'FILTERED'
                    ? filteredApartments.length === 1
                      ? `Apartamento ${filteredApartments[0].apartmentId}`
                      : `${filteredApartments.length} Apartamentos Filtrados`
                    : `Apartamento ${generationTarget}`}
                </span>
                <h3 className="text-xl font-extrabold text-purple-950 mt-1">
                  Configuração da Vistoria
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Preencha as informações iniciais para gerar e abrir a planilha.
                </p>
              </div>
              <button
                onClick={() => setGenerationTarget(null)}
                className="p-1.5 text-gray-400 hover:text-purple-900 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Vistoriador */}
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-700" />
                  <span>Vistoriador / Responsável *</span>
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => {
                    setInspectorName(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-purple-50/40 border border-purple-200 rounded-xl text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium"
                  placeholder="Nome do técnico ou vistoriador..."
                  autoFocus
                />
              </div>
              
              {/* Status do Apartamento */}
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-purple-700" />
                  <span>Status do Apartamento *</span>
                </label>
                <select
                  value={apartmentStatus}
                  onChange={(e) => {
                    setApartmentStatus(e.target.value as any);
                    if (modalError) setModalError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-purple-50/40 border border-purple-200 rounded-xl text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium cursor-pointer"
                >
                  <option value="">Selecione o status do imóvel...</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="desocupado">Desocupado</option>
                </select>
              </div>

              {/* Quantidade de Chaves */}
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-700" />
                  <span>Quantidade de Chaves *</span>
                </label>
                <select
                  value={keyCount}
                  onChange={(e) => {
                    setKeyCount(e.target.value as any);
                    if (modalError) setModalError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-purple-50/40 border border-purple-200 rounded-xl text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium cursor-pointer"
                >
                  <option value="">Selecione a quantidade de chaves...</option>
                  <option value="1 chave">1 chave</option>
                  <option value="2 chave">2 chave</option>
                  <option value="3 chave">3 chave</option>
                  <option value="4 chave">4 chave</option>
                  <option value="5 chave">5 chave</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setGenerationTarget(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmGeneration}
                className="flex-1 py-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-purple-200" />
                <span>Gerar e Abrir Planilha</span>
                <ArrowRight className="w-4 h-4 text-purple-300 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK FIX / REPAIRS SEARCH MODAL */}
      {showQuickFixSearchModal && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-amber-300 space-y-4">
            <div className="flex items-start justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 w-fit">
                  <Wrench className="w-3 h-3 text-amber-600" /> Reparos & Manutenção
                </span>
                <h3 className="text-xl font-extrabold text-purple-950 mt-1">
                  Consultar Reparos do Apartamento
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Digite o apartamento para ver, editar e salvar apenas os serviços pendentes.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowQuickFixSearchModal(false);
                  setQuickFixSearchId('');
                }}
                className="p-1.5 text-gray-400 hover:text-purple-900 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-purple-700" />
                  <span>Número do Apartamento</span>
                </label>
                <input
                  type="text"
                  value={quickFixSearchId}
                  onChange={(e) => setQuickFixSearchId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (hasInspectionForSearchedApt && searchedQuickFixApt) {
                        setSelectedAptId(searchedQuickFixApt.apartmentId);
                        setActiveView('quick-fix');
                        setShowQuickFixSearchModal(false);
                        setQuickFixSearchId('');
                      }
                    }
                  }}
                  placeholder="Ex: A001, B102, E205..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-sm font-bold text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 uppercase"
                />
              </div>

              {/* Status feedback for typed apartment */}
              {quickFixSearchId.trim() && (
                <div>
                  {!searchedQuickFixApt ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Apartamento "{quickFixSearchId}" não foi encontrado.</span>
                    </div>
                  ) : !hasInspectionForSearchedApt ? (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span>O Apartamento <strong>{searchedQuickFixApt.apartmentId}</strong> não possui vistoria gerada.</span>
                        <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                          O botão de reparos fica <strong>inativo</strong> até que seja gerada uma vistoria para este apartamento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Vistoria localizada para o Apartamento <strong>{searchedQuickFixApt.apartmentId}</strong> ({searchedQuickFixApt.status === 'finalizada' ? 'Finalizada' : 'Em andamento'}).
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Apartments with pending repairs quick chips */}
              {apartmentsWithRepairs.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-purple-900 block mb-1.5">
                    Apartamentos com vistoria e reparos pendentes:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-purple-50/40 rounded-xl border border-purple-100">
                    {apartmentsWithRepairs.map(apt => (
                      <button
                        key={apt.apartmentId}
                        type="button"
                        onClick={() => {
                          setSelectedAptId(apt.apartmentId);
                          setActiveView('quick-fix');
                          setShowQuickFixSearchModal(false);
                          setQuickFixSearchId('');
                        }}
                        className="text-xs font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>{apt.apartmentId}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-950 px-1 rounded-full font-black">
                          {apt.repairsCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowQuickFixSearchModal(false);
                  setQuickFixSearchId('');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasInspectionForSearchedApt && searchedQuickFixApt) {
                    setSelectedAptId(searchedQuickFixApt.apartmentId);
                    setActiveView('quick-fix');
                    setShowQuickFixSearchModal(false);
                    setQuickFixSearchId('');
                  }
                }}
                disabled={!hasInspectionForSearchedApt}
                className={`flex-1 py-3 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-1.5 ${
                  hasInspectionForSearchedApt
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={
                  !hasInspectionForSearchedApt
                    ? 'Apartamento sem vistoria. O botão está inativo.'
                    : 'Abrir reparos do apartamento'
                }
              >
                <Wrench className="w-4 h-4" />
                <span>Abrir e Editar Reparos</span>
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

