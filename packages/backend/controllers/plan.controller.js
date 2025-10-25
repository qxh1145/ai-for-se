import { Op } from "sequelize";
import WorkoutPlan from "../models/workout.plan.model.js";
import PlanExerciseDetail from "../models/plan.exercise.detail.model.js";
import Exercise from "../models/exercise.model.js";
import { sequelize } from "../config/database.js";

function normalizeDifficulty(v) {
  const s = String(v || "").toLowerCase().trim();
  if (["beginner", "intermediate", "advanced"].includes(s)) return s;
  return null;
}

export async function createPlan(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthenticated" });

    const name = String(req.body?.name || "").trim();
    const description = req.body?.description != null ? String(req.body.description) : null;
    const difficulty_level = normalizeDifficulty(req.body?.difficulty_level);
    const is_public = req.body?.is_public === true || req.body?.is_public === false ? !!req.body.is_public : false;

    if (!name) return res.status(422).json({ success: false, message: "name is required" });

    const plan = await WorkoutPlan.create({
      name,
      description,
      creator_id: userId,
      difficulty_level,
      is_public,
    });

    return res.status(200).json({ success: true, data: {
      plan_id: plan.plan_id,
      name: plan.name,
      description: plan.description,
      difficulty_level: plan.difficulty_level,
      is_public: plan.is_public,
    }});
  } catch (err) {
    console.error("createPlan error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getPlanById(req, res) {
  try {
    const userId = req.userId;
    const planId = parseInt(req.params?.planId, 10);
    if (!Number.isFinite(planId) || planId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid planId" });
    }

    const plan = await WorkoutPlan.findOne({ where: { plan_id: planId } });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    // Only owner can view for now (extend later for public share)
    if (plan.creator_id !== userId) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const items = await PlanExerciseDetail.findAll({
      where: { plan_id: planId },
      order: [["session_order", "ASC"], ["plan_exercise_id", "ASC"]],
      include: [{
        model: Exercise,
        as: "exercise",
        attributes: [
          ["exercise_id", "id"],
          "name",
          "difficulty_level",
          "equipment_needed",
          "thumbnail_url",
          "gif_demo_url",
        ],
      }],
    });

    // Prefer primary image from image_exercise if available
    const exIds = items.map(it => it.exercise_id).filter((v, i, a) => a.indexOf(v) === i);
    let imgMap = new Map();
    if (exIds.length) {
      const [rows] = await sequelize.query(
        `SELECT exercise_id, image_url
         FROM (
           SELECT exercise_id, image_url,
                  ROW_NUMBER() OVER (PARTITION BY exercise_id ORDER BY is_primary DESC, display_order ASC, image_id ASC) AS rn
           FROM image_exercise
           WHERE exercise_id = ANY($1)
         ) s WHERE rn = 1`,
        { bind: [exIds] }
      );
      imgMap = new Map(rows.map(r => [r.exercise_id, r.image_url]));
    }

    const payloadItems = items.map(it => ({
      plan_exercise_id: it.plan_exercise_id,
      plan_id: it.plan_id,
      exercise_id: it.exercise_id,
      session_order: it.session_order,
      sets_recommended: it.sets_recommended,
      reps_recommended: it.reps_recommended,
      rest_period_seconds: it.rest_period_seconds,
      exercise: it.exercise ? {
        id: it.exercise.get("id"),
        name: it.exercise.name,
        difficulty: it.exercise.difficulty_level,
        equipment: it.exercise.equipment_needed,
        imageUrl: imgMap.get(it.exercise_id) || it.exercise.thumbnail_url || it.exercise.gif_demo_url || null,
      } : null,
    }));

    return res.status(200).json({ success: true, data: {
      plan: {
        plan_id: plan.plan_id,
        name: plan.name,
        description: plan.description,
        difficulty_level: plan.difficulty_level,
        is_public: plan.is_public,
      },
      items: payloadItems,
    }});
  } catch (err) {
    console.error("getPlanById error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function addExerciseToPlan(req, res) {
  try {
    const userId = req.userId;
    const planId = parseInt(req.params?.planId, 10);
    if (!Number.isFinite(planId) || planId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid planId" });
    }

    const plan = await WorkoutPlan.findOne({ where: { plan_id: planId } });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    if (plan.creator_id !== userId) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const exercise_id = parseInt(req.body?.exercise_id, 10);
    if (!Number.isFinite(exercise_id) || exercise_id <= 0) {
      return res.status(422).json({ success: false, message: "exercise_id is required" });
    }
    const exercise = await Exercise.findByPk(exercise_id);
    if (!exercise) {
      return res.status(422).json({ success: false, message: "exercise_id not found" });
    }

    let session_order = req.body?.session_order;
    if (!Number.isFinite(session_order)) {
      const maxRow = await PlanExerciseDetail.findOne({
        where: { plan_id: planId },
        order: [["session_order", "DESC"]],
        attributes: ["session_order"],
      });
      const maxVal = maxRow?.session_order || 0;
      session_order = maxVal + 1;
    }

    const sets_recommended = Number.isFinite(parseInt(req.body?.sets_recommended, 10)) ? parseInt(req.body?.sets_recommended, 10) : null;
    const reps_recommended = req.body?.reps_recommended != null ? String(req.body.reps_recommended) : null;
    const rest_period_seconds = Number.isFinite(parseInt(req.body?.rest_period_seconds, 10)) ? parseInt(req.body?.rest_period_seconds, 10) : null;

    const item = await PlanExerciseDetail.create({
      plan_id: planId,
      exercise_id,
      session_order,
      sets_recommended,
      reps_recommended,
      rest_period_seconds,
    });

    return res.status(200).json({ success: true, data: {
      plan_exercise_id: item.plan_exercise_id,
      plan_id: item.plan_id,
      exercise_id: item.exercise_id,
      session_order: item.session_order,
      sets_recommended: item.sets_recommended,
      reps_recommended: item.reps_recommended,
      rest_period_seconds: item.rest_period_seconds,
    }});
  } catch (err) {
    console.error("addExerciseToPlan error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function listMyPlans(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthenticated" });
    // only mine when mine=1
    const mine = String(req.query?.mine || "").trim();
    if (mine === "1" || mine.toLowerCase() === "true") {
      const rows = await WorkoutPlan.findAll({
        where: { creator_id: userId },
        order: [["plan_id", "DESC"]],
      });
      const items = rows.map((p) => ({
        plan_id: p.plan_id,
        name: p.name,
        description: p.description,
        difficulty_level: p.difficulty_level,
        is_public: p.is_public,
      }));
      return res.status(200).json({ success: true, data: { items, total: items.length } });
    }
    // In future: add admin/other views. For now, restrict.
    return res.status(403).json({ success: false, message: "Forbidden" });
  } catch (err) {
    console.error("listMyPlans error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
