import { ApartmentInspection } from '../types';
import { generateAllApartments, createEmptyItemsMap } from '../data/apartments';
import { clearAllHistory } from './historyStorage';
import { getDb } from '../lib/firebase';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  writeBatch
} from 'firebase/firestore';

const STORAGE_KEY = 'unila_vistorias_v1';
const SETTINGS_KEY = 'unila_settings_v1';

export interface AppSettings {
  allGenerated: boolean;
  defaultInspector: string;
}

/**
 * Sanitizes an object by recursively removing all undefined fields.
 * Firestore strictly rejects documents containing undefined values.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Saves a single apartment inspection directly to Firestore in its own document.
 * This guarantees instantaneous real-time sync across all devices without size limits.
 */
export async function saveSingleApartmentState(apartment: ApartmentInspection): Promise<void> {
  try {
    // 1. Update local storage cache
    const rawData = localStorage.getItem(STORAGE_KEY);
    let cacheMap: Record<string, Partial<ApartmentInspection>> = {};
    if (rawData) {
      try {
        cacheMap = JSON.parse(rawData);
      } catch {
        cacheMap = {};
      }
    }
    cacheMap[apartment.apartmentId] = apartment;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheMap));

    // 2. Save directly to cloud Firestore
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'vistorias_sistema', apartment.apartmentId);
      const payload = cleanFirestoreData({
        ...apartment,
        updatedAt: apartment.updatedAt || new Date().toISOString()
      });
      await setDoc(docRef, payload, { merge: true });
      console.log(`[Nuvem] Apartamento ${apartment.apartmentId} sincronizado com Firestore!`);
    } else {
      console.warn('[Nuvem] Instância Firestore indisponível para', apartment.apartmentId);
    }
  } catch (err) {
    console.error(`Erro ao salvar apartamento ${apartment.apartmentId} no Firestore:`, err);
  }
}

/**
 * Removes or resets an apartment spreadsheet in Firestore and notifies all devices in real time.
 */
export async function deleteApartmentFromCloud(apartmentId: string): Promise<void> {
  try {
    // 1. Update local cache
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      try {
        const cacheMap = JSON.parse(rawData);
        delete cacheMap[apartmentId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheMap));
      } catch {
        // ignore
      }
    }

    // 2. Delete document from Firestore
    const db = getDb();
    if (db) {
      const docRef = doc(db, 'vistorias_sistema', apartmentId);
      await deleteDoc(docRef);
      console.log(`[Nuvem] Apartamento ${apartmentId} excluído do Firestore!`);
    }
  } catch (err) {
    console.error(`Erro ao excluir apartamento ${apartmentId} do Firestore:`, err);
  }
}

/**
 * Saves multiple generated/active apartments in batch to Firestore.
 */
export async function saveMultipleApartmentsState(
  apartments: ApartmentInspection[],
  settings?: AppSettings
): Promise<void> {
  try {
    // Local cache update
    const rawData = localStorage.getItem(STORAGE_KEY);
    let cacheMap: Record<string, Partial<ApartmentInspection>> = {};
    if (rawData) {
      try {
        cacheMap = JSON.parse(rawData);
      } catch {
        cacheMap = {};
      }
    }
    apartments.forEach(apt => {
      cacheMap[apt.apartmentId] = apt;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheMap));

    if (settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // Batch save to Firestore
    const db = getDb();
    if (db) {
      const batch = writeBatch(db);

      apartments.forEach(apt => {
        const docRef = doc(db, 'vistorias_sistema', apt.apartmentId);
        const payload = cleanFirestoreData({
          ...apt,
          updatedAt: apt.updatedAt || new Date().toISOString()
        });
        batch.set(docRef, payload, { merge: true });
      });

      if (settings) {
        const settingsRef = doc(db, 'configuracoes', 'geral');
        batch.set(settingsRef, cleanFirestoreData({
          ...settings,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      }

      await batch.commit();
      console.log(`[Nuvem] Lote de ${apartments.length} apartamentos salvo no Firestore!`);
    }
  } catch (err) {
    console.error('Erro ao salvar lote de apartamentos no Firestore:', err);
  }
}

/**
 * Saves state of all apartments, efficiently filtering only generated/modified ones for cloud.
 */
export async function saveApartmentsState(
  apartments: ApartmentInspection[],
  settings?: AppSettings
): Promise<void> {
  try {
    const dataToSave: Record<string, ApartmentInspection> = {};
    const activeApartmentsToCloud: ApartmentInspection[] = [];

    apartments.forEach(apt => {
      dataToSave[apt.apartmentId] = apt;
      // Only send apartments that have been generated to cloud
      if (apt.isGenerated || apt.status === 'finalizada' || apt.inspectorName) {
        activeApartmentsToCloud.push(apt);
      }
    });

    // Save full map to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    if (settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // Save active to Firestore
    const db = getDb();
    if (db && activeApartmentsToCloud.length > 0) {
      const batchSize = 400;
      for (let i = 0; i < activeApartmentsToCloud.length; i += batchSize) {
        const chunk = activeApartmentsToCloud.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach(apt => {
          const docRef = doc(db, 'vistorias_sistema', apt.apartmentId);
          const payload = cleanFirestoreData({
            ...apt,
            updatedAt: apt.updatedAt || new Date().toISOString()
          });
          batch.set(docRef, payload, { merge: true });
        });
        await batch.commit();
      }

      if (settings) {
        await setDoc(doc(db, 'configuracoes', 'geral'), cleanFirestoreData({
          ...settings,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      }
    }
  } catch (err) {
    console.error('Erro ao salvar no Firestore:', err);
  }
}

/**
 * Merges raw saved records from Firestore into the 144 baseline apartments.
 */
function mergeApartmentsWithBase(
  savedMap: Record<string, Partial<ApartmentInspection>>
): ApartmentInspection[] {
  const baseApartments = generateAllApartments();

  return baseApartments.map(baseApt => {
    const saved = savedMap[baseApt.apartmentId];
    if (!saved) return baseApt;

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

    return {
      ...baseApt,
      ...saved,
      isGenerated: Boolean(saved.isGenerated),
      status: saved.status || 'rascunho',
      items: baseItems
    };
  });
}

/**
 * Loads stored apartments from Firestore collection or fallback local storage.
 */
export async function loadStoredApartments(): Promise<{ apartments: ApartmentInspection[]; settings: AppSettings }> {
  try {
    let savedMap: Record<string, Partial<ApartmentInspection>> = {};
    let settings: AppSettings = {
      allGenerated: false,
      defaultInspector: ''
    };

    // 1. Attempt to load from shared Firestore database
    const db = getDb();
    if (db) {
      try {
        const colRef = collection(db, 'vistorias_sistema');
        const querySnap = await getDocs(colRef);

        if (!querySnap.empty) {
          querySnap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (docSnap.id === 'estado_atual' && data.apartments) {
              // Legacy support
              Object.assign(savedMap, data.apartments);
            } else if (docSnap.id !== 'estado_atual' && docSnap.id !== 'teste_ping') {
              const aptId = (data.apartmentId || docSnap.id).toUpperCase();
              savedMap[aptId] = data as Partial<ApartmentInspection>;
            }
          });
        }

        // Load settings
        try {
          const settingsSnap = await getDoc(doc(db, 'configuracoes', 'geral'));
          if (settingsSnap.exists()) {
            settings = { ...settings, ...(settingsSnap.data() as AppSettings) };
          }
        } catch {
          // ignore
        }

        if (Object.keys(savedMap).length > 0) {
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

    const mergedApartments = mergeApartmentsWithBase(savedMap);
    return { apartments: mergedApartments, settings };
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    return {
      apartments: generateAllApartments(),
      settings: { allGenerated: false, defaultInspector: '' }
    };
  }
}

/**
 * Subscribes in REAL TIME to all cloud changes in the vistorias_sistema collection.
 * Any device generating, editing, or resetting an inspection is instantly reflected here.
 */
export function subscribeToApartmentsState(
  onUpdate: (data: { apartments: ApartmentInspection[]; settings: AppSettings }) => void
): () => void {
  try {
    const db = getDb();
    if (!db) {
      console.warn('[Nuvem] Firestore indisponível para assinatura em tempo real');
      return () => {};
    }

    const colRef = collection(db, 'vistorias_sistema');
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const savedMap: Record<string, Partial<ApartmentInspection>> = {};

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (docSnap.id === 'estado_atual' && data.apartments) {
          Object.assign(savedMap, data.apartments);
        } else if (docSnap.id !== 'estado_atual' && docSnap.id !== 'teste_ping') {
          const aptId = (data.apartmentId || docSnap.id).toUpperCase();
          savedMap[aptId] = data as Partial<ApartmentInspection>;
        }
      });

      // Update local cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMap));

      // Get settings from cache
      let settings: AppSettings = { allGenerated: false, defaultInspector: '' };
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawSettings) {
        try {
          settings = { ...settings, ...JSON.parse(rawSettings) };
        } catch {
          // ignore
        }
      }

      const mergedApartments = mergeApartmentsWithBase(savedMap);
      onUpdate({ apartments: mergedApartments, settings });
    }, (err) => {
      console.error('Erro na sincronização em tempo real de vistorias_sistema:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Falha ao configurar assinatura em tempo real:', err);
    return () => {};
  }
}

/**
 * Wipes all data from cloud Firestore and local storage.
 */
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
      const vSnap = await getDocs(collection(db, 'vistorias_sistema'));
      if (!vSnap.empty) {
        const batch = writeBatch(db);
        vSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      const hSnap = await getDocs(collection(db, 'historico_vistorias'));
      if (!hSnap.empty) {
        const batch = writeBatch(db);
        hSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      const cSnap = await getDocs(collection(db, 'configuracoes'));
      if (!cSnap.empty) {
        const batch = writeBatch(db);
        cSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (err) {
    console.error('Erro ao limpar dados do Firestore:', err);
  }
}

export function clearAllData(): void {
  resetAllData().catch(console.error);
}
