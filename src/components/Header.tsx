import React from 'react';
import { ClipboardList, Building2, CheckCircle2, AlertTriangle, FileSpreadsheet, History } from 'lucide-react';

interface HeaderProps {
  totalApartments: number;
  generatedCount: number;
  simCountTotal: number;
  activeView: 'search' | 'dashboard' | 'spreadsheet' | 'history' | 'quick-fix';
  setActiveView: (view: 'search' | 'dashboard' | 'spreadsheet' | 'history' | 'quick-fix') => void;
  selectedAptId?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  totalApartments,
  generatedCount,
  simCountTotal,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white shadow-lg border-b-4 border-purple-500 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl text-purple-900 shadow-md flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
                  UNILA
                </h1>
                <span className="bg-purple-700 text-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-400">
                  Manutenção
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                Planilha e Controle de Vistorias (Blocos A, B e E)
              </p>
            </div>
          </div>

          {/* Top Quick Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-purple-950/60 p-2.5 rounded-lg border border-purple-700/50 text-center">
            <div className="px-2">
              <div className="flex items-center justify-center text-purple-300 text-xs gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Total Aps</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                {totalApartments}
              </div>
            </div>

            <div className="px-2 border-x border-purple-700/50">
              <div className="flex items-center justify-center text-purple-300 text-xs gap-1">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Geradas</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-purple-200 mt-0.5">
                {generatedCount}
              </div>
            </div>

            <div className="px-2">
              <div className="flex items-center justify-center text-amber-300 text-xs gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Reparos (Sim)</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                {simCountTotal}
              </div>
            </div>
          </div>

          {/* Navigation Buttons: Pesquisa, Banco de Vistoria, Relatório Geral */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveView('search')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'search' || activeView === 'quick-fix' || activeView === 'spreadsheet'
                  ? 'bg-white text-purple-900 font-bold shadow'
                  : 'bg-purple-800/80 hover:bg-purple-700 text-purple-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Pesquisar</span>
            </button>

            <button
              onClick={() => setActiveView('history')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'history'
                  ? 'bg-white text-purple-900 font-bold shadow'
                  : 'bg-purple-800/80 hover:bg-purple-700 text-purple-100'
              }`}
            >
              <History className="w-4 h-4 text-amber-300" />
              <span>Banco de Vistorias</span>
            </button>

            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-purple-900 font-bold shadow'
                  : 'bg-purple-800/80 hover:bg-purple-700 text-purple-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Relatório Geral</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
