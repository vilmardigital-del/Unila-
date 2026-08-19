import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Building2,
  CheckCircle2,
  BarChart3,
  Search,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { ApartmentInspection, InspectionItemState } from '../types';
import { MAINTENANCE_CATEGORIES } from '../data/categories';
import { exportAllApartmentsSummaryToCSV } from '../utils/excel';

interface GeneralDashboardProps {
  apartments: ApartmentInspection[];
  onSelectApartment: (aptId: string) => void;
  onGenerateAll?: () => void;
}

export const GeneralDashboard: React.FC<GeneralDashboardProps> = ({
  apartments,
  onSelectApartment
}) => {
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'A' | 'B' | 'E'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate global metrics
  const totalApartments = apartments.length;
  let generatedCount = 0;
  let apartmentsWithSim = 0;
  let totalSimItems = 0;
  let totalNaoItems = 0;

  // Item issues frequency counter
  const itemIssueCounts: Record<string, { name: string; category: string; count: number }> = {};

  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      const itemKey = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      itemIssueCounts[itemKey] = {
        name: itemName,
        category: cat.name,
        count: 0
      };
    });
  });

  apartments.forEach(apt => {
    if (apt.isGenerated && apt.status !== 'finalizada') {
      generatedCount++;

      let aptHasSim = false;
      (Object.entries(apt.items || {}) as [string, InspectionItemState][]).forEach(([itemKey, itemState]) => {
        if (itemState.status === 'sim') {
          aptHasSim = true;
          totalSimItems++;
          if (itemIssueCounts[itemKey]) {
            itemIssueCounts[itemKey].count++;
          }
        } else if (itemState.status === 'nao') {
          totalNaoItems++;
        }
      });

      if (aptHasSim) apartmentsWithSim++;
    }
  });

  // Top issues sorted
  const sortedIssues = Object.values(itemIssueCounts)
    .sort((a, b) => b.count - a.count)
    .filter(issue => issue.count > 0);

  // Filtered list for table
  const filteredList = apartments.filter(apt => {
    if (apt.status === 'finalizada') return false;
    if (blockFilter !== 'ALL' && apt.block !== blockFilter) return false;
    if (searchTerm) {
      const matchId = apt.apartmentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchInspector = (apt.inspectorName || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchId && !matchInspector) return false;
    }
    return apt.isGenerated;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md border-b-4 border-purple-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-700 text-purple-100 text-xs font-bold px-2.5 py-0.5 rounded-md">
                SISTEMA UNILA
              </span>
              <span className="text-purple-200 text-xs">Visão Geral do Complexo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white">
              Painel Geral de Manutenção
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 mt-1">
              Acompanhamento consolidado dos Blocos A, B e E (144 apartamentos).
            </p>
          </div>

          <button
            onClick={() => exportAllApartmentsSummaryToCSV(apartments)}
            className="px-4 py-3 bg-white text-purple-900 hover:bg-purple-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-98"
          >
            <Download className="w-4 h-4 text-purple-700" />
            <span>Baixar Planilha Completa Excel (.csv)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Aps */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Apartamentos</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-950 mt-2">{totalApartments}</div>
          <span className="text-xs text-gray-500 mt-1 block">
            Blocos A (48), B (48) e E (48)
          </span>
        </div>

        {/* Card 2: Generated Sheets */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Planilhas Ativas</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-950 mt-2">{generatedCount}</div>
          <span className="text-xs text-gray-500 mt-1 block">
            {Math.round((generatedCount / totalApartments) * 100)}% das planilhas geradas
          </span>
        </div>

        {/* Card 3: ApsNeeding Repair */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Com Reparo ("Sim")</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">{apartmentsWithSim}</div>
          <span className="text-xs text-amber-800 mt-1 block font-medium">
            {totalSimItems} serviços marcados com SIM
          </span>
        </div>

        {/* Card 4: Total OK Items */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Itens em Ordem ("Não")</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-800 mt-2">{totalNaoItems}</div>
          <span className="text-xs text-emerald-800 mt-1 block font-medium">
            Aprovados nas vistorias
          </span>
        </div>

      </div>

      {/* Top Issues Ranking */}
      {sortedIssues.length > 0 && (
        <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-700" />
            <span>Serviços com Maior Incidência de Reparos (Marcação "SIM")</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sortedIssues.slice(0, 6).map((issue) => (
              <div
                key={issue.name}
                className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] text-purple-700 font-bold uppercase block">{issue.category}</span>
                  <span className="text-xs font-extrabold text-gray-900">{issue.name}</span>
                </div>
                <span className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                  {issue.count} ap{issue.count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Table of Apartments */}
      <div className="bg-white border border-purple-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-purple-950">
              Tabela de Controle Unila (144 Apartamentos)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Clique em qualquer apartamento para abrir e preencher sua planilha individual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-purple-950"
            >
              <option value="ALL">Todos Blocos</option>
              <option value="A">Bloco A</option>
              <option value="B">Bloco B</option>
              <option value="E">Bloco E</option>
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-purple-900 text-white font-bold text-xs uppercase">
                <th className="py-3 px-4">Apt</th>
                <th className="py-3 px-4">Bloco</th>
                <th className="py-3 px-4">Andar</th>
                <th className="py-3 px-4">Status Planilha</th>
                <th className="py-3 px-4 text-center">Itens "SIM" (Reparo)</th>
                <th className="py-3 px-4 text-center">Itens "NÃO" (OK)</th>
                <th className="py-3 px-4">Vistoriador</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 bg-white">
              {filteredList.map((apt) => {
                let simCount = 0;
                let naoCount = 0;
                (Object.values(apt.items || {}) as InspectionItemState[]).forEach(item => {
                  if (item.status === 'sim') simCount++;
                  if (item.status === 'nao') naoCount++;
                });

                return (
                  <tr key={apt.apartmentId} className="hover:bg-purple-50/60 transition-colors">
                    <td className="py-3 px-4 font-black text-purple-950">
                      {apt.apartmentId}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">
                      Bloco {apt.block}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {apt.floor}
                    </td>
                    <td className="py-3 px-4">
                      {apt.isGenerated ? (
                        simCount > 0 ? (
                          <span className="bg-amber-100 text-amber-900 font-bold text-[11px] px-2 py-0.5 rounded-full border border-amber-300">
                            Com Reparos
                          </span>
                        ) : (simCount + naoCount) === 21 ? (
                          <span className="bg-emerald-100 text-emerald-900 font-bold text-[11px] px-2 py-0.5 rounded-full border border-emerald-300">
                            Concluído OK
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-900 font-bold text-[11px] px-2 py-0.5 rounded-full border border-purple-300">
                            Ativa
                          </span>
                        )
                      ) : (
                        <span className="bg-gray-100 text-gray-500 font-medium text-[11px] px-2 py-0.5 rounded-full">
                          Oculta
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-700">
                      {simCount > 0 ? simCount : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {naoCount > 0 ? naoCount : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-xs truncate max-w-[150px]">
                      {apt.inspectorName || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectApartment(apt.apartmentId)}
                        className="py-1 px-3 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Abrir Planilha</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
