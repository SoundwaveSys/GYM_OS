/* -------------------------------------------------
   GYM OS — PERFORMANCE ENGINE
-------------------------------------------------- */

export type PerformanceInput = {
  targetWeight: number;
  targetReps: number;

  actualWeight: number;
  actualReps: number;

  targetSets?: number;
  completedSets?: number;
};

export type PerformanceResult = {
  score: number;

  percentage: number;

  status:
    | "FAILED"
    | "PARTIAL"
    | "TARGET"
    | "EXCELLENT";

  weightAccuracy: number;
  repAccuracy: number;
  setCompletion: number;

  recommendation:
    | "DECREASE"
    | "MAINTAIN"
    | "INCREASE";

  reason: string;
};

/* -------------------------------------------------
   HELPERS
-------------------------------------------------- */

const clamp = (
  value: number,
  min: number,
  max: number,
): number => {
  return Math.min(
    Math.max(value, min),
    max,
  );
};

/* -------------------------------------------------
   CALCULATE WEIGHT ACCURACY
-------------------------------------------------- */

const calculateWeightAccuracy = (
  targetWeight: number,
  actualWeight: number,
): number => {
  if (targetWeight <= 0) {
    return 100;
  }

  return clamp(
    (actualWeight /
      targetWeight) *
      100,
    0,
    100,
  );
};

/* -------------------------------------------------
   CALCULATE REP ACCURACY
-------------------------------------------------- */

const calculateRepAccuracy = (
  targetReps: number,
  actualReps: number,
): number => {
  if (targetReps <= 0) {
    return 100;
  }

  return clamp(
    (actualReps /
      targetReps) *
      100,
    0,
    100,
  );
};

/* -------------------------------------------------
   CALCULATE SET COMPLETION
-------------------------------------------------- */

const calculateSetCompletion = (
  targetSets: number,
  completedSets: number,
): number => {
  if (targetSets <= 0) {
    return 100;
  }

  return clamp(
    (completedSets /
      targetSets) *
      100,
    0,
    100,
  );
};

/* -------------------------------------------------
   CALCULATE PERFORMANCE
-------------------------------------------------- */

export const calculatePerformance = (
  input: PerformanceInput,
): PerformanceResult => {
  const {
    targetWeight,
    targetReps,
    actualWeight,
    actualReps,

    targetSets = 1,
    completedSets = 1,
  } = input;

  const weightAccuracy =
    calculateWeightAccuracy(
      targetWeight,
      actualWeight,
    );

  const repAccuracy =
    calculateRepAccuracy(
      targetReps,
      actualReps,
    );

  const setCompletion =
    calculateSetCompletion(
      targetSets,
      completedSets,
    );

  /*
   * Performance weighting:
   *
   * Weight = 40%
   * Reps   = 40%
   * Sets   = 20%
   */

  const rawScore =
    weightAccuracy * 0.4 +
    repAccuracy * 0.4 +
    setCompletion * 0.2;

  const score = Math.round(
    clamp(
      rawScore,
      0,
      100,
    ),
  );

  let status:
    | "FAILED"
    | "PARTIAL"
    | "TARGET"
    | "EXCELLENT";

  if (score < 60) {
    status = "FAILED";
  } else if (score < 80) {
    status = "PARTIAL";
  } else if (score < 95) {
    status = "TARGET";
  } else {
    status = "EXCELLENT";
  }

  let recommendation:
    | "DECREASE"
    | "MAINTAIN"
    | "INCREASE";

  let reason: string;

  /*
   * Progression rules
   */

  if (score < 60) {
    recommendation = "DECREASE";

    reason =
      "Performance was below target. Reduce the load slightly for the next session.";
  } else if (score < 85) {
    recommendation = "MAINTAIN";

    reason =
      "Performance was acceptable. Maintain the current training load.";
  } else if (
    score >= 95 &&
    actualReps >= targetReps &&
    actualWeight >= targetWeight
  ) {
    recommendation = "INCREASE";

    reason =
      "Excellent performance. The target was exceeded, so the load can progress.";
  } else {
    recommendation = "MAINTAIN";

    reason =
      "Target performance was achieved. Maintain the load and aim for consistent execution.";
  }

  return {
    score,

    percentage: score,

    status,

    weightAccuracy:
      Math.round(
        weightAccuracy,
      ),

    repAccuracy:
      Math.round(
        repAccuracy,
      ),

    setCompletion:
      Math.round(
        setCompletion,
      ),

    recommendation,

    reason,
  };
};

/* -------------------------------------------------
   QUICK PERFORMANCE SCORE
-------------------------------------------------- */

export const getPerformanceScore = (
  input: PerformanceInput,
): number => {
  return calculatePerformance(
    input,
  ).score;
};

/* -------------------------------------------------
   CHECK IF EXERCISE SHOULD PROGRESS
-------------------------------------------------- */

export const shouldIncreaseWeight = (
  result: PerformanceResult,
): boolean => {
  return (
    result.recommendation ===
    "INCREASE"
  );
};

/* -------------------------------------------------
   CHECK IF LOAD SHOULD DECREASE
-------------------------------------------------- */

export const shouldDecreaseWeight = (
  result: PerformanceResult,
): boolean => {
  return (
    result.recommendation ===
    "DECREASE"
  );
};

/* -------------------------------------------------
   PERFORMANCE LABEL
-------------------------------------------------- */

export const getPerformanceLabel = (
  score: number,
): PerformanceResult["status"] => {
  if (score < 60) {
    return "FAILED";
  }

  if (score < 80) {
    return "PARTIAL";
  }

  if (score < 95) {
    return "TARGET";
  }

  return "EXCELLENT";
};