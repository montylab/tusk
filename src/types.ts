export interface Task {
    id: number;
    text: string;
    category: string;
    completed: boolean;
    startTime: number | null; // hour as float (e.g. 9.5 for 9:30)
    duration: number; // minutes
    isShortcut?: boolean; // Marks shortcut templates
    order?: number; // Sorting order in piles
}
