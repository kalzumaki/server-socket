const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const path = require('path');
const server = http.createServer(app);

const allowedOrigins = ["*"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Main route to serve a simple HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Socket Server Page</title>
        <style>
          body {
            background: linear-gradient(135deg, #101c10 0%, #1a2e1a 100%);
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: #181f18;
            box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            border-radius: 18px;
            padding: 44px 36px;
            text-align: center;
            max-width: 420px;
            border: 1px solid #2e7d32;
          }
          .logo {
            max-width: 120px;
            margin-bottom: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(46,125,50,0.15);
            border: 2px solid #43a047;
          }
          h1 {
            color: #43a047;
            font-size: 2.2rem;
            margin-bottom: 18px;
            letter-spacing: 1px;
          }
          p {
            color: #b9f6ca;
            font-size: 1.15rem;
            margin-bottom: 28px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(90deg, #43a047 0%, #00e676 100%);
            color: #181f18;
            padding: 13px 32px;
            border-radius: 9px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.05rem;
            box-shadow: 0 2px 8px rgba(0,230,118,0.12);
            transition: background 0.2s, color 0.2s;
            border: none;
          }
          .btn:hover {
            background: linear-gradient(90deg, #388e3c 0%, #00c853 100%);
            color: #fff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="/logo.png" alt="Logo" class="logo" />
          <h1>Socket Server</h1>
          <p>Welcome to the <strong>Socket Server of BATODA</strong>.<br>
          This page is static for visualization.</p>

        </div>
      </body>
    </html>
  `);
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);

  socket.on("joinRoom", (userId, role) => {
    // For example, the room can be named based on the user's role or user ID
    const room = role + ":" + userId;
    userSockets[socket.id] = { userId, role, room };

    // Join the appropriate room
    socket.join(room);
    console.log(`${userId} with role ${role} joined room: ${room}`);
  });
  // Listening for incoming "send-message" event
  socket.on("send-message", (data) => {
    console.log("Received message:", data);

    // Emit the message to all connected clients
    io.emit("receive-message", data);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});

// Handle dispatch updates (for Passengers, Driver, Dispatcher)
app.post("/dispatch-updated", (req, res) => {
  const dispatch = req.body.dispatch;

  if (!dispatch) {
    return res.status(400).send("Dispatch data is missing.");
  }

  console.log("Dispatch Updated:", dispatch);

  io.emit("dispatch-updated", dispatch);

  res.sendStatus(200);
});

// Handle dispatch finalized (for Passengers, Driver, Dispatcher)
app.post("/dispatch-finalized", (req, res) => {
  const dispatch = req.body.dispatch;

  if (!dispatch) {
    return res.status(400).send("Dispatch data is missing.");
  }

  console.log("Dispatch Finalized:", dispatch);

  io.emit("dispatch-finalized", dispatch);

  res.sendStatus(200);
});
// Handle incoming dispatches (Driver only)

app.post("/incoming-dispatches", (req, res) => {
  const dispatches = req.body.dispatches;
  const message = req.body.message;

  if (dispatches && Array.isArray(dispatches)) {
    console.log("Incoming Dispatches:", dispatches);
    io.emit("incoming-dispatches", { dispatches, message });
    res.send("OK");
  } else if (message) {
    console.log("Incoming Dispatch Message:", message);
    io.emit("incoming-dispatches", { dispatches: [], message });
    res.send("OK");
  } else {
    return res.status(400).send("Dispatches data is missing or invalid.");
  }
});

// Handle dispatch created (Driver only)
app.post("/dispatch-created", (req, res) => {
  const dispatch = req.body.dispatch;
  console.log("Dispatch Created:", dispatch);

  io.emit("dispatch-created", dispatch);

  res.sendStatus(200);
});
//Handle approved but not dispatched updates (dont include)
app.post("/dispatch-approved-but-not-dispatched", (req, res) => {
  console.log("Approved but not Dispatched:", req.body); // Log incoming request

  const dispatches = req.body.dispatches;
  if (!dispatches) {
    return res.status(400).send({ message: "Dispatch data is missing." });
  }

  io.emit("dispatch-approved-but-not-dispatched", dispatches);

  res.sendStatus(200);
});

// Handle reserved seats  (passengers)
app.post("/seats-reserved", (req, res) => {
  const { dispatch_id, seat_positions, passenger_count } = req.body;

  if (!dispatch_id || !seat_positions) {
    return res
      .status(400)
      .send({ message: "Seats reservation data is missing." });
  }

  console.log("Seats Reserved:", {
    dispatch_id,
    seat_positions,
    passenger_count,
  });

  io.emit("seats-reserved", {
    dispatch_id,
    seat_positions,
    passenger_count,
  });

  res.sendStatus(200);
});

// Handle tickets after reservation (passenger)
app.post("/user-unpaid-ticket-updated", (req, res) => {
  const ticket = req.body.ticket;

  if (!ticket) {
    return res.status(400).send("Ticket data is missing.");
  }

  console.log("Unpaid Ticket Updated:", ticket);

  io.emit("user-unpaid-ticket-updated", ticket);

  res.sendStatus(200);
});

//Profile update (dont include)
app.post("/profile-updated", (req, res) => {
  const { user_id, profile } = req.body;
  console.log("Profile updated received:", req.body);

  io.to(`profile-updates.${user_id}`).emit("ProfileUpdated", {
    profile,
    message: "Profile Picture Updated Successfully",
    status: true,
  });

  res.send({ success: true });
});
// Handle seat paid (passenger)
app.post("/seat-paid", (req, res) => {
  const data = req.body;

  if (!data) {
    return res.status(400).send({ message: "Seat payment data is missing." });
  }

  console.log("Seat Paid:", data);

  io.emit("seat-paid", data);

  res.sendStatus(200);
});

// Handle dispatcher paid (driver, dispatcher)
app.post("/dispatcher-paid", (req, res) => {
  const data = req.body;

  if (!data) {
    return res
      .status(400)
      .send({ message: "Dispatcher payment data is missing." });
  }

  console.log("Dispatcher Paid:", data);

  io.emit("dispatcher-paid", data);

  res.sendStatus(200);
});

// Handle Reservation Cancel
app.post("/reservation-cancelled", (req, res) => {
  const { dispatch_id, user_id, seat_positions } = req.body;
  console.log("Reservation Cancelled:", {
    dispatch_id,
    user_id,
    seat_positions,
  });

  io.emit("reservation-cancelled", {
    dispatch_id,
    user_id,
    seat_positions,
  });

  res.sendStatus(200);
});

//listen to new notif
app.post("/message", (req, res) => {
  const { event, data } = req.body;

  if (event && data) {
    io.emit(event, data); // emit to all
    console.log(`Emitting ${event}:`, data);
    res.json({ status: "ok" });
  } else {
    res.status(400).json({ error: "Invalid event or data" });
  }
});

// Start the server
// const PORT = process.env.PORT || 6001;
// server.listen(PORT, () => {
//   console.log(`Socket.IO server running on port ${PORT}`);
// });



server.listen(6001, () => {
  console.log("Socket.IO server running on port 6001");
  console.log("Web page available at http://localhost:6001/");
});
