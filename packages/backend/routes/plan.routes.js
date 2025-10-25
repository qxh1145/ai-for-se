import { Router } from "express";
import authGuard from "../middleware/auth.guard.js";
import { createPlan, getPlanById, addExerciseToPlan, listMyPlans } from "../controllers/plan.controller.js";

const router = Router();

// List my plans with ?mine=1
router.get("/", authGuard, listMyPlans);

router.post("/", authGuard, createPlan);

router.get("/:planId", authGuard, getPlanById);

router.post("/:planId/exercises", authGuard, addExerciseToPlan);

export default router;
