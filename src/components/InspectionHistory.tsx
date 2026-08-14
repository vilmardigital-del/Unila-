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
  Eye,
  PlusCircle,
  Trash2,
  RefreshCw,
  FileCheck,
  User
} from 'lucide-react';
import { FinalizedInspection, BuildingBlock } from '../types';
import { loadFinalizedInspections, deleteFinalizedInspection } from '../utils/historyStorage';
import { exportSingleApartmentToCSV } from '../utils/excel';

interface InspectionHistoryProps {
  onSelectHistoricalInspection: (inspection: FinalizedInspection) => void;
  onCreateNewForApartment: (apartmentId: string) => void;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({
  onSelectHistoricalInspection,
  onCreateNewForApartment
}) => {
  const [historyList, setHistoryList] = useState<FinalizedInspection[]>([]);
  const [searchApt, setSearchApt] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<BuildingBlock | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WITH_SIM' | 'ALL_OK'>('ALL');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; aptId: string; dateStr: string } | null>(null);

  useEffect(() => {
    setHistoryList(loadFinalizedInspections());
  }, []);

  const handleDeleteClick = (id: string, aptId: string, dateStr: string) => {
    setDeleteTarget({ id, aptId, dateStr });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      const updated = deleteFinalizedInspection(deleteTarget.id);
      setHistoryList(updated);
      setDeleteTarget(null);
    }
  };

  const filteredList = useMemo(() => {
    return historyList.filter(item => {
      // Search by Apartment ID or Inspector
      if (searchApt.trim()) {
        const term = searchApt.trim().toLowerCase();
        const matchId = item.apartmentId.toLowerCase().includes(term);
        const matchInspector = (item.inspectorName || '').toLowerCase().includes(term);
        if (!matchId && !matchInspector) return false;
      }

      // Search by Date (YYYY-MM-DD)
      if (searchDate) {
        if (item.inspectionDate !== searchDate) return false;
      }

      // Block filter
      if (selectedBlock !== 'ALL' && item.block !== selectedBlock) return false;

      // Status filter
      if (statusFilter === 'WITH_SIM' && item.simCount === 0) return false;
      if (statusFilter === 'ALL_OK' && item.simCount > 0) return false;

      return true;
    });
  }, [historyList, searchApt, searchDate, selectedBlock, statusFilter]);

  const totalFinalized = historyList.length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md border-b-4 border-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
              Consulte, pesquise e imprima todas as planilhas de vistoria que foram finalizadas no sistema. Você pode pesquisar por data, número do apartamento ou criar novas vistorias para qualquer apartamento.
            </p>
          </div>

          <div className="bg-purple-950/70 border border-purple-600/50 rounded-xl p-3 sm:px-5 sm:py-3 text-center self-start md:self-auto min-w-[160px]">
            <span className="text-xs text-purple-300 font-semibold block uppercase tracking-wider">
              Total Armazenadas
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {totalFinalized}
            </span>
            <span className="text-[10px] text-purple-300 block">no banco de dados</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4">
          
          {/* Apt Search */}
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-bold text-purple-900 mb-1">
              Número do Apartamento / Vistoriador
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
                className="w-full pl-9 pr-8 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              />
              {searchApt && (
                <button
                  onClick={() => setSearchApt('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-purple-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center justify-between">
              <span>Data da Vistoria</span>
              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="text-[11px] text-purple-700 hover:underline font-normal"
                >
                  Limpar Data
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              />
            </div>
          </div>

          {/* Block Selector */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-purple-900 mb-1">
              Bloco
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value as any)}
              className="w-full py-2 px-3 bg-purple-50/50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              <option value="ALL">Todos os Blocos</option>
              <option value="A">Bloco A</option>
              <option value="B">Bloco B</option>
              <option value="E">Bloco E</option>
            </select>
          </div>

        </div>

        {/* Quick Status Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100 text-xs">
          <span className="text-gray-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-purple-600" /> Filtrar Status:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-full border transition-all ${
              statusFilter === 'ALL'
                ? 'bg-purple-900 text-white border-purple-900 font-bold'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todas as Vistorias ({historyList.length})
          </button>

          <button
            onClick={() => setStatusFilter('WITH_SIM')}
            className={`px-3 py-1 rounded-full border transition-all ${
              statusFilter === 'WITH_SIM'
                ? 'bg-amber-600 text-white border-amber-600 font-bold'
                : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Com Reparos SIM
          </button>

          <button
            onClick={() => setStatusFilter('ALL_OK')}
            className={`px-3 py-1 rounded-full border transition-all ${
              statusFilter === 'ALL_OK'
                ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Sem Reparos (Tudo OK)
          </button>

          {(searchApt || searchDate || selectedBlock !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchApt('');
                setSearchDate('');
                setSelectedBlock('ALL');
                setStatusFilter('ALL');
              }}
              className="ml-auto text-purple-700 hover:text-purple-900 font-semibold underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Limpar Filtros de Pesquisa
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-700" />
            <span>
              {filteredList.length} Vistoria{filteredList.length === 1 ? '' : 's'} Finalizada{filteredList.length === 1 ? '' : 's'} Encontrada{filteredList.length === 1 ? '' : 's'}
              {searchApt ? ` para "${searchApt}"` : ''}
              {searchDate ? ` na data ${searchDate.split('-').reverse().join('/')}` : ''}
            </span>
          </h3>
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
                : 'Tente alterar os termos de pesquisa ou limpar os filtros para visualizar os registros.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                    {/* Date & Inspector info */}
                    <div className="space-y-1.5 text-xs text-gray-700 mb-4 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-700" />
                        <span>Data: <strong className="text-gray-900">{formattedDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <User className="w-3.5 h-3.5 text-purple-700" />
                        <span>Vistoriador: <strong className="text-gray-900">{item.inspectorName || 'Não informado'}</strong></span>
                      </div>
                    </div>

                    {/* Items Summary Badges */}
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                      <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                        item.simCount > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {item.simCount} SIM (Reparo)
                      </span>

                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        {item.naoCount} NÃO (OK)
                      </span>
                    </div>

                    {item.generalNotes && (
                      <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-200 mb-4 line-clamp-2">
                        "{item.generalNotes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectHistoricalInspection(item)}
                      className="flex-1 px-3 py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Planilha</span>
                    </button>

                    <button
                      onClick={() => onCreateNewForApartment(item.apartmentId)}
                      className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors border border-purple-200"
                      title="Criar nova planilha de vistoria para o mesmo apartamento com outra data"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-purple-700" />
                      <span>Nova Vistoria</span>
                    </button>

                    <button
                      onClick={() => handleDeleteClick(item.id, item.apartmentId, formattedDate)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
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
