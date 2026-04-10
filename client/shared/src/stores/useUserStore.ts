import { create } from 'zustand';
import { User, Friend } from '../types';

interface UserState {
  friends: Friend[];
  friendRequests: Friend[];
  blocklist: string[];
  searchedUsers: User[];
  isLoading: boolean;

  // Actions
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  updateFriend: (id: string, updates: Partial<Friend>) => void;
  removeFriend: (id: string) => void;
  setFriendRequests: (requests: Friend[]) => void;
  addFriendRequest: (request: Friend) => void;
  removeFriendRequest: (id: string) => void;
  setBlocklist: (blocklist: string[]) => void;
  addToBlocklist: (userId: string) => void;
  removeFromBlocklist: (userId: string) => void;
  setSearchedUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  friends: [],
  friendRequests: [],
  blocklist: [],
  searchedUsers: [],
  isLoading: false,

  setFriends: (friends: Friend[]) => {
    set({ friends });
  },

  addFriend: (friend: Friend) => {
    set((state) => ({
      friends: [...state.friends, friend],
    }));
  },

  updateFriend: (id: string, updates: Partial<Friend>) => {
    set((state) => ({
      friends: state.friends.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  },

  removeFriend: (id: string) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== id),
    }));
  },

  setFriendRequests: (requests: Friend[]) => {
    set({ friendRequests: requests });
  },

  addFriendRequest: (request: Friend) => {
    set((state) => ({
      friendRequests: [request, ...state.friendRequests],
    }));
  },

  removeFriendRequest: (id: string) => {
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== id),
    }));
  },

  setBlocklist: (blocklist: string[]) => {
    set({ blocklist });
  },

  addToBlocklist: (userId: string) => {
    set((state) => ({
      blocklist: [...state.blocklist, userId],
    }));
  },

  removeFromBlocklist: (userId: string) => {
    set((state) => ({
      blocklist: state.blocklist.filter((id) => id !== userId),
    }));
  },

  setSearchedUsers: (users: User[]) => {
    set({ searchedUsers: users });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearUser: () => {
    set({
      friends: [],
      friendRequests: [],
      blocklist: [],
      searchedUsers: [],
    });
  },
}));
