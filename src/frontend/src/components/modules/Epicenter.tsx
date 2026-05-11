import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useState } from "react";

// Chip config driven by engine state
interface ChipDef {
  id: string;
  label: string;
  active: (boost: number, maximizer: number, paraGain: number) => boolean;
  alwaysOn?: boolean;
}

const CHIPS: ChipDef[] = [
  {
    id: "restoration",
    label: "BASS RESTORATION CHIP",
    active: (boost) => boost > 0,
  },
  {
    id: "maximizer",
    label: "BASS MAXIMIZER CHIP",
    active: (boost) => boost > 30,
  },
  {
    id: "parabass",
    label: "PARABASS CHIP",
    active: (_b, _m, paraGain) => paraGain !== 50,
  },
  {
    id: "pfm",
    label: "PFM CHIP • 14Hz FLOOR",
    active: () => true,
    alwaysOn: true,
  },
];

interface SliderRowProps {
  ocid: string;
  label: string;
  description: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  displayValue: string;
  accentColor?: string;
}

function SliderRow({
  ocid,
  label,
  description,
  min,
  max,
  value,
  onChange,
  displayValue,
  accentColor = "#00d4ff",
}: SliderRowProps) {
  return (
    <div
      className="flex flex-col gap-1 py-2 border-b"
      style={{ borderColor: "rgba(0,212,255,0.1)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#ffd700" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-mono font-bold"
          style={{ color: accentColor }}
        >
          {displayValue}
        </span>
      </div>
      <p className="text-xs" style={{ color: "rgba(0,212,255,0.5)" }}>
        {description}
      </p>
      <input
        data-ocid={ocid}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1"
        style={{ accentColor }}
      />
    </div>
  );
}

export default function Epicenter() {
  const engine = useAudioEngine();

  // Local slider states (0-100 range for all unless noted)
  const [restoration, setRestoration] = useState(50);
  const [maximizer, setMaximizer] = useState(50);
  const [paraCenter, setParaCenter] = useState(60); // Hz
  const [paraWidth, setParaWidth] = useState(50);
  const [paraGain, setParaGain] = useState(50);
  const [bassOutput, setBassOutput] = useState(50);

  // Handlers wired to real audio engine
  const handleRestoration = (v: number) => {
    setRestoration(v);
    setMaximizer(v); // linked
    engine.setEpicenterBoost((v / 100) * 12);
  };

  const handleMaximizer = (v: number) => {
    setMaximizer(v);
    setRestoration(v); // linked
    engine.setEpicenterBoost((v / 100) * 12);
  };

  const handleParaCenter = (v: number) => {
    setParaCenter(v);
    engine.setParaCenter(v);
  };

  const handleParaWidth = (v: number) => {
    setParaWidth(v);
    engine.setParaWidth(v);
  };

  const handleParaGain = (v: number) => {
    setParaGain(v);
    engine.setParaGain(v);
  };

  const handleBassOutput = (v: number) => {
    setBassOutput(v);
    engine.setBassOutputLevel(v);
  };

  // Derived display values
  const restorationDb = ((restoration / 100) * 12).toFixed(1);
  const paraQ = (0.3 + (paraWidth / 100) * 2.7).toFixed(2);
  const paraGainDb = (((paraGain - 50) / 50) * 12).toFixed(1);
  const bassOutputPct = `${bassOutput}%  (${(bassOutput / 50).toFixed(2)}x)`;

  const _chipActive = {
    restoration: restoration > 0,
    maximizer: maximizer > 30,
    parabass: paraGain !== 50,
    pfm: true,
  };

  return (
    <div className="space-y-3">
      {/* Panel Header */}
      <div>
        <div
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "#ffd700" }}
        >
          BASS EPICENTER
        </div>
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          14–40Hz / 14–80Hz &bull; THD 0.002% &bull; SNR 110dB
        </div>
      </div>

      {/* Specs — read only */}
      <div
        className="grid grid-cols-2 gap-1 p-2 rounded"
        style={{
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.12)",
        }}
      >
        {[
          ["FREQ RESP", "14–40Hz | 14–80Hz"],
          ["THD", "0.002%"],
          ["SNR", "110dB"],
          ["PFM FLOOR", "14Hz"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span
              className="text-xs font-bold uppercase"
              style={{ color: "rgba(0,212,255,0.5)" }}
            >
              {k}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "#ffd700" }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* PFM Status Badge */}
      <div className="flex items-center gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: "rgba(0,255,136,0.12)",
            border: "1px solid rgba(0,255,136,0.4)",
            color: "#00ff88",
          }}
          data-ocid="epicenter.pfm_status"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#00ff88" }}
          />
          PFM SUBSONIC FILTER &bull; 14Hz FLOOR &bull; ACTIVE
        </div>
      </div>

      {/* Frequency Lane Display */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-4 rounded flex items-center px-2"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,255,136,0.25) 0%, rgba(0,255,136,0.08) 100%)",
              border: "1px solid rgba(0,255,136,0.3)",
            }}
          >
            <span
              className="text-xs font-bold font-mono uppercase tracking-widest"
              style={{ color: "#00ff88" }}
            >
              14–40Hz &nbsp; BOTTOM NOTE LANE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-4 rounded flex items-center px-2"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.08) 100%)",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            <span
              className="text-xs font-bold font-mono uppercase tracking-widest"
              style={{ color: "#00d4ff" }}
            >
              14–80Hz &nbsp; PUNCH LANE
            </span>
          </div>
        </div>
      </div>

      {/* Command Chain */}
      <div
        className="px-3 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider"
        style={{
          background: "rgba(255,215,0,0.05)",
          border: "1px solid rgba(255,215,0,0.15)",
          color: "rgba(255,215,0,0.7)",
        }}
        data-ocid="epicenter.command_chain"
      >
        ULTRA &rarr; SRL &rarr; VOLUME + CROSSOVER &rarr; EPICENTER
      </div>

      {/* Sliders */}
      <div className="space-y-0.5">
        <SliderRow
          ocid="epicenter.restoration_slider"
          label="BASS RESTORATION"
          description="Recreates missing fundamental frequencies from harmonics"
          min={0}
          max={100}
          value={restoration}
          onChange={handleRestoration}
          displayValue={`${restorationDb} dB`}
        />
        <SliderRow
          ocid="epicenter.maximizer_slider"
          label="BASS MAXIMIZER"
          description="Increases overall bass response"
          min={0}
          max={100}
          value={maximizer}
          onChange={handleMaximizer}
          displayValue={`${maximizer}%`}
        />
        <SliderRow
          ocid="epicenter.para_center_slider"
          label="PARABASS CENTER"
          description="Parametric center frequency"
          min={20}
          max={120}
          value={paraCenter}
          onChange={handleParaCenter}
          displayValue={`${paraCenter} Hz`}
          accentColor="#ffd700"
        />
        <SliderRow
          ocid="epicenter.para_width_slider"
          label="PARABASS WIDTH"
          description="Parametric Q width — lower = wider, higher = narrower"
          min={0}
          max={100}
          value={paraWidth}
          onChange={handleParaWidth}
          displayValue={`Q ${paraQ}`}
          accentColor="#ffd700"
        />
        <SliderRow
          ocid="epicenter.para_gain_slider"
          label="PARABASS GAIN"
          description="Parametric gain \u00b112dB"
          min={0}
          max={100}
          value={paraGain}
          onChange={handleParaGain}
          displayValue={`${paraGainDb} dB`}
          accentColor="#ffd700"
        />
        <SliderRow
          ocid="epicenter.bass_output_slider"
          label="BASS OUTPUT LEVEL"
          description="Master bass output after all epicenter processing"
          min={0}
          max={100}
          value={bassOutput}
          onChange={handleBassOutput}
          displayValue={bassOutputPct}
          accentColor="#00ff88"
        />
      </div>

      {/* Chip Status Indicators */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {CHIPS.map((chip, idx) => {
          const active =
            chip.alwaysOn || chip.active(restoration, maximizer, paraGain);
          return (
            <div
              key={chip.id}
              className="flex items-center justify-between px-3 py-2 rounded"
              style={{
                background: active
                  ? chip.alwaysOn
                    ? "rgba(0,255,136,0.1)"
                    : "rgba(0,212,255,0.1)"
                  : "rgba(255,215,0,0.05)",
                border: `1px solid ${
                  active
                    ? chip.alwaysOn
                      ? "rgba(0,255,136,0.4)"
                      : "rgba(0,212,255,0.4)"
                    : "rgba(255,215,0,0.2)"
                }`,
              }}
              data-ocid={`epicenter.chip.${idx + 1}`}
            >
              <span
                className="text-xs font-bold uppercase leading-tight"
                style={{
                  color: active
                    ? chip.alwaysOn
                      ? "#00ff88"
                      : "#00d4ff"
                    : "rgba(255,215,0,0.6)",
                  fontSize: "0.6rem",
                }}
              >
                {chip.label}
              </span>
              <span
                className="text-xs font-bold uppercase px-1.5 py-0.5 rounded ml-1 shrink-0"
                style={{
                  background: active
                    ? chip.alwaysOn
                      ? "rgba(0,255,136,0.2)"
                      : "rgba(0,212,255,0.2)"
                    : "rgba(255,215,0,0.1)",
                  color: active
                    ? chip.alwaysOn
                      ? "#00ff88"
                      : "#00d4ff"
                    : "rgba(255,215,0,0.5)",
                  fontSize: "0.55rem",
                }}
              >
                {active ? "ACTIVE" : "STANDBY"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
