export type ExerciseSelect = {
  value: string;
  label: string;
};

export type ExerciseList = {
  id: string;
  text: string;
};

export type ExerciseOrder = {
  [id: string]: number;
};

export type AddExerciseAction = {
  action: string;
  option: ExerciseSelect | undefined;
  name: string;
  removedValue?: {
    value: string;
  };
  newValue?: {
    value: string;
  };
}
