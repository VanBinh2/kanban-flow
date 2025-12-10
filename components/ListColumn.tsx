import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Task, User } from '../types';
import { TaskCard } from './TaskCard';
import { MoreHorizontal, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ListColumnProps {
  list: List;
  tasks: Task[];
  index: number;
  onCardClick: (task: Task) => void;
  onCreateTask: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateListTitle: (listId: string, title: string) => void;
  boardMembers: User[];
}

export const ListColumn: React.FC<ListColumnProps> = ({ 
  list, 
  tasks, 
  index, 
  onCardClick, 
  onCreateTask,
  onDeleteList,
  onUpdateListTitle,
  boardMembers
}) => {
  const { t } = useTranslation();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleTitleSubmit = () => {
    if (listTitle.trim() !== list.title) {
      onUpdateListTitle(list.id, listTitle);
    }
    setIsEditingTitle(false);
  };

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onCreateTask(list.id, newCardTitle);
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="mr-5 w-[280px] shrink-0 select-none flex flex-col h-full max-h-full"
        >
          {/* High-End Glassmorphism Container */}
          <div className={`
              flex flex-col rounded-2xl max-h-full transition-all duration-300
              bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-md 
              border border-white/60 dark:border-white/5 
              shadow-[0_4px_20px_rgba(0,0,0,0.02)]
              ${snapshot.isDragging ? 'shadow-2xl ring-1 ring-indigo-500/30 rotate-1 scale-[1.02] bg-white/80 dark:bg-slate-800/80' : ''}
          `}>
            
            {/* List Header */}
            <div 
              {...provided.dragHandleProps} 
              className="flex items-center justify-between p-4 group"
            >
              {isEditingTitle ? (
                <input
                  autoFocus
                  className="w-full rounded bg-white/50 border border-indigo-400 px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                />
              ) : (
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                    <h2 
                        onClick={() => setIsEditingTitle(true)}
                        className="cursor-pointer truncate text-[14px] font-bold text-slate-700 dark:text-slate-200 tracking-tight"
                    >
                    {list.title}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded text-center min-w-[20px]">
                        {tasks.length}
                    </span>
                </div>
              )}

              {/* Action Menu */}
              <div className="relative">
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="rounded-md p-1 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow"
                >
                  <MoreHorizontal size={16} />
                </button>
                 
                 {showMenu && (
                     <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                            <button 
                            onClick={() => { setIsEditingTitle(true); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                            <Edit2 size={13} /> Rename List
                            </button>
                            <div className="my-1 border-t border-slate-50 dark:border-slate-700/50" />
                            <button 
                            onClick={() => onDeleteList(list.id)}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
                            >
                            <Trash2 size={13} /> Delete List
                            </button>
                        </div>
                     </>
                 )}
              </div>
            </div>

            {/* Tasks Drop Zone */}
            <Droppable droppableId={list.id} type="task">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-1 custom-scrollbar transition-colors duration-200 rounded-b-2xl
                    ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                  `}
                  style={{ minHeight: '40px' }}
                >
                  {tasks.map((task, index) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      index={index} 
                      onClick={onCardClick}
                      boardMembers={boardMembers}
                    />
                  ))}
                  {provided.placeholder}
                  
                  {isAddingCard ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="mb-2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-indigo-500/20 dark:bg-slate-800 dark:ring-indigo-500/40"
                    >
                      <textarea
                        autoFocus
                        placeholder={t('board.task_title')}
                        className="w-full resize-none rounded-md bg-transparent text-sm focus:outline-none dark:text-white placeholder:text-slate-400 font-medium leading-relaxed"
                        rows={3}
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if(e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCard();
                          }
                        }}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <Button size="sm" variant="premium" onClick={handleAddCard} className="text-xs">{t('board.new_task')}</Button>
                        <button 
                          onClick={() => setIsAddingCard(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                      <div className="px-1 py-1 pb-3">
                        <button
                            onClick={() => setIsAddingCard(true)}
                            className="group flex w-full items-center gap-2 rounded-xl p-2 text-sm font-medium text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all opacity-80 hover:opacity-100"
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 group-hover:border-indigo-300 dark:group-hover:border-indigo-500 transition-colors">
                                <Plus size={14} className="text-indigo-500" strokeWidth={2.5} />
                            </div>
                            <span>{t('board.new_task')}</span>
                        </button>
                      </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
};