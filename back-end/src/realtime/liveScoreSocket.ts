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
    socket.on('tournament.join', (payload: { tournamentId?: string }) => {
      if (!payload?.tournamentId) return;
      socket.join(`tournament:${payload.tournamentId}`);
    });

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
      socket.join(`tournament:${station.tournamentId}`);
      for (const battleId of station.battleIds || []) {
        socket.join(`battle:${battleId}`);
      }

      const presence = {
        stationId: station._id,
        online: true,
        lastSeenAt: station.lastSeenAt
      };
      io?.to(`tournament:${station.tournamentId}`).emit('station.presence', presence);
      for (const battleId of station.battleIds || []) {
        io?.to(`battle:${battleId}`).emit('station.presence', presence);
      }

      socket.on('disconnect', () => {
        const offlinePresence = {
          stationId: station._id,
          online: false,
          lastSeenAt: new Date()
        };
        io?.to(`tournament:${station.tournamentId}`).emit('station.presence', offlinePresence);
        for (const battleId of station.battleIds || []) {
          io?.to(`battle:${battleId}`).emit('station.presence', offlinePresence);
        }
      });
    });
  });

  return io;
};

export const emitLiveStateUpdated = (battleId: string, liveState: unknown) => {
  io?.to(`battle:${battleId}`).emit('liveState.updated', liveState);
};

export const emitTournamentLiveStateUpdated = (tournamentId: string, liveState: unknown) => {
  io?.to(`tournament:${tournamentId}`).emit('tournamentLiveState.updated', liveState);
};

export const emitBattleResultUpdated = (battleId: string, battleResult: unknown) => {
  io?.to(`battle:${battleId}`).emit('battleResult.updated', battleResult);
};

export const emitStationResultSaved = (tournamentId: string, payload: unknown) => {
  io?.to(`tournament:${tournamentId}`).emit('station.resultSaved', payload);
};

export const emitStationRevoked = (stationId: string, tournamentId: string, battleIds: string[] = []) => {
  io?.to(`station:${stationId}`).emit('station.revoked');
  io?.to(`tournament:${tournamentId}`).emit('station.revoked', { stationId });
  for (const battleId of battleIds) {
    io?.to(`battle:${battleId}`).emit('station.revoked', { stationId });
  }
};
