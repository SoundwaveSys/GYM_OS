import { useMemo, useState } from "react";
import {
  getWorkoutHistory,
  type WorkoutHistoryRecord,
} from "../engine/workoutHistory";

export default function WorkoutHistory() {
  const [filter, setFilter] = useState<
    "TODAY" | "WEEK" | "ALL"
  >("ALL");

  const [muscle, setMuscle] =
    useState("ALL");

  const history = useMemo(
    () => getWorkoutHistory(),
    [],
  );

  const muscles = Array.from(
    new Set(
      history.map(
        (item) => item.muscle,
      ),
    ),
  );

  const [now] = useState(() => Date.now());

  const filtered = history.filter(
    (item) => {
      const time =
        new Date(item.date).getTime();

      const matchesTime =
        filter === "ALL"
          ? true
          : filter === "TODAY"
            ? new Date(
                item.date,
              ).toDateString() ===
              new Date().toDateString()
            : now - time <=
              7 * 24 * 60 * 60 * 1000;

      const matchesMuscle =
        muscle === "ALL" ||
        item.muscle === muscle;

      return (
        matchesTime &&
        matchesMuscle
      );
    },
  );

  return (
    <div className="min-h-screen bg-[#07070a] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="text-[10px] font-black tracking-[0.25em] text-violet-400">
            GYM OS
          </div>
          <h1 className="mt-2 text-3xl font-black">
            Workout History
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Your saved training performance.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["TODAY", "WEEK", "ALL"] as const).map(
            (item) => (
              <button
                key={item}
                onClick={() =>
                  setFilter(item)
                }
                className={`rounded-xl px-4 py-2 text-[10px] font-black tracking-wider ${
                  filter === item
                    ? "bg-violet-500 text-white"
                    : "bg-white/[0.05] text-white/40"
                }`}
              >
                {item}
              </button>
            ),
          )}

          <select
            value={muscle}
            onChange={(e) =>
              setMuscle(e.target.value)
            }
            className="rounded-xl bg-white/[0.05] px-4 py-2 text-[10px] font-black text-white outline-none"
          >
            <option value="ALL">
              ALL MUSCLES
            </option>

            {muscles.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-10 text-center text-sm text-white/30">
            No workout history yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(
              (record) => (
                <HistoryCard
                  key={record.id}
                  record={record}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({
  record,
}: {
  record: WorkoutHistoryRecord;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[9px] font-black tracking-[0.18em] text-violet-400">
            {record.muscle}
          </div>

          <h2 className="mt-1 text-lg font-black">
            {record.exerciseName}
          </h2>

          <div className="mt-1 text-xs text-white/30">
            {new Date(
              record.date,
            ).toLocaleString()}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-2xl font-black text-emerald-300">
            {record.performanceScore}%
          </div>

          <div className="text-[9px] font-black tracking-wider text-white/35">
            {record.status}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="WEIGHT"
          value={`${record.actualWeight} kg`}
        />

        <Stat
          label="REPS"
          value={`${record.actualReps}`}
        />

        <Stat
          label="SETS"
          value={`${record.completedSets}/${record.targetSets}`}
        />

        <Stat
          label="NEXT"
          value={record.recommendation}
        />
      </div>
    </div>
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
    <div className="rounded-xl bg-black/20 p-3">
      <div className="text-[8px] font-black tracking-wider text-white/25">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-white/70">
        {value}
      </div>
    </div>
  );
}