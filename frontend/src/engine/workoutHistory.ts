/* -------------------------------------------------
   GYM OS — WORKOUT HISTORY
   Persistent browser storage for completed
   exercise performance.
-------------------------------------------------- */

export type WorkoutHistoryRecord = {
  id: string;
  exerciseId: number;
  exerciseName: string;
  muscle: string;

  date: string;

  targetWeight: number;
  actualWeight: number;

  targetReps: number;
  actualReps: number;

  targetSets: number;
  completedSets: number;

  performanceScore: number;

  status:
    | "FAILED"
    | "PARTIAL"
    | "TARGET"
    | "EXCELLENT";

  recommendation:
    | "DECREASE"
    | "MAINTAIN"
    | "INCREASE";
};

const STORAGE_KEY =
  "gym-os-workout-history";

const isBrowser = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.localStorage !==
    "undefined";

/* -------------------------------------------------
   READ HISTORY
-------------------------------------------------- */

export const getWorkoutHistory = (): WorkoutHistoryRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as WorkoutHistoryRecord[];
  } catch {
    return [];
  }
};

/* -------------------------------------------------
   SAVE HISTORY
-------------------------------------------------- */

const saveWorkoutHistory = (
  history: WorkoutHistoryRecord[],
): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history),
    );
  } catch {
    // Storage can fail in private/restricted
    // browser environments. The app should
    // continue working in memory.
  }
};

/* -------------------------------------------------
   ADD RECORD
-------------------------------------------------- */

export const addWorkoutHistory = (
  record: Omit<
    WorkoutHistoryRecord,
    "id" | "date"
  > & {
    id?: string;
    date?: string;
  },
): WorkoutHistoryRecord => {
  const history =
    getWorkoutHistory();

  const newRecord: WorkoutHistoryRecord = {
    ...record,

    id:
      record.id ??
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`,

    date:
      record.date ??
      new Date().toISOString(),
  };

  saveWorkoutHistory([
    newRecord,
    ...history,
  ]);

  return newRecord;
};

/* -------------------------------------------------
   GET EXERCISE HISTORY
-------------------------------------------------- */

export const getExerciseHistory = (
  exerciseName: string,
): WorkoutHistoryRecord[] => {
  return getWorkoutHistory().filter(
    (record) =>
      record.exerciseName ===
      exerciseName,
  );
};

/* -------------------------------------------------
   GET LATEST EXERCISE RECORD
-------------------------------------------------- */

export const getLatestExerciseRecord = (
  exerciseName: string,
): WorkoutHistoryRecord | null => {
  return (
    getExerciseHistory(
      exerciseName,
    )[0] ?? null
  );
};

/* -------------------------------------------------
   GET MUSCLE HISTORY
-------------------------------------------------- */

export const getMuscleHistory = (
  muscle: string,
): WorkoutHistoryRecord[] => {
  return getWorkoutHistory().filter(
    (record) =>
      record.muscle === muscle,
  );
};

/* -------------------------------------------------
   CLEAR HISTORY
-------------------------------------------------- */

export const clearWorkoutHistory =
  (): void => {
    if (!isBrowser()) {
      return;
    }

    try {
      window.localStorage.removeItem(
        STORAGE_KEY,
      );
    } catch {
      // Ignore storage errors.
    }
  };