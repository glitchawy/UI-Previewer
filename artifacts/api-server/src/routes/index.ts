import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import onboardRouter from "./onboard";
import storageRouter from "./storage";
import menuRouter from "./menu";
import branchesRouter from "./branches";
import restaurantRouter from "./restaurant";
import staffRouter from "./staff";
import customerRouter from "./customer";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(onboardRouter);
router.use(storageRouter);
router.use(menuRouter);
router.use(branchesRouter);
router.use(restaurantRouter);
router.use(staffRouter);
router.use(customerRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(paymentsRouter);

export default router;
