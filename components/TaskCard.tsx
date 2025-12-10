import React, { useRef, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, User } from '../types';
import { Clock, MessageSquare, AlignLeft, CheckSquare, User as UserIcon } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
  boardMembers: User[];
}

const COLOR_MAP: Record<string, string> = {
  'red-500': 'bg-red-500/10 text-red-600 border-red-200/50 dark:border-red-900/30 dark:text-red-400',
  'yellow-500': 'bg-yellow-500/10 text-yellow-600 border-yellow-200/50 dark:border-yellow-900/30 dark:text-yellow-400',
  'green-500': 'bg-green-500/10 text-green-600 border-green-200/50 dark:border-green-900/30 dark:text-green-400',
  'blue-500': 'bg-blue-500/10 text-blue-600 border-blue-200/50 dark:border-blue-900/30 dark:text-blue-400',
  'purple-500': 'bg-purple-500/10 text-purple-600 border-purple-200/50 dark:border-purple-900/30 dark:text-purple-400',
  'gray-500': 'bg-gray-500/10 text-gray-600 border-gray-200/50 dark:border-gray-900/30 dark:text-gray-400',
};

const getDateStyle = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400';
    if (diffDays <= 1) return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400';
    return 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400';
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick, boardMembers }) => {
  const completedChecklist = task.checklist ? task.checklist.filter(c => c.isCompleted).length : 0;
  const totalChecklist = task.checklist ? task.checklist.length : 0;
  const dateStyle = getDateStyle(task.dueDate);

  // --- 3D Tilt & Spotlight Logic ---
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spotlight gradient following mouse
  const background = useMotionTemplate`radial-gradient(
    450px circle at ${mouseX}px ${mouseY}px,
    rgba(124, 58, 237, 0.10),
    transparent 80%
  )`;
  
  // Border spotlight
  const border = useMotionTemplate`radial-gradient(
    300px circle at ${mouseX}px ${mouseY}px,
    rgba(124, 58, 237, 0.4),
    transparent 80%
  )`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top } = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className="mb-3 perspective-1000" // Wrapper for 3D context
        >
            <motion.div
                ref={ref}
                onClick={() => onClick(task)}
                onMouseMove={handleMouseMove}
                whileHover={{ 
                    scale: 1.02, 
                    rotateX: 2, 
                    rotateY: 2, 
                    z: 10,
                    boxShadow: "0px 0px 20px rgba(99, 102, 241, 0.25)" 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                    group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900/60 p-4 transition-all duration-300
                    backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 preserve-3d
                    ${snapshot.isDragging 
                        ? 'shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] ring-1 ring-indigo-500/50 rotate-2 z-50' 
                        : 'shadow-sm'}
                `}
            >
                {/* Spotlight Background Effect */}
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{ background }}
                />
                
                {/* Spotlight Border Effect via mask */}
                <motion.div
                    className="pointer-events-none absolute inset-0 z-10 opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{ 
                        background: border,
                        maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor',
                        padding: '1px' // border width
                    }}
                />

                {/* Card Content */}
                <div className="relative z-0">
                    {/* Labels */}
                    {task.labels.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-1.5">
                        {task.labels.map((label) => (
                            <span
                            key={label.id}
                            className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider border ${COLOR_MAP[label.color]}`}
                            >
                            {label.text}
                            </span>
                        ))}
                        </div>
                    )}

                    <h3 className="mb-2 text-[14px] font-semibold leading-relaxed text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {task.title}
                    </h3>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-slate-400">
                            {task.dueDate && (
                                <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 border text-[10px] font-bold uppercase tracking-wide ${dateStyle}`}>
                                <Clock size={10} strokeWidth={3} />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )}
                            
                            {(task.description || task.comments.length > 0 || totalChecklist > 0) && (
                                <div className="flex items-center gap-2 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                                    {task.comments.length > 0 && (
                                        <div className="flex items-center gap-1 hover:text-indigo-500">
                                            <MessageSquare size={13} /> <span className="font-medium">{task.comments.length}</span>
                                        </div>
                                    )}
                                    {totalChecklist > 0 && (
                                        <div className={`flex items-center gap-1 ${completedChecklist === totalChecklist ? 'text-green-500' : 'hover:text-indigo-500'}`}>
                                            <CheckSquare size={13} /> <span className="font-medium">{completedChecklist}/{totalChecklist}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {task.memberIds.length > 0 && (
                            <div className="flex -space-x-1.5 pl-2">
                                {task.memberIds.slice(0, 3).map((mid, i) => {
                                const user = boardMembers.find(u => u.id === mid);
                                return (
                                    <div 
                                        key={i} 
                                        title={user?.username} 
                                        className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900 uppercase shadow-md"
                                    >
                                    {user?.avatar || user?.username?.substring(0,2) || <UserIcon size={10} />}
                                    </div>
                                );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </Draggable>
  );
};