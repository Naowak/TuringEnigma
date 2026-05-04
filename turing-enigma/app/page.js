"use client";
import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, ChevronUp, ChevronDown, Cpu, ShieldAlert, History, HelpCircle, Trophy } from 'lucide-react';

// --- MOTEUR LOGIQUE ---

const CODES_POSSIBLES = [];
for (let i = 1; i <= 5; i++) {
  for (let j = 1; j <= 5; j++) {
    for (let k = 1; k <= 5; k++) {
      CODES_POSSIBLES.push([i, j, k]);
    }
  }
}

const cmp = (a, b) => (a < b ? 0 : a === b ? 1 : 2);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const count = (arr, val) => arr.filter((x) => x === val).length;

const RULES = [
  { id: 1, desc: "Le 1er chiffre comparé au 2ème (<, =, >)", func: c => cmp(c[0], c[1]) },
  { id: 2, desc: "Le 2ème chiffre comparé au 3ème (<, =, >)", func: c => cmp(c[1], c[2]) },
  { id: 3, desc: "Le 1er chiffre comparé au 3ème (<, =, >)", func: c => cmp(c[0], c[2]) },
  { id: 4, desc: "Le 1er chiffre par rapport à 3 (<, =, >)", func: c => cmp(c[0], 3) },
  { id: 5, desc: "Le 2ème chiffre par rapport à 3 (<, =, >)", func: c => cmp(c[1], 3) },
  { id: 6, desc: "Le 3ème chiffre par rapport à 3 (<, =, >)", func: c => cmp(c[2], 3) },
  { id: 7, desc: "Parité du 1er chiffre (pair ou impair)", func: c => c[0] % 2 },
  { id: 8, desc: "Parité du 2ème chiffre (pair ou impair)", func: c => c[1] % 2 },
  { id: 9, desc: "Parité du 3ème chiffre (pair ou impair)", func: c => c[2] % 2 },
  { id: 10, desc: "Nombre de chiffres pairs dans le code", func: c => c.filter(x => x % 2 === 0).length },
  { id: 11, desc: "Nombre de chiffres impairs dans le code", func: c => c.filter(x => x % 2 !== 0).length },
  { id: 12, desc: "Nombre de fois qu'apparait le chiffre '1'", func: c => count(c, 1) },
  { id: 13, desc: "Nombre de fois qu'apparait le chiffre '3'", func: c => count(c, 3) },
  { id: 14, desc: "Nombre de fois qu'apparait le chiffre '5'", func: c => count(c, 5) },
  { id: 15, desc: "La somme des chiffres comparée à 9 (<, =, >)", func: c => cmp(sum(c), 9) },
  { id: 16, desc: "Parité de la somme des chiffres (pair ou impair)", func: c => sum(c) % 2 },
  { id: 17, desc: "Multiple de la somme (mult. de 3, mult. de 4, ou aucun)", func: c => sum(c) % 3 === 0 ? 0 : (sum(c) % 4 === 0 ? 1 : 2) },
  { id: 18, desc: "Le plus grand chiffre comparé à 4 (<, =, >)", func: c => cmp(Math.max(...c), 4) },
  { id: 19, desc: "Le plus petit chiffre comparé à 2 (<, =, >)", func: c => cmp(Math.min(...c), 2) },
  { id: 20, desc: "Ordre (croissant, décroissant, ou aucun)", func: c => (c[0] < c[1] && c[1] < c[2]) ? 0 : ((c[0] > c[1] && c[1] > c[2]) ? 1 : 2) },
  { id: 21, desc: "Y a-t-il des chiffres en double ?", func: c => new Set(c).size < 3 ? 0 : 1 }
];

const generateGame = (nbRules = 4) => {
  let attempts = 0;
  while (attempts < 2000) {
    attempts++;
    const secretCode = CODES_POSSIBLES[Math.floor(Math.random() * CODES_POSSIBLES.length)];
    
    // Mélange et sélectionne N règles
    const shuffledRules = [...RULES].sort(() => 0.5 - Math.random());
    const selectedRules = shuffledRules.slice(0, nbRules).sort((a,b) => a.id - b.id); // Trier par ID pour la lisibilité
    const targetStates = selectedRules.map(r => r.func(secretCode));
    
    // Test d'unicité
    let validCodes = 0;
    for (let c of CODES_POSSIBLES) {
      const states = selectedRules.map(r => r.func(c));
      if (states.every((val, idx) => val === targetStates[idx])) {
        validCodes++;
      }
    }
    
    if (validCodes === 1) {
      // Test de minimalité
      let isMinimal = true;
      for (let i = 0; i < nbRules; i++) {
        let matchCount = 0;
        for (let c of CODES_POSSIBLES) {
          let match = true;
          for (let j = 0; j < nbRules; j++) {
            if (i === j) continue;
            if (selectedRules[j].func(c) !== targetStates[j]) {
              match = false;
              break;
            }
          }
          if (match) matchCount++;
        }
        if (matchCount === 1) {
          isMinimal = false;
          break;
        }
      }
      
      if (isMinimal) {
        return { secretCode, rules: selectedRules, targetStates };
      }
    }
  }
  return null;
};

// --- COMPOSANTS UI ---

const Dial = ({ value, onChange, label }) => (
  <div className="flex flex-col items-center p-3 bg-slate-900 rounded-xl shadow-inner border border-slate-700 w-24">
    <span className="text-slate-400 text-xs mb-1 font-mono tracking-widest">{label}</span>
    <button onClick={() => onChange(value === 5 ? 1 : value + 1)} className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
      <ChevronUp size={28} />
    </button>
    <div className="text-5xl font-bold font-mono text-cyan-400 my-1">{value}</div>
    <button onClick={() => onChange(value === 1 ? 5 : value - 1)} className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
      <ChevronDown size={28} />
    </button>
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'loading', 'playing', 'won', 'lost'
  const [gameData, setGameData] = useState(null);
  const [currentCode, setCurrentCode] = useState([1, 1, 1]);
  const [history, setHistory] = useState([]);
  const [testsCount, setTestsCount] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const startNewGame = (difficulty) => {
    setGameState('loading');
    setTimeout(() => {
      const data = generateGame(difficulty);
      if (data) {
        setGameData(data);
        setCurrentCode([1, 1, 1]);
        setHistory([]);
        setTestsCount(0);
        setGameState('playing');
      } else {
        alert("Erreur lors de la génération. Veuillez réessayer.");
        setGameState('menu');
      }
    }, 100);
  };

  const updateCode = (index, val) => {
    const newCode = [...currentCode];
    newCode[index] = val;
    setCurrentCode(newCode);
  };

  const testRule = (ruleIndex) => {
    const rule = gameData.rules[ruleIndex];
    const expectedState = gameData.targetStates[ruleIndex];
    const currentState = rule.func(currentCode);
    const isMatch = (currentState === expectedState);

    setHistory([{
      id: Date.now(),
      code: [...currentCode],
      ruleDesc: rule.desc,
      ruleId: rule.id,
      isMatch
    }, ...history]);
    
    setTestsCount(prev => prev + 1);
  };

  const solveGame = () => {
    const isWin = currentCode.every((val, i) => val === gameData.secretCode[i]);
    setGameState(isWin ? 'won' : 'lost');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 selection:bg-cyan-900">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Cpu className="text-cyan-500" size={32} />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Turing<span className="text-cyan-500 font-light">Enigma</span></h1>
        </div>
        {gameState !== 'menu' && (
          <div className="flex gap-4 items-center">
            <span className="text-slate-400 font-mono text-sm hidden md:inline">Tests effectués : {testsCount}</span>
            <button onClick={() => setGameState('menu')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
              <RotateCcw size={16} /> Quitter
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto">
        
        {/* MENU */}
        {gameState === 'menu' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <ShieldAlert size={64} className="text-cyan-600 mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Déchiffrez le code secret</h2>
            <p className="text-slate-400 max-w-lg mb-10 leading-relaxed">
              La machine a généré un code unique à 3 chiffres (de 1 à 5). 
              Testez vos hypothèses en interrogeant les critères mathématiques. Trouvez le code en un minimum de tests.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => startNewGame(4)} className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)]">
                <Play size={20} /> Mode Normal (4 critères)
              </button>
              <button onClick={() => startNewGame(5)} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-8 py-4 rounded-xl font-semibold transition-all border border-slate-700">
                Mode Difficile (5 critères)
              </button>
            </div>
            
            <button onClick={() => setShowRulesModal(true)} className="mt-8 flex items-center gap-2 text-slate-500 hover:text-cyan-400 underline-offset-4 hover:underline">
              <HelpCircle size={18} /> Comment jouer ?
            </button>
          </div>
        )}

        {/* LOADING */}
        {gameState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-400 font-mono animate-pulse">Calcul de l'unicité mathématique en cours...</p>
          </div>
        )}

        {/* PLAYING */}
        {gameState === 'playing' && gameData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            
            {/* Panneau de Contrôle (Gauche) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Le Testeur de Code */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-6 font-semibold flex items-center justify-between">
                  1. Composer un code
                  <span className="text-cyan-500/50">#CONSOLE</span>
                </h3>
                <div className="flex justify-center gap-4 mb-8">
                  <Dial value={currentCode[0]} onChange={(v) => updateCode(0, v)} label="POS 1" />
                  <Dial value={currentCode[1]} onChange={(v) => updateCode(1, v)} label="POS 2" />
                  <Dial value={currentCode[2]} onChange={(v) => updateCode(2, v)} label="POS 3" />
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                   <div className="text-sm text-slate-400">Code actuel prêt à l'emploi</div>
                   <div className="font-mono text-xl text-white tracking-[0.5em]">{currentCode.join('')}</div>
                </div>
              </div>

              {/* Les Critères (La Machine) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-4 font-semibold flex justify-between items-center">
                  2. Interroger la machine
                </h3>
                <p className="text-xs text-slate-400 mb-6">Testez si votre code actuel valide le critère de la même manière que le code secret.</p>
                <div className="space-y-3">
                  {gameData.rules.map((rule, index) => (
                    <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl gap-4 group hover:border-cyan-900 transition-colors">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-slate-800 text-slate-400 w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold mt-0.5">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-sm text-slate-300">{rule.desc}</span>
                      </div>
                      <button 
                        onClick={() => testRule(index)}
                        className="whitespace-nowrap px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors border border-slate-700 hover:border-cyan-500"
                      >
                        Tester
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résoudre */}
              <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-2xl p-6">
                 <button 
                  onClick={solveGame}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)]"
                 >
                   C'est le code secret !
                 </button>
                 <p className="text-center text-xs text-cyan-500/70 mt-3">Attention, ceci met fin à la partie.</p>
              </div>

            </div>

            {/* Historique (Droite) */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full min-h-[500px] flex flex-col">
                <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-6 font-semibold flex items-center gap-2">
                  <History size={16} /> Registre d'historique
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 font-mono text-sm border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                      En attente de requêtes.<br/>Saisissez un code et testez un critère.
                    </div>
                  ) : (
                    history.map((entry) => (
                      <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-right-4">
                        <div className="font-mono text-xl font-bold text-white bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 tracking-[0.2em]">
                          {entry.code.join('')}
                        </div>
                        <div className="flex-1 text-sm text-slate-400">
                          {entry.ruleDesc}
                        </div>
                        <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded flex-shrink-0 ${entry.isMatch ? 'bg-emerald-950/50 text-emerald-400' : 'bg-red-950/50 text-red-400'}`}>
                          {entry.isMatch ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                          {entry.isMatch ? 'VRAI' : 'FAUX'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÉCRANS DE FIN */}
        {(gameState === 'won' || gameState === 'lost') && gameData && (
          <div className="max-w-2xl mx-auto mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-2xl animate-in zoom-in-95">
            {gameState === 'won' ? (
              <>
                <Trophy size={80} className="mx-auto text-yellow-500 mb-6" />
                <h2 className="text-4xl font-bold text-white mb-2">Code Déchiffré !</h2>
                <p className="text-emerald-400 font-semibold mb-8">Identification confirmée.</p>
              </>
            ) : (
              <>
                <XCircle size={80} className="mx-auto text-red-500 mb-6" />
                <h2 className="text-4xl font-bold text-white mb-2">Échec de l'identification</h2>
                <p className="text-red-400 font-semibold mb-8">Le code proposé était incorrect.</p>
              </>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-8 inline-block">
              <span className="block text-slate-500 text-sm mb-2 uppercase tracking-widest">Le code secret était :</span>
              <span className="font-mono text-5xl font-bold text-white tracking-[0.3em]">
                {gameData.secretCode.join('')}
              </span>
            </div>

            <p className="text-slate-400 mb-8">
              Vous avez effectué <strong className="text-white">{testsCount}</strong> tests d'hypothèses.
            </p>

            <button onClick={() => setGameState('menu')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-semibold transition-all">
              Retour au menu principal
            </button>
          </div>
        )}

      </main>

      {/* MODAL DES RÈGLES */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><HelpCircle /> Comment jouer ?</h2>
              <button onClick={() => setShowRulesModal(false)} className="text-slate-500 hover:text-white p-1"><XCircle /></button>
            </div>
            
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <p>
                <strong>L'objectif</strong> est de trouver le code secret à 3 chiffres (de 1 à 5). Pour cela, vous devez déduire le comportement du code en interrogeant la machine.
              </p>
              
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h3 className="text-cyan-400 font-bold mb-2">Comprendre le "VRAI" et "FAUX"</h3>
                <p className="mb-2">La machine ne répond pas simplement "Oui" ou "Non" à la question écrite. Elle compare l'état de votre code avec l'état du code secret.</p>
                <p className="mb-2"><strong>Exemple avec le critère :</strong> <em>"La somme des chiffres comparée à 9 (&lt;, =, &gt;)"</em></p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                  <li>Imaginons que le code secret soit <code className="text-white bg-slate-800 px-1 rounded">1-2-3</code> (Somme = 6, donc <strong className="text-white">Strictement inférieur</strong>).</li>
                  <li>Vous testez le code <code className="text-white bg-slate-800 px-1 rounded">2-2-1</code> (Somme = 5). Somme est aussi inférieure. La machine dit <strong className="text-emerald-400">VRAI ✅</strong>.</li>
                  <li>Vous testez le code <code className="text-white bg-slate-800 px-1 rounded">5-4-3</code> (Somme = 12). Somme est supérieure. C'est différent du code secret, la machine dit <strong className="text-red-400">FAUX ❌</strong>.</li>
                  <li>Vous testez le code <code className="text-white bg-slate-800 px-1 rounded">4-4-1</code> (Somme = 9). Somme est égale. C'est différent du code secret, la machine dit <strong className="text-red-400">FAUX ❌</strong>.</li>
                </ul>
                <p className="mt-3">Vous pouvez en déduire que la somme du code secret n'est ni &gt;9, ni =9. Elle est donc forcément &lt;9 !</p>
              </div>

              <p>
                Croisez les informations obtenues par les différents critères pour éliminer les possibilités jusqu'à trouver l'unique code valide. Un problème bien conçu garantit qu'il n'existe qu'un seul code possible au monde respectant la configuration de la partie.
              </p>

              <button onClick={() => setShowRulesModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl mt-4 transition-colors font-semibold">
                J'ai compris, fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ajout d'une balise style pour personnaliser la scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}