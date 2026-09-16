import { ApartmentInspection } from '../types';
import { generateAllApartments, createEmptyItemsMap } from '../data/apartments';
import { loadFinalizedInspections, clearAllHistory } from './historyStorage';
import { getDb } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'unila_vistorias_v1';
const SETTINGS_KEY = 'unila_settings_v1';

export interface AppSettings {
  allGenerated: boolean;
  defaultInspector: string;
}

export async function loadStoredApartments(): Promise<{ apartments: ApartmentInspection[]; settings: AppSettings }> {
  try {
    const baseApartments = generateAllApartments();
    let savedMap: Record<string, Partial<ApartmentInspection>> = {};
    let settings: AppSettings = {
      allGenerated: false,
      defaultInspector: ''
    };

    // 1. Attempt to load from shared Firestore database
    const db = getDb();
    if (db) {
      try {
        const docRef = doc(db, 'vistorias_sistema', 'estado_atual');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          savedMap = data.apartments || {};
          settings = data.settings || settings;
          // Cache in local storage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMap));
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
      } catch (err) {
        console.warn('Erro ao consultar Firestore (usando cache local):', err);
      }
    }

    // 2. If no data found in Firestore, fallback to local storage
    if (Object.keys(savedMap).length === 0) {
      const rawData = localStorage.getItem(STORAGE_KEY);
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawData) {
        try {
          savedMap = JSON.parse(rawData);
        } catch {
          savedMap = {};
        }
      }
      if (rawSettings) {
        try {
          settings = { ...settings, ...JSON.parse(rawSettings) };
        } catch {
          // ignore
        }
      }
    }

    // Check finalized inspections
    const finalizedHistory = loadFinalizedInspections();
    const finalizedIds = new Set(finalizedHistory.map(h => h.apartmentId));

    // Merge saved inspection states into default structure
    const mergedApartments = baseApartments.map(baseApt => {
      const saved = savedMap[baseApt.apartmentId];
      if (!saved) return baseApt;

      if (saved.status === 'finalizada' && !finalizedIds.has(baseApt.apartmentId)) {
        return baseApt;
      }

      const baseItems = createEmptyItemsMap();
      if (saved.items) {
        Object.keys(baseItems).forEach(itemKey => {
          if (saved.items && saved.items[itemKey]) {
            baseItems[itemKey] = {
              ...baseItems[itemKey],
              ...saved.items[itemKey]
            };
          }
        });
      }

      const isActuallyGenerated = saved.status === 'finalizada' ? false : (saved.isGenerated ?? false);

      return {
        ...baseApt,
        ...saved,
        isGenerated: isActuallyGenerated,
        items: baseItems
      };
    });

    return { apartments: mergedApartments, settings };
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    return {
      apartments: generateAllApartments(),
      settings: { allGenerated: false, defaultInspector: '' }
    };
  }
}

export function subscribeToApartmentsState(
  onUpdate: (data: { apartments: ApartmentInspection[]; settings: AppSettings }) => void
): () => void {
  try {
    const db = getDb();
    if (!db) return () => {};
    const docRef = doc(db, 'vistorias_sistema', 'estado_atual');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const savedMap: Record<string, Partial<ApartmentInspection>> = data.apartments || {};
        const settings: AppSettings = data.settings || { allGenerated: false, defaultInspector: '' };
        
        // Cache to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMap));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        const baseApartments = generateAllApartments();
        const finalizedHistory = loadFinalizedInspections();
        const finalizedIds = new Set(finalizedHistory.map(h => h.apartmentId));

        const mergedApartments = baseApartments.map(baseApt => {
          const saved = savedMap[baseApt.apartmentId];
          if (!saved) return baseApt;

          if (saved.status === 'finalizada' && !finalizedIds.has(baseApt.apartmentId)) {
            return baseApt;
          }

          const baseItems = createEmptyItemsMap();
          if (saved.items) {
            Object.keys(baseItems).forEach(itemKey => {
              if (saved.items && saved.items[itemKey]) {
                baseItems[itemKey] = {
                  ...baseItems[itemKey],
                  ...saved.items[itemKey]
                };
              }
            });
          }

          const isActuallyGenerated = saved.status === 'finalizada' ? false : (saved.isGenerated ?? false);

          return {
            ...baseApt,
            ...saved,
            isGenerated: isActuallyGenerated,
            items: baseItems
          };
        });

        onUpdate({ apartments: mergedApartments, settings });
      }
    }, (err) => {
      console.warn('Subscription error on apartments state:', err);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Could not setup apartment subscription:', err);
    return () => {};
  }
}

export async function saveApartmentsState(apartments: ApartmentInspection[], settings?: AppSettings): Promise<void> {
  try {
    const dataToSave: Record<string, ApartmentInspection> = {};
    apartments.forEach(apt => {
      dataToSave[apt.apartmentId] = apt;
    });

    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    if (settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // Save to shared Firestore database
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'vistorias_sistema', 'estado_atual');
      await setDoc(docRef, {
        apartments: dataToSave,
        settings: settings || {},
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.error('Erro ao salvar no Firestore:', err);
  }
}

export async function resetAllData(): Promise<void> {
  // 1. Clear local storage
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem('unila_vistorias_finalizadas_v1');
  localStorage.clear();

  // 2. Clear history
  await clearAllHistory();

  // 3. Clear cloud Firestore collections
  try {
    const db = getDb();
    if (db) {
      // Delete estado_atual
      await deleteDoc(doc(db, 'vistorias_sistema', 'estado_atual'));
      await deleteDoc(doc(db, 'configuracoes', 'geral'));
      await deleteDoc(doc(db, 'historico_vistorias', 'lista'));

      // Clean all docs in vistorias_sistema
      const vSnap = await getDocs(collection(db, 'vistorias_sistema'));
      for (const d of vSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Clean all docs in historico_vistorias
      const hSnap = await getDocs(collection(db, 'historico_vistorias'));
      for (const d of hSnap.docs) {
        await deleteDoc(d.ref);
      }

      // Clean all docs in configuracoes
      const cSnap = await getDocs(collection(db, 'configuracoes'));
      for (const d of cSnap.docs) {
        await deleteDoc(d.ref);
      }
    }
  } catch (err) {
    console.error('Erro ao limpar dados do Firestore:', err);
  }
}

export function clearAllData(): void {
  resetAllData().catch(console.error);
}
