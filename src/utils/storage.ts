import { ApartmentInspection } from '../types';
import { generateAllApartments, createEmptyItemsMap } from '../data/apartments';
import { loadFinalizedInspections } from './historyStorage';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const STORAGE_KEY = 'unila_vistorias_v1';
const SETTINGS_KEY = 'unila_settings_v1';

export interface AppSettings {
  allGenerated: boolean;
  defaultInspector: string;
}

export async function loadStoredApartments(): Promise<{ apartments: ApartmentInspection[]; settings: AppSettings }> {
  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const baseApartments = generateAllApartments();
    
    // Attempt to load from Firestore
    const docRef = doc(db, 'users', userId, 'data', 'vistorias');
    const docSnap = await getDoc(docRef);

    let savedMap: Record<string, Partial<ApartmentInspection>> = {};
    let settings: AppSettings = {
      allGenerated: false,
      defaultInspector: ''
    };

    if (docSnap.exists()) {
      const data = docSnap.data();
      savedMap = data.apartments || {};
      settings = data.settings || settings;
    } else {
      // Fallback to localStorage if no Firestore data yet (migration)
      const rawData = localStorage.getItem(STORAGE_KEY);
      const rawSettings = localStorage.getItem(SETTINGS_KEY);
      if (rawData) savedMap = JSON.parse(rawData);
      if (rawSettings) settings = { ...settings, ...JSON.parse(rawSettings) };
    }
    
    // Check finalized inspections in history database
    const finalizedHistory = loadFinalizedInspections();
    const finalizedIds = new Set(finalizedHistory.map(h => h.apartmentId));

    // Merge saved inspection states into default structure to maintain clean schema
    const mergedApartments = baseApartments.map(baseApt => {
      const saved = savedMap[baseApt.apartmentId];
      if (!saved) return baseApt;

      // If marked finalized in local storage but deleted from database, clean up completely
      if (saved.status === 'finalizada' && !finalizedIds.has(baseApt.apartmentId)) {
        return baseApt;
      }

      // Merge items ensuring new items aren't lost
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

      // If status is finalized, active generated state is false (it's archived in DB)
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
    console.error('Erro ao carregar dados do Firestore:', err);
    return {
      apartments: generateAllApartments(),
      settings: { allGenerated: false, defaultInspector: '' }
    };
  }
}

export async function saveApartmentsState(apartments: ApartmentInspection[], settings?: AppSettings): Promise<void> {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const dataToSave: Record<string, ApartmentInspection> = {};
    apartments.forEach(apt => {
      dataToSave[apt.apartmentId] = apt;
    });

    await setDoc(doc(db, 'users', userId, 'data', 'vistorias'), {
      apartments: dataToSave,
      settings: settings || {}
    }, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar no Firestore:', err);
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
