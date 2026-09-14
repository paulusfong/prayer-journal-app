import type { Dictionary } from "@/lib/i18n";
import type { RequestVisibility } from "@/lib/journal";

export function VisibilityFields({
  dict,
  people,
  defaultVisibility,
  grantedUserIds = [],
}: {
  dict: Dictionary;
  people: { id: string; label: string }[];
  defaultVisibility: RequestVisibility;
  grantedUserIds?: string[];
}) {
  const granted = new Set(grantedUserIds);
  return (
    <fieldset>
      <legend>{dict.requestForm.visibilityLegend}</legend>
      <label className="choice">
        <input type="radio" name="visibility" value="circle" defaultChecked={defaultVisibility === "circle"} />{" "}
        {dict.requestForm.visibilityCircle}
      </label>
      <label className="choice">
        <input type="radio" name="visibility" value="people" defaultChecked={defaultVisibility === "people"} />{" "}
        {dict.requestForm.visibilityPeople}
      </label>
      {people.length > 0 ? (
        <div className="share-list">
          {people.map((p) => (
            <label key={p.id} className="choice">
              <input type="checkbox" name="shareWith" value={p.id} defaultChecked={granted.has(p.id)} /> {p.label}
            </label>
          ))}
        </div>
      ) : null}
      <label className="choice">
        <input type="radio" name="visibility" value="private" defaultChecked={defaultVisibility === "private"} />{" "}
        {dict.requestForm.visibilityPrivate}
      </label>
    </fieldset>
  );
}
