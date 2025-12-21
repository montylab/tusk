export interface Task {
    id: string | number;
    text: string;
    category: string;
    completed: boolean;
    startTime: number | null; // hour as float (e.g. 9.5 for 9:30)
    duration: number; // minutes
    date?: string | null; // YYYY-MM-DD for scheduled tasks
    isShortcut?: boolean; // Marks shortcut templates
    order?: number; // Sorting order in piles
    color?: string; // Hex
}
