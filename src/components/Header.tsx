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
    <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white shadow-md border-b-2 border-purple-500 print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1.5 rounded-lg text-purple-900 shadow-xs flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-sans">
                  UNILA
                </h1>
                <span className="bg-purple-700/90 text-purple-100 text-[10px] font-semibold px-2 py-0.2 rounded-full border border-purple-400">
                  Manutenção
                </span>
              </div>
              <p className="text-[11px] text-purple-200 leading-tight">
                Vistorias (Blocos A, B e E)
              </p>
            </div>
          </div>

          {/* Center / Right: Quick Stats & Navigation */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
            
            {/* Compact Quick Stats */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-purple-950/70 p-1 px-2.5 rounded-lg border border-purple-700/50 text-center">
              <div className="px-1.5">
                <div className="flex items-center justify-center text-purple-300 text-[10px] gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Total</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                  {totalApartments}
                </div>
              </div>

              <div className="px-1.5 border-x border-purple-700/50">
                <div className="flex items-center justify-center text-purple-300 text-[10px] gap-1">
                  <ClipboardList className="w-3 h-3" />
                  <span>Geradas</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-purple-200 leading-tight">
                  {generatedCount}
                </div>
              </div>

              <div className="px-1.5">
                <div className="flex items-center justify-center text-amber-300 text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Reparos</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-300 leading-tight">
                  {simCountTotal}
                </div>
              </div>
            </div>

            {/* Navigation Buttons: Compact tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveView('search')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'search' || activeView === 'quick-fix'
                    ? 'bg-white text-purple-950 font-bold shadow-xs'
                    : 'bg-purple-800/80 hover:bg-purple-700 text-purple-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Pesquisar</span>
              </button>

                <button
                  onClick={() => setActiveView('history')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'history'
                      ? 'bg-white text-purple-950 font-bold shadow-xs'
                      : 'bg-purple-800/80 hover:bg-purple-700 text-purple-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-300" />
                  <span>Banco de Vistorias</span>
                </button>

                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-white text-purple-950 font-bold shadow-xs'
                      : 'bg-purple-800/80 hover:bg-purple-700 text-purple-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Relatório Geral</span>
                </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
