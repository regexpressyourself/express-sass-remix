export type WorkoutSelect = {
  value: string;
  label: string;
};

export type WorkoutList = {
  id: string;
  text: string;
};

export type WorkoutOrder = {
  [id: string]: number;
};

export type AddWorkoutAction = {
  action: string;
  option: WorkoutSelect | undefined;
  name: string;
  removedValue?: {
    value: string;
  };
  newValue?: {
    value: string;
  };
}
