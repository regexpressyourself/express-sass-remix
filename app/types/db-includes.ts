import { Prisma } from '@prisma/client'

const routineWithWorkouts = Prisma.validator<Prisma.RoutineArgs>()({
  include: { workouts: true },
})
export type RoutineWithWorkouts = Prisma.RoutineGetPayload<typeof routineWithWorkouts>
