import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import onboardRouter from "./onboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(onboardRouter);

export default router;
