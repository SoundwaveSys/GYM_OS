import type {
  ScheduledMuscle,
} from "./scheduleEngine";

import type {
  Exercise,
} from "../store/gymStore";

import {
  calculateProgression,
} from "./progressionEngine";

type WorkoutTemplate = {
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weight: string;
  xpPerSet: number;
};

const WORKOUT_LIBRARY: Record<
  ScheduledMuscle,
  WorkoutTemplate[]
> = {
  Biceps: [
    {
      name: "Barbell Curl",
      muscle: "ARMS",
      sets: 4,
      reps: 10,
      weight: "12.5 kg",
      xpPerSet: 12,
    },
    {
      name: "Incline Dumbbell Curl",
      muscle: "ARMS",
      sets: 3,
      reps: 10,
      weight: "10 kg",
      xpPerSet: 12,
    },
    {
      name: "Hammer Curl",
      muscle: "ARMS",
      sets: 3,
      reps: 12,
      weight: "10 kg",
      xpPerSet: 10,
    },
    {
      name: "Cable Curl",
      muscle: "ARMS",
      sets: 3,
      reps: 12,
      weight: "15 kg",
      xpPerSet: 10,
    },
  ],

  Chest: [
    {
      name: "Barbell Bench Press",
      muscle: "CHEST",
      sets: 4,
      reps: 8,
      weight: "40 kg",
      xpPerSet: 15,
    },
    {
      name: "Incline Dumbbell Press",
      muscle: "CHEST",
      sets: 3,
      reps: 10,
      weight: "15 kg",
      xpPerSet: 12,
    },
    {
      name: "Cable Fly",
      muscle: "CHEST",
      sets: 3,
      reps: 12,
      weight: "12.5 kg",
      xpPerSet: 10,
    },
  ],

  Back: [
    {
      name: "Lat Pulldown",
      muscle: "BACK",
      sets: 4,
      reps: 10,
      weight: "40 kg",
      xpPerSet: 12,
    },
    {
      name: "Seated Cable Row",
      muscle: "BACK",
      sets: 3,
      reps: 10,
      weight: "35 kg",
      xpPerSet: 12,
    },
    {
      name: "Single Arm Dumbbell Row",
      muscle: "BACK",
      sets: 3,
      reps: 10,
      weight: "15 kg",
      xpPerSet: 12,
    },
  ],

  Triceps: [
    {
      name: "Cable Triceps Pushdown",
      muscle: "ARMS",
      sets: 4,
      reps: 10,
      weight: "20 kg",
      xpPerSet: 12,
    },
    {
      name: "Overhead Dumbbell Extension",
      muscle: "ARMS",
      sets: 3,
      reps: 10,
      weight: "12.5 kg",
      xpPerSet: 12,
    },
    {
      name: "Rope Pushdown",
      muscle: "ARMS",
      sets: 3,
      reps: 12,
      weight: "15 kg",
      xpPerSet: 10,
    },
  ],

  Shoulder: [
    {
      name: "Shoulder Press",
      muscle: "SHOULDERS",
      sets: 4,
      reps: 8,
      weight: "20 kg",
      xpPerSet: 15,
    },
    {
      name: "Dumbbell Lateral Raise",
      muscle: "SHOULDERS",
      sets: 3,
      reps: 12,
      weight: "7.5 kg",
      xpPerSet: 10,
    },
    {
      name: "Rear Delt Fly",
      muscle: "SHOULDERS",
      sets: 3,
      reps: 12,
      weight: "7.5 kg",
      xpPerSet: 10,
    },
  ],

  Thighs: [
    {
      name: "Barbell Squat",
      muscle: "LEGS",
      sets: 4,
      reps: 8,
      weight: "40 kg",
      xpPerSet: 15,
    },
    {
      name: "Leg Press",
      muscle: "LEGS",
      sets: 3,
      reps: 10,
      weight: "80 kg",
      xpPerSet: 12,
    },
    {
      name: "Leg Extension",
      muscle: "LEGS",
      sets: 3,
      reps: 12,
      weight: "30 kg",
      xpPerSet: 10,
    },
    {
      name: "Leg Curl",
      muscle: "LEGS",
      sets: 3,
      reps: 12,
      weight: "25 kg",
      xpPerSet: 10,
    },
  ],
};

const parseWeight = (
  value: string,
): number => {
  const weight =
    Number.parseFloat(
      value.replace(
        /[^0-9.]/g,
        "",
      ),
    );

  return Number.isFinite(weight)
    ? weight
    : 0;
};

/* -------------------------------------------------
   GENERATE WORKOUT
-------------------------------------------------- */

export function generateWorkout(
  muscle: ScheduledMuscle,
): Exercise[] {
  const templates =
    WORKOUT_LIBRARY[muscle];

  return templates.map(
    (template, index) => {
      const baseWeight =
        parseWeight(
          template.weight,
        );

      const progression =
        calculateProgression({
          exerciseName:
            template.name,

          baseWeight,

          baseReps:
            template.reps,

          baseSets:
            template.sets,
        });

      return {
        id:
          Date.now() + index,

        name:
          template.name,

        muscle:
          template.muscle,

        sets:
          progression.sets,

        reps:
          progression.reps,

        weight:
          `${progression.weight} kg`,

        xpPerSet:
          template.xpPerSet,
      };
    },
  );
}

/* -------------------------------------------------
   GET BASE TEMPLATE
-------------------------------------------------- */

export function getWorkoutTemplate(
  muscle: ScheduledMuscle,
): WorkoutTemplate[] {
  return WORKOUT_LIBRARY[muscle];
}