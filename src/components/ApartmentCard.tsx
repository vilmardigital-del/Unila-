import React from 'react';
import { FileSpreadsheet, CheckCircle, AlertTriangle, Clock, ArrowRight, PlusCircle, Trash2 } from 'lucide-react';
import { ApartmentInspection, InspectionItemState } from '../types';

interface ApartmentCardProps {
  apartment: ApartmentInspection;
  onSelect: (aptId: string) => void;
  onGenerate: (aptId: string) => void;
  onDelete?: (aptId: string) => void;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onSelect,
  onGenerate,
  onDelete
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

  return (
    <div className={`rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between min-w-[280px] ${
      apartment.isGenerated
        ? 'bg-white border-purple-200 hover:border-purple-500 hover:shadow-md'
        : 'bg-purple-50/40 border-dashed border-purple-200/80 hover:bg-purple-50 hover:border-purple-300'
    }`}>
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-purple-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
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
          {apartment.isGenerated ? (
            countSim > 0 ? (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {countSim} Reparo{countSim > 1 ? 's' : ''} (Sim)
              </span>
            ) : isComplete ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                100% OK
              </span>
            ) : hasStarted ? (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-purple-300">
                <Clock className="w-3 h-3 text-purple-600" />
                Em Andamento
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                Aguardando
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              Oculta / Não Gerada
            </span>
          )}
        </div>

        {/* Inspection Stats */}
        {apartment.isGenerated && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 text-center">
              <span className="text-[10px] text-purple-700 font-medium block">Sim (Precisa)</span>
              <span className={`font-bold text-sm ${countSim > 0 ? 'text-amber-700' : 'text-gray-600'}`}>
                {countSim}
              </span>
            </div>
            <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-medium block">Não (Em Ordem)</span>
              <span className="font-bold text-sm text-emerald-800">
                {countNao}
              </span>
            </div>
          </div>
        )}

        {/* Inspector or Updated date */}
        {apartment.isGenerated && (apartment.inspectorName || apartment.updatedAt) && (
          <div className="mt-2 text-[11px] text-gray-500 flex flex-col gap-0.5">
            {apartment.inspectorName && (
              <span className="truncate">Vistoriador: <strong className="text-gray-700">{apartment.inspectorName}</strong></span>
            )}
            {apartment.updatedAt && (
              <span>Atualizado: {new Date(apartment.updatedAt).toLocaleDateString('pt-BR')}</span>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-2 border-t border-gray-100">
        {apartment.isGenerated ? (
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={() => onSelect(apartment.apartmentId)}
              className="flex-1 py-2 px-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-200" />
              <span>Abrir Planilha</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-purple-300" />
            </button>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(apartment.apartmentId);
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-purple-200 cursor-pointer"
                title="Excluir / Resetar esta planilha"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onGenerate(apartment.apartmentId)}
            className="w-full py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-purple-300 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-purple-700" />
            <span>Gerar Planilha</span>
          </button>
        )}
      </div>
    </div>
  );
};
