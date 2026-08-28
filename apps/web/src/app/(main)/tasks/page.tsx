'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '../../../stores/taskStore';
import { useAuthStore } from '../../../stores/authStore';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { TaskCard } from '../../../components/tasks/TaskCard';
import { TaskModal } from '../../../components/tasks/TaskModal';
import { TaskCalendarView } from '../../../components/tasks/TaskCalendarView';
import { TaskTimelineView } from '../../../components/tasks/TaskTimelineView';
import { useTranslation, TranslationKey } from '../../../lib/translations';
import { Avatar } from '../../../components/ui/Avatar';
import {
  CheckSquare,
  Plus,
  Kanban,
  List as ListIcon,
  Search,
  Users,
  Calendar,
  Clock,
  Loader2,
  User as UserIcon,
} from 'lucide-react';

const KANBAN_COLUMNS: Array<{ id: TaskStatus; key: TranslationKey; title: string; color: string; badgeBg: string }> = [
  { id: 'TODO', key: 'todo', title: 'To Do', color: 'border-slate-700', badgeBg: 'bg-slate-700 text-slate-300' },
  { id: 'IN_PROGRESS', key: 'inProgress', title: 'In Progress', color: 'border-indigo-500/50', badgeBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
  { id: 'IN_REVIEW', key: 'inReview', title: 'In Review', color: 'border-purple-500/50', badgeBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  { id: 'DONE', key: 'completed', title: 'Done', color: 'border-emerald-500/50', badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
];

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const {
    tasks,
    stats,
    isLoading,
    viewMode,
    searchQuery,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    fetchTasks,
    fetchStats,
    setViewMode,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    updateTaskStatus,
  } = useTaskStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  const handleCreateNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleCardClick = (task: Task) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      await updateTaskStatus(taskId, status);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Header & Stat Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            {t('tasksTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('tasksDesc')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('totalTasks')}</p>
            <p className="text-base font-extrabold text-white">{stats?.total || tasks.length}</p>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
            <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">{t('inProgress')}</p>
            <p className="text-base font-extrabold text-indigo-400">{stats?.inProgress || 0}</p>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
            <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">{t('completed')}</p>
            <p className="text-base font-extrabold text-emerald-400">{stats?.done || 0}</p>
          </div>
          {stats && stats.overdue > 0 && (
            <div className="px-3.5 py-2 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center animate-pulse">
              <p className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">
                {language === 'th' ? 'เกินกำหนด' : 'Overdue'}
              </p>
              <p className="text-base font-extrabold text-rose-400">{stats.overdue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: View Switcher, Filters, Search & New Task Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Left: View Switcher & Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Switcher Toggle */}
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>{t('kanbanView')}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>{t('listView')}</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{language === 'th' ? 'ปฏิทิน' : 'Calendar'}</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{language === 'th' ? 'ไทม์ไลน์' : 'Timeline'}</span>
            </button>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{t('allPriorities')}</option>
            <option value="LOW">{t('low')}</option>
            <option value="MEDIUM">{t('medium')}</option>
            <option value="HIGH">{t('high')}</option>
            <option value="URGENT">{t('urgent')} 🚨</option>
          </select>

          {/* Assignee Filter: All or My Tasks */}
          <button
            onClick={() =>
              setAssigneeFilter(assigneeFilter === user?.id ? 'ALL' : (user?.id || 'ALL'))
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              assigneeFilter === user?.id
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{language === 'th' ? 'งานของฉัน' : 'My Tasks'}</span>
          </button>
        </div>

        {/* Right: Search & Create Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'th' ? 'ค้นหางาน...' : 'Search tasks...'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleCreateNewTask}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createTask')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Kanban vs List */}
      {isLoading && tasks.length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-3xl bg-slate-900/70 border ${col.color} p-4 min-h-[160px] shadow-xl backdrop-blur-md transition-all`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">{t(col.key)}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={handleCreateNewTask}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title={`Add task to ${col.title}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-36 rounded-2xl border border-dashed border-slate-800/80 text-slate-500 text-xs p-4 text-center">
                      <span>No tasks in {col.title}</span>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                      >
                        <TaskCard task={task} onClick={handleCardClick} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* List / Table View */
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Task Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assignees & Roles</th>
                  <th className="py-3.5 px-4">Subtasks</th>
                  <th className="py-3.5 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const completed = task.subtasks.filter((s) => s.isCompleted).length;
                    const total = task.subtasks.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleCardClick(task)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        {/* Title */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white max-w-sm truncate">{task.title}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                            {task.status}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              task.priority === 'URGENT'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : task.priority === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>

                        {/* Assignees */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {task.assignees.map((a) => (
                              <div
                                key={a.id}
                                className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full text-[10px]"
                              >
                                <Avatar name={a.user.name} src={a.user.avatarUrl} size="xs" />
                                <span className="text-slate-200">{a.user.name.split(' ')[0]}</span>
                                <span className="text-[8px] font-extrabold uppercase text-indigo-400">
                                  [{a.role}]
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Subtasks */}
                        <td className="py-3.5 px-4">
                          {total > 0 ? (
                            <div className="w-28 space-y-1">
                              <div className="text-[10px] text-slate-400 flex justify-between">
                                <span>{completed}/{total}</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 text-slate-400">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        <TaskCalendarView
          tasks={tasks}
          onOpenCreateWithDate={(d) => {
            setEditingTask({ dueDate: `${d}T12:00:00.000Z` } as any);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <TaskTimelineView tasks={tasks} />
      )}

      {/* Task Creation / Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTask={editingTask}
      />
    </div>
  );
}
