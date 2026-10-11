
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type HomeScreenProps = {
  instruments: string[];
  onBack: () => void;
  onOpenTrainer: () => void;
  onOpenMusic: () => void;
  onOpenPractice: () => void;
  onOpenProgress: () => void;
};

const features = [
  {
    title: 'My Music',
    description: 'Your sheet music',
    symbol: '♫',
  },
  {
    title: 'Rhythm Trainer',
    description: 'Master counting',
    symbol: '♬',
  },
  {
    title: 'Practice',
    description: 'Build confidence',
    symbol: '♪',
  },
  {
    title: 'My Progress',
    description: 'See your growth',
    symbol: '★',
  },
];

export default function HomeScreen({
  instruments,
  onBack,
  onOpenTrainer,
  onOpenMusic,
  onOpenPractice,
  onOpenProgress,
}: HomeScreenProps) {
  const handleFeaturePress = (featureTitle: string) => {
    switch (featureTitle) {
      case 'My Music':
        onOpenMusic();
        break;
      case 'Rhythm Trainer':
        onOpenTrainer();
        break;
      case 'Practice':
        onOpenPractice();
        break;
      case 'My Progress':
        onOpenProgress();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>
            ← Edit Instruments
          </Text>
        </TouchableOpacity>

        <Text style={styles.brand}>RHYTHMIQ</Text>

        <Text style={styles.title}>
          Find your rhythm.
        </Text>

        <Text style={styles.subtitle}>
          Your music practice starts here.
        </Text>

        <View style={styles.instrumentCard}>
          <Text style={styles.sectionLabel}>
            YOUR INSTRUMENTS
          </Text>

          <View style={styles.instrumentList}>
            {instruments.map((instrument) => (
              <View
                key={instrument}
                style={styles.instrumentBadge}
              >
                <Text style={styles.instrumentText}>
                  {instrument}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Explore RhythmIQ
        </Text>

        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.title}
              style={styles.featureCard}
              activeOpacity={0.8}
              onPress={() =>
                handleFeaturePress(feature.title)
              }
            >
              <Text style={styles.featureSymbol}>
                {feature.symbol}
              </Text>

              <Text style={styles.featureTitle}>
                {feature.title}
              </Text>

              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>
          Learn it. Hear it. Play it.
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 50,
  },
  backText: {
    color: '#7DD3FC',
    fontSize: 15,
    marginBottom: 30,
  },
  brand: {
    color: '#7DD3FC',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 30,
  },
  instrumentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    marginBottom: 32,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 14,
  },
  instrumentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  instrumentBadge: {
    backgroundColor: '#164E63',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  instrumentText: {
    color: '#7DD3FC',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    minHeight: 150,
    justifyContent: 'center',
  },
  featureSymbol: {
    color: '#7DD3FC',
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureDescription: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 45,
    fontSize: 13,
  },
});
