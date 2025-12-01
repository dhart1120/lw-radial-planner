import { useEffect, useState } from "react";

export function useCurrentTime(updateEvery: "second" | "minute" = "second") {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());

    update(); // run immediately on mount

    if (updateEvery === "second") {
      // Update every second
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }

    if (updateEvery === "minute") {
      // Sync to the next minute boundary
      const current = new Date();
      const msUntilNextMinute = (60 - current.getSeconds()) * 1000;

      const timeout = setTimeout(() => {
        update();

        // After syncing, update every minute
        const interval = setInterval(update, 60_000);

        // Cleanup both
        return () => clearInterval(interval);
      }, msUntilNextMinute);

      return () => clearTimeout(timeout);
    }
  }, [updateEvery]);

  return now;
}
