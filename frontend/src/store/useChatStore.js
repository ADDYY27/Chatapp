


import { create } from 'zustand'

const useChatStore = create((set, get) => ({
    selectedUser: null,
    messages: [],
    onlineUsers: [],
    unreadCounts: {},

    setSelectedUser: (user) => set((state) => ({
        selectedUser: user,
        unreadCounts: {
            ...state.unreadCounts,
            [user._id]: 0
        }
    })),

    setMessages: (messages) => set({ messages }),

    addMessage: (message, currentUserId) => {
        const state = get();
        const senderId = message.senderId?._id?.toString() || message.senderId?.toString();
        const isIncoming = senderId !== currentUserId?.toString();
        const isFromSelectedUser = state.selectedUser?._id?.toString() === senderId;

        if (isIncoming && !isFromSelectedUser) {
          
            set((s) => ({
                unreadCounts: {
                    ...s.unreadCounts,
                    [senderId]: (s.unreadCounts[senderId] || 0) + 1
                }
            }));
        } else {
            
            set((s) => ({ messages: [...s.messages, message] }));
        }
    },

    setOnlineUsers: (users) => set({ onlineUsers: users }),
}))

export default useChatStore