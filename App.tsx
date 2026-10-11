
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';

import HomeScreen from './screens/HomeScreen';
import RhythmTrainerScreen from './screens/RhythmTrainerScreen';
import {
  MyMusicScreen,
  PracticeScreen,
  MyProgressScreen,
} from './screens/LibraryScreens';

const instrumentGroups = [
  {
    name: 'Woodwinds',
    instruments: [
      'Flute', 'Piccolo', 'Clarinet', 'Bass Clarinet',
      'Oboe', 'Bassoon', 'Alto Saxophone',
      'Tenor Saxophone', 'Baritone Saxophone',
    ],
  },
  {
    name: 'Brass',
    instruments: [
      'Trumpet', 'Trombone', 'French Horn',
      'Euphonium', 'Baritone Horn', 'Tuba',
    ],
  },
  {
    name: 'Strings',
    instruments: ['Violin', 'Viola', 'Cello', 'Double Bass'],
  },
  {
    name: 'Percussion',
    instruments: [
      'Snare Drum', 'Bass Drum', 'Drum Set',
      'Xylophone', 'Marimba', 'Timpani',
    ],
  },
  {
    name: 'Voice',
    instruments: ['Soprano', 'Alto', 'Tenor', 'Bass'],
  },
];

type Screen =
  | 'welcome'
  | 'instruments'
  | 'home'
  | 'trainer'
  | 'music'
  | 'practice'
  | 'progress';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedInstruments, setSelectedInstruments] =
    useState<string[]>([]);

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments((previous) =>
      previous.includes(instrument)
        ? previous.filter((item) => item !== instrument)
        : [...previous, instrument]
    );
  };

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.welcomeContent}>
          <Text style={styles.musicSymbol}>♫</Text>
          <Text style={styles.title}>RhythmIQ</Text>

          <Text style={styles.tagline}>
            Learn it. Hear it. Play it.
          </Text>

          <Text style={styles.description}>
            Master the rhythms in your music before rehearsal begins.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen('instruments')}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Your music. Your rhythm. Your progress.
        </Text>
      </SafeAreaView>
    );
  }

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <HomeScreen
          instruments={selectedInstruments}
          onBack={() => setScreen('instruments')}
          onOpenTrainer={() => setScreen('trainer')}
          onOpenMusic={() => setScreen('music')}
          onOpenPractice={() => setScreen('practice')}
          onOpenProgress={() => setScreen('progress')}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'trainer') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <RhythmTrainerScreen
          onBack={() => setScreen('home')}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'music') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <MyMusicScreen onBack={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  if (screen === 'practice') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <PracticeScreen onBack={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  if (screen === 'progress') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <MyProgressScreen onBack={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('welcome')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          What do you play?
        </Text>

        <Text style={styles.headerDescription}>
          Select all instruments or voice parts that apply to you.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {instrumentGroups.map((group) => (
          <View key={group.name} style={styles.group}>
            <Text style={styles.groupTitle}>{group.name}</Text>

            <View style={styles.instrumentGrid}>
              {group.instruments.map((instrument) => {
                const selected =
                  selectedInstruments.includes(instrument);

                return (
                  <TouchableOpacity
                    key={instrument}
                    style={[
                      styles.instrumentButton,
                      selected && styles.selectedButton,
                    ]}
                    onPress={() => toggleInstrument(instrument)}
                  >
                    <Text
                      style={[
                        styles.instrumentText,
                        selected && styles.selectedText,
                      ]}
                    >
                      {selected ? '✓ ' : ''}
                      {instrument}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.selectionCount}>
          {selectedInstruments.length} selected
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            selectedInstruments.length === 0 &&
              styles.disabledButton,
          ]}
          disabled={selectedInstruments.length === 0}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.primaryButtonText}>
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10182B',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  musicSymbol: {
    fontSize: 80,
    color: '#7DD3FC',
    marginBottom: 18,
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 19,
    color: '#7DD3FC',
    marginTop: 12,
  },
  description: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 25,
    marginTop: 28,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    paddingHorizontal: 38,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#10182B',
  },
  disabledButton: {
    opacity: 0.4,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    color: '#7DD3FC',
    fontSize: 16,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerDescription: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  group: {
    marginTop: 24,
  },
  groupTitle: {
    color: '#7DD3FC',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  instrumentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  instrumentButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  selectedButton: {
    backgroundColor: '#164E63',
    borderColor: '#38BDF8',
  },
  instrumentText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  selectedText: {
    color: '#7DD3FC',
    fontWeight: 'bold',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#10182B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  selectionCount: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    color: '#94A3B8',
    textAlign: 'center',
    paddingBottom: 25,
    fontSize: 12,
  },
});
