import React from "react";
import { cn } from "@/lib/utils";

export interface AnimatedEmojiProps {
  emoji: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  bubble?: boolean;
  side?: "player" | "opponent";
  interactive?: boolean;
  mode?: "action" | "ambient" | "static" | string;
}

export function getEmojiAnimationClass(emoji: string, mode: "action" | "ambient" | "static" | string = "action"): string {
  if (mode === "static") return "";
  if (mode === "ambient") return "animate-emoji-ambient";

  switch (emoji) {
    case "😭":
      return "animate-emoji-cry";
    case "😂":
      return "animate-emoji-laugh";
    case "😡":
      return "animate-emoji-rage";
    case "😱":
      return "animate-emoji-scream";
    case "😏":
      return "animate-emoji-smirk";
    case "🤫":
      return "animate-emoji-shush";
    case "💩":
      return "animate-emoji-poop";
    case "😎":
      return "animate-emoji-cool";
    case "🤑":
      return "animate-emoji-money";
    case "😘":
      return "animate-emoji-kiss";
    case "🤡":
      return "animate-emoji-clown";
    case "🥇":
    case "🥈":
    case "🥉":
    case "👑":
    case "🏆":
    case "✨":
      return "animate-emoji-gold";
    case "👍":
      return "animate-emoji-thumbsup";
    default:
      return "animate-emoji-pop";
  }
}

function getEmojiParticles(emoji: string): { particle: string; delay: string; left: string; drift: string }[] {
  switch (emoji) {
    case "😭":
      return [
        { particle: "💧", delay: "0ms", left: "15%", drift: "-2px" },
        { particle: "💧", delay: "400ms", left: "70%", drift: "2px" },
      ];
    case "😂":
      return [
        { particle: "💦", delay: "0ms", left: "20%", drift: "-4px" },
        { particle: "💦", delay: "350ms", left: "75%", drift: "4px" },
      ];
    case "😡":
      return [
        { particle: "💢", delay: "0ms", left: "75%", drift: "3px" },
        { particle: "🔥", delay: "300ms", left: "20%", drift: "-3px" },
      ];
    case "🤑":
      return [
        { particle: "✨", delay: "0ms", left: "15%", drift: "-3px" },
        { particle: "💸", delay: "350ms", left: "75%", drift: "3px" },
      ];
    case "😘":
      return [
        { particle: "💖", delay: "0ms", left: "75%", drift: "4px" },
        { particle: "❤️", delay: "400ms", left: "25%", drift: "-4px" },
      ];
    case "😎":
      return [
        { particle: "✨", delay: "0ms", left: "15%", drift: "-2px" },
        { particle: "⭐", delay: "400ms", left: "75%", drift: "3px" },
      ];
    case "🥇":
    case "🥈":
    case "🥉":
    case "👑":
    case "🏆":
      return [
        { particle: "✨", delay: "0ms", left: "15%", drift: "-3px" },
        { particle: "🌟", delay: "350ms", left: "75%", drift: "3px" },
      ];
    case "🤡":
      return [
        { particle: "🎈", delay: "0ms", left: "75%", drift: "3px" },
      ];
    default:
      return [];
  }
}

function getAuraGradient(emoji: string, isOpponent: boolean): string {
  if (emoji === "😡") return "from-red-600/30 via-orange-500/20 to-transparent";
  if (emoji === "🤑") return "from-emerald-500/30 via-teal-500/20 to-transparent";
  if (emoji === "😘") return "from-pink-500/30 via-rose-500/20 to-transparent";
  if (emoji === "😭") return "from-blue-500/30 via-cyan-500/20 to-transparent";
  if (emoji === "🥇" || emoji === "👑" || emoji === "🏆") return "from-amber-400/30 via-yellow-500/20 to-transparent";
  return isOpponent ? "from-red-500/20 via-slate-800 to-transparent" : "from-blue-500/20 via-slate-800 to-transparent";
}

export const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({
  emoji,
  className,
  size = "md",
  bubble = false,
  side = "player",
  interactive = false,
  mode = "action",
}) => {
  const animClass = getEmojiAnimationClass(emoji, mode);
  const isOpponent = side === "opponent";
  const particles = bubble ? getEmojiParticles(emoji) : [];
  const isCrying = emoji === "😭";

  const sizeClasses = {
    xs: "text-base",
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
    "2xl": "text-5xl",
    "3xl": "text-6xl",
  };

  const content = (
    <div className="relative inline-flex items-center justify-center select-none">
      {/* Particle Effects (Rendered in bubble mode) */}
      {particles.map((p, idx) => (
        <span
          key={idx}
          className={cn(
            "absolute pointer-events-none text-xs select-none z-10 filter drop-shadow-sm",
            isCrying ? "animate-emoji-tear" : "animate-emoji-particle"
          )}
          style={{
            left: p.left,
            animationDelay: p.delay,
            top: isCrying ? "45%" : "-10%",
            ["--drift-x" as any]: p.drift,
          }}
        >
          {p.particle}
        </span>
      ))}

      {/* Main Animated Emoji Character with smooth GPU transform */}
      <span
        className={cn(
          "inline-block transform-gpu leading-none select-none transition-transform duration-200 ease-out",
          sizeClasses[size],
          animClass,
          interactive && "hover:scale-120 active:scale-95 cursor-pointer hover:rotate-3",
          className
        )}
      >
        {emoji}
      </span>
    </div>
  );

  if (!bubble) {
    return content;
  }

  const auraGradient = getAuraGradient(emoji, isOpponent);

  return (
    <div
      className={cn(
        "relative z-50 animate-emoji-bubble-pop select-none filter drop-shadow-2xl",
        isOpponent ? "origin-bottom-right" : "origin-bottom-left"
      )}
    >
      <div
        className={cn(
          "relative bg-slate-900/95 backdrop-blur-md border-2 rounded-2xl p-3 flex items-center justify-center min-w-[72px] min-h-[64px] transition-all",
          isOpponent
            ? "border-red-500/70 shadow-[0_8px_25px_rgba(239,68,68,0.3)]"
            : "border-blue-500/70 shadow-[0_8px_25px_rgba(59,130,246,0.3)]"
        )}
      >
        {/* Soft atmospheric ambient glow behind the emoji */}
        <div
          className={cn(
            "absolute inset-1 rounded-xl bg-gradient-to-t opacity-70 pointer-events-none",
            auraGradient
          )}
        />

        {content}

        {/* Speech Bubble Pointer Tail */}
        {isOpponent ? (
          <div className="absolute -bottom-2 -left-1.5 w-3.5 h-3.5 bg-slate-900 border-l-2 border-b-2 border-red-500/70 transform rotate-45" />
        ) : (
          <div className="absolute -bottom-2 right-3.5 w-3.5 h-3.5 bg-slate-900 border-r-2 border-b-2 border-blue-500/70 transform rotate-45" />
        )}
      </div>
    </div>
  );
};
