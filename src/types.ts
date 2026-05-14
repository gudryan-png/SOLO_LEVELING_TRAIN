export interface Attributes {
  strength: number;
  vitality: number;
  agility: number;
  intelligence: number;
}

export interface Quest {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: 'physical' | 'mental' | 'habit' | 'special';
  icon?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  rest: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  recipe?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  type: 'weekly' | 'boss';
}

export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  exercises: Exercise[];
  isCustom?: boolean;
  tags: (keyof WorkoutStats)[];
}

export interface Title {
  id: string;
  name: string;
  description: string;
  requirement: string;
  isUnlocked: boolean;
  color?: string;
  glowColor?: string;
  requiredStats: {
    [key: string]: number;
  };
}

export interface WorkoutStats {
  peito: number;
  triceps: number;
  costas: number;
  biceps: number;
  ombro: number;
  perna: number;
  total: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: string; // Will store the name of a Lucide icon or just a string
  color?: string;
  glowColor?: string;
  requiredStats: {
    [key: string]: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'buff' | 'passive' | 'special';
  icon: string;
  color: string;
  glowColor: string;
  unlocked: boolean;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  workoutTitle: string;
  timestamp: string;
  week: number;
  xpEarned: number;
}

export interface Friend {
  userId: string;
  name: string;
  level: number;
  currentTitleId: string;
  stats: WorkoutStats;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  status: 'pending' | 'accepted';
  timestamp: string;
}

export interface WalkingLog {
  id: string;
  distance: number; // in km
  timestamp: string;
  xpEarned: number;
}

export interface HunterStatus {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  attributes: Attributes;
  pointsToDistribute: number;
  unlockedWorkoutIndex: number;
  activeWorkoutIndex: number;
  week: number;
  stats: WorkoutStats;
  currentTitleId: string;
  customWorkouts: Workout[];
  inventory: string[];
  skills: Skill[];
  goal: 'muscle_gain' | 'weight_gain' | 'weight_loss' | 'maintenance';
}
