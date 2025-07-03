import { useEffect, useState } from "react";
import { getCountdownParts } from "../utils/datetime.js";

const pad = (n) => n.toString().padStart(2, "0");

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
    <span className={`text-xs font-mono ${className}`}>
      {isPast ? (
        <span className="text-red-600">Started</span>
      ) : (
        <>
          {days > 0 && `${days}d `}
          {pad(hours)}:{pad(minutes)}:{pad(seconds)} left
        </>
      )}
    </span>
  );
};

export default CountdownTimer; 