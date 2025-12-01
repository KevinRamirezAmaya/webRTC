import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { roomHandler } from "./room/room";

import { PeerServer } from "peer";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
    res.send("Server is running");
});

const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: process.env.FRONT_URL,
        methods: ["GET", "POST"],
    },
});


io.on("connection", (socket) => {
    console.log("a user connected");
    roomHandler(socket); 
    socket.on("disconnect", () => console.log("user disconnected"));
});

PeerServer({
    port: 0,
    path: "/peerjs"
}, () => {
    console.log("PeerJS server is running...");
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
