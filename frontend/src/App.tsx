import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Map,
  Play,
  Shield,
  Sparkles,
  Trophy,
  User,
  Zap,
} from "lucide-react";

import Mission from "./pages/Mission";
import Progress from "./pages/Progress";
import WorkoutHistory from "./pages/WorkoutHistory";

import {
  getFitnessRank,
  getNextUnlock,
  useGymStore,
} from "./store/gymStore";

const COACH_API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3001";

function App() {
  /* ---------------------------------------------
     PAGE
  ---------------------------------------------- */

  const [page, setPage] = useState<
    "dashboard" | "mission" | "history" | "progress"
  >("dashboard");

  /* ---------------------------------------------
     PLAYER
  ---------------------------------------------- */

  const xp = useGymStore(
    (state) => state.xp,
  );

  const level = useGymStore(
    (state) => state.level,
  );

  const streak = useGymStore(
    (state) => state.streak,
  );

  const energy = useGymStore(
    (state) => state.energy,
  );

  const strength = useGymStore(
    (state) => state.strength,
  );

  const stamina = useGymStore(
    (state) => state.stamina,
  );

  const consistency = useGymStore(
    (state) => state.consistency,
  );

  /* ---------------------------------------------
     MISSION
  ---------------------------------------------- */

  const mission = useGymStore(
    (state) => state.mission,
  );

  const missionCompleted =
    useGymStore(
      (state) =>
        state.missionCompleted,
    );

  const exercises = useGymStore(
    (state) => state.exercises,
  );

  const completedSets =
    useGymStore(
      (state) => state.completedSets,
    );

  const recommendedMuscle =
    useGymStore(
      (state) =>
        state.recommendedMuscle,
    );

  const missionPriority =
    useGymStore(
      (state) =>
        state.missionPriority,
    );

  const missionReason =
    useGymStore(
      (state) =>
        state.missionReason,
    );

  /* ---------------------------------------------
     RECOVERY
  ---------------------------------------------- */

  const recovery = useGymStore(
    (state) => state.recovery,
  );

  /* ---------------------------------------------
     AI COACH
  ---------------------------------------------- */

  const coachInsight =
    useGymStore(
      (state) =>
        state.coachInsight,
    );

  const storeCoachResponse =
    useGymStore(
      (state) => state.coachResponse,
    );

  const [coachResponse, setCoachResponse] =
    useState<{
      answer: string;
      reason: string;
      action: string;
    } | null>(storeCoachResponse ?? null);

  const [coachQuestion, setCoachQuestion] =
    useState("");

  const [isThinking, setIsThinking] =
    useState(false);

  /* ---------------------------------------------
     RANK
  ---------------------------------------------- */

  const rank =
    getFitnessRank(level);

  const nextUnlock =
    getNextUnlock(level);

  /* ---------------------------------------------
     STATS
  ---------------------------------------------- */

  const stats = [
    {
      label: "STRENGTH",
      value: strength,
      change: "+8%",
      icon: Dumbbell,
    },
    {
      label: "STAMINA",
      value: stamina,
      change: "+5%",
      icon: Activity,
    },
    {
      label: "CONSISTENCY",
      value: consistency,
      change: "+12%",
      icon: Flame,
    },
  ];

  /* ---------------------------------------------
     MISSION PROGRESS
  ---------------------------------------------- */

  const completedSetCount =
    Object.values(
      completedSets,
    ).reduce(
      (total, count) =>
        total + count,
      0,
    );

  const totalSets =
    exercises.reduce(
      (total, exercise) =>
        total + exercise.sets,
      0,
    );

  const missionProgress =
    totalSets === 0
      ? 0
      : Math.round(
        (completedSetCount /
          totalSets) *
        100,
      );

  /* ---------------------------------------------
     ASK COACH
  ---------------------------------------------- */

  const handleAskCoach = async () => {
    const question = coachQuestion.trim();

    if (!question || isThinking) {
      return;
    }

    setIsThinking(true);

    try {
      const response = await fetch(
        `${COACH_API_URL}/api/coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-GYM-SESSION": getGymSessionId(),
          },
          body: JSON.stringify({
            question,

            context: {
              level,
              xp,
              strength,
              stamina,
              consistency,
              energy,

              recovery: {
                score: recovery.score,
                state: recovery.state,
                intensity: recovery.intensity,
                recommendation:
                  recovery.recommendation,
                warning:
                  recovery.warning,
              },

              mission: {
                id: mission.id,
                title: mission.title,
                targetMuscle:
                  mission.targetMuscle,
                estimatedMinutes:
                  mission.estimatedMinutes,
                xpReward:
                  mission.xpReward,
              },

              recommendedMuscle,
              missionPriority,
              missionReason,

              exercises: exercises.map(
                (exercise) => ({
                  id: exercise.id,
                  name: exercise.name,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  weight: exercise.weight,
                }),
              ),
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Coach API error: ${response.status}`,
        );
      }

      const data = await response.json();

      setCoachResponse({
        answer:
          data.answer ??
          "I couldn't generate an answer.",
        reason:
          data.reason ??
          "No reasoning was returned.",
        action:
          data.action ??
          "Continue following your current mission.",
      });

      setCoachQuestion("");
    } catch (error) {
      console.error(
        "AI Coach request failed:",
        error,
      );

      setCoachResponse({
        answer:
          "I couldn't connect to the GYM OS Coach server.",
        reason:
          "The Coach API is currently unavailable.",
        action:
          "Make sure the backend is running on port 3001.",
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleCoachKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleAskCoach();
    }
  };

  const suggestedQuestions = [
    "Why did I get this mission?",
    "How is my recovery?",
    "Should I increase my weight?",
    "What should I focus on?",
  ];

  // Session ID management for AI Coach interactions
  const getGymSessionId = () => {
    const existing =
      sessionStorage.getItem(
        "gym_os_coach_session",
      );

    if (existing) {
      return existing;
    }

    const newSession =
      crypto.randomUUID();

    sessionStorage.setItem(
      "gym_os_coach_session",
      newSession,
    );

    return newSession;
  };


  if (page === "progress") {
    return <Progress />;
  }
  /* ---------------------------------------------
     WORKOUT HISTORY PAGE
  ---------------------------------------------- */

  if (page === "history") {
    return (
      <WorkoutHistory />
    );
  }

  /* ---------------------------------------------
     MISSION PAGE
  ---------------------------------------------- */

  if (page === "mission") {
    return (
      <Mission
        onExit={() =>
          setPage("dashboard")
        }
      />
    );
  }

  /* ---------------------------------------------
     DASHBOARD
  ---------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-violet-500/30">
      {/* -----------------------------------------
          BACKGROUND
      ------------------------------------------ */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[140px]" />

        <div className="absolute right-[-200px] top-[25%] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[160px]" />

        <div className="absolute bottom-[-250px] left-[35%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/5 blur-[160px]" />
      </div>

      <div className="relative flex min-h-screen">

        {/* ---------------------------------------
            SIDEBAR
        ---------------------------------------- */}

        <aside className="hidden w-64 shrink-0 border-r border-white/[0.06] bg-black/30 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">

          {/* Logo */}

          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
              <Zap
                size={19}
                fill="currentColor"
              />
            </div>

            <div>
              <div className="text-sm font-black tracking-[0.22em]">
                GYM OS
              </div>

              <div className="text-[9px] font-medium tracking-[0.25em] text-white/35">
                FITNESS SYSTEM
              </div>
            </div>
          </div>

          {/* Navigation */}

          <nav className="space-y-2">
            <NavItem
              icon={Gauge}
              label="Command Center"
              active
            />

            <NavItem
              icon={Dumbbell}
              label="Missions"
              onClick={() =>
                setPage("mission")
              }
            />

            <NavItem
              icon={Activity}
              label="Progress"
              onClick={() =>
                setPage("progress")
              }
            />

            <NavItem
              icon={Map}
              label="Journey"
            />

            <NavItem
              icon={Brain}
              label="AI Coach"
            />
          </nav>

          <div className="mt-auto">

            {/* Energy */}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.18em] text-white/40">
                  FITNESS ENERGY
                </span>

                <Flame
                  size={14}
                  className="text-orange-400"
                />
              </div>

              <div className="mb-2 flex items-end justify-between">
                <span className="text-2xl font-black">
                  {energy}
                </span>

                <span className="text-xs text-white/30">
                  / 100
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{
                    width: `${energy}%`,
                  }}
                />
              </div>
            </div>

            {/* Profile */}

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <User size={17} />
              </div>

              <div className="min-w-0">
                <div className="truncate text-xs font-bold">
                  PRATHAMESH
                </div>

                <div className="text-[10px] font-black tracking-[0.18em] text-violet-300">
                  {rank.name}
                </div>

                <div className="mt-1 text-[10px] text-white/35">
                  LEVEL {level}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ---------------------------------------
            MAIN
        ---------------------------------------- */}

        <main className="min-w-0 flex-1">

          {/* Top bar */}

          <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-5 sm:px-8">
            <div>
              <div className="text-[10px] font-bold tracking-[0.25em] text-white/30">
                TUESDAY · AUG 25
              </div>

              <h1 className="mt-1 text-xl font-black tracking-tight">
                COMMAND CENTER
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2 sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[10px] font-bold tracking-wider text-white/50">
                  SYSTEM ONLINE
                </span>
              </div>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] transition hover:bg-white/[0.06]"
              >
                <User size={17} />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">

            {/* -------------------------------------
                HERO
            -------------------------------------- */}

            <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.12] via-white/[0.025] to-transparent p-6 sm:p-8">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-violet-500/[0.08] to-transparent" />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_280px]">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles
                      size={15}
                      className="text-violet-400"
                    />

                    <span className="text-[10px] font-black tracking-[0.25em] text-violet-300">
                      FITNESS SYSTEM ONLINE
                    </span>
                  </div>

                  <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                    Good morning,
                    <br />

                    <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                      Prathamesh.
                    </span>
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
                    Your system analyzed your
                    recent performance. Your
                    training profile is ready for
                    another push.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPage("mission")
                      }
                      className="group flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-xs font-black text-black transition hover:scale-[1.02]"
                    >
                      <Play
                        size={14}
                        fill="currentColor"
                      />

                      ENTER MISSION

                      <ArrowUpRight
                        size={14}
                        className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(
                            "system-analysis",
                          )
                          ?.scrollIntoView({
                            behavior:
                              "smooth",
                          })
                      }
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold text-white/70 transition hover:bg-white/[0.08]"
                    >
                      VIEW ANALYSIS
                    </button>
                  </div>
                </div>

                {/* Level */}

                <div className="flex flex-col justify-center rounded-2xl border border-white/[0.07] bg-black/30 p-5 backdrop-blur-xl">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/35">
                      CURRENT LEVEL
                    </span>

                    <Trophy
                      size={16}
                      className="text-yellow-400"
                    />
                  </div>

                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-black leading-none">
                      {level}
                    </span>

                    <span className="mb-1 text-xs font-bold text-white/30">
                      LEVEL
                    </span>
                  </div>

                  <div className="mt-3 text-[10px] font-black tracking-[0.2em] text-violet-300">
                    {rank.name}
                  </div>

                  <div className="mt-6 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-white/40">
                      {xp.toLocaleString()} XP
                    </span>

                    <span className="text-white/25">
                      {getNextLevelXPDisplay(
                        level,
                      )}{" "}
                      XP
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((xp % 500) /
                            500) *
                          100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------------------------
                NEXT UNLOCK
            -------------------------------------- */}

            {nextUnlock && (
              <section className="mt-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.025] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-lg">
                      {nextUnlock.icon}
                    </div>

                    <div>
                      <div className="text-[9px] font-black tracking-[0.2em] text-yellow-300">
                        NEXT UNLOCK
                      </div>

                      <div className="mt-1 text-sm font-black">
                        {nextUnlock.name}
                      </div>

                      <div className="mt-1 text-xs text-white/30">
                        {nextUnlock.description}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[9px] font-black tracking-[0.15em] text-white/25">
                      UNLOCKS
                    </div>

                    <div className="mt-1 text-sm font-black text-violet-300">
                      LEVEL{" "}
                      {nextUnlock.level}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* -------------------------------------
                STATS
            -------------------------------------- */}

            <section className="mt-5 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                        <Icon size={17} />
                      </div>

                      <span className="text-[10px] font-bold text-emerald-400">
                        {stat.change}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-bold tracking-[0.2em] text-white/30">
                          {stat.label}
                        </div>

                        <div className="mt-1 text-3xl font-black">
                          {stat.value}
                        </div>
                      </div>

                      <span className="text-xs text-white/20">
                        /100
                      </span>
                    </div>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-all duration-500"
                        style={{
                          width: `${stat.value}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>

            {/* -------------------------------------
                SYSTEM ANALYSIS
            -------------------------------------- */}

            <section
              id="system-analysis"
              className="mt-5 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <Brain size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] font-black tracking-[0.22em] text-cyan-300">
                      SYSTEM ANALYSIS
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-black tracking-[0.15em] ${missionPriority ===
                        "HIGH"
                        ? "bg-red-400/10 text-red-300"
                        : missionPriority ===
                          "MEDIUM"
                          ? "bg-yellow-400/10 text-yellow-300"
                          : "bg-emerald-400/10 text-emerald-300"
                        }`}
                    >
                      PRIORITY:{" "}
                      {missionPriority}
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-black">
                    {recommendedMuscle}{" "}
                    TRAINING DETECTED
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
                    {missionReason}
                  </p>
                </div>
              </div>
            </section>

            {/* -------------------------------------
                TRAINING READINESS
            -------------------------------------- */}

            <section className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025] p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4 sm:w-1/2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <HeartPulse size={20} />
                  </div>

                  <div>
                    <div className="text-[9px] font-black tracking-[0.22em] text-emerald-300">
                      TRAINING READINESS
                    </div>

                    <div className="mt-1 text-xl font-black">
                      {recovery.state}
                    </div>

                    <p className="mt-1 text-xs text-white/30">
                      {
                        recovery.recommendation
                      }
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex items-end justify-between">
                    <div className="text-[9px] font-black tracking-[0.18em] text-white/25">
                      RECOVERY SCORE
                    </div>

                    <div className="text-2xl font-black text-emerald-300">
                      {recovery.score}%
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{
                        width: `${recovery.score}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[9px] font-bold text-white/20">
                    <span>LOW</span>
                    <span>
                      MODERATE
                    </span>
                    <span>
                      EXCELLENT
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:w-48">
                  <ReadinessStat
                    label="ENERGY"
                    value={`${energy}%`}
                  />

                  <ReadinessStat
                    label="INTENSITY"
                    value={
                      recovery.intensity
                    }
                  />
                </div>
              </div>

              {recovery.warning && (
                <div className="mt-4 border-t border-white/[0.05] pt-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/35">
                    <Zap size={12} />
                    {
                      recovery.warning
                    }
                  </div>
                </div>
              )}
            </section>

            {/* -------------------------------------
                AI COACH
            -------------------------------------- */}

            <section className="mt-5 rounded-2xl border border-violet-400/10 bg-violet-400/[0.025] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                  <Sparkles size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[9px] font-black tracking-[0.22em] text-violet-300">
                        AI COACH
                      </div>

                      <h3 className="mt-1 text-lg font-black">
                        {
                          coachInsight.headline
                        }
                      </h3>
                    </div>

                    <div className="rounded-full border border-violet-400/10 bg-violet-400/[0.05] px-3 py-1 text-[9px] font-black tracking-[0.15em] text-violet-300">
                      LIVE ANALYSIS
                    </div>
                  </div>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">
                    {
                      coachInsight.explanation
                    }
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <CoachInsightBox
                      label="FOCUS"
                      value={
                        coachInsight.focus
                      }
                    />

                    <CoachInsightBox
                      label="NEXT STEP"
                      value={
                        coachInsight.nextStep
                      }
                    />
                  </div>

                  {/* Suggested Questions */}

                  <div className="mt-5">
                    <div className="mb-2 text-[9px] font-black tracking-[0.18em] text-white/25">
                      QUICK QUESTIONS
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map(
                        (question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => {
                              setCoachQuestion(
                                question,
                              );

                              window.setTimeout(
                                () => {
                                  handleAskCoach();
                                },
                                0,
                              );
                            }}
                            className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[9px] font-bold text-white/40 transition hover:border-violet-400/20 hover:bg-violet-400/[0.05] hover:text-violet-200"
                          >
                            {question}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Input */}

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={coachQuestion}
                      onChange={(event) =>
                        setCoachQuestion(
                          event.target.value,
                        )
                      }
                      onKeyDown={
                        handleCoachKeyDown
                      }
                      placeholder="Ask your coach..."
                      className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-violet-400/30"
                    />

                    <button
                      type="button"
                      onClick={
                        handleAskCoach
                      }
                      disabled={
                        isThinking ||
                        !coachQuestion.trim()
                      }
                      className="rounded-xl bg-violet-500 px-5 py-3 text-xs font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isThinking
                        ? "THINKING..."
                        : "ASK COACH"}
                    </button>
                  </div>

                  {/* Coach Response */}

                  {coachResponse && (
                    <div className="mt-5 rounded-2xl border border-violet-400/10 bg-black/20 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Brain
                          size={14}
                          className="text-violet-300"
                        />

                        <span className="text-[9px] font-black tracking-[0.2em] text-violet-300">
                          COACH RESPONSE
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-white/70">
                        {
                          coachResponse.answer
                        }
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <CoachInsightBox
                          label="WHY"
                          value={
                            coachResponse.reason
                          }
                        />

                        <CoachInsightBox
                          label="ACTION"
                          value={
                            coachResponse.action
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* -------------------------------------
                CURRENT MISSION
            -------------------------------------- */}

            <section className="mt-5">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Shield
                        size={14}
                        className="text-violet-400"
                      />

                      <span className="text-[10px] font-black tracking-[0.2em] text-violet-300">
                        MISSION{" "}
                        {mission.id}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight">
                      {mission.title}
                    </h3>

                    <p className="mt-1 text-xs text-white/35">
                      {mission.targetMuscle}{" "}
                      · Estimated{" "}
                      {
                        mission.estimatedMinutes
                      }{" "}
                      min
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border px-3 py-2 text-center ${missionCompleted
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : "border-violet-500/20 bg-violet-500/10"
                      }`}
                  >
                    <div className="text-[9px] font-bold tracking-widest text-violet-300">
                      REWARD
                    </div>

                    <div
                      className={`mt-1 text-sm font-black ${missionCompleted
                        ? "text-emerald-300"
                        : "text-violet-200"
                        }`}
                    >
                      {missionCompleted
                        ? "COMPLETE"
                        : `+${mission.xpReward} XP`}
                    </div>
                  </div>
                </div>

                {/* Progress */}

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-white/30">
                    MISSION PROGRESS
                  </span>

                  <span className="text-xs font-bold">
                    {completedSetCount}{" "}
                    / {totalSets}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{
                      width: `${missionProgress}%`,
                    }}
                  />
                </div>

                {/* Exercises */}

                <div className="mt-5 space-y-2">
                  {exercises.map(
                    (
                      exercise,
                      index,
                    ) => {
                      const completed =
                        completedSets[
                        exercise.id
                        ] ?? 0;

                      return (
                        <div
                          key={
                            exercise.id
                          }
                          className="group flex items-center gap-4 rounded-xl border border-white/[0.05] bg-black/20 p-4 transition hover:border-white/[0.1] hover:bg-white/[0.03]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-black text-white/30">
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold">
                              {
                                exercise.name
                              }
                            </div>

                            <div className="mt-1 text-[10px] text-white/30">
                              {
                                exercise.sets
                              }{" "}
                              ×{" "}
                              {
                                exercise.reps
                              }{" "}
                              ·{" "}
                              {
                                exercise.weight
                              }
                            </div>
                          </div>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-wider ${completed >=
                              exercise.sets
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : "border-white/[0.06] text-white/30"
                              }`}
                          >
                            {completed >=
                              exercise.sets
                              ? "DONE"
                              : `${completed}/${exercise.sets}`}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPage("mission")
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-black text-black transition hover:bg-white/90"
                >
                  <Play
                    size={14}
                    fill="currentColor"
                  />

                  {missionCompleted
                    ? "VIEW MISSION"
                    : "ENTER MISSION"}
                </button>
              </div>
            </section>

            {/* -------------------------------------
                BOTTOM
            -------------------------------------- */}

            <section className="mt-5 grid gap-5 md:grid-cols-2">

              {/* Streak */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black tracking-[0.2em] text-white/30">
                      CURRENT STREAK
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Flame
                        size={20}
                        className="text-orange-400"
                      />

                      <span className="text-3xl font-black">
                        {streak}
                      </span>

                      <span className="text-xs text-white/30">
                        DAYS
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-bold text-white/25">
                      PERSONAL BEST
                    </div>

                    <div className="mt-1 text-sm font-black">
                      18 DAYS
                    </div>
                  </div>
                </div>
              </div>

              {/* Recovery */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                    <HeartPulse
                      size={19}
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-black tracking-[0.2em] text-white/30">
                      RECOVERY STATUS
                    </div>

                    <div className="mt-1 text-sm font-black">
                      {recovery.state}
                    </div>
                  </div>

                  <div className="ml-auto text-2xl font-black text-emerald-400">
                    {recovery.score}%
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =================================================
   NAV ITEM
================================================= */

function NavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof Gauge;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${active
        ? "bg-white/[0.07] text-white"
        : "text-white/35 hover:bg-white/[0.04] hover:text-white/70"
        }`}
    >
      <Icon size={16} />

      <span>{label}</span>

      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
      )}
    </button>
  );
}

/* =================================================
   READINESS STAT
================================================= */

function ReadinessStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="text-[8px] font-black tracking-[0.15em] text-white/25">
        {label}
      </div>

      <div className="mt-1 text-xs font-black text-white/70">
        {value}
      </div>
    </div>
  );
}

/* =================================================
   COACH INSIGHT BOX
================================================= */

function CoachInsightBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="text-[8px] font-black tracking-[0.18em] text-white/25">
        {label}
      </div>

      <p className="mt-2 text-xs leading-5 text-white/55">
        {value}
      </p>
    </div>
  );
}

/* =================================================
   XP DISPLAY
================================================= */

function getNextLevelXPDisplay(
  level: number,
) {
  return (level - 2) * 500;
}

export default App;