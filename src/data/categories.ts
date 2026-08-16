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
  'Registro com folga',
  'Troca de miolo',
  'Troca da fechadura completa',
  'Troca do trinco',
  'Troca do marco',
  'Troca da porta',
  'Pintura da porta',
  'Troca da dobradiça',
  'Troca das hastes da janela',
  'Troca do vidro',
  'Troca da calha da lâmpada',
  'Troca da luminária',
  'Móvel quebrado',
  'Móvel sem conserto',
  'Móvel faltando',
  'Colchão rasgado',
  'Cama quebrada',
  'Sujeira, precisa de limpeza'
];
