import express from "express";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import Stripe from 'stripe';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    path: '/socket.io',
    cors: { 
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json());

  // Stripe
  let stripeClient: Stripe | null = null;

  function getStripe(): Stripe {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }
      stripeClient = new Stripe(key, {
        apiVersion: '2026-02-25.clover',
      });
    }
    return stripeClient;
  }

  app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId } = req.body;
    
    const products: Record<string, { name: string, amount: number }> = {
      'points_1000': { name: '1000 Shop Points', amount: 250 },
      'points_7500': { name: '7500 Shop Points', amount: 1000 },
    };

    const product = products[priceId];
    if (!product) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    try {
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: product.name,
            },
            unit_amount: product.amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/shop?success=true`,
        cancel_url: `${process.env.APP_URL}/shop?canceled=true`,
      });
      res.json({ id: session.id });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // In-memory data
  const rooms: Record<string, {
    id: string;
    host: string;
    players: any[];
    status: 'waiting' | 'playing';
    mapId: string;
    isCustom: boolean;
    hudSettings?: any;
  }> = {};

  const leaderboards = {
    world: [] as any[],
  };

  // Device & User Registry for Tracking Activity & Inviting each other
  const devices: Record<string, {
    userId: string;
    socketId: string;
    nickname: string;
    status: string; // e.g. 'Idle', 'In Lobby ABCDEF', 'Fighting R15 (Bunker)', 'Offline'
    level: number;
    lastActive: number;
    highScores: any[];
  }> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register a device to track active users
    socket.on("register_device", (data) => {
      console.log("Registering device:", data.userId, socket.id);
      if (data.userId) {
        devices[data.userId] = {
          userId: data.userId,
          socketId: socket.id,
          nickname: data.nickname || 'Survivor',
          status: data.status || 'Idle',
          level: data.level || 1,
          lastActive: Date.now(),
          highScores: data.highScores || []
        };
        // Broadcast active users to everyone online
        io.emit("devices_updated", Object.values(devices).filter(d => Date.now() - d.lastActive < 300000));
      }
    });

    // Request active devices list
    socket.on("get_active_devices", () => {
      socket.emit("devices_updated", Object.values(devices).filter(d => Date.now() - d.lastActive < 300000));
    });

    // Send invite to friend's device
    socket.on("invite_friend", (data) => {
      // data: { friendUserId, roomId, senderName }
      const targetUser = devices[data.friendUserId];
      if (targetUser && targetUser.socketId) {
        console.log(`Sending app lobby invite from ${data.senderName} to ${targetUser.userId} (socket ${targetUser.socketId})`);
        io.to(targetUser.socketId).emit("incoming_invite", {
          roomId: data.roomId,
          senderName: data.senderName || 'A Friend'
        });
      } else {
        // If simulated or not connected, send error to sender
        socket.emit("error", "Player of this User ID is offline or inactive.");
      }
    });

    socket.on("create_room", (data) => {
      console.log("Creating room:", data);
      const roomId = data.roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
      
      if (!rooms[roomId]) {
        rooms[roomId] = {
          id: roomId,
          host: socket.id,
          players: [],
          status: 'waiting',
          mapId: data.mapId || 'town',
          isCustom: !!data.isCustom,
          hudSettings: data.hudSettings
        };
      } else {
        rooms[roomId].host = socket.id;
        rooms[roomId].mapId = data.mapId || 'town';
        rooms[roomId].status = 'waiting';
        rooms[roomId].isCustom = !!data.isCustom;
        if (data.hudSettings) rooms[roomId].hudSettings = data.hudSettings;
      }
      
      if (!rooms[roomId].players.find((p: any) => p.id === socket.id)) {
        rooms[roomId].players.push({ id: socket.id, name: data.name || 'Survivor', isHost: true, team: 1 });
      }

      socket.join(roomId);
      console.log("Room created/re-hosted:", roomId);
      socket.emit("room_created", rooms[roomId]);
      io.to(roomId).emit("room_updated", rooms[roomId]);
    });

    socket.on("join_room", (data) => {
      console.log("Joining room:", data);
      const room = rooms[data.roomId];
      if (!room) {
        console.log("Room not found:", data.roomId);
        socket.emit("error", "Room not found");
        return;
      }
      if (room.players.length >= 4) {
        console.log("Room full:", data.roomId);
        socket.emit("error", "Room is full");
        return;
      }
      if (room.status !== 'waiting') {
        console.log("Game already started in room:", data.roomId);
        socket.emit("error", "Game already started");
        return;
      }
      
      room.players.push({ id: socket.id, name: data.name || 'Survivor', isHost: false, team: 1 });
      socket.join(data.roomId);
      console.log("User joined room:", socket.id, data.roomId);
      socket.emit("room_joined", room);
      io.to(data.roomId).emit("room_updated", room);
    });

    socket.on("toggle_team", (roomId) => {
      const room = rooms[roomId];
      if (room) {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.team = player.team === 2 ? 1 : 2;
          console.log(`Player ${player.name} toggled team to Team ${player.team}`);
          io.to(roomId).emit("room_updated", room);
        }
      }
    });

    socket.on("start_game", (roomId) => {
      const room = rooms[roomId];
      if (room && room.host === socket.id) {
        room.status = 'playing';
        io.to(roomId).emit("game_started", room);
      }
    });

    socket.on("player_update", (data) => {
      // data: { roomId, playerState }
      socket.to(data.roomId).emit("player_updated", { id: socket.id, ...data.playerState });
    });

    socket.on("zombie_update", (data) => {
      // Host sends zombie updates to clients
      socket.to(data.roomId).emit("zombie_updated", data.zombies);
    });

    socket.on("game_event", (data) => {
      // e.g. door opened, powerup spawned
      socket.to(data.roomId).emit("game_event", data);
    });

    socket.on("chat_message", (data) => {
      // data: { roomId, message }
      socket.to(data.roomId).emit("chat_message", data.message);
    });

    socket.on("admin_teleport", (data) => {
      // data: { targetId, position }
      // Send force_teleport to the specific target
      io.to(data.targetId).emit("force_teleport", data.position);
    });

    socket.on("sync_hud", (data) => {
      // data: { roomId, settings }
      const room = rooms[data.roomId];
      if (room && room.host === socket.id) {
        room.hudSettings = data.settings;
        socket.to(data.roomId).emit("hud_settings_updated", data.settings);
      }
    });

    socket.on("leave_room", (roomId) => {
      const room = rooms[roomId];
      if (room) {
        room.players = room.players.filter((p: any) => p.id !== socket.id);
        socket.leave(roomId);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          if (room.host === socket.id) {
            room.host = room.players[0].id;
            room.players[0].isHost = true;
          }
          io.to(roomId).emit("room_updated", room);
        }
      }
    });

    socket.on("submit_score", (data) => {
      // Avoid duplicate entries from same user on same round
      const existingIdx = leaderboards.world.findIndex(e => e.userId === data.userId && e.mapId === data.mapId && e.round === data.round);
      if (existingIdx !== -1) {
        leaderboards.world[existingIdx] = {
          ...leaderboards.world[existingIdx],
          ...data,
          date: new Date().toISOString()
        };
      } else {
        leaderboards.world.push({
          ...data,
          date: new Date().toISOString(),
        });
      }
      
      // Sort properly by round (descending) first, then kills (descending)
      leaderboards.world.sort((a, b) => {
        if ((b.round || 0) !== (a.round || 0)) {
          return (b.round || 0) - (a.round || 0);
        }
        return (b.kills || 0) - (a.kills || 0);
      });

      if (leaderboards.world.length > 100) {
        leaderboards.world = leaderboards.world.slice(0, 100);
      }
      io.emit("leaderboard_updated", leaderboards.world);
    });

    socket.on("get_leaderboard", () => {
      socket.emit("leaderboard_updated", leaderboards.world);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      
      // Mark device as Offline
      for (const userId in devices) {
        if (devices[userId].socketId === socket.id) {
          devices[userId].status = 'Offline';
          break;
        }
      }
      io.emit("devices_updated", Object.values(devices).filter(d => Date.now() - d.lastActive < 300000));

      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            if (room.host === socket.id) {
              room.host = room.players[0].id;
              room.players[0].isHost = true;
            }
            io.to(roomId).emit("room_updated", room);
          }
        }
      }
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
