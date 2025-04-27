const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const allowedOrigins = ["*"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// Handle socket connections
io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);

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

// Handle dispatch updates
app.post("/dispatch-updated", (req, res) => {
  const dispatch = req.body.dispatch;

  if (!dispatch) {
    return res.status(400).send("Dispatch data is missing.");
  }

  console.log("Dispatch Updated:", dispatch);

  io.emit("dispatch-updated", dispatch);

  res.sendStatus(200);
});

// Handle dispatch finalized
app.post("/dispatch-finalized", (req, res) => {
  const dispatch = req.body.dispatch;

  if (!dispatch) {
    return res.status(400).send("Dispatch data is missing.");
  }

  console.log("Dispatch Finalized:", dispatch);

  io.emit("dispatch-finalized", dispatch);

  res.sendStatus(200);
});

// Handle dispatch created
app.post("/dispatch-created", (req, res) => {
  const dispatch = req.body.dispatch;
  console.log("Dispatch Created:", dispatch);

  io.emit("dispatch-created", dispatch);

  res.sendStatus(200);
});

// Handle approved but not dispatched updates
app.post("/dispatch-approved-but-not-dispatched", (req, res) => {
  console.log("Approved but not Dispatched:", req.body); // Log incoming request

  const dispatches = req.body.dispatches;
  if (!dispatches) {
    return res.status(400).send({ message: "Dispatch data is missing." });
  }

  io.emit("dispatch-approved-but-not-dispatched", dispatches);

  res.sendStatus(200);
});

// Handle reserved seats
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

// Handle tickets after reservation
app.post("/user-unpaid-ticket-updated", (req, res) => {
  const ticket = req.body.ticket;

  if (!ticket) {
    return res.status(400).send("Ticket data is missing.");
  }

  console.log("Unpaid Ticket Updated:", ticket);

  io.emit("user-unpaid-ticket-updated", ticket);

  res.sendStatus(200);
});

//Profile update
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

// Start the server
server.listen(6001, () => {
  console.log("Socket.IO server running on port 6001");
});
