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
      'Gesso'
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
      'Disjuntores'
    ]
  }
];

export const COMMON_OBSERVATION_SUGGESTIONS = [
  'Necessita troca imediata',
  'Reparo simples necessário',
  'Vazamento leve detectado',
  'Aguardando peça de reposição',
  'Limpeza profunda necessária',
  'Em bom estado de conservação',
  'Pintura descascando',
  'Infiltração no canto superior',
  'Mancha de mofo identificada',
  'Registro com folga'
];
