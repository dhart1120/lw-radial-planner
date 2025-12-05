import type { TaskType } from "./types";

type QueueIconProps = {
    taskType: TaskType;
    onClick?: () => void
};

export function QueueIcon({taskType, onClick}: QueueIconProps) {
    return (
        <div onClick={onClick} className="w-15 h-15 relative rounded-xl border-2 border-sky-400 group cursor-pointer">
            <img width={"100%"} height={"100%"} src={taskType.icon} alt={taskType.label} />
        </div>
    );
}