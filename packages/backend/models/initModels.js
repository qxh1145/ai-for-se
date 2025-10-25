// models/initModels.js
import User from "./user.model.js";
import PasswordReset from "./passwordReset.model.js";
import OnboardingStep from "./onboarding.step.model.js";
import OnboardingField from "./onboarding.field.model.js";
import OnboardingSession from "./onboarding.session.model.js";
import OnboardingAnswer from "./onboarding.answer.model.js";
import Exercise from "./exercise.model.js";
import WorkoutPlan from "./workout.plan.model.js";
import PlanExerciseDetail from "./plan.exercise.detail.model.js";
import UserWorkoutLog from "./user.workout.log.model.js";
import UserWorkoutLogDetail from "./user.workout.log.detail.model.js";
import ExerciseImage from "./exercise.image.model.js";

export function initModels() {
  // Khai báo quan hệ 1-n: User hasMany PasswordReset
  User.hasMany(PasswordReset, {
    foreignKey: "user_id",
    sourceKey: "user_id",
    onDelete: "CASCADE",
  });

  // PasswordReset belongsTo User
  PasswordReset.belongsTo(User, {
    foreignKey: "user_id",
    targetKey: "user_id",
    onDelete: "CASCADE",
  });

  // Onboarding relations
  // Steps ↔ Fields
  OnboardingStep.hasMany(OnboardingField, { foreignKey: 'step_id', sourceKey: 'step_id', as: 'fields' });
  OnboardingField.belongsTo(OnboardingStep, { foreignKey: 'step_id', targetKey: 'step_id', as: 'step' });

  // User ↔ Sessions
  User.hasMany(OnboardingSession, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'onboardingSessions' });
  OnboardingSession.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'user' });

  // Sessions ↔ Answers
  OnboardingSession.hasMany(OnboardingAnswer, { foreignKey: 'session_id', sourceKey: 'session_id', as: 'answers' });
  OnboardingAnswer.belongsTo(OnboardingSession, { foreignKey: 'session_id', targetKey: 'session_id', as: 'session' });

  // Steps ↔ Answers
  OnboardingStep.hasMany(OnboardingAnswer, { foreignKey: 'step_id', sourceKey: 'step_id', as: 'answers' });
  OnboardingAnswer.belongsTo(OnboardingStep, { foreignKey: 'step_id', targetKey: 'step_id', as: 'step' });

  // Users ↔ WorkoutPlans
  User.hasMany(WorkoutPlan, { foreignKey: 'creator_id', sourceKey: 'user_id', as: 'plans' });
  WorkoutPlan.belongsTo(User, { foreignKey: 'creator_id', targetKey: 'user_id', as: 'creator' });

  // WorkoutPlans ↔ PlanExerciseDetails
  WorkoutPlan.hasMany(PlanExerciseDetail, { foreignKey: 'plan_id', sourceKey: 'plan_id', as: 'items' });
  PlanExerciseDetail.belongsTo(WorkoutPlan, { foreignKey: 'plan_id', targetKey: 'plan_id', as: 'plan' });

  // ExercisesDemo ↔ PlanExerciseDetails
  Exercise.hasMany(PlanExerciseDetail, { foreignKey: 'exercise_id', sourceKey: 'exercise_id', as: 'planItems' });
  PlanExerciseDetail.belongsTo(Exercise, { foreignKey: 'exercise_id', targetKey: 'exercise_id', as: 'exercise' });

  // Exercises ↔ ExerciseImages
  Exercise.hasMany(ExerciseImage, { foreignKey: 'exercise_id', sourceKey: 'exercise_id', as: 'images' });
  ExerciseImage.belongsTo(Exercise, { foreignKey: 'exercise_id', targetKey: 'exercise_id', as: 'exercise' });

  // Users ↔ UserWorkoutLogs
  User.hasMany(UserWorkoutLog, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'workoutLogs' });
  UserWorkoutLog.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id', as: 'user' });

  // WorkoutPlans ↔ UserWorkoutLogs
  WorkoutPlan.hasMany(UserWorkoutLog, { foreignKey: 'plan_id', sourceKey: 'plan_id', as: 'logs' });
  UserWorkoutLog.belongsTo(WorkoutPlan, { foreignKey: 'plan_id', targetKey: 'plan_id', as: 'plan' });

  // UserWorkoutLogs ↔ UserWorkoutLogDetails
  UserWorkoutLog.hasMany(UserWorkoutLogDetail, { foreignKey: 'log_id', sourceKey: 'log_id', as: 'sets' });
  UserWorkoutLogDetail.belongsTo(UserWorkoutLog, { foreignKey: 'log_id', targetKey: 'log_id', as: 'log' });

  // ExercisesDemo ↔ UserWorkoutLogDetails
  Exercise.hasMany(UserWorkoutLogDetail, { foreignKey: 'exercise_id', sourceKey: 'exercise_id', as: 'performedSets' });
  UserWorkoutLogDetail.belongsTo(Exercise, { foreignKey: 'exercise_id', targetKey: 'exercise_id', as: 'exercise' });
  
  // Trả ra để dùng nếu bạn muốn
  return {
    User,
    PasswordReset,
    OnboardingStep,
    OnboardingField,
    OnboardingSession,
    OnboardingAnswer,
    Exercise,
    ExerciseImage,
    WorkoutPlan,
    PlanExerciseDetail,
    UserWorkoutLog,
    UserWorkoutLogDetail,
  };
}
