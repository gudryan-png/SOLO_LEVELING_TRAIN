import { Skill, InventoryItem, Title } from './types';

export const SPECIAL_SKILLS: Skill[] = [
  {
    id: 'arise',
    name: 'Erga-se (Arise)',
    description: 'Manifeste sua autoridade sobre as sombras. Conecta seu treino ao de outros hunters para compartilhamento de força.',
    type: 'special',
    icon: 'Ghost',
    color: 'text-purple-600',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    unlocked: true
  },
  {
    id: 'bloodlust',
    name: 'Sede de Sangue',
    description: 'Instile medo nos seus próprios limites. Ganhe bônus de 2x Atributos na próxima distribuição.',
    type: 'buff',
    icon: 'Skull',
    color: 'text-rose-500',
    glowColor: 'rgba(244, 63, 94, 0.6)',
    unlocked: true
  },
  {
    id: 'dominators-touch',
    name: 'Toque do Dominador',
    description: 'Manipulação telecinética do peso corporal. Reduz a fadiga percebida em 30%.',
    type: 'passive',
    icon: 'Fingerprint',
    color: 'text-blue-400',
    glowColor: 'rgba(96, 165, 250, 0.6)',
    unlocked: true
  },
  {
    id: 'quicksilver',
    name: 'Velocidade Relâmpago',
    description: 'Aumenta sua agilidade de execução, permitindo treinos mais explosivos.',
    type: 'buff',
    icon: 'Wind',
    color: 'text-cyan-300',
    glowColor: 'rgba(103, 232, 249, 0.6)',
    unlocked: true
  }
];

export const SKILL_FRIENDS = [
  { name: 'Hunter Thomas', status: 'Em treino (Peito)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas' },
  { name: 'S-Rank Woo', status: 'Em treino (Perna)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Woo' },
  { name: 'Cha Hae-In', status: 'Descansando', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cha' },
];

export const SPECIAL_ITEMS: InventoryItem[] = [
  {
    id: 'shadow-shake',
    name: 'Shake do Monarca das Sombras',
    description: 'Um suplemento negro que recupera a fadiga instantaneamente.',
    requirement: '20 treinos totais',
    icon: 'Milk',
    color: 'text-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    requiredStats: { total: 20 }
  },
  {
    id: 'destruction-straps',
    name: 'Straps da Destruição',
    description: 'Permite erguer cargas que desafiam as leis da física.',
    requirement: '50 treinos de Peito',
    icon: 'GripHorizontal',
    color: 'text-rose-600',
    glowColor: 'rgba(225, 29, 72, 0.4)',
    requiredStats: { peito: 50 }
  },
  {
    id: 'ice-gloves',
    name: 'Luvas do Soberano de Gelo',
    description: 'Mantém suas mãos firmes mesmo no frio do Rank S.',
    requirement: '30 treinos de Tríceps',
    icon: 'Snowflake',
    color: 'text-blue-300',
    glowColor: 'rgba(147, 197, 253, 0.4)',
    requiredStats: { triceps: 30 }
  },
  {
    id: 'beginning-belt',
    name: 'Cinto do Monarca do Início',
    description: 'Proteção absoluta para a lombar durante o agachamento pesado.',
    requirement: '40 treinos de Perna',
    icon: 'Shield',
    color: 'text-amber-600',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    requiredStats: { perna: 40 }
  },
  {
    id: 'beast-wraps',
    name: 'Ataduras do Rei das Feras',
    description: 'Aumenta a força da pegada em remadas brutais.',
    requirement: '30 treinos de Costas',
    icon: 'PawPrint',
    color: 'text-orange-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    requiredStats: { costas: 30 }
  },
  {
    id: 'flame-preworkout',
    name: 'Pré-Treino Baran',
    description: 'Energia infindável vinda das profundezas do reino demoníaco.',
    requirement: '25 treinos de Bíceps',
    icon: 'Flame',
    color: 'text-sky-300',
    glowColor: 'rgba(125, 211, 252, 0.4)',
    requiredStats: { biceps: 25 }
  },
  {
    id: 'plague-bottle',
    name: 'Garrafa de Querehsha',
    description: 'Contém líquidos que purificam o corpo durante o treino.',
    requirement: '20 treinos de Ombro',
    icon: 'FlaskConical',
    color: 'text-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    requiredStats: { ombro: 20 }
  }
];

export const TITLES: Title[] = [
  {
    id: 'none',
    name: 'Sem Título',
    description: 'Um novo caçador ainda sem renome.',
    requirement: 'Padrão',
    isUnlocked: true,
    requiredStats: {}
  },
  {
    id: 'first-step',
    name: 'Primeiros Passos',
    description: 'O início de uma grande jornada.',
    requirement: '1 treino total',
    isUnlocked: false,
    color: 'text-slate-300',
    glowColor: 'rgba(203, 213, 225, 0.2)',
    requiredStats: { total: 1 }
  },
  {
    id: 'beginner-survivor',
    name: 'Sobrevivente Iniciante',
    description: 'Você provou que pode suportar o sistema.',
    requirement: '2 treinos totais',
    isUnlocked: false,
    color: 'text-green-400',
    glowColor: 'rgba(74, 222, 128, 0.2)',
    requiredStats: { total: 2 }
  },
  {
    id: 'lonely-recruit',
    name: 'Recruta Solitário',
    description: 'Dando os primeiros passos rumo à força.',
    requirement: '5 treinos totais',
    isUnlocked: false,
    color: 'text-blue-300',
    glowColor: 'rgba(147, 197, 253, 0.3)',
    requiredStats: { total: 5 }
  },
  {
    id: 'workout-enthusiast',
    name: 'Entusiasta de Treino',
    description: 'O sistema já faz parte da sua rotina.',
    requirement: '10 treinos totais',
    isUnlocked: false,
    color: 'text-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.3)',
    requiredStats: { total: 10 }
  },
  {
    id: 'national-rank',
    name: 'Caçador de Nível Nacional',
    description: 'Um dos poucos que possuem a força de um exército inteiro.',
    requirement: '100 treinos Totais e 50 em cada grupo',
    isUnlocked: false,
    color: 'text-yellow-400',
    glowColor: 'rgba(250, 204, 21, 0.4)',
    requiredStats: { total: 100, peito: 50, costas: 50, perna: 50 }
  },
  {
    id: 'rank-s-hunter',
    name: 'Caçador de Rank S',
    description: 'O topo da humanidade. Sua força é reconhecida mundialmente.',
    requirement: '50 treinos de qualquer grupo muscular',
    isUnlocked: false,
    color: 'text-indigo-400',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    requiredStats: { total: 50 }
  },
  {
    id: 'sword-master',
    name: 'A Mestra da Espada',
    description: 'Agilidade e precisão que superam o olho humano.',
    requirement: '30 treinos de Ombro e 30 de Perna',
    isUnlocked: false,
    color: 'text-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    requiredStats: { ombro: 30, perna: 30 }
  },
  {
    id: 'ultimate-hunter',
    name: 'O Caçador Supremo',
    description: 'Domínio total sobre as chamas da determinação.',
    requirement: '40 treinos de Peito e 40 de Tríceps',
    isUnlocked: false,
    color: 'text-orange-400',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    requiredStats: { peito: 40, triceps: 40 }
  },
  {
    id: 'antares',
    name: 'Monarca da Destruição',
    description: 'O mais forte dos monarcas, regente da destruição absoluta.',
    requirement: '200 treinos de Peito e 200 de Perna',
    isUnlocked: false,
    color: 'text-rose-600',
    glowColor: 'rgba(225, 29, 72, 0.5)',
    requiredStats: { peito: 200, perna: 200 }
  },
  {
    id: 'ashborn',
    name: 'Monarca das Sombras',
    description: 'Aquele que domina a morte e comanda legiões.',
    requirement: '100 treinos de cada grupo muscular',
    isUnlocked: false,
    color: 'text-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    requiredStats: { peito: 100, triceps: 100, costas: 100, biceps: 100, ombro: 100, perna: 100 }
  },
  {
    id: 'baran',
    name: 'Monarca das Chamas Brancas',
    description: 'O rei dos demônios e mestre do fogo espectral.',
    requirement: '150 treinos de Costas e Bíceps',
    isUnlocked: false,
    color: 'text-sky-300',
    glowColor: 'rgba(125, 211, 252, 0.4)',
    requiredStats: { costas: 150, biceps: 150 }
  },
  {
    id: 'legia',
    name: 'Monarca do Início',
    description: 'O gigante entre titãs, mestre da força primordial.',
    requirement: '150 treinos de Perna e Total de 500',
    isUnlocked: false,
    color: 'text-amber-600',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    requiredStats: { perna: 150, total: 500 }
  },
  {
    id: 'querehsha',
    name: 'Monarca das Pragas',
    description: 'A rainha dos insetos e mestre do veneno corrosivo.',
    requirement: '100 treinos de Ombro e Condicionamento',
    isUnlocked: false,
    color: 'text-emerald-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    requiredStats: { ombro: 100, total: 300 }
  },
  {
    id: 'rakan',
    name: 'Monarca das Presas',
    description: 'O rei das feras e mestre da caça selvagem.',
    requirement: '120 treinos de Costas e Perna',
    isUnlocked: false,
    color: 'text-orange-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    requiredStats: { costas: 120, perna: 120 }
  },
  {
    id: 'silad',
    name: 'Monarca do Gelo',
    description: 'O rei de pés brancos, mestre do frio absoluto.',
    requirement: '100 treinos de Tríceps e Ombro',
    isUnlocked: false,
    color: 'text-blue-300',
    glowColor: 'rgba(147, 197, 253, 0.4)',
    requiredStats: { triceps: 100, ombro: 100 }
  },
  {
    id: 'tarnak',
    name: 'Monarca do Corpo de Ferro',
    description: 'O colosso de aço, mestre da defesa impenetrável.',
    requirement: '150 treinos de Peito e 150 de Ombro',
    isUnlocked: false,
    color: 'text-slate-400',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    requiredStats: { peito: 150, ombro: 150 }
  },
  {
    id: 'yogumunt',
    name: 'Monarca da Transfiguração',
    description: 'O mestre do caos e das formas mutáveis.',
    requirement: '300 treinos Totais e 80 de cada grupo',
    isUnlocked: false,
    color: 'text-fuchsia-500',
    glowColor: 'rgba(217, 70, 239, 0.4)',
    requiredStats: { total: 300, peito: 80, costas: 80, perna: 80 }
  }
];
