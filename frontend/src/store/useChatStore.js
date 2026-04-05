// import { create } from 'zustand'

// const useChatStore = create((set) => ({
//     selectedUser: null,
//     messages: [],
//     onlineUsers: [],

//     setSelectedUser: (user) => set({ selectedUser: user }),
//     setMessages: (messages) => set({ messages }),
//     addMessage: (message) => set((state) => ({ 
//         messages: [...state.messages, message] 
//     })),
//     setOnlineUsers: (users) => set({ onlineUsers: users }),
// }))

// export default useChatStore


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
            // message from someone not currently open → increment badge only
            set((s) => ({
                unreadCounts: {
                    ...s.unreadCounts,
                    [senderId]: (s.unreadCounts[senderId] || 0) + 1
                }
            }));
        } else {
            // ✅ always append to messages — whether sent or received in active chat
            set((s) => ({ messages: [...s.messages, message] }));
        }
    },

    setOnlineUsers: (users) => set({ onlineUsers: users }),
}))

export default useChatStore