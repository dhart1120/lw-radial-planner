import { useState } from "react";
import Header from "@/components/Header";
import AddBuildTask from "./AddBuildTask";
import ClockDisplay from "./ClockDisplay";
import TimerDial from "./TimerDial";
import { TaskList } from "./TaskList";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { type Config, type Task, defaultConfig } from "./types";
import { getUTCTime } from "@/utils/timeUtils";
import { v4 as uuidV4 } from "uuid";

export function RadialPlannerPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("task-list", []);
  const [config, setConfig] = useLocalStorage<Config>("config", defaultConfig);

  const localDate = useCurrentTime("minute");
  const [buildTime, setBuildTime] = useState<number>(0);
  const [dialVersion, setDialVersion] = useState<number>(0);

  const utcDate = getUTCTime();

  const handleUpdateConfig = (newConfig: Config) => {
    setConfig(newConfig);
    setBuildTime(0);
    setDialVersion((value) => value + 1);
  };

  const sortTasks = (taskList: Task[]): Task[] =>
    [...taskList].sort((a, b) => {
      const aStarted = !!a.startAt;
      const bStarted = !!b.startAt;

      if (aStarted !== bStarted) return aStarted ? -1 : 1;

      if (a.startAt && b.startAt) {
        const diff = a.startAt.getTime() - b.startAt.getTime();
        if (diff !== 0) return diff;
      }

      return a.addedAt.getTime() - b.addedAt.getTime();
    });

  const addTask = (task: Task, startImmediately: boolean) => {
    const now = new Date();

    const newTask: Task = {
      ...task,
      id: uuidV4(),
      ...(startImmediately ? { startAt: now } : {}),
    };

    setTasks((list) => sortTasks([...list, newTask]));
    setBuildTime(0);
    setDialVersion((value) => value + 1);
  };

  const handleAddTask = (task: Task) => {
    addTask(task, true);
  };

  const handleQueueTask = (task: Task) => {
    addTask(task, false);
  };

  const handleOnStartTask = (id?: string) => {
    if (!id) return;

    setTasks((taskList) => {
      const updated = taskList.map((task) =>
        task.id === id ? { ...task, startAt: new Date() } : task
      );
      return sortTasks(updated);
    });
  };

  const handleOnDeleteTask = (id?: string) => {
    if (!id) return;
    setTasks((taskList) => taskList.filter((task) => task.id !== id));
  };

  return (
    <div className="space-y-8">
      <Header config={config} onUpdateConfig={handleUpdateConfig} />
      <div className="w-full flex flex-nowrap gap-5 mb-5">
        <div className="flex-1">
          <ClockDisplay
            date={utcDate}
            offset={config.serverTimeOffset}
            label={<h2>Server Time</h2>}
          />
        </div>
        <div className="flex-1">
          <ClockDisplay date={localDate} label={<h2>Local Time</h2>} />
        </div>
      </div>
      <div className="mt-5 mb-5">
        <TimerDial
          key={dialVersion}
          maxDays={config.maxDaysOnDial}
          buildTime={buildTime}
          onChange={setBuildTime}
        />
      </div>
      <AddBuildTask
        buildTime={buildTime}
        currentTime={localDate}
        onStartNow={handleAddTask}
        onAddToPlan={handleQueueTask}
      />
      <div className="mt-5 mb-5">
        <TaskList
          tasks={tasks}
          onStartTask={handleOnStartTask}
          onDeleteTask={handleOnDeleteTask}
        />
      </div>
    </div>
  );
}
