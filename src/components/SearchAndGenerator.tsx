import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchAndGeneratorProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredCount?: number;
}

export const SearchAndGenerator: React.FC<SearchAndGeneratorProps> = ({
  searchTerm,
  setSearchTerm,
  filteredCount = 0,
}) => {
  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-5 shadow-sm mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-700 stroke-[2.5]" />
            <span>Pesquisar Apartamento</span>
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {searchTerm 
              ? `Apartamento "${searchTerm.toUpperCase()}" localizado (${filteredCount} resultado${filteredCount === 1 ? '' : 's'}).`
              : "Digite o número (ex: A001, B102, E205) para consultar, abrir planilha ou ver reparos."}
          </p>
        </div>

        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar apto (ex: A001, B102, E205)..."
            className="w-full min-h-[46px] pl-10 pr-10 py-2.5 bg-purple-50/60 border border-purple-200 rounded-xl text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-bold uppercase shadow-2xs"
            autoFocus
          />
          {searchTerm.length > 0 && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-900 transition-colors cursor-pointer"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
