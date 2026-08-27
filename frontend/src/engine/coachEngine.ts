import type { Exercise } from "../store/gymStore";
import type { FitnessProfile } from "./fitnessEngine";
import type { RecoveryResult } from "./recoveryEngine";

import {
  getWorkoutHistory,
  type WorkoutHistoryRecord,
} from "./workoutHistory";

import {
  getPersonalRecords,
} from "./personalRecords";

export type CoachContext = {
  player: {
    level: number;
    xp: number;
    streak: number;
  };

  fitness: FitnessProfile;

  recovery: RecoveryResult;

  mission: {
    id: string;
    title: string;
    targetMuscle: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    intensity: "HIGH" | "MEDIUM" | "LOW";
    exercises: Exercise[];
  };

  trainingHistory: {
    muscle: string;
    daysSinceLastWorkout: number;
    performance: number;
    fatigue: number;
  }[];
};

export type CoachInsight = {
  headline: string;
  explanation: string;
  focus: string;
  nextStep: string;
};

export type CoachResponse = {
  answer: string;
  reason: string;
  action: string;
};

/* ---------------------------------------------
   CONTEXT
---------------------------------------------- */

export function buildCoachContext(
  context: CoachContext,
): CoachContext {
  return {
    ...context,

    mission: {
      ...context.mission,

      exercises:
        context.mission.exercises.map(
          (exercise) => ({
            ...exercise,
          }),
        ),
    },

    trainingHistory:
      context.trainingHistory.map(
        (entry) => ({
          ...entry,
        }),
      ),
  };
}

/* ---------------------------------------------
   AUTOMATIC COACH INSIGHT
---------------------------------------------- */

export function generateCoachInsight(
  context: CoachContext,
): CoachInsight {
  const {
    recovery,
    mission,
    trainingHistory,
  } = context;

  const targetHistory =
    trainingHistory.find(
      (entry) =>
        entry.muscle ===
        mission.targetMuscle,
    );

  const daysSince =
    targetHistory?.daysSinceLastWorkout ??
    0;

  let headline =
    "MISSION PROTOCOL READY";

  let explanation =
    `Your ${mission.targetMuscle.toLowerCase()} session was selected from your training data.`;

  let focus =
    "Focus on controlled reps and consistent technique.";

  let nextStep =
    "Complete the prescribed sets before increasing the load.";

  if (
    recovery.intensity === "HIGH"
  ) {
    headline =
      "YOU ARE READY TO PUSH";

    explanation =
      `Recovery is ${recovery.score}%, so the system has authorized high training intensity.`;

    focus =
      "Use strong, controlled reps and aim to complete the full target volume.";

    nextStep =
      "If every target rep is completed with good technique, consider progression next session.";
  }

  if (
    recovery.intensity === "MEDIUM"
  ) {
    headline =
      "CONTROL THE SESSION";

    explanation =
      `Recovery is ${recovery.score}%, so training volume has been reduced to manage fatigue.`;

    focus =
      "Prioritize technique and avoid unnecessary intensity increases.";

    nextStep =
      "Complete the reduced volume and allow recovery before progressing.";
  }

  if (
    recovery.intensity === "LOW"
  ) {
    headline =
      "RECOVERY TAKES PRIORITY";

    explanation =
      `Recovery is currently ${recovery.score}%, so the system has reduced training demand.`;

    focus =
      "Keep the session controlled and avoid pushing to failure.";

    nextStep =
      "Recover fully before attempting a heavier progression.";
  }

  if (daysSince >= 6) {
    explanation +=
      ` This muscle has been inactive for ${daysSince} days, increasing its training priority.`;
  }

  return {
    headline,
    explanation,
    focus,
    nextStep,
  };
}

/* ---------------------------------------------
   QUESTION NORMALIZER
---------------------------------------------- */

function normalizeQuestion(
  question: string,
): string {
  return question
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " ",
    );
}

/* ---------------------------------------------
   FIND EXERCISE
---------------------------------------------- */

function findMissionExercise(
  question: string,
  exercises: Exercise[],
): Exercise | undefined {
  return exercises.find(
    (exercise) =>
      question.includes(
        exercise.name.toLowerCase(),
      ),
  );
}

/* ---------------------------------------------
   GET LATEST EXERCISE RECORD
---------------------------------------------- */

function getLatestExerciseRecord(
  exerciseName: string,
  history: WorkoutHistoryRecord[],
): WorkoutHistoryRecord | undefined {
  const records =
    history.filter(
      (item) =>
        item.exerciseName
          .toLowerCase() ===
        exerciseName.toLowerCase(),
    );

  if (!records.length) {
    return undefined;
  }

  return [...records].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime(),
  )[0];
}

/* ---------------------------------------------
   QUESTION COACH
---------------------------------------------- */

export function askCoach(
  question: string,
  context: CoachContext,
): CoachResponse {
  const q =
    normalizeQuestion(question);

  const {
    recovery,
    mission,
    fitness,
  } = context;

  const history =
    getWorkoutHistory();

  const askedExercise =
    findMissionExercise(
      q,
      mission.exercises,
    );

  /* -------------------------------------------
     EMPTY QUESTION
  -------------------------------------------- */

  if (!q) {
    return {
      answer:
        "Ask me something about today's workout, your recovery, or your progression.",

      reason:
        "The Coach needs a question before it can analyze your training data.",

      action:
        "Try asking: Should I increase my weight?",
    };
  }

  /* -------------------------------------------
     TODAY'S WORKOUT
  -------------------------------------------- */

  if (
    q.includes("today") &&
    (
      q.includes("workout") ||
      q.includes("exercise") ||
      q.includes("do")
    )
  ) {
    const exercises =
      mission.exercises
        .map(
          (exercise) =>
            `${exercise.name}: ${exercise.weight} × ${exercise.reps} × ${exercise.sets} sets`,
        )
        .join(" | ");

    return {
      answer:
        `Today's mission is ${mission.title}. ${exercises}`,

      reason:
        `The mission targets ${mission.targetMuscle} based on your current training state.`,

      action:
        "Complete the prescribed sets and record your actual performance.",
    };
  }

  /* -------------------------------------------
     EXERCISE PROGRESSION
  -------------------------------------------- */

  if (
    askedExercise &&
    (
      q.includes("increase") ||
      q.includes("weight") ||
      q.includes("heavier") ||
      q.includes("progress") ||
      q.includes("should i")
    )
  ) {
    const latest =
      getLatestExerciseRecord(
        askedExercise.name,
        history,
      );

    if (!latest) {
      return {
        answer:
          `I don't have previous performance data for ${askedExercise.name} yet.`,

        reason:
          "The Coach needs a completed workout before making a history-based progression recommendation.",

        action:
          `Complete ${askedExercise.name} and record your actual weight and reps.`,
      };
    }

    if (
      latest.recommendation ===
      "INCREASE"
    ) {
      return {
        answer:
          `Yes. You are ready to increase ${askedExercise.name}.`,

        reason:
          `Your last performance was ${latest.performanceScore}% at ${latest.actualWeight} kg × ${latest.actualReps} reps.`,

        action:
          "Increase the load gradually while maintaining controlled technique.",
      };
    }

    if (
      latest.recommendation ===
      "DECREASE"
    ) {
      return {
        answer:
          `No. I would reduce the ${askedExercise.name} load for now.`,

        reason:
          `Your last performance was ${latest.performanceScore}% at ${latest.actualWeight} kg × ${latest.actualReps} reps.`,

        action:
          "Use a slightly lighter load and focus on clean reps.",
      };
    }

    return {
      answer:
        `Maintain the current ${askedExercise.name} weight for now.`,

      reason:
        `Your last performance was ${latest.performanceScore}% at ${latest.actualWeight} kg × ${latest.actualReps} reps.`,

      action:
        "Repeat the current load and aim for stronger execution before increasing it.",
    };
  }

  /* -------------------------------------------
     PERSONAL RECORDS
  -------------------------------------------- */

  if (
    q.includes("pr") ||
    q.includes("personal record") ||
    q.includes("my best") ||
    q.includes("record") ||
    q.includes("best")
  ) {
    const records =
      getPersonalRecords();

    const requestedRecord =
      askedExercise
        ? records.find(
            (record) =>
              record.exerciseName
                .toLowerCase() ===
              askedExercise.name
                .toLowerCase(),
          )
        : undefined;

    const record =
      requestedRecord ??
      records[0];

    if (!record) {
      return {
        answer:
          "You don't have a personal record yet.",

        reason:
          "PRs are generated automatically from completed workout history.",

        action:
          "Complete and record a workout to start building your PRs.",
      };
    }

    return {
      answer:
        `Your best ${record.exerciseName} is ${record.heaviestWeight} kg for ${record.highestReps} reps.`,

      reason:
        `Your best recorded performance score is ${record.bestScore}%.`,

      action:
        "Use this record as your benchmark and progress gradually.",
    };
  }

  /* -------------------------------------------
     RECOVERY
  -------------------------------------------- */

  if (
    q.includes("recovery") ||
    q.includes("tired") ||
    q.includes("fatigue")
  ) {
    return {
      answer:
        `Your current recovery score is ${recovery.score}%.`,

      reason:
        recovery.recommendation,

      action:
        `The system currently recommends ${recovery.intensity.toLowerCase()} training intensity.`,
    };
  }

  /* -------------------------------------------
     WHY THIS WORKOUT?
  -------------------------------------------- */

  if (
    q.includes("why") &&
    (
      q.includes("mission") ||
      q.includes("workout") ||
      q.includes("legs") ||
      q.includes("chest") ||
      q.includes("back") ||
      q.includes("biceps") ||
      q.includes("triceps") ||
      q.includes("shoulder")
    )
  ) {
    return {
      answer:
        `Today's mission targets ${mission.targetMuscle}.`,

      reason:
        "The Fitness Engine selected this muscle using recent training history, fitness profile, and recovery state.",

      action:
        `Your current mission is ${mission.title} at ${mission.intensity} intensity.`,
    };
  }

  /* -------------------------------------------
     INTENSITY
  -------------------------------------------- */

  if (
    q.includes("intensity") ||
    q.includes("hard") ||
    q.includes("difficult")
  ) {
    return {
      answer:
        `Today's workout is set to ${mission.intensity} intensity.`,

      reason:
        `The intensity is based on your current recovery score of ${recovery.score}%.`,

      action:
        recovery.intensity ===
        "HIGH"
          ? "Push the prescribed volume while maintaining good technique."
          : "Stay controlled and avoid unnecessary intensity increases.",
    };
  }

  /* -------------------------------------------
     STATS
  -------------------------------------------- */

  if (
    q.includes("stats") ||
    q.includes("strength") ||
    q.includes("stamina") ||
    q.includes("consistency")
  ) {
    return {
      answer:
        `Your current profile is Strength ${fitness.strength}, Stamina ${fitness.stamina}, and Consistency ${fitness.consistency}.`,

      reason:
        "These values contribute to the Fitness Engine's training decisions.",

      action:
        "Keep training consistently and use mission performance to improve these stats.",
    };
  }

  /* -------------------------------------------
     NEXT WORKOUT
  -------------------------------------------- */

  if (
    q.includes("next") ||
    q.includes("tomorrow") ||
    q.includes("after")
  ) {
    return {
      answer:
        "Your next mission will be recalculated from your updated training history.",

      reason:
        "The Fitness Engine reevaluates muscle priority, performance, and recovery after training.",

      action:
        "Complete today's mission and record your actual performance.",
    };
  }

  /* -------------------------------------------
     DEFAULT
  -------------------------------------------- */

  return {
    answer:
      "I can analyze your current training state.",

    reason:
      `You're currently on ${mission.title} with ${recovery.score}% recovery and ${mission.intensity} intensity.`,

    action:
      "Ask me about today's workout, recovery, PRs, or weight progression.",
  };
}