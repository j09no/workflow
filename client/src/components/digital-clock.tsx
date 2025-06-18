import { useState, useEffect } from "react";
import { Sun, Moon, Settings, Clock } from "lucide-react";

export function DigitalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const hour = currentTime.getHours();
  const isDayTime = hour >= 6 && hour < 18;

  return (
    <div className="flex items-center space-x-3">
      <div className="text-right">
        <div className="text-lg font-bold text-white tracking-tight">{timeString}</div>
        <div className="flex items-center justify-end space-x-2 text-xs text-gray-400 font-medium">
          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
            isDayTime ? 'bg-yellow-400/20' : 'bg-indigo-400/20'
          }`}>
            {isDayTime ? (
              <Sun className="w-2 h-2 text-yellow-400" />
            ) : (
              <Moon className="w-2 h-2 text-indigo-400" />
            )}
          </div>
          <span>{isDayTime ? 'Day' : 'Night'}</span>
        </div>
      </div>
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="w-11 h-11 glass-button-secondary flex items-center justify-center relative group"
      >
        <Settings className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      </button>
    </div>
  );
}
