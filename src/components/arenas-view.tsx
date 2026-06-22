import React from 'react';
import { ARENAS } from '@/lib/arenas';
import { CARDS } from '@/lib/cards';
import { GameCard } from './game-card';

export function ArenasView() {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold font-display text-slate-100">Arenalar</h2>
      {ARENAS.map(arena => (
        <div key={arena.id} className="p-4 rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{arena.name}</h3>
            <span className="text-slate-400 font-mono italic">({arena.min} - {arena.max} Kupa)</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {arena.unlocks.map(cardId => {
              const card = CARDS.find(c => c.id === cardId);
              return card ? <GameCard key={card.id} card={card} size="sm" /> : null
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
