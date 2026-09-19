import { useState } from "react";
import { X, Award, CheckCircle2, Lock, Sparkles, Coins, Gift } from "lucide-react";
import { RANK_REWARDS, RANK_TIERS, getRankForRankProgress, getUnlockedCardsUpToTrophies } from "../lib/arenas";
import { CHESTS, CardDef, rollCardFromUnlocked, Rarity } from "../lib/cards";
import { UserData } from "../types";

interface RankRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: UserData;
  onClaimReward: (
    targetRankId: string,
    goldReward: number,
    levelCoinsReward: number,
    rewards: { card: CardDef; isDuplicate: boolean; refundGold: number }[]
  ) => Promise<void>;
  onShowChestRewards?: (chestName: string, rewards: { card: CardDef; isDuplicate: boolean; refundGold: number }[]) => void;
}

export function RankRewardsModal({
  isOpen,
  onClose,
  state,
  onClaimReward,
  onShowChestRewards,
}: RankRewardsModalProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTrophies = state.rankProgressTrophies || 0;
  const rankedStars = state.rankedStars || 0;
  const claimedTiers = state.claimedRankTiers || [];
  const rankInfo = getRankForRankProgress(currentTrophies, rankedStars);

  const handleClaim = async (rewardDef: (typeof RANK_REWARDS)[0]) => {
    if (claimingId) return;
    setClaimingId(rewardDef.targetRankId);

    try {
      const rolled: CardDef[] = [];
      const unlockedIds = getUnlockedCardsUpToTrophies(state.trophies);
      const epicChestDef = CHESTS.find((c) => c.id === "gold")!; // 3 cards, guaranteed epic
      const legChestDef = CHESTS.find((c) => c.id === "magic")!; // 4 cards, guaranteed legendary

      // Roll cards for epic chests
      for (let i = 0; i < rewardDef.epicChests; i++) {
        rolled.push(rollCardFromUnlocked(unlockedIds, epicChestDef.guaranteedMin, epicChestDef.allowedRarities));
        for (let c = 1; c < epicChestDef.cards; c++) {
          rolled.push(rollCardFromUnlocked(unlockedIds, undefined, epicChestDef.allowedRarities));
        }
      }

      // Roll cards for legendary chests
      for (let i = 0; i < rewardDef.legendaryChests; i++) {
        rolled.push(rollCardFromUnlocked(unlockedIds, legChestDef.guaranteedMin, legChestDef.allowedRarities));
        for (let c = 1; c < legChestDef.cards; c++) {
          rolled.push(rollCardFromUnlocked(unlockedIds, undefined, legChestDef.allowedRarities));
        }
      }

      const tempCollection = { ...state.collection };
      const rewards: { card: CardDef; isDuplicate: boolean; refundGold: number }[] = [];
      const refundValues: Record<Rarity, number> = {
        common: 250,
        rare: 500,
        epic: 800,
        legendary: 6000,
      };

      for (const card of rolled) {
        const isDuplicate = (tempCollection[card.id] ?? 0) > 0;
        const refundGold = refundValues[card.rarity];
        rewards.push({
          card,
          isDuplicate,
          refundGold,
        });
        if (!isDuplicate) {
          tempCollection[card.id] = 1;
        }
      }

      await onClaimReward(rewardDef.targetRankId, rewardDef.gold, rewardDef.levelCoins, rewards);

      if (rewards.length > 0 && onShowChestRewards) {
        const title = `${rewardDef.targetRankName} Rütbe Sandıkları`;
        onShowChestRewards(title, rewards);
      }
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 p-4 text-center">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-slate-800/80 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">{rankInfo.current.emoji}</span>
            <h2 className="text-xl font-black text-amber-300 tracking-wide uppercase">
              Rütbe Yolu Ödülleri
            </h2>
          </div>
          
          <p className="text-xs text-slate-300">
            Kupa ve lig basamaklarını tırmanarak devasa altın, level coin ve sandık ödüllerini topla!
          </p>

          {/* Current Rank Stats Banner */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/80 border border-amber-500/30 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">{rankInfo.current.emoji}</span>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Mevcut Rütbe</span>
                <span className="font-bold text-amber-200">{rankInfo.current.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">Kupa / Dereceli Yıldız</span>
              <span className="font-mono font-bold text-yellow-400">
                🏆 {currentTrophies.toLocaleString("tr-TR")}
                {rankedStars > 0 && <span className="text-amber-300 ml-1">⭐ {rankedStars}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Reward List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
          {RANK_REWARDS.map((reward, idx) => {
            const isClaimed = claimedTiers.includes(reward.targetRankId);
            
            // Check if requirement reached:
            let isReached = currentTrophies >= reward.reqTrophies;
            if (reward.targetRankId === "platin") {
              if (currentTrophies >= 7000 || rankedStars >= (reward.reqStars || 140)) {
                isReached = true;
              }
            }

            const canClaim = isReached && !isClaimed;
            const targetTier = RANK_TIERS.find((t) => t.id === reward.targetRankId);

            return (
              <div
                key={reward.targetRankId}
                className={`relative rounded-xl border p-3 transition-all ${
                  canClaim
                    ? "bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-amber-400/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/40"
                    : isClaimed
                    ? "bg-slate-950/40 border-slate-800 opacity-70"
                    : "bg-slate-950/60 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  
                  {/* Left: Rank Transition */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 shadow-inner text-xl">
                      {targetTier?.emoji || "🏆"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-400">{reward.fromRankName}</span>
                        <span className="text-[10px] text-amber-500">➔</span>
                        <span className="text-sm font-black text-amber-300">{reward.targetRankName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Gereksinim:{" "}
                        <span className="font-bold text-yellow-400">
                          {reward.targetRankId === "platin"
                            ? "7.000 Kupa veya 140 Yıldız"
                            : `${reward.reqTrophies.toLocaleString("tr-TR")} Kupa`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action / Status Button */}
                  <div className="shrink-0">
                    {isClaimed ? (
                      <div className="flex items-center gap-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Alındı</span>
                      </div>
                    ) : canClaim ? (
                      <button
                        onClick={() => handleClaim(reward)}
                        disabled={claimingId === reward.targetRankId}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-3.5 py-1.5 text-xs font-black shadow-md shadow-amber-500/30 active:scale-95 transition-all animate-pulse"
                      >
                        <Gift className="h-4 w-4" />
                        <span>{claimingId === reward.targetRankId ? "Alınıyor..." : "ÖDÜLÜ AL"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                          {reward.targetRankId === "platin" && rankedStars > 0
                            ? `${Math.max(0, 140 - rankedStars)} Yıldız Kaldı`
                            : `${Math.max(0, reward.reqTrophies - currentTrophies)} Kupa Kaldı`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reward breakdown chips */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-800/60 pt-2">
                  {reward.gold > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-yellow-950/60 border border-yellow-600/40 px-2 py-0.5 text-[11px] font-bold text-yellow-300">
                      🪙 {reward.gold.toLocaleString("tr-TR")} Para
                    </span>
                  )}
                  {reward.levelCoins > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      🪙 {reward.levelCoins} Level Coin
                    </span>
                  )}
                  {reward.epicChests > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                      🏆 {reward.epicChests} Epik Sandık
                    </span>
                  )}
                  {reward.legendaryChests > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                      ✨ {reward.legendaryChests} Efsanevi Sandık
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 p-3 text-center">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-slate-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
