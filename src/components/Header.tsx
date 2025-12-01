import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react"

export default function Header() {
  return (
    <header className="flex flex-col gap-4 mb-6">

      {/* Title */}
      <h1 className="text-3xl tracking-wide uppercase font-bold text-slate-200 text-center">
        Build Timer
      </h1>

      {/* Row: Button + Instructions */}
      <div className="flex items-center gap-4">
        {/* Settings Button */}
        <Button variant="default" size="icon-xl">
          <Settings className="size-8" />
        </Button>

        {/* Instructions TEXT — larger, aligned right of button */}
        <div className="text-slate-300 text-lg font-medium">
          Turn dial to select build time. Add multiple for future planning.
        </div>
      </div>

    </header>
  );
}
