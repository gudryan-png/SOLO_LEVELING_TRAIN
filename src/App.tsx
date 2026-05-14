/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Dumbbell, 
  Droplet, 
  Zap, 
  Shield, 
  Sword,
  Brain, 
  ChevronUp,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  Plus,
  Trash2,
  Award,
  X,
  Settings2,
  History,
  Milk,
  Activity,
  Flame,
  ThermometerSnowflake,
  Skull,
  LogOut,
  GripHorizontal,
  Snowflake,
  FlaskConical,
  PawPrint,
  Dumbbell as GymIcon,
  Users,
  Zap as PowerIcon,
  Ghost,
  Eye,
  Wind,
  RefreshCw,
  ChevronsUp,
  Fingerprint,
  Coffee,
  Utensils,
  TrendingUp,
  Calendar,
  Clock,
  Pizza,
  Apple,
  Bell,
  ScrollText,
  Home,
  Sparkles
} from 'lucide-react';
import { HunterStatus, Quest, Exercise, Attributes, Workout, Title, WorkoutStats, InventoryItem, Skill, Meal, Challenge, WorkoutLog, Friend, FriendRequest, WalkingLog } from './types.ts';
import { SPECIAL_SKILLS, SKILL_FRIENDS, SPECIAL_ITEMS, TITLES } from './constants.ts';
import { getMealRecommendations } from './services/geminiService.ts';
import AuthScreen from './components/AuthScreen.tsx';
import { auth, db, withFirestoreRetry, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, writeBatch, deleteDoc } from 'firebase/firestore';

const INITIAL_STATUS: HunterStatus = {
  name: 'Carregando...',
  level: 1,
  xp: 0,
  maxXp: 1000,
  attributes: {
    strength: 10,
    vitality: 10,
    agility: 10,
    intelligence: 10
  },
  pointsToDistribute: 0,
  unlockedWorkoutIndex: 0,
  activeWorkoutIndex: 0,
  week: 1,
  stats: {
    peito: 0,
    triceps: 0,
    costas: 0,
    biceps: 0,
    ombro: 0,
    perna: 0,
    total: 0
  },
  currentTitleId: 'none',
  customWorkouts: [],
  inventory: [],
  skills: SPECIAL_SKILLS,
  goal: 'maintenance'
};

const GET_WORKOUTS_FOR_WEEK = (week: number): Workout[] => {
  const phase = Math.floor((week - 1) / 4) % 3; // Cycle through 3 phases

  if (phase === 1) { // Weeks 5-8: Hypertrophy Phase
    return [
      {
        id: 'A',
        title: 'DIA A - EXPLOSÃO MUSCULAR',
        subtitle: 'PEITO E TRÍCEPS (VARIAÇÃO)',
        color: 'system-blue',
        tags: ['peito', 'triceps'],
        exercises: [
          { name: 'Supino Inclinado (Barra)', sets: 4, reps: '10', weight: '25kg / Lado', rest: '90s' },
          { name: 'Crucifixo Reto (Halteres)', sets: 3, reps: '12-15', weight: '18kg / Lado', rest: '60s' },
          { name: 'Tríceps Francês', sets: 3, reps: '12', weight: '12kg', rest: '60s' },
          { name: 'Tríceps Pulley (Inverso)', sets: 4, reps: '15', weight: '20kg', rest: '45s' },
        ]
      },
      {
        id: 'B',
        title: 'DIA B - DOMÍNIO DAS SOMBRAS',
        subtitle: 'COSTAS E BÍCEPS (VARIAÇÃO)',
        color: 'system-purple',
        tags: ['costas', 'biceps'],
        exercises: [
          { name: 'Puxada com Triângulo', sets: 4, reps: '10-12', weight: '55kg', rest: '90s' },
          { name: 'Remada Cavalinho', sets: 4, reps: '10', weight: '40kg', rest: '60s' },
          { name: 'Rosca Concentrada', sets: 3, reps: '12', weight: '14kg', rest: '45s' },
          { name: 'Rosca Inversa (Cabo)', sets: 3, reps: '15', weight: '15kg', rest: '60s' },
        ]
      },
      {
        id: 'C',
        title: 'DIA C - PILARES DE TITÂNIO',
        subtitle: 'MEMBROS INFERIORES (VARIAÇÃO)',
        color: 'emerald-500',
        tags: ['perna'],
        exercises: [
          { name: 'Hack Machine', sets: 4, reps: '10', weight: '60kg', rest: '120s' },
          { name: 'Stiff (Barra)', sets: 3, reps: '12', weight: '25kg / Lado', rest: '90s' },
          { name: 'Cadeira Flexora', sets: 4, reps: '15', weight: '40kg', rest: '45s' },
          { name: 'Adução de Pernas', sets: 3, reps: '20', weight: '45kg', rest: '60s' },
        ]
      },
      {
        id: 'D',
        title: 'DIA D - OMBROS DE GIGANTE',
        subtitle: 'OMBROS E TRAPÉZIO (VARIAÇÃO)',
        color: 'amber-500',
        tags: ['ombro'],
        exercises: [
          { name: 'Desenvolvimento Arnold', sets: 4, reps: '10', weight: '16kg / Lado', rest: '90s' },
          { name: 'Crucifixo Inverso', sets: 4, reps: '15', weight: '8kg / Lado', rest: '45s' },
          { name: 'Elevação Lateral (Cabo)', sets: 3, reps: '12', weight: '7kg', rest: '60s' },
          { name: 'Encolhimento (Barra)', sets: 4, reps: '12', weight: '40kg / Lado', rest: '60s' },
        ]
      },
      {
        id: 'E',
        title: 'DIA E - RESISTÊNCIA ETERNA',
        subtitle: 'ABDÔMEN E CARDIO (VARIAÇÃO)',
        color: 'rose-500',
        tags: ['total'],
        exercises: [
          { name: 'Abdominal Infra', sets: 4, reps: '15', weight: 'Peso do Corpo', rest: '45s' },
          { name: 'Abdominal Oblíquo (Crossover)', sets: 3, reps: '15', weight: '20kg', rest: '45s' },
          { name: 'Abdominal Bicicleta', sets: 3, reps: '30s', weight: 'N/A', rest: '60s' },
          { name: 'Escada (Modo Quest)', sets: 1, reps: '15min', weight: 'Intenso', rest: 'N/A' },
        ]
      }
    ];
  }

  if (phase === 2) { // Weeks 9-12: Rank S Strength Phase
    return [
      {
        id: 'A',
        title: 'DIA A - IMPACTO CRÍTICO',
        subtitle: 'PEITO E TRÍCEPS (RANK S)',
        color: 'system-blue',
        tags: ['peito', 'triceps'],
        exercises: [
          { name: 'Supino Reto (Pausa 2s)', sets: 5, reps: '5-8', weight: '35kg / Lado', rest: '120s' },
          { name: 'Paralelas (Focada Peito)', sets: 3, reps: 'Falha', weight: 'Peso do Corpo', rest: '90s' },
          { name: 'Tríceps Coice (Cabo)', sets: 4, reps: '12', weight: '15kg', rest: '45s' },
          { name: 'Supino Fechado', sets: 3, reps: '10', weight: '20kg / Lado', rest: '60s' },
        ]
      },
      {
        id: 'B',
        title: 'DIA B - CAÇA ÀS SOMBRAS',
        subtitle: 'COSTAS E BÍCEPS (RANK S)',
        color: 'system-purple',
        tags: ['costas', 'biceps'],
        exercises: [
          { name: 'Levantamento Terra', sets: 3, reps: '5', weight: '50kg / Lado', rest: '180s' },
          { name: 'Barra Fixa (Pronada)', sets: 4, reps: '8-10', weight: 'Peso do Corpo', rest: '90s' },
          { name: 'Remada Unilateral', sets: 3, reps: '10', weight: '32kg', rest: '60s' },
          { name: 'Rosca Martelo (Corda)', sets: 4, reps: '12', weight: '30kg', rest: '45s' },
        ]
      },
      {
        id: 'C',
        title: 'DIA C - ARMADURA DE PLATINA',
        subtitle: 'MEMBROS INFERIORES (RANK S)',
        color: 'emerald-500',
        tags: ['perna'],
        exercises: [
          { name: 'Agachamento Frontal', sets: 4, reps: '8', weight: '30kg / Lado', rest: '120s' },
          { name: 'Afundo (Halteres)', sets: 3, reps: '10', weight: '20kg / Lado', rest: '90s' },
          { name: 'Flexora em Pé', sets: 4, reps: '12', weight: '25kg', rest: '45s' },
          { name: 'Gêmeos em Pé', sets: 5, reps: '15', weight: '60kg', rest: '60s' },
        ]
      },
      {
        id: 'D',
        title: 'DIA D - VONTADE DO MONARCA',
        subtitle: 'OMBROS E TRAPÉZIO (RANK S)',
        color: 'amber-500',
        tags: ['ombro'],
        exercises: [
          { name: 'Press Militar (Sentado)', sets: 4, reps: '8-10', weight: '22kg / Lado', rest: '90s' },
          { name: 'Face Pulls', sets: 4, reps: '15', weight: '35kg', rest: '60s' },
          { name: 'Elevação Lateral (Pausa)', sets: 3, reps: '12', weight: '10kg', rest: '60s' },
          { name: 'Encolhimento (Smith)', sets: 4, reps: '10', weight: '50kg / Lado', rest: '60s' },
        ]
      },
      {
        id: 'E',
        title: 'DIA E - SUPERAÇÃO DE LIMITES',
        subtitle: 'CORE E CONDICIONAMENTO (RANK S)',
        color: 'rose-500',
        tags: ['total'],
        exercises: [
          { name: 'Abdominal Hollow Rock', sets: 4, reps: '45s', weight: 'Isometria', rest: '45s' },
          { name: 'Toes to Bar', sets: 3, reps: '10', weight: 'Peso do Corpo', rest: '60s' },
          { name: 'Woodchopper (Cabo)', sets: 3, reps: '12', weight: '25kg', rest: '45s' },
          { name: 'Burpees (Finish)', sets: 3, reps: '15', weight: 'Alta Intensidade', rest: '60s' },
        ]
      }
    ];
  }

  // Default / Phase 0 (Weeks 1-4)
  return [
    {
      id: 'A',
      title: 'DIA A - FORÇA BRUTA',
      subtitle: 'PEITO E TRÍCEPS',
      color: 'system-blue',
      tags: ['peito', 'triceps'],
      exercises: [
        { name: 'Supino Reto (Barra)', sets: 4, reps: '8-10', weight: '30kg / Lado', rest: '90s' },
        { name: 'Supino Inclinado (Halteres)', sets: 3, reps: '12', weight: '24kg / Lado', rest: '60s' },
        { name: 'Tríceps Testa', sets: 3, reps: '10-12', weight: '10kg / Lado', rest: '60s' },
        { name: 'Tríceps Pulley (Corda)', sets: 4, reps: '15', weight: '25kg', rest: '45s' },
      ]
    },
    {
      id: 'B',
      title: 'DIA B - SOMBRA E PUXADA',
      subtitle: 'COSTAS E BÍCEPS',
      color: 'system-purple',
      tags: ['costas', 'biceps'],
      exercises: [
        { name: 'Puxada Aberta', sets: 4, reps: '10-12', weight: '50kg', rest: '90s' },
        { name: 'Remada Curvada', sets: 4, reps: '10', weight: '25kg / Lado', rest: '60s' },
        { name: 'Rosca Direta (Camber)', sets: 3, reps: '12', weight: '12kg / Lado', rest: '45s' },
        { name: 'Rosca Martelo', sets: 3, reps: '12', weight: '14kg / Lado', rest: '60s' },
      ]
    },
    {
      id: 'C',
      title: 'DIA C - BASE DE FERRO',
      subtitle: 'MEMBROS INFERIORES',
      color: 'emerald-500',
      tags: ['perna'],
      exercises: [
        { name: 'Agachamento Livre', sets: 4, reps: '8-10', weight: '45kg / Lado', rest: '120s' },
        { name: 'Leg Press 45', sets: 3, reps: '15', weight: '200kg', rest: '90s' },
        { name: 'Cadeira Extensora', sets: 4, reps: '12', weight: '50kg', rest: '45s' },
        { name: 'Mesa Flexora', sets: 3, reps: '12', weight: '35kg', rest: '60s' },
      ]
    },
    {
      id: 'D',
      title: 'DIA D - ARMADURA HUMANA',
      subtitle: 'OMBROS E TRAPÉZIO',
      color: 'amber-500',
      tags: ['ombro'],
      exercises: [
        { name: 'Desenvolvimento Militar', sets: 4, reps: '10', weight: '18kg / Lado', rest: '90s' },
        { name: 'Elevação Lateral', sets: 4, reps: '15', weight: '10kg', rest: '45s' },
        { name: 'Elevação Frontal', sets: 3, reps: '12', weight: '12kg', rest: '60s' },
        { name: 'Encolhimento (Halteres)', sets: 4, reps: '12', weight: '35kg / Lado', rest: '60s' },
      ]
    },
    {
      id: 'E',
      title: 'DIA E - VELOCIDADE DIVINA',
      subtitle: 'ABDÔMEN E CARDIO',
      color: 'rose-500',
      tags: ['total'],
      exercises: [
        { name: 'Prancha Isométrica', sets: 3, reps: '60s', weight: 'Peso do Corpo', rest: '45s' },
        { name: 'Abdominal Supra (Cabo)', sets: 4, reps: '20', weight: '35kg', rest: '45s' },
        { name: 'Elevação de Pernas', sets: 3, reps: '15', weight: 'Opcional', rest: '60s' },
        { name: 'Cardio (HIIT)', sets: 1, reps: '20min', weight: 'Corrida', rest: 'N/A' },
      ]
    }
  ];
};

const QUEST_POOL: Omit<Quest, 'completed'>[] = [
  { id: 'q1', title: '10 Flexões', xpReward: 150, rarity: 'common', category: 'physical', icon: 'Dumbbell' },
  { id: 'q2', title: '10 Abdominais', xpReward: 150, rarity: 'common', category: 'physical', icon: 'Activity' },
  { id: 'q3', title: '10 Agachamentos', xpReward: 150, rarity: 'common', category: 'physical', icon: 'Dumbbell' },
  { id: 'q4', title: 'Caminhada Leve (500m)', xpReward: 300, rarity: 'rare', category: 'physical', icon: 'Wind' },
  { id: 'q5', title: 'Beber 1L de Água', xpReward: 100, rarity: 'common', category: 'habit', icon: 'Droplet' },
  { id: 'q6', title: '2 Minutos de Meditação', xpReward: 200, rarity: 'rare', category: 'mental', icon: 'Brain' },
  { id: 'q7', title: 'Banho Gelado (15s)', xpReward: 300, rarity: 'rare', category: 'habit', icon: 'Snowflake' },
  { id: 'q8', title: 'Treino de 5 Minutos', xpReward: 400, rarity: 'epic', category: 'special', icon: 'Skull' },
  { id: 'q9', title: '5 Barras Fixas', xpReward: 500, rarity: 'epic', category: 'physical', icon: 'ChevronsUp' },
  { id: 'q10', title: 'Ler 2-5 páginas', xpReward: 100, rarity: 'common', category: 'mental', icon: 'Brain' },
  { id: 'q11', title: 'Desafio: Organizar o quarto', xpReward: 800, rarity: 'legendary', category: 'special', icon: 'Zap' },
  { id: 'q12', title: 'Fruta no lugar de doce', xpReward: 250, rarity: 'rare', category: 'habit', icon: 'FlaskConical' },
  { id: 'q13', title: 'Prancha de 30 Segundos', xpReward: 250, rarity: 'rare', category: 'physical', icon: 'Shield' },
  { id: 'q14', title: 'Alongamento de 1 Minuto', xpReward: 100, rarity: 'common', category: 'physical', icon: 'Activity' },
];

const getDailyQuests = (count = 2): Quest[] => {
  const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(q => ({ ...q, completed: false }));
};

const NutritionSection = ({ 
  meals, 
  goal,
  onAddMeal, 
  onRemoveMeal,
  onUpdateGoal
}: { 
  meals: Meal[], 
  goal: HunterStatus['goal'],
  onAddMeal: (name: string, cal: number, pro: number, type: Meal['type'], recipe?: string) => void,
  onRemoveMeal: (id: string) => void,
  onUpdateGoal: (goal: HunterStatus['goal']) => void
}) => {
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [pro, setPro] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{name: string, recipe: string} | null>(null);

  const totalCal = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalPro = meals.reduce((acc, m) => acc + m.protein, 0);

  const fetchRecommendations = async () => {
    setLoadingAi(true);
    const recs = await getMealRecommendations(goal);
    setRecommendations(recs);
    setLoadingAi(false);
  };

  useEffect(() => {
    if (goal) fetchRecommendations();
  }, [goal]);

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Ganho de Massa',
    weight_gain: 'Aumento de Peso',
    weight_loss: 'Perda de Peso',
    maintenance: 'Manutenção'
  };

  return (
    <section className="relative min-h-[80vh] flex flex-col gap-8 pb-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-amber-500/5 [mask-image:radial-gradient(ellipse_at_center,transparent,black)] -z-10 pointer-events-none" />
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-black/40 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
            <Utensils size={32} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
              Cozinha do Monarca
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Atelier de Suprimentos & Alquimia Nutricional</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Consumo do Ciclo</span>
            <div className="flex gap-3">
               <div className="text-xl font-black text-amber-500 italic drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                 {totalCal} <span className="text-[10px] uppercase ml-1 opacity-70">Kcal</span>
               </div>
               <div className="text-xl font-black text-blue-400 italic drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                 {totalPro} <span className="text-[10px] uppercase ml-1 opacity-70">g Prot</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: REGISTRATION & GOAL */}
        <div className="lg:col-span-4 space-y-6">
          <div className="system-window !border-amber-500/30 p-6 bg-black/60 shadow-2xl">
            <div className="text-xs text-amber-500 font-black uppercase mb-4 tracking-widest flex items-center gap-2">
              <FlaskConical size={14} /> Definir Objetivo Atual
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(goalLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => onUpdateGoal(key as any)}
                  className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase italic border transition-all duration-300 ${
                    goal === key 
                      ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                      : 'bg-black/40 text-slate-500 border-slate-800 hover:border-amber-500/50 hover:bg-black/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="system-window !border-slate-800/50 p-6 bg-black/60 shadow-2xl">
            <div className="text-xs text-slate-400 font-black uppercase mb-4 tracking-widest flex items-center gap-2">
              <Pizza size={14} /> Registrar Refeição Manual
            </div>
            <div className="space-y-3">
              <div className="group relative">
                <input 
                  placeholder="Nome do Alimento / Refeição"
                  className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all italic"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <input 
                  placeholder="Kcal"
                  type="number"
                  className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all italic"
                  value={cal}
                  onChange={e => setCal(e.target.value)}
                />
                <input 
                  placeholder="Proteína (g)"
                  type="number"
                  className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all italic"
                  value={pro}
                  onChange={e => setPro(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {
                  if (name && cal && pro) {
                    onAddMeal(name, parseInt(cal), parseInt(pro), 'lunch');
                    setName(''); setCal(''); setPro('');
                  }
                }}
                disabled={!name || !cal || !pro}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-xs font-black uppercase italic transition-all shadow-lg shadow-amber-600/20 mt-2"
              >
                Injetar no Metabolismo
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: AI SUGGESTIONS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="system-window !border-blue-500/30 p-6 bg-black/60 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sparkles size={120} className="text-blue-500" />
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h4 className="text-blue-400 font-black uppercase italic tracking-widest flex items-center gap-2 text-lg">
                   <Zap size={20} className="animate-pulse" /> Sabedoria do Portal
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recomendações customizadas pelo sistema</p>
              </div>
              <button 
                onClick={fetchRecommendations}
                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} className={loadingAi ? 'animate-spin' : ''} /> {loadingAi ? 'Invocando...' : 'Atualizar Portal'}
              </button>
            </div>

            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-blue-500/20 rounded-2xl bg-blue-500/5">
                <div className="relative">
                   <RefreshCw size={48} className="animate-spin text-blue-500 opacity-50" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Zap size={20} className="text-blue-400 animate-pulse" />
                   </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-blue-400 font-black uppercase italic tracking-widest block mb-1">Processando Dados Biométricos...</span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">Aguarde a resposta do Monarch</span>
                </div>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -5 }}
                    className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group/rec flex flex-col justify-between min-h-[220px] hover:border-blue-500/50 transition-all shadow-xl"
                  >
                     <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 blur-xl opacity-0 group-hover/rec:opacity-100 transition-opacity" />
                     
                     <div>
                       <div className="flex justify-between items-start mb-3">
                         <div className="text-[12px] font-black text-white uppercase italic leading-tight max-w-[80%]">{rec.name}</div>
                         <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400">
                           <Apple size={14} />
                         </div>
                       </div>
                       <div className="flex gap-2 mb-4">
                          <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-black uppercase">{rec.calories} KCAL</span>
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black uppercase">{rec.protein}G P</span>
                       </div>
                       <p className="text-[10px] text-slate-500 italic leading-snug group-hover/rec:text-slate-300 transition-colors line-clamp-4">{rec.description}</p>
                     </div>

                     <div className="flex gap-2 mt-6">
                       <button 
                         onClick={() => onAddMeal(rec.name, rec.calories, rec.protein, 'lunch', rec.recipe)}
                         className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black py-2.5 rounded-xl uppercase italic transition-all shadow-lg shadow-blue-600/10 border border-blue-400/20"
                       >
                         Consumir
                       </button>
                       <button 
                         onClick={() => setSelectedRecipe({ name: rec.name, recipe: rec.recipe })}
                         className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 flex items-center justify-center shrink-0"
                       >
                         <ScrollText size={18} />
                       </button>
                     </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 bg-black/20">
                 <Zap size={40} className="text-slate-800" />
                 <div className="flex flex-col gap-1">
                   <div className="text-slate-700 uppercase font-black italic text-xs tracking-widest">Portal de Sabedoria Inativo</div>
                   <div className="text-[9px] text-slate-800 font-bold uppercase">Clique em atualizar para consultar o Mentor</div>
                 </div>
              </div>
            )}
          </div>

          <div className="system-window !border-amber-500/20 p-6 bg-black/60 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <History size={18} className="text-amber-500" />
                <h4 className="text-slate-300 font-black uppercase italic tracking-widest text-lg">Grimório de Histórico</h4>
              </div>
              <div className="text-[8px] bg-slate-800 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest">
                {meals.length} Registros de Essência
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {meals.length === 0 ? (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-700 uppercase font-black italic text-xs text-center px-10 gap-6 border border-dashed border-slate-800 rounded-2xl">
                  <Utensils size={48} className="opacity-10" />
                  "A força bruta sozinha não faz um Rei. A nutrição é a fundação da sua majestade."
                </div>
              ) : (
                meals.map(meal => (
                  <motion.div 
                    layout
                    key={meal.id} 
                    className="bg-white/5 border border-white/5 p-5 rounded-2xl group/meal hover:bg-white/10 hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white uppercase italic leading-none tracking-tight mb-2">{meal.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Zap size={10} className="text-amber-500" />
                            <span className="text-[10px] text-amber-500/80 font-black uppercase">{meal.calories} KCAL</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity size={10} className="text-blue-400" />
                            <span className="text-[10px] text-blue-400/80 font-black uppercase">{meal.protein}G P</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {meal.recipe && (
                          <button 
                            onClick={() => setSelectedRecipe({ name: meal.name, recipe: meal.recipe! })}
                            className="w-10 h-10 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500/20 transition-all border border-amber-500/20"
                            title="VerGrimório"
                          >
                            <ScrollText size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => onRemoveMeal(meal.id)} 
                          className="w-10 h-10 flex items-center justify-center bg-rose-500/5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/10"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-600 font-bold uppercase italic flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={10} /> Consumido às {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="opacity-40">{new Date(meal.timestamp).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECIPE MODAL */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[#0a0a0c] border border-blue-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.2)]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                    <ScrollText size={24} />
                  </div>
                  <div>
                    <h5 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Grimório de Alquimia</h5>
                    <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-widest mt-1">{selectedRecipe.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="text-[11px] text-slate-400 font-black uppercase mb-6 tracking-[0.2em] flex items-center gap-2 border-l-2 border-blue-500 pl-4 py-1">
                  Instruções de Preparo & Essências
                </div>
                <div className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap bg-white/[0.02] p-6 rounded-2xl border border-white/5 italic">
                  {selectedRecipe.recipe}
                </div>
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/10 to-transparent border-l-4 border-blue-500 rounded-r-2xl">
                  <p className="text-xs text-blue-400 leading-relaxed font-black uppercase italic">
                    "Que esta refeição restaure seu vigor para a próxima dungeon, Caçador. O sistema recompensará sua disciplina."
                  </p>
                </div>
              </div>
              <div className="p-6 bg-black/60 border-t border-white/5 text-center">
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase italic rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  Fechar Grimório de Receita
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const WalkingSection = ({ onLogWalking, history }: { onLogWalking: (km: number) => void, history: WalkingLog[] }) => {
  const [km, setKm] = useState('');

  return (
    <section className="system-window !border-emerald-500/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] -z-10" />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-emerald-500 font-black uppercase italic tracking-tighter text-xl flex items-center gap-2">
          <Wind size={20} className="fill-emerald-500" /> Patrulha e Reconhecimento
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-black/40 px-2 py-1 border border-slate-800 rounded">Caminhada & Distância</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full">
          <p className="text-[10px] text-slate-500 uppercase font-black italic tracking-tight mb-3">
             Hunter, patrulhar perímetros de portais é essencial para sua agilidade e stamina. 
             Registre sua quilometragem aqui.
          </p>
          <div className="flex gap-2">
            <input 
              placeholder="Km percorridos"
              type="number"
              step="0.1"
              value={km}
              onChange={e => setKm(e.target.value)}
              className="bg-black/40 border border-slate-800 rounded px-4 py-2 text-xs focus:border-emerald-500 outline-none w-full italic"
            />
            <button 
              onClick={() => {
                const val = parseFloat(km);
                if (val > 0) {
                  onLogWalking(val);
                  setKm('');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded text-[10px] font-black uppercase italic transition-all whitespace-nowrap"
            >
              Registrar Patrulha
            </button>
          </div>

          <div className="mt-6">
            <div className="text-[8px] text-slate-500 font-black uppercase mb-2 flex justify-between">
              <span>Últimas Patrulhas</span>
              <span>{history.length} Missões</span>
            </div>
            <div className="max-h-[100px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {history.length === 0 ? (
                <div className="py-4 text-center text-slate-700 uppercase font-black italic text-[9px] border border-dashed border-slate-800 rounded">
                  Nenhuma patrulha recente
                </div>
              ) : (
                history.slice(0, 5).map(log => (
                  <div key={log.id} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white italic">{log.distance} KM PERCORRIDOS</span>
                      <span className="text-[8px] text-emerald-500 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 italic">+{log.xpEarned} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-32 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-all">
           <Wind size={24} className="text-emerald-500 mb-1 animate-pulse" />
           <div className="text-[8px] text-slate-500 font-black uppercase tracking-tighter text-center">Exploração Ativa</div>
        </div>
      </div>
    </section>
  );
};

const DungeonsSection = ({ challenges, onToggle }: { challenges: Challenge[], onToggle: (id: string) => void }) => {
  return (
    <section className="system-window !border-rose-600/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 blur-[80px] -z-10" />
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-rose-600 font-black uppercase italic tracking-tighter text-xl flex items-center gap-2">
          <Skull size={20} className="fill-rose-600" /> Calabouços de Sombras
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-black/40 px-2 py-1 border border-slate-800 rounded">Missões de Elite</span>
      </div>

      <div className="space-y-3">
        {challenges.map(challenge => (
          <motion.div 
            key={challenge.id}
            whileHover={{ scale: 1.01 }}
            className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
              challenge.completed 
                ? 'bg-rose-600/10 border-rose-600/30 opacity-60' 
                : 'bg-slate-900/60 border-slate-800 hover:border-rose-600/40 shadow-xl'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  challenge.type === 'boss' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {challenge.type === 'boss' ? 'MISSÃO BOSS' : 'SEMANAL'}
                </span>
                <h4 className={`text-sm font-black uppercase italic tracking-tight ${challenge.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                  {challenge.title}
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">{challenge.description}</p>
            </div>
            
            <div className="flex flex-col items-end gap-2 ml-4">
               <span className="text-xs font-black italic text-rose-500">+{challenge.xpReward} XP</span>
               <button 
                 onClick={() => onToggle(challenge.id)}
                 className={`px-4 py-1.5 rounded text-[10px] font-black uppercase italic transition-all ${
                   challenge.completed 
                    ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                 }`}
                 disabled={challenge.completed}
               >
                 {challenge.completed ? 'Concluído' : 'Atacar'}
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const hasInitialLoadCompleted = React.useRef(false);

  // Persistence Logic
  const [status, setStatus] = useState<HunterStatus>(INITIAL_STATUS);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [walkingHistory, setWalkingHistory] = useState<WalkingLog[]>([]);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'kitchen'>('dashboard');

  // Auth & Session Listener
  useEffect(() => {
    const session = localStorage.getItem('monarch_session');
    if (session) {
      try {
        const { userId, name } = JSON.parse(session);
        if (userId) {
          setUser({ userId, name }); // Temporary user object to trigger sync
          if (name) {
            setStatus(prev => ({ ...prev, name }));
          }
        }
      } catch (e) {
        console.error("Session error:", e);
      }
    }
    setAuthReady(true);
  }, []);

  // Sync Logic (Depends on user.userId)
  useEffect(() => {
    if (!user?.userId) return;

    let unsubs: (() => void)[] = [];
    const userId = user.userId;
    const userRef = doc(db, 'users', userId);
    
    // Profile Sync
    const profileUnsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Syncing profile data from Firestore:", data);
        
        // Specifically update both user and status to ensure names and levels are synced
        setUser(prev => ({ ...prev, ...data }));
        setStatus(prev => {
          // If we just loaded, update lastSavedStatus to prevent an immediate rewrite of what we just got
          const updatedStatus = { 
            ...prev, 
            ...data,
            // Ensure we prioritize incoming data for core progress fields
            level: data.level ?? prev.level,
            xp: data.xp ?? prev.xp,
            maxXp: data.maxXp ?? prev.maxXp,
            unlockedWorkoutIndex: data.unlockedWorkoutIndex ?? prev.unlockedWorkoutIndex,
            activeWorkoutIndex: data.activeWorkoutIndex ?? prev.activeWorkoutIndex,
            week: data.week ?? prev.week,
            stats: data.stats ? { ...prev.stats, ...data.stats } : prev.stats
          };
          lastSavedStatus.current = JSON.stringify(updatedStatus);
          return updatedStatus;
        });
      }
      // Always mark as completed regardless of whether doc exists to allow saving new users
      hasInitialLoadCompleted.current = true;
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      hasInitialLoadCompleted.current = true; 
    });
    unsubs.push(profileUnsub);

    // Quests Sync
    const questsUnsub = onSnapshot(collection(db, 'users', userId, 'quests'), (snap) => {
      const data = snap.docs.map(d => d.data() as Quest);
      if (data.length > 0) {
        setQuests(data);
      } else {
         const initialQuestsArr = getDailyQuests(2);
         setQuests(initialQuestsArr);
         const batch = writeBatch(db);
         initialQuestsArr.forEach(q => {
           const qRef = doc(db, 'users', userId, 'quests', q.id);
           batch.set(qRef, q);
         });
         batch.commit();
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/quests`));
    unsubs.push(questsUnsub);

    // Meals Sync
    const mealsUnsub = onSnapshot(collection(db, 'users', userId, 'meals'), (snap) => {
      const mealsData = snap.docs.map(d => d.data() as Meal);
      mealsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMeals(mealsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/meals`));
    unsubs.push(mealsUnsub);

    // Challenges Sync
    const challengesUnsub = onSnapshot(collection(db, 'users', userId, 'challenges'), (snap) => {
      const data = snap.docs.map(d => d.data() as Challenge);
      if (data.length > 0) {
        setChallenges(data);
      } else {
         const initialChallengesArr = [
           { id: 'c1', title: 'Limpeza de Calabouço', description: 'Complete 5 treinos em uma semana', xpReward: 1000, completed: false, type: 'weekly' },
           { id: 'c2', title: 'Fúria do Monarca', description: 'Treine 3 dias seguidos sem falhar', xpReward: 1500, completed: false, type: 'boss' }
         ] as Challenge[];
         setChallenges(initialChallengesArr);
         const batch = writeBatch(db);
         initialChallengesArr.forEach(c => {
           const cRef = doc(db, 'users', userId, 'challenges', c.id);
           batch.set(cRef, c);
         });
         batch.commit();
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/challenges`));
    unsubs.push(challengesUnsub);

    // Workout History Sync
    const historyUnsub = onSnapshot(collection(db, 'users', userId, 'workout_history'), (snap) => {
      const historyData = snap.docs.map(d => d.data() as WorkoutLog);
      historyData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setWorkoutHistory(historyData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/workout_history`));
    unsubs.push(historyUnsub);

    // Friends Sync
    const friendsUnsub = onSnapshot(collection(db, 'users', userId, 'friends'), (snap) => {
      const friendsData = snap.docs.map(d => d.data() as Friend);
      setFriends(friendsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/friends`));
    unsubs.push(friendsUnsub);

    // Friend Requests Sync
    const requestsUnsub = onSnapshot(collection(db, 'users', userId, 'friend_requests'), (snap) => {
      const requestsData = snap.docs.map(d => d.data() as FriendRequest);
      setFriendRequests(requestsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/friend_requests`));
    unsubs.push(requestsUnsub);

    // Walking History Sync
    const walkingUnsub = onSnapshot(collection(db, 'users', userId, 'walking_history'), (snap) => {
      const walkingData = snap.docs.map(d => d.data() as WalkingLog);
      walkingData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setWalkingHistory(walkingData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/walking_history`));
    unsubs.push(walkingUnsub);

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user?.userId]);

  // Save profile to Firestore only when status changes locally
  // We use a ref to prevent infinite loops from onSnapshot
  const lastSavedStatus = React.useRef<string>('');
  useEffect(() => {
    if (user?.userId && status && status.name && status.name !== 'Carregando...' && status.name !== 'Identificando...' && hasInitialLoadCompleted.current) {
      const statusStr = JSON.stringify(status);
      
      // If we differ from last saved, or if we haven't saved anything yet (new user)
      if (statusStr !== lastSavedStatus.current) {
        console.log("Saving progress to Firestore...", {
          level: status.level,
          xp: status.xp,
          wasEmpty: lastSavedStatus.current === ''
        });
        
        lastSavedStatus.current = statusStr;
        const userRef = doc(db, 'users', user.userId);
        withFirestoreRetry(() => setDoc(userRef, status, { merge: true }))
          .then(() => console.log("Progress saved successfully!"))
          .catch(err => console.error("Erro ao salvar progresso:", err));
      }
    }
  }, [status, user]);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeSkillEffect, setActiveSkillEffect] = useState<string | null>(null);
  
  const setActiveWorkoutIndex = (index: number) => {
    setStatus(prev => ({ ...prev, activeWorkoutIndex: index }));
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState(false);
  
  const [newWorkout, setNewWorkout] = useState<Partial<Workout>>({
    title: '',
    subtitle: '',
    color: 'system-blue',
    exercises: [],
    tags: []
  });

  const workouts = GET_WORKOUTS_FOR_WEEK(status.week);
  const allAvailableWorkouts = React.useMemo(() => {
    // Start with default workouts
    const baseWorkouts = workouts.map(w => {
      // Check if there's an override in customWorkouts
      const override = status.customWorkouts.find(cw => cw.id === w.id);
      return override || w;
    });

    // Add entirely new custom workouts (IDs that are not A, B, C, D, or E)
    const defaultIds = ['A', 'B', 'C', 'D', 'E'];
    const extraCustom = status.customWorkouts.filter(cw => !defaultIds.includes(cw.id));

    return [...baseWorkouts, ...extraCustom];
  }, [workouts, status.customWorkouts]);

  // Titles logic
  const currentTitle = TITLES.find(t => t.id === status.currentTitleId) || TITLES[0];
  const unlockedTitles = TITLES.filter(t => {
    if (t.id === 'none') return true;
    const stats = status.stats;
    return Object.entries(t.requiredStats).every(([key, value]) => {
      const statKey = key as keyof WorkoutStats;
      return (stats[statKey] || 0) >= value;
    });
  });

  // Items logic
  const unlockedItems = SPECIAL_ITEMS.filter(item => {
    const stats = status.stats;
    return Object.entries(item.requiredStats).every(([key, value]) => {
      const statKey = key as keyof WorkoutStats;
      return (stats[statKey] || 0) >= value;
    });
  });

  // Component level effect to sync inventory if items unlock
  useEffect(() => {
    if (unlockedItems.length > status.inventory.length) {
      setStatus(prev => ({
        ...prev,
        inventory: unlockedItems.map(item => item.id)
      }));
    }
  }, [unlockedItems.length]);

  // Phase Name helper
  const phaseName = status.week <= 4 
    ? "Fase de Adaptação" 
    : status.week <= 8 
      ? "Fase de Hipertrofia" 
      : "Fase de Ascensão Brutal";

  // Check for Level Up
  useEffect(() => {
    if (status.xp >= status.maxXp) {
      handleLevelUp();
    }
  }, [status.xp, status.maxXp]);

  const handleLevelUp = () => {
    setShowLevelUp(true);
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        level: prev.level + 1,
        xp: prev.xp - prev.maxXp,
        maxXp: Math.floor(prev.maxXp * 1.2),
        pointsToDistribute: prev.pointsToDistribute + 3
      }));
      setShowLevelUp(false);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('monarch_session');
    setUser(null);
    window.location.reload(); // Reset state completely
  };

  const handleLoginSuccess = (userData: any) => {
    const finalUserId = userData.userId || userData.name || 'anonymous';
    const finalUserData = { ...userData, userId: finalUserId };
    
    console.log("Login Success, initializing session:", finalUserId);
    
    localStorage.setItem('monarch_session', JSON.stringify({ 
      userId: finalUserId, 
      name: finalUserData.name 
    }));
    
    setUser(finalUserData);
    
    // Immediately update status with identity info to avoid 'Caçador' placeholder
    setStatus(prev => {
      const updated = { 
        ...prev, 
        ...finalUserData,
        name: finalUserData.name || finalUserId || prev.name 
      };
      lastSavedStatus.current = JSON.stringify(updated);
      return updated;
    });
  };

  const rerollQuests = () => {
    // Only allow if no quests are completed or as a special perk
    const hasCompleted = quests.some(q => q.completed);
    if (hasCompleted && !window.confirm("Você já completou missões. Trocar agora perderá o progresso das atuais. Continuar?")) {
      return;
    }
    const newQuests = getDailyQuests(2);
    setQuests(newQuests);
    
    if (user) {
      const batch = writeBatch(db);
      newQuests.forEach(q => {
        const qRef = doc(db, 'users', user.userId, 'quests', q.id);
        batch.set(qRef, q);
      });
      batch.commit();
    }
  };

  const toggleQuest = (id: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id) {
        if (!q.completed) {
          setStatus(s => ({ ...s, xp: s.xp + q.xpReward }));
        } else {
          setStatus(s => ({ ...s, xp: Math.max(0, s.xp - q.xpReward) }));
        }
        const updated = { ...q, completed: !q.completed };
        if (user) {
          withFirestoreRetry(() => setDoc(doc(db, 'users', user.userId, 'quests', id), updated));
        }
        return updated;
      }
      return q;
    }));
  };

  const addMeal = (name: string, calories: number, protein: number, type: Meal['type'], recipe?: string) => {
    const newMeal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      calories,
      protein,
      type,
      timestamp: new Date().toISOString(),
      recipe
    };
    setMeals(prev => [newMeal, ...prev]);
    if (user) {
      withFirestoreRetry(() => setDoc(doc(db, 'users', user.userId, 'meals', newMeal.id), newMeal));
    }
  };

  const handleUpdateGoal = (goal: HunterStatus['goal']) => {
    setStatus(prev => ({ ...prev, goal }));
  };

  const handleLogWalking = (km: number) => {
    if (!user?.userId) return;
    const xpReward = Math.floor(km * 200);
    const newLog: WalkingLog = {
      id: `walk-${Date.now()}`,
      distance: km,
      timestamp: new Date().toISOString(),
      xpEarned: xpReward
    };

    // Update global status (XP and level up logic is already elsewhere but we can trigger it here)
    setStatus(s => {
      const newXp = s.xp + xpReward;
      return { ...s, xp: newXp };
    });

    withFirestoreRetry(() => setDoc(doc(db, 'users', user.userId, 'walking_history', newLog.id), newLog))
      .catch(err => console.error("Erro ao salvar log de caminhada:", err));
    
    alert(`Patrulha finalizada! +${xpReward} XP por percorrer ${km} km.`);
  };

  const removeMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
    if (user) {
      deleteDoc(doc(db, 'users', user.userId, 'meals', id));
    }
  };

  const toggleChallenge = (id: string) => {
    setChallenges(prev => prev.map(c => {
      if (c.id === id) {
        if (!c.completed) {
          setStatus(s => ({ ...s, xp: s.xp + c.xpReward }));
        } else {
          setStatus(s => ({ ...s, xp: Math.max(0, s.xp - c.xpReward) }));
        }
        const updated = { ...c, completed: !c.completed };
        if (user) {
          withFirestoreRetry(() => setDoc(doc(db, 'users', user.userId, 'challenges', id), updated));
        }
        return updated;
      }
      return c;
    }));
  };

  const distributePoint = (attr: keyof Attributes) => {
    if (status.pointsToDistribute > 0 && status.attributes[attr] < 100) {
      setStatus(prev => ({
        ...prev,
        pointsToDistribute: prev.pointsToDistribute - 1,
        attributes: {
          ...prev.attributes,
          [attr]: prev.attributes[attr] + 1
        }
      }));
    }
  };

  const distributeMultiplePoints = (attr: keyof Attributes, amount: number) => {
    setStatus(prev => {
      const finalAmount = Math.min(amount, prev.pointsToDistribute, 100 - prev.attributes[attr]);
      if (finalAmount <= 0) return prev;

      return {
        ...prev,
        pointsToDistribute: prev.pointsToDistribute - finalAmount,
        attributes: {
          ...prev.attributes,
          [attr]: prev.attributes[attr] + finalAmount
        }
      };
    });
  };

  const resetAttributes = () => {
    setStatus(prev => {
      const currentSum = 
        prev.attributes.strength + 
        prev.attributes.vitality + 
        prev.attributes.agility + 
        prev.attributes.intelligence;
      
      const initialSum = 
        INITIAL_STATUS.attributes.strength + 
        INITIAL_STATUS.attributes.vitality + 
        INITIAL_STATUS.attributes.agility + 
        INITIAL_STATUS.attributes.intelligence;
      
      const earnedPoints = currentSum - initialSum;
      
      if (earnedPoints <= 0 && prev.pointsToDistribute === INITIAL_STATUS.pointsToDistribute) {
        return prev;
      }

      return {
        ...prev,
        attributes: { ...INITIAL_STATUS.attributes },
        pointsToDistribute: INITIAL_STATUS.pointsToDistribute + earnedPoints + (prev.pointsToDistribute - INITIAL_STATUS.pointsToDistribute)
      };
    });
  };

  const completeWorkout = () => {
    const activeWorkout = allAvailableWorkouts[status.activeWorkoutIndex];
    if (!activeWorkout) return;

    const isCurrentActiveUnlocked = status.activeWorkoutIndex === status.unlockedWorkoutIndex;
    const isLastWorkoutOfWeek = status.activeWorkoutIndex === workouts.length - 1;
    
    // XP reward for completing a workout
    const workoutXp = 800;
    
    setStatus(prev => {
      let nextUnlocked = prev.unlockedWorkoutIndex;
      let nextWeek = prev.week;

      // Update stats
      const newStats = { ...prev.stats };
      activeWorkout.tags.forEach(tag => {
        if (tag in newStats) {
          newStats[tag as keyof WorkoutStats] += 1;
        }
      });
      newStats.total += 1;

      if (isCurrentActiveUnlocked) {
        if (isLastWorkoutOfWeek) {
          // Reset for a new week
          nextUnlocked = 0;
          nextWeek += 1;
        } else if (status.activeWorkoutIndex < workouts.length - 1) {
          nextUnlocked += 1;
        }
      }
      
      return {
        ...prev,
        xp: prev.xp + workoutXp,
        unlockedWorkoutIndex: nextUnlocked,
        activeWorkoutIndex: isLastWorkoutOfWeek ? 0 : (prev.activeWorkoutIndex + 1) % allAvailableWorkouts.length,
        week: nextWeek,
        stats: newStats
      };
    });

    // Save workout to log
    if (user?.userId) {
      const logEntry: WorkoutLog = {
        id: `log-${Date.now()}`,
        workoutId: activeWorkout.id,
        workoutTitle: activeWorkout.title,
        timestamp: new Date().toISOString(),
        week: status.week,
        xpEarned: workoutXp
      };
      console.log("Logging workout:", logEntry);
      withFirestoreRetry(() => setDoc(doc(db, 'users', user.userId, 'workout_history', logEntry.id), logEntry))
        .then(() => console.log("Workout logged successfully"))
        .catch(err => console.error("Erro ao salvar log de treino:", err));
    }
  };

  const addCustomWorkout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingWorkout || !newWorkout.title) return;
    
    setIsSubmittingWorkout(true);
    
    try {
      // Check if we are editing an existing custom workout OR overriding a default one
      const isEdit = newWorkout.id && (
      ['A', 'B', 'C', 'D', 'E'].includes(newWorkout.id) || 
      status.customWorkouts.some(w => w.id === newWorkout.id)
    );

    if (isEdit) {
      setStatus(prev => {
        // If it's a default workout being edited for the first time, it might not be in customWorkouts yet
        const existsInCustom = prev.customWorkouts.some(cw => cw.id === newWorkout.id);
        
        if (existsInCustom) {
          return {
            ...prev,
            customWorkouts: prev.customWorkouts.map(w => w.id === newWorkout.id ? { ...newWorkout, isCustom: true } as Workout : w)
          };
        } else {
          return {
            ...prev,
            customWorkouts: [...prev.customWorkouts, { ...newWorkout, isCustom: true } as Workout]
          };
        }
      });
    } else {
      const workout: Workout = {
        id: `custom-${Date.now()}`,
        title: newWorkout.title || 'Novo Treino',
        subtitle: newWorkout.subtitle || 'Personalizado',
        color: newWorkout.color || 'system-blue',
        exercises: newWorkout.exercises || [],
        tags: newWorkout.tags || ['total'],
        isCustom: true
      };

      setStatus(prev => ({
        ...prev,
        customWorkouts: [...prev.customWorkouts, workout]
      }));
    }
    
    setShowCreateModal(false);
    // Reset state carefully
    setTimeout(() => {
      setNewWorkout({ title: '', subtitle: '', exercises: [], tags: [] });
    }, 100);
  } finally {
    setIsSubmittingWorkout(false);
  }
};

  const activateSkill = (skillId: string) => {
    setActiveSkillEffect(skillId);
    setShowSkillModal(false);
    setTimeout(() => setActiveSkillEffect(null), 3500);
  };

  const deleteCustomWorkout = (id: string) => {
    setStatus(prev => {
      const nextCustom = prev.customWorkouts.filter(w => w.id !== id);
      let nextActive = prev.activeWorkoutIndex;
      
      if (nextActive >= workouts.length + nextCustom.length) {
        nextActive = Math.max(0, workouts.length + nextCustom.length - 1);
      }

      return {
        ...prev,
        customWorkouts: nextCustom,
        activeWorkoutIndex: nextActive
      };
    });
  };

  const sendFriendRequest = async (targetId: string) => {
    if (!user?.userId || !targetId || targetId === user.userId) return false;
    const sanitizedId = targetId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    const requestId = `req-${Date.now()}-${user.userId}`;
    const request: FriendRequest = {
      id: requestId,
      fromUserId: user.userId,
      fromName: status.name,
      toUserId: sanitizedId,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    try {
      // Check if user exists
      const userSnap = await withFirestoreRetry(() => getDoc(doc(db, 'users', sanitizedId)));
      if (!userSnap.exists()) {
        throw new Error("Caçador não encontrado.");
      }

      await withFirestoreRetry(() => setDoc(doc(db, 'users', sanitizedId, 'friend_requests', requestId), request));
      return true;
    } catch (e: any) {
      console.error("Error sending request:", e);
      alert(e.message || "Erro ao enviar pedido.");
      return false;
    }
  };

  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user?.userId) return;
    
    try {
      const friendSnap = await withFirestoreRetry(() => getDoc(doc(db, 'users', request.fromUserId)));
      const friendData = friendSnap.exists() ? friendSnap.data() as HunterStatus : null;
      
      const friendEntry: Friend = {
        userId: request.fromUserId,
        name: request.fromName,
        level: friendData?.level || 1,
        currentTitleId: friendData?.currentTitleId || 'none',
        stats: friendData?.stats || INITIAL_STATUS.stats
      };

      await withFirestoreRetry(() => setDoc(doc(db, 'users', user.userId, 'friends', request.fromUserId), friendEntry));
      
      const myEntry: Friend = {
        userId: user.userId,
        name: status.name,
        level: status.level,
        currentTitleId: status.currentTitleId,
        stats: status.stats
      };
      await withFirestoreRetry(() => setDoc(doc(db, 'users', request.fromUserId, 'friends', user.userId), myEntry));

      await withFirestoreRetry(() => deleteDoc(doc(db, 'users', user.userId, 'friend_requests', request.id)));
    } catch (e) {
      console.error("Error accepting request:", e);
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    if (!user?.userId) return;
    await withFirestoreRetry(() => deleteDoc(doc(db, 'users', user.userId, 'friend_requests', requestId)));
  };

  const renderIcon = (iconName: string, size = 20) => {
    switch (iconName) {
      case 'Milk': return <Milk size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'Shield': return <Shield size={size} />;
      case 'Activity': return <Activity size={size} />;
      case 'Flame': return <Flame size={size} />;
      case 'ThermometerSnowflake': return <ThermometerSnowflake size={size} />;
      case 'Snowflake': return <Snowflake size={size} />;
      case 'FlaskConical': return <FlaskConical size={size} />;
      case 'PawPrint': return <PawPrint size={size} />;
      case 'GripHorizontal': return <GripHorizontal size={size} />;
      case 'Skull': return <Skull size={size} />;
      case 'Users': return <Users size={size} />;
      case 'PowerIcon': return <PowerIcon size={size} />;
      case 'Ghost': return <Ghost size={size} />;
      case 'Eye': return <Eye size={size} />;
      case 'Wind': return <Wind size={size} />;
      case 'Fingerprint': return <Fingerprint size={size} />;
      case 'Brain': return <Brain size={size} />;
      case 'Dumbbell': return <GymIcon size={size} />;
      case 'ChevronsUp': return <ChevronsUp size={size} />;
      case 'Droplet': return <Droplet size={size} />;
      case 'Coffee': return <Coffee size={size} />;
      case 'Utensils': return <Utensils size={size} />;
      case 'TrendingUp': return <TrendingUp size={size} />;
      case 'Skull': return <Skull size={size} />;
      case 'Pizza': return <Pizza size={size} />;
      case 'Apple': return <Apple size={size} />;
      case 'Zap': return <Zap size={size} />;
      default: return <GymIcon size={size} />;
    }
  };

  const currentWorkout = allAvailableWorkouts[status.activeWorkoutIndex] || workouts[0];

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <RefreshCw size={48} className="text-system-purple animate-spin" strokeWidth={1} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-system-purple/30 font-sans">
      
      {/* HEADER / STATUS SECTION */}
      <header className="mb-8 relative z-50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div className="relative z-[60]">
            <motion.p 
              key={status.week}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-system-blue text-sm tracking-widest uppercase italic font-bold flex items-center gap-2"
            >
              Semana {status.week} • <span className="opacity-70">{phaseName}</span>
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black uppercase flex items-center gap-4 flex-wrap tracking-tighter"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-system-blue uppercase font-black tracking-[0.4em] mb-1 opacity-70">
                  Codinome de Caçador
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    {status.name}
                  </span>
                  <span className="text-system-blue text-2xl md:text-3xl font-black italic bg-system-blue/10 px-3 py-1 rounded border border-system-blue/30 shadow-[0_0_20px_rgba(30,144,255,0.1)]">
                    Lvl.{status.level}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => activateSkill('arise')}
                className="px-4 py-1.5 bg-purple-600/20 border border-purple-500/50 rounded-lg text-[10px] text-purple-400 font-black uppercase italic tracking-tighter hover:bg-purple-600/40 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              >
                <Ghost size={14} className="group-hover:scale-110 transition-transform" /> Erga-se (Arise)
              </button>

              <button 
                onClick={() => setShowSocialModal(true)}
                className="px-4 py-1.5 bg-blue-600/20 border border-blue-500/50 rounded-lg text-[10px] text-blue-400 font-black uppercase italic tracking-tighter hover:bg-blue-600/40 transition-all flex items-center gap-2 group shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              >
                <Users size={14} className="group-hover:scale-110 transition-transform" /> Arise Social
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 text-[8px] items-center justify-center text-white">{friendRequests.length}</span>
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveView(prev => prev === 'dashboard' ? 'kitchen' : 'dashboard')}
                className={`px-4 py-1.5 border rounded-lg text-[10px] font-black uppercase italic tracking-tighter transition-all flex items-center gap-2 group ${
                  activeView === 'kitchen' 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'bg-amber-600/20 border-amber-500/50 text-amber-500 hover:bg-amber-600/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                }`}
              >
                {activeView === 'kitchen' ? <Home size={14} /> : <Utensils size={14} />}
                {activeView === 'kitchen' ? 'Sair da Cozinha' : 'Cozinha do Monarca'}
              </button>

              <button 
                onClick={handleLogout}
                className="ml-auto p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-rose-500 transition-all"
                title="Sair do Sistema"
              >
                <LogOut size={20} />
              </button>
            </motion.h1>
            <motion.button
              onClick={() => setShowTitleModal(true)}
              style={{ 
                textShadow: currentTitle.glowColor ? `0 0 10px ${currentTitle.glowColor}` : 'none'
              }}
              className={`mt-2 ${currentTitle.color || 'text-system-blue'} text-sm uppercase font-black italic flex items-center gap-2 hover:opacity-80 transition-opacity`}
            >
              <Award size={16} /> Titulo: {currentTitle.name}
            </motion.button>
          </div>
          <div className="md:text-right">
            <span className="text-xs text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-1 border border-slate-800 rounded">
              Temporada {Math.ceil(status.week / 4)}
            </span>
          </div>
        </div>

        {/* XP BAR */}
        <div className="relative">
          <div className="w-full bg-slate-900/50 h-5 rounded-full overflow-hidden border border-slate-800 backdrop-blur-sm shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(status.xp / status.maxXp) * 100}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
              className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
          </div>
          <div className="flex justify-between items-center mt-2 px-1 text-xs">
            <span className="text-slate-500 italic uppercase">Experiência Atual</span>
            <span className="text-system-blue font-bold tracking-widest">
              XP: {status.xp} / {status.maxXp}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* STATS PANEL */}
        {activeView === 'dashboard' && (
          <aside className="lg:col-span-4 flex flex-col gap-6">
          <section className="system-window relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Zap size={100} />
            </div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-system-blue font-bold uppercase tracking-tighter text-lg flex items-center gap-2">
                <Trophy size={18} /> Atributos Atuais
              </h3>
              {status.pointsToDistribute > 0 && (
                <motion.span 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="bg-system-blue text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
                >
                  +{status.pointsToDistribute} PONTOS
                </motion.span>
              )}
            </div>
            
            <div className="space-y-4">
              <AttributeRow 
                label="FORÇA (FOR)" 
                value={status.attributes.strength} 
                icon={<Dumbbell size={16} />} 
                onAdd={() => distributePoint('strength')}
                onAddMultiple={(amount) => distributeMultiplePoints('strength', amount)}
                canAdd={status.pointsToDistribute > 0 && status.attributes.strength < 100}
              />
              <AttributeRow 
                label="VITALIDADE (VIT)" 
                value={status.attributes.vitality} 
                icon={<Shield size={16} />} 
                onAdd={() => distributePoint('vitality')}
                onAddMultiple={(amount) => distributeMultiplePoints('vitality', amount)}
                canAdd={status.pointsToDistribute > 0 && status.attributes.vitality < 100}
              />
              <AttributeRow 
                label="AGILIDADE (AGI)" 
                value={status.attributes.agility} 
                icon={<Zap size={16} />} 
                onAdd={() => distributePoint('agility')}
                onAddMultiple={(amount) => distributeMultiplePoints('agility', amount)}
                canAdd={status.pointsToDistribute > 0 && status.attributes.agility < 100}
              />
              <AttributeRow 
                label="INTELIGÊNCIA (INT)" 
                value={status.attributes.intelligence} 
                icon={<Brain size={16} />} 
                onAdd={() => distributePoint('intelligence')}
                onAddMultiple={(amount) => distributeMultiplePoints('intelligence', amount)}
                canAdd={status.pointsToDistribute > 0 && status.attributes.intelligence < 100}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={resetAttributes}
                className="w-full py-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 uppercase text-[10px] font-bold tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} /> Resetar Atributos
              </button>
              
              <button 
                onClick={() => setShowSkillModal(true)}
                className="w-full py-3 bg-system-blue/10 border border-system-blue/30 text-system-blue hover:bg-system-blue hover:text-white transition-all duration-300 uppercase text-sm font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <PowerIcon size={16} /> Habilidades Especiais
              </button>
            </div>
          </section>

          {/* ITEM MINI-PANEL */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-slate-500 text-xs uppercase tracking-widest font-bold">Inventário de Itens</h4>
              <button 
                onClick={() => setShowInventoryModal(true)}
                className="text-[10px] text-system-blue uppercase font-black hover:underline"
              >
                Ver Tudo
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => {
                const item = unlockedItems[i];
                return (
                  <div 
                    key={i} 
                    onClick={() => { if (item) { setSelectedItem(item); setShowInventoryModal(true); } }}
                    style={{ 
                      boxShadow: item ? `0 0 10px ${item.glowColor}` : 'none',
                      borderColor: item ? item.glowColor : undefined
                    }}
                    className={`aspect-square bg-slate-900 border rounded flex items-center justify-center transition-all cursor-pointer ${
                      item 
                        ? `${item.color || 'text-system-blue'} shadow-[inset_0_0_10px_rgba(59,130,246,0.1)] hover:scale-110` 
                        : 'border-slate-800 text-slate-800'
                    }`}
                  >
                    {item ? renderIcon(item.icon, 18) : <div className="w-1 h-1 bg-slate-800 rounded-full" />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* PROGRESS STATS */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
            <h4 className="text-slate-500 text-xs uppercase mb-3 tracking-widest font-bold flex items-center gap-2">
              <History size={14} /> Histórico de Treino
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(status.stats).filter(([k]) => k !== 'total').map(([key, val]) => (
                <div key={key} className="bg-slate-900 p-2 rounded border border-slate-800/50">
                  <div className="text-[9px] text-slate-500 uppercase font-black">{key}</div>
                  <div className="text-sm font-bold text-system-blue">{val}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 uppercase font-black">Total Acumulado</span>
              <span className="text-sm font-black text-white">{status.stats.total}</span>
            </div>

            {/* Recent Sessions Log */}
            {workoutHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/50">
                <h5 className="text-[9px] text-slate-500 uppercase font-black mb-2">Sessões Recentes</h5>
                <div className="flex flex-col gap-2">
                  {workoutHistory.slice(0, 3).map(log => (
                    <div key={log.id} className="flex justify-between items-center text-[10px] bg-black/20 p-1.5 rounded border border-slate-800/30">
                      <div className="flex flex-col">
                        <span className="text-white font-bold truncate max-w-[100px]">{log.workoutTitle}</span>
                        <span className="text-slate-600 font-mono">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span className="text-system-purple font-black">+{log.xpEarned} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>
        )}

        {/* MAIN CONTENT AREA */}
        <main className={`${activeView === 'dashboard' ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-6`}>
          {activeView === 'dashboard' ? (
            <>
              {/* DAILY QUESTS */}
          <section className="system-window !border-system-purple relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-system-purple/5 blur-[80px] -z-10" />
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="text-system-purple font-black uppercase italic tracking-tighter text-xl flex items-center gap-2">
                  <Zap size={20} className="fill-system-purple" /> Missões Diárias
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-7">Sincronização com o Monarca</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={rerollQuests}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-system-purple transition-all group/reroll"
                  title="Rolar novas missões"
                >
                  <RefreshCw size={16} className="group-hover/reroll:rotate-180 transition-transform duration-500" />
                </button>
                <div className="text-[10px] text-slate-500 border border-slate-800 px-3 py-1 rounded-full uppercase font-black tracking-widest bg-black/20">
                  Novas em 14:22:05
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quests.map(quest => {
                const rarityColors = {
                  common: 'border-slate-800 text-slate-400',
                  rare: 'border-blue-500/30 text-blue-400',
                  epic: 'border-purple-500/40 text-purple-400',
                  legendary: 'border-yellow-500/50 text-yellow-500'
                };
                
                const rarityLabel = {
                  common: 'Comum',
                  rare: 'Raro',
                  epic: 'Épico',
                  legendary: 'Lendário'
                };

                return (
                  <motion.div 
                    key={quest.id}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                      quest.completed 
                        ? 'bg-system-purple/10 border-system-purple/40 opacity-80' 
                        : `bg-slate-900/40 ${rarityColors[quest.rarity || 'common']} hover:bg-slate-800/60 shadow-lg`
                    }`}
                    onClick={() => toggleQuest(quest.id)}
                  >
                    {/* Progress Background */}
                    {quest.completed && <div className="absolute inset-0 bg-system-purple/5 animate-pulse" />}
                    
                    <div className="flex items-start justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${quest.completed ? 'bg-system-purple/20' : 'bg-black/40'}`}>
                            {renderIcon(quest.icon || 'Zap', 18)}
                          </div>
                          <div>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${
                                quest.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-500' :
                                quest.rarity === 'epic' ? 'bg-purple-500/20 text-purple-500' :
                                quest.rarity === 'rare' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {rarityLabel[quest.rarity || 'common']}
                            </span>
                            <div className={`text-[10px] text-slate-500 font-bold uppercase mt-1`}>
                              {quest.category}
                            </div>
                          </div>
                       </div>
                       {quest.completed ? <CheckCircle2 size={18} className="text-system-purple" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700" />}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-black italic uppercase tracking-tight leading-tight ${quest.completed ? 'line-through opacity-50' : 'text-white'}`}>
                        {quest.title}
                      </span>
                      <div className="flex justify-between items-end mt-2">
                        <span className={`text-[10px] font-black tracking-widest ${quest.completed ? 'text-slate-500' : 'text-system-purple'}`}>
                          +{quest.xpReward} XP
                        </span>
                        {!quest.completed && (
                          <div className="text-[8px] text-slate-600 font-bold uppercase">Toque para completar</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* WORKOUT SELECTION TABS */}
          <section className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {allAvailableWorkouts.map((workout, idx) => {
              const isCustom = 'isCustom' in workout && workout.isCustom;
              const isDefaultOverride = ['A', 'B', 'C', 'D', 'E'].includes(workout.id);
              const isUnlocked = idx < workouts.length ? idx <= status.unlockedWorkoutIndex : true;
              const isActive = idx === status.activeWorkoutIndex;
              
              return (
                <div key={workout.id} className="relative group shrink-0">
                  <button
                    disabled={!isUnlocked}
                    onClick={() => setActiveWorkoutIndex(idx)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-lg border transition-all uppercase font-black italic tracking-tighter ${
                      isActive 
                        ? `bg-slate-800 border-system-blue text-system-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]` 
                        : isUnlocked 
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700' 
                          : 'bg-black/50 border-slate-900 text-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xl">{['A', 'B', 'C', 'D', 'E'].includes(workout.id) ? workout.id : '★'}</span>
                    <div className="text-left">
                      <div className="text-[10px] leading-none opacity-50">{isCustom ? 'Personalizado' : 'Workshop'}</div>
                      <div className="text-sm">TREINO</div>
                    </div>
                    {!isUnlocked && <Lock size={14} />}
                  </button>
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setNewWorkout(workout);
                        setShowCreateModal(true);
                      }}
                      className="bg-blue-600 text-white p-1 rounded-full shadow-lg"
                      title="Editar Treino"
                    >
                      <Settings2 size={12} />
                    </button>
                    {(isCustom && !isDefaultOverride) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteCustomWorkout(workout.id); }}
                        className="bg-rose-500 text-white p-1 rounded-full shadow-lg"
                        title="Remover Treino"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => {
                setNewWorkout({ title: '', subtitle: '', exercises: [{ name: '', sets: 3, reps: '10', weight: '0kg', rest: '60s' }], tags: ['total'] });
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-system-blue hover:text-system-blue transition-all shrink-0 uppercase font-black italic tracking-tighter"
            >
              <Plus size={20} />
              <span>Criar Treino</span>
            </button>
          </section>

          {/* ACTIVE WORKOUT SHEET */}
          <AnimatePresence mode="wait">
            <motion.section 
              key={status.activeWorkoutIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="system-window overflow-x-auto"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-3xl font-black text-system-blue uppercase italic tracking-tighter leading-none mb-1">
                    {currentWorkout.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Droplet size={12} /> {currentWorkout.subtitle}
                    </p>
                    {currentWorkout.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-800/50 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-tighter">
                        {tag}
                      </span>
                    ))}
                    <button 
                      onClick={() => {
                        setNewWorkout(currentWorkout);
                        setShowCreateModal(true);
                      }}
                      className="text-[10px] text-system-blue flex items-center gap-1 hover:underline ml-2"
                    >
                      <Settings2 size={12} /> Editar
                    </button>
                  </div>
                </div>
                <div className="bg-system-blue text-white px-4 py-1.5 text-[11px] font-black rounded italic tracking-widest shrink-0 shadow-lg neon-glow flex items-center gap-2">
                  TREINAMENTO DE ELITE <ChevronRight size={14} />
                </div>
              </div>

              <table className="w-full text-left min-w-[500px]">
                <thead className="text-[11px] text-slate-500 border-b border-slate-800/50 uppercase tracking-widest">
                  <tr>
                    <th className="pb-4 font-black">Exercício</th>
                    <th className="pb-4 text-center font-black">Séries</th>
                    <th className="pb-4 text-center font-black">Reps</th>
                    <th className="pb-4 text-center font-black">Carga</th>
                    <th className="pb-4 text-center font-black">Descanso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {currentWorkout.exercises.map((ex, idx) => (
                    <tr key={idx} className="group hover:bg-system-blue/5 transition-all duration-300">
                      <td className="py-5 font-bold text-lg group-hover:text-system-blue transition-colors">
                        {ex.name}
                      </td>
                      <td className="text-center font-mono text-slate-400">{ex.sets}</td>
                      <td className="text-center font-mono font-medium">{ex.reps}</td>
                      <td className="text-center">
                        <span className="text-system-blue font-black font-mono text-lg">{ex.weight}</span>
                      </td>
                      <td className="text-center text-slate-500 font-mono text-xs">{ex.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={completeWorkout}
                  className="flex items-center gap-2 px-8 py-4 bg-system-blue text-white font-black uppercase italic tracking-widest rounded transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                >
                  <Dumbbell size={20} /> Concluir Treino de Hoje
                </button>
              </div>
            </motion.section>
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <WalkingSection onLogWalking={handleLogWalking} history={walkingHistory} />
            <DungeonsSection 
              challenges={challenges} 
              onToggle={toggleChallenge} 
            />
          </div>
        </>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <NutritionSection 
              meals={meals} 
              goal={status.goal}
              onAddMeal={addMeal} 
              onRemoveMeal={removeMeal} 
              onUpdateGoal={handleUpdateGoal}
            />
          </motion.div>
        )}
      </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 py-8 border-t border-slate-800 text-center">
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.3em] font-medium italic">
          O Despertar de um Mono-Player &copy; 2026 Sistema Monarch
        </p>
      </footer>

      <AnimatePresence>
        {/* TITLES MODAL */}
        {showTitleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowTitleModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-system-blue rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <Award size={24} className="text-system-blue" />
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Sistema de Títulos</h2>
                </div>
                <button onClick={() => setShowTitleModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="grid gap-4">
                {TITLES.map(title => {
                  const unlocked = unlockedTitles.some(t => t.id === title.id);
                  const isCurrent = status.currentTitleId === title.id;
                  
                  return (
                    <div 
                      key={title.id}
                      style={{ 
                        boxShadow: unlocked && title.glowColor ? `0 0 15px ${title.glowColor}` : 'none',
                        borderColor: unlocked && title.glowColor ? title.glowColor : undefined
                      }}
                      className={`relative p-4 rounded-lg border transition-all ${
                        unlocked 
                          ? `bg-slate-800 ${title.glowColor ? 'border-opacity-50' : 'border-system-blue/30'}` 
                          : 'bg-black/50 border-slate-800 opacity-60'
                      } ${isCurrent ? 'ring-2 ring-system-blue' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className={`text-lg font-black uppercase italic ${unlocked ? (title.color || 'text-system-blue') : 'text-slate-500'}`}>
                            {title.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">{title.description}</p>
                        </div>
                        {unlocked ? (
                          <button 
                            onClick={() => setStatus(s => ({ ...s, currentTitleId: title.id }))}
                            className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                              isCurrent 
                                ? 'bg-system-blue text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-system-blue hover:text-white'
                            }`}
                          >
                            {isCurrent ? 'Equipado' : 'Equipar'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-black uppercase italic">
                            <Lock size={12} /> Bloqueado
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-800/50">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Requisito:</p>
                        <p className="text-xs text-slate-300 font-medium">{title.requirement}</p>
                        
                        {!unlocked && Object.keys(title.requiredStats).length > 0 && (
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(title.requiredStats).map(([stat, requiredValue]) => {
                              const currentVal = status.stats[stat as keyof WorkoutStats] || 0;
                              const progress = Math.min(100, (currentVal / requiredValue) * 100);
                              return (
                                <div key={stat} className="space-y-1">
                                  <div className="flex justify-between text-[8px] uppercase font-black tracking-widest">
                                    <span>{stat}</span>
                                    <span>{currentVal}/{requiredValue}</span>
                                  </div>
                                  <div className="h-1 bg-black rounded-full overflow-hidden">
                                    <div className="h-full bg-system-blue" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* INVENTORY MODAL */}
        {showInventoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowInventoryModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-system-blue rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <GymIcon size={24} className="text-system-blue" />
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Depósito de Equipamentos</h2>
                </div>
                <button onClick={() => setShowInventoryModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Item List */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 h-fit">
                  {SPECIAL_ITEMS.map(item => {
                    const unlocked = status.inventory.includes(item.id);
                    const selected = selectedItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        style={{ 
                          boxShadow: unlocked && selected && item.glowColor ? `0 0 20px ${item.glowColor}` : 'none',
                          borderColor: unlocked && item.glowColor ? item.glowColor : undefined
                        }}
                        className={`p-4 rounded-lg border flex flex-col items-center gap-3 transition-all ${
                          unlocked 
                            ? selected 
                              ? 'bg-slate-800 shadow-neon'
                              : 'bg-slate-800 border-slate-700 hover:border-opacity-100'
                            : 'bg-black/50 border-slate-900 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className={`p-4 rounded-lg bg-slate-900 ${unlocked ? (item.color || 'text-system-blue') : 'text-slate-700'}`}>
                          {renderIcon(item.icon, 32)}
                        </div>
                        <div className="text-center">
                          <div className={`text-[10px] font-black uppercase italic leading-tight ${unlocked ? (item.color || 'text-white') : 'text-slate-600'}`}>
                            {item.name}
                          </div>
                          {!unlocked && <div className="text-[8px] text-rose-500 flex items-center justify-center gap-1 mt-1"><Lock size={8} /> Bloqueado</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Item Detail */}
                <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-6 flex flex-col h-full min-h-[300px]">
                  {selectedItem ? (
                    <div className="flex flex-col h-full">
                      <div className="flex flex-col items-center gap-4 mb-6">
                        <div 
                          style={{ 
                            boxShadow: `0 0 30px ${selectedItem.glowColor}`,
                            borderColor: selectedItem.glowColor 
                          }}
                          className={`p-6 bg-slate-900 rounded-full ${selectedItem.color || 'text-system-blue'} border`}
                        >
                          {renderIcon(selectedItem.icon, 48)}
                        </div>
                        <h3 className={`text-xl font-black uppercase italic text-center tracking-tighter ${selectedItem.color || 'text-system-blue'}`}>
                          {selectedItem.name}
                        </h3>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Descrição</p>
                          <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedItem.description}"</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Requisito para Desbloqueio</p>
                          <p className="text-xs font-bold text-white bg-slate-900 px-3 py-2 rounded border border-slate-700">
                            {selectedItem.requirement}
                          </p>
                        </div>

                        {/* Progress bars for requirements */}
                        <div className="space-y-3 pt-2">
                          {Object.entries(selectedItem.requiredStats).map(([stat, val]) => {
                            const requiredValue = val as number;
                            const currentVal = status.stats[stat as keyof WorkoutStats] || 0;
                            const progress = Math.min(100, (currentVal / requiredValue) * 100);
                            return (
                              <div key={stat} className="space-y-1">
                                <div className="flex justify-between text-[8px] uppercase font-black tracking-widest">
                                  <span>Progresso {stat}</span>
                                  <span>{currentVal}/{requiredValue}</span>
                                </div>
                                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    style={{ backgroundColor: selectedItem.glowColor || 'var(--system-blue)' }}
                                    className="h-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-700">
                        {status.inventory.includes(selectedItem.id) ? (
                          <div 
                            style={{ 
                              backgroundColor: `${selectedItem.glowColor?.replace('0.4', '0.1')}`,
                              borderColor: selectedItem.glowColor,
                              color: selectedItem.glowColor?.replace('0.4', '1')
                            }}
                            className="border p-3 rounded text-center text-xs font-black uppercase tracking-widest italic"
                          >
                            Item Conquistado e Disponível
                          </div>
                        ) : (
                          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded text-center text-xs font-black uppercase tracking-widest italic">
                            Item Ainda Não Conquistado
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                      <GymIcon size={48} className="opacity-10 mb-4" />
                      <p className="text-sm font-bold uppercase italic">Selecione um item para ver os detalhes e requisitos</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SKILLS MODAL */}
        {showSkillModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4"
            onClick={() => setShowSkillModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              className="bg-slate-900 border border-purple-500/50 rounded-2xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <PowerIcon size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Habilidades de Monarca</h2>
                    <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Interface de Ativação Rápida</p>
                  </div>
                </div>
                <button onClick={() => setShowSkillModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Skill Selector */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                  {SPECIAL_SKILLS.map(skill => (
                    <motion.button
                      key={skill.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSkill(skill)}
                      className={`relative p-6 rounded-xl border-2 text-left transition-all overflow-hidden group ${
                        selectedSkill?.id === skill.id 
                          ? 'bg-slate-800 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]' 
                          : 'bg-slate-900/50 border-slate-800 hover:border-purple-500/30'
                      }`}
                    >
                      <div className={`mb-4 ${skill.color}`}>
                        {renderIcon(skill.icon, 36)}
                      </div>
                      <h4 className={`text-lg font-black uppercase italic ${selectedSkill?.id === skill.id ? 'text-white' : 'text-slate-400'}`}>
                        {skill.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black mt-1">Tipo: {skill.type}</p>
                      
                      {selectedSkill?.id === skill.id && (
                        <motion.div 
                          layoutId="skill-indicator"
                          className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" 
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Skill Details & Special Effects */}
                <div className="lg:col-span-5 space-y-6">
                  {selectedSkill ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 border border-white/10 rounded-xl p-8 h-full"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`p-5 rounded-2xl bg-black border ${selectedSkill.color}`} style={{ borderColor: selectedSkill.glowColor }}>
                          {renderIcon(selectedSkill.icon, 48)}
                        </div>
                        <div>
                          <h3 className={`text-2xl font-black uppercase italic ${selectedSkill.color}`}>
                            {selectedSkill.name}
                          </h3>
                          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400 uppercase font-black">
                            {selectedSkill.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed mb-8 italic text-lg border-l-4 border-purple-500 pl-4 py-2 bg-purple-500/5">
                        "{selectedSkill.description}"
                      </p>

                      {/* Arise Specific Interaction */}
                      {selectedSkill.id === 'arise' && (
                        <div className="space-y-4">
                          <h5 className="text-[10px] text-purple-400 uppercase font-black tracking-widest flex items-center gap-2">
                            <Users size={14} /> Caçadores ao Redor (Shadow Feed)
                          </h5>
                          <div className="space-y-2">
                            {SKILL_FRIENDS.map((friend, i) => (
                              <div key={i} className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5 group hover:border-purple-500/30 transition-all">
                                <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full border border-purple-500/20" />
                                <div className="flex-1">
                                  <div className="text-sm font-black text-white italic">{friend.name}</div>
                                  <div className="text-[10px] text-slate-500 uppercase">{friend.status}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="text-[8px] text-purple-500 font-bold uppercase">Conectado</div>
                                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => activateSkill('arise')}
                            className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase italic tracking-tighter text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-3"
                          >
                            <Ghost size={20} /> ATIVAR ASCENSÃO
                          </button>
                        </div>
                      )}

                      {selectedSkill.id !== 'arise' && (
                        <div className="space-y-6">
                          <div className="bg-black/50 p-6 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xs text-slate-500 font-bold uppercase">Custo de Ativação</span>
                              <span className="text-xs text-white font-black uppercase">Concentração Máxima</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 w-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            </div>
                          </div>
                          <button 
                            onClick={() => activateSkill(selectedSkill.id)}
                            className={`w-full py-4 bg-transparent border-2 ${selectedSkill.color} hover:bg-white/5 font-black uppercase italic tracking-tighter text-lg transition-all flex items-center justify-center gap-3`}
                            style={{ borderColor: selectedSkill.glowColor }}
                          >
                            ATIVAR HABILIDADE
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                      <PowerIcon size={64} className="opacity-10 mb-4" />
                      <p className="text-sm font-bold uppercase italic max-w-[200px]">Selecione uma habilidade de monarca para visualização e ativação</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* CREATE WORKOUT MODAL */}
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-system-blue rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {newWorkout.id ? <Settings2 size={24} className="text-system-blue" /> : <Plus size={24} className="text-system-blue" />}
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                    {newWorkout.id ? 'Modificar Treino' : 'Forjar Novo Treino'}
                  </h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Nome do Treino</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Treino de Caçador Rank S"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-system-blue outline-none transition-all font-bold italic"
                      value={newWorkout.title}
                      onChange={e => setNewWorkout(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Subtítulo (Grupos Musculares)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Peito e Tríceps"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:border-system-blue outline-none transition-all font-bold opacity-70"
                      value={newWorkout.subtitle}
                      onChange={e => setNewWorkout(prev => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Grupos Musculares (Tags)</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['peito', 'triceps', 'costas', 'biceps', 'ombro', 'perna', 'total'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const currentTags = newWorkout.tags || [];
                          const updated = currentTags.includes(tag as any) 
                            ? currentTags.filter(t => t !== tag)
                            : [...currentTags, tag as any];
                          setNewWorkout(prev => ({ ...prev, tags: updated }));
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          newWorkout.tags?.includes(tag as any)
                            ? 'bg-system-blue text-white ring-2 ring-white/20'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Exercícios do Treino</label>
                    <button 
                      onClick={() => setNewWorkout(prev => ({ 
                        ...prev, 
                        exercises: [...(prev.exercises || []), { name: '', sets: 3, reps: '12', weight: '0kg', rest: '60s' }]
                      }))}
                      className="text-system-blue text-[10px] font-black uppercase flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newWorkout.exercises?.map((ex, idx) => (
                      <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-end p-3 bg-slate-800/50 border border-slate-800 rounded relative group">
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-[8px] text-slate-500 mb-1 block">NOME</label>
                          <input 
                            className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-xs" 
                            type="text" 
                            placeholder="Exercício"
                            value={ex.name}
                            onChange={(e) => {
                              const updated = [...(newWorkout.exercises || [])];
                              updated[idx].name = e.target.value;
                              setNewWorkout(prev => ({ ...prev, exercises: updated }));
                            }}
                          />
                        </div>
                        <div className="w-16">
                          <label className="text-[8px] text-slate-500 mb-1 block text-center">SETS</label>
                          <input 
                            className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-center" 
                            type="number"
                            value={ex.sets}
                            onChange={(e) => {
                              const updated = [...(newWorkout.exercises || [])];
                              updated[idx].sets = parseInt(e.target.value) || 0;
                              setNewWorkout(prev => ({ ...prev, exercises: updated }));
                            }}
                          />
                        </div>
                        <div className="w-20">
                          <label className="text-[8px] text-slate-500 mb-1 block text-center">REPS</label>
                          <input 
                            className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-center" 
                            type="text"
                            value={ex.reps}
                            onChange={(e) => {
                              const updated = [...(newWorkout.exercises || [])];
                              updated[idx].reps = e.target.value;
                              setNewWorkout(prev => ({ ...prev, exercises: updated }));
                            }}
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[8px] text-slate-500 mb-1 block text-center">PESO</label>
                          <input 
                            className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-xs text-center font-bold text-system-blue" 
                            type="text"
                            value={ex.weight}
                            onChange={(e) => {
                              const updated = [...(newWorkout.exercises || [])];
                              updated[idx].weight = e.target.value;
                              setNewWorkout(prev => ({ ...prev, exercises: updated }));
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const updated = (newWorkout.exercises || []).filter((_, i) => i !== idx);
                            setNewWorkout(prev => ({ ...prev, exercises: updated }));
                          }}
                          className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                    <button 
                      type="button"
                      disabled={isSubmittingWorkout || !newWorkout.title || (newWorkout.exercises?.length || 0) === 0}
                      onClick={addCustomWorkout}
                      className="w-full py-4 bg-system-blue text-white font-black uppercase italic tracking-widest rounded disabled:opacity-30 disabled:cursor-not-allowed hover:neon-glow transition-all"
                    >
                      {isSubmittingWorkout ? 'Sincronizando...' : (newWorkout.id ? 'Sincronizar Atualização de Treino' : 'Forjar Treino na Memória')}
                    </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SKILL EFFECT OVERLAY */}
        {activeSkillEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-center ${
              activeSkillEffect === 'bloodlust' ? 'bg-rose-900/30' : 
              activeSkillEffect === 'dominators-touch' ? 'bg-blue-900/30' :
              activeSkillEffect === 'quicksilver' ? 'bg-sky-900/30' : 
              activeSkillEffect === 'arise' ? 'bg-black/60' : 'bg-purple-900/40'
            } backdrop-blur-[2px]`}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="relative flex flex-col items-center"
            >
              <h2 className={`text-6xl md:text-9xl font-black italic uppercase tracking-tighter text-center px-4 leading-tight
                ${activeSkillEffect === 'bloodlust' ? 'text-rose-600 drop-shadow-[0_0_50px_rgba(225,29,72,1)]' : 
                  activeSkillEffect === 'dominators-touch' ? 'text-blue-500 drop-shadow-[0_0_50px_rgba(59,130,246,1)]' :
                  activeSkillEffect === 'quicksilver' ? 'text-sky-300 drop-shadow-[0_0_50px_rgba(125,211,252,1)]' :
                  activeSkillEffect === 'arise' ? 'text-purple-600 drop-shadow-[0_0_50px_rgba(147,51,234,1)]' :
                  'text-purple-500 drop-shadow-[0_0_50px_rgba(168,85,247,1)]'}`}
              >
                {SPECIAL_SKILLS.find(s => s.id === activeSkillEffect)?.name.split(' (')[0] || 'HABILIDADE'}
              </h2>
              <p className="text-center text-white text-xl md:text-2xl font-bold uppercase tracking-widest mt-6 opacity-80">
                Poder Ativo
              </p>
              
              {(activeSkillEffect === 'bloodlust' || activeSkillEffect === 'arise') && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="absolute inset-0 -z-10 flex items-center justify-center"
                >
                  <div className={`w-[600px] h-[600px] rounded-full blur-[120px] ${
                    activeSkillEffect === 'bloodlust' ? 'bg-rose-600/20' : 'bg-purple-600/30'
                  }`} />
                </motion.div>
              )}
            </motion.div>
            
            {/* Visual background ripple */}
            <motion.div 
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 10, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`absolute w-32 h-32 border-8 rounded-full ${
                activeSkillEffect === 'bloodlust' ? 'border-rose-600' : 
                activeSkillEffect === 'dominators-touch' ? 'border-blue-500' :
                activeSkillEffect === 'quicksilver' ? 'border-sky-300' : 
                activeSkillEffect === 'arise' ? 'border-purple-600 shadow-[0_0_20px_#9333ea]' : 'border-purple-500'
              }`}
            />

            {/* Quicksilver Particles */}
            {activeSkillEffect === 'quicksilver' && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ left: '-10%', top: `${Math.random() * 100}%`, width: '100px', opacity: 0 }}
                    animate={{ left: '110%', opacity: [0, 1, 0] }}
                    transition={{ duration: 0.4, delay: Math.random() * 2, repeat: Infinity }}
                    className="absolute h-[2px] bg-sky-300 shadow-[0_0_10px_#7dd3fc]"
                  />
                ))}
              </div>
            )}

            {/* Bloodlust Drops Effect */}
            {activeSkillEffect === 'bloodlust' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      top: -20, 
                      left: `${Math.random() * 100}%`,
                      scale: Math.random() * 0.5 + 0.5,
                      opacity: 0 
                    }}
                    animate={{ 
                      top: '120%',
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{ 
                      duration: Math.random() * 2 + 1, 
                      delay: Math.random() * 3,
                      repeat: Infinity,
                      ease: "easeIn"
                    }}
                    className="absolute text-rose-600 filter drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]"
                  >
                    <Droplet size={24} fill="currentColor" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Dominator's Touch Digital Fingerprint Effect */}
            {activeSkillEffect === 'dominators-touch' && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ 
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.1, 0.4, 0.1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="relative flex items-center justify-center"
                >
                  <div className="absolute w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px]" />
                  <Fingerprint size={300} className="text-blue-500/30" strokeWidth={0.5} />
                  
                  {/* Digital Scanning Lines */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-blue-400/20 shadow-[0_0_15px_rgba(96,165,250,0.5)] z-10"
                  />
                </motion.div>
              </div>
            )}
            
            {/* Dominator's Touch Force Field */}
            {activeSkillEffect === 'dominators-touch' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 border-[40px] border-blue-500/10 pointer-events-none"
                style={{ clipPath: 'circle(50% at 50% 50%)' }}
              />
            )}

            {/* Arise (Shadow Army) Comprehensive Effect */}
            {activeSkillEffect === 'arise' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                {/* Advanced Shadow Fire Filter */}
                <svg className="absolute w-0 h-0">
                  <defs>
                    <filter id="shadowFireFilter" x="-50%" y="-50%" width="200%" height="200%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="4" seed="1">
                        <animate attributeName="seed" from="1" to="1000" dur="20s" repeatCount="indefinite" />
                      </feTurbulence>
                      <feDisplacementMap in="SourceGraphic" scale="60" />
                      <feGaussianBlur stdDeviation="2" />
                    </filter>
                    
                    <filter id="shadowNoise">
                      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                      <feColorMatrix type="saturate" values="0" />
                      <feComponentTransfer>
                        <feFuncR type="linear" slope="0.05" />
                        <feFuncG type="linear" slope="0.05" />
                        <feFuncB type="linear" slope="0.05" />
                      </feComponentTransfer>
                    </filter>
                  </defs>
                </svg>

                {/* Ambient Shadow Grain */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ filter: 'url(#shadowNoise)' }} />

                {/* Dark Presence - Ambient Shadow Presence */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0"
                />

                {/* Main Shadow Flames Mass - 14 Primary Shadows */}
                <div className="absolute bottom-[-100px] left-[-20%] right-[-20%] h-[75vh] flex justify-center items-end" style={{ filter: 'url(#shadowFireFilter)' }}>
                  {[...Array(14)].map((_, i) => (
                    <motion.div
                      key={`black-flame-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: [
                          400 + Math.sin(i * 1.5) * 100, 
                          650 + Math.cos(i * 2) * 150, 
                          400 + Math.sin(i * 1.5) * 100
                        ],
                        opacity: [0.4, 0.8, 0.4],
                        scaleX: [1, 1.6, 0.6, 1.3, 1],
                        rotate: [(i - 7) * 3, (i - 7) * 5, (i - 7) * 3]
                      }}
                      transition={{ 
                        duration: 2 + (i % 4) * 0.5, 
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1
                      }}
                      className="w-24 md:w-52 bg-gradient-to-t from-black via-purple-950/90 to-transparent rounded-t-full blur-2xl origin-bottom opacity-80"
                      style={{ 
                        marginLeft: `${(i - 7) * 5}%`,
                        zIndex: 10 + i,
                        mixBlendMode: 'multiply'
                      }}
                    />
                  ))}
                </div>

                {/* Ethereal Purple/Blue Core Flames */}
                <div className="absolute bottom-[-50px] left-0 right-0 h-[45vh] flex justify-center items-end mix-blend-screen" style={{ filter: 'url(#shadowFireFilter)' }}>
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={`core-flame-${i}`}
                      animate={{ 
                        height: [200, 500, 200],
                        opacity: [0.2, 0.5, 0.2],
                        scaleX: [0.8, 1.5, 0.8]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                      className="w-28 md:w-64 bg-gradient-to-t from-purple-800/40 via-blue-900/10 to-transparent rounded-t-full blur-[70px] origin-bottom"
                      style={{ marginLeft: `${(i - 4.5) * 10}%` }}
                    />
                  ))}
                </div>

                {/* Rising Ghosts (The Shadows) */}
                {[...Array(18)].map((_, i) => (
                  <motion.div
                    key={`rising-ghost-${i}`}
                    initial={{ 
                      bottom: -80, 
                      left: `${Math.random() * 100}%`,
                      scale: Math.random() * 0.8 + 0.8,
                      opacity: 0,
                      rotate: Math.random() * 20 - 10
                    }}
                    animate={{ 
                      bottom: '120%',
                      opacity: [0, 0.3, 0.3, 0],
                      x: [0, Math.sin(i) * 60, 0],
                      scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ 
                      duration: Math.random() * 5 + 4, 
                      delay: Math.random() * 6,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute text-purple-300/20 filter blur-[2px] drop-shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                  >
                    <Ghost size={64} strokeWidth={1} />
                  </motion.div>
                ))}

                {/* Floating Shadow Cinders */}
                {[...Array(45)].map((_, i) => {
                  const xPos = (i * 2.2) % 100;
                  const delay = i * 0.12;
                  const duration = 2.5 + (i % 3);
                  const xOffset = (i % 14) - 7;
                  
                  return (
                    <motion.div
                      key={`cinder-${i}`}
                      initial={{ opacity: 0, y: 0, x: `${xPos}%`, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 1, 0],
                        y: [-20, -400 - (i * 10), -800 - (i * 5)],
                        x: [`${xPos}%`, `${xPos + xOffset}%`, `${xPos - xOffset}%`],
                        scale: [0, 2, 1.2, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration, 
                        repeat: Infinity,
                        delay,
                        ease: "easeOut"
                      }}
                      className={`absolute bottom-0 w-2 h-2 rounded-full blur-[0.5px]
                        ${i % 4 === 0 ? 'bg-purple-500 shadow-[0_0_12px_#a855f7]' : 
                          i % 4 === 1 ? 'bg-black border border-purple-900/50' :
                          i % 4 === 2 ? 'bg-blue-600/40 shadow-[0_0_10px_#2563eb]' :
                          'bg-purple-950/40 shadow-[0_0_4px_#000]'}`}
                    />
                  );
                })}

                {/* Ground Surge - Intense Purple Light at Bottom */}
                <div className="absolute bottom-[-50px] left-0 right-0 h-40 bg-gradient-to-t from-purple-900 via-black to-transparent opacity-40 blur-3xl" />
              </div>
            )}



          </motion.div>
        )}

        {/* LEVEL UP OVERLAY */}
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <h2 className="text-8xl md:text-[12rem] font-black text-system-blue italic uppercase leading-none select-none blur-[1px] hover:blur-none transition-all">
                  LEVEL UP!
                </h2>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  className="h-1 bg-system-blue mt-2"
                />
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl md:text-3xl text-white tracking-[0.2em] mt-8 font-light italic uppercase"
              >
                Suas limitações foram <span className="text-system-blue font-bold">superadas</span>.
              </motion.p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="mt-12 flex justify-center opacity-20"
              >
                <Zap size={64} className="text-system-blue" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SOCIAL MODAL */}
        <AnimatePresence>
          {showSocialModal && (
            <SocialModal 
              friends={friends}
              requests={friendRequests}
              onClose={() => setShowSocialModal(false)}
              onSendRequest={sendFriendRequest}
              onAccept={acceptFriendRequest}
              onDecline={declineFriendRequest}
            />
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}

function SocialModal({ 
  friends, 
  requests, 
  onClose, 
  onSendRequest, 
  onAccept, 
  onDecline 
}: { 
  friends: Friend[]; 
  requests: FriendRequest[]; 
  onClose: () => void;
  onSendRequest: (id: string) => Promise<boolean>;
  onAccept: (req: FriendRequest) => void;
  onDecline: (id: string) => void;
}) {
  const [searchId, setSearchId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!searchId) return;
    setIsSending(true);
    const success = await onSendRequest(searchId);
    if (success) {
      setSearchId('');
      alert("Pedido de amizade enviado!");
    }
    setIsSending(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-system-blue rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-system-blue" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Social Arise</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {/* SEARCH SECTION */}
          <section>
            <h3 className="text-xs text-slate-500 uppercase font-black tracking-widest mb-3">Encontrar Outros Caçadores</h3>
            <div className="flex gap-2">
              <input 
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Digite o Codinome (ID) do seu amigo..."
                className="flex-1 bg-black/40 border border-slate-800 rounded px-4 py-2 text-sm focus:border-system-blue outline-none text-white italic"
              />
              <button 
                onClick={handleSend}
                disabled={isSending || !searchId}
                className="px-6 py-2 bg-system-blue text-white text-xs font-black uppercase italic rounded hover:bg-blue-500 disabled:opacity-50 transition-all"
              >
                {isSending ? 'Sincronizando...' : 'Enviar Pedido'}
              </button>
            </div>
            <p className="text-[9px] text-slate-600 mt-2 uppercase font-bold italic">Dica: Peça ao seu amigo o Codinome que aparece no topo da tela dele.</p>
          </section>

          {/* REQUESTS SECTION */}
          {requests.length > 0 && (
            <section>
              <h3 className="text-xs text-rose-500 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                <Bell size={14} /> Pedidos de Sincronização ({requests.length})
              </h3>
              <div className="space-y-2">
                {requests.map(req => (
                  <div key={`req-${req.id}`} className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-rose-400 italic">{req.fromName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Enviou um pedido de conexão</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onAccept(req)}
                        className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase rounded hover:bg-rose-500"
                      >
                        Aceitar
                      </button>
                      <button 
                        onClick={() => onDecline(req.id)}
                        className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase rounded hover:bg-slate-700"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FRIENDS SECTION */}
          <section>
            <h3 className="text-xs text-system-blue uppercase font-black tracking-widest mb-3">Seus Companheiros de Treino ({friends.length})</h3>
            {friends.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
                <p className="text-slate-600 text-xs italic uppercase">Nenhum caçador conectado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {friends.map(friend => (
                  <div key={`friend-${friend.userId}`}>
                    <FriendCard friend={friend} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  const [liveData, setLiveData] = useState<HunterStatus | null>(null);

  useEffect(() => {
    // Listen to friend's live data
    const path = `users/${friend.userId}`;
    const unsub = onSnapshot(doc(db, 'users', friend.userId), (snap) => {
      if (snap.exists()) {
        setLiveData(snap.data() as HunterStatus);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, path));
    return () => unsub();
  }, [friend.userId]);

  const displayData = liveData || {
    name: friend.name,
    level: friend.level,
    currentTitleId: friend.currentTitleId,
    stats: friend.stats
  };

  const currentTitle = TITLES.find(t => t.id === displayData.currentTitleId) || TITLES[0];

  return (
    <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 hover:border-system-blue/50 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-lg border border-slate-700 flex items-center justify-center relative overflow-hidden group-hover:border-system-blue/50">
             <span className="text-xl font-black text-system-blue drop-shadow-[0_0_8px_rgba(30,144,255,0.4)]">{displayData.name[0].toUpperCase()}</span>
             <div className="absolute inset-0 bg-gradient-to-br from-system-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-black italic uppercase text-lg group-hover:text-system-blue transition-colors tracking-tighter">{displayData.name}</span>
              <span className="text-system-blue text-[10px] font-black bg-system-blue/10 px-1.5 rounded border border-system-blue/20">Lvl.{displayData.level}</span>
            </div>
            <div className={`text-[10px] font-black uppercase italic flex items-center gap-1 ${currentTitle.color || 'text-slate-500'}`}>
              <Award size={10} /> {currentTitle.name}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Poder Total</div>
           <div className="text-xl font-black text-white italic tracking-tighter">{(displayData as any).stats?.total || 0}</div>
        </div>
      </div>
      
      {/* Stats Breakdown Mini-Bar */}
      <div className="mt-4 grid grid-cols-6 gap-0.5 opacity-50 hover:opacity-100 transition-opacity">
         {['peito', 'triceps', 'costas', 'biceps', 'ombro', 'perna'].map((stat) => {
            const val = (displayData as any).stats?.[stat] || 0;
            const max = (displayData as any).stats?.total || 1;
            const percent = (val / max) * 100;
            return (
              <div key={stat} className="h-1 bg-slate-900 rounded-full overflow-hidden" title={`${stat}: ${val}`}>
                 <div className="h-full bg-system-blue" style={{ width: `${Math.min(100, Math.max(5, percent))}%` }} />
              </div>
            );
         })}
      </div>
    </div>
  );
}

function AttributeRow({ label, value, icon, onAdd, onAddMultiple, canAdd }: { 
  label: string; 
  value: number; 
  icon: ReactNode; 
  onAdd: () => void;
  onAddMultiple: (amount: number) => void;
  canAdd: boolean;
}) {
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkValue, setBulkValue] = useState('');

  const handleBulkConfirm = () => {
    const val = parseInt(bulkValue);
    if (!isNaN(val) && val > 0) {
      onAddMultiple(val);
    }
    setIsBulkEditing(false);
    setBulkValue('');
  };

  return (
    <div className="group flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs text-slate-500 uppercase font-bold tracking-wider">
        <span className="flex items-center gap-2">{icon} {label}</span>
        <span className="text-white text-lg font-black font-mono">
          {value}
          {value >= 100 && (
            <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/10 px-1 rounded">MAX</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
            className="h-full bg-system-blue/40 group-hover:bg-system-blue/60 transition-colors"
          />
        </div>
        {canAdd && (
          <div className="flex gap-1 items-center">
            {isBulkEditing ? (
              <motion.div 
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                className="flex items-center gap-1 bg-slate-900 border border-purple-500/50 rounded px-1 min-w-[100px]"
              >
                <input
                  autoFocus
                  type="text"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value.replace(/\D/g, ''))}
                  className="w-12 bg-transparent text-white text-[10px] font-bold text-center outline-none py-1"
                  placeholder="Qtd"
                  onKeyDown={(e) => e.key === 'Enter' && handleBulkConfirm()}
                />
                <button 
                  onClick={handleBulkConfirm} 
                  className="text-system-blue hover:text-white p-1 transition-colors"
                >
                  <CheckCircle2 size={12} />
                </button>
                <button 
                  onClick={() => setIsBulkEditing(false)} 
                  className="text-rose-500 hover:text-white p-1 transition-colors"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ) : (
              <div className="flex gap-1">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onAdd}
                  title="Adicionar 1"
                  className="w-6 h-6 bg-system-blue/20 hover:bg-system-blue text-system-blue hover:text-white rounded flex items-center justify-center transition-all"
                >
                  <ChevronUp size={14} strokeWidth={3} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsBulkEditing(true)}
                  title="Adicionar Vários"
                  className="w-6 h-6 bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white rounded flex items-center justify-center transition-all"
                >
                  <ChevronsUp size={14} strokeWidth={3} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

