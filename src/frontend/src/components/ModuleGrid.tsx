import ModuleModal from "@/components/ModuleModal";
import ASOv3Amp from "@/components/modules/ASOv3Amp";
import Antenna from "@/components/modules/Antenna";
import BassAmp from "@/components/modules/BassAmp";
import BassSystem from "@/components/modules/BassSystem";
import Canister from "@/components/modules/Canister";
import ChipCommander from "@/components/modules/ChipCommander";
import Compressor from "@/components/modules/Compressor";
import Crossover from "@/components/modules/Crossover";
import EQ from "@/components/modules/EQ";
import Epicenter from "@/components/modules/Epicenter";
import FuseMonitor from "@/components/modules/FuseMonitor";
import GainStructure from "@/components/modules/GainStructure";
import Highs from "@/components/modules/Highs";
import LowEndBooster from "@/components/modules/LowEndBooster";
import MidsAmp from "@/components/modules/MidsAmp";
import PowerManagement from "@/components/modules/PowerManagement";
import PreampBypass from "@/components/modules/PreampBypass";
import ProcessorChar from "@/components/modules/ProcessorChar";
import Protection from "@/components/modules/Protection";
import SignalRouting from "@/components/modules/SignalRouting";
import SmartRangeLimiter from "@/components/modules/SmartRangeLimiter";
import StereoWidth from "@/components/modules/StereoWidth";
import SubwooferControl from "@/components/modules/SubwooferControl";
import Ultra from "@/components/modules/Ultra";
import WiringStatus from "@/components/modules/WiringStatus";
import XMProcessor from "@/components/modules/XMProcessor";
import { useState } from "react";

interface ModuleDef {
  id: number;
  name: string;
  icon: string;
  component: React.ComponentType;
}

// MODULES: UltraCrystal, Phase, Broadcast, Limiter (old), SRS2022, WirelessSignal,
// ChannelMixer removed per Gerrod's instruction.
// ASOv3Amp and SmartRangeLimiter added as replacements.
const MODULES: ModuleDef[] = [
  { id: 1, name: "BASS SYSTEM", icon: "🔊", component: BassSystem },
  { id: 2, name: "EQ", icon: "🎶", component: EQ },
  { id: 3, name: "PROTECTION", icon: "🛡️", component: Protection },
  { id: 4, name: "BASSAMP SRS", icon: "⚡", component: BassAmp },
  { id: 5, name: "MIDS AMP", icon: "🔍", component: MidsAmp },
  { id: 6, name: "HIGHS", icon: "📡", component: Highs },
  { id: 7, name: "ASO-V3 SOVEREIGN", icon: "🔱", component: ASOv3Amp },
  { id: 8, name: "XM PROCESSOR", icon: "📡", component: XMProcessor },
  { id: 9, name: "SMART LIMITER", icon: "📊", component: SmartRangeLimiter },
  { id: 10, name: "BASS EPICENTER", icon: "🌊", component: Epicenter },
  { id: 11, name: "LOW END BOOSTER", icon: "🟡", component: LowEndBooster },
  { id: 12, name: "CANISTER", icon: "🟡", component: Canister },
  { id: 13, name: "ANTENNA", icon: "📡", component: Antenna },
  { id: 14, name: "CROSSOVER", icon: "✂️", component: Crossover },
  { id: 15, name: "COMPRESSOR", icon: "📌", component: Compressor },
  { id: 16, name: "PROCESSOR CHAR", icon: "⚙️", component: ProcessorChar },
  { id: 17, name: "CHIP COMMANDER", icon: "🖥️", component: ChipCommander },
  { id: 18, name: "STEREO WIDTH", icon: "↔️", component: StereoWidth },
  { id: 19, name: "GAIN STRUCTURE", icon: "📊", component: GainStructure },
  { id: 20, name: "SUBWOOFER", icon: "📣", component: SubwooferControl },
  { id: 21, name: "ULTRA", icon: "⚡", component: Ultra },
  { id: 22, name: "SIGNAL ROUTING", icon: "🔀", component: SignalRouting },
  { id: 23, name: "PREAMP BYPASS", icon: "⛔", component: PreampBypass },
  { id: 24, name: "POWER MGMT", icon: "🔋", component: PowerManagement },
  { id: 25, name: "FUSE MONITOR", icon: "🔦", component: FuseMonitor },
  { id: 26, name: "WIRING STATUS", icon: "💡", component: WiringStatus },
];

export default function ModuleGrid() {
  const [openModule, setOpenModule] = useState<ModuleDef | null>(null);

  return (
    <>
      <div className="mb-4">
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(0,212,255,0.6)" }}
        >
          CHIP COMMANDER — 26 MODULES • ALL WIRED • 4 GAUGE • ULTRA AUTHORITY
          ONLINE
        </h2>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
        data-ocid="module_grid"
      >
        {MODULES.map((mod) => (
          <button
            type="button"
            key={mod.id}
            data-ocid={`module.item.${mod.id}`}
            onClick={() => setOpenModule(mod)}
            className="group relative flex flex-col items-center gap-1.5 p-3 rounded border text-center transition-smooth"
            style={{
              background: "rgba(0,10,30,0.8)",
              borderColor: "rgba(0,212,255,0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(0,212,255,0.8)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 15px rgba(0,212,255,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(0,212,255,0.2)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <span className="text-xl">{mod.icon}</span>
            <span
              className="text-xs font-bold uppercase tracking-widest leading-tight"
              style={{ color: "#00d4ff" }}
            >
              {mod.id.toString().padStart(2, "0")} {mod.name}
            </span>
            <span
              className="text-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.4)",
                color: "#00d4ff",
                fontSize: "0.55rem",
              }}
            >
              ● WIRED
            </span>
          </button>
        ))}
      </div>

      {openModule && (
        <ModuleModal
          title={openModule.name}
          onClose={() => setOpenModule(null)}
        >
          <openModule.component />
        </ModuleModal>
      )}
    </>
  );
}
