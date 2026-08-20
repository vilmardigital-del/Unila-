import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  FileText,
  Eye,
  PlusCircle,
  Trash2,
  RefreshCw,
  FileCheck,
  User,
  Home,
  Key,
  ArrowLeft,
  Wrench,
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { FinalizedInspection, BuildingBlock, InspectionItemState } from '../types';
import { loadFinalizedInspections, deleteFinalizedInspection } from '../utils/historyStorage';
import { exportSingleApartmentToCSV, exportFinalizedInspectionsListToCSV } from '../utils/excel';

interface InspectionHistoryProps {
  onSelectHistoricalInspection: (inspection: FinalizedInspection) => void;
  onCreateNewForApartment: (apartmentId: string) => void;
  onDeleteFinalizedInspection?: (apartmentId: string, inspectionId: string) => void;
  onBack?: () => void;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  onSelectHistoricalInspection,
  onCreateNewForApartment,
  onDeleteFinalizedInspection,
  onBack
}) => {
  const [historyList, setHistoryList] = useState<FinalizedInspection[]>([]);
  const [searchApt, setSearchApt] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; aptId: string; dateStr: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setHistoryList(loadFinalizedInspections());
  }, []);

  const handleDeleteClick = (id: string, aptId: string, dateStr: string) => {
    setDeleteTarget({ id, aptId, dateStr });
    setDeletePassword('');
    setPasswordError('');
  };

  const confirmDelete = () => {
    if (deletePassword !== '4526') {
      setPasswordError('Senha incorreta.');
      return;
    }
    if (deleteTarget) {
      const updated = deleteFinalizedInspection(deleteTarget.id);
      setHistoryList(updated);
      if (onDeleteFinalizedInspection) {
        onDeleteFinalizedInspection(deleteTarget.aptId, deleteTarget.id);
      }
      setDeleteTarget(null);
      setDeletePassword('');
      setPasswordError('');
    }
  };

  const toggleExpandCard = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getInspectionItems = (items?: Record<string, InspectionItemState>): InspectionItemState[] => {
    if (!items) return [];
    return Object.values(items);
  };

  const filteredList = useMemo(() => {
    return historyList.filter(item => {
      // 1. Filter by Apartment ID or Inspector
      if (searchApt.trim()) {
        const term = searchApt.trim().toLowerCase();
        const matchId = item.apartmentId.toLowerCase().includes(term);
        const matchInspector = (item.inspectorName || '').toLowerCase().includes(term);
        if (!matchId && !matchInspector) return false;
      }

      // 2. Filter by Date (YYYY-MM-DD)
      if (searchDate) {
        if (item.inspectionDate !== searchDate) return false;
      }

      return true;
    });
  }, [historyList, searchApt, searchDate]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border-b-4 border-purple-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/10 rounded-xl text-purple-200 backdrop-blur-xs">
                <History className="w-6 h-6" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Banco de Vistorias Finalizadas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-purple-200 mt-2 max-w-2xl leading-relaxed">
              Consulte as vistorias finalizadas filtrando por apartamento ou pela data da vistoria para verificar os serviços e manutenções realizados.
            </p>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md self-start sm:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-purple-800" />
              <span>Voltar para Início</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls: Apartment and Date Only */}
      <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. Apartment Filter */}
          <div className="relative">
            <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>Filtrar por Apartamento</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchApt}
                onChange={(e) => setSearchApt(e.target.value)}
                placeholder="Ex: A001, B105, E216..."
                className="w-full pl-9 pr-8 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium transition-all"
              />
              {searchApt && (
                <button
                  onClick={() => setSearchApt('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-purple-700 cursor-pointer"
                  title="Limpar pesquisa por apartamento"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Date Filter */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>Filtrar por Data da Vistoria</span>
              </label>
              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="text-[11px] text-purple-700 hover:text-purple-900 hover:underline font-semibold cursor-pointer"
                >
                  Limpar Data
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white font-medium transition-all"
              />
            </div>
          </div>

        </div>

        {/* Clear Filters Indicator */}
        {(searchApt || searchDate) && (
          <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              Filtro ativo: {searchApt ? `Apartamento "${searchApt}"` : ''} {searchApt && searchDate ? ' • ' : ''} {searchDate ? `Data ${searchDate.split('-').reverse().join('/')}` : ''}
            </span>
            <button
              onClick={() => {
                setSearchApt('');
                setSearchDate('');
              }}
              className="text-purple-700 hover:text-purple-900 font-semibold underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Results List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
          <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-700" />
            <span>
              {filteredList.length} Vistoria{filteredList.length === 1 ? '' : 's'} Finalizada{filteredList.length === 1 ? '' : 's'} Encontrada{filteredList.length === 1 ? '' : 's'}
              {searchApt ? ` para "${searchApt}"` : ''}
              {searchDate ? ` na data ${searchDate.split('-').reverse().join('/')}` : ''}
            </span>
          </h3>

          {filteredList.length > 0 && (
            <div className="flex items-center gap-2">
            </div>
          )}
        </div>

        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-purple-200 max-w-lg mx-auto my-6">
            <div className="w-12 h-12 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-purple-950 text-base">
              {historyList.length === 0 ? 'Nenhuma vistoria finalizada ainda' : 'Nenhuma vistoria encontrada'}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {historyList.length === 0
                ? 'Acesse a planilha de um apartamento e clique em "Finalizar Vistoria" para salvar a planilha permanentemente no banco de dados.'
                : 'Tente alterar os termos de pesquisa por apartamento ou data para visualizar os registros.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map((item) => {
              const formattedDate = item.finalizedAt
                ? new Date(item.finalizedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : `${item.inspectionDate} às ${item.inspectionTime}`;

              // Extract all items that have either a written observation or status = 'sim'
              const recordedServices = getInspectionItems(item.items).filter(
                it => (it.observation && it.observation.trim().length > 0) || it.status === 'sim'
              );

              const isExpanded = !!expandedCards[item.id];
              const visibleServices = isExpanded ? recordedServices : recordedServices.slice(0, 2);

              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-purple-200 hover:border-purple-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Apt Number & Date */}
                    <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-purple-950 tracking-wide">
                            Apt {item.apartmentId}
                          </span>
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-300">
                            Bloco {item.block}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {item.floor}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Finalizada</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata Box: Date, Inspector, Status, Keys */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-3 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-1.5 font-medium col-span-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Data: <strong className="text-gray-900">{formattedDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium col-span-2">
                        <User className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Vistoriador: <strong className="text-gray-900">{item.inspectorName || 'Não informado'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Home className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Status: </span>
                        {item.occupancyStatus ? (
                          <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wide ${
                            item.occupancyStatus === 'ocupado'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {item.occupancyStatus}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">N/I</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Key className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span>Chaves: <strong className="text-purple-950 font-semibold">{item.keyCount || 'N/I'}</strong></span>
                      </div>
                    </div>

                    {/* SECTION: SERVIÇOS E OBSERVAÇÕES ESCRITAS */}
                    <div className="border-t border-purple-100 pt-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-purple-700" />
                          <span>Serviços / Observações Anotadas</span>
                        </span>
                        <span className="text-[11px] font-semibold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
                          {recordedServices.length} {recordedServices.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>

                      {recordedServices.length === 0 ? (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Nenhum serviço ou reparo anotado (100% OK).</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {visibleServices.map((srv, idx) => {
                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-xl border text-xs transition-all ${
                                  srv.status === 'sim'
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                    : 'bg-purple-50/40 border-purple-200 text-gray-800'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <div className="font-bold text-gray-900">
                                    <span className="text-[10px] text-purple-700 uppercase tracking-wider block font-semibold">
                                      {srv.category}
                                    </span>
                                    {srv.name}
                                  </div>

                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                    srv.status === 'sim'
                                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  }`}>
                                    {srv.status === 'sim' ? 'SIM (Reparo)' : 'NÃO (OK)'}
                                  </span>
                                </div>

                                {srv.observation ? (
                                  <div className="bg-white/80 border border-purple-100 rounded-lg p-2 mt-1 text-gray-800 italic font-medium flex items-start gap-1.5">
                                    <MessageSquareText className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                    <span className="leading-tight">
                                      "{srv.observation}"
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-amber-800 italic block mt-0.5">
                                    Marcado para reparo sem texto adicional
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Toggle Expand / Collapse */}
                          {recordedServices.length > 2 && (
                            <button
                              onClick={() => toggleExpandCard(item.id)}
                              className="w-full py-1 px-2 text-center text-xs text-purple-700 hover:text-purple-900 font-bold bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border border-purple-200"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>Recolher serviços</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  <span>Ver todos os {recordedServices.length} serviços anotados</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectHistoricalInspection(item)}
                      className="flex-1 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200 cursor-pointer"
                      title="Visualizar a planilha arquivada desta vistoria (somente leitura)"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-700" />
                      <span>Ver Vistoria</span>
                    </button>

                    <button
                      onClick={() => onCreateNewForApartment(item.apartmentId)}
                      className="flex-1 px-3 py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="Gerar uma nova planilha zerada para nova vistoria deste apartamento"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                      <span>Nova Vistoria</span>
                    </button>

                    <button
                      onClick={() => handleDeleteClick(item.id, item.apartmentId, formattedDate)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                      title="Excluir este registro do banco de dados"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-purple-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-300 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Excluir Planilha de Vistoria
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Tem certeza que deseja excluir permanentemente a planilha do <strong>Apartamento {deleteTarget.aptId}</strong> ({deleteTarget.dateStr})?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="password"
                  placeholder="Senha de exclusão"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {passwordError && <p className="text-[10px] text-red-600 font-bold">{passwordError}</p>}
              </div>
              <button
                onClick={confirmDelete}
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
