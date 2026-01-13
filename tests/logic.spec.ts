import { test, expect } from '@playwright/test';
import { getTaskStatus } from '../src/logic/taskStatus';
import type { Task } from '../src/types';

test.describe('Task Status Logic', () => {

    test('should identify past tasks based on date', () => {
        // Use a fixed date to ensure stability, coupled with dynamic checks matching source logic
        const now = new Date();
        const isoDate = now.toISOString().split('T')[0];
        // Create a date definitely in the past relative to isoDate
        // To be safe, let's just use string manipulation for yesterday

        // Find yesterday
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        const task: Partial<Task> = {
            startTime: 10,
            duration: 60,
            date: yesterdayStr
        };

        expect(getTaskStatus(task, now)).toBe('past');
    });

    test('should identify future tasks based on date', () => {
        const now = new Date();
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

        const task: Partial<Task> = {
            startTime: 10,
            duration: 60,
            date: tomorrowStr
        };
        expect(getTaskStatus(task, now)).toBe('future');
    });

    test('should identify past tasks earlier today', () => {
        const now = new Date();
        const isoDate = now.toISOString().split('T')[0];
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const totalMinutes = currentHours * 60 + currentMinutes;

        // Task ended 10 minutes ago
        const taskEndMinutes = totalMinutes - 10;
        const duration = 30;
        const taskStartMinutes = taskEndMinutes - duration;

        const task: Partial<Task> = {
            startTime: taskStartMinutes / 60,
            duration: duration,
            date: isoDate
        };

        expect(getTaskStatus(task, now)).toBe('past');
    });

    test('should identify future tasks later today', () => {
        const now = new Date();
        const isoDate = now.toISOString().split('T')[0];
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const totalMinutes = currentHours * 60 + currentMinutes;

        // Task starts in 10 minutes
        const taskStartMinutes = totalMinutes + 10;

        const task: Partial<Task> = {
            startTime: taskStartMinutes / 60,
            duration: 30,
            date: isoDate
        };

        expect(getTaskStatus(task, now)).toBe('future');
    });

    test('should identify on-air tasks', () => {
        const now = new Date();
        const isoDate = now.toISOString().split('T')[0];
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const totalMinutes = currentHours * 60 + currentMinutes;

        // Task started 10 minutes ago and lasts 30 minutes (so it's valid for another 20)
        const taskStartMinutes = totalMinutes - 10;

        const task: Partial<Task> = {
            startTime: taskStartMinutes / 60,
            duration: 30,
            date: isoDate
        };

        expect(getTaskStatus(task, now)).toBe('on-air');
    });

    test('should return null if startTime or date is missing', () => {
        const now = new Date();
        const task1: Partial<Task> = { startTime: 10, duration: 60 }; // No date
        const task2: Partial<Task> = { date: '2025-01-01', duration: 60 }; // No startTime

        expect(getTaskStatus(task1, now)).toBeNull();
        expect(getTaskStatus(task2, now)).toBeNull();
    });
});
