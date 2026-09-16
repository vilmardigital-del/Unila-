import React from 'react';
import { ArrowRight, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { ApartmentInspection } from '../types';

interface CompactTableProps {
  apartments: ApartmentInspection[];
  onSelectApartment: (id: string) => void;
}

export const CompactApartmentTable: React.FC<CompactTableProps> = ({ apartments, onSelectApartment }) => {
  // Filter only generated apartments
  const generatedApartments = apartments.filter(apt => apt.isGenerated);

  if (generatedApartments.length === 0) {
    return (
      <div className="bg-white border border-purple-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-purple-950 mb-1">Nenhuma Planilha Gerada no Momento</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Digite o número do apartamento acima (ex: A001, B102, E205) para localizar e gerar a planilha de vistoria. Qualquer planilha gerada em qualquer dispositivo aparecerá aqui em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-purple-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-purple-700" />
          <h3 className="text-base font-bold text-purple-950">Planilhas Geradas em Andamento</h3>
        </div>
        <span className="bg-purple-100 text-purple-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
          {generatedApartments.length} {generatedApartments.length === 1 ? 'apartamento' : 'apartamentos'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-purple-900 text-white font-bold text-xs uppercase">
              <th className="py-2.5 px-3">Apt</th>
              <th className="py-2.5 px-3">Bloco</th>
              <th className="py-2.5 px-3">Responsável</th>
              <th className="py-2.5 px-3">Ocupação</th>
              <th className="py-2.5 px-3">Chaves</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100">
            {generatedApartments.map((apt) => (
              <tr key={apt.apartmentId} className="hover:bg-purple-50/60 transition-colors">
                <td className="py-2.5 px-3 font-black text-purple-950 text-sm">{apt.apartmentId}</td>
                <td className="py-2.5 px-3 font-bold text-gray-800">Bloco {apt.block}</td>
                <td className="py-2.5 px-3 text-gray-700 font-medium">{apt.inspectorName || 'Não informado'}</td>
                <td className="py-2.5 px-3 capitalize">{apt.occupancyStatus || 'N/A'}</td>
                <td className="py-2.5 px-3">{apt.keyCount || 'N/A'}</td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    apt.status === 'finalizada'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-purple-100 text-purple-800 border border-purple-300'
                  }`}>
                    {apt.status === 'finalizada' ? 'Finalizada' : 'Ativa / Em Andamento'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onSelectApartment(apt.apartmentId)}
                    className="py-1.5 px-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 ml-auto shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Abrir Planilha</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
