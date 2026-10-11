export type Meter = '2/4' | '3/4' | '4/4' | '6/8';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type Note = { id: number; duration: number; rest: boolean };
export type Exercise = { name: string; notes: Note[] };

export const METERS: Meter[] = ['2/4', '3/4', '4/4', '6/8'];
export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
export const measureLength = (meter: Meter) => meter === '6/8' ? 3 : Number(meter[0]);
export const pulseLength = (meter: Meter) => meter === '6/8' ? 1.5 : 1;
export const pulseSymbol = (meter: Meter) => meter === '6/8' ? '♩.' : '♩';

const fromPairs = (pairs: Array<[number, boolean]>): Note[] =>
  pairs.map(([duration, rest], i) => ({ id: i, duration, rest }));
const notes = (...durations: number[]): Note[] => fromPairs(durations.map(d => [d, false]));

export function presetExercises(meter: Meter): Exercise[] {
  if (meter === '2/4') return [
    { name: 'Steady Quarters', notes: notes(1, 1) },
    { name: 'Eighth Notes', notes: notes(.5, .5, .5, .5) },
    { name: 'Quarter Rest', notes: fromPairs([[1, false], [1, true]]) },
    { name: 'Sixteenth Challenge', notes: notes(.25, .25, .5, 1) },
  ];
  if (meter === '3/4') return [
    { name: 'Waltz Pulse', notes: notes(1, 1, 1) },
    { name: 'Eighth Motion', notes: notes(.5, .5, 1, 1) },
    { name: 'Rest and Respond', notes: fromPairs([[1, false], [1, true], [.5, false], [.5, false]]) },
    { name: 'Dotted Rhythm', notes: notes(1.5, .5, 1) },
  ];
  if (meter === '6/8') return [
    { name: 'Two Big Beats', notes: notes(1.5, 1.5) },
    { name: 'Six Eighths', notes: notes(.5, .5, .5, .5, .5, .5) },
    { name: 'Compound Mix', notes: notes(1.5, .5, .5, .5) },
    { name: 'Rest in Six', notes: fromPairs([[.5, false], [.5, true], [.5, false], [1.5, false]]) },
  ];
  return [
    { name: 'Four Quarters', notes: notes(1, 1, 1, 1) },
    { name: 'Eighth Notes', notes: notes(.5, .5, .5, .5, .5, .5, .5, .5) },
    { name: 'Mixed Rhythm', notes: notes(1, 1, .5, .5, 1) },
    { name: 'Rest Practice', notes: fromPairs([[1, false], [1, true], [.5, false], [.5, false], [1, false]]) },
    { name: 'Syncopation', notes: notes(.5, 1, .5, 1, 1) },
    { name: 'Sixteenths', notes: notes(.25, .25, .5, 1, .25, .25, .5, 1) },
  ];
}

export function generateRhythm(meter: Meter, difficulty: Difficulty): Exercise {
  const choices = difficulty === 'Beginner' ? [1, .5] :
    difficulty === 'Intermediate' ? [1.5, 1, .5] : [1.5, 1, .5, .25];
  let remaining = Math.round(measureLength(meter) * 4);
  const result: Note[] = [];
  while (remaining > 0) {
    const fitting = choices.filter(d => Math.round(d * 4) <= remaining);
    // Quarter-unit fallback guarantees a completed measure in any meter.
    if (!fitting.length) fitting.push(.25);
    const duration = fitting[Math.floor(Math.random() * fitting.length)];
    const rest = result.length > 0 && Math.random() < (difficulty === 'Beginner' ? .08 : .18);
    result.push({ id: result.length, duration, rest });
    remaining -= Math.round(duration * 4);
  }
  return { name: `Random ${difficulty}`, notes: result };
}

export function countAt(position: number, meter: Meter): string {
  if (meter === '6/8') {
    const step = Math.round(position * 4);
    const labels = ['1', 'la', 'li', '2', 'la', 'li'];
    if (step % 2 === 0) return labels[Math.floor(step / 2)] ?? '';
    return 'e'; // Sixteenth-note subdivisions in compound meter.
  }
  const beat = Math.floor(position) + 1;
  const subdivision = Math.round((position - Math.floor(position)) * 4);
  return subdivision === 0 ? String(beat) : ['','e','&','a'][subdivision];
}

export function noteSymbol(note: Note): string {
  if (note.rest) return '𝄽'; // Placeholder glyph for rests; proper notation comes later.
  if (note.duration === 2) return '𝅗𝅥';
  if (note.duration === 1.5) return '♩.';
  if (note.duration === 1) return '♩';
  if (note.duration === .5) return '♪';
  return '♬';
}
