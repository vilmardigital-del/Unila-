import { FinalizedInspection } from '../types';

const HISTORY_STORAGE_KEY = 'unila_vistorias_finalizadas_v1';

export function loadFinalizedInspections(): FinalizedInspection[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao carregar histórico de vistorias:', err);
    return [];
  }
}

export function saveFinalizedInspection(inspection: FinalizedInspection): FinalizedInspection[] {
  try {
    const currentList = loadFinalizedInspections();
    // Check if updating existing record by id OR by (apartmentId + inspectionDate) to avoid duplicate dates
    const index = currentList.findIndex(
      item =>
        item.id === inspection.id ||
        (item.apartmentId.toUpperCase() === inspection.apartmentId.toUpperCase() &&
          item.inspectionDate === inspection.inspectionDate)
    );
    let updatedList: FinalizedInspection[];
    
    if (index >= 0) {
      updatedList = [...currentList];
      updatedList[index] = { ...inspection, id: currentList[index].id };
    } else {
      updatedList = [inspection, ...currentList]; // newest first
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    console.error('Erro ao salvar vistoria finalizada no histórico:', err);
    return [];
  }
}

export function deleteFinalizedInspection(id: string): FinalizedInspection[] {
  try {
    const currentList = loadFinalizedInspections();
    const updatedList = currentList.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    console.error('Erro ao excluir vistoria finalizada:', err);
    return [];
  }
}

export function getFinalizedInspectionsByApartment(apartmentId: string): FinalizedInspection[] {
  const all = loadFinalizedInspections();
  return all.filter(item => item.apartmentId.toUpperCase() === apartmentId.toUpperCase());
}
