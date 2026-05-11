import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useCallback, useRef, useState } from "react";

/*
 * Canister operates on a PARALLEL path — completely independent from EQ.
 * EQ does NOT touch frequencies below 250Hz except Band 0 (19Hz) and Band 1 (47Hz)
 * which are the dedicated low-end sliders.
 * Canister nodes (F1/F2 for 14-40Hz lane, F3 for 80Hz punch lane) sit AFTER
 * the LR crossover, on a wet/dry mix that bypasses the EQ entirely.
 * The canister wet path activates ONLY when the hold button is pressed.
 */

export default function Canister() {
  const engine = useAudioEngine();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = engine.canisterActive;
  const bottomBoost = engine.canisterBottomBoost;
  const punchBoost = engine.canisterPunchBoost;

  const startHold = useCallback(() => {
    setIsHolding(true);
    setHoldProgress(0);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        engine.setCanisterActive(!isActive);
        setIsHolding(false);
        setHoldProgress(0);
      }
    }, 100);
    holdTimeoutRef.current = setTimeout(() => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
    }, 2500);
  }, [engine, isActive]);

  const stopHold = useCallback(() => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="px-3 py-2 rounded space-y-1"
        style={{
          background: "rgba(255,215,0,0.08)",
          border: "1px solid rgba(255,215,0,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#ffd700" }}
          >
            CANISTER
          </div>
          <div
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              background: "rgba(255,215,0,0.1)",
              border: "1px solid rgba(255,215,0,0.3)",
              color: "#ffd700",
            }}
          >
            7,000W CHARACTERISTICS
          </div>
        </div>
        <div className="text-xs" style={{ color: "rgba(255,215,0,0.5)" }}>
          UNNAMED — Hold 15 min to claim
        </div>
      </div>

      {/* Status Badge */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded"
        style={{
          background: isActive ? "rgba(0,255,136,0.08)" : "rgba(0,0,0,0.3)",
          border: `1px solid ${
            isActive ? "rgba(0,255,136,0.4)" : "rgba(255,215,0,0.15)"
          }`,
        }}
        data-ocid="canister.status_badge"
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: isActive ? "#00ff88" : "rgba(255,215,0,0.5)" }}
        >
          {isActive ? "● CANISTER ACTIVE" : "○ NOT ACTIVATED"}
        </span>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: isActive ? "#00ff88" : "rgba(255,215,0,0.2)",
            boxShadow: isActive ? "0 0 8px #00ff88" : "none",
            animation: isActive ? "pulse 1.2s ease-in-out infinite" : "none",
          }}
        />
      </div>

      {/* Slider 1: 14-40Hz Bottom Note Lane */}
      <div
        className="px-3 py-3 rounded space-y-2"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${
            isActive ? "rgba(255,107,53,0.4)" : "rgba(255,107,53,0.15)"
          }`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#ff6b35" }}
            >
              SLIDER 1: 14-40Hz BOTTOM NOTE
            </div>
            <div className="text-xs" style={{ color: "rgba(255,107,53,0.5)" }}>
              Bottom note lane boost (F1 19Hz + F2 40Hz)
            </div>
          </div>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#ff6b35" }}
          >
            {bottomBoost}%
          </span>
        </div>
        <input
          data-ocid="canister.bottom_slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={bottomBoost}
          disabled={!isActive}
          onChange={(e) =>
            engine.setCanisterBottomBoost(Number(e.target.value))
          }
          className="w-full"
          style={{ accentColor: "#ff6b35", opacity: isActive ? 1 : 0.4 }}
        />
        <div className="flex justify-between">
          <span className="text-xs" style={{ color: "rgba(255,107,53,0.3)" }}>
            0%
          </span>
          <span className="text-xs" style={{ color: "rgba(255,107,53,0.3)" }}>
            100%
          </span>
        </div>
      </div>

      {/* Slider 2: 14-80Hz Punch Lane */}
      <div
        className="px-3 py-3 rounded space-y-2"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${
            isActive ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"
          }`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              SLIDER 2: 14-80Hz PUNCH
            </div>
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
              Punch lane boost (F3 80Hz peaking)
            </div>
          </div>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: "#00d4ff" }}
          >
            {punchBoost}%
          </span>
        </div>
        <input
          data-ocid="canister.punch_slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={punchBoost}
          disabled={!isActive}
          onChange={(e) => engine.setCanisterPunchBoost(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "#00d4ff", opacity: isActive ? 1 : 0.4 }}
        />
        <div className="flex justify-between">
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.3)" }}>
            0%
          </span>
          <span className="text-xs" style={{ color: "rgba(0,212,255,0.3)" }}>
            100%
          </span>
        </div>
      </div>

      {/* Hold progress */}
      {isHolding && (
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,215,0,0.2)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${holdProgress}%`,
              background: isActive
                ? "linear-gradient(90deg, #ff6b6b, #ffd700)"
                : "linear-gradient(90deg, #ffd700, #00d4ff)",
              boxShadow: "0 0 8px rgba(255,215,0,0.5)",
            }}
            data-ocid="canister.hold_progress"
          />
        </div>
      )}

      {/* Hold to Activate */}
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        className="w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-smooth select-none"
        style={{
          background: isHolding
            ? isActive
              ? "rgba(255,60,60,0.2)"
              : "rgba(255,215,0,0.2)"
            : isActive
              ? "rgba(255,60,60,0.08)"
              : "rgba(255,215,0,0.08)",
          border: `1px solid ${
            isHolding
              ? isActive
                ? "rgba(255,60,60,0.7)"
                : "rgba(255,215,0,0.7)"
              : isActive
                ? "rgba(255,60,60,0.4)"
                : "rgba(255,215,0,0.4)"
          }`,
          color: isActive ? "#ff6b6b" : "#ffd700",
          boxShadow: isHolding ? "0 0 15px rgba(255,215,0,0.4)" : "none",
        }}
        data-ocid="canister.hold_button"
        aria-label={
          isActive ? "Hold to deactivate Canister" : "Hold to activate Canister"
        }
      >
        {isHolding
          ? `${isActive ? "DEACTIVATING" : "ACTIVATING"}... ${holdProgress}%`
          : isActive
            ? "■ HOLD TO DEACTIVATE"
            : "▶ HOLD TO ACTIVATE"}
      </button>

      {/* Footer */}
      <div
        className="space-y-1 pt-1 border-t"
        style={{ borderColor: "rgba(255,215,0,0.1)" }}
      >
        <div className="text-xs" style={{ color: "rgba(255,107,53,0.5)" }}>
          ● SLIDER 1 — 14-40Hz bottom note lane
        </div>
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
          ● SLIDER 2 — 14-80Hz punch lane
        </div>
        <div className="text-xs" style={{ color: "rgba(255,215,0,0.4)" }}>
          ● BOTH LANES INDEPENDENT — speaker limits respected
        </div>
      </div>
    </div>
  );
}
