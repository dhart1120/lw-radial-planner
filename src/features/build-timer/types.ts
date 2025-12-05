import buildIcon from "../../assets/images/build.png"
import researchIcon from "../../assets/images/research.png"

export type Config = {
    numOfBuilders: number;
    numOfTechCenter: number;
    maxDaysOnDial: number;
    serverTimeOffset: number;
}

export const defaultConfig: Config = {
  numOfBuilders: 2,
  numOfTechCenter: 2,
  maxDaysOnDial: 10,
  serverTimeOffset: 4
}

export type Task = {
    id?: string;
    title: string;
    type: TaskQueue;
    time: number; // in seconds
    addedAt: Date;
    startAt?: Date;
}

export const TASK_TYPES = {
    builder: {
        queue: "builder",
        label: "Build",
        icon: buildIcon,
        placeholderTaskName: "Upgrade HQ to 30"
    },
    research: {
        queue: "research",
        label: "Research",
        icon: researchIcon,
        placeholderTaskName: "Research unit attack"
    },
} as const;

export type TaskQueue = keyof typeof TASK_TYPES;   // "builder" | "research"
export type TaskType = (typeof TASK_TYPES)[TaskQueue];