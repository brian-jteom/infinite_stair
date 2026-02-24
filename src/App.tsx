/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Trophy, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import { GameEngine, GameState } from './GameEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const timeBarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new GameEngine(
      canvasRef.current, 
      (state, s, hs, c) => {
        setGameState(state);
        setScore(s);
        setHighScore(hs);
        setCombo(c);
      },
      (progress) => {
        if (timeBarRef.current) {
          timeBarRef.current.style.width = `${progress}%`;
          timeBarRef.current.style.backgroundColor = progress < 20 ? '#ef4444' : '';
        }
      }
    );
    engineRef.current = engine;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        engine.handleDirection('LEFT');
      } else if (e.key === 'ArrowRight') {
        engine.handleDirection('RIGHT');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
    };
  }, []);
  
  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden touch-none select-none font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Scanline Effect */}
      <div className="scanline" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 pointer-events-none flex flex-col gap-4 z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] glow-text">점수</span>
            <span className="text-white text-5xl font-black font-mono leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-amber-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1 glow-text">
              <Trophy size={12} className="fill-amber-400" /> 최고 기록
            </span>
            <span className="text-white text-3xl font-black font-mono leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{highScore}</span>
          </div>
        </div>
        
        {/* Time Bar */}
        <div className="w-full h-4 bg-slate-900/50 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm p-0.5">
          <div 
            ref={timeBarRef}
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full transition-all duration-75 ease-linear shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Combo */}
        {combo >= 5 && (
          <div className="mt-2 flex items-center gap-2 animate-pulse">
            <div className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black text-xs uppercase tracking-tighter">Combo</div>
            <span className="text-yellow-400 text-3xl font-black italic glow-text">{combo}</span>
          </div>
        )}
      </div>
      
      {/* Start / Game Over Screens */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
          {gameState === 'START' ? (
            <div className="flex flex-col items-center max-w-sm w-full">
              <div className="relative mb-8">
                <h1 className="text-7xl font-black text-white italic transform -skew-x-12 leading-none tracking-tighter">
                  무한의<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">계단</span>
                </h1>
                <div className="absolute -top-4 -right-4 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded transform rotate-12 uppercase tracking-widest">Coding Ver.</div>
              </div>
              
              <p className="text-slate-400 mb-12 font-medium tracking-wide">반사신경의 한계에 도전하세요!</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-12">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center group transition-all hover:bg-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ArrowLeft size={24} className="text-blue-400" />
                  </div>
                  <span className="text-white font-bold text-sm">왼쪽</span>
                  <span className="text-slate-500 text-[10px] mt-1 font-mono">LEFT ARROW</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center group transition-all hover:bg-white/10">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ArrowRight size={24} className="text-emerald-400" />
                  </div>
                  <span className="text-white font-bold text-sm">오른쪽</span>
                  <span className="text-slate-500 text-[10px] mt-1 font-mono">RIGHT ARROW</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => engineRef.current?.handleDirection('RIGHT')}
                  className="group relative bg-blue-500 text-white px-12 py-6 rounded-2xl font-black text-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                >
                  <Play size={28} fill="currentColor" /> 
                  게임 시작
                </button>
                <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse glow-text">또는 방향키를 누르세요</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <h2 className="text-6xl font-black text-red-500 italic transform -skew-x-6 leading-none tracking-tighter glow-text">GAME OVER</h2>
                <div className="absolute -bottom-2 right-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Mission Failed</div>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-10 min-w-[240px] backdrop-blur-sm">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">최종 점수</p>
                <p className="text-white text-6xl font-black font-mono mb-4">{score}</p>
                <div className="h-px bg-white/10 w-full mb-4" />
                <p className="text-amber-400 text-xs font-black uppercase tracking-widest mb-1">최고 기록</p>
                <p className="text-white text-2xl font-black font-mono">{highScore}</p>
              </div>

              <button 
                onClick={() => engineRef.current?.restart()}
                className="group relative bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <RotateCcw size={24} className="group-hover:rotate-180 transition-transform duration-500" /> 
                다시 도전하기
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Mobile Controls */}
      <div className="absolute bottom-12 left-0 w-full p-6 flex gap-4 z-30">
        <button 
          className="flex-1 h-24 bg-blue-600/10 hover:bg-blue-600/20 active:bg-blue-600/40 border-2 border-blue-500/30 text-blue-400 rounded-2xl font-black text-xl backdrop-blur-md transition-all touch-manipulation flex flex-col items-center justify-center gap-1 group"
          onClick={() => engineRef.current?.handleDirection('LEFT')}
        >
          <ArrowLeft size={28} className="group-active:scale-125 transition-transform" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black">Left</span>
        </button>
        <button 
          className="flex-1 h-24 bg-emerald-600/10 hover:bg-emerald-600/20 active:bg-emerald-600/40 border-2 border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-xl backdrop-blur-md transition-all touch-manipulation flex flex-col items-center justify-center gap-1 group"
          onClick={() => engineRef.current?.handleDirection('RIGHT')}
        >
          <ArrowRight size={28} className="group-active:scale-125 transition-transform" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black">Right</span>
        </button>
      </div>
    </div>
  );
}
