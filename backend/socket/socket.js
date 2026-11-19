import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Conversation from '../Models/conversationModels.js';
import User from '../Models/userModels.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:8080',
            'https://chatapp-production-856d.up.railway.app',
            'https://chatapp-ivory-eta.vercel.app',
        ],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Map of userId -> Set of socket IDs for multi-tab support
const userSocketmap = {};
const nudgeRateLimitMap = new Map();

// ================= CALL SESSION REGISTRY =================
// Active calls map: callId -> { callId, callerId, receiverId, callType, status, createdAt, timeoutTimer }
export const calls = new Map();
// Active user to call map: userId -> callId
export const userCallMap = new Map();
export const CALL_RING_TIMEOUT_MS = parseInt(process.env.CALL_RING_TIMEOUT_MS, 10) || 30000;

export const cleanupCallSession = (callId) => {
    const session = calls.get(callId);
    if (!session) return null;
    if (session.timeoutTimer) {
        clearTimeout(session.timeoutTimer);
        session.timeoutTimer = null;
    }
    calls.delete(callId);
    userCallMap.delete(session.callerId);
    userCallMap.delete(session.receiverId);
    return session;
};

export const getReciverSocketId = (receiverId) => {
    if (!receiverId) return null;
    const sockets = userSocketmap[receiverId];
    if (!sockets || sockets.size === 0) return null;
    return Array.from(sockets);
};

// ================= HANDSHAKE AUTHENTICATION =================
io.use((socket, next) => {
    try {
        const rawCookies = socket.handshake.headers.cookie;
        const parsedCookies = rawCookies ? cookie.parse(rawCookies) : {};
        const token = parsedCookies.jwt || socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            return next(new Error("Authentication error: Invalid token"));
        }

        // Attach verified identity to the socket instance
        socket.userId = decoded.userId.toString();
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid or expired token"));
    }
});

io.on('connection', (socket) => {
    const userId = socket.userId;

    if (!userSocketmap[userId]) {
        userSocketmap[userId] = new Set();
    }
    userSocketmap[userId].add(socket.id);
    socket.join(`user:${userId}`);

    io.emit("getOnlineUsers", Object.keys(userSocketmap));

    // ================= GROUP ROOMS =================
    socket.on("joinGroup", async (groupId) => {
        try {
            if (!groupId) return;
            const group = await Conversation.findOne({
                _id: groupId,
                isGroup: true,
                participants: userId
            });

            if (!group) {
                console.warn(`Unauthorized joinGroup attempt by ${userId} for group ${groupId}`);
                return;
            }

            socket.join(`group:${groupId}`);
        } catch (err) {
            console.error("Error joining group room:", err);
        }
    });

    socket.on("leaveGroup", (groupId) => {
        if (groupId) {
            socket.leave(`group:${groupId}`);
        }
    });

    // ================= TYPING INDICATORS =================
    socket.on("typing", ({ receiverId, conversationId }) => {
        if (!userId || !receiverId) return;
        const receiverSocketIds = getReciverSocketId(receiverId);
        if (receiverSocketIds) {
            io.to(receiverSocketIds).emit("userTyping", {
                senderId: userId,
                conversationId
            });
        }
    });

    socket.on("stopTyping", ({ receiverId, conversationId }) => {
        if (!userId || !receiverId) return;
        const receiverSocketIds = getReciverSocketId(receiverId);
        if (receiverSocketIds) {
            io.to(receiverSocketIds).emit("userStoppedTyping", {
                senderId: userId,
                conversationId
            });
        }
    });

    // ================= NUDGE =================
    socket.on("nudge", ({ receiverId }) => {
        if (!userId || !receiverId) return;
        const nudgeKey = `${userId}:${receiverId}`;
        const lastNudge = nudgeRateLimitMap.get(nudgeKey) || 0;
        const now = Date.now();
        if (now - lastNudge < 5000) {
            socket.emit("nudgeError", { message: "Please wait a few seconds before nudging again." });
            return;
        }
        nudgeRateLimitMap.set(nudgeKey, now);

        const receiverSocketIds = getReciverSocketId(receiverId);
        if (receiverSocketIds) {
            io.to(receiverSocketIds).emit("nudge", {
                senderId: userId
            });
        }
    });

    // ================= VOICE & VIDEO CALL SIGNALING =================
    socket.on("call:start", async ({ receiverId, callType }, callback) => {
        try {
            if (!receiverId || typeof receiverId !== "string" || receiverId.trim() === "" || receiverId === userId) {
                const errPayload = { message: "Invalid receiver ID", reason: "invalid_receiver" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            if (callType !== "voice" && callType !== "video") {
                const errPayload = { message: "Invalid call type. Must be voice or video", reason: "invalid_call_type" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            // Check if receiver is online
            const receiverSocketIds = getReciverSocketId(receiverId);
            if (!receiverSocketIds || receiverSocketIds.length === 0) {
                const errPayload = { message: "User is offline", reason: "offline" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            // Check if caller is already in an active call
            if (userCallMap.has(userId)) {
                const errPayload = { message: "You are already in an active call", reason: "caller_busy" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            // Check if receiver is already in an active call
            if (userCallMap.has(receiverId)) {
                const errPayload = { message: "User is busy on another call", reason: "receiver_busy" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            const callId = `call_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
            const session = {
                callId,
                callerId: userId,
                receiverId,
                callerSocketId: socket.id,
                receiverSocketId: null,
                callType,
                status: "ringing",
                createdAt: new Date(),
                timeoutTimer: null
            };

            // Set up ringing timeout
            session.timeoutTimer = setTimeout(() => {
                const activeSession = calls.get(callId);
                if (activeSession && activeSession.status === "ringing") {
                    cleanupCallSession(callId);
                    const callerSockets = getReciverSocketId(session.callerId);
                    const recSockets = getReciverSocketId(session.receiverId);
                    if (callerSockets) {
                        io.to(callerSockets).emit("call:timeout", { callId, reason: "no_answer" });
                    }
                    if (recSockets) {
                        io.to(recSockets).emit("call:timeout", { callId, reason: "no_answer" });
                    }
                }
            }, CALL_RING_TIMEOUT_MS);

            calls.set(callId, session);
            userCallMap.set(userId, callId);
            userCallMap.set(receiverId, callId);

            // Fetch authenticated caller's profile to display on receiver's incoming call modal
            let callerName = "User";
            let callerPic = "";
            let callerUsername = "";
            if (mongoose.connection && mongoose.connection.readyState === 1) {
                try {
                    const callerUser = await User.findById(userId).select("fullname profilepic username").lean();
                    if (callerUser) {
                        callerName = callerUser.fullname || "User";
                        callerPic = callerUser.profilepic || "";
                        callerUsername = callerUser.username || "";
                    }
                } catch (err) {
                    console.warn("Could not fetch caller profile for call signaling:", err.message);
                }
            }

            // Notify receiver of incoming call with verified caller details
            io.to(receiverSocketIds).emit("call:incoming", {
                callId,
                callerId: userId,
                callerName,
                callerPic,
                callerUsername,
                callType
            });

            // Notify caller that ringing has started
            socket.emit("call:ringing", {
                callId,
                receiverId,
                callType
            });

            if (typeof callback === "function") {
                callback({ success: true, callId, callType });
            }
        } catch (err) {
            console.error("Error in call:start:", err);
            socket.emit("call:error", { message: "Failed to initiate call", reason: "server_error" });
        }
    });

    socket.on("call:accept", ({ callId }, callback) => {
        try {
            if (!callId) {
                const errPayload = { message: "Call ID required", reason: "invalid_call_id" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            const session = calls.get(callId);
            if (!session) {
                const errPayload = { message: "Call session not found", reason: "call_not_found" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            if (session.receiverId !== userId) {
                const errPayload = { message: "Unauthorized: only the receiver can accept the call", reason: "unauthorized" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            if (session.status !== "ringing") {
                const errPayload = { message: "Call is no longer ringing", reason: "invalid_state" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            if (session.timeoutTimer) {
                clearTimeout(session.timeoutTimer);
                session.timeoutTimer = null;
            }

            session.status = "connected";
            session.receiverSocketId = socket.id;

            // Notify other receiver tabs if any that call was accepted elsewhere
            const receiverSockets = getReciverSocketId(session.receiverId) || [];
            for (const sId of receiverSockets) {
                if (sId !== socket.id) {
                    io.to(sId).emit("call:accepted_elsewhere", { callId });
                }
            }

            // Notify caller that call was accepted
            const callerSockets = getReciverSocketId(session.callerId);
            if (callerSockets) {
                io.to(callerSockets).emit("call:accepted", {
                    callId,
                    receiverId: userId
                });
            }

            // Acknowledge to receiver
            socket.emit("call:accepted", {
                callId,
                callerId: session.callerId
            });

            if (typeof callback === "function") {
                callback({ success: true, callId });
            }
        } catch (err) {
            console.error("Error in call:accept:", err);
        }
    });

    socket.on("call:reject", ({ callId, reason }, callback) => {
        try {
            if (!callId) {
                const errPayload = { message: "Call ID required", reason: "invalid_call_id" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            const session = calls.get(callId);
            if (!session) {
                const errPayload = { message: "Call session not found", reason: "call_not_found" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            if (session.receiverId !== userId) {
                const errPayload = { message: "Unauthorized: only the receiver can reject the call", reason: "unauthorized" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            if (session.status !== "ringing") {
                const errPayload = { message: "Call is no longer ringing", reason: "invalid_state" };
                socket.emit("call:error", errPayload);
                if (typeof callback === "function") callback({ success: false, ...errPayload });
                return;
            }

            cleanupCallSession(callId);

            // Notify caller
            const callerSockets = getReciverSocketId(session.callerId);
            if (callerSockets) {
                io.to(callerSockets).emit("call:rejected", {
                    callId,
                    reason: reason || "declined"
                });
            }

            if (typeof callback === "function") {
                callback({ success: true, callId });
            }
        } catch (err) {
            console.error("Error in call:reject:", err);
        }
    });

    socket.on("call:offer", ({ callId, sdp }) => {
        try {
            if (!callId || !sdp) return;
            const session = calls.get(callId);
            if (!session || (session.status !== "ringing" && session.status !== "connected")) {
                socket.emit("call:error", { message: "Invalid or ended call session", reason: "invalid_call" });
                return;
            }

            if (session.callerId !== userId && session.receiverId !== userId) {
                socket.emit("call:error", { message: "Unauthorized: not a call participant", reason: "unauthorized" });
                return;
            }

            // In connected state, ensure signaling is from the call-owning socket
            if (session.status === "connected") {
                if (socket.id !== session.callerSocketId && socket.id !== session.receiverSocketId) {
                    socket.emit("call:error", { message: "Unauthorized: not the call-owning socket", reason: "unauthorized" });
                    return;
                }
            }

            const targetSocketId = userId === session.callerId ? session.receiverSocketId : session.callerSocketId;
            const targetSockets = targetSocketId ? [targetSocketId] : getReciverSocketId(userId === session.callerId ? session.receiverId : session.callerId);
            if (targetSockets && targetSockets.length > 0) {
                io.to(targetSockets).emit("call:offer", {
                    callId,
                    sdp,
                    senderId: userId
                });
            }
        } catch (err) {
            console.error("Error in call:offer:", err);
        }
    });

    socket.on("call:answer", ({ callId, sdp }) => {
        try {
            if (!callId || !sdp) return;
            const session = calls.get(callId);
            if (!session || (session.status !== "connected" && session.status !== "ringing")) {
                socket.emit("call:error", { message: "Invalid or ended call session", reason: "invalid_call" });
                return;
            }

            if (session.callerId !== userId && session.receiverId !== userId) {
                socket.emit("call:error", { message: "Unauthorized: not a call participant", reason: "unauthorized" });
                return;
            }

            // In connected state, ensure signaling is from the call-owning socket
            if (session.status === "connected") {
                if (socket.id !== session.callerSocketId && socket.id !== session.receiverSocketId) {
                    socket.emit("call:error", { message: "Unauthorized: not the call-owning socket", reason: "unauthorized" });
                    return;
                }
            }

            const targetSocketId = userId === session.callerId ? session.receiverSocketId : session.callerSocketId;
            const targetSockets = targetSocketId ? [targetSocketId] : getReciverSocketId(userId === session.callerId ? session.receiverId : session.callerId);
            if (targetSockets && targetSockets.length > 0) {
                io.to(targetSockets).emit("call:answer", {
                    callId,
                    sdp,
                    senderId: userId
                });
            }
        } catch (err) {
            console.error("Error in call:answer:", err);
        }
    });

    socket.on("call:ice-candidate", ({ callId, candidate }) => {
        try {
            if (!callId || !candidate) return;
            const session = calls.get(callId);
            if (!session || (session.status !== "ringing" && session.status !== "connected")) {
                socket.emit("call:error", { message: "Invalid or ended call session", reason: "invalid_call" });
                return;
            }

            if (session.callerId !== userId && session.receiverId !== userId) {
                socket.emit("call:error", { message: "Unauthorized: not a call participant", reason: "unauthorized" });
                return;
            }

            // In connected state, ensure signaling is from the call-owning socket
            if (session.status === "connected") {
                if (socket.id !== session.callerSocketId && socket.id !== session.receiverSocketId) {
                    socket.emit("call:error", { message: "Unauthorized: not the call-owning socket", reason: "unauthorized" });
                    return;
                }
            }

            const targetSocketId = userId === session.callerId ? session.receiverSocketId : session.callerSocketId;
            const targetSockets = targetSocketId ? [targetSocketId] : getReciverSocketId(userId === session.callerId ? session.receiverId : session.callerId);
            if (targetSockets && targetSockets.length > 0) {
                io.to(targetSockets).emit("call:ice-candidate", {
                    callId,
                    candidate,
                    senderId: userId
                });
            }
        } catch (err) {
            console.error("Error in call:ice-candidate:", err);
        }
    });

    socket.on("call:end", ({ callId }, callback) => {
        try {
            if (!callId) return;
            const session = calls.get(callId);
            if (!session) {
                if (typeof callback === "function") callback({ success: true, message: "Call already ended" });
                return;
            }

            if (session.callerId !== userId && session.receiverId !== userId) {
                socket.emit("call:error", { message: "Unauthorized: not a call participant", reason: "unauthorized" });
                return;
            }

            cleanupCallSession(callId);

            const otherId = userId === session.callerId ? session.receiverId : session.callerId;
            const otherSockets = getReciverSocketId(otherId);
            if (otherSockets) {
                io.to(otherSockets).emit("call:ended", {
                    callId,
                    endedBy: userId,
                    reason: "user_hung_up"
                });
            }

            // Also notify any remaining sockets of the user who hung up
            const mySockets = getReciverSocketId(userId);
            if (mySockets) {
                io.to(mySockets).emit("call:ended", {
                    callId,
                    endedBy: userId,
                    reason: "user_hung_up"
                });
            } else {
                socket.emit("call:ended", {
                    callId,
                    endedBy: userId,
                    reason: "user_hung_up"
                });
            }

            if (typeof callback === "function") {
                callback({ success: true, callId });
            }
        } catch (err) {
            console.error("Error in call:end:", err);
        }
    });

    // ================= DISCONNECT =================
    socket.on('disconnect', async () => {
        // 1. Call session socket-level ownership check
        const activeCallId = userCallMap.get(userId);
        if (activeCallId) {
            const session = calls.get(activeCallId);
            if (session) {
                let shouldTerminateCall = false;

                if (session.status === "connected") {
                    // Connected call terminates immediately if either participant's active call-owning socket disconnects
                    if (socket.id === session.callerSocketId || socket.id === session.receiverSocketId) {
                        shouldTerminateCall = true;
                    }
                } else if (session.status === "ringing") {
                    // Ringing call terminates if caller disconnects
                    if (socket.id === session.callerSocketId) {
                        shouldTerminateCall = true;
                    } else if (userId === session.receiverId) {
                        // Ringing call terminates if receiver disconnects all sockets (no tabs remaining to answer)
                        const remainingReceiverSockets = userSocketmap[userId]
                            ? (userSocketmap[userId].has(socket.id) ? userSocketmap[userId].size - 1 : userSocketmap[userId].size)
                            : 0;
                        if (remainingReceiverSockets <= 0) {
                            shouldTerminateCall = true;
                        }
                    }
                }

                if (shouldTerminateCall) {
                    cleanupCallSession(activeCallId);
                    const otherId = userId === session.callerId ? session.receiverId : session.callerId;
                    const otherSockets = getReciverSocketId(otherId);
                    if (otherSockets) {
                        io.to(otherSockets).emit("call:ended", {
                            callId: activeCallId,
                            endedBy: userId,
                            reason: "disconnected"
                        });
                    }

                    // Also notify remaining sockets of the disconnecting user (if any other tabs exist)
                    const mySockets = getReciverSocketId(userId);
                    if (mySockets) {
                        const remainingMySockets = mySockets.filter(id => id !== socket.id);
                        if (remainingMySockets.length > 0) {
                            io.to(remainingMySockets).emit("call:ended", {
                                callId: activeCallId,
                                endedBy: userId,
                                reason: "disconnected"
                            });
                        }
                    }
                }
            } else {
                userCallMap.delete(userId);
            }
        }

        // 2. Multi-tab tracking and presence updates
        if (userSocketmap[userId]) {
            userSocketmap[userId].delete(socket.id);
            if (userSocketmap[userId].size === 0) {
                delete userSocketmap[userId];
                io.emit("getOnlineUsers", Object.keys(userSocketmap));

                // Persist lastSeen in database when user's final active socket disconnects
                try {
                    const now = new Date();
                    await User.findByIdAndUpdate(userId, { lastSeen: now });
                } catch (err) {
                    console.error("Failed to update lastSeen on disconnect:", err);
                }
            }
        }
    });
});

export { app, io, server };