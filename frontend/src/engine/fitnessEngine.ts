export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "ARMS"
  | "LEGS"
  | "CORE";

export type WorkoutHistory = {
  muscle: MuscleGroup;
  daysSinceLastWorkout: number;
  performance: number;
  fatigue: number;
};

export type FitnessProfile = {
  strength: number;
  stamina: number;
  consistency: number;
  energy: number;
};

export type MissionDecision = {
  muscle: MuscleGroup;
  priority: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  title: string;
};

export function analyzeFitness(
  profile: FitnessProfile,
  history: WorkoutHistory[],
): MissionDecision {
  if (history.length === 0) {
    return {
      muscle: "CHEST",
      priority: "MEDIUM",
      reason: "Not enough training history yet.",
      title: "BUILD THE FOUNDATION",
    };
  }

  /*
   * Find the muscle that has gone the longest
   * without being trained.
   */
  const sortedHistory = [...history].sort(
    (a, b) =>
      b.daysSinceLastWorkout -
      a.daysSinceLastWorkout,
  );

  const neglected = sortedHistory[0];

  if (!neglected) {
    return {
      muscle: "CHEST",
      priority: "LOW",
      reason: "Training load is balanced.",
      title: "MAINTAIN THE ARMOR",
    };
  }

  if (profile.energy < 40) {
    return {
      muscle: neglected.muscle,
      priority: "LOW",
      reason:
        "Energy is low. Training intensity should remain controlled.",
      title: "RECOVERY MODE",
    };
  }

  if (neglected.daysSinceLastWorkout >= 6) {
    return {
      muscle: neglected.muscle,
      priority: "HIGH",
      reason:
        "This muscle group has not been trained recently.",
      title: "REINFORCE THE WEAK POINT",
    };
  }

  return {
    muscle: neglected.muscle,
    priority: "MEDIUM",
    reason:
      "This muscle group is ready for another training stimulus.",
    title: "BUILD THE ARMOR",
  };
}