import React from 'react';
import {
  ClipboardList,
  Building2,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowLeft,
  RotateCcw,
  Cloud,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  totalApartments: number;
  generatedCount: number;
  simCountTotal: number;
  activeView: 'search' | 'dashboard' | 'spreadsheet' | 'history' | 'quick-fix';
  setActiveView: (view: 'search' | 'dashboard' | 'spreadsheet' | 'history' | 'quick-fix') => void;
  selectedAptId?: string | null;
  onOpenResetModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalApartments,
  generatedCount,
  simCountTotal,
  activeView,
  setActiveView,
  selectedAptId,
  onOpenResetModal,
}) => {
  const isInsideView = activeView !== 'search';

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-lg border-b-2 border-purple-500/80 print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        
        {/* ROW 1: BRANDING & QUICK ACTIONS (Mobile & Desktop) */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="bg-white p-1 rounded-xl shadow-sm flex items-center justify-center overflow-hidden w-8 h-8 sm:w-9 sm:h-9 shrink-0">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-sans">
                  UNILA
                </h1>
                <span className="bg-purple-700/80 text-purple-200 text-[10px] font-bold px-1.5 py-0.2 rounded-md border border-purple-400/40">
                  Vistorias
                </span>
                <span
                  className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40"
                  title="Sincronização em tempo real ativa na nuvem"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Cloud className="w-2.5 h-2.5" />
                  <span className="hidden xs:inline">Nuvem</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-purple-200/90 truncate leading-tight">
                {isInsideView && selectedAptId ? (
                  <span className="font-semibold text-amber-300">
                    Apt {selectedAptId} • {activeView === 'spreadsheet' ? 'Planilha' : 'Reparos'}
                  </span>
                ) : (
                  'Blocos A, B e E'
                )}
              </p>
            </div>
          </div>

          {/* Right: Top Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Contextual Back Button (shown when viewing spreadsheet, repairs, history, etc.) */}
            {isInsideView && (
              <button
                onClick={() => setActiveView('search')}
                className="h-9 sm:h-8 px-2.5 sm:px-3 bg-white text-purple-950 font-extrabold text-xs rounded-xl shadow-md hover:bg-purple-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-purple-200"
                title="Voltar para a tela inicial de pesquisa"
              >
                <ArrowLeft className="w-4 h-4 text-purple-700 stroke-[2.5]" />
                <span className="font-bold">Voltar</span>
              </button>
            )}

            {/* Desktop Quick Stats (hidden on mobile, shown in row 3 on mobile) */}
            <div className="hidden lg:grid grid-cols-3 gap-2 bg-purple-950/80 p-1 px-3 rounded-xl border border-purple-700/60 text-center">
              <div className="px-1.5">
                <div className="flex items-center justify-center text-purple-300 text-[10px] gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>Total</span>
                </div>
                <div className="text-xs font-bold text-white leading-tight">
                  {totalApartments}
                </div>
              </div>

              <div className="px-1.5 border-x border-purple-700/50">
                <div className="flex items-center justify-center text-purple-300 text-[10px] gap-1">
                  <ClipboardList className="w-3 h-3" />
                  <span>Geradas</span>
                </div>
                <div className="text-xs font-bold text-purple-200 leading-tight">
                  {generatedCount}
                </div>
              </div>

              <div className="px-1.5">
                <div className="flex items-center justify-center text-amber-300 text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Reparos</span>
                </div>
                <div className="text-xs font-bold text-amber-300 leading-tight">
                  {simCountTotal}
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setActiveView('search')}
                className={`h-9 px-3 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'search' || activeView === 'quick-fix'
                    ? 'bg-white text-purple-950 shadow-sm'
                    : 'bg-purple-800/60 hover:bg-purple-800 text-purple-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Pesquisar</span>
              </button>

              <button
                onClick={() => setActiveView('history')}
                className={`h-9 px-3 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'history'
                    ? 'bg-white text-purple-950 shadow-sm'
                    : 'bg-purple-800/60 hover:bg-purple-800 text-purple-100'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-300" />
                <span>Histórico</span>
              </button>

              <button
                onClick={() => setActiveView('dashboard')}
                className={`h-9 px-3 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-white text-purple-950 shadow-sm'
                    : 'bg-purple-800/60 hover:bg-purple-800 text-purple-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Relatório</span>
              </button>

              {onOpenResetModal && (
                <button
                  onClick={onOpenResetModal}
                  title="Zerar banco de dados"
                  className="h-9 px-2.5 text-xs font-bold rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700/60 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-300" />
                  <span>Zerar</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* ROW 2: MOBILE NAVIGATION SEGMENTED TABS (Optimized for Mobile Thumbs) */}
        <div className="md:hidden mt-2 pt-1 border-t border-purple-800/60">
          <nav className="grid grid-cols-4 gap-1 bg-purple-950/90 p-1 rounded-xl border border-purple-700/60">
            
            {/* Tab 1: Pesquisar */}
            <button
              onClick={() => setActiveView('search')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer min-h-[44px] ${
                activeView === 'search' || activeView === 'quick-fix'
                  ? 'bg-white text-purple-950 shadow-sm'
                  : 'text-purple-200 hover:text-white hover:bg-purple-800/40'
              }`}
            >
              <Building2 className={`w-4 h-4 mb-0.5 ${activeView === 'search' || activeView === 'quick-fix' ? 'text-purple-800' : 'text-purple-300'}`} />
              <span>Buscar</span>
            </button>

            {/* Tab 2: Histórico */}
            <button
              onClick={() => setActiveView('history')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer min-h-[44px] ${
                activeView === 'history'
                  ? 'bg-white text-purple-950 shadow-sm'
                  : 'text-purple-200 hover:text-white hover:bg-purple-800/40'
              }`}
            >
              <History className={`w-4 h-4 mb-0.5 ${activeView === 'history' ? 'text-purple-800' : 'text-amber-300'}`} />
              <span>Histórico</span>
            </button>

            {/* Tab 3: Relatório */}
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer min-h-[44px] ${
                activeView === 'dashboard'
                  ? 'bg-white text-purple-950 shadow-sm'
                  : 'text-purple-200 hover:text-white hover:bg-purple-800/40'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 mb-0.5 ${activeView === 'dashboard' ? 'text-purple-800' : 'text-emerald-400'}`} />
              <span>Relatório</span>
            </button>

            {/* Tab 4: Zerar Sistema */}
            <button
              onClick={onOpenResetModal}
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-extrabold text-red-300 hover:text-red-100 hover:bg-red-950/60 transition-all cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 mb-0.5 text-red-400" />
              <span>Zerar</span>
            </button>

          </nav>
        </div>

        {/* ROW 3: MOBILE COMPACT STATS SUMMARY (Single clean line) */}
        <div className="lg:hidden mt-1.5 flex items-center justify-between text-[11px] font-semibold text-purple-200/90 bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-800/40">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-purple-400" />
            <span>Total: <strong className="text-white">{totalApartments}</strong></span>
          </div>
          <span className="text-purple-600 font-bold">·</span>
          <div className="flex items-center gap-1">
            <ClipboardList className="w-3 h-3 text-purple-300" />
            <span>Geradas: <strong className="text-white">{generatedCount}</strong></span>
          </div>
          <span className="text-purple-600 font-bold">·</span>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Reparos: <strong className="text-amber-300 font-bold">{simCountTotal}</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
};
