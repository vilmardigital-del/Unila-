import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ApartmentInspection, FinalizedInspection, InspectionItemState } from '../types';
import { MAINTENANCE_CATEGORIES } from '../data/categories';

/**
 * Generates and downloads a PDF of the apartment inspection matching the exact spreadsheet layout,
 * headers, metadata, categories, items, SIM/NÃO choices, observations, and signatures.
 */
export function exportApartmentToPDF(
  apartment: ApartmentInspection | FinalizedInspection,
  options?: { isHistorical?: boolean }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const isHistorical = options?.isHistorical || Boolean((apartment as any).finalizedAt && (apartment as any).inspectionDate);

  // Formatting date
  let dateFormatted: string;
  let timeFormatted: string = '';

  if ('inspectionDate' in apartment && apartment.inspectionDate) {
    const parts = apartment.inspectionDate.split('-');
    dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : apartment.inspectionDate;
    timeFormatted = apartment.inspectionTime || '';
  } else if ('updatedAt' in apartment && apartment.updatedAt) {
    const d = new Date(apartment.updatedAt);
    dateFormatted = d.toLocaleDateString('pt-BR');
    timeFormatted = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else {
    const d = new Date();
    dateFormatted = d.toLocaleDateString('pt-BR');
    timeFormatted = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const inspector = apartment.inspectorName || 'Técnico Não Informado';
  const occupancy = (apartment.occupancyStatus || 'Não informado').toUpperCase();
  const keyCount = apartment.keyCount || 'Não informado';
  const aptId = apartment.apartmentId;
  const block = apartment.block;
  const floor = apartment.floor;

  // Calculate items statistics
  let totalItems = 0;
  let simCount = 0;
  let naoCount = 0;
  let pendingCount = 0;
  const repairsList: string[] = [];
  const observationsList: string[] = [];

  MAINTENANCE_CATEGORIES.forEach(cat => {
    cat.items.forEach(itemName => {
      totalItems++;
      const key = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      const itemState = apartment.items ? apartment.items[key] : null;

      if (itemState?.status === 'sim') {
        simCount++;
        repairsList.push(`${itemName} (${cat.name})`);
      } else if (itemState?.status === 'nao') {
        naoCount++;
      } else {
        pendingCount++;
      }

      if (itemState?.observation && itemState.observation.trim()) {
        observationsList.push(`${itemName}: ${itemState.observation.trim()}`);
      }
    });
  });

  // --- HEADER SECTION (Purple theme matching UNILA application) ---
  // Top Banner background
  doc.setFillColor(59, 7, 100); // Dark Purple #3B0764 (bg-purple-950)
  doc.rect(10, 10, pageWidth - 20, 24, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('UNILA - PLANILHA DE VISTORIA E MANUTENÇÃO', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(233, 213, 255); // light purple
  doc.text('Relatório Oficial de Vistoria Predial e Reparos de Apartamentos', 14, 23);

  // Status Badge on Right Header
  const isFinalizedStatus = ('status' in apartment && apartment.status === 'finalizada') || isHistorical;
  const statusLabel = isFinalizedStatus ? 'VISTORIA FINALIZADA' : 'VISTORIA ATIVA';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setFillColor(88, 28, 135); // #581C87
  doc.roundedRect(pageWidth - 62, 14, 48, 7, 2, 2, 'F');
  doc.setTextColor(250, 204, 21); // Amber yellow
  doc.text(statusLabel, pageWidth - 38, 18.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Data: ${dateFormatted} ${timeFormatted ? `às ${timeFormatted}` : ''}`, pageWidth - 38, 27, { align: 'center' });

  // --- METADATA INFO BOX (Identical to spreadsheet top metadata) ---
  let currentY = 37;

  doc.setFillColor(245, 243, 255); // #F5F3FF (bg-purple-50)
  doc.setDrawColor(216, 180, 254); // #D8B4FE (border-purple-300)
  doc.setLineWidth(0.4);
  doc.roundedRect(10, currentY, pageWidth - 20, 24, 2, 2, 'FD');

  doc.setTextColor(59, 7, 100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  // Col 1: Apt and Block
  doc.text('APARTAMENTO:', 14, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(88, 28, 135);
  doc.text(`${aptId}`, 42, currentY + 6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`(Bloco ${block} • ${floor})`, 54, currentY + 6);

  // Col 2: Status
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 7, 100);
  doc.text('STATUS:', 110, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`${occupancy}`, 126, currentY + 6);

  // Col 3: Keys
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 7, 100);
  doc.text('CHAVES:', 160, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`${keyCount}`, 177, currentY + 6);

  // Row 2 of info box: Inspector & Stats
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 7, 100);
  doc.text('VISTORIADOR:', 14, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  doc.text(`${inspector}`, 40, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 7, 100);
  doc.text('PROGRESSO:', 110, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  const progPct = totalItems > 0 ? Math.round(((simCount + naoCount) / totalItems) * 100) : 0;
  doc.text(`${progPct}% (${simCount + naoCount}/${totalItems} respondidos)`, 134, currentY + 13);

  // Row 3 of info box: Summary of repairs
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('REPAROS (SIM):', 14, currentY + 19.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 24, 39);
  const repSummary = repairsList.length > 0 ? repairsList.join(', ') : 'Nenhum reparo apontado (Todos os itens OK)';
  const splitRepairs = doc.splitTextToSize(repSummary, pageWidth - 60);
  doc.text(splitRepairs[0], 42, currentY + 19.5);

  currentY += 27;

  // --- SPREADSHEET TABLE (Same structure as HTML table) ---
  const tableRows: any[] = [];
  let rowIdx = 0;

  MAINTENANCE_CATEGORIES.forEach(cat => {
    // Category Header Row
    let catSimCount = 0;
    let catNaoCount = 0;
    cat.items.forEach(item => {
      const k = `${cat.id}-${item.toLowerCase().replace(/\s+/g, '_')}`;
      if (apartment.items?.[k]?.status === 'sim') catSimCount++;
      if (apartment.items?.[k]?.status === 'nao') catNaoCount++;
    });

    const catBadge = catSimCount > 0 ? ` (${catSimCount} SIM / ${catNaoCount} OK)` : ` (${catNaoCount} OK)`;

    tableRows.push([
      {
        content: `CATEGORIA: ${cat.name.toUpperCase()}${catBadge}`,
        colSpan: 8,
        styles: {
          fillColor: [237, 233, 254], // #EDE9FE (bg-purple-100)
          textColor: [88, 28, 135], // #581C87
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 2.2
        }
      }
    ]);

    // Items for this category
    cat.items.forEach(itemName => {
      rowIdx++;
      const itemKey = `${cat.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      const itemState = apartment.items?.[itemKey];

      let statusDisplay = '-';
      let statusTextColor: [number, number, number] = [107, 114, 128]; // gray

      if (itemState?.status === 'sim') {
        statusDisplay = 'SIM (REPARO)';
        statusTextColor = [180, 83, 9]; // amber-700
      } else if (itemState?.status === 'nao') {
        statusDisplay = 'NÃO (OK)';
        statusTextColor = [4, 120, 87]; // emerald-700
      }

      const obsText = itemState?.observation ? itemState.observation.trim() : '-';

      tableRows.push([
        { content: String(rowIdx), styles: { halign: 'center', fontStyle: 'bold' } },
        { content: aptId, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: occupancy, styles: { halign: 'center', fontSize: 7 } },
        { content: keyCount, styles: { halign: 'center', fontSize: 7 } },
        { content: cat.name, styles: { fontStyle: 'bold' } },
        { content: itemName, styles: { fontStyle: 'bold', textColor: [17, 24, 39] } },
        {
          content: statusDisplay,
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            textColor: statusTextColor
          }
        },
        { content: obsText, styles: { fontStyle: itemState?.observation ? 'normal' : 'italic', textColor: itemState?.observation ? [17, 24, 39] : [156, 163, 175] } }
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        '#',
        'Nº Apt',
        'Status',
        'Chaves',
        'Categoria',
        'Item de Manutenção',
        'Reparo Realizado?',
        'Observação Registrada'
      ]
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [88, 28, 135], // Dark Purple #581C87
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' }, // #
      1: { cellWidth: 14, halign: 'center' }, // Nº Apt
      2: { cellWidth: 18, halign: 'center' }, // Status
      3: { cellWidth: 16, halign: 'center' }, // Chaves
      4: { cellWidth: 22 }, // Categoria
      5: { cellWidth: 36 }, // Item de Manutenção
      6: { cellWidth: 27, halign: 'center' }, // Reparo Realizado?
      7: { cellWidth: 'auto' } // Observação
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [253, 251, 255]
    },
    margin: { top: 12, left: 10, right: 10, bottom: 22 },
    didDrawPage: (data) => {
      // Footer with Page Numbers & Signatures if last page
      const totalPages = doc.getNumberOfPages();
      const currentPage = data.pageNumber;

      // Bottom Bar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `UNILA - Sistema de Vistorias Prediais • Apartamento ${aptId} (Bloco ${block}) • ${dateFormatted}`,
        10,
        pageHeight - 8
      );
      doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 10, pageHeight - 8, { align: 'right' });
    }
  });

  // Check if we have space on the final page for signatures, else add new page
  const finalY = (doc as any).lastAutoTable.finalY || currentY + 100;
  let sigY = finalY + 10;

  if (sigY + 28 > pageHeight - 15) {
    doc.addPage();
    sigY = 25;
  }

  // --- SIGNATURES SECTION ---
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.4);

  // Inspector Signature Line
  doc.line(16, sigY + 12, 90, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(59, 7, 100);
  doc.text('Assinatura do Vistoriador / Responsável', 53, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text(`${inspector}`, 53, sigY + 20, { align: 'center' });

  // Resident / Admin Signature Line
  doc.line(pageWidth - 90, sigY + 12, pageWidth - 16, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(59, 7, 100);
  doc.text('Assinatura do Morador / Recebedor', pageWidth - 53, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Condomínio UNILA', pageWidth - 53, sigY + 20, { align: 'center' });

  // Save the PDF file with a clean and clear filename
  const cleanDate = dateFormatted.replace(/\//g, '-');
  const filename = `Vistoria_UNILA_Apt_${aptId}_${cleanDate}.pdf`;
  doc.save(filename);
}
