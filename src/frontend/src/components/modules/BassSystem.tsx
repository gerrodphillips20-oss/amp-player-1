import { Label } from "@/components/ui/label";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

function Row({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between py-2 border-b"
      style={{ borderColor: "rgba(0,212,255,0.1)" }}
    >
      <span
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: "rgba(0,212,255,0.8)" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export default function BassSystem() {
  const engine = useAudioEngine();
  const [foundation, setFoundation] = useState(true);
  const [cheater, setCheater] = useState(false);
  const [equake, setEquake] = useState(false);
  const [naturalBottom, setNaturalBottom] = useState(15);
  const [soulMode, setSoulMode] = useState(0);

  const handleFoundation = (v: boolean) => {
    setFoundation(v);
    engine.setBassFoundation(v);
    if (v) {
      setCheater(false);
      engine.setCheaterBeater(false);
    }
  };

  const handleCheater = (v: boolean) => {
    setCheater(v);
    engine.setCheaterBeater(v);
    if (v) {
      setFoundation(false);
      engine.setBassFoundation(false);
    }
  };

  const handleEquake = (v: boolean) => {
    setEquake(v);
    engine.setEQuake(v);
  };

  const handleNaturalBottom = (v: number) => {
    setNaturalBottom(v);
    engine.setNaturalBottom(v);
  };

  return (
    <div className="space-y-1">
      <div
        className="text-xs font-bold mb-3 px-2 py-1 rounded"
        style={{
          background: "rgba(0,212,255,0.1)",
          color: "#00d4ff",
          border: "1px solid rgba(0,212,255,0.3)",
        }}
      >
        14-80Hz • LOWPASS 80Hz ACTIVE
      </div>

      <Row label="FOUNDATION BASS (14-50Hz)">
        <input
          data-ocid="bass.foundation_checkbox"
          type="checkbox"
          checked={foundation}
          onChange={(e) => handleFoundation(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: "#00d4ff" }}
        />
        {foundation && <span className="badge-live">ACTIVE</span>}
      </Row>

      <Row label="NATURAL BOTTOM">
        <span className="text-xs font-mono" style={{ color: "#ffd700" }}>
          {naturalBottom}%
        </span>
        <input
          data-ocid="bass.natural_bottom_slider"
          type="range"
          min={0}
          max={100}
          value={naturalBottom}
          onChange={(e) => handleNaturalBottom(Number(e.target.value))}
          className="w-32"
          style={{ accentColor: "#00d4ff" }}
        />
      </Row>

      <Row label="CHEATER BEATER (33Hz)">
        <input
          data-ocid="bass.cheater_checkbox"
          type="checkbox"
          checked={cheater}
          onChange={(e) => handleCheater(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: "#ffd700" }}
        />
        {cheater && <span className="badge-live">ACTIVE</span>}
      </Row>

      <Row label="E-QUAKE EARTHQUAKE">
        <input
          data-ocid="bass.equake_checkbox"
          type="checkbox"
          checked={equake}
          onChange={(e) => handleEquake(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: "#ff4444" }}
        />
        {equake && <span className="badge-live">ACTIVE</span>}
      </Row>

      <Row label="SOUL MODE">
        <span className="text-xs font-mono" style={{ color: "#ffd700" }}>
          {soulMode}%
        </span>
        <input
          data-ocid="bass.soul_mode_slider"
          type="range"
          min={0}
          max={100}
          value={soulMode}
          onChange={(e) => setSoulMode(Number(e.target.value))}
          className="w-32"
          style={{ accentColor: "#ffd700" }}
        />
      </Row>

      <div
        className="mt-4 text-xs font-mono"
        style={{ color: "rgba(0,212,255,0.5)" }}
      >
        BASS PATH: FILE → BASS AUDIO CTX → BIQUAD LOWPASS{" "}
        {engine.bassFilterFreq}Hz → GAIN → DEST
      </div>
      <Label className="sr-only">Bass System Module</Label>
    </div>
  );
}
