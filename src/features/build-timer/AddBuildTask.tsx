import { useState } from "react"; 
import { addSeconds, formatTimeAndDate } from "../../utils/timeUtils"
import buildIcon from "../../assets/images/build.png"
import researchIcon from "../../assets/images/research.png"
import scheduleIcon from "../../assets/images/schedule.png"

type Task = {
    title: string;
}

type AddBuildTaskProps = {
    buildTime: number;
    currentTime: Date;
    onAdd: (task: Task) => void
}

export default function AddBuildTask({buildTime, currentTime, onAdd}: AddBuildTaskProps) {
    const [task, setTask] = useState<string>("");

    const completionTimeUtc = addSeconds(currentTime, buildTime * 60);
    const completionTimeUser = formatTimeAndDate(completionTimeUtc, 0);

    //TODO this should be nextStartTimeForQueue + buildTime
    const queueCompletionTimeUser = completionTimeUser; 
    const queueSize = 0;
    
    const handleOnClick = function() {
        //TODO clear the input
        onAdd({
            title: task
        });
    }
    return(
        <div className="bg-neutral-800 text-slate-200 shadow-xl rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 relative rounded-xl border-2 border-sky-400 group cursor-pointer">
                    <wimg width={"100%"} height={"100%"} src={buildIcon} alt="Task Type Select" />
                    <div className="absolute bottom-0 w-full text-sm text-white bg-gray-900 opacity-80 rounded-b-xl group-hover:bg-sky-700 align-middle">Change</div>
                </div>
                <div className="flex-1">
                    <label className="block mb-1 text-sm text-left text-slate-400">Builder</label>
                    <input
                        onChange={(e) => setTask(e.target.value)}
                        className="w-full bg-neutral-900 text-slate-100 border border-sky-600 rounded px-3 py-2 focus:outline-none focus:ring focus:ring-sky-500"
                        placeholder="Build HQ 30"
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
            <button onClick={handleOnClick} className="basis-1/2 w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl py-2">
                Start Now
            </button>
            <button onClick={handleOnClick} className="basis-1/2 w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl py-2">
                Add to Plan {queueSize > 0 ?`(${queueSize})` : ""}
            </button>
            </div>

            
        </div>
    );
}