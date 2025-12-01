import { Socket } from "socket.io";
import {
    rooms,
    chats,
    IJoinRoomParams,
    IMessage,
    IRoomParams,
} from "./interface";
import crypto from "crypto";

export const roomHandler = (socket: Socket) => {

    const createRoom = () => {
        const roomId = crypto.randomUUID();
        rooms[roomId] = {};
        socket.emit("room-created", { roomId });
        console.log("user created the room");
    };

    const joinRoom = ({ roomId, peerId, userName }: IJoinRoomParams) => {
        if (!rooms[roomId]) rooms[roomId] = {};
        if (!chats[roomId]) chats[roomId] = [];

        socket.emit("get-messages", chats[roomId]);
        console.log("user joined the room", roomId, peerId, userName);

        rooms[roomId][peerId] = { peerId, userName };
        socket.join(roomId);

        socket.to(roomId).emit("user-joined", { peerId, userName });

        socket.emit("get-users", {
            roomId,
            participants: rooms[roomId],
        });

        socket.removeAllListeners("disconnect");
        socket.on("disconnect", () => {
            leaveRoom({ roomId, peerId });
        });
    };

    const leaveRoom = ({ peerId, roomId }: IRoomParams) => {
        if (rooms[roomId] && rooms[roomId][peerId]) {
            delete rooms[roomId][peerId];

            socket.to(roomId).emit("user-disconnected", peerId);
            socket.to(roomId).emit("get-users", {
                roomId,
                participants: rooms[roomId],
            });
        }

        socket.leave(roomId);
    };

    const startSharing = ({ peerId, roomId }: IRoomParams) => {
        socket.to(roomId).emit("user-started-sharing", peerId);
    };

    const stopSharing = ({ peerId, roomId }: IRoomParams) => {
        socket.to(roomId).emit("user-stopped-sharing", peerId);
    };

    const addMessage = ({ roomId, message }: { roomId: string; message: IMessage }) => {
        if (!chats[roomId]) chats[roomId] = [];
        chats[roomId].push(message);
        socket.to(roomId).emit("add-message", message);
    };

    const changeName = ({ peerId, userName, roomId }: IRoomParams & { userName: string }) => {
        if (rooms[roomId] && rooms[roomId][peerId]) {
            rooms[roomId][peerId].userName = userName;
            socket.to(roomId).emit("name-changed", { peerId, userName });
        }
    };

    
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("start-sharing", startSharing);
    socket.on("stop-sharing", stopSharing);
    socket.on("send-message", addMessage);
    socket.on("change-name", changeName);
};
