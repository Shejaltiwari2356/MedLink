import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "./components/RegisterForm";
import Login from "./components/LoginForm";
import Dashboard from "./components/Dashboard"; // Patient Dashboard
import Dashboard2 from "./components/Dashboard2"; // Doctor Dashboard
import VideoCall from "./components/VideoCall";
import VideoCall2 from "./components/VideoCall2";
import Help from "./components/Help";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standard Authentication Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Patient and Doctor Dashboards */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/doctorSite" element={<Dashboard2 />} />

        {/* Route for direct video call links using a room ID parameter */}
        <Route path="/call/:roomId" element={<VideoCall />} />

        {/* 🚨 FIX: New route to handle the client-side URL that was failing. 
            This maps the client's navigation path (with query params ignored by Route match) 
            to the VideoCall component. */}
        <Route path="/consult/live" element={<VideoCall2 />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
