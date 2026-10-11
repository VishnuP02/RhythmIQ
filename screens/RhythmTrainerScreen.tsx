
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

import RhythmStaff from './RhythmStaff';
import {
  Meter,
  Difficulty,
  Exercise,
  METERS,
  DIFFICULTIES,
  Note,
  measureLength,
  pulseLength,
  pulseSymbol,
  presetExercises,
  generateRhythm,
  countAt,
} from '../lib/rhythm';
import {
  NOTE_VALUES,
  addNote,
  onsetTicks,
  remainingTicks,
  scoreTap,
  toTicks,
} from '../lib/trainer';

type Props = { onBack: () => void };

const clickFile = require('../assets/sounds/click.wav');
const accentFile = require('../assets/sounds/accent.wav');
const tapFile = require('../assets/sounds/tap.wav');

export default function RhythmTrainerScreen({ onBack }: Props) {
  const [meter, setMeter] = useState<Meter>('4/4');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [customExercise, setCustomExercise] = useState<Exercise | null>(null);
  const [builder, setBuilder] = useState<Note[]>([]);
  const [editing, setEditing] = useState(false);
  const [tempo, setTempo] = useState(80);
  const [playing, setPlaying] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [rhythmSoundOn, setRhythmSoundOn] = useState(true);
  const [activeNote, setActiveNote] = useState(-1);
  const [currentCount, setCurrentCount] = useState('–');
  const [taps, setTaps] = useState(0);
  const [hits, setHits] = useState(0);
  const [feedback, setFeedback] = useState(
    'Tap along while the exercise plays'
  );

  const click = useAudioPlayer(clickFile);
  const accent = useAudioPlayer(accentFile);
  const tap = useAudioPlayer(tapFile);

  const lastStep = useRef(-1);
  const startedAt = useRef(0);
  const lastTapOnset = useRef<number | null>(null);

  const presets = useMemo(() => presetExercises(meter), [meter]);
  const exercise = customExercise ?? presets[exerciseIndex];
  const events = useMemo(
    () => onsetTicks(exercise.notes),
    [exercise]
  );

  const stepMs = (60000 / tempo) / pulseLength(meter) / 4;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!playing) {
      setActiveNote(-1);
      setCurrentCount('–');
      lastStep.current = -1;
      return;
    }

    const measureSteps = toTicks(measureLength(meter));
    const pulseSteps = toTicks(pulseLength(meter));

    const fire = (player: typeof click) => {
      player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => {});
    };

    const update = () => {
      const absolute = Math.floor(
        (Date.now() - startedAt.current) / stepMs
      );

      if (absolute === lastStep.current) return;

      const step =
        ((absolute % measureSteps) + measureSteps) % measureSteps;

      if (metronomeOn && step % pulseSteps === 0) {
        fire(step === 0 ? accent : click);
      }

      const event = events.find((item) => item.start === step);

      if (event) {
        setActiveNote(events.indexOf(event));
        setCurrentCount(countAt(step / 4, meter));

        if (rhythmSoundOn && !event.note.rest) {
          fire(tap);
        }
      }

      lastStep.current = absolute;
    };

    update();

    const timer = setInterval(update, 20);
    return () => clearInterval(timer);
  }, [
    playing,
    tempo,
    meter,
    events,
    metronomeOn,
    rhythmSoundOn,
    click,
    accent,
    tap,
    stepMs,
  ]);

  const stop = () => {
    setPlaying(false);
    lastTapOnset.current = null;
  };

  const start = () => {
    if (playing) {
      stop();
      return;
    }

    setTaps(0);
    setHits(0);
    setFeedback('Tap the button when a note should sound');
    lastTapOnset.current = null;
    startedAt.current = Date.now();
    lastStep.current = -1;
    setPlaying(true);
  };

  const chooseMeter = (nextMeter: Meter) => {
    stop();
    setMeter(nextMeter);
    setExerciseIndex(0);
    setCustomExercise(null);
    setBuilder([]);
    setEditing(false);
  };

  const chooseExercise = (delta: number) => {
    stop();
    setEditing(false);
    setCustomExercise(null);
    setExerciseIndex(
      (index) => (index + delta + presets.length) % presets.length
    );
  };

  const generate = () => {
    stop();
    setEditing(false);
    setCustomExercise(generateRhythm(meter, difficulty));
  };

  const add = (value: (typeof NOTE_VALUES)[number]) => {
    const next = addNote(builder, value, meter);

    if (!next) {
      Alert.alert(
        'Measure full',
        `That note won't fit in ${meter}. Remove a note or choose a shorter value.`
      );
      return;
    }

    setBuilder(next);
  };

  const useBuiltRhythm = () => {
    const remaining = remainingTicks(builder, meter);

    if (remaining !== 0) {
      Alert.alert(
        'Finish the measure',
        `You still have ${remaining / 4} quarter-note units to fill.`
      );
      return;
    }

    stop();
    setCustomExercise({
      name: 'My Rhythm',
      notes: [...builder],
    });
    setEditing(false);
  };

  const tapAlong = () => {
    if (!playing) {
      Alert.alert(
        'Start first',
        'Press Start Practice, then tap along.'
      );
      return;
    }

    const now = Date.now();
    const totalTicks = toTicks(measureLength(meter));
    const tickPosition =
      (now - startedAt.current) / stepMs;
    const absoluteMeasure = Math.floor(
      tickPosition / totalTicks
    );
    const phase =
      ((tickPosition % totalTicks) + totalTicks) % totalTicks;

    const attacks = events
      .filter((event) => !event.note.rest)
      .map((event) => event.start);

    if (!attacks.length) {
      setFeedback('This exercise contains no note attacks');
      return;
    }

    let nearest = attacks[0];
    let distance = Infinity;
    let measure = absoluteMeasure;

    for (const attack of attacks) {
      for (const offset of [-1, 0, 1]) {
        const difference = Math.abs(
          phase - (attack + offset * totalTicks)
        );

        if (difference < distance) {
          distance = difference;
          nearest = attack;
          measure = absoluteMeasure + offset;
        }
      }
    }

    const onsetId = measure * totalTicks + nearest;

    const result = scoreTap(
      now,
      startedAt.current,
      stepMs,
      exercise.notes,
      meter,
      150
    );

    const duplicate = lastTapOnset.current === onsetId;
    const correct = result.correct && !duplicate;

    setTaps((value) => value + 1);

    if (correct) {
      setHits((value) => value + 1);
      lastTapOnset.current = onsetId;
    }

    setFeedback(
      duplicate && result.correct
        ? 'Already tapped this note'
        : correct
        ? `Good! Within ${Math.round(result.errorMs)} ms`
        : 'Not quite — listen for the next note'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          onPress={() => {
            stop();
            onBack();
          }}
        >
          <Text style={styles.back}>← Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>
          RHYTHMIQ · RHYTHM TRAINER v0.3
        </Text>

        <Text style={styles.title}>
          Learn it. Hear it. Play it.
        </Text>

        <Text style={styles.heading}>Time signature</Text>

        <View style={styles.row}>
          {METERS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => chooseMeter(item)}
              style={[
                styles.chip,
                meter === item && styles.selected,
              ]}
            >
              <Text style={styles.text}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          Beat: {pulseSymbol(meter)} = {tempo} BPM
          {meter === '6/8'
            ? ' · two dotted-quarter pulses'
            : ''}
        </Text>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>
            EXERCISE · {meter}
          </Text>

          <Text style={styles.exercise}>
            {exercise.name}
          </Text>

          <RhythmStaff
            notes={exercise.notes}
            meter={meter}
            activeIndex={activeNote}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 10,
              paddingVertical: 12,
            }}
          >
            {events.map((event, index) => (
              <View
                key={index}
                style={[
                  styles.countChip,
                  activeNote === index && styles.selected,
                ]}
              >
                <Text style={styles.text}>
                  {event.note.rest ? 'Rest ' : ''}
                  {countAt(event.start / 4, meter)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.between}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => chooseExercise(-1)}
            >
              <Text style={styles.text}>← Previous</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              {customExercise
                ? 'Custom'
                : `${exerciseIndex + 1}/${presets.length}`}
            </Text>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => chooseExercise(1)}
            >
              <Text style={styles.text}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.heading}>Difficulty</Text>

        <View style={styles.row}>
          {DIFFICULTIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                difficulty === item && styles.selected,
              ]}
              onPress={() => setDifficulty(item)}
            >
              <Text style={styles.text}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.secondary}
          onPress={generate}
        >
          <Text style={styles.text}>
            ↻ Generate Random Rhythm
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => {
            stop();
            setBuilder(
              customExercise?.name === 'My Rhythm'
                ? [...customExercise.notes]
                : []
            );
            setEditing((value) => !value);
          }}
        >
          <Text style={styles.text}>
            {editing
              ? 'Close Rhythm Builder'
              : '✎ Build Your Own Rhythm'}
          </Text>
        </TouchableOpacity>

        {editing && (
          <View style={styles.card}>
            <Text style={styles.heading}>
              Rhythm Builder · {meter}
            </Text>

            <Text style={styles.hint}>
              Remaining: {remainingTicks(builder, meter) / 4}{' '}
              quarter-note units
            </Text>

            <RhythmStaff
              notes={builder}
              meter={meter}
              activeIndex={-1}
            />

            <View style={styles.row}>
              {NOTE_VALUES.map((value) => (
                <TouchableOpacity
                  key={value.label}
                  style={styles.chip}
                  onPress={() => add(value)}
                >
                  <Text style={styles.text}>
                    + {value.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.between}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() =>
                  setBuilder((notes) => notes.slice(0, -1))
                }
              >
                <Text style={styles.text}>Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setBuilder([])}
              >
                <Text style={styles.text}>Clear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.play}
              onPress={useBuiltRhythm}
            >
              <Text style={styles.playText}>
                Use This Rhythm
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.eyebrow}>
            CURRENT COUNT
          </Text>

          <Text style={styles.big}>
            {currentCount}
          </Text>

          <Text style={styles.hint}>
            Tempo: {tempo} BPM
          </Text>

          <View style={styles.between}>
            <TouchableOpacity
              style={styles.tempoButton}
              onPress={() =>
                setTempo((value) => Math.max(40, value - 5))
              }
            >
              <Text style={styles.text}>− 5</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              {pulseSymbol(meter)} / minute
            </Text>

            <TouchableOpacity
              style={styles.tempoButton}
              onPress={() =>
                setTempo((value) => Math.min(200, value + 5))
              }
            >
              <Text style={styles.text}>+ 5</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggle}
          onPress={() =>
            setMetronomeOn((value) => !value)
          }
        >
          <Text style={styles.text}>Metronome</Text>
          <Text style={styles.accent}>
            {metronomeOn ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggle}
          onPress={() =>
            setRhythmSoundOn((value) => !value)
          }
        >
          <Text style={styles.text}>Rhythm sounds</Text>
          <Text style={styles.accent}>
            {rhythmSoundOn ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.play}
          onPress={start}
        >
          <Text style={styles.playText}>
            {playing
              ? '■ Stop Practice'
              : '▶ Start Practice'}
          </Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.heading}>
            Tap Along
          </Text>

          <Text style={styles.hint}>
            Practice your timing against the rhythm
          </Text>

          <TouchableOpacity
            style={[
              styles.play,
              !playing && { opacity: 0.5 },
            ]}
            onPress={tapAlong}
          >
            <Text style={styles.playText}>
              TAP ♪
            </Text>
          </TouchableOpacity>

          <Text style={styles.exercise}>
            {hits} accurate / {taps} taps
          </Text>

          <Text style={styles.hint}>
            {feedback}
          </Text>

          <Text style={styles.hint}>
            Prototype feedback: ±150 ms, one hit per note.
            Missed notes are not yet counted.
          </Text>
        </View>

        <Text style={styles.hint}>
          Staff notation is a single-pitch rhythmic preview,
          not full music engraving. Audio and tap feedback
          use approximate JavaScript timing.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10182B',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  back: {
    color: '#7DD3FC',
    fontSize: 15,
    marginBottom: 24,
  },
  eyebrow: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 22,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hint: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 9,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#334155',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selected: {
    backgroundColor: '#16647C',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  text: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  accent: {
    color: '#7DD3FC',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  exercise: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginVertical: 13,
  },
  countChip: {
    backgroundColor: '#334155',
    borderRadius: 9,
    padding: 10,
  },
  between: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginTop: 12,
  },
  smallButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 11,
  },
  secondary: {
    backgroundColor: '#164E63',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 7,
  },
  big: {
    color: '#FFFFFF',
    fontSize: 55,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  tempoButton: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 10,
  },
  toggle: {
    backgroundColor: '#1E293B',
    padding: 18,
    marginVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  play: {
    backgroundColor: '#38BDF8',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  playText: {
    color: '#10182B',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
