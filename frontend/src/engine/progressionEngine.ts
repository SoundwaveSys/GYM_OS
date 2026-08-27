/* -------------------------------------------------
   GYM OS — PROGRESSION ENGINE
   History-aware automatic progression
-------------------------------------------------- */

import type { WorkoutHistory } from "./fitnessEngine";
import { getLatestExerciseRecord } from "./workoutHistory";

export type ProgressionIntensity =
  | "DELOAD"
  | "LIGHT"
  | "NORMAL"
  | "HARD";

export type ProgressionDecision = {
  weight: number;
  reps: number;
  sets: number;
  intensity: ProgressionIntensity;
  reason: string;
};

export type ExerciseProgressionInput = {
  exerciseName: string;
  baseWeight: number;
  baseReps: number;
  baseSets: number;
  previousWeight?: number;
  previousReps?: number;
  performance?: number;
  recoveryScore?: number;
  trainingHistory?: WorkoutHistory[];
};

const roundWeight = (weight: number) =>
  Math.round(weight * 2) / 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getRecoveryModifier = (score: number) => {
  if (score < 50)
    return { multiplier: 0.85, intensity: "DELOAD" as const };
  if (score < 70)
    return { multiplier: 0.92, intensity: "LIGHT" as const };
  if (score < 85)
    return { multiplier: 1, intensity: "NORMAL" as const };
  return { multiplier: 1.05, intensity: "HARD" as const };
};

export const calculateProgression = (
  input: ExerciseProgressionInput,
): ProgressionDecision => {
  const stored = getLatestExerciseRecord(
    input.exerciseName,
  );

  const previousWeight =
    input.previousWeight ??
    stored?.actualWeight ??
    input.baseWeight;

  const previousReps =
    input.previousReps ??
    stored?.actualReps ??
    input.baseReps;

  const performance =
    input.performance ??
    stored?.performanceScore ??
    75;

  const recoveryScore =
    input.recoveryScore ?? 80;

  const recovery =
    getRecoveryModifier(recoveryScore);

  let weight = previousWeight;
  let reps = previousReps;
  let sets = input.baseSets;
  let reason =
    "Maintain the current training load.";

  if (recovery.intensity === "DELOAD") {
    weight = previousWeight * 0.85;
    reps = Math.max(6, previousReps - 2);
    sets = Math.max(2, input.baseSets - 1);
    reason =
      "Recovery is low. Reduce load and volume for recovery.";
  } else if (recovery.intensity === "LIGHT") {
    weight = previousWeight * 0.92;
    reps = Math.max(6, previousReps - 1);
    reason =
      "Recovery is below optimal. Use a lighter load.";
  } else if (performance >= 85) {
    weight = previousWeight + 2.5;
    reps = clamp(previousReps, 6, 12);
    reason =
      "Strong previous performance. Increase the training load by 2.5 kg.";
  } else if (performance >= 75) {
    weight = previousWeight;
    reps = clamp(previousReps + 1, 6, 15);
    reason =
      "Performance is stable. Keep the weight and build reps.";
  } else {
    weight = previousWeight * 0.95;
    reps = Math.max(6, previousReps - 1);
    reason =
      "Performance was below target. Reduce the load slightly.";
  }

  weight = roundWeight(Math.max(0, weight));
  reps = clamp(Math.round(reps), 6, 15);
  sets = clamp(Math.round(sets), 2, 5);

  return {
    weight,
    reps,
    sets,
    intensity: recovery.intensity,
    reason,
  };
};

export const formatWeight = (weight: number): string =>
  Number.isInteger(weight)
    ? `${weight} kg`
    : `${weight.toFixed(1)} kg`;