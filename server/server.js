// Filename: server.js
const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const WebSocket = require('ws'); 
const cors = require('cors');
// Loads environment variables from a .env file into process.env
require('dotenv').config(); 

// --- REQUIRED IMPORTS (PLACEHOLDERS: Ensure these files exist and export functions) ---
// NOTE: Assuming your connectDB function uses process.env.MONGO_URI
const connectDB = require('./db'); 
// const InstantSession = require('./models/InstantSession'); 
const authRoutes = require('./routes/authRoutes');
const vitalsRoutes = require('./routes/vitalsRoutes');
const reportsRoutes = require('./routes/bloodReportRoutes');
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const profileRoutes = require('./routes/profileRoutes');
const doctorAccessRoutes = require('./routes/doctorAccessRoute');
const appointmentRoutes = require('./routes/appointmentRoutes');
const instantConsultRoutes = require('./routes/instantConsultationRoute'); 
const paymentRoutes = require('./routes/paymentRoute');

// --- CORS Setup using .env ---
const UI_ORIGIN = process.env.VITE_UI_ORIGIN || "http://localhost:5173"; 
const TUNNEL_ORIGIN = process.env.VITE_TUNNEL_ORIGIN || "https://huge-waves-scream.loca.lt"; 
// CRITICAL: Include the client's local origin and the current tunnel origin (HTTPS for API calls)
const ALLOWED_ORIGINS = [UI_ORIGIN, TUNNEL_ORIGIN]; 


// --- Express App Setup ---
const app = express();
// The connectDB function must read process.env.MONGO_URI
connectDB(); 

// Middleware
app.use(cors({
    origin: ALLOWED_ORIGINS, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // Important for cookies/auth headers if used
}));
app.use(express.json());

// --- Define All Route Paths (Mounting the Routers) ---
app.use('/api/auth', authRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/doctor-access', doctorAccessRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consult', instantConsultRoutes); 
app.use("/api/payments", paymentRoutes);

// --- MODEL INTEGRATION START ---
const axios = require('axios');

// In your server.js (Express) file

const PYTHON_API_URL = 'http://localhost:8000/predict'; // Python API URL

app.post('/api/diagnose', async (req, res) => {
    // 1. Get the raw text from the frontend
    const raw_text = req.body.raw_text; 

    if (!raw_text) {
        return res.status(400).json({ error: "Missing symptom text for diagnosis." });
    }

    try {
        // 2. Forward the RAW TEXT directly to the Python API
        const pythonResponse = await axios.post(PYTHON_API_URL, {
            // Python will now handle converting this text into the N-feature array
            raw_text_input: raw_text 
        });

        const prediction = pythonResponse.data.prediction;
        
        res.json({ success: true, prediction: prediction });

    } catch (error) {
        console.error('Error communicating with Python model:', error.message);
        res.status(503).json({ error: 'Diagnosis service is currently unavailable or text processing failed.' });
    }
});

// --- 1. HTTP Server Setup ---
const server = http.createServer(app);

// --- 2. Socket.IO Server for Doctor Alerts (Unchanged) ---
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS, 
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.set('socketio', io); 

// Socket.IO Connection Logic
io.on('connection', (socket) => {
    socket.on('join_alert_room', (uniqueId) => {
        socket.join(uniqueId); 
        console.log(`Socket.IO: User ${uniqueId} joined alert room.`);
    });
    socket.on('disconnect', () => {
        console.log(`Socket.IO: Client disconnected.`);
    });
});


// ----------------------------------------------------------------------------------
// --- 3. WebRTC Signaling Logic (FIXED UPGRADE PATH) ---
// ----------------------------------------------------------------------------------

const wss = new WebSocket.Server({ noServer: true });
const rooms = {}; // Global object to manage rooms: { roomId: [ws1, ws2] }

// CRITICAL FIX: Filter WebSocket upgrade requests to the specific /webrtc path
server.on('upgrade', (request, socket, head) => {
    
    // 1. Ignore Socket.IO requests
    if (request.url.startsWith('/socket.io/')) {
        return; 
    }
    
    // 2. Only handle requests explicitly targeting the /webrtc path
    if (request.url.startsWith('/webrtc')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        // If it's not Socket.IO and not /webrtc, reject the request to prevent errors/conflicts
        socket.destroy();
    }
});

// WebRTC Signaling Logic (Unchanged)
wss.on("connection", (ws, req) => {
    
    ws.roomId = null; 
    ws.userId = null; 

    console.log("WebRTC Signaling Server: New raw connection established.");

    ws.on("message", async (message) => {
        const data = JSON.parse(message.toString());
        const { type, roomId, from, payload } = data;

        // --- 1. JOIN ROOM ---
        if (type === "join-room" && roomId && from) {
            if (!rooms[roomId]) {
                rooms[roomId] = [];
            }
            
            ws.roomId = roomId;
            ws.userId = from;
            rooms[roomId].push(ws);
            
            console.log(`WebRTC: User ${from} joined room ${roomId}. Total peers: ${rooms[roomId].length}`);

            if (rooms[roomId].length > 1) {
                const otherPeer = rooms[roomId].find(socket => socket !== ws);
                if (otherPeer) {
                    otherPeer.send(JSON.stringify({ type: "peer-joined" }));
                }
            }
            return;
        }

        // --- 2. FORWARD SIGNALING MESSAGES ---
        if (ws.roomId && type && payload) {
            rooms[ws.roomId]?.forEach(peer => {
                if (peer !== ws && peer.readyState === WebSocket.OPEN) {
                    peer.send(JSON.stringify({ type, roomId: ws.roomId, payload }));
                }
            });
            return;
        }
        
        // --- 3. LEAVE ROOM ---
        if (type === "leave-room" && ws.roomId) {
            rooms[ws.roomId] = rooms[ws.roomId].filter(socket => socket !== ws);
            rooms[ws.roomId]?.forEach(peer => {
                 if (peer.readyState === WebSocket.OPEN) {
                     peer.send(JSON.stringify({ type: "peer-left" }));
                 }
            });
            if (rooms[ws.roomId].length === 0) {
                delete rooms[ws.roomId];
            }
            console.log(`WebRTC: User ${ws.userId} left room ${ws.roomId}.`);
        }
    });

    ws.on("close", () => {
        if (ws.roomId) {
            rooms[ws.roomId] = rooms[ws.roomId].filter(socket => socket !== ws);
            
            rooms[ws.roomId]?.forEach(peer => {
                if (peer.readyState === WebSocket.OPEN) {
                    peer.send(JSON.stringify({ type: "peer-left" }));
                }
            });
            
            if (rooms[ws.roomId].length === 0) {
                delete rooms[ws.roomId];
            }
            console.log(`WebRTC: User ${ws.userId} disconnected from room ${ws.roomId}.`);
        }
    });
});


// ----------------------------------------------------------------------------------
// --- 4. Start the Server ---
// ----------------------------------------------------------------------------------

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

