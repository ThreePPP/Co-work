'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Task, TaskPriority } from '../../types';
import { Avatar } from '../ui/Avatar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface TaskCalendarViewProps {
  tasks: Task[];
  onOpenCreateWithDate?: (dateStr: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onOpenCreateWithDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Map tasks to dates
  const getTasksForDay = (day: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const tDate = new Date(t.dueDate).toISOString().split('T')[0];
      return tDate === targetDateStr;
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30';
      case 'LOW':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40 hover:bg-slate-700/80';
    }
  };

  // Days grid construction
  const calendarCells = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateStr: '',
      tasks: [],
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      isToday: isToday(d),
      dateStr,
      tasks: getTasksForDay(d),
    });
  }

  // 3. Next month leading days to complete grid (up to 35 or 42 cells)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      dateStr: '',
      tasks: [],
    });
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400">
              {tasks.filter((t) => t.dueDate).length} tasks scheduled with deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900 text-center text-xs font-bold text-slate-400 py-3 uppercase tracking-wider">
          <span className="text-rose-400">Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span className="text-indigo-400">Sat</span>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 bg-slate-950/40">
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors group relative ${
                cell.isCurrentMonth ? 'bg-slate-900/40 hover:bg-slate-800/30' : 'bg-slate-950/70 opacity-40'
              } ${cell.isToday ? 'ring-1 ring-inset ring-indigo-500/50 bg-indigo-950/10' : ''}`}
            >
              {/* Cell Top: Day Number & Add Quick Task Button */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    cell.isToday
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : cell.isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {cell.day}
                </span>

                {cell.isCurrentMonth && onOpenCreateWithDate && (
                  <button
                    onClick={() => onOpenCreateWithDate(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-all"
                    title={`Add task for ${cell.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Task Items inside Cell */}
              <div className="space-y-1.5 my-1 flex-1 overflow-y-auto max-h-[85px]">
                {cell.tasks?.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`block px-2 py-1 rounded-xl text-[10px] font-semibold border transition-all truncate shadow-sm ${getPriorityColor(
                      task.priority
                    )} ${task.status === 'DONE' ? 'opacity-60 line-through' : ''}`}
                    title={task.title}
                  >
                    <span className="truncate">{task.title}</span>
                  </Link>
                ))}
              </div>

              {/* Cell Footer: Task Count Dot */}
              {cell.tasks && cell.tasks.length > 0 && (
                <div className="text-[9px] text-slate-500 font-bold text-right pt-0.5">
                  {cell.tasks.length} {cell.tasks.length === 1 ? 'task' : 'tasks'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
