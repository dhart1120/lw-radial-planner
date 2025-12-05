import { useState } from "react"; 
import { Button } from "@/components/ui/button";
import { addSeconds, formatTimeAndDate, getUTCTime } from "../../utils/timeUtils"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { type Task, type TaskType, TASK_TYPES } from "./types";
import { QueueIcon } from "./QueueIcon";

type AddBuildTaskProps = {
    buildTime: number;
    currentTime: Date;
    onAddToPlan: (task: Task) => void
    onStartNow: (task: Task) => void
};

export default function AddBuildTask({buildTime, currentTime, onAddToPlan, onStartNow}: AddBuildTaskProps) {
    const [taskName, setTaskName] = useState<string>("");
    const [taskType, setTaskType] = useState<TaskType>(TASK_TYPES.builder);

    const completionTimeUtc = addSeconds(currentTime, buildTime * 60);
    const completionTimeUser = formatTimeAndDate(completionTimeUtc, 0);

    //TODO this should be nextStartTimeForQueue + buildTime
    const queueCompletionTimeUser = completionTimeUser; 
    const queueSize = 0;

    const createTask = function(): Task {
        return {
            title: taskName.trim() || "Default title",
            type: taskType.queue,
            time: buildTime,
            addedAt: getUTCTime()
        }
    }

    const handleOnClick = function(callBack: (task: Task) => void) {
        setTaskName("");
        callBack(createTask());
    }

    return(
        <div className="bg-neutral-800 text-slate-200 shadow-xl rounded-2xl p-2 space-y-6">
            <div className="flex items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <PopoverAnchor asChild>
                        <Button variant="ghost" className="w-20 h-20" size="icon-xl">
                            <div className="w-20 h-20 relative rounded-xl border-2 border-sky-400 group cursor-pointer">
                                <img width={"100%"} height={"100%"} src={taskType.icon} alt="Select Task Type" />
                                <div className="absolute bottom-0 w-full text-sm text-white bg-gray-900 opacity-80 rounded-b-xl group-hover:bg-sky-700 align-middle">Change</div>
                            </div>
                        </Button>
                        </PopoverAnchor>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="flex flex-row gap-2 w-auto">
                        <QueueIcon taskType={TASK_TYPES.schedule} onClick={() => setTaskType(TASK_TYPES.schedule)}/>
                        <QueueIcon taskType={TASK_TYPES.builder} onClick={() => setTaskType(TASK_TYPES.builder)}/>
                        <QueueIcon taskType={TASK_TYPES.research} onClick={() => setTaskType(TASK_TYPES.research)}/>
                    </PopoverContent>
                </Popover>

                <div className="flex-1">
                    <label className="block mb-1 text-sm text-left text-slate-400">{taskType.label}</label>
                    <input
                        key={taskType.queue}
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        className="w-full bg-neutral-900 text-slate-100 border border-sky-600 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-sky-500"
                        placeholder={taskType.placeholderTaskName}
                    />
                </div>
            </div>
                
            <div className="text-slate-300 text-center text-sm">
                {buildTime > 0 ? (
                    <>
                    <div>Start now to be completed <em className="text-sky-400">{completionTimeUser}</em></div>
                    <div>Add to plan for approx. <em className="text-sky-400">{queueCompletionTimeUser}</em></div>
                    </>
                ) : (
                    <>Set a duration to see completion time</>
                )}
            </div>
            
            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => handleOnClick(onStartNow)}
                    disabled={buildTime === 0 || taskName.trim() == ""}
                    className="flex-1"
                >
                    Start Now
                </Button>

                <Button
                    onClick={() => handleOnClick(onAddToPlan)}
                    disabled={buildTime === 0 || taskName.trim() == ""}
                    className="flex-1"
                >
                    Add to Plan {queueSize > 0 ? `(${queueSize})` : ""}
                </Button>
                </div>            
        </div>
    );
}