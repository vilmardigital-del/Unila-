import { ApartmentInspection } from '../types';
import { generateAllApartments, createEmptyItemsMap } from '../data/apartments';

const STORAGE_KEY = 'unila_vistorias_v1';
const SETTINGS_KEY = 'unila_settings_v1';

export interface AppSettings {
  allGenerated: boolean;
  defaultInspector: string;
}

export function loadStoredApartments(): { apartments: ApartmentInspection[]; settings: AppSettings } {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const rawSettings = localStorage.getItem(SETTINGS_KEY);

    const baseApartments = generateAllApartments();
    let settings: AppSettings = {
      allGenerated: false,
      defaultInspector: ''
    };

    if (rawSettings) {
      settings = { ...settings, ...JSON.parse(rawSettings) };
    }

    if (!rawData) {
      return { apartments: baseApartments, settings };
    }

    const savedMap: Record<string, Partial<ApartmentInspection>> = JSON.parse(rawData);

    // Merge saved inspection states into default structure to maintain clean schema
    const mergedApartments = baseApartments.map(baseApt => {
      const saved = savedMap[baseApt.apartmentId];
      if (!saved) return baseApt;

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

      return {
        ...baseApt,
        ...saved,
        isGenerated: saved.isGenerated ?? (settings.allGenerated || false),
        items: baseItems
      };
    });

    return { apartments: mergedApartments, settings };
  } catch (err) {
    console.error('Erro ao carregar dados do localStorage:', err);
    return {
      apartments: generateAllApartments(),
      settings: { allGenerated: false, defaultInspector: '' }
    };
  }
}

export function saveApartmentsState(apartments: ApartmentInspection[], settings?: AppSettings): void {
  try {
    const dataToSave: Record<string, ApartmentInspection> = {};
    apartments.forEach(apt => {
      dataToSave[apt.apartmentId] = apt;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

    if (settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
