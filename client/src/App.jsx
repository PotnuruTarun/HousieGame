import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import JoinRoom from './pages/JoinRoom';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000');

function App() {
  const [roomData, setRoomData]     = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost]         = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('room_created', (data) => {
      setRoomData(data);
      setIsHost(true);
      navigate(`/room/${data.roomId}`);
    });

    socket.on('room_joined', (data) => {
      setRoomData(data);
      setIsHost(data.isHost ?? false);
      navigate(`/room/${data.roomId}`);
    });

    socket.on('error', (msg) => alert(msg));

    socket.on('room_closed', () => {
      setRoomData(null);
      setIsHost(false);
      navigate('/');
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('error');
      socket.off('room_closed');
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Home — create or join */}
      <Route path="/" element={
        <Home socket={socket} setPlayerName={setPlayerName} />
      } />

      {/* /room/:roomId — visited directly via share link */}
      <Route path="/room/:roomId" element={
        roomData ? (
          <Game
            socket={socket}
            roomData={roomData}
            playerName={playerName}
            isHost={isHost}
            setIsHost={setIsHost}
          />
        ) : (
          /* Player landed here via share link — show name prompt */
          <JoinRoom socket={socket} setPlayerName={setPlayerName} />
        )
      } />
    </Routes>
  );
}

export default App;
