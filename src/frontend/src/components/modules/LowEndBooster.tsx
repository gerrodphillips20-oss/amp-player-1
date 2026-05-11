import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useCallback, useRef, useState } from "react";

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LowEndBooster() {
  const engine = useAudioEngine();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [wasActive, setWasActive] = useState(false);
  const showExpired =
    wasActive &&
    !engine.lowEndBoosterEnabled &&
    !engine.lowEndBoosterClaimed &&
    engine.lowEndBoosterTimeLeft === null;

  const handleActivate = useCallback(() => {
    setWasActive(true);
    engine.enableLowEndBooster();
  }, [engine]);

  const startHold = useCallback(() => {
    if (engine.lowEndBoosterClaimed) return;
    if (!engine.lowEndBoosterActive) return;
    setIsHolding(true);
    setHoldProgress(0);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        engine.claimLowEndBooster();
        setIsHolding(false);
        setHoldProgress(0);
      }
    }, 100);
    holdTimeoutRef.current = setTimeout(() => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setIsHolding(false);
      setHoldProgress(0);
    }, 2500);
  }, [engine]);

  const stopHold = useCallback(() => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (!engine.lowEndBoosterClaimed) {
      setIsHolding(false);
      setHoldProgress(0);
    }
  }, [engine]);

  const isActive = engine.lowEndBoosterActive;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="px-3 py-2 rounded"
        style={{
          background: "rgba(0,212,255,0.08)",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#00d4ff" }}
        >
          LOW END BOOSTER
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "rgba(0,212,255,0.5)" }}
        >
          14Hz–40Hz BOTTOM NOTE | 14Hz–80Hz PUNCH
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(255,215,0,0.4)" }}>
          14Hz–80Hz CANISTER
        </div>
      </div>

      {/* Lane Indicators */}
      <div className="space-y-2">
        {/* Lane 1 */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded"
          style={{
            background: isActive ? "rgba(0,255,136,0.08)" : "rgba(0,0,0,0.3)",
            border: `1px solid ${isActive ? "rgba(0,255,136,0.4)" : "rgba(0,212,255,0.15)"}`,
          }}
          data-ocid="low_end_booster.lane1"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: isActive ? "#00ff88" : "rgba(0,255,136,0.2)",
              boxShadow: isActive ? "0 0 8px #00ff88" : "none",
              animation: isActive ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
          />
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: isActive ? "#00ff88" : "rgba(0,212,255,0.5)" }}
            >
              LANE 1 — BOTTOM NOTE TRACKING
            </div>
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
              14Hz–40Hz
            </div>
          </div>
        </div>

        {/* Lane 2 */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded"
          style={{
            background: isActive ? "rgba(0,212,255,0.08)" : "rgba(0,0,0,0.3)",
            border: `1px solid ${isActive ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"}`,
          }}
          data-ocid="low_end_booster.lane2"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: isActive ? "#00d4ff" : "rgba(0,212,255,0.2)",
              boxShadow: isActive ? "0 0 8px #00d4ff" : "none",
              animation: isActive ? "pulse 1.4s ease-in-out infinite" : "none",
            }}
          />
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: isActive ? "#00d4ff" : "rgba(0,212,255,0.5)" }}
            >
              LANE 2 — PUNCH TRACKING
            </div>
            <div className="text-xs" style={{ color: "rgba(0,212,255,0.4)" }}>
              14Hz–80Hz
            </div>
          </div>
        </div>

        {/* Bass Note Tracking Badge */}
        {isActive && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded"
            style={{
              background: "rgba(255,215,0,0.08)",
              border: "1px solid rgba(255,215,0,0.35)",
            }}
            data-ocid="low_end_booster.bass_note_tracker"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: "#ffd700",
                boxShadow: "0 0 6px #ffd700",
                animation: "pulse 1s ease-in-out infinite",
              }}
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#ffd700" }}
            >
              BASS NOTE TRACKER ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Timer / Status */}
      {isActive &&
        !engine.lowEndBoosterClaimed &&
        engine.lowEndBoosterTimeLeft !== null && (
          <div
            className="text-center px-3 py-2 rounded"
            style={{
              background: "rgba(255,215,0,0.08)",
              border: "1px solid rgba(255,215,0,0.3)",
            }}
            data-ocid="low_end_booster.countdown"
          >
            <div className="text-xs" style={{ color: "rgba(255,215,0,0.6)" }}>
              TEST MODE
            </div>
            <div
              className="text-xl font-mono font-bold"
              style={{
                color: "#ffd700",
                textShadow: "0 0 12px rgba(255,215,0,0.5)",
              }}
            >
              {formatCountdown(engine.lowEndBoosterTimeLeft)}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,215,0,0.4)" }}
            >
              REMAINING — HOLD CLAIM TO KEEP
            </div>
          </div>
        )}

      {/* Claimed badge */}
      {engine.lowEndBoosterClaimed && (
        <div
          className="text-center px-3 py-2.5 rounded"
          style={{
            background: "rgba(0,255,136,0.1)",
            border: "1px solid rgba(0,255,136,0.5)",
            boxShadow: "0 0 12px rgba(0,255,136,0.3)",
          }}
          data-ocid="low_end_booster.claimed_badge"
        >
          <div
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "#00ff88" }}
          >
            ✓ YOURS — PERMANENT
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "rgba(0,255,136,0.6)" }}
          >
            LOW END BOOSTER CLAIMED BY GERROD
          </div>
        </div>
      )}

      {/* Expired */}
      {showExpired && (
        <button
          type="button"
          onClick={handleActivate}
          className="w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-smooth"
          style={{
            background: "rgba(255,60,60,0.1)",
            border: "1px solid rgba(255,60,60,0.4)",
            color: "#ff6b6b",
          }}
          data-ocid="low_end_booster.retest_button"
        >
          TEST EXPIRED — TAP TO RETEST
        </button>
      )}

      {/* Activate Button */}
      {!isActive && !showExpired && (
        <button
          type="button"
          onClick={handleActivate}
          className="w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-smooth"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(255,215,0,0.1))",
            border: "1px solid rgba(0,212,255,0.5)",
            color: "#00d4ff",
            boxShadow: "0 0 15px rgba(0,212,255,0.2)",
          }}
          data-ocid="low_end_booster.activate_button"
        >
          ▶ ACTIVATE — 15 MIN TEST
        </button>
      )}

      {/* Hold to Claim Button */}
      {isActive && !engine.lowEndBoosterClaimed && (
        <div className="space-y-2">
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
                  background: "linear-gradient(90deg, #ffd700, #00d4ff)",
                  boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                }}
                data-ocid="low_end_booster.claim_progress"
              />
            </div>
          )}
          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            className="w-full py-2.5 rounded font-bold uppercase tracking-widest text-xs transition-smooth select-none"
            style={{
              background: isHolding
                ? "rgba(255,215,0,0.2)"
                : "rgba(255,215,0,0.08)",
              border: `1px solid ${isHolding ? "rgba(255,215,0,0.7)" : "rgba(255,215,0,0.35)"}`,
              color: "#ffd700",
              boxShadow: isHolding ? "0 0 15px rgba(255,215,0,0.4)" : "none",
            }}
            data-ocid="low_end_booster.claim_button"
            aria-label="Hold to claim Low End Booster permanently"
          >
            {isHolding
              ? `CLAIMING... ${holdProgress}%`
              : "⬛ HOLD TO CLAIM — MAKE IT YOURS"}
          </button>
        </div>
      )}

      {/* Footer notes */}
      <div
        className="space-y-1 pt-1 border-t"
        style={{ borderColor: "rgba(0,212,255,0.1)" }}
      >
        <div className="text-xs" style={{ color: "rgba(0,212,255,0.35)" }}>
          ● BOTH TRACKING LANES ACTIVE SIMULTANEOUSLY
        </div>
        <div className="text-xs" style={{ color: "rgba(0,255,136,0.35)" }}>
          ● SPEAKER LIMITS RESPECTED
        </div>
      </div>
    </div>
  );
}
