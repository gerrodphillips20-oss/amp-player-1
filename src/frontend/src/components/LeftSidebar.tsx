import { useAudioEngine } from "@/hooks/useAudioEngine";

const BAR_HEIGHTS: number[] = [3, 5, 7, 9, 6, 4];

const channels = [
  { id: "B1", label: "B1", color: "#00d4ff" },
  { id: "B2", label: "B2", color: "#00d4ff" },
  { id: "M", label: "M", color: "#ffd700" },
  { id: "H", label: "H", color: "#00ff88" },
];

export default function LeftSidebar() {
  const { isPlaying } = useAudioEngine();

  return (
    <aside
      className="w-16 flex flex-col items-center py-4 gap-4 border-r"
      style={{
        background: "rgba(0,5,20,0.9)",
        borderColor: "rgba(0,212,255,0.2)",
      }}
      data-ocid="left_sidebar"
    >
      {channels.map((ch) => (
        <div
          key={ch.id}
          className="flex flex-col items-center gap-1"
          data-ocid={`sidebar.channel.${ch.id}`}
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: ch.color }}
          >
            {ch.label}
          </span>
          {/* Signal bars */}
          <div className="flex gap-0.5 items-end h-8">
            {BAR_HEIGHTS.map((h) => (
              <div
                key={h}
                className="w-1 rounded-sm"
                style={{
                  height: `${isPlaying ? h * 3 : 4}px`,
                  background: ch.color,
                  opacity: isPlaying ? 1 : 0.25,
                  transition: "height 0.1s ease",
                  animation: isPlaying
                    ? `signal-bar ${0.4 + h * 0.05}s ease-in-out infinite alternate`
                    : "none",
                }}
              />
            ))}
          </div>
          <div
            className="text-xs font-bold px-1 py-0.5 rounded"
            style={{
              background: isPlaying
                ? `${ch.color}22`
                : "rgba(255,255,255,0.05)",
              border: `1px solid ${isPlaying ? ch.color : "rgba(255,255,255,0.1)"}`,
              color: isPlaying ? ch.color : "rgba(255,255,255,0.3)",
              fontSize: "0.6rem",
            }}
          >
            {isPlaying ? "LIVE" : "OFF"}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes signal-bar {
          from { transform: scaleY(0.6); }
          to { transform: scaleY(1.4); }
        }
      `}</style>
    </aside>
  );
}
