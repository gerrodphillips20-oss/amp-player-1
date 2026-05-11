import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function ModuleModal({ title, onClose, children }: Props) {
  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-end justify-center border-0 p-0 max-w-none max-h-none w-full h-full"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="module.dialog"
    >
      <div
        className="w-full max-w-2xl rounded-t-xl border-t border-x overflow-hidden"
        style={{
          background: "rgba(4,10,30,0.97)",
          borderColor: "rgba(0,212,255,0.4)",
          maxHeight: "80vh",
          boxShadow: "0 -8px 40px rgba(0,212,255,0.2)",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{
            borderColor: "rgba(0,212,255,0.3)",
            background: "rgba(0,15,40,0.9)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full animate-glow-pulse"
              style={{ background: "#00d4ff" }}
            />
            <span
              className="font-bold uppercase tracking-widest text-sm"
              style={{ color: "#00d4ff" }}
            >
              {title}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-widest"
              style={{
                background: "rgba(0,212,255,0.15)",
                color: "rgba(0,212,255,0.8)",
                border: "1px solid rgba(0,212,255,0.3)",
              }}
            >
              4 GAUGE • WIRED
            </span>
          </div>
          <button
            type="button"
            data-ocid="module.close_button"
            onClick={onClose}
            className="p-1.5 rounded transition-smooth hover:bg-accent/10"
            style={{ color: "rgba(0,212,255,0.7)" }}
            aria-label="Close module"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(80vh - 60px)" }}
        >
          <div className="p-5">{children}</div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </dialog>
  );
}
