import { useMemo, useState } from "react";
import {
  getWorkoutHistory,
  type WorkoutHistoryRecord,
} from "../engine/workoutHistory";

import ProgressChart from "../components/ProgressChart";

import {
  getPersonalRecords,
  detectNewPR,
  type PersonalRecord,
  type NewPR,
} from "../engine/personalRecords";

export default function Progress() {
  const history = useMemo(
    () => getWorkoutHistory(),
    [],
  );

  const newPRs = useMemo<NewPR[]>(
    () => {
      if (history.length === 0) {
        return [];
      }

      const latest = history[0];

      return detectNewPR(
        latest,
        history,
      );
    },
    [history],
  );

  const weeklySummary = useMemo(() => {
    const weekStart =
      new Date();

    weekStart.setHours(
      0,
      0,
      0,
      0,
    );

    weekStart.setDate(
      weekStart.getDate() -
        weekStart.getDay() +
        1,
    );

    const weekly =
      history.filter(
        (item) =>
          new Date(item.date).getTime() >=
          weekStart.getTime(),
      );

    const days = new Set(
      weekly.map((item) =>
        new Date(
          item.date,
        ).toDateString(),
      ),
    ).size;

    const volume = Math.round(
      weekly.reduce(
        (total, item) =>
          total +
          item.actualWeight *
            item.actualReps,
        0,
      ),
    );

    const average =
      weekly.length > 0
        ? Math.round(
            weekly.reduce(
              (total, item) =>
                total +
                item.performanceScore,
              0,
            ) / weekly.length,
          )
        : 0;

    const prs =
      weekly.filter(
        (item, index) =>
          detectNewPR(
            item,
            history.slice(
              index + 1,
            ),
          ).length > 0,
      ).length;

    return {
      days,
      sets: weekly.length,
      volume,
      average,
      prs,
    };
  }, [history]);

  const stats = useMemo(() => {
    if (!history.length) {
      return {
        workouts: 0,
        average: 0,
        best: 0,
        volume: 0,
      };
    }

    const scores =
      history.map(
        (item) =>
          item.performanceScore,
      );

    const volume =
      history.reduce(
        (total, item) =>
          total +
          item.actualWeight *
            item.actualReps,
        0,
      );

    return {
      workouts: new Set(
        history.map(
          (item) =>
            new Date(
              item.date,
            ).toDateString(),
        ),
      ).size,
      average: Math.round(
        scores.reduce(
          (a, b) => a + b,
          0,
        ) / scores.length,
      ),
      best: Math.max(...scores),
      volume: Math.round(volume),
    };
  }, [history]);

  const exercises = useMemo(() => {
    const map =
      new Map<
        string,
        WorkoutHistoryRecord
      >();

    history.forEach((item) => {
      const previous =
        map.get(
          item.exerciseName,
        );

      if (
        !previous ||
        new Date(item.date).getTime() >
          new Date(
            previous.date,
          ).getTime()
      ) {
        map.set(
          item.exerciseName,
          item,
        );
      }
    });

    return Array.from(
      map.values(),
    );
  }, [history]);

  const personalRecords =
    useMemo(
      () =>
        getPersonalRecords(
          history,
        ),
      [history],
    );


  return (
    <div className="min-h-screen bg-[#07070a] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {newPRs.length > 0 && (
          <PRCelebration prs={newPRs} />
        )}

        <div className="mb-8">
          <div className="text-[10px] font-black tracking-[0.25em] text-violet-400">
            GYM OS
          </div>
          <h1 className="mt-2 text-3xl font-black">
            Progress
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Your training performance over time.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="WORKOUT DAYS"
            value={`${stats.workouts}`}
          />
          <Stat
            label="AVG PERFORMANCE"
            value={`${stats.average}%`}
          />
          <Stat
            label="BEST PERFORMANCE"
            value={`${stats.best}%`}
          />
          <Stat
            label="TOTAL VOLUME"
            value={`${stats.volume} kg`}
          />
        </div>

        <WeeklySummary
          days={weeklySummary.days}
          sets={weeklySummary.sets}
          volume={weeklySummary.volume}
          average={weeklySummary.average}
          prs={weeklySummary.prs}
        />

        {personalRecords.length > 0 && (
          <PersonalRecordsSection
            records={personalRecords}
          />
        )}

        {exercises.length > 0 && (
          <ExerciseProgressSection
            exercises={exercises}
          />
        )}

        <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="mb-5">
            <div className="text-[9px] font-black tracking-[0.2em] text-violet-300">
              EXERCISE PROGRESS
            </div>
            <h2 className="mt-1 text-xl font-black">
              Latest Performance
            </h2>
          </div>

          {exercises.length === 0 ? (
            <div className="py-10 text-center text-sm text-white/30">
              Complete a workout to start tracking progress.
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map(
                (item) => (
                  <div
                    key={item.exerciseName}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-[9px] font-black tracking-[0.16em] text-white/25">
                          {item.muscle}
                        </div>
                        <div className="mt-1 font-black">
                          {item.exerciseName}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          label="WEIGHT"
                          value={`${item.actualWeight} kg`}
                        />
                        <Badge
                          label="REPS"
                          value={`${item.actualReps}`}
                        />
                        <Badge
                          label="SCORE"
                          value={`${item.performanceScore}%`}
                        />
                        <Badge
                          label="NEXT"
                          value={item.recommendation}
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function WeeklySummary({
  days,
  sets,
  volume,
  average,
  prs,
}: {
  days: number;
  sets: number;
  volume: number;
  average: number;
  prs: number;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
      <div className="mb-5">
        <div className="text-[9px] font-black tracking-[0.2em] text-cyan-300">
          WEEKLY SUMMARY
        </div>
        <h2 className="mt-1 text-xl font-black">
          This Week
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryStat
          label="WORKOUT DAYS"
          value={`${days}`}
        />
        <SummaryStat
          label="TOTAL SETS"
          value={`${sets}`}
        />
        <SummaryStat
          label="VOLUME"
          value={`${volume} kg`}
        />
        <SummaryStat
          label="AVG PERFORMANCE"
          value={`${average}%`}
        />
        <SummaryStat
          label="NEW PRS"
          value={`${prs}`}
        />
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="text-[8px] font-black tracking-[0.15em] text-white/25">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-white/80">
        {value}
      </div>
    </div>
  );
}

function PRCelebration({
  prs,
}: {
  prs: NewPR[];
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.05] p-5 shadow-[0_0_40px_rgba(250,204,21,0.08)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-2xl">
          🏆
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black tracking-[0.22em] text-yellow-300">
            NEW PERSONAL RECORD
          </div>

          <h2 className="mt-1 text-xl font-black">
            You just beat your best!
          </h2>

          <div className="mt-4 space-y-2">
            {prs.map((pr, index) => (
              <div
                key={`${pr.exerciseName}-${pr.type}-${index}`}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-black">
                    {pr.exerciseName}
                  </div>

                  <div className="mt-1 text-[9px] font-black tracking-wider text-white/30">
                    {pr.type}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">
                    {pr.previous}
                  </span>

                  <span className="text-white/20">
                    →
                  </span>

                  <span className="text-lg font-black text-yellow-200">
                    {pr.current}
                  </span>

                  <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300">
                    +{pr.improvement}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalRecordsSection({
  records,
}: {
  records: PersonalRecord[];
}) {
  return (
    <section className="mt-6 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.025] p-5">
      <div className="mb-5">
        <div className="text-[9px] font-black tracking-[0.2em] text-yellow-300">
          PERSONAL RECORDS
        </div>
        <h2 className="mt-1 text-xl font-black">
          Your Bests
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {records.map((record) => (
          <div
            key={record.exerciseName}
            className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
          >
            <div className="text-[9px] font-black tracking-[0.16em] text-white/25">
              {record.muscle}
            </div>

            <div className="mt-1 font-black">
              {record.exerciseName}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <PRStat
                label="WEIGHT"
                value={`${record.heaviestWeight} kg`}
              />
              <PRStat
                label="REPS"
                value={`${record.highestReps}`}
              />
              <PRStat
                label="SCORE"
                value={`${record.bestScore}%`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PRStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-3">
      <div className="text-[7px] font-black tracking-wider text-white/25">
        {label}
      </div>
      <div className="mt-1 text-xs font-black text-yellow-200">
        {value}
      </div>
    </div>
  );
}

function ExerciseProgressSection({
  exercises,
}: {
  exercises: WorkoutHistoryRecord[];
}) {
  const [selectedExercise, setSelectedExercise] =
    useState(exercises[0]?.exerciseName ?? "");

  const names = Array.from(
    new Set(
      exercises.map(
        (item) => item.exerciseName,
      ),
    ),
  );

  const current =
    exercises.find(
      (item) =>
        item.exerciseName ===
        selectedExercise,
    ) ?? exercises[0];

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[9px] font-black tracking-[0.2em] text-violet-300">
            EXERCISE ANALYSIS
          </div>
          <h2 className="mt-1 text-xl font-black">
            {current?.exerciseName}
          </h2>
        </div>

        <select
          value={selectedExercise}
          onChange={(event) =>
            setSelectedExercise(
              event.target.value,
            )
          }
          className="rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2 text-xs font-bold text-white outline-none"
        >
          {names.map((name) => (
            <option
              key={name}
              value={name}
            >
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <ProgressChart
          exerciseName={
            current?.exerciseName
          }
          metric="weight"
        />

        <ProgressChart
          exerciseName={
            current?.exerciseName
          }
          metric="reps"
        />

        <ProgressChart
          exerciseName={
            current?.exerciseName
          }
          metric="score"
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="text-[9px] font-black tracking-[0.18em] text-white/25">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black">
        {value}
      </div>
    </div>
  );
}

function Badge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.05] px-3 py-2">
      <div className="text-[7px] font-black tracking-wider text-white/25">
        {label}
      </div>
      <div className="mt-1 text-xs font-black text-white/70">
        {value}
      </div>
    </div>
  );
}