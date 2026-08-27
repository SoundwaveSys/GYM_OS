import { useMemo } from "react";
import {
  getWorkoutHistory,
  type WorkoutHistoryRecord,
} from "../engine/workoutHistory";

type Metric = "weight" | "reps" | "score";

export default function ProgressChart({
  exerciseName,
  metric = "weight",
}: {
  exerciseName?: string;
  metric?: Metric;
}) {
  const history = useMemo(
    () => getWorkoutHistory(),
    [],
  );

  const records = useMemo(() => {
    const filtered = exerciseName
      ? history.filter(
          (item) =>
            item.exerciseName ===
            exerciseName,
        )
      : history;

    return [...filtered]
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime(),
      )
      .slice(-12);
  }, [history, exerciseName]);

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 text-center text-sm text-white/30">
        Complete workouts to generate your progress chart.
      </div>
    );
  }

  const values = records.map(
    (record) =>
      getMetricValue(record, metric),
  );

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x =
        values.length === 1
          ? 50
          : (index /
              (values.length - 1)) *
            100;

      const y =
        88 -
        ((value - min) / range) *
          76;

      return `${x},${y}`;
    })
    .join(" ");

  const latest =
    values[values.length - 1];

  const first = values[0];

  const change =
    first === 0
      ? 0
      : Math.round(
          ((latest - first) /
            Math.abs(first)) *
            100,
        );

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[9px] font-black tracking-[0.2em] text-violet-300">
            PROGRESS CHART
          </div>

          <h3 className="mt-1 text-lg font-black">
            {exerciseName ??
              "Overall Training"}
          </h3>
        </div>

        <div className="text-right">
          <div className="text-xl font-black">
            {formatValue(latest, metric)}
          </div>

          <div
            className={`text-[9px] font-black tracking-wider ${
              change >= 0
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change}% SINCE FIRST RECORD
          </div>
        </div>
      </div>

      <div className="mt-6 h-56 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
        >
          {[20, 40, 60, 80].map(
            (y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                className="text-white/[0.05]"
                strokeWidth="0.5"
              />
            ),
          )}

          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            className="text-violet-400"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />

          {values.map(
            (value, index) => {
              const x =
                values.length === 1
                  ? 50
                  : (index /
                      (values.length - 1)) *
                    100;

              const y =
                88 -
                ((value - min) /
                  range) *
                  76;

              return (
                <circle
                  key={`${records[index].id}-${metric}`}
                  cx={x}
                  cy={y}
                  r="1.7"
                  fill="currentColor"
                  className="text-violet-300"
                />
              );
            },
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[8px] font-black tracking-wider text-white/20">
        <span>
          {formatDate(records[0].date)}
        </span>
        <span>
          {formatDate(
            records[
              records.length - 1
            ].date,
          )}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric
          label="WEIGHT"
          value={metric === "weight"
            ? "ACTIVE"
            : "VIEW"}
        />
        <Metric
          label="REPS"
          value={metric === "reps"
            ? "ACTIVE"
            : "VIEW"}
        />
        <Metric
          label="SCORE"
          value={metric === "score"
            ? "ACTIVE"
            : "VIEW"}
        />
      </div>
    </div>
  );
}

function getMetricValue(
  record: WorkoutHistoryRecord,
  metric: Metric,
) {
  if (metric === "reps") {
    return record.actualReps;
  }

  if (metric === "score") {
    return record.performanceScore;
  }

  return record.actualWeight;
}

function formatValue(
  value: number,
  metric: Metric,
) {
  if (metric === "score") {
    return `${Math.round(value)}%`;
  }

  return `${value} ${
    metric === "weight"
      ? "kg"
      : "reps"
  }`;
}

function formatDate(
  value: string,
) {
  return new Date(value).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );
}

function Metric({
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
      <div className="mt-1 text-[10px] font-black text-white/50">
        {value}
      </div>
    </div>
  );
}