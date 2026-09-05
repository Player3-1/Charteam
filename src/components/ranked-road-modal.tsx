import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Check, Coins, Gift, Sparkles, Flag } from "lucide-react";
import { UserData } from "@/types";

interface RankedRoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onClaim: (matchNum: number) => Promise<void>;
}

export interface RankedStep {
  matchNum: number;
  rewardType: "gold" | "epic_chest" | "legendary_chest" | "none";
  label: string;
}

// Generate 500 steps
const STEPS: RankedStep[] = [];
for (let m = 1; m <= 500; m++) {
  let rewardType: RankedStep["rewardType"] = "none";
  let label = `Maç ${m}`;
  if (m === 500) {
    rewardType = "legendary_chest";
    label = `👑 Zirve Efsanevi Sandık`;
  } else if (m % 100 === 0) {
    rewardType = "legendary_chest";
    label = `Büyük Efsanevi Sandık`;
  } else if (m % 50 === 0) {
    rewardType = "legendary_chest";
    label = `Mega Efsanevi Sandık`;
  } else if (m % 10 === 0) {
    rewardType = "legendary_chest";
    label = `Efsanevi Sandık`;
  } else if (m % 5 === 0) {
    rewardType = "epic_chest";
    label = `Epik Sandık`;
  } else if (m % 2 === 0) {
    rewardType = "gold";
    label = `Seviye Ödülü`;
  }
  STEPS.push({ matchNum: m, rewardType, label });
}
const REVERSED_STEPS = [...STEPS].reverse();

export function RankedRoadModal({ isOpen, onClose, user, onClaim }: RankedRoadModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playedCount = user.rankedMatchesPlayed || 0;
  const claimedList = user.claimedRankedRewards || [];

  const scrollToStep = (num: number, behavior: ScrollBehavior = "smooth") => {
    const targetId = `step-${Math.max(1, Math.min(500, num))}`;
    const activeElem = document.getElementById(targetId);
    if (activeElem && containerRef.current) {
      activeElem.scrollIntoView({ behavior, block: "center" });
    }
  };

  // Smooth scroll to the active or nearest step
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollToStep(playedCount, "auto");
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, playedCount]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative flex flex-col w-full max-w-md h-[80vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center relative z-10">
              <div>
                <h3 className="font-display text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 flex items-center gap-2">
                  <span>🏆</span> DERECELİ ÖDÜL YOLU
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Toplam Maç: <span className="text-cyan-400 font-black font-mono">{playedCount}</span> / 500
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation Bar */}
            <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold z-10 shrink-0 gap-1.5">
              <button
                onClick={() => scrollToStep(1)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <span>🏁</span> 1. Adım
              </button>
              <button
                onClick={() => scrollToStep(playedCount)}
                className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/70 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <span>📍</span> Mevcut: {playedCount}
              </button>
              <button
                onClick={() => scrollToStep(500)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/70 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <span>👑</span> 500. Zirve
              </button>
            </div>

            {/* Scrollable Path Container */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 relative bg-radial-gradient from-slate-900 via-slate-950 to-slate-950"
            >
              {/* Central vertical dotted pathway */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-cyan-500/20 -translate-x-1/2 pointer-events-none" />

              {REVERSED_STEPS.map((step) => {
                const { matchNum, rewardType, label } = step;
                const isClaimed = claimedList.includes(matchNum);
                const isUnlocked = matchNum <= playedCount;
                const canClaim = isUnlocked && !isClaimed && rewardType !== "none";
                const isEven = matchNum % 2 === 0;

                // Determine nodes icon / details
                let nodeIcon = <Flag className="w-4 h-4 text-slate-400" />;
                let nodeBg = "bg-slate-800 border-slate-700";
                let textCol = "text-slate-400";
                let rewardDesc = "Adım Geçildi";

                if (rewardType === "gold") {
                  nodeIcon = <Coins className="w-5 h-5 text-yellow-400" />;
                  nodeBg = isUnlocked ? "bg-yellow-950/80 border-yellow-500/50" : "bg-slate-800 border-slate-700";
                  textCol = isUnlocked ? "text-yellow-300" : "text-slate-500";
                  rewardDesc = matchNum >= 250 ? "5.000-10.000 Altın" : (matchNum >= 100 ? "3.000-7.000 Altın" : "2.000-5.000 Altın");
                } else if (rewardType === "epic_chest") {
                  nodeIcon = <Gift className="w-5 h-5 text-purple-400 animate-bounce" />;
                  nodeBg = isUnlocked ? "bg-purple-950/80 border-purple-500/50" : "bg-slate-800 border-slate-700";
                  textCol = isUnlocked ? "text-purple-300 font-bold" : "text-slate-500";
                  rewardDesc = "Epik Sandık";
                } else if (rewardType === "legendary_chest") {
                  nodeIcon = <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />;
                  nodeBg = isUnlocked ? "bg-amber-950/80 border-amber-500/50" : "bg-slate-800 border-slate-700";
                  textCol = isUnlocked ? "text-amber-300 font-black animate-pulse" : "text-slate-500";
                  rewardDesc = matchNum === 500 ? "👑 Büyük Zirve Sandığı" : (matchNum % 100 === 0 ? "🌟 Efsanevi Büyük Sandık" : "Efsanevi Sandık");
                }

                return (
                  <div
                    key={matchNum}
                    id={`step-${matchNum}`}
                    className={`flex items-center w-full relative ${
                      isEven ? "flex-row" : "flex-row-reverse"
                    }`}
                    style={{ contentVisibility: "auto", containIntrinsicSize: "0 68px" }}
                  >
                    {/* Left or Right Side Reward Content Card */}
                    <div className="w-5/12 flex flex-col justify-center px-2">
                      {rewardType !== "none" && (
                        <div
                          className={`p-2.5 rounded-xl border text-xs text-left transition-all relative ${
                            isClaimed
                              ? "bg-slate-950/40 border-slate-900 text-slate-500"
                              : canClaim
                              ? "bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                              : "bg-slate-900/50 border-slate-800/60"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div>
                              <div className={`font-black text-[11px] truncate ${isClaimed ? "line-through opacity-40" : textCol}`}>
                                {rewardDesc}
                              </div>
                              <div className="text-[9px] text-slate-500 font-semibold leading-none mt-1">
                                {label}
                              </div>
                            </div>
                            
                            {/* Claim Button or Status Indicator */}
                            {canClaim ? (
                              <button
                                onClick={() => onClaim(matchNum)}
                                className="px-2.5 py-1 rounded bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 active:scale-95 text-slate-950 text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer shadow-md"
                              >
                                AL 🎁
                              </button>
                            ) : isClaimed ? (
                              <span className="text-[10px] text-emerald-400 font-black flex items-center gap-0.5 bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.5 rounded">
                                <Check className="w-2.5 h-2.5" /> ALINDI
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> KİLİTLİ
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pathway Central Circle/Node */}
                    <div className="w-2/12 flex justify-center relative z-10">
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all relative shadow-inner ${nodeBg} ${
                          isUnlocked && !isClaimed ? "ring-2 ring-cyan-400/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]" : ""
                        }`}
                      >
                        {isUnlocked ? (
                          isClaimed ? (
                            <div className="bg-slate-950 text-slate-600 rounded-full w-full h-full flex items-center justify-center text-xs">
                              ✓
                            </div>
                          ) : (
                            nodeIcon
                          )
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                        )}

                        {/* Level badge floating on node */}
                        <span className="absolute -bottom-2 bg-slate-950 text-cyan-400 font-black font-mono text-[8px] px-1.5 py-0.5 rounded-full border border-slate-800 shadow">
                          {matchNum}
                        </span>
                      </div>
                    </div>

                    {/* Empty opposite placeholder to maintain balance */}
                    <div className="w-5/12" />
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-display font-black rounded-xl transition-all shadow-md cursor-pointer text-sm"
              >
                KAPAT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
