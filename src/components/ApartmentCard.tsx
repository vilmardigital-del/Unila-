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
  onFinalizeInspection?: (aptId: string) => void;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onSelect,
  onGenerate,
  onOpenRepairs,
  onDelete,
  onFinalizeInspection,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
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
      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
        {isFinalized ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <button
              onClick={() => onSelect(apartment.apartmentId)}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-200" />
              <span>Ver Planilha Finalizada</span>
              <ArrowRight className="w-4 h-4 ml-auto text-purple-300" />
            </button>
            <button
              onClick={() => onGenerate(apartment.apartmentId)}
              className="min-h-[44px] py-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 border border-purple-300 active:scale-95 cursor-pointer"
              title="Gerar nova planilha"
            >
              <PlusCircle className="w-4 h-4 text-purple-700" />
              <span>Gerar Nova</span>
            </button>
          </div>
        ) : apartment.isGenerated ? (
          <div className="space-y-2 w-full">
            
            {/* Primary Row: Abrir Planilha + Excluir */}
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => onSelect(apartment.apartmentId)}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-purple-900 hover:bg-purple-800 active:bg-purple-950 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-300" />
                  <span>Abrir Planilha</span>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-300" />
              </button>

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(apartment.apartmentId);
                  }}
                  className="w-11 h-11 shrink-0 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors border border-purple-200/80 cursor-pointer"
                  title="Excluir / Resetar esta planilha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Secondary Action Row: Reparos or Finalizar */}
            {countSim > 0 && onOpenRepairs && (
              <button
                onClick={() => onOpenRepairs(apartment.apartmentId)}
                className="w-full min-h-[42px] py-2 px-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs active:scale-95"
                title="Ver e editar apenas os reparos e observações deste apartamento"
              >
                <Wrench className="w-4 h-4 text-amber-100" />
                <span>Confirmar Reparos ({countSim} pendente{countSim > 1 ? 's' : ''})</span>
              </button>
            )}

            {countSim === 0 && onFinalizeInspection && !showPassword && (
              <button
                className="w-full min-h-[42px] py-2 px-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs active:scale-95"
                onClick={() => setShowPassword(true)}
              >
                <CheckCircle className="w-4 h-4 text-emerald-100" />
                <span>Finalizar Vistoria (Sem Reparos)</span>
              </button>
            )}

            {showPassword && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <input
                  type="password"
                  autoFocus
                  className="flex-1 h-9 px-2.5 border border-emerald-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Senha de segurança"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="h-9 px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                  onClick={() => {
                    if (password === '4526') {
                      onFinalizeInspection?.(apartment.apartmentId);
                      setShowPassword(false);
                      setPassword('');
                      setPasswordError(false);
                    } else {
                      setPasswordError(true);
                      setPassword('');
                    }
                  }}
                >
                  Confirmar
                </button>
                <button
                  className="h-9 px-2.5 text-gray-500 hover:text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setShowPassword(false);
                    setPassword('');
                    setPasswordError(false);
                  }}
                >
                  Cancelar
                </button>
                {passwordError && <span className="text-red-600 text-xs font-bold">Incorreta!</span>}
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <button
              onClick={() => onGenerate(apartment.apartmentId)}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-purple-900 hover:bg-purple-800 active:bg-purple-950 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Gerar Planilha de Vistoria</span>
            </button>

            {onOpenRepairs && (
              <button
                onClick={() => onOpenRepairs(apartment.apartmentId)}
                className="min-h-[44px] py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
                title="Adicionar ou ver reparos para este apartamento"
              >
                <Wrench className="w-4 h-4 text-amber-700" />
                <span>Reparos</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
