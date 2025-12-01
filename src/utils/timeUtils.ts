export function getUTCTime(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    )
  );
}

export function formatTimeAndDate(utcDate: Date, offsetMinutes: number): string {
  // Convert to ms
  const localMs = utcDate.getTime() + offsetMinutes * 60_000;
  const localDate = new Date(localMs);

  const date = localDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const time = localDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${date} ${time}`;
}

export function getUserTimezoneOffset(): number {
  // JS offset is reversed: UTC - local
  // We want: local = utc + offset
  // So flip the sign.
  return -new Date().getTimezoneOffset();
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDuration(minutes: number): string {
  const days = Math.floor(minutes / 1440);           // 1440 = 24 * 60
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);

  return parts.join(" ");
}