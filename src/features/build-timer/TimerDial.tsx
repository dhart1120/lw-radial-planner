import CircularSlider from "@fseehawer/react-circular-slider";
import { formatDuration } from "../../utils/timeUtils";

type TimerDialProps = {
    buildTime: number // in minutes
    onChange: (value: number) => void
}

type DialValueProps = {
  value: string | number,
  completionTime?: string
}

function DialValue({ value, completionTime }: DialValueProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-300 text-xl font-semibold">
      {value}
      {completionTime && (
        <div className="text-slate-400 text-sm mt-1">{completionTime}</div>
      )}
    </div>
  );
}

export default function TimerDial({buildTime, onChange}: TimerDialProps) {
    return (
        <CircularSlider
            label={formatDuration(buildTime)}
            labelColor="#0284c7"
            knobColor="#0284c7"
            progressColorFrom="#38bdf8"
            progressColorTo="#0284c7"
            min={0}
            max={14400}
            renderLabelValue={<DialValue value={formatDuration(buildTime)} />}
            onChange={value => onChange((typeof value == "string") ? parseInt(value) : value )}
        />
    );
}