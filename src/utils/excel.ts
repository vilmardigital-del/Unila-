import { ApartmentInspection } from '../types';
import { MAINTENANCE_CATEGORIES } from '../data/categories';

export function exportSingleApartmentToCSV(apartment: ApartmentInspection) {
  const BOM = '\uFEFF'; // Byte Order Mark for Excel UTF-8 compatibility
  let csvContent = `APARTAMENTO ${apartment.apartmentId}\n\n`;

  csvContent += `CATEGORIA;ITEM DE MANUTENÇÃO;OPÇÃO (SIM / NÃO);OBSERVAÇÃO\n`;

  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      const itemKey = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      const itemState = apartment.items[itemKey];

      let statusLabel = '';
      if (itemState?.status === 'sim') statusLabel = 'SIM';
      if (itemState?.status === 'nao') statusLabel = 'NÃO';

      const obs = (itemState?.observation || '').replace(/;/g, ',');
      csvContent += `"${cat.name}";"${itemName}";"${statusLabel}";"${obs}"\n`;
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

export function exportAllApartmentsSummaryToCSV(apartments: ApartmentInspection[]) {
  const BOM = '\uFEFF';
  let csvContent = `RELATÓRIO GERAL DE VISTORIAS DE MANUTENÇÃO - UNILA\n`;
  csvContent += `Data do Relatório:;${new Date().toLocaleString('pt-BR')}\n`;
  csvContent += `Total de Apartamentos:;${apartments.length}\n\n`;

  // Dynamic headers
  let header = `APARTAMENTO;BLOCO;ANDAR;VISTORIADOR;DATA VISTORIA;STATUS GERAL;ITENS 'SIM' (REPARO);ITENS 'NÃO' (OK);PENDENTES`;

  // Add columns for each maintenance item
  const allItemKeys: { key: string; name: string; cat: string }[] = [];
  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      const key = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      allItemKeys.push({ key, name: `${cat.name} - ${itemName}`, cat: cat.name });
      header += `;${cat.name} - ${itemName} (Status);${cat.name} - ${itemName} (Obs)`;
    });
  });
  csvContent += `${header}\n`;

  apartments.forEach(apt => {
    let countSim = 0;
    let countNao = 0;
    let countPendente = 0;

    Object.values(apt.items).forEach(item => {
      if (item.status === 'sim') countSim++;
      else if (item.status === 'nao') countNao++;
      else countPendente++;
    });

    let statusGeral = 'Não Gerado';
    if (apt.isGenerated) {
      if (countPendente === 0) statusGeral = countSim > 0 ? 'Concluído c/ Reparos' : '100% OK';
      else if (countSim > 0 || countNao > 0) statusGeral = 'Em Andamento';
      else statusGeral = 'Aguardando Vistoria';
    }

    let row = `"${apt.apartmentId}";"${apt.block}";"${apt.floor}";"${apt.inspectorName || ''}";"${apt.updatedAt ? new Date(apt.updatedAt).toLocaleDateString('pt-BR') : ''}";"${statusGeral}";"${countSim}";"${countNao}";"${countPendente}"`;

    allItemKeys.forEach(itemMeta => {
      const itemState = apt.items[itemMeta.key];
      let statusStr = '-';
      if (itemState?.status === 'sim') statusStr = 'SIM';
      if (itemState?.status === 'nao') statusStr = 'NÃO';
      const obsStr = (itemState?.observation || '').replace(/;/g, ',');
      row += `;"${statusStr}";"${obsStr}"`;
    });

    csvContent += `${row}\n`;
  });

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Relatorio_Geral_Unila_Vistorias_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
