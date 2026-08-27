export type WeekNumber = number;

export type WorkoutNumber =
  | 1
  | 2
  | 3;

export type ScheduleDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type ScheduledMuscle =
  | "Biceps"
  | "Chest"
  | "Back"
  | "Triceps"
  | "Shoulder"
  | "Thighs";

export type WeeklyWorkoutSchedule = Record<
  WorkoutNumber,
  Record<
    ScheduleDay,
    ScheduledMuscle
  >
>;

/*
 * GYM SCHEDULE
 *
 * Based directly on the schedule
 * provided from your gym.
 */

export const workoutSchedule: WeeklyWorkoutSchedule =
  {
    1: {
      Monday: "Biceps",
      Tuesday: "Chest",
      Wednesday: "Back",
      Thursday: "Triceps",
      Friday: "Shoulder",
      Saturday: "Thighs",
    },

    2: {
      Monday: "Chest",
      Tuesday: "Biceps",
      Wednesday: "Shoulder",
      Thursday: "Back",
      Friday: "Triceps",
      Saturday: "Thighs",
    },

    3: {
      Monday: "Shoulder",
      Tuesday: "Thighs",
      Wednesday: "Biceps",
      Thursday: "Chest",
      Friday: "Back",
      Saturday: "Triceps",
    },
  };

/*
 * Get today's day name.
 */

export function getTodayName(
  date = new Date(),
): ScheduleDay | null {
  const days: Array<
    ScheduleDay | "Sunday"
  > = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const day = days[date.getDay()];

  if (day === "Sunday") {
    return null;
  }

  return day;
}

/*
 * Get the muscle scheduled for a
 * particular workout and day.
 */

export function getScheduledMuscle(
  workoutNumber: WorkoutNumber,
  day: ScheduleDay,
): ScheduledMuscle {
  return workoutSchedule[
    workoutNumber
  ][day];
}

/*
 * Get today's scheduled muscle.
 */

export function getTodayScheduledMuscle(
  workoutNumber: WorkoutNumber,
  date = new Date(),
): ScheduledMuscle | null {
  const day =
    getTodayName(date);

  if (!day) {
    return null;
  }

  return getScheduledMuscle(
    workoutNumber,
    day,
  );
}

/*
 * Get the complete schedule for
 * one workout rotation.
 */

export function getWorkoutSchedule(
  workoutNumber: WorkoutNumber,
) {
  return workoutSchedule[
    workoutNumber
  ];
}