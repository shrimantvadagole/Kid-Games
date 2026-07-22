import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas.tsx';
import { GameState } from './game/Types.ts';
import { Trophy, Info } from 'lucide-react';

export default function App() {
    const [gameState, setGameState] = useState<GameState>('MENU');
    const [score, setScore] = useState(0);

    return (
        <div className="flex flex-col h-screen w-full bg-gray-950 text-white font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-md z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
                        <div className="w-3 h-3 bg-white rounded-full opacity-80 translate-x-[-2px] translate-y-[-2px]"></div>
                    </div>
                    <h1 className="text-xl font-bold tracking-wider">BUBBLE POP</h1>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
                        <Trophy size={18} className="text-yellow-400" />
                        <span className="font-mono font-bold text-lg">{score.toString().padStart(5, '0')}</span>
                    </div>
                    
                    <button 
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Aim with mouse/touch, click to shoot. Match 3 or more to pop!"
                    >
                        <Info size={24} />
                    </button>
                </div>
            </header>

            {/* Game Area */}
            <main className="flex-1 relative overflow-hidden">
                <GameCanvas 
                    gameState={gameState} 
                    setGameState={setGameState} 
                    setScore={setScore} 
                />
            </main>
        </div>
    );
}
