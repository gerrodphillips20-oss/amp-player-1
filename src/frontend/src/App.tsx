import HeadUnit from "@/components/HeadUnit";
import ModuleGrid from "@/components/ModuleGrid";
import StatusBar from "@/components/StatusBar";
import { AudioEngineProvider } from "@/hooks/useAudioEngine";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AudioEngineProvider>
        <div
          className="min-h-screen bg-background text-foreground flex flex-col w-full overflow-x-hidden"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <HeadUnit />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 w-full min-w-0">
            <ModuleGrid />
          </main>
          <StatusBar />
        </div>
      </AudioEngineProvider>
    </QueryClientProvider>
  );
}
