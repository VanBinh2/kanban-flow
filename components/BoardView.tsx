

import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { BoardData, Task, List, FilterState } from '../types';
import { ListColumn } from './ListColumn';
import { CardModal } from './CardModal';
import { api } from '../services/api';
import { Plus, X, Search, Filter, Check, Calendar, Tag, User, RotateCcw, Layout, Share2, MoreVertical, Circle, UserPlus, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from './ui/Toast';

interface BoardViewProps {
  initialData: BoardData;
}

const COLOR_MAP: Record<string, string> = {
  'red-500': '#ef4444',
  'yellow-500': '#eab308',
  'green-500': '#22c55e',
  'blue-500': '#3b82f6',
  'purple-500': '#a855f7',
  'gray-500': '#6b7280',
};

export const BoardView: React.FC<BoardViewProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [data, setData] = useState<BoardData>(initialData);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Advanced Features
  const [filters, setFilters] = useState<FilterState>({ search: '', members: [], labels: [], dueNextWeek: false });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // States for Global Create Task Modal
  const [isGlobalCreateOpen, setIsGlobalCreateOpen] = useState(false);
  const [globalTaskTitle, setGlobalTaskTitle] = useState('');
  const [globalTargetListId, setGlobalTargetListId] = useState('');

  // Shortcut Listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
              e.preventDefault();
              openGlobalCreateModal();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data.listIds]);

  // Socket Connection for Real-time
  useEffect(() => {
    api.connectSocket(data.id, (updatedData) => {
        setData(prev => ({...prev, ...updatedData})); 
    });
    return () => api.disconnectSocket();
  }, [data.id]);

  useEffect(() => {
    api.updateBoardData(data);
  }, [data]);

  useEffect(() => {
    if (selectedTask) {
      const updatedTask = data.tasks[selectedTask.id];
      if (updatedTask) {
        setSelectedTask(updatedTask);
      } else {
        setSelectedTask(null);
      }
    }
  }, [data, selectedTask?.id]);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
      if (!filters.search && filters.labels.length === 0 && filters.members.length === 0 && !filters.dueNextWeek) return data;
      
      const newTasks: { [key: string]: Task } = {};
      
      Object.values(data.tasks).forEach((task: Task) => {
          const matchesSearch = !filters.search || task.title.toLowerCase().includes(filters.search.toLowerCase());
          const matchesLabel = filters.labels.length === 0 || task.labels.some(l => filters.labels.includes(l.color));
          const matchesMember = filters.members.length === 0 || task.memberIds.some(id => filters.members.includes(id));
          
          let matchesDate = true;
          if (filters.dueNextWeek) {
              if (task.dueDate) {
                  const date = new Date(task.dueDate);
                  const now = new Date();
                  const nextWeek = new Date();
                  nextWeek.setDate(now.getDate() + 7);
                  now.setHours(0,0,0,0);
                  date.setHours(0,0,0,0);
                  nextWeek.setHours(23,59,59,999);
                  matchesDate = date >= now && date <= nextWeek;
              } else {
                  matchesDate = false;
              }
          }

          if (matchesSearch && matchesLabel && matchesMember && matchesDate) {
              newTasks[task.id] = task;
          }
      });

      return { ...data, tasks: newTasks };
  }, [data, filters]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      const newListIds = [...data.listIds];
      newListIds.splice(source.index, 1);
      newListIds.splice(destination.index, 0, draggableId);
      setData({ ...data, listIds: newListIds });
      return;
    }

    const startList = data.lists[source.droppableId];
    const finishList = data.lists[destination.droppableId];

    if (startList === finishList) {
      const newTaskIds = [...startList.taskIds];
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      const newList = { ...startList, taskIds: newTaskIds };
      
      const updatedTasks = { ...data.tasks };
      newTaskIds.forEach((taskId, index) => {
           if (updatedTasks[taskId]) updatedTasks[taskId].order = index;
      });

      setData({ 
          ...data, 
          lists: { ...data.lists, [newList.id]: newList },
          tasks: updatedTasks
      });
      return;
    }

    const startTaskIds = [...startList.taskIds];
    startTaskIds.splice(source.index, 1);
    const newStart = { ...startList, taskIds: startTaskIds };

    const finishTaskIds = [...finishList.taskIds];
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finishList, taskIds: finishTaskIds };
    
    const updatedTasks = { ...data.tasks };
    updatedTasks[draggableId] = { ...updatedTasks[draggableId], listId: finishList.id };
    
    startTaskIds.forEach((taskId, index) => {
         if (updatedTasks[taskId]) updatedTasks[taskId].order = index;
    });
    finishTaskIds.forEach((taskId, index) => {
         if (updatedTasks[taskId]) updatedTasks[taskId].order = index;
    });

    setData({
      ...data,
      lists: { ...data.lists, [newStart.id]: newStart, [newFinish.id]: newFinish },
      tasks: updatedTasks
    });
  };

  const handleCreateTask = (listId: string, title: string) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      listId,
      title,
      description: '',
      memberIds: [],
      labels: [],
      dueDate: null,
      comments: [],
      checklist: [],
      attachments: [],
      dependencies: [],
      createdAt: new Date().toISOString(),
      order: 0
    };

    const list = data.lists[listId];
    const newList = { ...list, taskIds: [...list.taskIds, newTaskId] };

    setData({
      ...data,
      tasks: { ...data.tasks, [newTaskId]: newTask },
      lists: { ...data.lists, [listId]: newList },
    });
  };

  const handleDuplicateTask = (taskToDuplicate: Task) => {
      const newTaskId = `task-${Date.now()}`;
      const newTask: Task = {
          ...taskToDuplicate,
          id: newTaskId,
          title: `${taskToDuplicate.title} ${t('card.copy_suffix')}`,
          createdAt: new Date().toISOString(),
          comments: [],
      };

      const list = data.lists[newTask.listId];
      const originalIndex = list.taskIds.indexOf(taskToDuplicate.id);
      const newTaskIds = [...list.taskIds];
      newTaskIds.splice(originalIndex + 1, 0, newTaskId);

      const newList = { ...list, taskIds: newTaskIds };
      
      const updatedTasks = { ...data.tasks, [newTaskId]: newTask };
      newTaskIds.forEach((taskId, index) => {
          if (updatedTasks[taskId]) updatedTasks[taskId].order = index;
      });

      setData({
          ...data,
          tasks: updatedTasks,
          lists: { ...data.lists, [list.id]: newList }
      });
  };

  const handleGlobalCreateTask = () => {
      if (!globalTaskTitle.trim() || !globalTargetListId) return;
      handleCreateTask(globalTargetListId, globalTaskTitle);
      setGlobalTaskTitle('');
      setGlobalTargetListId('');
      setIsGlobalCreateOpen(false);
      addToast("Task created successfully", "success");
  };

  const openGlobalCreateModal = () => {
      if (data.listIds.length > 0) {
          setGlobalTargetListId(data.listIds[0]); 
          setIsGlobalCreateOpen(true);
      } else {
          addToast("Please create a list first.", "error");
      }
  }

  const handleCreateList = () => {
    if (!newListTitle.trim()) return;
    const newListId = `list-${Date.now()}`;
    const newList: List = {
      id: newListId,
      boardId: data.id,
      title: newListTitle,
      taskIds: [],
      order: data.listIds.length
    };

    setData({
      ...data,
      lists: { ...data.lists, [newListId]: newList },
      listIds: [...data.listIds, newListId]
    });
    setNewListTitle('');
    setIsAddingList(false);
    addToast("List created", "success");
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setInviteLoading(true);
      try {
          const newUser = await api.inviteMember(data.id, inviteEmail);
          setData(prev => ({ ...prev, members: [...prev.members, newUser] }));
          addToast(`Invited ${newUser.username} successfully`, "success");
          setInviteEmail('');
          setIsInviteOpen(false);
      } catch (e: any) {
          addToast(e.message, "error");
      } finally {
          setInviteLoading(false);
      }
  };

  const getFilteredTasks = (list: List) => {
      return list.taskIds
          .map(id => filteredData.tasks[id])
          .filter(t => t !== undefined);
  };

  const toggleFilter = (type: 'labels' | 'members', value: string) => {
      setFilters(prev => {
          const current = prev[type] as string[];
          const exists = current.includes(value);
          const newValues = exists ? current.filter(v => v !== value) : [...current, value];
          return { ...prev, [type]: newValues };
      });
  };

  const activeFilterCount = filters.labels.length + filters.members.length + (filters.dueNextWeek ? 1 : 0);
  const clearAllFilters = () => setFilters({ search: '', members: [], labels: [], dueNextWeek: false });

  return (
    <div className="flex flex-col h-full relative font-sans">
      
      {/* Control Bar */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-md z-20">
          
          {/* Left: View Info & Members */}
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                      <Layout size={18} />
                  </span>
                  <div>
                      <h2 className="text-sm font-bold text-white leading-none">{t('board.view_info')}</h2>
                      <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">{t('board.primary_project')}</p>
                  </div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex -space-x-2 items-center">
                  {data.members.slice(0, 5).map(u => (
                      <div key={u.id} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs text-white font-medium" title={u.username}>
                          {u.avatar || u.username.substring(0, 2)}
                      </div>
                  ))}
                  <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 transition-colors ml-2"
                    title="Invite Members"
                  >
                      <UserPlus size={14} />
                  </button>
              </div>
          </div>

          {/* Right: Search & Filters */}
          <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={16} />
                  <input 
                      className="bg-black/20 text-white placeholder-slate-400 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all w-48 focus:w-64 border border-transparent focus:border-blue-500/30 hover:bg-black/30"
                      placeholder={t('board.search_tasks')}
                      value={filters.search}
                      onChange={e => setFilters({...filters, search: e.target.value})}
                  />
                  {filters.search && (
                      <button 
                        onClick={() => setFilters({...filters, search: ''})}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                          <X size={12} />
                      </button>
                  )}
              </div>

              {/* Filter Group */}
              <div className="relative">
                  <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${activeFilterCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'}`}
                  >
                      <Filter size={16} /> 
                      <span>{t('board.filter')}</span>
                      {activeFilterCount > 0 && <span className="bg-white/20 px-1.5 rounded text-xs">{activeFilterCount}</span>}
                  </button>
                  
                  {/* Comprehensive Filter Popover */}
                  <AnimatePresence>
                      {isFilterOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                            <motion.div 
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4 z-50 text-slate-800 dark:text-slate-200"
                            >
                                <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700">
                                    <h3 className="font-bold text-sm">{t('board.filter_options')}</h3>
                                    <button onClick={() => setIsFilterOpen(false)}><X size={16} className="text-slate-400 hover:text-red-500" /></button>
                                </div>

                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {/* Members Section */}
                                    <div>
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">{t('filter.assignees')}</h4>
                                        <div className="space-y-1">
                                            {data.members.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => toggleFilter('members', user.id)} 
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${filters.members.includes(user.id) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold uppercase relative">
                                                        {user.avatar || user.username.substring(0,2)}
                                                        {filters.members.includes(user.id) && (
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white">
                                                                <Check size={8} strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm font-medium ${filters.members.includes(user.id) ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{user.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Labels Section */}
                                    <div>
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">{t('card.labels')}</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.keys(COLOR_MAP).map(color => {
                                                const isActive = filters.labels.includes(color);
                                                return (
                                                    <div 
                                                        key={color} 
                                                        onClick={() => toggleFilter('labels', color)}
                                                        className={`
                                                            flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border
                                                            ${isActive ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'}
                                                        `}
                                                    >
                                                        <div 
                                                            className={`w-4 h-4 rounded-full flex items-center justify-center`} 
                                                            style={{ backgroundColor: COLOR_MAP[color].split(' ')[0].replace('bg-', 'var(--bg-opacity)') }}
                                                        >
                                                            {isActive && <Check size={10} className="text-white drop-shadow-sm" strokeWidth={3} />}
                                                        </div>
                                                        <span className={`text-xs font-semibold capitalize ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {color.replace('-500', '')}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Due Date Section */}
                                    <div>
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('filter.deadlines')}</h4>
                                        <div 
                                            onClick={() => setFilters(prev => ({...prev, dueNextWeek: !prev.dueNextWeek}))}
                                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${filters.dueNextWeek ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.dueNextWeek ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                                {filters.dueNextWeek && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <span className={`text-sm font-medium ${filters.dueNextWeek ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{t('filter.due_next_week')}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Clear Filters Button */}
                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                                    <button 
                                        onClick={clearAllFilters}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                                    >
                                        <RotateCcw size={14} /> {t('board.clear_filters')}
                                    </button>
                                </div>
                            </motion.div>
                          </>
                      )}
                  </AnimatePresence>
              </div>

              <div className="h-6 w-px bg-white/10 mx-1" />

              <Button onClick={openGlobalCreateModal} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none rounded-lg px-4 py-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] group relative">
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {t('board.shortcut_hint')}
                  </div>
                  <Plus size={18} className="mr-1.5" /> {t('board.new_task')}
              </Button>
          </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full min-w-full inline-flex p-6 align-top">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-lists" direction="horizontal" type="list">
                {(provided) => (
                    <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex h-full select-none gap-6"
                    >
                    {data.listIds.map((listId, index) => {
                        const list = data.lists[listId];
                        const tasks = getFilteredTasks(list);
                        return (
                        <ListColumn
                            key={list.id}
                            list={list}
                            tasks={tasks}
                            index={index}
                            onCardClick={setSelectedTask}
                            onCreateTask={handleCreateTask}
                            onDeleteList={(id) => {
                                if(confirm('Are you sure you want to delete this list?')) {
                                    const newIds = data.listIds.filter(lid => lid !== id);
                                    setData({...data, listIds: newIds});
                                    addToast('List deleted', 'success');
                                }
                            }}
                            onUpdateListTitle={(id, title) => {
                                setData({...data, lists: {...data.lists, [id]: {...data.lists[id], title}}});
                            }}
                            boardMembers={data.members}
                        />
                        );
                    })}
                    {provided.placeholder}
                    
                    {/* Add List Button */}
                    <div className="w-[280px] shrink-0">
                        {isAddingList ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl bg-slate-100 p-3 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                            <input
                            autoFocus
                            placeholder={t('board.enter_list_title')}
                            className="mb-3 w-full rounded-lg border border-blue-500 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none dark:text-white"
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                            />
                            <div className="flex items-center gap-2">
                                <Button onClick={handleCreateList} size="sm" className="bg-blue-600 text-white">{t('board.add_list')}</Button>
                                <button onClick={() => setIsAddingList(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"><X size={18} className="text-slate-500" /></button>
                            </div>
                        </motion.div>
                        ) : (
                        <button
                            onClick={() => setIsAddingList(true)}
                            className="flex w-full items-center gap-2 rounded-xl bg-white/5 p-4 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all border border-white/10 border-dashed"
                        >
                            <Plus size={18} /> {t('board.add_another_list')}
                        </button>
                        )}
                    </div>
                    </div>
                )}
                </Droppable>
            </DragDropContext>
        </div>
      </div>

      {/* Card Modal */}
      {selectedTask && (
        <CardModal
          task={selectedTask}
          isOpen={!!selectedTask}
          boardMembers={data.members} // Pass real members
          allTasks={Object.values(data.tasks)} // Pass all tasks for dependencies
          onClose={() => setSelectedTask(null)}
          onUpdate={(t) => {
              setData({...data, tasks: {...data.tasks, [t.id]: t}});
          }}
          onDelete={(id) => {
             const list = data.lists[selectedTask.listId];
             const newTaskIds = list.taskIds.filter(tid => tid !== id);
             const newTasks = { ...data.tasks };
             delete newTasks[id];
             setData({
                 ...data,
                 lists: { ...data.lists, [list.id]: { ...list, taskIds: newTaskIds } },
                 tasks: newTasks
             });
             setSelectedTask(null);
             addToast("Card deleted", "success");
          }}
          onDuplicate={handleDuplicateTask}
          listName={data.lists[selectedTask.listId].title}
        />
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteOpen && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setIsInviteOpen(false)}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2"><Share2 size={18}/> Invite to Board</h3>
                        <button onClick={() => setIsInviteOpen(false)}><X size={20} className="text-slate-400" /></button>
                    </div>
                    <form onSubmit={handleInvite}>
                        <p className="text-sm text-slate-500 mb-4">Enter email address to add members to this board.</p>
                        <input 
                            autoFocus type="email" required
                            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="colleague@example.com"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                             <Button type="button" variant="transparent" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                             <Button type="submit" disabled={inviteLoading}>
                                 {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Invite'}
                             </Button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Global Create Modal */}
      <AnimatePresence>
        {isGlobalCreateOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setIsGlobalCreateOpen(false)}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold dark:text-white">{t('board.create_new_task')}</h3>
                        <button onClick={() => setIsGlobalCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('board.task_title')}</label>
                            <input 
                                autoFocus
                                value={globalTaskTitle}
                                onChange={(e) => setGlobalTaskTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all"
                                onKeyDown={e => e.key === 'Enter' && handleGlobalCreateTask()}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t('board.select_list')}</label>
                            <div className="relative">
                                <select 
                                    value={globalTargetListId}
                                    onChange={(e) => setGlobalTargetListId(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                >
                                    {data.listIds.map(id => (
                                        <option key={id} value={id}>{data.lists[id].title}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <MoreVertical size={16} className="rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                         <button onClick={() => setIsGlobalCreateOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-slate-800">{t('card.cancel')}</button>
                         <Button onClick={handleGlobalCreateTask} disabled={!globalTaskTitle.trim()} size="md" className="bg-blue-600 text-white shadow-lg shadow-blue-500/30">{t('board.new_task')}</Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
