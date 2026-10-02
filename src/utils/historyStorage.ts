import { FinalizedInspection } from '../types';
import { getDb } from '../lib/firebase';
import {
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  writeBatch
} from 'firebase/firestore';

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
      const colRef = collection(db, 'historico_vistorias');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const records: FinalizedInspection[] = [];
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (docSnap.id === 'lista' && Array.isArray(data?.records)) {
            // Legacy support
            records.push(...data.records);
          } else if (docSnap.id !== 'lista') {
            records.push(data as FinalizedInspection);
          }
        });

        // Deduplicate and sort by finalizedAt descending
        const uniqueMap = new Map<string, FinalizedInspection>();
        records.forEach(r => uniqueMap.set(r.id, r));
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
          return new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime();
        });

        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sorted));
        return sorted;
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

    const colRef = collection(db, 'historico_vistorias');
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const records: FinalizedInspection[] = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (docSnap.id === 'lista' && Array.isArray(data?.records)) {
          records.push(...data.records);
        } else if (docSnap.id !== 'lista') {
          records.push(data as FinalizedInspection);
        }
      });

      const uniqueMap = new Map<string, FinalizedInspection>();
      records.forEach(r => uniqueMap.set(r.id, r));
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        return new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime();
      });

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sorted));
      onUpdate(sorted);
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

    // Save to Firestore in its own document
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'historico_vistorias', inspection.id);
      setDoc(docRef, inspection, { merge: true }).catch(err => {
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
      const docRef = doc(db, 'historico_vistorias', id);
      deleteDoc(docRef).catch(err => {
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
      const snap = await getDocs(collection(db, 'historico_vistorias'));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (err) {
    console.error('Erro ao limpar histórico do Firestore:', err);
  }
}
