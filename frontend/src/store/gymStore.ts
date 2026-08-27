import { create } from "zustand";

import {
  analyzeFitness,
  type FitnessProfile,
  type MuscleGroup,
  type WorkoutHistory,
} from "../engine/fitnessEngine";

import {
  getTodayName,
  getTodayScheduledMuscle,
  type ScheduleDay,
  type ScheduledMuscle,
  type WorkoutNumber,
} from "../engine/scheduleEngine";

import {
  calculateRecovery,
  type RecoveryResult,
} from "../engine/recoveryEngine";

import {
  askCoach,
  buildCoachContext,
  generateCoachInsight,
  type CoachContext,
  type CoachInsight,
  type CoachResponse,
} from "../engine/coachEngine";

import {
  generateMission,
  type GeneratedMission,
} from "../engine/missionGenerator";

import {
  generateWorkout,
} from "../engine/workoutGenerator";

import {
  calculatePerformance,
} from "../engine/performanceEngine";

import {
  addWorkoutHistory,
  getWorkoutHistory,
} from "../engine/workoutHistory";

/* -------------------------------------------------
   TYPES
-------------------------------------------------- */

export type Exercise = {
  id: number;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weight: string;
  xpPerSet: number;
};

export type FitnessRank = {
  name: string;
  minLevel: number;
  description: string;
};

export type FitnessUnlock = {
  level: number;
  name: string;
  description: string;
  icon: string;
};

/* -------------------------------------------------
   FITNESS RANKS
-------------------------------------------------- */

export const FITNESS_RANKS: FitnessRank[] = [
  {
    name: "ROOKIE",
    minLevel: 1,
    description: "The journey begins.",
  },
  {
    name: "INITIATE",
    minLevel: 6,
    description: "Building the foundation.",
  },
  {
    name: "FOUNDATION",
    minLevel: 11,
    description: "Training with purpose.",
  },
  {
    name: "IRON BUILDER",
    minLevel: 16,
    description: "Strength is becoming a habit.",
  },
  {
    name: "ELITE",
    minLevel: 21,
    description: "Operating above the standard.",
  },
  {
    name: "BEAST",
    minLevel: 26,
    description: "Performance without excuses.",
  },
  {
    name: "ASCENDED",
    minLevel: 31,
    description: "The system has evolved.",
  },
];

/* -------------------------------------------------
   FITNESS UNLOCKS
-------------------------------------------------- */

export const FITNESS_UNLOCKS: FitnessUnlock[] = [
  {
    level: 18,
    name: "RECOVERY ANALYSIS",
    description:
      "Analyze training fatigue and recovery.",
    icon: "🧠",
  },
  {
    level: 20,
    name: "ADVANCED CHEST PROGRAM",
    description:
      "Unlock advanced chest programming.",
    icon: "🏆",
  },
  {
    level: 25,
    name: "STRENGTH MODE",
    description:
      "Prioritize strength progression.",
    icon: "⚡",
  },
  {
    level: 30,
    name: "BEAST MODE",
    description:
      "Unlock high-intensity progression.",
    icon: "💀",
  },
];

/* -------------------------------------------------
   RANK HELPERS
-------------------------------------------------- */

export function getFitnessRank(
  level: number,
): FitnessRank {
  return (
    [...FITNESS_RANKS]
      .reverse()
      .find(
        (rank) =>
          level >= rank.minLevel,
      ) ?? FITNESS_RANKS[0]
  );
}

export function getCurrentUnlocks(
  level: number,
): FitnessUnlock[] {
  return FITNESS_UNLOCKS.filter(
    (unlock) =>
      unlock.level <= level,
  );
}

export function getNextUnlock(
  level: number,
): FitnessUnlock | null {
  return (
    FITNESS_UNLOCKS.find(
      (unlock) =>
        unlock.level > level,
    ) ?? null
  );
}

/* -------------------------------------------------
   INITIAL TRAINING HISTORY
-------------------------------------------------- */

const initialTrainingHistory: WorkoutHistory[] = [
  {
    muscle: "CHEST",
    daysSinceLastWorkout: 5,
    performance: 78,
    fatigue: 25,
  },
  {
    muscle: "BACK",
    daysSinceLastWorkout: 3,
    performance: 74,
    fatigue: 30,
  },
  {
    muscle: "SHOULDERS",
    daysSinceLastWorkout: 4,
    performance: 70,
    fatigue: 20,
  },
  {
    muscle: "ARMS",
    daysSinceLastWorkout: 2,
    performance: 82,
    fatigue: 18,
  },
  {
    muscle: "LEGS",
    daysSinceLastWorkout: 6,
    performance: 68,
    fatigue: 35,
  },
];

/* -------------------------------------------------
   LOAD PERSISTED WORKOUT HISTORY
-------------------------------------------------- */

const persistedWorkoutHistory =
  getWorkoutHistory();

/* -------------------------------------------------
   FITNESS ENGINE
-------------------------------------------------- */

const getFitnessDecision = (
  profile: FitnessProfile,
  history: WorkoutHistory[],
) => {
  return analyzeFitness(
    profile,
    history,
  );
};

/* -------------------------------------------------
   XP / LEVEL
-------------------------------------------------- */

const getLevelFromXP = (
  xp: number,
) => {
  return Math.floor(xp / 500) + 3;
};

export const getLevelStartXP = (
  level: number,
) => {
  return (level - 3) * 500;
};

export const getNextLevelXP = (
  level: number,
) => {
  return (level - 2) * 500;
};

/* -------------------------------------------------
   INITIAL PLAYER DATA
-------------------------------------------------- */

const INITIAL_XP = 7240;
const INITIAL_LEVEL = 17;
const INITIAL_STREAK = 12;
const INITIAL_ENERGY = 87;

const INITIAL_STRENGTH = 68;
const INITIAL_STAMINA = 72;
const INITIAL_CONSISTENCY = 84;

/* -------------------------------------------------
   INITIAL FITNESS DECISION
-------------------------------------------------- */

const initialProfile: FitnessProfile = {
  strength: INITIAL_STRENGTH,
  stamina: INITIAL_STAMINA,
  consistency: INITIAL_CONSISTENCY,
  energy: INITIAL_ENERGY,
};

const initialDecision =
  getFitnessDecision(
    initialProfile,
    initialTrainingHistory,
  );

/* -------------------------------------------------
   INITIAL RECOVERY
-------------------------------------------------- */

const initialRecovery =
  calculateRecovery({
    energy: 92,
    fatigue: 18,
    consistency: 84,
  });

/* -------------------------------------------------
   WEEKLY SCHEDULE
-------------------------------------------------- */

const INITIAL_WORKOUT_NUMBER: WorkoutNumber = 1;

const initialScheduleDay =
  getTodayName();

const initialScheduledMuscle =
  getTodayScheduledMuscle(
    INITIAL_WORKOUT_NUMBER,
  );

const scheduledMuscleToGroup = (
  muscle: ScheduledMuscle,
): MuscleGroup => {
  switch (muscle) {
    case "Biceps":
    case "Triceps":
      return "ARMS";

    case "Shoulder":
      return "SHOULDERS";

    case "Thighs":
      return "LEGS";

    case "Chest":
      return "CHEST";

    case "Back":
      return "BACK";

    default:
      return "CORE";
  }
};

const generateScheduledWorkout = (
  muscle: ScheduledMuscle,
): Exercise[] => {
  return generateWorkout(muscle);
};

/* -------------------------------------------------
   RESTORE TODAY'S COMPLETED SETS
-------------------------------------------------- */

const getLocalDateKey = (
  isoDate: string,
): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayLocalDateKey = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const restoreCompletedSets = (
  exercises: Exercise[],
): Record<number, number> => {
  const today = getTodayLocalDateKey();

  const todayRecords =
    persistedWorkoutHistory.filter(
      (record) =>
        getLocalDateKey(record.date) ===
        today,
    );

  const restored: Record<number, number> = {};

  for (const exercise of exercises) {
    const records =
      todayRecords.filter(
        (record) =>
          record.exerciseName ===
          exercise.name,
      );

    if (records.length > 0) {
      restored[exercise.id] = Math.min(
        records.length,
        exercise.sets,
      );
    }
  }

  return restored;
};

/* -------------------------------------------------
   INITIAL MISSION DECISION
-------------------------------------------------- */

const initialMissionDecision =
  initialScheduledMuscle
    ? {
        ...initialDecision,
        muscle:
          scheduledMuscleToGroup(
            initialScheduledMuscle,
          ),
        reason:
          `Gym schedule: ${initialScheduledMuscle} is planned for today.`,
      }
    : initialDecision;

const initialTodayWorkout =
  initialScheduledMuscle
    ? generateScheduledWorkout(
        initialScheduledMuscle,
      )
    : [];

/* -------------------------------------------------
   INITIAL GENERATED MISSION
-------------------------------------------------- */

const initialMission =
  generateMission(
    initialMissionDecision,
    43,
    initialRecovery,
  );

/* -------------------------------------------------
   INITIAL COACH CONTEXT
-------------------------------------------------- */

const initialCoachContext: CoachContext = {
  player: {
    level: INITIAL_LEVEL,
    xp: INITIAL_XP,
    streak: INITIAL_STREAK,
  },

  fitness: initialProfile,

  recovery: initialRecovery,

  mission: {
    id: initialMission.id,
    title: initialMission.title,
    targetMuscle:
      initialMission.targetMuscle,
    priority: initialMission.priority,
    intensity: initialMission.intensity,
    exercises:
      initialTodayWorkout.length > 0
        ? initialTodayWorkout
        : initialMission.exercises,
  },

  trainingHistory:
    initialTrainingHistory,
};

/* -------------------------------------------------
   INITIAL COACH INSIGHT
-------------------------------------------------- */

const initialCoachInsight =
  generateCoachInsight(
    initialCoachContext,
  );

/* -------------------------------------------------
   STORE TYPE
-------------------------------------------------- */

type GymState = {
  /* Player */
  xp: number;
  level: number;
  streak: number;
  energy: number;

  /* Stats */
  strength: number;
  stamina: number;
  consistency: number;

  /* Mission */
  missionId: string;
  missionName: string;
  missionCompleted: boolean;

  missionNumber: number;
  mission: GeneratedMission;

  /* Level */
  levelUp: boolean;
  lastLevel: number;

  /* Exercises */
  exercises: Exercise[];
  completedSets: Record<
    number,
    number
  >;

  /* Training */
  trainingHistory: WorkoutHistory[];

  /* Fitness Engine */
  recommendedMuscle: MuscleGroup;

  missionPriority:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  missionReason: string;

  /* Recovery Engine */
  recovery: RecoveryResult;

  /* AI Coach */
  coachContext: CoachContext;
  coachInsight: CoachInsight;
  coachResponse: CoachResponse | null;

  /* Weekly Schedule */
workoutNumber: WorkoutNumber;
scheduleDay: ScheduleDay | null;
todayScheduledMuscle: ScheduledMuscle | null;

  /* Actions */
  completeSet: (
    exerciseId: number,
  ) => void;

  recordExercisePerformance: (
    exerciseId: number,
    actualWeight: number,
    actualReps: number,
  ) => void;

  completeMission: () => void;

  dismissLevelUp: () => void;

  resetMission: () => void;

  refreshFitnessDecision: () => void;

  refreshRecovery: () => void;

  refreshCoach: () => void;

  askCoach: (
    question: string,
  ) => void;

  generateNextMission: () => void;

  refreshSchedule: () => void;

  setWorkoutNumber: (
    workoutNumber: WorkoutNumber,
  ) => void;
};

/* -------------------------------------------------
   STORE
-------------------------------------------------- */

export const useGymStore =
  create<GymState>(
    (set, get) => ({
      /* ---------------------------------------------
         PLAYER
      ---------------------------------------------- */

      xp: INITIAL_XP,

      level: INITIAL_LEVEL,

      streak: INITIAL_STREAK,

      energy: INITIAL_ENERGY,

      /* ---------------------------------------------
         STATS
      ---------------------------------------------- */

      strength:
        INITIAL_STRENGTH,

      stamina:
        INITIAL_STAMINA,

      consistency:
        INITIAL_CONSISTENCY,

      /* ---------------------------------------------
         MISSION
      ---------------------------------------------- */

      missionId:
        initialMission.id,

      missionName:
        initialMission.title,

      missionCompleted: false,

      missionNumber: 43,

      mission:
        initialMission,

      /* ---------------------------------------------
         LEVEL
      ---------------------------------------------- */

      levelUp: false,

      lastLevel:
        INITIAL_LEVEL,

      /* ---------------------------------------------
         EXERCISES
      ---------------------------------------------- */

      exercises:
        initialTodayWorkout,

      completedSets:
        restoreCompletedSets(
          initialTodayWorkout,
        ),

      /* ---------------------------------------------
         TRAINING HISTORY
      ---------------------------------------------- */

      trainingHistory:
        initialTrainingHistory,

      /* ---------------------------------------------
         FITNESS ENGINE
      ---------------------------------------------- */

      recommendedMuscle:
        initialMissionDecision.muscle,

      missionPriority:
        initialMissionDecision.priority,

      missionReason:
        initialMissionDecision.reason,

      /* ---------------------------------------------
         RECOVERY ENGINE
      ---------------------------------------------- */

      recovery:
        initialRecovery,

      /* ---------------------------------------------
         AI COACH
      ---------------------------------------------- */

      coachContext:
        initialCoachContext,

      coachInsight:
        initialCoachInsight,

      coachResponse: null,

      /* ---------------------------------------------
         WEEKLY SCHEDULE
      ---------------------------------------------- */

      workoutNumber:
        INITIAL_WORKOUT_NUMBER,

      scheduleDay:
        initialScheduleDay,

      todayScheduledMuscle:
        initialScheduledMuscle,

      /* =============================================
         COMPLETE SET
      ============================================== */

      completeSet: (
        exerciseId,
      ) => {
        const state = get();

        const exercise =
          state.exercises.find(
            (item) =>
              item.id ===
              exerciseId,
          );

        if (!exercise) {
          return;
        }

        const currentCompleted =
          state.completedSets[
            exerciseId
          ] ?? 0;

        if (
          currentCompleted >=
          exercise.sets
        ) {
          return;
        }

        const updatedCompletedSets =
          {
            ...state.completedSets,

            [exerciseId]:
              currentCompleted + 1,
          };

        const newXp =
          state.xp +
          exercise.xpPerSet;

        const newLevel =
          getLevelFromXP(
            newXp,
          );

        const didLevelUp =
          newLevel >
          state.level;

        set({
          completedSets:
            updatedCompletedSets,

          xp: newXp,

          level: newLevel,

          lastLevel:
            didLevelUp
              ? newLevel
              : state.lastLevel,

          levelUp:
            didLevelUp,

          strength:
            didLevelUp
              ? Math.min(
                  state.strength + 2,
                  100,
                )
              : state.strength,

          consistency:
            didLevelUp
              ? Math.min(
                  state.consistency + 1,
                  100,
                )
              : state.consistency,

          energy:
            Math.max(
              0,
              state.energy - 1,
            ),
        });

        get().refreshFitnessDecision();

        get().refreshRecovery();

        get().refreshCoach();
      },

      /* =============================================
         RECORD EXERCISE PERFORMANCE
      ============================================== */

      recordExercisePerformance: (
        exerciseId,
        actualWeight,
        actualReps,
      ) => {
        const state = get();

        const exercise =
          state.exercises.find(
            (item) =>
              item.id === exerciseId,
          );

        if (!exercise) {
          return;
        }

        const targetWeight =
          Number.parseFloat(
            exercise.weight.replace(
              /[^0-9.]/g,
              "",
            ),
          );

        if (
          !Number.isFinite(
            targetWeight,
          ) ||
          targetWeight <= 0 ||
          !Number.isFinite(
            actualWeight,
          ) ||
          actualWeight < 0 ||
          !Number.isFinite(
            actualReps,
          ) ||
          actualReps < 0
        ) {
          return;
        }

        const completedSets =
          state.completedSets[
            exerciseId
          ] ?? 0;

        const performance =
          calculatePerformance({
            targetWeight,
            targetReps:
              exercise.reps,
            actualWeight,
            actualReps,
            targetSets:
              exercise.sets,
            completedSets,
          });

        const historyMuscle =
          exercise.muscle;

        const updatedHistory =
          state.trainingHistory.map(
            (entry) => {
              if (
                entry.muscle !==
                historyMuscle
              ) {
                return entry;
              }

              return {
                ...entry,
                performance:
                  performance.score,
              };
            },
          );

        /*
         * Persist the actual result so it
         * survives a page refresh.
         */
        addWorkoutHistory({
          exerciseId,
          exerciseName:
            exercise.name,
          muscle:
            exercise.muscle,
          targetWeight,
          actualWeight,
          targetReps:
            exercise.reps,
          actualReps,
          targetSets:
            exercise.sets,
          completedSets,
          performanceScore:
            performance.score,
          status:
            performance.status,
          recommendation:
            performance.recommendation,
        });

        set({
          trainingHistory:
            updatedHistory,
          coachResponse: null,
        });

        get().refreshFitnessDecision();
        get().refreshRecovery();
        get().refreshCoach();
      },


      /* =============================================
         COMPLETE MISSION
      ============================================== */

      completeMission: () => {
        const state = get();

        if (
          state.missionCompleted
        ) {
          return;
        }

        const completedHistory =
          state.trainingHistory.map(
            (entry) => ({
              ...entry,

              daysSinceLastWorkout:
                entry.daysSinceLastWorkout +
                1,
            }),
          );

        const trainedMuscles =
          new Set<MuscleGroup>();

        for (
          const exercise of
            state.exercises
        ) {
          const muscle =
            exercise.muscle;

          if (
            muscle === "CHEST" ||
            muscle === "BACK" ||
            muscle === "SHOULDERS" ||
            muscle === "ARMS" ||
            muscle === "LEGS" ||
            muscle === "CORE"
          ) {
            trainedMuscles.add(
              muscle,
            );
          }
        }

        const updatedHistory =
          completedHistory.map(
            (entry) => {
              if (
                trainedMuscles.has(
                  entry.muscle,
                )
              ) {
                return {
                  ...entry,

                  daysSinceLastWorkout: 0,

                  performance:
                    Math.min(
                      entry.performance + 2,
                      100,
                    ),

                  fatigue:
                    Math.min(
                      entry.fatigue + 5,
                      100,
                    ),
                };
              }

              return {
                ...entry,

                fatigue:
                  Math.max(
                    0,
                    entry.fatigue - 3,
                  ),
              };
            },
          );

        const missionReward =
          state.mission.xpReward;

        const newXp =
          state.xp +
          missionReward;

        const newLevel =
          getLevelFromXP(
            newXp,
          );

        const didLevelUp =
          newLevel >
          state.level;

        set({
          missionCompleted: true,

          xp: newXp,

          level: newLevel,

          lastLevel:
            didLevelUp
              ? newLevel
              : state.lastLevel,

          levelUp:
            didLevelUp,

          streak:
            state.streak + 1,

          consistency:
            Math.min(
              state.consistency + 1,
              100,
            ),

          stamina:
            Math.min(
              state.stamina + 1,
              100,
            ),

          energy:
            Math.min(
              100,
              Math.max(
                0,
                state.energy - 8,
              ) + 5,
            ),

          trainingHistory:
            updatedHistory,

          coachResponse: null,
        });

        get().refreshFitnessDecision();

        get().refreshRecovery();

        get().refreshCoach();
      },

      /* =============================================
         GENERATE NEXT MISSION
      ============================================== */

      generateNextMission:
        () => {
          const state = get();

          const profile:
            FitnessProfile = {
            strength:
              state.strength,

            stamina:
              state.stamina,

            consistency:
              state.consistency,

            energy:
              state.energy,
          };

          const decision =
            getFitnessDecision(
              profile,
              state.trainingHistory,
            );

          const nextMissionNumber =
            state.missionNumber + 1;

          const missionDecision =
            state.todayScheduledMuscle
              ? {
                  ...decision,
                  muscle:
                    scheduledMuscleToGroup(
                      state.todayScheduledMuscle,
                    ),
                  reason:
                    `Gym schedule: ${state.todayScheduledMuscle} is planned for today.`,
                }
              : decision;

          const newMission =
            generateMission(
              missionDecision,
              nextMissionNumber,
              state.recovery,
            );

          const scheduledWorkout =
            state.todayScheduledMuscle
              ? generateScheduledWorkout(
                  state.todayScheduledMuscle,
                )
              : newMission.exercises;

          set({
            mission:
              newMission,

            missionNumber:
              nextMissionNumber,

            missionId:
              newMission.id,

            missionName:
              newMission.title,

            exercises:
              scheduledWorkout,

            completedSets:
              restoreCompletedSets(
                scheduledWorkout,
              ),

            missionCompleted:
              false,

            recommendedMuscle:
              missionDecision.muscle,

            missionPriority:
              missionDecision.priority,

            missionReason:
              missionDecision.reason,

            coachResponse: null,
          });

          get().refreshRecovery();

          get().refreshCoach();
        },

      /* =============================================
         LEVEL UP
      ============================================== */

      dismissLevelUp:
        () => {
          set({
            levelUp: false,
          });
        },

      /* =============================================
         RESET CURRENT MISSION
      ============================================== */

      resetMission:
        () => {
          set({
            completedSets: {},

            missionCompleted:
              false,

            levelUp: false,

            coachResponse: null,
          });

          get().refreshRecovery();

          get().refreshCoach();
        },

      /* =============================================
         REFRESH FITNESS DECISION
      ============================================== */

      refreshFitnessDecision:
        () => {
          const state = get();

          const profile:
            FitnessProfile = {
            strength:
              state.strength,

            stamina:
              state.stamina,

            consistency:
              state.consistency,

            energy:
              state.energy,
          };

          const decision =
            getFitnessDecision(
              profile,
              state.trainingHistory,
            );

          set({
            recommendedMuscle:
              decision.muscle,

            missionPriority:
              decision.priority,

            missionReason:
              decision.reason,
          });
        },

      /* =============================================
         REFRESH RECOVERY
      ============================================== */

      refreshRecovery:
        () => {
          const state = get();

          const averageFatigue =
            state.trainingHistory
              .length === 0
              ? 0
              : state.trainingHistory.reduce(
                  (
                    total,
                    entry,
                  ) =>
                    total +
                    entry.fatigue,
                  0,
                ) /
                state
                  .trainingHistory
                  .length;

          const recovery =
            calculateRecovery({
              energy:
                state.energy,

              fatigue:
                averageFatigue,

              consistency:
                state.consistency,
            });

          set({
            recovery,
          });
        },

      /* =============================================
         REFRESH AI COACH
      ============================================== */

      refreshCoach:
        () => {
          const state = get();

          const context:
            CoachContext = {
            player: {
              level:
                state.level,

              xp:
                state.xp,

              streak:
                state.streak,
            },

            fitness: {
              strength:
                state.strength,

              stamina:
                state.stamina,

              consistency:
                state.consistency,

              energy:
                state.energy,
            },

            recovery:
              state.recovery,

            mission: {
              id:
                state.mission.id,

              title:
                state.mission.title,

              targetMuscle:
                state.mission
                  .targetMuscle,

              priority:
                state.mission
                  .priority,

              intensity:
                state.mission
                  .intensity,

              exercises:
                state.mission
                  .exercises,
            },

            trainingHistory:
              state.trainingHistory,
          };

          const cleanContext =
            buildCoachContext(
              context,
            );

          const insight =
            generateCoachInsight(
              cleanContext,
            );

          set({
            coachContext:
              cleanContext,

            coachInsight:
              insight,
          });
        },

      /* =============================================
         ASK AI COACH
      ============================================== */

      askCoach:
        (question) => {
          const state = get();

          const response =
            askCoach(
              question,
              state.coachContext,
            );

          set({
            coachResponse:
              response,
          });
        },

      /* =============================================
         REFRESH WEEKLY SCHEDULE
      ============================================== */

      refreshSchedule: () => {
        const state = get();

        const scheduleDay =
          getTodayName();

        const todayScheduledMuscle =
          getTodayScheduledMuscle(
            state.workoutNumber,
          );

        const scheduledWorkout =
          todayScheduledMuscle
            ? generateScheduledWorkout(
                todayScheduledMuscle,
              )
            : [];

        const profile: FitnessProfile = {
          strength: state.strength,
          stamina: state.stamina,
          consistency: state.consistency,
          energy: state.energy,
        };

        const decision =
          getFitnessDecision(
            profile,
            state.trainingHistory,
          );

        const missionDecision =
          todayScheduledMuscle
            ? {
                ...decision,
                muscle:
                  scheduledMuscleToGroup(
                    todayScheduledMuscle,
                  ),
                reason:
                  `Gym schedule: ${todayScheduledMuscle} is planned for today.`,
              }
            : decision;

        const refreshedMission =
          generateMission(
            missionDecision,
            state.missionNumber,
            state.recovery,
          );

        set({
          scheduleDay,
          todayScheduledMuscle,

          exercises:
            scheduledWorkout.length > 0
              ? scheduledWorkout
              : refreshedMission.exercises,

          mission:
            refreshedMission,

          missionId:
            refreshedMission.id,

          missionName:
            refreshedMission.title,

          completedSets:
            restoreCompletedSets(
              scheduledWorkout.length > 0
                ? scheduledWorkout
                : refreshedMission.exercises,
            ),

          recommendedMuscle:
            missionDecision.muscle,

          missionPriority:
            missionDecision.priority,

          missionReason:
            missionDecision.reason,

          missionCompleted: false,
          coachResponse: null,
        });

        get().refreshCoach();
      },

      /* =============================================
         SET WORKOUT ROTATION
      ============================================== */

      setWorkoutNumber: (
        workoutNumber,
      ) => {
        const state = get();

        const scheduleDay =
          getTodayName();

        const todayScheduledMuscle =
          getTodayScheduledMuscle(
            workoutNumber,
          );

        const scheduledWorkout =
          todayScheduledMuscle
            ? generateScheduledWorkout(
                todayScheduledMuscle,
              )
            : [];

        const profile: FitnessProfile = {
          strength: state.strength,
          stamina: state.stamina,
          consistency: state.consistency,
          energy: state.energy,
        };

        const decision =
          getFitnessDecision(
            profile,
            state.trainingHistory,
          );

        const missionDecision =
          todayScheduledMuscle
            ? {
                ...decision,
                muscle:
                  scheduledMuscleToGroup(
                    todayScheduledMuscle,
                  ),
                reason:
                  `Gym schedule: ${todayScheduledMuscle} is planned for today.`,
              }
            : decision;

        const newMission =
          generateMission(
            missionDecision,
            state.missionNumber,
            state.recovery,
          );

        set({
          workoutNumber,
          scheduleDay,
          todayScheduledMuscle,

          exercises:
            scheduledWorkout.length > 0
              ? scheduledWorkout
              : newMission.exercises,

          mission:
            newMission,

          missionId:
            newMission.id,

          missionName:
            newMission.title,

          completedSets:
            restoreCompletedSets(
              scheduledWorkout.length > 0
                ? scheduledWorkout
                : newMission.exercises,
            ),
          missionCompleted: false,

          recommendedMuscle:
            missionDecision.muscle,

          missionPriority:
            missionDecision.priority,

          missionReason:
            missionDecision.reason,

          coachResponse: null,
        });

        get().refreshCoach();
      },
    }),
  );