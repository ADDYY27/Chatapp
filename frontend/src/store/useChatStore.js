import { create } from "zustand";

const useChatStore = create((set, get) => ({
   selectedGroup: null,

setSelectedGroup: (group) =>
  set({
    selectedGroup: group,
    selectedUser: null,
  }),
    activeSection: "chats",

    messages: [],
    onlineUsers: [],
    unreadCounts: {},
unreadGroupCounts: {},
    chatters: [],

    setChatters: (chatters) => set({ chatters }),
setActiveSection: (section) => set({ activeSection: section }),
    addChatter: (user) =>
        set((state) => {
            const exists = state.chatters.some(
                (chatter) => chatter._id === user._id
            );

            if (exists) return state;

            return {
                chatters: [user, ...state.chatters],
            };
        }),

    setSelectedUser: (user) =>
    set((state) => ({
        selectedUser: user,
        selectedGroup: null,
        unreadCounts: {
            ...state.unreadCounts,
            [user._id]: 0,
        },
    })),

    setMessages: (messages) => set({ messages }),

    addMessage: (message, currentUserId) => {
        const state = get();

        const senderId =
            message.senderId?._id?.toString() ||
            message.senderId?.toString();

        const isIncoming =
            senderId !== currentUserId?.toString();

        const isFromSelectedUser =
            state.selectedUser?._id?.toString() === senderId;

        if (isIncoming && !isFromSelectedUser) {
            set((s) => ({
                unreadCounts: {
                    ...s.unreadCounts,
                    [senderId]: (s.unreadCounts[senderId] || 0) + 1,
                },
            }));
        } else {
            set((s) => ({
                messages: [...s.messages, message],
            }));
        }
    },

 addGroupMessage: (message, currentUserId) =>
  set((state) => {
    const exists = state.messages.some(
      (msg) => msg._id === message._id
    );

    if (exists) return state;

    const groupId =
      message.conversationId?.toString();

    const currentGroupId =
      state.selectedGroup?._id?.toString();

    const senderId =
      message.senderId?._id?.toString() ||
      message.senderId?.toString();

  const isOwnMessage =
  senderId === currentUserId?.toString();

const isCurrentGroup =
  groupId === currentGroupId;

console.log("GROUP CHECK:", {
  groupId,
  currentGroupId,
  senderId,
  currentUserId,
  isCurrentGroup,
  isOwnMessage,
});

    // Current group open hai
    if (isCurrentGroup) {
      return {
        messages: [...state.messages, message],
      };
    }

    // Dusre group ka message hai
    if (!isOwnMessage) {
      return {
        unreadGroupCounts: {
          ...state.unreadGroupCounts,
          [groupId]:
            (state.unreadGroupCounts[groupId] || 0) + 1,
        },
      };
    }

    return state;
  }),
addGroupUnread: (groupId) =>
  set((state) => ({
    unreadGroupCounts: {
      ...state.unreadGroupCounts,
      [groupId]:
        (state.unreadGroupCounts[groupId] || 0) + 1,
    },
  })),


clearGroupUnread: (groupId) =>
  set((state) => ({
    unreadGroupCounts: {
      ...state.unreadGroupCounts,
      [groupId]: 0,
    },
  })),





  
    setOnlineUsers: (users) => set({ onlineUsers: users }),

    markMessagesAsRead: (userId) => {
        set((state) => ({
            messages: state.messages.map((message) => {
                const receiverId =
                    message.reciverId?._id?.toString() ||
                    message.reciverId?.toString();

                if (receiverId === userId?.toString()) {
                    return {
                        ...message,
                        isRead: true,
                    };
                }

                return message;
            }),
        }));
    },
}));

export default useChatStore;