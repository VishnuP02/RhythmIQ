
import { Meter, Note, measureLength } from './rhythm';

export type NoteValue = {
  label: string;
  duration: number;
  rest: boolean;
};

export const NOTE_VALUES: NoteValue[] = [
  { label: 'Half', duration: 2, rest: false },
  { label: 'Dotted quarter', duration: 1.5, rest: false },
  { label: 'Quarter', duration: 1, rest: false },
  { label: 'Eighth', duration: 0.5, rest: false },
  { label: 'Sixteenth', duration: 0.25, rest: false },
  { label: 'Quarter rest', duration: 1, rest: true },
  { label: 'Eighth rest', duration: 0.5, rest: true },
];

export const toTicks = (quarters: number) =>
  Math.round(quarters * 4);

export function remainingTicks(notes: Note[], meter: Meter) {
  return (
    toTicks(measureLength(meter)) -
    notes.reduce(
      (sum, note) => sum + toTicks(note.duration),
      0
    )
  );
}

export function addNote(
  notes: Note[],
  value: NoteValue,
  meter: Meter
): Note[] | null {
  if (toTicks(value.duration) > remainingTicks(notes, meter)) {
    return null;
  }

  return [
    ...notes,
    {
      id: notes.length
        ? Math.max(...notes.map((note) => note.id)) + 1
        : 0,
      duration: value.duration,
      rest: value.rest,
    },
  ];
}

export function onsetTicks(notes: Note[]) {
  let tick = 0;

  return notes.map((note) => {
    const start = tick;
    tick += toTicks(note.duration);
    return { start, note };
  });
}

export function scoreTap(
  tapTimeMs: number,
  startTimeMs: number,
  stepMs: number,
  notes: Note[],
  meter: Meter,
  toleranceMs = 150
) {
  const totalTicks = toTicks(measureLength(meter));
  const elapsedTicks = (tapTimeMs - startTimeMs) / stepMs;
  const cycle =
    ((elapsedTicks % totalTicks) + totalTicks) % totalTicks;

  const attacks = onsetTicks(notes)
    .filter((event) => !event.note.rest)
    .map((event) => event.start);

  if (!attacks.length) {
    return { correct: false, errorMs: Infinity };
  }

  const closest = Math.min(
    ...attacks.map((tick) =>
      Math.min(
        Math.abs(cycle - tick),
        totalTicks - Math.abs(cycle - tick)
      )
    )
  );

  const errorMs = closest * stepMs;

  return {
    correct: errorMs <= toleranceMs,
    errorMs,
  };
}