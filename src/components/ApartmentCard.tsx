import React from 'react';
import { FileSpreadsheet, CheckCircle, AlertTriangle, Clock, ArrowRight, PlusCircle, Trash2, User, Key, Home, Calendar, Wrench } from 'lucide-react';
import { ApartmentInspection, InspectionItemState } from '../types';

interface ApartmentCardProps {
  apartment: ApartmentInspection;
  onSelect: (aptId: string) => void;
  onGenerate: (aptId: string) => void;
  onOpenRepairs?: (aptId: string) => void;
  onDelete?: (aptId: string) => void;
  onNewInspection?: (aptId: string) => void;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onSelect,
  onGenerate,
  onOpenRepairs,
  onDelete,
}) => {
  let countSim = 0;
  let countNao = 0;
  let totalItems = 0;

  if (apartment.items) {
    (Object.values(apartment.items) as InspectionItemState[]).forEach(item => {
      totalItems++;
      if (item.status === 'sim') countSim++;
      if (item.status === 'nao') countNao++;
    });
  }

  const isComplete = (countSim + countNao) === totalItems && totalItems > 0;
  const hasStarted = (countSim + countNao) > 0;
  const isFinalized = apartment.status === 'finalizada';

  return (
    <div className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between min-w-[280px] shadow-xs ${
      isFinalized
        ? 'bg-white border-emerald-300 hover:border-emerald-500 hover:shadow-md'
        : apartment.isGenerated
        ? 'bg-white border-purple-200 hover:border-purple-500 hover:shadow-md'
        : 'bg-purple-50/40 border-dashed border-purple-200/80 hover:bg-purple-50 hover:border-purple-300'
    }`}>
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className={`w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-xs ${
              isFinalized ? 'bg-emerald-800' : 'bg-purple-900'
            }`}>
              {apartment.apartmentId}
            </span>
            <div>
              <span className="text-xs font-bold text-purple-900 block">
                Bloco {apartment.block}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {apartment.floor}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {isFinalized ? (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Finalizada
            </span>
          ) : apartment.isGenerated ? (
            countSim > 0 ? (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {countSim} Reparo{countSim > 1 ? 's' : ''} (Sim)
              </span>
            ) : isComplete ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                100% OK
              </span>
            ) : hasStarted ? (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-purple-300">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Em Andamento
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200">
                Aguardando
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200">
              Não Gerada
            </span>
          )}
        </div>

        {/* Inspection Stats */}
        {apartment.isGenerated && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 text-center">
              <span className="text-[10px] text-purple-700 font-bold block">Sim (Precisa de Reparo)</span>
              <span className={`font-black text-base ${countSim > 0 ? 'text-amber-700' : 'text-gray-600'}`}>
                {countSim}
              </span>
            </div>
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block">Não (Em Ordem)</span>
              <span className="font-black text-base text-emerald-800">
                {countNao}
              </span>
            </div>
          </div>
        )}

        {/* Apartment Metadata */}
        {apartment.isGenerated && (
          <div className="mt-3 space-y-1.5 bg-purple-50/40 p-2.5 rounded-xl border border-purple-100/80 text-[11px]">
            {/* Vistoriador */}
            <div className="flex items-center gap-1.5 text-gray-700">
              <User className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="truncate">
                Vistoriador: <strong className="text-purple-950 font-semibold">{apartment.inspectorName || 'Não informado'}</strong>
              </span>
            </div>

            {/* Status do Apartamento */}
            <div className="flex items-center gap-1.5 text-gray-700">
              <Home className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>Status: </span>
              {apartment.occupancyStatus ? (
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                  apartment.occupancyStatus === 'ocupado'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {apartment.occupancyStatus}
                </span>
              ) : (
                <span className="text-gray-500 italic">Não informado</span>
              )}
            </div>

            {/* Quantidade de Chaves */}
            <div className="flex items-center gap-1.5 text-gray-700">
              <Key className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>Chaves: </span>
              <strong className="text-purple-950 font-semibold">
                {apartment.keyCount || 'Não informado'}
              </strong>
            </div>

            {/* Data / Hora */}
            {(apartment.finalizedAt || apartment.updatedAt) && (
              <div className="flex items-center gap-1.5 text-gray-500 pt-1 border-t border-purple-100/60 text-[10px]">
                <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                {apartment.finalizedAt ? (
                  <span>Finalizado: {new Date(apartment.finalizedAt).toLocaleDateString('pt-BR')} às {new Date(apartment.finalizedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                ) : (
                  <span>Atualizado: {new Date(apartment.updatedAt!).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {isFinalized ? (
          <div className="flex items-center gap-1.5 w-full flex-wrap sm:flex-nowrap">
            <button
              onClick={() => onSelect(apartment.apartmentId)}
              className="flex-1 py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-purple-200 cursor-pointer"
              title="Visualizar a vistoria arquivada no histórico"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-700" />
              <span>Ver Vistoria</span>
            </button>

            <button
              onClick={() => onGenerate(apartment.apartmentId)}
              className="flex-1 py-2 px-3 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Criar nova planilha para nova vistoria deste apartamento"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Nova Vistoria</span>
            </button>
          </div>
        ) : apartment.isGenerated ? (
          <div className="flex items-center gap-1.5 w-full">
            {onOpenRepairs && (
              <button
                onClick={() => onOpenRepairs(apartment.apartmentId)}
                className={`py-2 px-2.5 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                  countSim > 0
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}
                title="Ver e editar apenas os reparos e observações deste apartamento"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Reparos</span>
              </button>
            )}

            <button
              onClick={() => onSelect(apartment.apartmentId)}
              className="flex-1 py-2 px-3 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-200" />
              <span>Planilha</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-purple-300" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(apartment.apartmentId);
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-purple-200 cursor-pointer"
                title="Excluir / Resetar esta planilha"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 w-full">
            {onOpenRepairs && (
              <button
                onClick={() => onOpenRepairs(apartment.apartmentId)}
                className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 border border-amber-200 cursor-pointer"
                title="Adicionar ou ver reparos para este apartamento"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Reparos</span>
              </button>
            )}

            <button
              onClick={() => onGenerate(apartment.apartmentId)}
              className="flex-1 py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-purple-300 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-700" />
              <span>Gerar Planilha</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
