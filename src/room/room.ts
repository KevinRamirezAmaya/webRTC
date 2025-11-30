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
            console.log("user left the room", peerId);
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


    const startSharing = (data?: IRoomParams) => {
        if (!data) return console.error("startSharing: data missing");

        const { peerId, roomId } = data;
        if (!peerId || !roomId)
            return console.error("startSharing: missing peerId or roomId");

        socket.to(roomId).emit("user-started-sharing", peerId);
    };

    const stopSharing = (data?: IRoomParams) => {
        if (!data) return console.error("stopSharing: data missing");

        const { peerId, roomId } = data;

        if (!peerId || !roomId)
            return console.error("stopSharing: missing peerId or roomId");

        socket.to(roomId).emit("user-stopped-sharing", peerId);
    };

    const addMessage = ({
        roomId,
        message,
    }: {
        roomId: string;
        message: IMessage;
    }) => {
        if (!chats[roomId]) chats[roomId] = [];
        chats[roomId].push(message);

        socket.to(roomId).emit("add-message", message);
    };

   
    const changeName = ({
        peerId,
        userName,
        roomId,
    }: {
        peerId: string;
        userName: string;
        roomId: string;
    }) => {
        if (rooms[roomId] && rooms[roomId][peerId]) {
            rooms[roomId][peerId].userName = userName;
            socket.to(roomId).emit("name-changed", { peerId, userName });
        }
    };


    const handleOffer = ({
        roomId,
        offer,
        from,
    }: {
        roomId: string;
        offer: any;
        from: string;
    }) => {
        socket.to(roomId).emit("offer", { offer, from });
    };


    const handleAnswer = ({
        roomId,
        answer,
        from,
    }: {
        roomId: string;
        answer: any;
        from: string;
    }) => {
        socket.to(roomId).emit("answer", { answer, from });
    };

    const handleIceCandidate = ({
        roomId,
        candidate,
        from,
    }: {
        roomId: string;
        candidate: any;
        from: string;
    }) => {
        socket.to(roomId).emit("ice-candidate", { candidate, from });
    };

    /** ----------------------
     *   EVENTOS SOCKET
     * ---------------------- */
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("start-sharing", startSharing);
    socket.on("stop-sharing", stopSharing);
    socket.on("send-message", addMessage);
    socket.on("change-name", changeName);

  
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
};
