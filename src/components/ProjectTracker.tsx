import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  FolderPlus, 
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Project, ProjectStatus, Subtask } from '../types';
import { playChimeSound } from '../services/audio';

interface ProjectTrackerProps {
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal Project');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [targetDate, setTargetDate] = useState('');

  // Subtask quick input per project
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setCategory('Personal Project');
    setStatus('in_progress');
    setTargetDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setTitle(proj.title);
    setDescription(proj.description || '');
    setCategory(proj.category);
    setStatus(proj.status);
    setTargetDate(proj.targetDate || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Mohon isi Judul Project.');
      return;
    }

    if (editingProject) {
      onUpdateProject({
        ...editingProject,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        status,
        targetDate: targetDate || undefined,
      });
    } else {
      onAddProject({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        status,
        targetDate: targetDate || undefined,
        tasks: [],
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleSubtask = (proj: Project, subtaskId: string) => {
    const updatedTasks = proj.tasks.map((t) => {
      if (t.id === subtaskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
    if (allCompleted) {
      confetti({ particleCount: 75, spread: 60 });
      playChimeSound('streak');
    } else {
      playChimeSound('complete');
    }

    onUpdateProject({
      ...proj,
      tasks: updatedTasks,
      status: allCompleted ? 'completed' : proj.status === 'completed' ? 'in_progress' : proj.status,
    });
  };

  const handleAddSubtask = (proj: Project) => {
    const text = (newSubtaskTitles[proj.id] || '').trim();
    if (!text) return;

    const newTask: Subtask = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: text,
      completed: false,
    };

    onUpdateProject({
      ...proj,
      tasks: [...proj.tasks, newTask],
    });

    setNewSubtaskTitles((prev) => ({ ...prev, [proj.id]: '' }));
  };

  const handleDeleteSubtask = (proj: Project, subtaskId: string) => {
    onUpdateProject({
      ...proj,
      tasks: proj.tasks.filter((t) => t.id !== subtaskId),
    });
  };

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span>Personal Projects</span>
          </h1>
          <p className="text-xs text-slate-400">
            Track ide, portofolio, milestone, dan checklist subtask dari project pribadi Anda.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/25 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Project Baru</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto">
        {[
          { id: 'all', label: 'Semua Project' },
          { id: 'in_progress', label: 'Sedang Dikerjakan' },
          { id: 'planning', label: 'Perencanaan' },
          { id: 'completed', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
              filterStatus === tab.id
                ? 'bg-violet-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold text-sm">Belum ada project di kategori ini</p>
          <p className="text-slate-500 text-xs mt-1">
            Mulai rancang ide project Anda dan pecah menjadi milestone task!
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
          >
            Buat Project Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const completedCount = proj.tasks.filter((t) => t.completed).length;
            const totalTasks = proj.tasks.length;
            const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
            const isCompleted = proj.status === 'completed' || (totalTasks > 0 && completedCount === totalTasks);

            return (
              <div
                key={proj.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                      {proj.category || 'Personal'}
                    </span>

                    <div className="flex items-center space-x-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : proj.status === 'planning'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {isCompleted ? 'Selesai' : proj.status === 'planning' ? 'Planning' : 'Active'}
                      </span>

                      <button
                        onClick={() => openEditModal(proj)}
                        className="p-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus project "${proj.title}"?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="p-1 rounded bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Hapus Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5">{proj.title}</h3>
                  {proj.description && (
                    <p className="text-xs text-slate-400 mb-3">{proj.description}</p>
                  )}

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Progress Subtask</span>
                      <span className="font-mono font-bold text-violet-300">
                        {completedCount} / {totalTasks} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
                    {proj.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleSubtask(proj, task.id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs group"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition ${
                            task.completed
                              ? 'bg-violet-600 text-white'
                              : 'border border-slate-700 bg-slate-900'
                          }`}>
                            <Check className={`w-3.5 h-3.5 ${task.completed ? 'opacity-100' : 'opacity-0'}`} />
                          </div>
                          <span className={task.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {task.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubtask(proj, task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Tambah subtask baru..."
                    value={newSubtaskTitles[proj.id] || ''}
                    onChange={(e) =>
                      setNewSubtaskTitles({ ...newSubtaskTitles, [proj.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask(proj);
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={() => handleAddSubtask(proj)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-violet-300 text-xs font-semibold rounded-xl transition"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
          >
            <h2 className="text-lg font-bold text-white mb-1">
              {editingProject ? 'Edit Project' : 'Buat Personal Project Baru'}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Rancang tujuan, milestone, dan deskripsi project pribadi Anda.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Project *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Portfolio Website, Belajar Rust, SaaS App"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kategori / Tag
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Web App, Mobile, Riset, Belajar"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deskripsi / Catatan Singkat
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi tujuan project, arsitektur, atau link repo GitHub..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status Project
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="in_progress">Active / Sedang Dikerjakan</option>
                    <option value="planning">Planning (Ide / Rencana)</option>
                    <option value="completed">Completed (Selesai)</option>
                    <option value="on_hold">On Hold (Ditunda)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Tanggal Selesai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
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
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 transition active:scale-95"
              >
                {editingProject ? 'Simpan Perubahan' : 'Buat Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
