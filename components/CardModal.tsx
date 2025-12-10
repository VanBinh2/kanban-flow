

import React, { useState, useEffect, useRef } from 'react';
import { Task, ChecklistItem, User, Attachment } from '../types';
import { X, AlignLeft, Clock, Tag, User as UserIcon, Trash2, Calendar, CheckSquare, CheckCircle2, Circle, Bold, Italic, List, Activity, Copy, Underline, ListOrdered, Heading1, Link as LinkIcon, Paperclip, File, Download, Link2, AlertTriangle, ExternalLink, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface CardModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  listName: string;
  boardMembers: User[];
  allTasks: Task[]; // Required for dependency linking
}

const COLOR_MAP: Record<string, string> = {
  'red-500': '#ef4444',
  'yellow-500': '#eab308',
  'green-500': '#22c55e',
  'blue-500': '#3b82f6',
  'purple-500': '#a855f7',
  'gray-500': '#6b7280',
};

const LABEL_COLORS = [
  { color: 'red-500', name: 'Urgent' },
  { color: 'yellow-500', name: 'Warning' },
  { color: 'green-500', name: 'Success' },
  { color: 'blue-500', name: 'Design' },
  { color: 'purple-500', name: 'Dev' },
  { color: 'gray-500', name: 'General' },
];

export const CardModal: React.FC<CardModalProps> = ({ task, isOpen, onClose, onUpdate, onDelete, onDuplicate, listName, boardMembers, allTasks }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(task.title);
  
  // Rich Text State
  const [description, setDescription] = useState(task.description);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const [activePopover, setActivePopover] = useState<'members' | 'labels' | 'dates' | 'dependencies' | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dependency Search
  const [dependencySearch, setDependencySearch] = useState('');

  // Sync title when prop changes
  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  // Sync description only if not editing to allow external updates but prevent overwriting user typing
  useEffect(() => {
    if (!isEditingDesc && editorRef.current && document.activeElement !== editorRef.current) {
        setDescription(task.description);
        editorRef.current.innerHTML = task.description || '';
    }
  }, [task.description, isEditingDesc]);

  // Scroll to bottom of comments when they change (Real-time update)
  useEffect(() => {
      if (activeTab === 'activity') {
          setTimeout(() => {
              commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  }, [task.comments.length, activeTab]);

  if (!isOpen) return null;

  const handleSaveTitle = () => { if (title !== task.title) onUpdate({ ...task, title }); };
  
  // --- Rich Text Editor Logic ---
  const execCommand = (command: string, value: string | undefined = undefined) => {
      document.execCommand(command, false, value);
      if (editorRef.current) {
          editorRef.current.focus();
      }
  };

  const handleCreateLink = () => {
      const url = prompt("Enter the URL:");
      if (url) {
          execCommand('createLink', url);
      }
  }

  const handleSaveDescription = () => {
      if (editorRef.current) {
          const newDesc = editorRef.current.innerHTML;
          if (newDesc !== task.description) {
              onUpdate({ ...task, description: newDesc });
              setDescription(newDesc);
          }
      }
      setIsEditingDesc(false);
  };

  const handleCancelDescription = () => {
      if (editorRef.current) {
          editorRef.current.innerHTML = task.description || '';
      }
      setIsEditingDesc(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      userId: 'user-1', // In a real app this would come from auth context. For now we use placeholder or assume single user context if not passed.
      text: commentText,
      createdAt: new Date().toISOString()
    };
    onUpdate({ ...task, comments: [newComment, ...task.comments] }); 
    setCommentText('');
  };

  // Checklist Logic
  const handleAddChecklistItem = () => {
      if (!newChecklistItem.trim()) return;
      const item: ChecklistItem = {
          id: `cl-${Date.now()}`,
          text: newChecklistItem,
          isCompleted: false
      };
      const newChecklist = task.checklist ? [...task.checklist, item] : [item];
      onUpdate({ ...task, checklist: newChecklist });
      setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId: string) => {
      const newChecklist = task.checklist.map(item => 
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
      );
      onUpdate({ ...task, checklist: newChecklist });
  };

  const deleteChecklistItem = (itemId: string) => {
      const newChecklist = task.checklist.filter(item => item.id !== itemId);
      onUpdate({ ...task, checklist: newChecklist });
  };

  // --- Attachments Logic ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  const newAttachment: Attachment = {
                      id: `att-${Date.now()}`,
                      name: file.name,
                      url: ev.target.result as string,
                      type: file.type,
                      uploadedAt: new Date().toISOString()
                  };
                  const currentAttachments = task.attachments || [];
                  onUpdate({ ...task, attachments: [...currentAttachments, newAttachment] });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteAttachment = (attId: string) => {
      if (confirm("Delete this attachment?")) {
          onUpdate({ ...task, attachments: task.attachments.filter(a => a.id !== attId) });
      }
  };

  // --- Dependencies Logic ---
  const toggleDependency = (targetTaskId: string) => {
      const currentDeps = task.dependencies || [];
      const newDeps = currentDeps.includes(targetTaskId) 
          ? currentDeps.filter(id => id !== targetTaskId)
          : [...currentDeps, targetTaskId];
      onUpdate({ ...task, dependencies: newDeps });
  };

  const toggleLabel = (color: string, defaultText: string) => {
    const exists = task.labels.find(l => l.color === color);
    const newLabels = exists 
        ? task.labels.filter(l => l.color !== color) 
        : [...task.labels, { id: `l-${Date.now()}`, text: defaultText, color }];
    onUpdate({ ...task, labels: newLabels });
  };

  const toggleMember = (userId: string) => {
    const exists = task.memberIds.includes(userId);
    const newMembers = exists ? task.memberIds.filter(id => id !== userId) : [...task.memberIds, userId];
    onUpdate({ ...task, memberIds: newMembers });
  };

  const checklistTotal = task.checklist?.length || 0;
  const checklistCompleted = task.checklist?.filter(c => c.isCompleted).length || 0;
  const progress = checklistTotal === 0 ? 0 : Math.round((checklistCompleted / checklistTotal) * 100);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-white/20 max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
             <div className="flex-1 mr-4">
                 <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    placeholder={t('board.task_title')}
                    className="w-full bg-transparent text-2xl font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1 -ml-1 transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-800"
                 />
                 <div className="text-sm text-slate-500 mt-1 flex items-center gap-2 px-1">
                     {t('card.in_list')} <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{listName}</span>
                 </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 text-slate-400 hover:text-slate-600">
                 <X className="w-6 h-6" />
             </button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Main Column */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar bg-white dark:bg-slate-900">
                
                {/* Metadata Tags Area */}
                {(task.labels.length > 0 || task.dueDate || task.memberIds.length > 0) && (
                    <div className="flex flex-wrap gap-6 mb-2">
                        {task.memberIds.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('card.members')}</span>
                                <div className="flex -space-x-2">
                                    {task.memberIds.map(mid => {
                                        const user = boardMembers.find(u => u.id === mid);
                                        return (
                                            <div key={mid} title={user?.username} className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-indigo-700 uppercase shadow-sm">
                                                {user?.avatar || user?.username?.substring(0,2) || <UserIcon size={12}/>}
                                            </div>
                                        );
                                    })}
                                    <button onClick={() => setActivePopover('members')} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {task.labels.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('card.labels')}</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {task.labels.map(l => (
                                        <span 
                                            key={l.id} 
                                            className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm"
                                            style={{ backgroundColor: COLOR_MAP[l.color] }}
                                        >
                                            {l.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {task.dueDate && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('card.dates')}</span>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-700 dark:text-slate-300 font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer" onClick={() => setActivePopover('dates')}>
                                    <Clock size={14} />
                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                    {new Date(task.dueDate) < new Date() && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{t('card.overdue')}</span>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700 mb-6 sticky top-0 bg-white dark:bg-slate-900 z-10 pt-2">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <AlignLeft size={16} /> {t('card.description')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('activity')}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'activity' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Activity size={16} /> 
                        {t('card.activity')} 
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full text-[10px]">
                            {task.comments.length}
                        </span>
                    </button>
                </div>

                {activeTab === 'details' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        {/* Rich Text Editor (WYSIWYG) */}
                        <div>
                            <div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200 font-semibold">
                                <div className="flex items-center gap-2"><AlignLeft size={18} className="text-indigo-500" /> {t('card.description')}</div>
                            </div>
                            
                            <div 
                                onClick={() => setIsEditingDesc(true)}
                                className={`
                                    rounded-xl overflow-hidden border transition-all duration-200
                                    ${isEditingDesc 
                                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-white dark:bg-slate-900 shadow-md' 
                                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'}
                                `}
                            >
                                {isEditingDesc && (
                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-700">
                                        <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Bold"><Bold size={16}/></button>
                                        <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Italic"><Italic size={16}/></button>
                                        <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Underline"><Underline size={16}/></button>
                                        <button onClick={() => execCommand('formatBlock', 'H3')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Heading"><Heading1 size={16}/></button>
                                        <button onClick={handleCreateLink} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Insert Link"><LinkIcon size={16}/></button>
                                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                                        <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Bullet List"><List size={16}/></button>
                                        <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Numbered List"><ListOrdered size={16}/></button>
                                    </div>
                                )}
                                
                                <div 
                                    ref={editorRef}
                                    contentEditable={isEditingDesc}
                                    onFocus={() => setIsEditingDesc(true)}
                                    // Use onBlur to save to avoid frequent updates, or simple sync.
                                    // Note: contentEditable with React is tricky. We init with dangerouslySetInnerHTML.
                                    dangerouslySetInnerHTML={{ __html: description || '' }}
                                    className={`
                                        w-full p-4 text-sm text-slate-700 dark:text-slate-300 focus:outline-none prose dark:prose-invert max-w-none min-h-[80px]
                                        ${!description && !isEditingDesc ? 'italic text-slate-400' : ''}
                                        ${isEditingDesc ? 'min-h-[150px]' : 'cursor-pointer'}
                                    `}
                                    data-placeholder={t('card.write')}
                                />
                                
                                {isEditingDesc && (
                                    <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                        <Button variant="transparent" size="sm" onClick={handleCancelDescription}>{t('card.cancel')}</Button>
                                        <Button size="sm" onClick={handleSaveDescription}>{t('card.save_changes')}</Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attachments Section */}
                        {(task.attachments?.length > 0 || isEditingDesc) && (
                            <div>
                                <div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200 font-semibold">
                                    <div className="flex items-center gap-2"><Paperclip size={18} className="text-indigo-500" /> Attachments</div>
                                    <label className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded cursor-pointer transition-colors text-slate-600 dark:text-slate-400 font-medium">
                                        Add
                                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {task.attachments?.map(att => (
                                        <div key={att.id} className="group relative flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700/50 transition-all">
                                            <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300">
                                                {att.type.startsWith('image/') ? (
                                                    <img src={att.url} alt={att.name} className="h-full w-full object-cover rounded" />
                                                ) : (
                                                    <File size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={att.name}>{att.name}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(att.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={att.url} download={att.name} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"><Download size={14}/></a>
                                                <button onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!task.attachments || task.attachments.length === 0) && (
                                        <div className="col-span-2 text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                            No attachments yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dependencies Section */}
                        <div>
                             <div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200 font-semibold">
                                <div className="flex items-center gap-2"><Link2 size={18} className="text-indigo-500" /> Dependencies</div>
                                <button onClick={() => setActivePopover('dependencies')} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors text-slate-600 dark:text-slate-400 font-medium">Add Dependency</button>
                             </div>
                             
                             <div className="space-y-2 relative">
                                 {activePopover === 'dependencies' && (
                                     <div className="absolute right-0 top-0 z-10 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-2 animate-in fade-in zoom-in-95">
                                         <input 
                                            autoFocus
                                            placeholder="Search tasks..."
                                            className="w-full text-sm p-2 border border-slate-200 dark:border-slate-600 rounded mb-2 bg-slate-50 dark:bg-slate-900 dark:text-white"
                                            value={dependencySearch}
                                            onChange={e => setDependencySearch(e.target.value)}
                                         />
                                         <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                            {allTasks
                                                .filter(t => t.id !== task.id && t.title.toLowerCase().includes(dependencySearch.toLowerCase()))
                                                .map(t => (
                                                    <button 
                                                        key={t.id}
                                                        onClick={() => toggleDependency(t.id)}
                                                        className={`w-full text-left text-sm p-2 rounded flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200 ${task.dependencies?.includes(t.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : ''}`}
                                                    >
                                                        <span className="truncate flex-1">{t.title}</span>
                                                        {task.dependencies?.includes(t.id) && <CheckCircle2 size={14} className="text-indigo-500"/>}
                                                    </button>
                                                ))
                                            }
                                         </div>
                                     </div>
                                 )}

                                 {task.dependencies?.map(depId => {
                                     const depTask = allTasks.find(t => t.id === depId);
                                     if (!depTask) return null;
                                     const isCompleted = depTask.checklist && depTask.checklist.length > 0 && depTask.checklist.every(c => c.isCompleted); // Simple logic
                                     return (
                                         <div key={depId} className="flex items-center gap-2 p-2 rounded border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                                             <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-orange-500'}`} />
                                             <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{depTask.title}</span>
                                             <button onClick={() => toggleDependency(depId)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                                         </div>
                                     )
                                 })}
                                 {(!task.dependencies || task.dependencies.length === 0) && (
                                     <div className="text-sm text-slate-400 italic">No dependencies linked.</div>
                                 )}
                             </div>
                        </div>

                        {/* Checklist with Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                                    <CheckSquare size={18} className="text-indigo-500" />
                                    <span className="text-sm">{t('card.checklist')}</span>
                                </div>
                                {checklistTotal > 0 && (
                                    <span className="text-xs font-medium text-slate-500">
                                        {Math.round(progress)}%
                                    </span>
                                )}
                            </div>
                            
                            {/* Visual Progress Bar */}
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden relative">
                                <motion.div 
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                />
                            </div>

                            <div className="space-y-2 mb-3">
                                {task.checklist?.map(item => (
                                    <div key={item.id} className="group flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-colors">
                                        <button onClick={() => toggleChecklistItem(item.id)} className={`transition-all duration-200 ${item.isCompleted ? 'text-indigo-500 scale-110' : 'text-slate-300 hover:text-indigo-500'}`}>
                                            {item.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </button>
                                        <span className={`flex-1 text-sm transition-all ${item.isCompleted ? 'line-through text-slate-400 decoration-slate-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {item.text}
                                        </span>
                                        <button onClick={() => deleteChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pl-9">
                                {newChecklistItem || task.checklist.length === 0 ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                        <input 
                                            autoFocus
                                            value={newChecklistItem}
                                            onChange={e => setNewChecklistItem(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                                            placeholder={t('card.add_item')}
                                            className="flex-1 bg-white dark:bg-slate-800 text-sm py-2 px-3 border border-indigo-500 rounded-lg shadow-sm focus:outline-none dark:text-white"
                                        />
                                        <Button size="sm" onClick={handleAddChecklistItem}>Add</Button>
                                        <button onClick={() => setNewChecklistItem('')} className="p-2 text-slate-400 hover:text-slate-600"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="secondary" onClick={() => setNewChecklistItem(' ')} className="text-xs">{t('card.add_item')}</Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'activity' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                        <div className="flex gap-3 mb-6">
                             {/* User avatar for current user - using first user as fallback since auth context not fully threaded to here yet in this snippet, ideally pass currentUser prop */}
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">YO</div>
                             <div className="flex-1">
                                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all overflow-hidden">
                                     <textarea 
                                        className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none dark:text-white resize-none"
                                        placeholder={t('card.write_comment')}
                                        rows={2}
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddComment();
                                            }
                                        }}
                                     />
                                     <div className="px-2 pb-2 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                                         <span className="text-[10px] text-slate-400 pl-2"><strong>Enter</strong> to save</span>
                                         <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()} className="rounded-lg">{t('card.send')}</Button>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-4 pb-4">
                            {task.comments?.length === 0 && (
                                <div className="text-center text-slate-400 text-sm italic py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    {t('card.no_activity')}
                                </div>
                            )}
                            <AnimatePresence initial={false}>
                                {task.comments?.map(comment => {
                                    const commenter = boardMembers.find(u => u.id === comment.userId);
                                    return (
                                        <motion.div 
                                            key={comment.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-3 group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 uppercase shadow-sm">
                                                {commenter?.avatar || comment.userId.substring(0, 2) || 'US'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer">
                                                        {commenter?.username || 'Unknown User'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm whitespace-pre-wrap">
                                                    {comment.text}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                            <div ref={commentsEndRef} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Sidebar Actions */}
            <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/30 p-6 border-l border-slate-200 dark:border-slate-700 space-y-6 overflow-visible">
                 <div>
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('card.add_to_card')}</h4>
                     <div className="space-y-2 relative">
                         <div className="relative">
                            <button 
                                onClick={() => setActivePopover(activePopover === 'members' ? null : 'members')}
                                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md shadow-sm transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2"><UserIcon size={14} className="text-slate-500" /> {t('card.members')}</div>
                            </button>
                            {activePopover === 'members' && (
                                <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-slate-700">
                                        <span className="font-semibold text-xs text-slate-500 uppercase">{t('card.assign_members')}</span>
                                        <button onClick={() => setActivePopover(null)}><X size={14}/></button>
                                    </div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {boardMembers.length === 0 && <div className="text-xs text-slate-400 italic p-2">No other members in board.</div>}
                                        {boardMembers.map(user => (
                                            <button 
                                                key={user.id}
                                                onClick={() => toggleMember(user.id)}
                                                className={`w-full flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm ${task.memberIds.includes(user.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                                                    {user.avatar || user.username.substring(0, 2)}
                                                </div>
                                                <span className="flex-1 text-left dark:text-slate-200">{user.username}</span>
                                                {task.memberIds.includes(user.id) && <CheckCircle2 size={14} className="text-indigo-500"/>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>

                         <div className="relative">
                             <button 
                                onClick={() => setActivePopover(activePopover === 'labels' ? null : 'labels')}
                                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md shadow-sm transition-all flex items-center justify-between"
                             >
                                 <div className="flex items-center gap-2"><Tag size={14} className="text-slate-500" /> {t('card.labels')}</div>
                             </button>
                             {activePopover === 'labels' && (
                                <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-slate-700">
                                        <span className="font-semibold text-xs text-slate-500 uppercase">{t('card.colors')}</span>
                                        <button onClick={() => setActivePopover(null)}><X size={14}/></button>
                                    </div>
                                    <div className="space-y-2">
                                        {LABEL_COLORS.map(label => {
                                            const isActive = task.labels.some(l => l.color === label.color);
                                            return (
                                                <button 
                                                    key={label.color}
                                                    onClick={() => toggleLabel(label.color, label.name)}
                                                    className="w-full h-8 rounded flex items-center px-3 hover:opacity-90 transition-all text-white text-xs font-bold uppercase tracking-wide relative shadow-sm"
                                                    style={{ backgroundColor: COLOR_MAP[label.color] }}
                                                >
                                                    {label.name}
                                                    {isActive && <CheckCircle2 size={16} className="absolute right-2" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                         </div>

                         <div className="relative">
                             <button 
                                onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md shadow-sm transition-all flex items-center justify-between"
                             >
                                 <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-500" /> {t('card.dates')}</div>
                             </button>
                             {activePopover === 'dates' && (
                                <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-slate-700">
                                        <span className="font-semibold text-xs text-slate-500 uppercase">{t('card.select_date')}</span>
                                        <button onClick={() => setActivePopover(null)}><X size={14}/></button>
                                    </div>
                                    <div>
                                        <input 
                                            type="date"
                                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => { onUpdate({...task, dueDate: e.target.value}); setActivePopover(null); }}
                                        />
                                        <button 
                                            onClick={() => { onUpdate({...task, dueDate: null}); setActivePopover(null); }}
                                            className="mt-2 w-full text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 rounded"
                                        >
                                            {t('card.remove_date')}
                                        </button>
                                    </div>
                                </div>
                            )}
                         </div>

                     </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('card.actions')}</h4>
                     <button 
                        onClick={() => onDuplicate(task)}
                        className="w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                    >
                        <Copy size={16} /> {t('card.duplicate_card')}
                    </button>

                    {showDeleteConfirm ? (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/50">
                            <p className="text-xs text-red-600 dark:text-red-300 font-bold mb-2">Are you sure?</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="danger" onClick={() => onDelete(task.id)} className="w-full">Yes, Delete</Button>
                                <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="w-full">Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex items-center gap-2 border border-transparent hover:border-red-200"
                        >
                            <Trash2 size={16} /> {t('card.delete_card')}
                        </button>
                    )}
                </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
