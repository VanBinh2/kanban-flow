
import { Board, BoardData, User } from '../types';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
let socket: Socket | null = null;

// Removed hardcoded ALL_USERS. Data now comes from API.

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = 'An unexpected error occurred.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || response.statusText;
        } catch {
            errorMessage = response.statusText;
        }

        if (response.status === 401) {
            localStorage.removeItem('token');
            // Allow app to handle redirect via state
            throw new Error('Session expired.');
        } else if (response.status === 403) {
            throw new Error('Permission denied.');
        }
        
        throw new Error(errorMessage);
    }
    return response;
};

export const api = {
  connectSocket: (boardId: string, onUpdate: (data: any) => void) => {
      if (socket) socket.disconnect(); // Ensure only one socket connection per board view
      
      try {
         socket = io('http://localhost:5000');
         socket.emit('join_board', boardId);
         socket.on('board_updated', (data) => {
             onUpdate(data);
         });
      } catch (e) {
          console.warn("Socket init failed", e);
      }
  },

  disconnectSocket: () => {
      if (socket) socket.disconnect();
      socket = null;
  },

  login: async (email: string, password: string): Promise<User> => {
      const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
      });
      const data = await (await handleResponse(response)).json();
      localStorage.setItem('token', data.token);
      return data.user;
  },

  register: async (username: string, email: string, password: string): Promise<User> => {
      const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
      });
      const data = await (await handleResponse(response)).json();
      localStorage.setItem('token', data.token);
      return data.user;
  },

  // --- Board Management ---

  getBoards: async (): Promise<Board[]> => {
      const response = await fetch(`${API_URL}/boards`, { headers: getHeaders() });
      return await (await handleResponse(response)).json();
  },

  createBoard: async (title: string, background: string): Promise<Board> => {
      const response = await fetch(`${API_URL}/boards`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ title, background })
      });
      return await (await handleResponse(response)).json();
  },

  deleteBoard: async (boardId: string): Promise<void> => {
      await handleResponse(await fetch(`${API_URL}/boards/${boardId}`, {
          method: 'DELETE',
          headers: getHeaders()
      }));
  },

  getBoardData: async (boardId: string): Promise<BoardData> => {
      const response = await fetch(`${API_URL}/board/${boardId}`, { headers: getHeaders() });
      return await (await handleResponse(response)).json();
  },

  updateBoardData: async (data: BoardData): Promise<void> => {
      await fetch(`${API_URL}/board/sync`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
  },

  inviteMember: async (boardId: string, email: string): Promise<User> => {
      const response = await fetch(`${API_URL}/boards/${boardId}/members`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ email })
      });
      const data = await (await handleResponse(response)).json();
      return data.user;
  },

  getUsers: async (): Promise<User[]> => {
      try {
          const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
          if (!res.ok) return [];
          return await res.json();
      } catch {
          return [];
      }
  }
};
