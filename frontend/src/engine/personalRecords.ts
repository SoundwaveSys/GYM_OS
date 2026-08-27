/* -------------------------------------------------
   GYM OS — PERSONAL RECORDS
-------------------------------------------------- */

import {
  getWorkoutHistory,
  type WorkoutHistoryRecord,
} from "./workoutHistory";

export type PersonalRecord = {
  exerciseName: string;
  muscle: string;
  heaviestWeight: number;
  highestReps: number;
  bestScore: number;
  bestWeightDate: string;
  bestRepsDate: string;
  bestScoreDate: string;
};

export type NewPR = {
  type:
    | "WEIGHT"
    | "REPS"
    | "PERFORMANCE";
  exerciseName: string;
  previous: number;
  current: number;
  improvement: number;
};

/* -------------------------------------------------
   GET PERSONAL RECORDS
-------------------------------------------------- */

export function getPersonalRecords(
  history: WorkoutHistoryRecord[] =
    getWorkoutHistory(),
): PersonalRecord[] {
  const records =
    new Map<
      string,
      PersonalRecord
    >();

  for (const item of history) {
    const existing =
      records.get(
        item.exerciseName,
      );

    if (!existing) {
      records.set(
        item.exerciseName,
        {
          exerciseName:
            item.exerciseName,
          muscle: item.muscle,
          heaviestWeight:
            item.actualWeight,
          highestReps:
            item.actualReps,
          bestScore:
            item.performanceScore,
          bestWeightDate:
            item.date,
          bestRepsDate:
            item.date,
          bestScoreDate:
            item.date,
        },
      );
      continue;
    }

    if (
      item.actualWeight >
      existing.heaviestWeight
    ) {
      existing.heaviestWeight =
        item.actualWeight;
      existing.bestWeightDate =
        item.date;
    }

    if (
      item.actualReps >
      existing.highestReps
    ) {
      existing.highestReps =
        item.actualReps;
      existing.bestRepsDate =
        item.date;
    }

    if (
      item.performanceScore >
      existing.bestScore
    ) {
      existing.bestScore =
        item.performanceScore;
      existing.bestScoreDate =
        item.date;
    }
  }

  return Array.from(
    records.values(),
  );
}

/* -------------------------------------------------
   CHECK FOR NEW PR
-------------------------------------------------- */

export function detectNewPR(
  record: WorkoutHistoryRecord,
  history: WorkoutHistoryRecord[] =
    getWorkoutHistory(),
): NewPR[] {
  const previous =
    history.filter(
      (item) =>
        item.exerciseName ===
          record.exerciseName &&
        item.id !== record.id &&
        new Date(item.date).getTime() <
          new Date(record.date).getTime(),
    );

  if (previous.length === 0) {
    return [
      {
        type: "WEIGHT",
        exerciseName:
          record.exerciseName,
        previous: 0,
        current:
          record.actualWeight,
        improvement: 100,
      },
    ];
  }

  const bestWeight =
    Math.max(
      ...previous.map(
        (item) =>
          item.actualWeight,
      ),
    );

  const bestReps =
    Math.max(
      ...previous.map(
        (item) =>
          item.actualReps,
      ),
    );

  const bestScore =
    Math.max(
      ...previous.map(
        (item) =>
          item.performanceScore,
      ),
    );

  const prs: NewPR[] = [];

  if (
    record.actualWeight >
    bestWeight
  ) {
    prs.push({
      type: "WEIGHT",
      exerciseName:
        record.exerciseName,
      previous: bestWeight,
      current:
        record.actualWeight,
      improvement:
        calculateImprovement(
          bestWeight,
          record.actualWeight,
        ),
    });
  }

  if (
    record.actualReps >
    bestReps
  ) {
    prs.push({
      type: "REPS",
      exerciseName:
        record.exerciseName,
      previous: bestReps,
      current:
        record.actualReps,
      improvement:
        calculateImprovement(
          bestReps,
          record.actualReps,
        ),
    });
  }

  if (
    record.performanceScore >
    bestScore
  ) {
    prs.push({
      type: "PERFORMANCE",
      exerciseName:
        record.exerciseName,
      previous: bestScore,
      current:
        record.performanceScore,
      improvement:
        calculateImprovement(
          bestScore,
          record.performanceScore,
        ),
    });
  }

  return prs;
}

function calculateImprovement(
  previous: number,
  current: number,
): number {
  if (previous <= 0) {
    return 100;
  }

  return Math.round(
    ((current - previous) /
      previous) *
      100,
  );
}