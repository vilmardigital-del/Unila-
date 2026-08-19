import React, { useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Check,
  Building2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ApartmentInspection, InspectionItemState, MaintenanceChoice } from '../types';

interface QuickFixViewProps {
  apartmentId: string;
  apartments: ApartmentInspection[];
  onSaveApartment: (updated: ApartmentInspection) => void;
  onOpenSpreadsheet: (aptId: string) => void;
  onBack: () => void;
}

export const QuickFixView: React.FC<QuickFixViewProps> = ({
  apartmentId,
  apartments,
  onSaveApartment,
  onOpenSpreadsheet,
  onBack
}) => {
  const currentApt = useMemo(
    () => apartments.find(a => a.apartmentId.toUpperCase() === apartmentId.toUpperCase()),
    [apartmentId, apartments]
  );

  if (!currentApt) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Apartamento Não Encontrado</h2>
        <p className="text-sm text-gray-600">
          O apartamento <strong>{apartmentId}</strong> não foi encontrado no sistema.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900 text-white rounded-xl text-sm font-bold hover:bg-purple-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Pesquisa
        </button>
      </div>
    );
  }

  const itemsMap = currentApt.items || {};
  const allItems = Object.values(itemsMap) as InspectionItemState[];
  const isFinalized = currentApt.status === 'finalizada';

  // Repairs to be done: items with status === 'sim' or items that have observations
  const repairItems = allItems.filter(
    item => item.status === 'sim' || (item.observation && item.observation.trim().length > 0)
  );

  // Directly update SIM or NÃO in the apartment spreadsheet and save immediately
  const handleSetStatus = (itemId: string, newStatus: MaintenanceChoice) => {
    if (isFinalized) return;
    const item = itemsMap[itemId];
    if (!item) return;

    const updatedItems = {
      ...itemsMap,
      [itemId]: {
        ...item,
        status: newStatus
      }
    };

    const updatedApartment: ApartmentInspection = {
      ...currentApt,
      isGenerated: true,
      items: updatedItems,
      updatedAt: new Date().toISOString()
    };

    onSaveApartment(updatedApartment);
  };

  // Mark single service as done (NÃO) with direct confirmation
  const handleConfirmServiceDone = (itemId: string) => {
    if (isFinalized) return;
    handleSetStatus(itemId, 'nao');
  };

  // Count pending repairs
  const pendingRepairsCount = allItems.filter(i => i.status === 'sim').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Finalized Banner Warning if already finalized */}
      {isFinalized && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl border border-emerald-700 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Vistoria <strong>Finalizada (Apenas Visualização)</strong>: Esta planilha foi arquivada e não permite novas edições nesta data para evitar registros duplicados.
            </span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-purple-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl transition-colors cursor-pointer border border-purple-200"
            title="Voltar para Pesquisa"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-purple-900 text-white font-black text-sm px-3 py-0.5 rounded-lg shadow-xs">
                {currentApt.apartmentId}
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                Bloco {currentApt.block} • {currentApt.floor}
              </span>
              {isFinalized ? (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Finalizada (Visualização)
                </span>
              ) : pendingRepairsCount > 0 ? (
                <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {pendingRepairsCount} reparo{pendingRepairsCount > 1 ? 's' : ''} pendente{pendingRepairsCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Todos os reparos em dia
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-purple-950 mt-1 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-600" />
              <span>Reparos do Apartamento {currentApt.apartmentId}</span>
            </h1>
          </div>
        </div>

        {/* Action: Open full sheet or Back */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSpreadsheet(currentApt.apartmentId)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-purple-200 cursor-pointer"
            title="Abrir planilha completa"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-700" />
            <span>Ver Planilha Completa</span>
          </button>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Voltar
          </button>
        </div>
      </div>

      {/* Repairs List */}
      <div className="space-y-3">
        {repairItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-purple-100 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-purple-950">
              Nenhum reparo pendente para o Apartamento {currentApt.apartmentId}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Todos os itens deste apartamento estão marcados como em ordem (Não) ou ainda não foram identificadas pendências na vistoria.
            </p>
            <button
              onClick={() => onOpenSpreadsheet(currentApt.apartmentId)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-purple-900 text-white text-xs font-bold rounded-xl hover:bg-purple-800 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Abrir Planilha de Vistoria
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                Lista de Reparos e Observações a serem feitas
              </span>
              <span className="text-xs text-gray-500">
                Altere <strong>SIM</strong> ou <strong>NÃO</strong> para atualizar a planilha automaticamente
              </span>
            </div>

            {repairItems.map(item => {
              const isSim = item.status === 'sim';
              const isNao = item.status === 'nao';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSim
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-emerald-200 bg-emerald-50/10'
                  }`}
                >
                  {/* Item Description */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-purple-950">
                        {item.name}
                      </h4>
                      {isSim && (
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Reparo Pendente
                        </span>
                      )}
                      {isNao && (
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Serviço Feito
                        </span>
                      )}
                    </div>

                    {/* Observation text */}
                    {item.observation ? (
                      <p className="text-xs sm:text-sm text-gray-700 bg-white/80 p-2 rounded-lg border border-purple-100 mt-1.5">
                        <strong className="text-purple-950 font-semibold">Observação:</strong> {item.observation}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Sem observação textual detalhada.
                      </p>
                    )}
                  </div>

                  {/* Sim / Não Buttons (Directly Modifies Spreadsheet) */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <button
                      type="button"
                      disabled={isFinalized}
                      onClick={() => handleSetStatus(item.id, 'sim')}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                        isFinalized
                          ? 'opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 border border-gray-200'
                          : isSim
                          ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400 cursor-pointer'
                          : 'bg-gray-100 hover:bg-amber-50 text-gray-700 hover:text-amber-900 border border-gray-200 cursor-pointer'
                      }`}
                      title={isFinalized ? 'Vistoria finalizada no banco de dados (somente visualização)' : 'Marcar como SIM (Precisa de Reparo)'}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>SIM</span>
                    </button>

                    <button
                      type="button"
                      disabled={isFinalized}
                      onClick={() => handleConfirmServiceDone(item.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                        isFinalized
                          ? 'opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 border border-gray-200'
                          : isNao
                          ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400 cursor-pointer'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                      }`}
                      title={isFinalized ? 'Vistoria finalizada no banco de dados (somente visualização)' : 'Confirmar que o serviço já foi feito (Muda para NÃO na planilha)'}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isNao ? 'NÃO (Feito)' : 'Confirmar Feito (NÃO)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
