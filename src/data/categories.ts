import { CategoryDefinition } from '../types';

export const MAINTENANCE_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'alvenaria',
    name: 'Alvenaria',
    iconName: 'Paintbrush',
    items: [
      'Pintura',
      'Mofado',
      'Rachadura',
      'Infiltração',
      'Teto',
      'Gesso',
      'Fechadura',
      'Portas',
      'Janelas',
      'Forro PVC'
    ]
  },
  {
    id: 'hidraulica',
    name: 'Hidráulica',
    iconName: 'Droplets',
    items: [
      'Torneiras',
      'Cofies',
      'Ralos',
      'Chuveiros',
      'Registro',
      'Saboneteiras',
      'Box',
      'Espelhos',
      'Vaso',
      'Válvula vaso'
    ]
  },
  {
    id: 'eletrica',
    name: 'Elétrica',
    iconName: 'Zap',
    items: [
      'Iluminação',
      'Tomadas',
      'Ventilador',
      'Campainha',
      'Disjuntores',
      'Luminaria',
      'Calhas De Lampada'
    ]
  },
  {
    id: 'mobilia',
    name: 'Mobília',
    iconName: 'Armchair',
    items: [
      'Pia',
      'Armario Pia',
      'Camas',
      'Colxoes',
      'Guarda Roupas',
      'Escrivania'
    ]
  }
];

export const COMMON_OBSERVATION_SUGGESTIONS: string[] = [];
