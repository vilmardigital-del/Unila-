import React from 'react';
import { Search, Plus, Filter, Zap, RefreshCw, X } from 'lucide-react';
import { BuildingBlock } from '../types';

interface SearchAndGeneratorProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onGenerateAll: () => void;
  generatedCount: number;
  totalApartments: number;
}

export const SearchAndGenerator: React.FC<SearchAndGeneratorProps> = ({
  searchTerm,
  setSearchTerm,
  onGenerateAll,
  generatedCount,
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
            Digite o número do apartamento para pesquisar ou gere as planilhas para todos os apartamentos.
          </p>
        </div>

        {/* Generate All Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGenerateAll}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Gerar Planilhas dos 144 Apartamentos</span>
          </button>
        </div>
      </div>

      {/* Search Bar Input */}
      <div className="mt-4 relative">
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
    </div>
  );
};
