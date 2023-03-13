import { Prisma } from "@prisma/client";

const routineWithWorkouts = Prisma.validator<Prisma.RoutineArgs>()({
  include: { workouts: true },
});
export type RoutineWithWorkouts = Prisma.RoutineGetPayload<
  typeof routineWithWorkouts
>;

const workoutWithExercises = Prisma.validator<Prisma.WorkoutArgs>()({
  include: { exercises: true },
});
export type WorkoutWithExercises = Prisma.WorkoutGetPayload<
  typeof workoutWithExercises
>;

const workoutWithExercisesWithSets = Prisma.validator<Prisma.WorkoutArgs>()({
  include: { exercises: { include: { sets: true } } },
});
export type WorkoutWithExercisesWithSets = Prisma.WorkoutGetPayload<
  typeof workoutWithExercisesWithSets
>;

const exerciseWithWorkoutSets = Prisma.validator<Prisma.ExerciseArgs>()({
  include: { sets: true },
});
export type ExerciseWithWorkoutSets = Prisma.ExerciseGetPayload<
  typeof exerciseWithWorkoutSets
>;
