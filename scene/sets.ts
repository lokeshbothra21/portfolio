import { sets } from "@/content/content";
import { diagrams, layout, type LaidOut } from "./diagrams";

/** Every set's diagram laid out against its content steps: intro + steps + check. */
export const laidOut: Record<string, LaidOut> = Object.fromEntries(
  sets.filter((s) => diagrams[s.id]).map((s) => [s.id, layout(diagrams[s.id], s.steps.length + 2)]),
);
