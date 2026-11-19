import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X, Check, ChevronDown, ChevronUp, GraduationCap, Sparkles } from 'lucide-react';
import type { Task, TaskKind, TaskStatus, Subtask } from '../types';
import { daysBetween } from '../services/storage';

interface Props {
  tasks: Task[];
  todayKey: string;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
}

type Filter = 'active' | 'college' | 'project' | 'done';

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'Jalan',
  done: 'Selesai',
};

function urgencyClass(dueDate: string | undefined, todayKey: string): string {
  if (!dueDate) return 'border-slate-700/60';
  const left = daysBetween(todayKey, dueDate);
  if (left < 0) return 'border-rose-500/60 bg-rose-500/5';
  if (left === 0) return 'border-rose-500/45 bg-rose-500/5';
  if (left === 1) return 'border-orange-500/45 bg-orange-500/5';
  if (left <= 3) return 'border-amber-500/35 bg-amber-500/5';
  if (left <= 7) return 'border-sky-500/30';
  return 'border-slate-700/60';
}

function dueLabel(dueDate: string | undefined, todayKey: string): string {
  if (!dueDate) return 'Tanpa deadline';
  const left = daysBetween(todayKey, dueDate);
  if (left < 0) return `Terlewat ${-left} hari`;
  if (left === 0) return 'Hari ini';
  if (left === 1) return 'Besok';
  return `${left} hari lagi`;
}

const emptyDraft = (kind: TaskKind): Task => ({
  id: 't-' + Date.now(),
  kind,
  title: '',
  description: '',
  course: '',
  dueDate: '',
  status: 'todo',
  subtasks: [],
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const TaskTracker: React.FC<Props> = ({ tasks, todayKey, onSave, onDelete }) => {
  const [filter, setFilter] = useState<Filter>('active');
  const [draft, setDraft] = useState<Task | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');

  const visible = useMemo(() => {
    const list = tasks.filter((t) => {
      if (filter === 'done') return t.status === 'done';
      if (t.status === 'done') return false;
      if (filter === 'college') return t.kind === 'college';
      if (filter === 'project') return t.kind === 'project';
      return true;
    });
    // Deadline terdekat selalu di atas; yang tanpa deadline turun ke bawah.
    return list.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, filter]);

  const saveDraft = () => {
    if (!draft || !draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim() });
    setDraft(null);
  };

  const toggleSubtask = (task: Task, subId: string) => {
    onSave({
      ...task,
      subtasks: task.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)),
    });
  };

  const addSubtask = (task: Task) => {
    const title = subtaskInput.trim();
    if (!title) return;
    const sub: Subtask = { id: 's-' + Date.now(), title, completed: false };
    onSave({ ...task, subtasks: [...task.subtasks, sub] });
    setSubtaskInput('');
  };

  const cycleStatus = (task: Task) => {
    const next: TaskStatus =
      task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    onSave({ ...task, status: next });
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-0.5">
        {(
          [
            ['active', 'Aktif'],
            ['college', 'Kuliah'],
            ['project', 'Project'],
            ['done', 'Selesai'],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition ${
              filter === id
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
        </div>
        <button
          onClick={() => setDraft(emptyDraft('college'))}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      {draft && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Tugas / Project Baru</h3>
            <button onClick={() => setDraft(null)} className="p-1 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {(
              [
                ['college', 'Tugas Kuliah', <GraduationCap className="w-3.5 h-3.5" key="g" />],
                ['project', 'Personal Project', <Sparkles className="w-3.5 h-3.5" key="s" />],
              ] as [TaskKind, string, React.ReactNode][]
            ).map(([kind, label, icon]) => (
              <button
                key={kind}
                onClick={() => setDraft({ ...draft, kind })}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  draft.kind === kind
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && saveDraft()}
            placeholder="Judul tugas / project"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.course || ''}
              onChange={(e) => setDraft({ ...draft, course: e.target.value })}
              placeholder={draft.kind === 'college' ? 'Mata kuliah' : 'Kategori'}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
            <input
              type="date"
              value={draft.dueDate || ''}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <textarea
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            placeholder="Deskripsi / catatan (opsional)"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500 resize-none placeholder:text-slate-600"
          />

          <button
            onClick={saveDraft}
            disabled={!draft.title.trim()}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold"
          >
            Simpan
          </button>
        </div>
      )}

      {visible.length === 0 && (
        <p className="text-center text-xs text-slate-500 py-10">Tidak ada item di filter ini.</p>
      )}

      <ul className="space-y-2">
        {visible.map((t) => {
          const isOpen = expanded === t.id;
          const doneSub = t.subtasks.filter((s) => s.completed).length;
          return (
            <li
              key={t.id}
              className={`bg-slate-900/90 border rounded-2xl overflow-hidden ${urgencyClass(
                t.dueDate,
                todayKey
              )}`}
            >
              <div className="flex items-start gap-3 p-3.5">
                <button
                  onClick={() => cycleStatus(t)}
                  className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                    t.status === 'done'
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                      : t.status === 'in_progress'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-slate-600 text-transparent'
                  }`}
                  title={STATUS_LABEL[t.status]}
                >
                  {t.status === 'done' ? (
                    <Check className="w-3 h-3" />
                  ) : t.status === 'in_progress' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ) : null}
                </button>

                <button
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p
                    className={`text-sm font-semibold truncate ${
                      t.status === 'done' ? 'text-slate-500 line-through' : 'text-white'
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    <span
                      className={`inline-flex items-center gap-0.5 mr-1.5 ${
                        t.kind === 'project' ? 'text-violet-400' : 'text-indigo-400'
                      }`}
                    >
                      {t.kind === 'project' ? 'Project' : 'Kuliah'}
                    </span>
                    {t.course && `· ${t.course} `}
                    {t.subtasks.length > 0 && `· ${doneSub}/${t.subtasks.length}`}
                  </p>
                </button>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold text-slate-300">
                    {dueLabel(t.dueDate, todayKey)}
                  </div>
                  {t.dueDate && <div className="text-[10px] text-slate-500">{t.dueDate}</div>}
                </div>

                <button
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="p-1 text-slate-500 hover:text-white shrink-0"
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-800/80">
                  {t.description && (
                    <p className="text-xs text-slate-400 whitespace-pre-wrap">{t.description}</p>
                  )}

                  {t.subtasks.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${(doneSub / t.subtasks.length) * 100}%` }}
                        />
                      </div>
                      {t.subtasks.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => toggleSubtask(t, s.id)}
                          className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-slate-800/50"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] shrink-0 ${
                              s.completed
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-600'
                            }`}
                          >
                            {s.completed ? '✓' : ''}
                          </span>
                          <span
                            className={`text-xs ${
                              s.completed ? 'text-slate-500 line-through' : 'text-slate-300'
                            }`}
                          >
                            {s.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={expanded === t.id ? subtaskInput : ''}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSubtask(t)}
                      placeholder="Tambah subtask / milestone"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 placeholder:text-slate-600"
                    />
                    <button
                      onClick={() => addSubtask(t)}
                      className="px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="date"
                      value={t.dueDate || ''}
                      onChange={(e) => onSave({ ...t, dueDate: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (confirm(`Hapus "${t.title}"?`)) onDelete(t.id);
                      }}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 px-2 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
