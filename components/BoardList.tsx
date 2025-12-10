
import React, { useState, useEffect } from 'react';
import { Board } from '../types';
import { api } from '../services/api';
import { Plus, Trash2, Layout, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface BoardListProps {
  onSelectBoard: (boardId: string) => void;
}

const BG_GRADIENTS = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-red-500',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    'bg-gradient-to-br from-slate-700 to-slate-900',
];

export const BoardList: React.FC<BoardListProps> = ({ onSelectBoard }) => {
  const { t } = useTranslation();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0]);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
      try {
          const data = await api.getBoards();
          setBoards(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;
      try {
          const newBoard = await api.createBoard(newTitle, selectedBg);
          setBoards([newBoard, ...boards]);
          setIsCreating(false);
          setNewTitle('');
      } catch (e) {
          alert("Failed to create board");
      }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to delete this board? This cannot be undone.")) return;
      try {
          await api.deleteBoard(id);
          setBoards(boards.filter(b => b.id !== id));
      } catch (e) {
          alert("Failed to delete");
      }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading boards...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layout className="text-indigo-500" />
                {t('sidebar.boards')}
            </h1>
            <button 
                onClick={() => setIsCreating(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/30"
            >
                <Plus size={18} /> Create Board
            </button>
        </div>

        {isCreating && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700"
            >
                <form onSubmit={handleCreate}>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Board Title</label>
                    <input 
                        autoFocus
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Marketing Campaign"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                    />
                    
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Background</label>
                    <div className="flex gap-2 mb-6">
                        {BG_GRADIENTS.map(bg => (
                            <button
                                key={bg}
                                type="button"
                                onClick={() => setSelectedBg(bg)}
                                className={`w-10 h-10 rounded-full ${bg} transition-transform ${selectedBg === bg ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                            />
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Create</button>
                    </div>
                </form>
            </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.map(board => (
                <motion.div
                    key={board.id}
                    layoutId={board.id}
                    onClick={() => onSelectBoard(board.id)}
                    className={`
                        group relative aspect-[16/9] rounded-2xl p-5 cursor-pointer overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
                        ${board.background.startsWith('bg-') ? board.background : 'bg-slate-700'}
                    `}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    
                    <h3 className="text-white font-bold text-lg relative z-10 drop-shadow-md">{board.title}</h3>
                    
                    <button 
                        onClick={(e) => handleDelete(e, board.id)}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                        <Trash2 size={16} />
                    </button>

                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </motion.div>
            ))}
            
            {boards.length === 0 && !isCreating && (
                <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 mb-2">No boards found</div>
                    <button onClick={() => setIsCreating(true)} className="text-indigo-500 font-bold hover:underline">Create your first board</button>
                </div>
            )}
        </div>
    </div>
  );
};
