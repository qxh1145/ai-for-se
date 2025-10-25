import { Router } from "express";
import { getAllExercises, getExercisesByMuscleGroup, getExerciseStepsById, getExerciseStepsBySlug, getExercisesByType, getRelatedExercisesById, getExerciseMusclesById } from "../controllers/exercise.controller.js";

const router = Router();

router.get("/", getAllExercises);

router.get("/muscle/:muscleGroup", getExercisesByMuscleGroup);

router.get("/type/:type", getExercisesByType);

router.get("/id/:exerciseId/steps", getExerciseStepsById);

router.get("/slug/:slug/steps", getExerciseStepsBySlug);

// Related exercises
router.get("/id/:exerciseId/related", getRelatedExercisesById);

// Muscles breakdown
router.get("/id/:exerciseId/muscles", getExerciseMusclesById);



export default router;
