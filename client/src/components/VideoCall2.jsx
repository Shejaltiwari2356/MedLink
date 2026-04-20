import React, { useEffect, useRef, useState } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
// Lucide icons for UI
import { Video, Mic, Zap, PhoneOff } from "lucide-react";
import axios from "axios";

// --- Configuration Constants ---
// CRITICAL FIX: Ensure the base URL loads from .env and append the custom path
const WS_BASE_URL =
  import.meta.env.VITE_WS_SIGNALING_URL || "wss://huge-waves-scream.loca.lt";
const WS_SIGNALING_URL = `${WS_BASE_URL}/webrtc`; // <-- Appends the necessary path for the server to recognize the connection
const API_BASE_URL = "http://localhost:5000/api/consult";

const VideoCall2 = () => {
  // --- 1. Get Parameters and Context (Unchanged) ---
  const navigate = useNavigate();
  const location = useLocation();

  // A. Room ID (From Query Parameter)
  const [searchParams] = useSearchParams();
  const sessionIdFromQuery = searchParams.get("session");
  const { roomId: roomIdFromPath } = useParams();
  const roomId = roomIdFromPath || sessionIdFromQuery;

  // B. Auth Token
  const authToken = localStorage.getItem("token");

  // C. User ID (FETCHED SAFELY)
  const {
    userId: userIdFromState,
    sessionType = "instant",
    peerName = "Peer",
  } = location.state || {};

  const userId = userIdFromState || localStorage.getItem("uniqueId");

  // --- 2. Refs and State (Unchanged) ---
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const ws = useRef(null);
  const localStreamRef = useRef(null);

  const [isCallStarted, setIsCallStarted] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const callTitle = "Instant Teleconsultation";
  const statusIcon = <Zap className="mr-2 text-red-400 h-6 w-6" />;

  // --- Cleanup and Control Functions ---
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    localStreamRef.current = null;
  };

  const handleEndCall = async () => {
    if (authToken) {
      try {
        // API_BASE_URL is hardcoded to localhost:5000, which is correct
        await axios.post(
          `${API_BASE_URL}/${roomId}/end`,
          {},
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
      } catch (error) {
        console.error("Error ending consultation session:", error);
      }
    }
    if (ws.current && ws.current.readyState === WebSocket.OPEN && roomId) {
      ws.current.send(JSON.stringify({ type: "leave-room", roomId }));
    }
    cleanupCall();
    navigate("/");
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // --- Core WebRTC Logic ---
  useEffect(() => {
    // --- INITIAL VALIDATION ---
    if (!userId || !roomId || !authToken) {
      console.error(
        "CRITICAL ERROR: Missing required parameters. Cannot initiate call."
      );
      setCallStatus("Error: Missing session details. Redirecting...");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    const initializeCall = async () => {
      let localStream = null;

      // 1. Get local media stream (omitted logic)
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = localStream;
        if (localVideoRef.current)
          localVideoRef.current.srcObject = localStream;
        setCallStatus("Local media ready. Establishing connection...");
      } catch (error) {
        console.error("Error accessing local media:", error);
        setCallStatus("Error: Cannot access microphone or camera.");
        return;
      }

      // 2. Setup RTCPeerConnection (omitted logic)
      const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
      peerConnection.current = new RTCPeerConnection(configuration);

      // Handlers: ICE Candidate, Remote Track (omitted logic)
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          ws.current?.send(
            JSON.stringify({
              type: "ice-candidate",
              payload: event.candidate,
              roomId,
            })
          );
        }
      };
      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsCallStarted(true);
          setCallStatus("Connected to Peer!");
        }
      };

      // 3. Add local tracks
      localStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream);
      });

      // 4. Establish WebSocket connection and join the room
      // Uses the fixed WS_SIGNALING_URL with /webrtc path
      ws.current = new WebSocket(WS_SIGNALING_URL);

      ws.current.onopen = () => {
        ws.current.send(
          JSON.stringify({
            type: "join-room",
            roomId,
            from: userId,
            sessionType: sessionType,
          })
        );
        setCallStatus("Waiting for peer to join...");
      };

      // Add error handling for better debugging
      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setCallStatus("Connection Failed. Check Server/Tunnel Path.");
      };

      // 5. Handle incoming signaling messages (omitted logic)
      ws.current.onmessage = async (message) => {
        const data = JSON.parse(message.data);

        switch (data.type) {
          case "peer-joined":
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            ws.current.send(
              JSON.stringify({ type: "offer", payload: offer, roomId })
            );
            break;
          case "offer":
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.payload)
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            ws.current.send(
              JSON.stringify({ type: "answer", payload: answer, roomId })
            );
            break;
          case "answer":
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.payload)
            );
            break;
          case "ice-candidate":
            try {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(data.payload)
              );
            } catch (e) {
              console.error("Error adding received ice candidate:", e);
            }
            break;
          case "peer-left":
            setCallStatus("Peer disconnected.");
            setIsCallStarted(false);
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      };
    };

    initializeCall();

    return () => cleanupCall();
  }, [roomId, userId, sessionType, peerName, navigate, authToken]);

  // --- UI Rendering (Unchanged) ---
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="p-4 bg-gray-800 shadow-xl flex justify-between items-center">
        <h1 className="2xl font-bold flex items-center">
          {statusIcon} {callTitle}
        </h1>
        <div className="text-right">
          <p className="text-sm text-gray-300">
            Session ID:{" "}
            <span className="font-mono text-xs">{roomId || "N/A"}</span>
          </p>
          <p className="text-sm text-gray-300">
            Your ID:{" "}
            <span className="font-mono text-xs text-blue-400">
              {userId || "N/A"}
            </span>
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 space-y-4 md:flex-row md:space-y-0 md:space-x-4 overflow-hidden">
        {/* Local Video Stream */}
        <div className="flex-1 bg-gray-700 rounded-xl shadow-2xl overflow-hidden relative border-4 border-blue-500">
          <p className="absolute top-2 left-2 text-sm font-semibold bg-blue-500 px-3 py-1 rounded-full z-10">
            Your Camera ({userId})
          </p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className={`w-full h-full object-cover ${
              isVideoOff ? "opacity-0" : "opacity-100"
            } transition-opacity`}
          ></video>
        </div>

        {/* Remote Video Stream */}
        <div className="flex-1 bg-gray-700 rounded-xl shadow-2xl overflow-hidden relative border-4 border-gray-600">
          <p className="absolute top-2 left-2 text-sm font-semibold bg-gray-600 px-3 py-1 rounded-full z-10">
            Peer: {peerName}
          </p>
          <video
            ref={remoteVideoRef}
            autoPlay
            className="w-full h-full object-cover"
          ></video>
          {!isCallStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-20">
              <p className="text-xl font-medium text-gray-400 flex items-center">
                {callStatus}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Controls */}
      <footer className="p-4 bg-gray-800 flex justify-center space-x-6 shadow-2xl">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition ${
            isMuted ? "bg-red-500" : "bg-gray-700"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <Mic className="h-6 w-6" />
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition ${
            isVideoOff ? "bg-red-500" : "bg-gray-700"
          }`}
          title={isVideoOff ? "Video On" : "Video Off"}
        >
          <Video className="h-6 w-6" />
        </button>
        <button
          onClick={handleEndCall}
          className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition flex items-center"
        >
          <PhoneOff className="mr-2 h-5 w-5" /> END CALL
        </button>
      </footer>
    </div>
  );
};

export default VideoCall2;
