import { useState } from 'react'
import ClockDisplay from "./features/build-timer/ClockDisplay";
import { getUTCTime } from './utils/timeUtils' 
import './App.css'
import Header from "./components/Header"
import TimerDial from './features/build-timer/TimerDial';
import AddBuildTask from './features/build-timer/AddBuildTask';
import { useCurrentTime } from './hooks/useCurrentTime';
import { type Task, type Config, defaultConfig } from './features/build-timer/types';
import { TaskList } from './features/build-timer/TaskList';
import { v4 as uuidV4} from 'uuid';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("task-list", []);
  const [config, setConfig] = useLocalStorage<Config>("config", defaultConfig);
  
  const localDate = useCurrentTime("minute");
  const [buildTime, setBuildTime] = useState<number>(0); // 10% of max time
  const [dialVersion, setDialVersion] = useState<number>(0);
  

  const utcDate = getUTCTime();
  // const localTZOffset = getUserTimezoneOffset();

  // const utcTime = formatTimeAndDate(utcDate, 0);          
  // const userTime = formatTimeAndDate(localDate, -localTZOffset);

  const handleUpdateConfig = function(newConfig: Config) {
    console.log("Updating config", config)
    setConfig(newConfig);
    setBuildTime(0);
    setDialVersion(v => v + 1); // redraw hack
  };

  // Helper: sort started first, then by startedAt, then addedAt
  const sortTasks = (tasks: Task[]): Task[] =>
    [...tasks].sort((a, b) => {
      const aStarted = !!a.startAt;
      const bStarted = !!b.startAt;

      // started tasks first
      if (aStarted !== bStarted) return aStarted ? -1 : 1;

      // both started: sort by startAt ascending
      if (a.startAt && b.startAt) {
        const diff = a.startAt.getTime() - b.startAt.getTime();
        if (diff !== 0) return diff;
      }

      // either both not started, or same startAt: sort by addedAt ascending
      return a.addedAt.getTime() - b.addedAt.getTime();
    });

  // Shared helper to add a task
  const addTask = (task: Task, startImmediately: boolean) => {
    const now = new Date();

    const newTask: Task = {
      ...task,
      id: uuidV4(),
      ...(startImmediately ? { startAt: now } : {}), // omit if not started
    };

    setTasks(list => sortTasks([...list, newTask]));
    setBuildTime(0);
    setDialVersion(v => v + 1); // redraw hack
  };

  const handleAddTask = (task: Task) => {
    console.log("Starting task now", task);
    addTask(task, true);
  };

  const handleQueueTask = (task: Task) => {
    console.log("Adding task to queue", task);
    addTask(task, false);
  };

  const handleOnStartTask = (id?: string) => {
    if (!id) return;

    setTasks(tasks => {
      const updated = tasks.map(t =>
        t.id === id ? { ...t, startAt: new Date() } : t
      );
      return sortTasks(updated);
    });
  };


  const handleOnDeleteTask = function(id?: string) {
    if(!id) return;
    setTasks(tasks => tasks.filter(t => t.id !== id));
  }

  return (
    <>
    <Header config={config} onUpdateConfig={handleUpdateConfig} />
    <div className="w-full flex flex-nowrap gap-5 mb-5">
      <div className="flex-1">
        <ClockDisplay date={utcDate} offset={config.serverTimeOffset} label={<h2>Server Time</h2>} />
      </div>
      <div className="flex-1">
        <ClockDisplay date={localDate} label={<h2>Local Time</h2>} />
      </div>
    </div>
    <div className="mt-5 mb-5">
      <TimerDial key={dialVersion} maxDays={config.maxDaysOnDial} buildTime={buildTime} onChange={setBuildTime}/>
    </div>
    <AddBuildTask buildTime={buildTime} currentTime={localDate} onStartNow={handleAddTask} onAddToPlan={handleQueueTask} />
    <div className="mt-5 mb-5">
      <TaskList tasks={tasks} onStartTask={handleOnStartTask} onDeleteTask={handleOnDeleteTask} />
    </div>
    </>
  )
}

export default App
