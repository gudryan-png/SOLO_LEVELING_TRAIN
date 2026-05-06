import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  Zap, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  UserPlus,
  Key,
  Flame,
  UserCheck
} from 'lucide-react';
import { HunterStatus } from '../types.ts';
import { SPECIAL_SKILLS } from '../constants.ts';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, getDocFromServer } from 'firebase/firestore';
import { auth, db, withFirestoreRetry } from '../lib/firebase';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'recovery';

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('Qual seu exercício favorito?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Password strength logic
  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 10) return 2;
    return 3;
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Preencha seu codinome e senha.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Direct Firestore Auth System
      const sanitizedUsername = username.trim();
      const userRef = doc(db, 'users', sanitizedUsername);
      
      // Use standard getDoc which is more resilient and retries automatically
      const userDoc = await withFirestoreRetry(() => getDoc(userRef));
      
      if (!userDoc.exists()) {
        setError('Codinome não encontrado no sistema.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      
      if (userData.password === password) {
        setSuccess('Autoridade do sistema Monarch confirmada.');
        setTimeout(() => {
          onLogin({ ...userData, userId: sanitizedUsername });
        }, 1000);
      } else {
        setError('Código de acesso incorreto.');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      const isOffline = err.message?.includes('offline') || err.code === 'unavailable';
      const message = isOffline 
        ? 'O sistema está offline ou demorando para responder. Verifique sua conexão e tente novamente.' 
        : (err.message || 'Desconhecido');
      
      setError(message);
      if (isOffline) {
        setSuccess('Dica: Se o erro persistir, tente recarregar a página (F5).');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword || !securityAnswer) {
      setError('Preencha todas as informações de registro.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    if (password.length < 4) {
      setError('A senha deve ser mais forte (mínimo 4 caracteres).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitizedUsername = username.trim();
      if (sanitizedUsername.length < 3) {
        setError('Codinome muito curto (mínimo 3 letras).');
        setLoading(false);
        return;
      }

      // Use username as the Document ID for uniqueness and easy lookup
      const userRef = doc(db, 'users', sanitizedUsername);
      const userDoc = await withFirestoreRetry(() => getDoc(userRef));
      
      if (userDoc.exists()) {
        setError('Este codinome já está em uso por outro caçador.');
        setLoading(false);
        return;
      }

      const uid = sanitizedUsername;
      
      // Initialize hunter profile with the FULL HunterStatus interface
      const initialProfile: any = {
        userId: uid,
        name: sanitizedUsername,
        password: password, 
        level: 1,
        xp: 0,
        maxXp: 1000,
        pointsToDistribute: 5,
        attributes: {
          strength: 10,
          vitality: 10,
          agility: 10,
          intelligence: 10
        },
        unlockedWorkoutIndex: 0,
        week: 1,
        stats: {
          peito: 0, triceps: 0, costas: 0, biceps: 0, ombro: 0, perna: 0, total: 0
        },
        currentTitleId: 'none',
        customWorkouts: [],
        inventory: [],
        skills: SPECIAL_SKILLS.map(s => ({ ...s, unlocked: true })),
        securityQuestion: securityQuestion, 
        securityAnswer: securityAnswer.toLowerCase().trim(),
        createdAt: new Date().toISOString()
      };

      await withFirestoreRetry(() => setDoc(userRef, initialProfile));
      setSuccess('Sincronização Monarch concluída. Bem-vindo, ' + sanitizedUsername);
      
      setTimeout(() => {
        onLogin({ ...initialProfile, userId: sanitizedUsername });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const isOffline = err.message?.includes('offline') || err.code === 'unavailable';
      setError(isOffline ? 'Erro de conexão no registro. Tente novamente ou recarregue a página.' : 'Erro ao criar sistema: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [recoveryQuestion, setRecoveryQuestion] = useState<string | null>(null);

  const fetchRecoveryQuestion = async () => {
    if (!username) {
      setError('Informe seu codinome primeiro.');
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', username.trim());
      const userSnap = await withFirestoreRetry(() => getDoc(userRef));
      
      if (!userSnap.exists()) {
        setError('Codinome não encontrado no sistema.');
        return;
      }
      const userData = userSnap.data();
      setRecoveryQuestion(userData.securityQuestion || 'Qual sua resposta de segurança?');
    } catch (err: any) {
      setError('Erro ao buscar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !securityAnswer || !newPassword) {
      setError('Preencha todas as informações de recuperação.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', username.trim());
      const userSnap = await withFirestoreRetry(() => getDoc(userRef));
      
      if (!userSnap.exists()) {
        setError('Codinome não encontrado no sistema.');
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (userData.securityAnswer !== securityAnswer.toLowerCase().trim()) {
        setError('Resposta de segurança incorreta. Acesso negado.');
        setLoading(false);
        return;
      }

      // Update password in Firestore
      await setDoc(userRef, { password: newPassword }, { merge: true });
      
      setSuccess('Identidade confirmada! Código de acesso atualizado.');
      setTimeout(() => setMode('login'), 2000);
    } catch (err: any) {
      console.error(err);
      const isOffline = err.message?.includes('offline') || err.code === 'unavailable';
      setError(isOffline ? 'Erro de conexão na recuperação. Tente novamente.' : 'Erro no sistema de recuperação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-sans selection:bg-system-purple/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-system-purple/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Header HUD */}
        <div className="mb-10 text-center relative">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-system-purple/20 blur-[60px] -z-10" 
          />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            Level Up System
          </h1>
          <p className="text-[10px] text-system-purple font-black uppercase tracking-[0.4em] opacity-80">
            Sincronização com o Monarca das Sombras
          </p>
        </div>

        {/* System Window */}
        <div className="system-window relative overflow-hidden backdrop-blur-xl bg-black/40 border-system-purple/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* HUD Accents */}
          <div className="absolute top-0 left-0 w-8 h-[1px] bg-system-purple" />
          <div className="absolute top-0 left-0 w-[1px] h-8 bg-system-purple" />
          <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-system-purple" />
          <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-system-purple" />

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
              >
                <div className="relative">
                   <RefreshCw className="text-system-purple animate-spin" size={48} strokeWidth={1} />
                   <div className="absolute inset-0 bg-system-purple/20 blur-[15px] animate-pulse rounded-full" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black italic uppercase tracking-widest text-white">Carregando status...</p>
                  <p className="text-[8px] text-slate-500 uppercase mt-1">Verificando autoridade do sistema</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg flex items-center gap-3">
                  <AlertCircle className="text-rose-500" size={18} />
                  <p className="text-xs font-bold text-rose-200">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <p className="text-xs font-bold text-emerald-200">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* LOGIN FORM */}
            {mode === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                       <User size={12} className="text-system-purple" /> Codinome do Caçador
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Sung Jin-Woo"
                      className="auth-input"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                       <Lock size={12} className="text-system-purple" /> Código de Acesso
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="auth-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                    <input type="checkbox" className="accent-system-purple" /> Lembrar-me
                  </label>
                  <button 
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-system-purple hover:text-white transition-colors"
                  >
                    Recuperar Acesso
                  </button>
                </div>

                <button type="submit" className="auth-button group">
                  <span className="flex items-center justify-center gap-2">
                    Liberar Acesso <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  Novo no sistema? {' '}
                  <button 
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-white hover:text-system-purple transition-colors"
                  >
                    Registrar Novo Caçador
                  </button>
                </p>
              </motion.form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Escolha seu Codinome</label>
                    <input 
                      type="text"
                      required
                      className="auth-input"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Defina seu Código</label>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div 
                            key={i}
                            className={`w-4 h-1 rounded-full transition-all duration-500 ${
                              i <= getPasswordStrength() 
                                ? (getPasswordStrength() === 1 ? 'bg-rose-500' : getPasswordStrength() === 2 ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_5px_#10b981]') 
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <input 
                      type="password"
                      required
                      className="auth-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Confirmar Código</label>
                    <input 
                      type="password"
                      required
                      className="auth-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12} className="text-blue-500" /> Pergunta de Segurança
                      </label>
                      <select 
                        className="auth-input bg-black cursor-pointer pr-10"
                        value={securityQuestion}
                        onChange={e => setSecurityQuestion(e.target.value)}
                      >
                        <option className="bg-slate-900">Qual seu exercício favorito?</option>
                        <option className="bg-slate-900">Nome do seu primeiro treino?</option>
                        <option className="bg-slate-900">Qual sua maior motivação?</option>
                        <option className="bg-slate-900">Qual nível você quer alcançar?</option>
                      </select>
                      <div className="absolute right-3 top-[34px] pointer-events-none text-slate-500">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Resposta de Segurança</label>
                      <input 
                        type="text"
                        required
                        className="auth-input"
                        value={securityAnswer}
                        onChange={e => setSecurityAnswer(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="auth-button">
                  Criar Conta de Atleta
                </button>

                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  Já possui acesso? {' '}
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-white hover:text-system-purple transition-colors"
                  >
                    Fazer Login
                  </button>
                </p>
              </motion.form>
            )}

            {/* RECOVERY FORM */}
            {mode === 'recovery' && (
              <motion.form 
                key="recovery"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                onSubmit={handleRecovery}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Seu Codinome</label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        className="auth-input pr-12"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={fetchRecoveryQuestion}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-system-purple hover:text-white transition-colors"
                        title="Buscar Pergunta"
                      >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Pergunta de Segurança</label>
                    <div className="auth-input bg-white/5 italic min-h-[42px] flex items-center text-slate-300">
                      {recoveryQuestion || 'Aguardando codinome...'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sua Resposta</label>
                    <input 
                      type="text"
                      required
                      className="auth-input"
                      value={securityAnswer}
                      onChange={e => setSecurityAnswer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Novo Código de Acesso</label>
                    <input 
                      type="password"
                      required
                      className="auth-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="auth-button bg-blue-600 shadow-blue-600/20">
                  Redefinir Acesso
                </button>

                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Voltar ao Login
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer HUD info */}
        <div className="mt-8 flex justify-between items-center opacity-40 px-2">
          <div className="flex items-center gap-2">
            <Flame size={12} className="text-system-purple" />
            <span className="text-[8px] font-black uppercase tracking-widest">Sistema V.2.1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck size={12} className="text-blue-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">Sincronização Monarch Ativa</span>
          </div>
        </div>
      </motion.div>

      {/* Global CSS for inputs/buttons */}
      <style>{`
        .auth-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          outline: none;
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .auth-input:focus {
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.05);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
          transform: translateY(-1px);
        }
        .auth-button {
          width: 100%;
          background: #a855f7;
          color: white;
          padding: 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-style: italic;
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          box-shadow: 0 10px 20px rgba(168, 85, 247, 0.3);
          border: none;
          cursor: pointer;
        }
        .auth-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(168, 85, 247, 0.4);
          filter: brightness(1.1);
        }
        .auth-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
