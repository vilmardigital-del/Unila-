import React from 'react';
import { Search, Plus, Filter, Zap, RefreshCw, X } from 'lucide-react';
import { BuildingBlock } from '../types';

interface SearchAndGeneratorProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onGenerateFiltered: () => void;
  filteredCount: number;
  totalApartments: number;
}

export const SearchAndGenerator: React.FC<SearchAndGeneratorProps> = ({
  searchTerm,
  setSearchTerm,
  onGenerateFiltered,
  filteredCount,
  totalApartments
}) => {
  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-purple-950 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-700" />
            <span>Pesquisar e Gerar Planilhas de Vistoria</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {searchTerm 
              ? `Gerando planilhas para o(s) ${filteredCount} apartamento(s) encontrado(s).`
              : "Digite o número do apartamento para pesquisar ou gere as planilhas para todos os apartamentos."}
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o número do apartamento (ex: A001, B105, E216, 105...)"
              className="w-full pl-10 pr-9 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={onGenerateFiltered}
            disabled={!searchTerm}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 ${searchTerm ? 'bg-purple-700 hover:bg-purple-800' : 'bg-gray-300 cursor-not-allowed'} text-white font-bold rounded-xl text-sm transition-colors shadow-md`}
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>{searchTerm ? `Gerar Planilha(s) (${filteredCount})` : 'Pesquise um apartamento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
