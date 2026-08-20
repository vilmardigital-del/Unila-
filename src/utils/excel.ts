import { ApartmentInspection, FinalizedInspection, InspectionItemState } from '../types';
import { MAINTENANCE_CATEGORIES } from '../data/categories';

/**
 * Helper to extract repairs list and observations list from apartment items
 */
function extractRepairsAndObservations(items?: Record<string, InspectionItemState>) {
  if (!items) return { repairsList: 'Nenhum', observationsList: 'Nenhuma' };

  const repairs: string[] = [];
  const observations: string[] = [];

  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      const key = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      const itemState = items[key];

      if (itemState) {
        if (itemState.status === 'sim') {
          repairs.push(`${cat.name} (${itemName})`);
        }
        if (itemState.observation && itemState.observation.trim()) {
          observations.push(`${itemName}: ${itemState.observation.trim()}`);
        }
      }
    });
  });

  return {
    repairsList: repairs.length > 0 ? repairs.join(' | ') : 'Nenhum reparo necessário',
    observationsList: observations.length > 0 ? observations.join(' | ') : 'Nenhuma observação informada'
  };
}

/**
 * Export single apartment inspection to CSV with unified line layout:
 * - Número do apartamento, Status, Chaves, Reparos realizados e Observações selecionadas
 */
export function exportSingleApartmentToCSV(apartment: ApartmentInspection) {
  const BOM = '\uFEFF'; // Byte Order Mark for UTF-8 Excel compatibility
  const dateStr = apartment.updatedAt 
    ? new Date(apartment.updatedAt).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const { repairsList, observationsList } = extractRepairsAndObservations(apartment.items);

  let csvContent = `UNILA - PLANILHA DE VISTORIA E MANUTENÇÃO\n\n`;

  // Resumo em linha única conforme solicitado
  csvContent += `RESUMO GERAL EM LINHA:\n`;
  csvContent += `NÚMERO DO APARTAMENTO;STATUS;CHAVES;DATA;VISTORIADOR;REPAROS REALIZADOS (SIM);OBSERVAÇÕES SELECIONADAS\n`;
  csvContent += `"${apartment.apartmentId}";"${(apartment.occupancyStatus || 'Não informado').toUpperCase()}";"${apartment.keyCount || 'Não informado'}";"${dateStr}";"${apartment.inspectorName || 'Não informado'}";"${repairsList.replace(/;/g, ',')}";"${observationsList.replace(/;/g, ',')}"\n\n`;

  // Itens detalhados em linha
  csvContent += `DETALHAMENTO DE ITENS DA VISTORIA:\n`;
  csvContent += `NÚMERO DO APARTAMENTO;STATUS;CHAVES;CATEGORIA;REPARO REALIZADO (ITEM);OPÇÃO (SIM / NÃO);OBSERVAÇÃO SELECIONADA\n`;

  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      const itemKey = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      const itemState = apartment.items ? apartment.items[itemKey] : null;

      let statusLabel = 'PENDENTE';
      if (itemState?.status === 'sim') statusLabel = 'SIM (REPARO)';
      if (itemState?.status === 'nao') statusLabel = 'NÃO (OK)';

      const obs = (itemState?.observation || '').replace(/;/g, ',').replace(/\n/g, ' ');
      csvContent += `"${apartment.apartmentId}";"${(apartment.occupancyStatus || 'Não informado').toUpperCase()}";"${apartment.keyCount || 'Não informado'}";"${cat.name}";"${itemName}";"${statusLabel}";"${obs}"\n`;
    });
  });

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Vistoria_Apt_${apartment.apartmentId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export history / finalized inspections list to CSV in unified line format
 */
export function exportFinalizedInspectionsListToCSV(inspections: FinalizedInspection[]) {
  const BOM = '\uFEFF';
  let csvContent = `UNILA - BANCO DE VISTORIAS FINALIZADAS\n`;
  csvContent += `Data de Exportação:;${new Date().toLocaleString('pt-BR')}\n`;
  csvContent += `Total de Registros:;${inspections.length}\n\n`;

  csvContent += `NÚMERO DO APARTAMENTO;STATUS;CHAVES;DATA VISTORIA;VISTORIADOR;REPAROS REALIZADOS (SIM);OBSERVAÇÕES SELECIONADAS\n`;

  inspections.forEach(item => {
    const { repairsList, observationsList } = extractRepairsAndObservations(item.items);
    const dateFormatted = item.inspectionDate ? item.inspectionDate.split('-').reverse().join('/') : item.finalizedAt?.slice(0, 10);

    csvContent += `"${item.apartmentId}";"${(item.occupancyStatus || 'Não informado').toUpperCase()}";"${item.keyCount || 'Não informado'}";"${dateFormatted}";"${item.inspectorName || 'Não informado'}";"${repairsList.replace(/;/g, ',')}";"${observationsList.replace(/;/g, ',')}"\n`;
  });

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Banco_Vistorias_UNILA_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export all apartments summary to CSV
 */
export function exportAllApartmentsSummaryToCSV(apartments: ApartmentInspection[]) {
  const BOM = '\uFEFF';
  let csvContent = `RELATÓRIO GERAL DE VISTORIAS DE MANUTENÇÃO - UNILA\n`;
  csvContent += `Data do Relatório:;${new Date().toLocaleString('pt-BR')}\n`;
  csvContent += `Total de Apartamentos:;${apartments.length}\n\n`;

  csvContent += `NÚMERO DO APARTAMENTO;STATUS;CHAVES;DATA VISTORIA;VISTORIADOR;TOTAL REPAROS (SIM);REPAROS REALIZADOS;OBSERVAÇÕES SELECIONADAS\n`;

  apartments.forEach(apt => {
    const { repairsList, observationsList } = extractRepairsAndObservations(apt.items);
    const dateFormatted = apt.updatedAt ? new Date(apt.updatedAt).toLocaleDateString('pt-BR') : '-';

    let countSim = 0;
    if (apt.items) {
      Object.values(apt.items).forEach(item => {
        if (item.status === 'sim') countSim++;
      });
    }

    csvContent += `"${apt.apartmentId}";"${(apt.occupancyStatus || 'Não informado').toUpperCase()}";"${apt.keyCount || 'Não informado'}";"${dateFormatted}";"${apt.inspectorName || 'Não informado'}";"${countSim}";"${repairsList.replace(/;/g, ',')}";"${observationsList.replace(/;/g, ',')}"\n`;
  });

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Relatorio_Geral_Unila_Vistorias_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

