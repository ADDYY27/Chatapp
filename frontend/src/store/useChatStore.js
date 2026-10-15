import { create } from "zustand";

const useChatStore = create((set, get) => ({
    selectedGroup: null,

    setSelectedGroup: (group) =>
        set({
            selectedGroup: group,
            selectedUser: null,
            replyingTo: null,
        }),
    activeSection: "chats",
    settingsTab: "profile",
    setSettingsTab: (tab) => set({ settingsTab: tab }),
    meetRoomId: "late-night-coding",
    setMeetRoomId: (id) => set({ meetRoomId: id }),

    messages: [],
    onlineUsers: [],
    unreadCounts: {},
    unreadGroupCounts: {},
    chatters: [],
    typingMap: {},
    replyingTo: null,

    setReplyingTo: (msg) => set({ replyingTo: msg }),

    updateMessageReactions: (messageId, reactions) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m._id === messageId ? { ...m, reactions } : m
            ),
        })),

    updateMessagePinned: (messageId, isPinned, pinnedAt, pinnedBy) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m._id === messageId ? { ...m, isPinned, pinnedAt, pinnedBy } : m
            ),
        })),

    removeMessageForMe: (messageId) =>
        set((state) => ({
            messages: state.messages.filter((m) => m._id !== messageId),
        })),

    setUserTyping: (userId, isTyping) =>
        set((state) => ({
            typingMap: {
                ...state.typingMap,
                [userId]: isTyping,
            },
        })),

    setUnreadCounts: (counts) =>
        set((state) => ({
            unreadCounts: {
                ...state.unreadCounts,
                ...counts,
            },
        })),

    setChatters: (chatters) => {
        // Also initialize unread counts from chatters metadata if present
        const initialUnread = {};
        chatters.forEach((c) => {
            if (c.unreadCount !== undefined) {
                initialUnread[c._id] = c.unreadCount;
            }
        });
        set((state) => ({
            chatters,
            unreadCounts: {
                ...initialUnread,
                ...state.unreadCounts,
            },
        }));
    },
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

    selectedUser: null,

    setSelectedUser: (user) =>
    set((state) => ({
        selectedUser: user,
        selectedGroup: null,
        replyingTo: null,
        messages: [], // Clear messages immediately so old conversation never flashes
        unreadCounts: user ? {
            ...state.unreadCounts,
            [user._id]: 0,
        } : state.unreadCounts,
    })),

    setMessages: (messages) => set({ messages }),

    addMessage: (message, currentUserId) => {
        const state = get();

        // Prevent duplicate messages
        const exists = state.messages.some((m) => m._id === message._id);
        if (exists) return;

        const senderId =
            message.senderId?._id?.toString() ||
            message.senderId?.toString();

        const isIncoming =
            senderId !== currentUserId?.toString();

        const isFromSelectedUser =
            state.selectedUser?._id?.toString() === senderId;

        // Also update chatter lastMessage metadata
        const updatedChatters = state.chatters.map((c) => {
            if (c._id === senderId || (message.reciverId && c._id === (message.reciverId?._id || message.reciverId))) {
                return {
                    ...c,
                    lastMessage: message.message,
                    lastMessageTime: message.createdAt || new Date().toISOString(),
                };
            }
            return c;
        });

        if (isIncoming && !isFromSelectedUser) {
            set((s) => ({
                chatters: updatedChatters,
                unreadCounts: {
                    ...s.unreadCounts,
                    [senderId]: (s.unreadCounts[senderId] || 0) + 1,
                },
            }));
        } else {
            set((s) => ({
                chatters: updatedChatters,
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

    markMessagesAsRead: (userId, readAt) => {
        set((state) => ({
            messages: state.messages.map((message) => {
                const receiverId =
                    message.reciverId?._id?.toString() ||
                    message.reciverId?.toString();

                if (receiverId === userId?.toString()) {
                    return {
                        ...message,
                        isRead: true,
                        isDelivered: true,
                        readAt: readAt || message.readAt || new Date().toISOString(),
                    };
                }

                return message;
            }),
        }));
    },

    isDetailsOpen: true,
    setIsDetailsOpen: (open) =>
        set((state) => ({
            isDetailsOpen: typeof open === "function" ? open(state.isDetailsOpen) : open,
        })),
}));

export default useChatStore;