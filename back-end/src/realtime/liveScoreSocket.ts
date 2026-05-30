import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { judgeStationRepository } from '../repositories/judgeStationRepository';

let io: Server | null = null;

export const initLiveScoreSocket = (server: HttpServer, corsOrigin: string[]) => {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    socket.on('battle.join', (payload: { battleId?: string }) => {
      if (!payload?.battleId) return;
      socket.join(`battle:${payload.battleId}`);
    });

    socket.on('station.join', async (payload: { token?: string }) => {
      const token = payload?.token || '';
      const station = await judgeStationRepository.touchStation(token);
      if (!station) {
        socket.emit('station.revoked');
        return;
      }

      socket.join(`station:${station._id}`);
      socket.join(`battle:${station.battleId}`);
      io?.to(`battle:${station.battleId}`).emit('station.presence', {
        stationId: station._id,
        online: true,
        lastSeenAt: station.lastSeenAt
      });

      socket.on('disconnect', () => {
        io?.to(`battle:${station.battleId}`).emit('station.presence', {
          stationId: station._id,
          online: false,
          lastSeenAt: new Date()
        });
      });
    });
  });

  return io;
};

export const emitLiveStateUpdated = (battleId: string, liveState: unknown) => {
  io?.to(`battle:${battleId}`).emit('liveState.updated', liveState);
};

export const emitBattleResultUpdated = (battleId: string, battleResult: unknown) => {
  io?.to(`battle:${battleId}`).emit('battleResult.updated', battleResult);
};

export const emitStationRevoked = (stationId: string, battleId: string) => {
  io?.to(`station:${stationId}`).emit('station.revoked');
  io?.to(`battle:${battleId}`).emit('station.revoked', { stationId });
};
