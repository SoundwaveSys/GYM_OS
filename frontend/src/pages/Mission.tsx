import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Play,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import {
  getFitnessRank,
  useGymStore,
} from "../store/gymStore";

import {
  calculatePerformance,
} from "../engine/performanceEngine";

function Mission({
  onExit,
}: {
  onExit: () => void;
}) {
  const [activeExercise, setActiveExercise] =
    useState(0);

  const [showComplete, setShowComplete] =
    useState(false);

  const [showWorkoutSelector, setShowWorkoutSelector] =
    useState(false);

  const [actualWeight, setActualWeight] =
    useState("");

  const [actualReps, setActualReps] =
    useState("");

  const [performanceMessage, setPerformanceMessage] =
    useState("");

  const [performanceResult, setPerformanceResult] =
    useState<ReturnType<
      typeof calculatePerformance
    > | null>(null);

  /* ---------------------------------------------
     STORE
  ---------------------------------------------- */

  const mission = useGymStore(
    (state) => state.mission,
  );

  const workoutNumber = useGymStore(
    (state) => state.workoutNumber,
  );

  const scheduleDay = useGymStore(
    (state) => state.scheduleDay,
  );

  const todayScheduledMuscle =
    useGymStore(
      (state) =>
        state.todayScheduledMuscle,
    );

  const setWorkoutNumber =
    useGymStore(
      (state) =>
        state.setWorkoutNumber,
    );

  const exercises = useGymStore(
    (state) => state.exercises,
  );

  const completedSets = useGymStore(
    (state) => state.completedSets,
  );

  const xp = useGymStore(
    (state) => state.xp,
  );

  const level = useGymStore(
    (state) => state.level,
  );

  const missionCompleted =
    useGymStore(
      (state) => state.missionCompleted,
    );

  const levelUp = useGymStore(
    (state) => state.levelUp,
  );

  const completeSet = useGymStore(
    (state) => state.completeSet,
  );

  const recordExercisePerformance =
    useGymStore(
      (state) =>
        state.recordExercisePerformance,
    );

  const completeMission = useGymStore(
    (state) => state.completeMission,
  );

  const dismissLevelUp =
    useGymStore(
      (state) => state.dismissLevelUp,
    );

  const generateNextMission =
    useGymStore(
      (state) =>
        state.generateNextMission,
    );

  /* ---------------------------------------------
     FITNESS DATA
  ---------------------------------------------- */

  const rank = getFitnessRank(level);

  const currentExercise =
    exercises[activeExercise];

  const totalSets =
    exercises.reduce(
      (total, exercise) =>
        total + exercise.sets,
      0,
    );

  const completedSetCount =
    Object.values(
      completedSets,
    ).reduce(
      (total, count) =>
        total + count,
      0,
    );

  const progress =
    totalSets === 0
      ? 0
      : Math.round(
          (completedSetCount /
            totalSets) *
            100,
        );

  const missionXP =
    mission?.xpReward ??
    exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets *
          exercise.xpPerSet,
      0,
    );

  /* ---------------------------------------------
     COMPLETE SET
  ---------------------------------------------- */

  const handleCompleteSet = () => {
    if (
      !currentExercise ||
      missionCompleted
    ) {
      return;
    }

    const currentCompleted =
      completedSets[
        currentExercise.id
      ] ?? 0;

    if (
      currentCompleted >=
      currentExercise.sets
    ) {
      return;
    }

    const parsedWeight =
      Number.parseFloat(actualWeight);

    const parsedReps =
      Number.parseInt(
        actualReps,
        10,
      );

    if (
      !Number.isFinite(
        parsedWeight,
      ) ||
      parsedWeight < 0 ||
      !Number.isFinite(
        parsedReps,
      ) ||
      parsedReps < 0
    ) {
      setPerformanceMessage(
        "Enter your actual weight and reps first.",
      );
      return;
    }

    const targetWeight =
      Number.parseFloat(
        currentExercise.weight.replace(
          /[^0-9.]/g,
          "",
        ),
      );

    if (
      !Number.isFinite(
        targetWeight,
      ) ||
      targetWeight <= 0
    ) {
      setPerformanceMessage(
        "Unable to read the target weight for this exercise.",
      );
      return;
    }

    const result =
      calculatePerformance({
        targetWeight,
        targetReps:
          currentExercise.reps,
        actualWeight:
          parsedWeight,
        actualReps:
          parsedReps,
        targetSets:
          currentExercise.sets,
        completedSets:
          currentCompleted + 1,
      });

    setPerformanceResult(result);
    setPerformanceMessage(
      "Performance recorded.",
    );

    completeSet(
      currentExercise.id,
    );

    recordExercisePerformance(
      currentExercise.id,
      parsedWeight,
      parsedReps,
    );

    setActualWeight("");
    setActualReps("");

    const nextCompleted =
      currentCompleted + 1;

    if (
      nextCompleted >=
      currentExercise.sets
    ) {
      const nextExerciseIndex =
        activeExercise + 1;

      if (
        nextExerciseIndex <
        exercises.length
      ) {
        setActiveExercise(
          nextExerciseIndex,
        );
      }
    }

    if (
      completedSetCount + 1 >=
      totalSets
    ) {
      completeMission();
      setShowComplete(true);
    }
  };

  /* ---------------------------------------------
     SELECT EXERCISE
  ---------------------------------------------- */

  const selectExercise = (
    index: number,
  ) => {
    if (missionCompleted) {
      return;
    }

    setActiveExercise(index);
    setActualWeight("");
    setActualReps("");
    setPerformanceMessage("");
    setPerformanceResult(null);
  };

  /* ---------------------------------------------
     GENERATE NEXT MISSION
  ---------------------------------------------- */

  const handleNextMission = () => {
    setShowComplete(false);

    generateNextMission();

    setActiveExercise(0);
    setActualWeight("");
    setActualReps("");
    setPerformanceMessage("");
    setPerformanceResult(null);
  };

  /* ---------------------------------------------
     SAFETY
  ---------------------------------------------- */

  if (!mission || !currentExercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="text-sm font-black tracking-[0.2em]">
            INITIALIZING MISSION
          </div>

          <div className="mt-2 text-xs text-white/30">
            Fitness Engine is preparing your
            training protocol...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[150px]" />

        <div className="absolute bottom-[-200px] right-[-150px] h-[500px] w-[500px] rounded-full bg-fuchsia-600/5 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-20 items-center justify-between border-b border-white/[0.06] px-5 sm:px-8">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-bold text-white/60 transition hover:bg-white/[0.07] hover:text-white"
        >
          <ArrowLeft size={15} />

          EXIT MISSION
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <Shield
            size={15}
            className="text-violet-400"
          />

          <span className="text-[10px] font-black tracking-[0.22em] text-white/35">
            MISSION {mission.id}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2">
          <Zap
            size={14}
            className="text-yellow-400"
            fill="currentColor"
          />

          <span className="text-xs font-black">
            {xp.toLocaleString()} XP
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1250px] p-5 sm:p-8">
        {/* Mission title */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles
              size={15}
              className="text-violet-400"
            />

            <span className="text-[10px] font-black tracking-[0.25em] text-violet-300">
              ACTIVE MISSION
            </span>
          </div>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-400/10 bg-violet-400/[0.05] px-3 py-1 text-[9px] font-black tracking-[0.16em] text-violet-300">
                  {mission.priority} PRIORITY
                </span>

                <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1 text-[9px] font-black tracking-[0.16em] text-white/35">
                  {mission.targetMuscle}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                {mission.title}
              </h1>

              <p className="mt-3 text-sm text-white/35">
                {mission.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-5 text-xs text-white/35">
              <div className="flex items-center gap-2">
                <Clock3 size={14} />

                ~{mission.estimatedMinutes} MIN
              </div>

              <div className="flex items-center gap-2">
                <Target size={14} />

                {totalSets} SETS
              </div>

              <div className="flex items-center gap-2">
                <Zap
                  size={14}
                  className="text-yellow-400"
                />

                +{missionXP} XP
              </div>
            </div>
          </div>
        </section>

        {/* Weekly schedule / workout rotation */}
        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[9px] font-black tracking-[0.22em] text-violet-300">
                WEEKLY GYM PROGRAM
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-400/15 bg-violet-400/[0.07] px-3 py-1 text-[10px] font-black tracking-[0.12em] text-violet-200">
                  WORKOUT {workoutNumber}
                </span>

                {scheduleDay && (
                  <span className="text-xs font-bold text-white/45">
                    {scheduleDay}
                  </span>
                )}

                {todayScheduledMuscle && (
                  <span className="text-xs font-bold text-white/65">
                    · {todayScheduledMuscle}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-white/30">
                Choose the workout rotation from your gym's program.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowWorkoutSelector(
                  (visible) => !visible,
                )
              }
              className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-[10px] font-black tracking-[0.16em] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              CHANGE WORKOUT
            </button>
          </div>

          {showWorkoutSelector && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map(
                (number) => {
                  const selected =
                    workoutNumber === number;

                  return (
                    <button
                      key={number}
                      type="button"
                      onClick={() => {
                        setWorkoutNumber(
                          number as 1 | 2 | 3,
                        );

                        setShowWorkoutSelector(
                          false,
                        );

                        setActiveExercise(0);
                        setShowComplete(false);
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-violet-500/30 bg-violet-500/[0.09]"
                          : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black tracking-[0.18em] text-white/30">
                          PROGRAM
                        </span>

                        {selected && (
                          <Check
                            size={15}
                            className="text-violet-300"
                          />
                        )}
                      </div>

                      <div className="mt-2 text-lg font-black">
                        WORKOUT {number}
                      </div>

                      <div className="mt-1 text-[10px] text-white/35">
                        {selected
                          ? "ACTIVE ROTATION"
                          : "SELECT ROTATION"}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* System decision */}
        <section className="mb-6 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Sparkles size={17} />
            </div>

            <div>
              <div className="text-[9px] font-black tracking-[0.22em] text-cyan-300">
                FITNESS ENGINE DECISION
              </div>

              <div className="mt-1 text-sm font-black">
                {mission.targetMuscle} SELECTED
              </div>

              <p className="mt-1 text-xs leading-5 text-white/35">
                This mission was generated from
                your recent training history,
                performance and recovery data.
              </p>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] text-white/30">
                MISSION PROGRESS
              </div>

              <div className="mt-1 text-sm font-bold">
                {completedSetCount} /{" "}
                {totalSets} SETS COMPLETE
              </div>
            </div>

            <span className="text-lg font-black text-violet-300">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Exercise list */}
          <aside className="space-y-2">
            <div className="mb-3 px-1 text-[10px] font-black tracking-[0.2em] text-white/25">
              OBJECTIVES
            </div>

            {exercises.map(
              (exercise, index) => {
                const completed =
                  completedSets[
                    exercise.id
                  ] ?? 0;

                const isActive =
                  index === activeExercise;

                const isComplete =
                  completed >=
                  exercise.sets;

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() =>
                      selectExercise(
                        index,
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-violet-500/30 bg-violet-500/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isComplete
                            ? "bg-emerald-400/10 text-emerald-400"
                            : isActive
                              ? "bg-violet-500/15 text-violet-300"
                              : "bg-white/[0.05] text-white/30"
                        }`}
                      >
                        {isComplete ? (
                          <Check size={17} />
                        ) : (
                          <span className="text-xs font-black">
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold">
                          {exercise.name}
                        </div>

                        <div className="mt-1 text-[10px] text-white/30">
                          {completed}/
                          {exercise.sets} SETS ·{" "}
                          {exercise.weight}
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className="shrink-0 text-white/20"
                      />
                    </div>
                  </button>
                );
              },
            )}
          </aside>

          {/* Active exercise */}
          <section className="rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.08] via-white/[0.025] to-transparent p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Dumbbell
                    size={16}
                    className="text-violet-400"
                  />

                  <span className="text-[10px] font-black tracking-[0.22em] text-violet-300">
                    OBJECTIVE{" "}
                    {String(
                      activeExercise + 1,
                    ).padStart(2, "0")}
                  </span>
                </div>

                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {currentExercise.name}
                </h2>

                <p className="mt-2 text-xs font-bold text-white/30">
                  {currentExercise.muscle}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <Zap
                  size={15}
                  className="text-yellow-400"
                />

                <span className="text-xs font-black">
                  +{currentExercise.xpPerSet} XP /
                  SET
                </span>
              </div>
            </div>

            {/* Target */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                label="WEIGHT"
                value={
                  currentExercise.weight
                }
              />

              <Metric
                label="TARGET REPS"
                value={`${currentExercise.reps}`}
              />

              <Metric
                label="TOTAL SETS"
                value={`${currentExercise.sets}`}
                className="col-span-2 sm:col-span-1"
              />
            </div>

            {/* Set tracker */}
            <div className="mt-8">
              <div className="mb-3 text-[10px] font-black tracking-[0.2em] text-white/25">
                SET PROGRESSION
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {Array.from({
                  length:
                    currentExercise.sets,
                }).map(
                  (_, index) => {
                    const completed =
                      (completedSets[
                        currentExercise.id
                      ] ?? 0) > index;

                    const current =
                      (completedSets[
                        currentExercise.id
                      ] ?? 0) === index;

                    return (
                      <div
                        key={index}
                        className={`rounded-2xl border p-5 text-center transition ${
                          completed
                            ? "border-emerald-400/20 bg-emerald-400/[0.07]"
                            : current
                              ? "border-violet-500/30 bg-violet-500/[0.08]"
                              : "border-white/[0.06] bg-black/20"
                        }`}
                      >
                        <div className="text-[9px] font-black tracking-[0.18em] text-white/25">
                          SET {index + 1}
                        </div>

                        <div className="mt-2 text-2xl font-black">
                          {completed ? (
                            <Check
                              size={24}
                              className="mx-auto text-emerald-400"
                            />
                          ) : (
                            currentExercise.reps
                          )}
                        </div>

                        <div className="mt-1 text-[9px] text-white/25">
                          {completed
                            ? "COMPLETE"
                            : "REPS"}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Actual performance */}
            <div className="mt-8 rounded-2xl border border-white/[0.07] bg-black/20 p-5">
              <div className="mb-4">
                <div className="text-[10px] font-black tracking-[0.2em] text-white/30">
                  ACTUAL PERFORMANCE
                </div>
                <p className="mt-1 text-xs text-white/30">
                  Record the weight and reps you actually completed for this set.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[9px] font-black tracking-[0.16em] text-white/30">
                    ACTUAL WEIGHT (KG)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={actualWeight}
                    onChange={(event) =>
                      setActualWeight(event.target.value)
                    }
                    disabled={
                      missionCompleted ||
                      (completedSets[currentExercise.id] ?? 0) >=
                        currentExercise.sets
                    }
                    placeholder={currentExercise.weight.replace(
                      /[^0-9.]/g,
                      "",
                    )}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-violet-500/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[9px] font-black tracking-[0.16em] text-white/30">
                    ACTUAL REPS
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={actualReps}
                    onChange={(event) =>
                      setActualReps(event.target.value)
                    }
                    disabled={
                      missionCompleted ||
                      (completedSets[currentExercise.id] ?? 0) >=
                        currentExercise.sets
                    }
                    placeholder={`${currentExercise.reps}`}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-violet-500/40"
                  />
                </label>
              </div>

              {performanceMessage && (
                <div className="mt-3 rounded-xl border border-violet-400/10 bg-violet-400/[0.05] px-4 py-3 text-xs font-bold text-violet-200">
                  {performanceMessage}
                </div>
              )}

              {performanceResult && (
                <div className="mt-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[9px] font-black tracking-[0.18em] text-white/30">
                        PERFORMANCE RESULT
                      </div>
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-3xl font-black text-emerald-300">
                          {performanceResult.score}%
                        </span>
                        <span className="text-[10px] font-black tracking-[0.16em] text-white/45">
                          {performanceResult.status}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                      <div className="text-[8px] font-black tracking-[0.15em] text-white/25">
                        RECOMMENDATION
                      </div>
                      <div className="mt-1 text-sm font-black">
                        {performanceResult.recommendation}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-white/40">
                    {performanceResult.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Action */}
            <button
              type="button"
              disabled={
                missionCompleted ||
                (completedSets[
                  currentExercise.id
                ] ?? 0) >=
                  currentExercise.sets
              }
              onClick={
                handleCompleteSet
              }
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-5 text-sm font-black text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {missionCompleted ? (
                <>
                  <Check size={18} />

                  MISSION COMPLETE
                </>
              ) : (
                <>
                  {(completedSets[
                    currentExercise.id
                  ] ?? 0) >=
                  currentExercise.sets ? (
                    <>
                      <Check size={18} />
                      EXERCISE COMPLETE
                    </>
                  ) : (
                    <>
                      <Play
                        size={18}
                        fill="currentColor"
                      />

                      COMPLETE SET{" "}
                      {(completedSets[
                        currentExercise.id
                      ] ?? 0) + 1}
                    </>
                  )}
                </>
              )}
            </button>
          </section>
        </div>

        {/* Coach signal */}
        <section className="mt-6 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Sparkles size={17} />
            </div>

            <div>
              <div className="text-[10px] font-black tracking-[0.2em] text-cyan-300">
                COACH SIGNAL
              </div>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Your mission was selected by
                the Fitness Engine based on your
                training history. Complete each
                set with controlled technique and
                record your actual performance.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------
          MISSION COMPLETE
      -------------------------------------------- */}

      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-[28px] border border-violet-500/20 bg-[#0b0810] p-8 text-center shadow-2xl shadow-violet-950/30">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-xl shadow-violet-500/20">
              <Trophy size={28} />
            </div>

            <div className="mt-6 text-[10px] font-black tracking-[0.3em] text-violet-300">
              MISSION COMPLETE
            </div>

            <h2 className="mt-2 text-4xl font-black">
              {mission.title}
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">
              All objectives completed. Your
              performance has been recorded.
              The Fitness Engine is ready to
              calculate your next mission.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3">
              <Reward
                label="XP EARNED"
                value={`+${missionXP}`}
              />

              <Reward
                label="SETS"
                value={`${totalSets}`}
              />

              <Reward
                label="LEVEL"
                value={`${level}`}
              />
            </div>

            <button
              type="button"
              onClick={
                handleNextMission
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-xs font-black text-black transition hover:bg-white/90"
            >
              <Zap size={15} />

              GENERATE NEXT MISSION
            </button>

            <button
              type="button"
              onClick={() =>
                setShowComplete(false)
              }
              className="mt-3 w-full rounded-xl border border-white/[0.07] py-4 text-xs font-bold text-white/40 transition hover:bg-white/[0.04] hover:text-white"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------
          LEVEL UP
      -------------------------------------------- */}

      {levelUp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-5 backdrop-blur-xl">
          <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-yellow-400/20 bg-[#0b0810] text-center shadow-2xl shadow-violet-950/40">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-yellow-400/10 to-transparent" />

            <div className="relative px-8 pb-8 pt-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-yellow-400/20 bg-yellow-400/10">
                <Trophy
                  size={36}
                  className="text-yellow-300"
                />
              </div>

              <div className="mt-7 text-[10px] font-black tracking-[0.35em] text-yellow-300">
                LEVEL UP
              </div>

              <h2 className="mt-2 text-5xl font-black">
                LEVEL {level}
              </h2>

              <div className="mt-3 text-sm font-black tracking-[0.2em] text-violet-300">
                {rank.name}
              </div>

              <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/40">
                Your training performance
                has unlocked a new progression
                tier.
              </p>

              <div className="mt-7 grid grid-cols-3 gap-3">
                <Reward
                  label="STRENGTH"
                  value="+2"
                />

                <Reward
                  label="CONSISTENCY"
                  value="+1"
                />

                <Reward
                  label="ENERGY"
                  value="+5"
                />
              </div>

              <button
                type="button"
                onClick={
                  dismissLevelUp
                }
                className="mt-7 w-full rounded-2xl bg-white py-4 text-xs font-black text-black transition hover:bg-white/90"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------
   METRIC
---------------------------------------------- */

function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-black/20 p-5 ${className}`}
    >
      <div className="text-[9px] font-black tracking-[0.18em] text-white/25">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------
   REWARD
---------------------------------------------- */

function Reward({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="text-[8px] font-black tracking-[0.15em] text-white/25">
        {label}
      </div>

      <div className="mt-2 text-xl font-black text-violet-300">
        {value}
      </div>
    </div>
  );
}

export default Mission;