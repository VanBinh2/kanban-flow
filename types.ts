

export interface User {
  id: string;
  username: string;
  avatar: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Label {
  id: string;
  text: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  memberIds: string[];
  labels: Label[];
  dueDate: string | null;
  comments: Comment[];
  checklist: ChecklistItem[]; 
  attachments: Attachment[]; // New Feature
  dependencies: string[]; // New Feature: IDs of tasks this task depends on
  createdAt: string;
  order: number;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  taskIds: string[]; 
  order: number;
}

export interface Board {
  id: string;
  title: string;
  background: string;
  ownerId?: string;
  members: User[]; // Changed from string[] to User[] for frontend display
  listIds: string[];
  createdAt: string;
}

export interface BoardData extends Board {
  lists: { [key: string]: List };
  tasks: { [key: string]: Task };
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface FilterState {
  search: string;
  members: string[];
  labels: string[];
  dueNextWeek: boolean;
}
