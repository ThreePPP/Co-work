'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useHistoryStore } from '../../stores/historyStore';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';

export const HistoryExportModal: React.FC = () => {
  const { isExportModalOpen, closeExportModal, exportData, isExporting, pruneLogs } =
    useHistoryStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [pruneDays, setPruneDays] = useState<number>(90);
  const [isPruning, setIsPruning] = useState<boolean>(false);
  const [isPruneConfirmOpen, setIsPruneConfirmOpen] = useState<boolean>(false);
  const [pruneMessage, setPruneMessage] = useState<string | null>(null);

  const handleExport = async () => {
    await exportData(exportFormat);
  };

  const confirmPrune = async () => {
    setIsPruning(true);
    const res = await pruneLogs(pruneDays);
    setIsPruning(false);
    setIsPruneConfirmOpen(false);
    setPruneMessage(res.message);
  };

  return (
    <Modal
      isOpen={isExportModalOpen}
      onClose={closeExportModal}
      title="Export & Manage Audit Logs"
      description="Download activity history data for compliance reports or clean up legacy records."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                exportFormat === 'csv'
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-400 ring-2 ring-indigo-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 mb-1.5" />
              <span className="text-xs font-bold text-white">CSV Spreadsheet</span>
              <span className="text-[10px] text-slate-400 mt-0.5">For Excel & Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                exportFormat === 'json'
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-400 ring-2 ring-indigo-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <FileCode className="w-6 h-6 mb-1.5" />
              <span className="text-xs font-bold text-white">Raw JSON</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Structured Developer Data</span>
            </button>
          </div>
        </div>

        {/* Download Action Button */}
        <Button
          variant="gradient"
          className="w-full"
          size="lg"
          onClick={handleExport}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Download Audit Log ({exportFormat.toUpperCase()})
        </Button>

        {/* Admin Retention Cleanup Section */}
        {isAdmin && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Admin Log Retention Pruning</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Delete old audit records to optimize database storage. This operation is permanent.
            </p>

            <div className="flex items-center gap-3">
              <select
                value={pruneDays}
                onChange={(e) => setPruneDays(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value={30}>Older than 30 days</option>
                <option value={60}>Older than 60 days</option>
                <option value={90}>Older than 90 days (Recommended)</option>
                <option value={180}>Older than 180 days</option>
                <option value={365}>Older than 1 year</option>
              </select>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsPruneConfirmOpen(true)}
                isLoading={isPruning}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Prune
              </Button>
            </div>

            {pruneMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{pruneMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prune Confirmation Modal */}
      <ConfirmModal
        isOpen={isPruneConfirmOpen}
        onClose={() => setIsPruneConfirmOpen(false)}
        onConfirm={confirmPrune}
        title="Prune Activity Logs"
        description={`Are you sure you want to permanently delete all activity and audit logs older than ${pruneDays} days? This operation is permanent.`}
        confirmText="Confirm Prune"
        variant="danger"
        isLoading={isPruning}
      />
    </Modal>
  );
};
