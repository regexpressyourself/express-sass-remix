import { Form } from "remix";

export function EditExercise({
  exerciseName,
  isOwner,
  canEdit = true,
  display = false,
}: {
  exerciseName: string;
  isOwner: boolean;
  canEdit?: boolean;
  display?: boolean;
}) {
  return (
    <div className={`modal-backdrop ${!display ? "hidden" : ""}`}>
      <div className={`modal ${!display ? "hidden" : ""}`}>
        <h2>Edit {exerciseName}?</h2>
        {isOwner ? (
          <Form method="post">
            <input type="hidden" name="_method" value="patch" />
            <input type="text" name="name" defaultValue={exerciseName} />
            <button type="submit" className="button" disabled={!canEdit}>
              Edit
            </button>
          </Form>
        ) : null}
      </div>
    </div>
  );
}
