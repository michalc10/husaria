import express, { Express } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { config } from "./config/config";
import { connectPrisma } from "./database/prisma";
import Logging from "./library/Logging";
import playerRouter from './routes/PlayerRoutes'
import tournamentRouter from './routes/TournamentRoutes'
import leagueRouter from './routes/LeagueRoutes'
import playerPointsRouter from "./routes/PlayerPointsRoutes";
import bannerRouter from './routes/BannerRoutes';
import competitionTemplateRouter from './routes/CompetitionTemplateRoutes';
import judgeStationRouter from './routes/JudgeStationRoutes';
import battleLiveRouter from './routes/BattleLiveRoutes';
import authRouter from './routes/AuthRoutes';
import userRouter from './routes/UserRoutes';
import { requireAuth } from "./middleware/auth";
import { initLiveScoreSocket } from "./realtime/liveScoreSocket";

const app: Express = express();

const StartServer = () => {
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.server.corsOrigin, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev", { stream: { write: (message) => Logging.info(message.trim()) } }));

  app.use('/auth', authRouter);
  app.use('/judge-station', judgeStationRouter);
  app.use('/user', userRouter);

  app.get("/ping", (req, res) =>
    res.status(200).json({ message: "pong" })
  );

  app.use('/player', requireAuth, playerRouter);
  app.use('/banner', requireAuth, bannerRouter);
  app.use('/league', requireAuth, leagueRouter);
  app.use('/tournament', requireAuth, tournamentRouter);
  app.use('/competition-template', requireAuth, competitionTemplateRouter);
  app.use('/battle', requireAuth, battleLiveRouter);
  app.use('/playerPoints', requireAuth, playerPointsRouter);

  app.use((req, res) => {
    const error = new Error('Nie znaleziono');
    Logging.error(error);

    return res.status(404).json({ message: error.message });
  })

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    Logging.error(error);
    return res.status(500).json({ message: 'WewnÄ™trzny bĹ‚Ä…d serwera' });
  });

  const server = http.createServer(app);
  initLiveScoreSocket(server, config.server.socketCorsOrigin);
  server.listen(config.server.port, () => Logging.info(`Serwer działa na porcie ${config.server.port}`));
};

const connectDatabase = async () => {
  const database = await connectPrisma();
  Logging.info(`Connected to PostgreSQL database: ${database}`);
};

connectDatabase()
  .then(() => StartServer())
  .catch((err) => {
    Logging.error('Nie udało się połączyć z PostgreSQL');
    Logging.error(err);
  });
