import type { Exercise } from "../store/gymStore";
import type { MissionDecision } from "./fitnessEngine";
import type { RecoveryResult } from "./recoveryEngine";

export type GeneratedMission = {
  id: string;
  title: string;
  subtitle: string;
  targetMuscle: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  intensity: "HIGH" | "MEDIUM" | "LOW";
  estimatedMinutes: number;
  xpReward: number;
  exercises: Exercise[];
  recoveryMessage: string;
};

const exerciseLibrary: Record<
  string,
  Exercise[]
> = {
  LEGS: [
    {
      id: 101,
      name: "Back Squat",
      muscle: "LEGS",
      sets: 4,
      reps: 8,
      weight: "40 KG",
      xpPerSet: 40,
    },
    {
      id: 102,
      name: "Romanian Deadlift",
      muscle: "HAMSTRINGS",
      sets: 3,
      reps: 10,
      weight: "30 KG",
      xpPerSet: 35,
    },
    {
      id: 103,
      name: "Leg Press",
      muscle: "QUADS",
      sets: 3,
      reps: 12,
      weight: "60 KG",
      xpPerSet: 30,
    },
    {
      id: 104,
      name: "Standing Calf Raise",
      muscle: "CALVES",
      sets: 3,
      reps: 15,
      weight: "30 KG",
      xpPerSet: 25,
    },
  ],

  CHEST: [
    {
      id: 201,
      name: "Bench Press",
      muscle: "CHEST",
      sets: 4,
      reps: 8,
      weight: "20 KG",
      xpPerSet: 35,
    },
    {
      id: 202,
      name: "Incline DB Press",
      muscle: "UPPER CHEST",
      sets: 3,
      reps: 10,
      weight: "12 KG",
      xpPerSet: 30,
    },
    {
      id: 203,
      name: "Cable Fly",
      muscle: "CHEST",
      sets: 3,
      reps: 12,
      weight: "15 KG",
      xpPerSet: 30,
    },
  ],

  BACK: [
    {
      id: 301,
      name: "Lat Pulldown",
      muscle: "BACK",
      sets: 4,
      reps: 10,
      weight: "35 KG",
      xpPerSet: 35,
    },
    {
      id: 302,
      name: "Seated Cable Row",
      muscle: "BACK",
      sets: 3,
      reps: 10,
      weight: "30 KG",
      xpPerSet: 30,
    },
    {
      id: 303,
      name: "Face Pull",
      muscle: "REAR DELTS",
      sets: 3,
      reps: 15,
      weight: "15 KG",
      xpPerSet: 25,
    },
  ],

  SHOULDERS: [
    {
      id: 401,
      name: "Overhead Press",
      muscle: "SHOULDERS",
      sets: 4,
      reps: 8,
      weight: "15 KG",
      xpPerSet: 35,
    },
    {
      id: 402,
      name: "Lateral Raise",
      muscle: "SIDE DELTS",
      sets: 3,
      reps: 12,
      weight: "7 KG",
      xpPerSet: 30,
    },
    {
      id: 403,
      name: "Rear Delt Fly",
      muscle: "REAR DELTS",
      sets: 3,
      reps: 15,
      weight: "6 KG",
      xpPerSet: 25,
    },
  ],

  ARMS: [
    {
      id: 501,
      name: "Barbell Curl",
      muscle: "BICEPS",
      sets: 3,
      reps: 10,
      weight: "15 KG",
      xpPerSet: 30,
    },
    {
      id: 502,
      name: "Tricep Pushdown",
      muscle: "TRICEPS",
      sets: 3,
      reps: 12,
      weight: "20 KG",
      xpPerSet: 30,
    },
    {
      id: 503,
      name: "Hammer Curl",
      muscle: "BICEPS",
      sets: 3,
      reps: 12,
      weight: "10 KG",
      xpPerSet: 25,
    },
  ],

  CORE: [
    {
      id: 601,
      name: "Cable Crunch",
      muscle: "CORE",
      sets: 3,
      reps: 15,
      weight: "20 KG",
      xpPerSet: 25,
    },
    {
      id: 602,
      name: "Hanging Knee Raise",
      muscle: "CORE",
      sets: 3,
      reps: 12,
      weight: "BODYWEIGHT",
      xpPerSet: 25,
    },
    {
      id: 603,
      name: "Plank",
      muscle: "CORE",
      sets: 3,
      reps: 45,
      weight: "BODYWEIGHT",
      xpPerSet: 20,
    },
  ],
};

const missionTitles: Record<
  string,
  string
> = {
  LEGS: "REBUILD THE FOUNDATION",
  CHEST: "BUILD THE ARMOR",
  BACK: "FORTIFY THE FRAME",
  SHOULDERS: "FORGE THE SHOULDERS",
  ARMS: "ARM THE SYSTEM",
  CORE: "STABILIZE THE CORE",
};

const missionSubtitles: Record<
  string,
  string
> = {
  LEGS: "Lower body strength protocol",
  CHEST: "Chest development protocol",
  BACK: "Back strength protocol",
  SHOULDERS: "Shoulder development protocol",
  ARMS: "Arm development protocol",
  CORE: "Core stability protocol",
};

function cloneExercises(
  exercises: Exercise[],
): Exercise[] {
  return exercises.map(
    (exercise) => ({
      ...exercise,
    }),
  );
}

/*
 * Adapt workout volume according to
 * recovery state.
 */
function adaptExercisesToRecovery(
  exercises: Exercise[],
  recovery: RecoveryResult,
): Exercise[] {
  const cloned =
    cloneExercises(exercises);

  /*
   * EXCELLENT / GOOD
   * Full training volume.
   */
  if (
    recovery.intensity === "HIGH"
  ) {
    return cloned;
  }

  /*
   * MODERATE
   * Keep exercises but reduce
   * the number of sets by one
   * where possible.
   */
  if (
    recovery.intensity === "MEDIUM"
  ) {
    return cloned.map(
      (exercise) => ({
        ...exercise,

        sets: Math.max(
          2,
          exercise.sets - 1,
        ),

        xpPerSet: Math.max(
          20,
          exercise.xpPerSet - 5,
        ),
      }),
    );
  }

  /*
   * LOW / CRITICAL
   * Reduce volume significantly.
   */
  return cloned.map(
    (exercise) => ({
      ...exercise,

      sets: Math.min(
        2,
        exercise.sets,
      ),

      reps: Math.max(
        6,
        Math.round(
          exercise.reps * 0.8,
        ),
      ),

      xpPerSet: Math.max(
        15,
        exercise.xpPerSet - 10,
      ),
    }),
  );
}

function getRecoveryMessage(
  recovery: RecoveryResult,
): string {
  switch (recovery.intensity) {
    case "HIGH":
      return "Recovery is excellent. Full training intensity is available.";

    case "MEDIUM":
      return "Recovery is moderate. Training volume has been reduced.";

    case "LOW":
      return "Recovery is low. Training volume and intensity have been reduced.";

    default:
      return recovery.recommendation;
  }
}

export function generateMission(
  decision: MissionDecision,
  missionNumber: number,
  recovery?: RecoveryResult,
): GeneratedMission {
  const target =
    decision.muscle;

  const baseExercises =
    exerciseLibrary[target] ??
    exerciseLibrary.CHEST;

  /*
   * If recovery data is not supplied,
   * preserve the normal workout.
   */
  const effectiveRecovery =
    recovery ?? {
      score: 100,
      state: "EXCELLENT",
      intensity: "HIGH",
      warning:
        "Recovery data unavailable.",
      recommendation:
        "Normal training protocol.",
    };

  const exercises =
    adaptExercisesToRecovery(
      baseExercises,
      effectiveRecovery,
    );

  const xpReward =
    exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets *
          exercise.xpPerSet,
      0,
    );

  const totalSets =
    exercises.reduce(
      (total, exercise) =>
        total + exercise.sets,
      0,
    );

  const estimatedMinutes =
    Math.max(
      20,
      totalSets * 4,
    );

  return {
    id: String(
      missionNumber,
    ).padStart(3, "0"),

    title:
      missionTitles[target] ??
      "BUILD THE FOUNDATION",

    subtitle:
      missionSubtitles[target] ??
      "Adaptive training protocol",

    targetMuscle: target,

    priority:
      decision.priority,

    intensity:
      effectiveRecovery.intensity,

    estimatedMinutes,

    xpReward,

    exercises,

    recoveryMessage:
      getRecoveryMessage(
        effectiveRecovery,
      ),
  };
}