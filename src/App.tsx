import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ApartmentCard } from './components/ApartmentCard';
import { ApartmentSpreadsheet } from './components/ApartmentSpreadsheet';
import { GeneralDashboard } from './components/GeneralDashboard';
import { InspectionHistory } from './components/InspectionHistory';
import { SearchAndGenerator } from './components/SearchAndGenerator';
import { ApartmentInspection, BuildingBlock, InspectionItemState, FinalizedInspection } from './types';
import { loadStoredApartments, saveApartmentsState } from './utils/storage';
import { createEmptyItemsMap } from './data/apartments';
import { Sparkles, Building2, Search, Zap, CheckCircle2, Trash2 } from 'lucide-react';

export default function App() {
  const [apartments, setApartments] = useState<ApartmentInspection[]>([]);
  const [activeView, setActiveView] = useState<'search' | 'dashboard' | 'spreadsheet' | 'history'>('search');
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [aptToDelete, setAptToDelete] = useState<string | null>(null);
  const [showGenerateFilteredModal, setShowGenerateFilteredModal] = useState<boolean>(false);
  const [inspectorName, setInspectorName] = useState<string>('');
  const [apartmentStatus, setApartmentStatus] = useState<string>('');
  const [keyCount, setKeyCount] = useState<string>('');

  // Temporary snapshot when viewing a historical finalized inspection
  const [historicalViewApt, setHistoricalViewApt] = useState<ApartmentInspection | null>(null);

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

  // Generate individual apartment sheet
  const handleGenerateSingle = (aptId: string) => {
    setHistoricalViewApt(null);
    setApartments(prev => {
      const next = prev.map(a => {
        if (a.apartmentId === aptId) {
          return { ...a, isGenerated: true, updatedAt: new Date().toISOString() };
        }
        return a;
      });
      saveApartmentsState(next);
      return next;
    });
    setSelectedAptId(aptId);
    setActiveView('spreadsheet');
  };

  // Start a fresh, new inspection for an apartment (e.g. for a new date)
  const handleStartNewInspectionForApartment = (aptId: string) => {
    setHistoricalViewApt(null);
    const newEmptyItems = createEmptyItemsMap();
    setApartments(prev => {
      const next = prev.map(a => {
        if (a.apartmentId === aptId) {
          return {
            ...a,
            isGenerated: true,
            status: 'rascunho' as const,
            updatedAt: new Date().toISOString(),
            finalizedAt: undefined,
            inspectorName: '',
            keyCount: undefined,
            items: newEmptyItems
          };
        }
        return a;
      });
      saveApartmentsState(next);
      return next;
    });
    setSelectedAptId(aptId);
    setActiveView('spreadsheet');
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
            keyCount: undefined,
            items: newEmptyItems
          };
        }
        return a;
      });
      saveApartmentsState(next);
      return next;
    });
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
      keyCount: historical.keyCount,
      items: historical.items,
      status: 'finalizada',
      finalizedAt: historical.finalizedAt
    };
    setHistoricalViewApt(historicalApt);
    setSelectedAptId(historical.apartmentId);
    setActiveView('spreadsheet');
  };

  // Batch generate all 144 apartment sheets
  const handleGenerateFiltered = (inspector: string, status: 'ocupado' | 'desocupado', keys: '1 chave' | '2 chave' | '3 chave' | '4 chave' | '5 chave') => {
    setApartments(prev => {
      const next = prev.map(a => {
        if (filteredApartments.some(fa => fa.apartmentId === a.apartmentId)) {
          return {
            ...a,
            isGenerated: true,
            inspectorName: inspector,
            occupancyStatus: status,
            keyCount: keys,
            updatedAt: a.updatedAt || new Date().toISOString()
          };
        }
        return a;
      });
      saveApartmentsState(next, { allGenerated: false, defaultInspector: inspector });
      return next;
    });
  };

  // Select apartment to open spreadsheet
  const handleSelectApartment = (aptId: string) => {
    setHistoricalViewApt(null);
    // Ensure marked generated when opened
    const target = apartments.find(a => a.apartmentId === aptId);
    if (target && !target.isGenerated) {
      handleGenerateSingle(aptId);
    } else {
      setSelectedAptId(aptId);
      setActiveView('spreadsheet');
    }
  };

  // Compute stats
  const totalApartments = apartments.length;
  const generatedCount = apartments.filter(a => a.isGenerated).length;

  let simCountTotal = 0;
  apartments.forEach(a => {
    if (a.items) {
      (Object.values(a.items) as InspectionItemState[]).forEach(item => {
        if (item.status === 'sim') simCountTotal++;
      });
    }
  });

  // Filter apartments list according to search term (Hide finalized ones from main screen)
  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => {
      // If the inspection is finalized, do not display it on the initial screen (only in Banco de Vistorias)
      if (apt.status === 'finalizada') {
        return false;
      }

      const term = searchTerm.trim().toLowerCase();

      // If user typed a search term, match apartment ID, inspector name or notes
      if (term.length > 0) {
        const matchId = apt.apartmentId.toLowerCase().includes(term);
        const matchInspector = (apt.inspectorName || '').toLowerCase().includes(term);
        // const matchNotes = (apt.generalNotes || '').toLowerCase().includes(term); // Removed
        return matchId || matchInspector; // Simplified
      }

      // By default: show generated sheets that are not finalized
      return apt.isGenerated;
    });
  }, [apartments, searchTerm]);

  const activeApartment = useMemo(() => {
    if (historicalViewApt) return historicalViewApt;
    if (!selectedAptId) return null;
    return apartments.find(a => a.apartmentId === selectedAptId) || null;
  }, [apartments, selectedAptId, historicalViewApt]);

  return (
    <div className="min-h-screen bg-purple-50/40 text-gray-900 flex flex-col font-sans selection:bg-purple-800 selection:text-white">
      
      {/* Top Unila Header (Hidden on spreadsheet view for a cleaner layout) */}
      {activeView !== 'spreadsheet' && (
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
              onGenerateFiltered={() => setShowGenerateFilteredModal(true)}
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
                        onGenerate={handleGenerateSingle}
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

      {/* Generation Modal for Filtered Apartments */}
      {showGenerateFilteredModal && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-purple-200 space-y-5">
            <h3 className="text-xl font-extrabold text-purple-950">Dados da Vistoria</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">Vistoriador / Responsável</label>
                <input type="text" value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} className="w-full p-3 border border-purple-200 rounded-xl" placeholder="Nome do vistoriador" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">Status do Apartamento</label>
                <select value={apartmentStatus} onChange={(e) => setApartmentStatus(e.target.value as any)} className="w-full p-3 border border-purple-200 rounded-xl">
                  <option value="">Selecione...</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="desocupado">Desocupado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">Quantidade de Chaves</label>
                <select value={keyCount} onChange={(e) => setKeyCount(e.target.value as any)} className="w-full p-3 border border-purple-200 rounded-xl">
                  <option value="">Selecione...</option>
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
                onClick={() => setShowGenerateFilteredModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (inspectorName && apartmentStatus && keyCount) {
                    handleGenerateFiltered(inspectorName, apartmentStatus as any, keyCount as any);
                    setShowGenerateFilteredModal(false);
                  } else {
                    alert("Por favor, preencha todos os campos.");
                  }
                }}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
