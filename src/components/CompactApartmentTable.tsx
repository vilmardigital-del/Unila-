import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ApartmentInspection } from '../types';

interface CompactTableProps {
  apartments: ApartmentInspection[];
  onSelectApartment: (aptId: string) => void;
}

export const CompactApartmentTable: React.FC<CompactTableProps> = ({ apartments, onSelectApartment }) => {
  // Filter only generated apartments
  const generatedApartments = apartments.filter(apt => apt.isGenerated);

  return (
    <div className="bg-white border border-purple-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-purple-100">
        <h3 className="text-base font-bold text-purple-950">Planilhas Geradas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-purple-900 text-white font-bold text-xs uppercase">
              <th className="py-2 px-3">Apt</th>
              <th className="py-2 px-3">Bloco</th>
              <th className="py-2 px-3">Ocupação</th>
              <th className="py-2 px-3">Chaves</th>
              <th className="py-2 px-3">Observações</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100">
            {generatedApartments.slice(0, 10).map((apt) => (
              <tr key={apt.apartmentId} className="hover:bg-purple-50/60">
                <td className="py-2 px-3 font-black text-purple-950">{apt.apartmentId}</td>
                <td className="py-2 px-3 font-bold text-gray-800">Bloco {apt.block}</td>
                <td className="py-2 px-3 capitalize">{apt.occupancyStatus || 'N/A'}</td>
                <td className="py-2 px-3">{apt.keyCount || 'N/A'}</td>
                <td className="py-2 px-3 truncate max-w-[100px]">{apt.generalObservation || '-'}</td>
                <td className="py-2 px-3">{apt.status === 'finalizada' ? 'Finalizada' : 'Ativa'}</td>
                <td className="py-2 px-3 text-right">
                  <button onClick={() => onSelectApartment(apt.apartmentId)} className="py-1 px-2 bg-purple-900 text-white font-bold rounded-lg text-[10px]">
                    <ArrowRight className="w-3 h-3" />
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
