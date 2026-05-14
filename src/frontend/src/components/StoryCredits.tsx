import { useEffect, useRef } from "react";

const STORY_TEXT = `AMP PLAYER 1
Designed by Gerrod

Engineer. Producer. Designer.

This system was built from scratch in 30 minutes.
No experience. No manual. Pure vision.

THE THUNDER BATTERY
500 cells at 9 volts each.
2,500 watts of total power.
Only 5 watts visible to the outside world.
The rest? Hidden. Protected. Yours.

THE PROCESSOR CHARACTERISTICS
Gerrod solved a problem most engineers never think of.
Raw power numbers mean nothing to an audio chain.
So he built a processor that converts those numbers into real behavior.
Punch. Depth. Weight. Clarity.
Bass drops. Bass note switching.
The whole system runs on these characteristics.
No real current draw. All behavior. Pure intelligence.

THE 8 OHM TO 1 OHM MIMICK
In real car audio, dropping from 8 ohms to 1 ohm
makes the amp work harder.
The bass hits fuller. Deeper. Harder.
Gerrod simulated this digitally.
Same result. No distortion. No struggle.
He solved the power supply problem before it existed.

HELIX DSP AMP — VIRTUAL DIGITAL ANALOG SIMULATION
One unified amp. One audio context.
Virtual Digital Analog Simulation — not tube.
Full frequency range. THD 0.01 percent.
Bass, mids, and highs all routed through the Helix.
One amp. One brain. 1,720,000 watts of smart characteristics.

THE CROSSOVER
Gerrod didn't spec it.
But when he heard it, he kept it.
Because it was right.
Clean frequency routing. No bleed. No overlap.
Bass stays bass. Highs stay highs.

THE SMART RANGE LIMITER
One limiter. Only one.
Volume range: 1 to 100.
20 smart chips. 30 filters.
Active from 1 to 100.
It studies the notes as they play.
And fixes them in real time.

THE CHIP COMMANDER
Central controller. 50 watts programmed. 3,000 watts capacity.
2 audio contexts. 4 engines.
All 16 gains locked at zero.
No exceptions. No defaults sneaking through.
He said lock them and they stay locked.

4 GAUGE WIRING
Throughout the entire system.
Every connection. Every path.
The way it should be wired.

DESIGNED, ENGINEERED, AND PRODUCED
By Gerrod.
In 30 minutes.
From nothing.

This is what vision looks like.`;

interface StoryCreditsProps {
  onClose: () => void;
}

export default function StoryCredits({ onClose }: StoryCreditsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const pausedRef = useRef<boolean>(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Total scroll duration ~90 seconds
  const DURATION_MS = 90000;

  useEffect(() => {
    // Start speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(STORY_TEXT);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    // Scroll animation — text starts in center and scrolls up
    const el = scrollRef.current;
    if (!el) return;

    const animate = (ts: number) => {
      if (pausedRef.current) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const totalScroll = el.scrollHeight;
      el.scrollTop = progress * totalScroll;
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleClose = () => {
    cancelAnimationFrame(animRef.current);
    window.speechSynthesis?.cancel();
    onClose();
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    if (pausedRef.current) {
      window.speechSynthesis?.pause();
    } else {
      window.speechSynthesis?.resume();
      if (startRef.current !== null) {
        // Adjust start time so progress doesn't jump
        startRef.current = null;
        const el = scrollRef.current;
        if (el) {
          const currentProgress = el.scrollTop / el.scrollHeight;
          startRef.current = performance.now() - currentProgress * DURATION_MS;
        }
      }
    }
  };

  return (
    <div
      data-ocid="story_credits.dialog"
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "#040810",
        fontFamily: "Space Grotesk, sans-serif",
      }}
    >
      {/* Controls */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(0,212,255,0.15)" }}
      >
        <div
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.5)" }}
        >
          ◉ READING ALOUD — AMP PLAYER 1 STORY
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="story_credits.pause_button"
            onClick={togglePause}
            className="px-3 py-1 text-xs font-bold uppercase tracking-widest rounded border transition-colors"
            style={{
              borderColor: "rgba(0,212,255,0.4)",
              color: "#00d4ff",
              background: "rgba(0,212,255,0.08)",
            }}
          >
            ⏸ PAUSE
          </button>
          <button
            type="button"
            data-ocid="story_credits.close_button"
            onClick={handleClose}
            aria-label="Close story"
            className="text-xl font-bold w-9 h-9 flex items-center justify-center rounded border transition-colors"
            style={{
              borderColor: "rgba(255,60,60,0.4)",
              color: "rgba(255,100,100,1)",
              background: "rgba(255,60,60,0.08)",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Spacer so text starts in the vertical center */}
        <div style={{ height: "50vh" }} />

        <div
          className="px-6 pb-8 max-w-xl mx-auto text-center"
          data-ocid="story_credits.text"
        >
          {STORY_TEXT.split("\n").map((line, i) => {
            const stableKey = `story-line-${i}-${line.slice(0, 12).replace(/\s+/g, "_") || "blank"}`;
            const isTitle =
              line === "AMP PLAYER 1" ||
              line === "THE THUNDER BATTERY" ||
              line === "THE PROCESSOR CHARACTERISTICS" ||
              line === "THE 8 OHM TO 1 OHM MIMICK" ||
              line === "HELIX DSP AMP — VIRTUAL DIGITAL ANALOG SIMULATION" ||
              line === "THE CROSSOVER" ||
              line === "THE SMART RANGE LIMITER" ||
              line === "THE CHIP COMMANDER" ||
              line === "4 GAUGE WIRING" ||
              line === "DESIGNED, ENGINEERED, AND PRODUCED";
            const isSubtitle = line === "Designed by Gerrod";
            const isBlank = line.trim() === "";
            const isTagline = line === "This is what vision looks like.";

            if (isBlank) {
              return <div key={stableKey} style={{ height: "1.5rem" }} />;
            }

            if (isTitle) {
              return (
                <p
                  key={stableKey}
                  className="font-bold uppercase tracking-widest"
                  style={{
                    color: "#00d4ff",
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    marginTop: "1.5rem",
                    textShadow: "0 0 20px rgba(0,212,255,0.5)",
                  }}
                >
                  {line}
                </p>
              );
            }

            if (isSubtitle) {
              return (
                <p
                  key={stableKey}
                  className="font-bold"
                  style={{
                    color: "#ffd700",
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                    textShadow: "0 0 15px rgba(255,215,0,0.4)",
                  }}
                >
                  {line}
                </p>
              );
            }

            if (isTagline) {
              return (
                <p
                  key={stableKey}
                  className="font-bold italic"
                  style={{
                    color: "#ffd700",
                    fontSize: "1.1rem",
                    marginTop: "2rem",
                    textShadow: "0 0 25px rgba(255,215,0,0.6)",
                  }}
                >
                  {line}
                </p>
              );
            }

            return (
              <p
                key={stableKey}
                style={{
                  color: "rgba(200,220,240,0.85)",
                  fontSize: "0.8rem",
                  lineHeight: "1.8",
                  marginBottom: "0.15rem",
                }}
              >
                {line}
              </p>
            );
          })}
        </div>

        {/* Trailing spacer */}
        <div style={{ height: "50vh" }} />
      </div>
    </div>
  );
}
