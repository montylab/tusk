import type { Task, Category } from '../types'

export interface OnboardingConfig {
	categories: Omit<Category, 'id'>[]
	scheduledTasks: Omit<Task, 'id'>[]
	todoTasks: Omit<Task, 'id'>[]
	shortcutTasks: Omit<Task, 'id' | 'order'>[]
}

export const onboardingConfig: OnboardingConfig = {
	categories: [
		{ name: 'Work', color: '#ef4444', order: 10, isDeepWork: true },
		{ name: 'Learning', color: '#3b82f6', order: 20 },
		{ name: 'Life Admin', color: '#f97316', order: 30 },
		{ name: 'Rest', color: '#22c55e', order: 40 }
	],
	scheduledTasks: [
		{
			text: 'Past Task (Already Completed)',
			category: 'Work',
			completed: true,
			startTime: -2,
			duration: 60,
			description: "I was scheduled earlier. Since my time passed, I'm auto-completed! ✅"
		},
		{
			text: 'Current Task (Active)',
			category: 'Work',
			completed: false,
			startTime: 0, // Will be centered around baseTime
			duration: 60,
			description: "I am happening right now! ⏱️ You'll hear a sound when I finish."
		},
		{
			text: 'Future Task (Planned)',
			category: 'Learning',
			completed: false,
			startTime: 1.5,
			duration: 60,
			description: "I'm scheduled for later. Drag me to change my time! 🗓️"
		},
		{
			text: 'Deep Work Focus',
			category: 'Work',
			completed: false,
			startTime: 3,
			duration: 90,
			isDeepWork: true,
			description: 'Deep Work Session 🧠 (High impact task - check stats for me later!)'
		},
		{
			text: 'Task with Description',
			category: 'Learning',
			completed: false,
			startTime: 5,
			duration: 30,
			description:
				'Once in edit menu, you can add a verbose description 📝 like this one! Double-click me or use the edit button to see my details.'
		}
	],
	todoTasks: [
		{ text: 'Schedule me! Drag me into the calendar 🗓️', category: 'Work', completed: false, duration: 60, startTime: null, order: 10000 },
		{ text: "I'm a simple To-Do item", category: 'Life Admin', completed: false, duration: 30, startTime: null, order: 20000 },
		{ text: 'Reorder me by dragging', category: 'Learning', completed: false, duration: 15, startTime: null, order: 30000 }
	],
	shortcutTasks: [
		{ text: 'Coffee Break ☕', category: 'Rest', completed: false, duration: 15, startTime: null },
		{ text: 'Email Batch 📩', category: 'Life Admin', completed: false, duration: 30, startTime: null }
	]
}
