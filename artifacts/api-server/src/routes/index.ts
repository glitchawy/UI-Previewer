import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import onboardRouter from "./onboard";
import storageRouter from "./storage";
import menuRouter from "./menu";
import branchesRouter from "./branches";
import restaurantRouter from "./restaurant";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(onboardRouter);
router.use(storageRouter);
router.use(menuRouter);
router.use(branchesRouter);
router.use(restaurantRouter);
router.use(staffRouter);

export default router;
