import { FinalizedInspection } from '../types';
import { getDb } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const HISTORY_STORAGE_KEY = 'unila_vistorias_finalizadas_v1';

export function loadFinalizedInspections(): FinalizedInspection[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao carregar histórico local de vistorias:', err);
    return [];
  }
}

export async function loadFinalizedInspectionsAsync(): Promise<FinalizedInspection[]> {
  try {
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'historico_vistorias', 'lista');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const records = (data?.records || []) as FinalizedInspection[];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
        return records;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar histórico do Firestore:', err);
  }
  return loadFinalizedInspections();
}

export function subscribeToHistory(onUpdate: (records: FinalizedInspection[]) => void): () => void {
  try {
    const db = getDb();
    if (!db) return () => {};
    const docRef = doc(db, 'historico_vistorias', 'lista');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const records = (data?.records || []) as FinalizedInspection[];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
        onUpdate(records);
      } else {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
        onUpdate([]);
      }
    }, (error) => {
      console.warn('Subscription error on history:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Could not setup history subscription:', err);
    return () => {};
  }
}

export function saveFinalizedInspection(inspection: FinalizedInspection): FinalizedInspection[] {
  try {
    const currentList = loadFinalizedInspections();
    const index = currentList.findIndex(item => item.id === inspection.id);
    let updatedList: FinalizedInspection[];
    
    if (index >= 0) {
      updatedList = [...currentList];
      updatedList[index] = { ...inspection, id: currentList[index].id };
    } else {
      updatedList = [inspection, ...currentList];
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedList));

    // Save to Firestore asynchronously
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'historico_vistorias', 'lista');
      setDoc(docRef, {
        records: updatedList,
        updatedAt: new Date().toISOString()
      }).catch(err => {
        console.error('Erro ao sincronizar histórico com Firestore:', err);
      });
    }

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

    // Update in Firestore
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'historico_vistorias', 'lista');
      setDoc(docRef, {
        records: updatedList,
        updatedAt: new Date().toISOString()
      }).catch(err => {
        console.error('Erro ao remover do Firestore:', err);
      });
    }

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

export async function clearAllHistory(): Promise<void> {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  try {
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'historico_vistorias', 'lista');
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.error('Erro ao limpar histórico do Firestore:', err);
  }
}
