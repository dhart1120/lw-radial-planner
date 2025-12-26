import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { type Config, defaultConfig } from "@/features/build-timer/types";
import { Settings } from "lucide-react"

type HeaderProps = {
  config: Config;
  onUpdateConfig: (config: Config) => void;
}

export default function Header({config, onUpdateConfig}: HeaderProps) {
  const refs = {
    numOfBuilders: useRef<HTMLInputElement | null>(null),
    numOfTechCenter: useRef<HTMLInputElement | null>(null),
    maxDaysOnDial: useRef<HTMLInputElement | null>(null),
    serverTimeOffset: useRef<HTMLInputElement | null>(null),
  } satisfies Record<keyof Config, React.RefObject<HTMLInputElement | null>>;

  const handleUpdate = () => {
    const newConfig = Object.fromEntries(
      Object.keys(defaultConfig).map(k => {
        const key = k as keyof Config;
        const raw = refs[key].current?.value;
        const value = raw ? parseInt(raw, 10) : defaultConfig[key];
        return [key, value];
      })
    ) as Config;

    onUpdateConfig(newConfig);
  };

  const handleReset = function() {
    onUpdateConfig({ ...defaultConfig })
  }

  return (
    <header className="flex flex-col gap-4 mb-6">

      {/* Row: Button + Instructions */}
      <div className="flex items-center gap-4">
        {/* Settings Button */}
        <Popover>
          <PopoverTrigger asChild>
            <PopoverAnchor asChild>
              <Button variant="default" size="icon-xl">
                <Settings className="size-8" />
              </Button>
            </PopoverAnchor>
          </PopoverTrigger>

          <PopoverContent
            side="bottom"
            className="w-72 rounded-2xl border border-slate-700 bg-neutral-900
                      text-slate-100 shadow-xl p-5"
          >
            <div className="space-y-5">
              <p className="text-xl font-semibold">Settings</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <label htmlFor="numOfBuilders" className="self-center text-slate-300">
                  Builders
                </label>
                <input
                  ref={refs.numOfBuilders}
                  id="numOfBuilders"
                  type="number"
                  defaultValue={config.numOfBuilders}
                  className="h-8 rounded bg-neutral-800 border border-sky-600
                            px-2 text-center text-slate-100
                            focus:outline-none focus:ring-2 focus:ring-sky-500"
                />

                <label htmlFor="numOfTech" className="self-center text-slate-300">
                  Tech Centers
                </label>
                <input
                  ref={refs.numOfTechCenter}
                  id="numOfTech"
                  type="number"
                  defaultValue={config.numOfTechCenter}
                  className="h-8 rounded bg-neutral-800 border border-sky-600
                            px-2 text-center text-slate-100
                            focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <label htmlFor="maxDays" className="self-center text-slate-300">
                  Max Days
                </label>
                <input
                  ref={refs.maxDaysOnDial}
                  id="maxDays"
                  type="number"
                  defaultValue={config.maxDaysOnDial}
                  className="h-8 rounded bg-neutral-800 border border-sky-600
                            px-2 text-center text-slate-100
                            focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <label htmlFor="maxDays" className="self-center text-slate-300">
                  Server Offset
                </label>
                <input
                  ref={refs.serverTimeOffset}
                  id="serverTimeOffset"
                  type="number"
                  defaultValue={config.serverTimeOffset}
                  className="h-8 rounded bg-neutral-800 border border-sky-600
                            px-2 text-center text-slate-100
                            focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-2">
                <PopoverClose asChild>
                  <Button onClick={handleUpdate} className="w-full">Update</Button>
                </PopoverClose>
                <PopoverClose asChild>
                  <Button onClick={handleReset} variant="destructive" className="w-full">Reset</Button>
                </PopoverClose>
              </div>
            </div>
          </PopoverContent>
        </Popover>


        {/* Instructions TEXT — larger, aligned right of button */}
        <div className="text-slate-300 text-lg font-medium">
          Turn dial to select build time. Add multiple for future planning.
        </div>
      </div>

    </header>
  );
}
