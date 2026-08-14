import { ApartmentInspection, BuildingBlock, InspectionItemState } from '../types';
import { MAINTENANCE_CATEGORIES } from './categories';

export function createEmptyItemsMap(): Record<string, InspectionItemState> {
  const itemsMap: Record<string, InspectionItemState> = {};

  MAINTENANCE_CATEGORIES.forEach(category => {
    category.items.forEach(itemName => {
      const itemKey = `${category.id}-${itemName.toLowerCase().replace(/\s+/g, '_')}`;
      itemsMap[itemKey] = {
        id: itemKey,
        category: category.name,
        name: itemName,
        status: null, // null = not filled yet, 'sim' or 'nao'
        observation: ''
      };
    });
  });

  return itemsMap;
}

export function generateAllApartments(): ApartmentInspection[] {
  const blocks: BuildingBlock[] = ['A', 'B', 'E'];
  const floorsConfig = [
    { prefix: '0', floorName: 'Térreo' as const, start: 1, end: 16 },
    { prefix: '1', floorName: '1º Andar' as const, start: 1, end: 16 },
    { prefix: '2', floorName: '2º Andar' as const, start: 1, end: 16 }
  ];

  const apartments: ApartmentInspection[] = [];

  blocks.forEach(block => {
    floorsConfig.forEach(floor => {
      for (let i = floor.start; i <= floor.end; i++) {
        const numStr = i < 10 ? `0${i}` : `${i}`;
        let numberCode = '';
        if (floor.prefix === '0') {
          numberCode = `0${numStr}`; // 001 to 016
        } else {
          numberCode = `${floor.prefix}${numStr}`; // 101 to 116 or 201 to 216
        }

        const aptId = `${block}${numberCode}`;

        apartments.push({
          apartmentId: aptId,
          block: block,
          number: numberCode,
          floor: floor.floorName,
          isGenerated: false, // Default false, generated on system batch or individual search/action
          items: createEmptyItemsMap()
        });
      }
    });
  });

  return apartments;
}
