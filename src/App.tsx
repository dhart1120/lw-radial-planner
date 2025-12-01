import { useState } from 'react'
import ClockDisplay from "./features/build-timer/ClockDisplay";
import { getUTCTime, getUserTimezoneOffset, formatTimeAndDate } from './utils/timeUtils' 
import './App.css'
import Header from "./components/Header"
import TimerDial from './features/build-timer/TimerDial';
import AddBuildTask from './features/build-timer/AddBuildTask';
import { useCurrentTime } from './hooks/useCurrentTime';





function App() {
  const localDate = useCurrentTime("minute");
  const [buildTime, setBuildTime] = useState<number>(0); // 10% of max time

  const utcDate = getUTCTime();             // actual UTC time
  const localTZOffset = getUserTimezoneOffset();

  const utcTime = formatTimeAndDate(utcDate, 0);          
  const userTime = formatTimeAndDate(localDate, -localTZOffset);

  return (
    <>
    <Header />
    <div className="w-full flex flex-nowrap gap-5 mb-5">
      <div className="basis-1/2">
        <ClockDisplay date={utcDate} offset={+4} label={<h2>Server Time</h2>} />
      </div>
      <div className="basis-1/2">
        <ClockDisplay date={localDate} label={<h2>Local Time</h2>} />
      </div>
    </div>
    <div className="mt-5 mb-5">
      <TimerDial buildTime={buildTime} onChange={setBuildTime}/>
    </div>
    <AddBuildTask buildTime={buildTime} currentTime={localDate} onAdd={(task) => {}}/>

    </>
  )
}

export default App
