import { io, Socket } from 'socket.io-client';

// In development, Vite runs on port 5173 and the backend on 3000.
// We use window.location.hostname to ensure that if a mobile phone connects via 192.168.x.x,
// it tries to connect to the socket server at that same IP, rather than 'localhost' (which would mean the phone itself).
const URL = import.meta.env.PROD 
  ? undefined 
  : `http://${window.location.hostname}:3000`;

export const socket: Socket = io(URL as string, {
  autoConnect: true,
});
