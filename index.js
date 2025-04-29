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
app.use(cors());
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

// Start the server
server.listen(6001, () => {
  console.log("Socket.IO server running on port 6001");
});
