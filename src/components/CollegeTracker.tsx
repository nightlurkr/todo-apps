import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Search, 
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CollegeTask, Priority, TaskStatus } from '../types';
import { playChimeSound } from '../services/audio';

interface CollegeTrackerProps {
  tasks: CollegeTask[];
  onAddTask: (task: Omit<CollegeTask, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: CollegeTask) => void;
  onDeleteTask: (id: string) => void;
}

export const CollegeTracker: React.FC<CollegeTrackerProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CollegeTask | null>(null);

  // Form State
  const [course, setCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const openCreateModal = () => {
    setEditingTask(null);
    setCourse('');
    setTitle('');
    setDescription('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setDueDate(tomorrow.toISOString().slice(0, 10));
    setPriority('medium');
    setStatus('todo');
    setIsModalOpen(true);
  };

  const openEditModal = (task: CollegeTask) => {
    setEditingTask(task);
    setCourse(task.course);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setStatus(task.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course.trim() || !title.trim() || !dueDate) {
      alert('Mohon isi Mata Kuliah, Judul Tugas, dan Deadline.');
      return;
    }

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        course: course.trim(),
        title: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
        status,
      });
    } else {
      onAddTask({
        course: course.trim(),
        title: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
        status,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (task: CollegeTask) => {
    let nextStatus: TaskStatus = 'todo';
    if (task.status === 'todo') nextStatus = 'in_progress';
    else if (task.status === 'in_progress') {
      nextStatus = 'submitted';
      confetti({ particleCount: 80, spread: 60 });
      playChimeSound('complete');
    } else {
      nextStatus = 'todo';
    }

    onUpdateTask({ ...task, status: nextStatus });
  };

  const getDeadlineBadge = (dueDateStr: string, isSubmitted: boolean) => {
    if (isSubmitted) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Selesai / Dikirim</span>
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1 font-semibold animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>Lewat Deadline ({Math.abs(diffDays)} hari)</span>
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1 font-bold">
          <Clock className="w-3 h-3" />
          <span>Hari Ini!</span>
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1 font-semibold">
          <Clock className="w-3 h-3" />
          <span>Besok</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
        <Calendar className="w-3 h-3" />
        <span>{diffDays} hari lagi</span>
      </span>
    );
  };

  const filteredTasks = tasks.filter((t) => {
    const matchStatus =
      filterStatus === 'all' ? true : t.status === filterStatus;
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'submitted' && b.status !== 'submitted') return 1;
    if (a.status !== 'submitted' && b.status === 'submitted') return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-cyan-400" />
            <span>Tugas Kuliah & Akademik</span>
          </h1>
          <p className="text-xs text-slate-400">
            Kelola deadline tugas, prioritas mata kuliah, dan status pengumpulan.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tugas Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari tugas atau mata kuliah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'todo', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'submitted', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                filterStatus === tab.id
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold text-sm">Tidak ada tugas ditemukan</p>
          <p className="text-slate-500 text-xs mt-1">
            {tasks.length === 0 ? 'Mulai dengan menambahkan tugas kuliah pertama Anda!' : 'Coba ubah filter atau kata kunci pencarian.'}
          </p>
          {tasks.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
            >
              Tambah Tugas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sortedTasks.map((task) => {
            const isDone = task.status === 'submitted';
            return (
              <div
                key={task.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition shadow-lg flex flex-col justify-between ${
                  isDone
                    ? 'border-slate-800/60 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {task.course}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          task.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {task.priority === 'high' ? 'Penting' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                      </span>
                    </div>
                  </div>

                  <h3 className={`font-bold text-white text-sm mb-1.5 ${isDone ? 'line-through text-slate-400' : ''}`}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                  <div>{getDeadlineBadge(task.dueDate, isDone)}</div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                        task.status === 'submitted'
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-slate-800'
                          : task.status === 'in_progress'
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-emerald-600 hover:text-white'
                          : 'bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white'
                      }`}
                      title="Klik untuk ubah status: To Do -> In Progress -> Submitted"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{task.status === 'submitted' ? 'Selesai' : task.status === 'in_progress' ? 'In Progress' : 'To Do'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="Edit Tugas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus tugas "${task.title}"?`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Tugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
          >
            <h2 className="text-lg font-bold text-white mb-1">
              {editingTask ? 'Edit Tugas Kuliah' : 'Tambah Tugas Kuliah Baru'}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Isi data tugas agar selalu ingat deadline dan mata kuliah yang bersangkutan.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mata Kuliah *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Algoritma & Pemrograman, Basis Data"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Judul Tugas / Deskripsi Singkat *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Membuat ERD & Normalisasi Database Toko"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catatan / Link Panduan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Format PDF, link Google Drive materi, instruksi dosen..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="high">Penting (High)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="low">Rendah (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted (Selesai)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-600/30 transition active:scale-95"
              >
                {editingTask ? 'Simpan Perubahan' : 'Tambah Tugas'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
