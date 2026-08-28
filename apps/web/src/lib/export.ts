import { Task, ActivityLog } from '../types';

/**
 * Trigger download of a string content as a file in the browser
 */
function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  // \uFEFF is UTF-8 Byte Order Mark (BOM) ensuring Excel displays Thai and UTF-8 characters properly
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tasks list to a formatted CSV spreadsheet file
 */
export function exportTasksToCSV(tasks: Task[]) {
  const headers = [
    'Task ID',
    'Task Title',
    'Status',
    'Priority',
    'Assignees',
    'Subtasks Completed',
    'Due Date',
    'Created At',
  ];

  const rows = tasks.map((task) => {
    const assigneesStr = task.assignees?.map((a) => `${a.user.name} (${a.role})`).join('; ') || 'Unassigned';
    const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const subtaskProgress = totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} (${Math.round((completedSubtasks / totalSubtasks) * 100)}%)` : 'No subtasks';
    const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline';
    const createdAtStr = new Date(task.createdAt).toLocaleDateString();

    return [
      `"${task.id}"`,
      `"${(task.title || '').replace(/"/g, '""')}"`,
      `"${task.status}"`,
      `"${task.priority}"`,
      `"${assigneesStr.replace(/"/g, '""')}"`,
      `"${subtaskProgress}"`,
      `"${dueDateStr}"`,
      `"${createdAtStr}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `cowork_tasks_export_${dateStr}.csv`);
}

/**
 * Export audit activity logs to CSV
 */
export function exportActivityLogsToCSV(logs: ActivityLog[]) {
  const headers = ['Log ID', 'User Name', 'Department', 'Action', 'Details', 'Timestamp'];

  const rows = logs.map((log) => {
    const userName = log.user?.name || 'System';
    const dept = log.user?.department || 'General';
    const action = log.action || '';
    const details = log.details || '';
    const timestamp = new Date(log.createdAt).toLocaleString();

    return [
      `"${log.id}"`,
      `"${userName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${action.replace(/"/g, '""')}"`,
      `"${details.replace(/"/g, '""')}"`,
      `"${timestamp}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `cowork_audit_logs_${dateStr}.csv`);
}
