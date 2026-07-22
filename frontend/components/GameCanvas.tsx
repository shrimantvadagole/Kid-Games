import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/Constants.ts';
import { GameEngine } from '../game/Engine.ts';
import { GameState } from '../game/Types.ts';

interface GameCanvasProps {
    gameState: GameState;
    setGameState: (state: GameState) => void;
    setScore: (score: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [scale, setScale] = useState(1);

    // Handle window resize to scale canvas
    useEffect(() => {
        const handleResize = () => {
            if (!canvasRef.current) return;
            const parent = canvasRef.current.parentElement;
            if (parent) {
                const availableWidth = parent.clientWidth;
                const availableHeight = parent.clientHeight;
                const scaleX = availableWidth / GAME_WIDTH;
                const scaleY = availableHeight / GAME_HEIGHT;
                const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1x
                setScale(newScale);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize and manage Game Engine
    useEffect(() => {
        if (!canvasRef.current) return;

        if (!engineRef.current) {
            engineRef.current = new GameEngine(
                canvasRef.current,
                (newScore) => setScore(newScore),
                (won) => setGameState(won ? 'VICTORY' : 'GAME_OVER')
            );
        }

        if (gameState === 'PLAYING') {
            engineRef.current.start();
        } else {
            engineRef.current.stop();
            if (gameState === 'MENU') {
                // Re-init if going back to menu to reset board visually
                engineRef.current = new GameEngine(
                    canvasRef.current,
                    setScore,
                    (won) => setGameState(won ? 'VICTORY' : 'GAME_OVER')
                );
                // Draw initial state once
                engineRef.current['draw'](); // Accessing private method for initial render hack
            }
        }

        return () => {
            if (engineRef.current) {
                engineRef.current.stop();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    // Input handling
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (gameState !== 'PLAYING' || !engineRef.current || !canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        
        engineRef.current.setShooterAngle(x, y);
    }, [gameState, scale]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (gameState !== 'PLAYING' || !engineRef.current) return;
        // Update angle one last time before firing in case of tap
        handlePointerMove(e);
        engineRef.current.fire();
    }, [gameState, handlePointerMove]);

    return (
        <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-900 w-full h-full relative">
            <canvas
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                className="bg-slate-800 shadow-2xl rounded-lg touch-none"
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    cursor: gameState === 'PLAYING' ? 'crosshair' : 'default'
                }}
            />
            
            {/* Overlays */}
            {gameState === 'MENU' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-8 drop-shadow-lg">
                        BUBBLE POP
                    </h1>
                    <button 
                        onClick={() => setGameState('PLAYING')}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-bold rounded-full text-2xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30"
                    >
                        PLAY NOW
                    </button>
                </div>
            )}

            {gameState === 'GAME_OVER' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
                    <h2 className="text-5xl font-bold text-red-500 mb-4">GAME OVER</h2>
                    <p className="text-xl text-gray-300 mb-8">The bubbles reached the bottom!</p>
                    <button 
                        onClick={() => setGameState('MENU')}
                        className="px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {gameState === 'VICTORY' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10">
                    <h2 className="text-5xl font-bold text-green-400 mb-4">YOU WIN!</h2>
                    <p className="text-xl text-gray-300 mb-8">Board cleared!</p>
                    <button 
                        onClick={() => setGameState('MENU')}
                        className="px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};
