import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

const VideoCall = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const { userId } = location.state || {};

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const ws = useRef(null);

  const [isCallStarted, setIsCallStarted] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");

  useEffect(() => {
    if (!userId) {
      console.error("User ID not found in location state.");
      setCallStatus("Error: Missing User ID");
      return;
    }

    const initializeCall = async () => {
      let localStream = null;

      try {
        // 1. Access local media
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play();
        setCallStatus("Local media ready. Connecting...");
      } catch (error) {
        console.error("Error getting media stream:", error);
        setCallStatus("Error accessing camera/microphone");
        return;
      }

      // 2. Setup peer connection
      const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
      peerConnection.current = new RTCPeerConnection(configuration);

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          ws.current.send(
            JSON.stringify({
              type: "ice-candidate",
              roomId,
              payload: event.candidate,
            })
          );
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play();
          setIsCallStarted(true);
          setCallStatus("Connected to Peer!");
        }
      };

      localStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream);
      });

      // 3. WebSocket connection
      ws.current = new WebSocket("wss://huge-waves-scream.loca.lt");
      ws.current.onopen = () => {
        console.log("WebSocket connected. Joining room...");
        ws.current.send(
          JSON.stringify({ type: "join-room", roomId, from: userId })
        );
        setCallStatus("Waiting for peer to join...");
      };

      ws.current.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        switch (data.type) {
          case "peer-joined":
            console.log(`Peer joined: ${data.from}`);
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            ws.current.send(
              JSON.stringify({ type: "offer", roomId, payload: offer })
            );
            break;
          case "offer":
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.payload)
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            ws.current.send(
              JSON.stringify({ type: "answer", roomId, payload: answer })
            );
            break;
          case "answer":
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.payload)
            );
            break;
          case "ice-candidate":
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.payload)
            );
            break;
          default:
            console.warn(`Unknown message type: ${data.type}`);
        }
      };
    };

    initializeCall();

    return () => {
      if (ws.current) ws.current.close();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [roomId, userId]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* HEADER */}
      <header className="p-4 bg-gray-800 shadow-xl flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center space-x-2">
          <span>💬</span> <span>Consultation</span>
        </h1>
        <div className="text-right text-sm text-gray-300">
          <p>
            Session ID:{" "}
            <span className="font-mono text-blue-400">{roomId}</span>
          </p>
          <p>
            Your ID: <span className="font-mono text-blue-400">{userId}</span>
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col p-4 space-y-4 md:flex-row md:space-y-0 md:space-x-4 overflow-hidden">
        {/* Local Video */}
        <div className="flex-1 bg-gray-700 rounded-xl shadow-2xl overflow-hidden relative border-4 border-blue-500">
          <p className="absolute top-2 left-2 text-sm font-semibold bg-blue-500 px-3 py-1 rounded-full z-10">
            Your Camera ({userId})
          </p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          ></video>
        </div>

        {/* Remote Video */}
        <div className="flex-1 bg-gray-700 rounded-xl shadow-2xl overflow-hidden relative border-4 border-gray-600">
          <p className="absolute top-2 left-2 text-sm font-semibold bg-gray-600 px-3 py-1 rounded-full z-10">
            Peer
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

      {/* FOOTER */}
      <footer className="p-4 bg-gray-800 text-center text-gray-400 text-sm">
        {!isCallStarted && <p>Waiting for the other person to join...</p>}
      </footer>
    </div>
  );
};

export default VideoCall;
