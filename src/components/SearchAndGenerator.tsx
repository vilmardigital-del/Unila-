import React from 'react';
import { Search, PlusCircle, X, Wrench } from 'lucide-react';

interface SearchAndGeneratorProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onGenerateFiltered: () => void;
  onOpenQuickFixSearch: (term?: string) => void;
  filteredCount: number;
  totalApartments: number;
}

export const SearchAndGenerator: React.FC<SearchAndGeneratorProps> = ({
  searchTerm,
  setSearchTerm,
  onGenerateFiltered,
  onOpenQuickFixSearch,
  filteredCount,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        onOpenQuickFixSearch(searchTerm);
      }
    }
  };

  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-purple-950 flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-700" />
            <span>Pesquisar e Vistoria</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {searchTerm 
              ? `Apartamento "${searchTerm.toUpperCase()}" localizado (${filteredCount} resultado${filteredCount === 1 ? '' : 's'}).`
              : "Digite o número do apartamento (ex: A001, B102, E205) para consultar reparos ou gerar vistoria."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar Input */}
          <div className="relative flex-1 min-w-[240px] sm:min-w-[300px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o apartamento (ex: A001)..."
              className="w-full pl-10 pr-9 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-sm text-purple-950 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium uppercase"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-700 cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Reparos Button */}
          <button
            onClick={() => onOpenQuickFixSearch(searchTerm)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm cursor-pointer shrink-0"
            title="Abrir reparos deste apartamento para alterar SIM ou NÃO"
          >
            <Wrench className="w-4 h-4" />
            <span>Reparos</span>
          </button>
          
          {/* Gerar Planilha Button */}
          <button
            onClick={onGenerateFiltered}
            disabled={filteredCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
              filteredCount > 0
                ? 'bg-purple-900 hover:bg-purple-800 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="Configurar e gerar planilha"
          >
            <PlusCircle className="w-4 h-4 text-purple-200" />
            <span>Gerar Planilha</span>
          </button>
        </div>
      </div>
    </div>
  );
};
