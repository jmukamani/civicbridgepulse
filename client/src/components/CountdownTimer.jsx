import { useEffect, useState } from "react";
import { getCountdownParts } from "../utils/datetime.js";

const pad = (n) => n.toString().padStart(2, "0");

// Small badge used for each time unit
const TimeUnit = ({ value, label }) => (
  <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 text-[10px] leading-none flex items-baseline gap-0.5">
    <span className="font-mono font-semibold">{value}</span>
    <span className="uppercase text-[8px]">{label}</span>
  </span>
);

/**
 * CountdownTimer component
 * Props:
 *  - date: target date/time (Date|string|number)
 *  - className: optional css classes
 */
const CountdownTimer = ({ date, className = "" }) => {
  const [remaining, setRemaining] = useState(() => getCountdownParts(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getCountdownParts(date));
    }, 1000);
    return () => clearInterval(interval);
  }, [date]);

  if (!remaining) return null;

  const { days, hours, minutes, seconds } = remaining;
  const isPast = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {isPast ? (
        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Started</span>
      ) : (
        <>
          {days > 0 && <TimeUnit value={days} label="d" />}
          <TimeUnit value={pad(hours)} label="h" />
          <TimeUnit value={pad(minutes)} label="m" />
          <TimeUnit value={pad(seconds)} label="s" />
        </>
      )}
    </span>
  );
};

export default CountdownTimer; 