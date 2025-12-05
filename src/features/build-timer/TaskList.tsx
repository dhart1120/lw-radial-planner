import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Task, TASK_TYPES } from "./types";
import { Card } from "@/components/ui/card";
import { QueueIcon } from "./QueueIcon";
import { addSeconds, formatDuration, formatTimeAndDate } from "@/utils/timeUtils";
import { Button } from "@/components/ui/button";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { Trash2 } from "lucide-react";

type TaskListProps = {
    tasks: Task[];
    onStartTask: (id?: string) => void
    onDeleteTask: (id?: string) => void
};

const TASK_TYPE_KEYS = Object.keys(TASK_TYPES) as Array<keyof typeof TASK_TYPES>;

export function TaskList({ tasks, onStartTask, onDeleteTask }: TaskListProps) {
    const currentTime = useCurrentTime()

    const counts = Object.fromEntries(
        TASK_TYPE_KEYS.map(k => [k, 0])
    ) as Record<keyof typeof TASK_TYPES, number>;
    tasks.forEach(t => counts[t.type]++);

    return (
        <div className="bg-neutral-800 text-slate-200 shadow-xl rounded-2xl p-2 space-y-6 mt-5 mb-5">
            <Tabs defaultValue={TASK_TYPES.builder.queue}>
                
                <TabsList className="w-full">
                    {TASK_TYPE_KEYS.map(key => {
                        const taskType = TASK_TYPES[key];
                        return (
                            <TabsTrigger key={key} value={taskType.queue}>
                                {taskType.label} {counts[taskType.queue] > 0 ? `(${counts[taskType.queue]})` : ""}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {TASK_TYPE_KEYS.map(key => {
                    const taskType = TASK_TYPES[key];
                    return (
                        <TabsContent className="flex flex-col gap-3 pt-3 pb-3" key={key} value={taskType.queue}>
                            {tasks.filter(t => t.type === taskType.queue).map(task => {
                                const completionTimeUtc = addSeconds(currentTime, task.time * 60);
                                const completionTimeUser = formatTimeAndDate(completionTimeUtc, 0);

                                return (
                                <Card key={task.id} className="relative flex flex-col p-2 gap-5">
    
                                    {/* Small red X delete button */}
                                    <Button variant="destructive"
                                        onClick={() => onDeleteTask(task.id) }
                                        className="absolute top-3 right-3 w-6 h-6 p-0 font-bold align-baseline"
                                    >
                                    <Trash2 className="w-3 h-3" />
                                    </Button>

                                    <div className="flex flex-row gap-2">
                                    <QueueIcon taskType={taskType} />
                                    <div className="flex flex-col text-left">
                                        <span className="text-bold">{task.title}</span>
                                        <span className="text-sm">Original time: <span className="text-accent">{formatDuration(task.time)}</span></span>
                                        {task.startAt ? (
                                            <>
                                                <span className="text-sm">Started at: <span className="text-accent">{formatTimeAndDate(task.startAt, 0)}</span></span>
                                                <span className="text-sm">Completes at: <span className="text-accent">{completionTimeUser}</span></span>
                                            </>
                                        ) : (
                                            <span className="text-sm">Completes at approx: <span className="text-accent">{completionTimeUser}</span></span>
                                        )}
                                        
                                        
                                    </div>
                                    </div>

                                    <div className="w-full flex flex-row gap-5">
                                    {!task.startAt && (
                                        <Button onClick={() => onStartTask(task.id)} className="flex-1" variant="outline-primary">
                                        Start
                                        </Button>
                                    )}
                                    </div>

                                </Card>
                            )})}

                            {tasks.filter(t => t.type === taskType.queue).length === 0 && (
                                <div className="p-5">
                                    <h2>There are no tasks of this type</h2>
                                </div>
                            )}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
