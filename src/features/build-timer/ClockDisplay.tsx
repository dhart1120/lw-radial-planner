import type { ReactNode } from "react";
import { addSeconds } from '../../utils/timeUtils' 


type ClockDisplayProps = {
  date: Date,
  offset?: number, 
  label?: string | ReactNode
  onChangeOffset?: (newOffset: number) => {}
}

// offset in hours
export default function ClockDisplay({ date, offset, label }: ClockDisplayProps) {
  const offsetInSeconds = (offset ?? 0) * 60 * 60;
  const adjustedDate = addSeconds(date, offsetInSeconds)

  const dateStr = adjustedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timeStr = adjustedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-neutral-800 text-slate-200 rounded-xl px-5 py-4 shadow-lg text-center">
      {label}
      <div className="text-2xl font-semibold mt-1">{timeStr}</div>
      <div className="text-sm text-slate-400">{dateStr}</div>
    </div>
  )
}