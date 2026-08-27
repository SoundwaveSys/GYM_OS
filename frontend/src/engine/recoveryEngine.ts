export type RecoveryState =
  | "EXCELLENT"
  | "GOOD"
  | "MODERATE"
  | "LOW"
  | "CRITICAL";

export type RecoveryInput = {
  energy: number;
  fatigue: number;
  consistency: number;
};

export type RecoveryResult = {
  score: number;
  state: RecoveryState;
  intensity: "HIGH" | "MEDIUM" | "LOW";
  warning: string;
  recommendation: string;
};

export function calculateRecovery(
  input: RecoveryInput,
): RecoveryResult {
  const energy = Math.max(
    0,
    Math.min(100, input.energy),
  );

  const fatigue = Math.max(
    0,
    Math.min(100, input.fatigue),
  );

  const consistency = Math.max(
    0,
    Math.min(100, input.consistency),
  );

  /*
   * Energy and consistency increase readiness.
   * Fatigue decreases readiness.
   */
  const score = Math.round(
    energy * 0.5 +
      consistency * 0.2 +
      (100 - fatigue) * 0.3,
  );

  if (score >= 85) {
    return {
      score,
      state: "EXCELLENT",
      intensity: "HIGH",
      warning: "Recovery systems are fully online.",
      recommendation:
        "You are ready for a high-intensity training session.",
    };
  }

  if (score >= 70) {
    return {
      score,
      state: "GOOD",
      intensity: "HIGH",
      warning: "Recovery is within a healthy range.",
      recommendation:
        "Normal progression can continue.",
    };
  }

  if (score >= 50) {
    return {
      score,
      state: "MODERATE",
      intensity: "MEDIUM",
      warning:
        "Some fatigue is affecting readiness.",
      recommendation:
        "Train normally but avoid unnecessary intensity increases.",
    };
  }

  if (score >= 30) {
    return {
      score,
      state: "LOW",
      intensity: "LOW",
      warning:
        "Accumulated fatigue is affecting performance.",
      recommendation:
        "Reduce training intensity and prioritize recovery.",
    };
  }

  return {
    score,
    state: "CRITICAL",
    intensity: "LOW",
    warning:
      "Recovery is critically low.",
    recommendation:
      "Recovery should take priority over high-intensity training.",
  };
}