import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on('joinGroup', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('leaveGroup', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on('disconnect', () => {
      // console.log('socket disconnected', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
