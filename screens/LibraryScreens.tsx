
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';

type ScreenProps = { onBack: () => void };
type MusicKind = 'image' | 'pdf' | 'musicxml' | 'mxl';

type MusicPage = {
  id: string;
  uri: string;
  kind: MusicKind;
  originalName: string;
};

type MusicItem = {
  id: string;
  title: string;
  pages: MusicPage[];
  createdAt: string;
};

type PracticeSession = {
  id: string;
  rhythmId: string;
  rhythmName: string;
  tempo: number;
  seconds: number;
  completedAt: string;
};

const MUSIC_KEY = '@rhythmiq/sheetmusic/v1';
const HISTORY_KEY = '@rhythmiq/history/v1';
const RHYTHM_KEY = '@rhythmiq/music/v1';

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const libraryDirectory = new Directory(Paths.document, 'rhythmiq-library');

function ensureDirectory() {
  if (!libraryDirectory.exists) {
    libraryDirectory.create({ intermediates: true, idempotent: true });
  }
}

async function loadArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Invalid saved data');
  return parsed as T[];
}

async function storeArray<T>(key: string, data: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

function detectKind(filename: string): MusicKind | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'xml' || ext === 'musicxml') return 'musicxml';
  if (ext === 'mxl') return 'mxl';
  if (['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(ext || '')) {
    return 'image';
  }
  return null;
}

function extensionFor(filename: string, kind: MusicKind) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (/^[a-z0-9]{1,10}$/.test(ext)) return ext;
  return kind === 'image' ? 'jpg' : kind === 'musicxml' ? 'musicxml' : kind;
}

async function copyIntoLibrary(
  uri: string,
  filename: string,
  kind: MusicKind
): Promise<MusicPage> {
  ensureDirectory();

  const id = makeId();
  const ext = extensionFor(filename, kind);
  const source = new File(uri);
  const destination = new File(libraryDirectory, `${id}.${ext}`);

  await source.copy(destination);

  return {
    id,
    uri: destination.uri,
    kind,
    originalName: filename,
  };
}

function deleteStoredPage(page: MusicPage) {
  try {
    const file = new File(page.uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Unable to delete stored file', error);
  }
}

function Button({
  title,
  onPress,
  primary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        primary && styles.primaryButton,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.primaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function Header({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <View>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Dashboard</Text>
      </TouchableOpacity>
      <Text style={styles.brand}>RHYTHMIQ</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function PagePreview({ page }: { page: MusicPage }) {
  if (page.kind === 'image') {
    return (
      <Image
        source={{ uri: page.uri }}
        style={styles.previewImage}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={styles.filePreview}>
      <Text style={styles.fileSymbol}>
        {page.kind === 'pdf' ? '▤' : '♫'}
      </Text>
      <Text style={styles.fileName}>{page.originalName}</Text>
      <Text style={styles.muted}>
        {page.kind.toUpperCase()} document
      </Text>
    </View>
  );
}

// ==========================================
// MY MUSIC — SHEET MUSIC LIBRARY
// ==========================================

export function MyMusicScreen({ onBack }: ScreenProps) {
  const [library, setLibrary] = useState<MusicItem[]>([]);
  const [pendingPages, setPendingPages] = useState<MusicPage[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [selected, setSelected] = useState<MusicItem | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArray<MusicItem>(MUSIC_KEY)
      .then(setLibrary)
      .catch(() => Alert.alert('Error', 'Could not load your music library.'))
      .finally(() => setLoading(false));
  }, []);

  const importPages = async (
    assets: { uri: string; name: string }[]
  ) => {
    if (!assets.length) return;

    setBusy(true);
    const imported: MusicPage[] = [];

    try {
      for (const asset of assets) {
        const kind = detectKind(asset.name);
        if (!kind) {
          throw new Error(`Unsupported file type: ${asset.name}`);
        }
        imported.push(
          await copyIntoLibrary(asset.uri, asset.name, kind)
        );
      }

      setPendingPages((previous) => [...previous, ...imported]);

      if (!newTitle.trim() && pendingPages.length === 0) {
        const firstName = assets[0].name.replace(/\.[^.]+$/, '');
        setNewTitle(firstName);
      }
    } catch (error) {
      imported.forEach(deleteStoredPage);
      Alert.alert(
        'Import failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    if (busy) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission', 'Allow camera access to photograph music.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });

      if (!result.canceled) {
        await importPages(
          result.assets.map((asset, index) => ({
            uri: asset.uri,
            name: asset.fileName || `SheetMusic-${Date.now()}-${index}.jpg`,
          }))
        );
      }
    } catch {
      Alert.alert('Camera error', 'Could not open the camera.');
    }
  };

  const choosePhotos = async () => {
    if (busy) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        await importPages(
          result.assets.map((asset, index) => ({
            uri: asset.uri,
            name: asset.fileName || `SheetMusic-${Date.now()}-${index}.jpg`,
          }))
        );
      }
    } catch {
      Alert.alert('Photo error', 'Could not select photos.');
    }
  };

  const chooseFiles = async () => {
    if (busy) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        await importPages(
          result.assets.map((asset) => ({
            uri: asset.uri,
            name: asset.name,
          }))
        );
      }
    } catch {
      Alert.alert('File error', 'Could not select files.');
    }
  };

  const removePendingPage = (pageId: string) => {
    const page = pendingPages.find((item) => item.id === pageId);
    if (page) deleteStoredPage(page);
    setPendingPages((items) => items.filter((item) => item.id !== pageId));
  };

  const saveNewMusic = async () => {
    if (busy) return;

    if (!newTitle.trim()) {
      Alert.alert('Title required', 'Enter a name for your sheet music.');
      return;
    }

    if (pendingPages.length === 0) {
      Alert.alert('No pages', 'Add at least one photo or file.');
      return;
    }

    const item: MusicItem = {
      id: makeId(),
      title: newTitle.trim(),
      pages: [...pendingPages],
      createdAt: new Date().toISOString(),
    };

    setBusy(true);

    try {
      const updated = [item, ...library];
      await storeArray(MUSIC_KEY, updated);
      setLibrary(updated);
      setPendingPages([]);
      setNewTitle('');
      Alert.alert('Saved!', 'Your sheet music is now in My Music.');
    } catch {
      Alert.alert('Error', 'Could not save your sheet music.');
    } finally {
      setBusy(false);
    }
  };

  const openMusic = (item: MusicItem) => {
    setSelected(item);
    setEditingTitle(item.title);
  };

  const renameMusic = async () => {
    if (!selected || busy) return;

    if (!editingTitle.trim()) {
      Alert.alert('Title required', 'Enter a music title.');
      return;
    }

    setBusy(true);
    try {
      const updated = library.map((item) =>
        item.id === selected.id
          ? { ...item, title: editingTitle.trim() }
          : item
      );
      await storeArray(MUSIC_KEY, updated);
      setLibrary(updated);
      setSelected({ ...selected, title: editingTitle.trim() });
      Alert.alert('Renamed!', 'Your music title has been updated.');
    } catch {
      Alert.alert('Error', 'Could not rename your music.');
    } finally {
      setBusy(false);
    }
  };

  const deleteMusic = () => {
    if (!selected || busy) return;
    const item = selected;

    Alert.alert('Delete sheet music?', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const updated = library.filter((entry) => entry.id !== item.id);
            await storeArray(MUSIC_KEY, updated);
            setLibrary(updated);
            setSelected(null);
            item.pages.forEach(deleteStoredPage);
          } catch {
            Alert.alert('Error', 'Could not delete this music.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const openDocument = async (page: MusicPage) => {
    if (page.kind === 'image') return;

    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Unavailable', 'Document opening is unavailable here.');
        return;
      }
      await Sharing.shareAsync(page.uri);
    } catch {
      Alert.alert('Error', 'Could not open the document.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          title="My Music"
          subtitle="Photograph, import, and organize your sheet music."
          onBack={onBack}
        />

        <View style={styles.card}>
          <Text style={styles.heading}>Add Sheet Music</Text>
          <Text style={styles.muted}>
            Add multiple pages to save them together as one piece.
          </Text>

          <Button title="📷  Take a Photo" onPress={takePhoto} disabled={busy} />
          <Button title="▧  Choose from Photos" onPress={choosePhotos} disabled={busy} />
          <Button title="📄  Upload a File" onPress={chooseFiles} disabled={busy} />

          <Text style={styles.label}>Music title</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Concert Band Warm-Up"
            placeholderTextColor="#94A3B8"
            value={newTitle}
            onChangeText={setNewTitle}
            maxLength={100}
          />

          <Text style={styles.label}>
            Pages selected: {pendingPages.length}
          </Text>

          {pendingPages.map((page, index) => (
            <View key={page.id} style={styles.pageCard}>
              <Text style={styles.muted}>Page {index + 1}</Text>
              <PagePreview page={page} />
              <Button
                title="Remove Page"
                onPress={() => removePendingPage(page.id)}
                disabled={busy}
              />
            </View>
          ))}

          <Button
            title={busy ? 'Working...' : 'Save to My Music'}
            onPress={saveNewMusic}
            primary
            disabled={busy || pendingPages.length === 0}
          />
        </View>

        <Text style={styles.heading}>
          My Library ({library.length})
        </Text>

        {loading && <Text style={styles.muted}>Loading...</Text>}

        {!loading && library.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.muted}>
              Your library is empty. Add your first sheet music above.
            </Text>
          </View>
        )}

        {library.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => openMusic(item)}
          >
            <Text style={styles.heading}>♫  {item.title}</Text>
            <Text style={styles.muted}>
              {item.pages.length} page(s) ·{' '}
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {item.pages[0]?.kind === 'image' && (
              <Image
                source={{ uri: item.pages[0].uri }}
                style={styles.thumbnail}
                resizeMode="contain"
              />
            )}
            <Text style={styles.link}>View / Rename →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selected !== null}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={styles.back}>← My Music</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{selected?.title}</Text>

            <Text style={styles.label}>Rename music</Text>
            <TextInput
              style={styles.input}
              value={editingTitle}
              onChangeText={setEditingTitle}
              placeholder="Music title"
              placeholderTextColor="#94A3B8"
            />

            <Button
              title="Save New Title"
              onPress={renameMusic}
              primary
              disabled={busy}
            />

            <Text style={styles.heading}>Sheet Music Pages</Text>

            {selected?.pages.map((page, index) => (
              <View key={page.id} style={styles.card}>
                <Text style={styles.heading}>Page {index + 1}</Text>
                <PagePreview page={page} />

                {page.kind !== 'image' && (
                  <Button
                    title="Open / Share Document"
                    onPress={() => openDocument(page)}
                  />
                )}
              </View>
            ))}

            <Button
              title="Delete Sheet Music"
              onPress={deleteMusic}
              disabled={busy}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// PRACTICE — EXISTING SAVED RHYTHMS
// ==========================================

type SavedRhythm = {
  id: string;
  name: string;
  meter: string;
  notes: number[];
};

export function PracticeScreen({ onBack }: ScreenProps) {
  const [rhythms, setRhythms] = useState<SavedRhythm[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tempo, setTempo] = useState(80);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const startTime = useRef<number | null>(null);
  const accumulated = useRef(0);

  useEffect(() => {
    loadArray<SavedRhythm>(RHYTHM_KEY)
      .then((items) => {
        setRhythms(items);
        setSelectedId(items[0]?.id ?? null);
      })
      .catch(() => Alert.alert('Error', 'Could not load saved rhythms.'));
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      if (startTime.current !== null) {
        setSeconds(
          Math.floor(
            (accumulated.current + Date.now() - startTime.current) / 1000
          )
        );
      }
    }, 200);

    return () => clearInterval(timer);
  }, [running]);

  const selected = rhythms.find((item) => item.id === selectedId);

  const toggle = () => {
    if (running) {
      if (startTime.current !== null) {
        accumulated.current += Date.now() - startTime.current;
      }
      startTime.current = null;
      setSeconds(Math.floor(accumulated.current / 1000));
      setRunning(false);
    } else {
      startTime.current = Date.now();
      setRunning(true);
    }
  };

  const finish = async () => {
    if (!selected || saving) return;

    const elapsed = accumulated.current +
      (running && startTime.current !== null
        ? Date.now() - startTime.current
        : 0);

    const duration = Math.floor(elapsed / 1000);
    accumulated.current = elapsed;
    startTime.current = null;
    setSeconds(duration);
    setRunning(false);

    if (duration < 1) {
      Alert.alert('Keep practicing', 'Practice for at least one second.');
      return;
    }

    setSaving(true);

    try {
      const history = await loadArray<PracticeSession>(HISTORY_KEY);

      await storeArray(HISTORY_KEY, [
        {
          id: makeId(),
          rhythmId: selected.id,
          rhythmName: selected.name,
          tempo,
          seconds: duration,
          completedAt: new Date().toISOString(),
        },
        ...history,
      ]);

      accumulated.current = 0;
      setSeconds(0);
      Alert.alert('Saved!', 'Your session appears in My Progress.');
    } catch {
      Alert.alert('Error', 'Could not save practice session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Practice"
        subtitle="Track your rhythm practice sessions."
        onBack={() => {
          setRunning(false);
          onBack();
        }}
      />

      {rhythms.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Practice tracking</Text>
          <Text style={styles.muted}>
            No saved rhythm exercises are available. Sheet-music
            rhythm extraction and playback are coming in a later update.
            Your existing Rhythm Trainer remains available.
          </Text>
        </View>
      ) : (
        <>
          {rhythms.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                selectedId === item.id && styles.selected,
              ]}
              disabled={running || seconds > 0}
              onPress={() => setSelectedId(item.id)}
            >
              <Text style={styles.heading}>{item.name}</Text>
              <Text style={styles.muted}>{item.meter}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.card}>
            <Text style={styles.heading}>{selected?.name}</Text>
            <Text style={styles.label}>Target tempo: {tempo} BPM</Text>

            <View style={styles.row}>
              <Button
                title="− 5 BPM"
                onPress={() => setTempo((n) => Math.max(40, n - 5))}
                disabled={running || seconds > 0}
              />
              <Button
                title="+ 5 BPM"
                onPress={() => setTempo((n) => Math.min(200, n + 5))}
                disabled={running || seconds > 0}
              />
            </View>

            <Text style={styles.timer}>
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:
              {String(seconds % 60).padStart(2, '0')}
            </Text>

            <Button
              title={running ? 'Pause' : seconds ? 'Resume' : 'Start Practice'}
              onPress={toggle}
              primary
              disabled={saving}
            />

            {(running || seconds > 0) && (
              <Button
                title="Finish & Save Session"
                onPress={finish}
                disabled={saving}
              />
            )}

            <Text style={styles.muted}>
              This screen tracks elapsed practice time; it does not
              yet play uploaded sheet music or measure accuracy.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ==========================================
// MY PROGRESS
// ==========================================

export function MyProgressScreen({ onBack }: ScreenProps) {
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArray<PracticeSession>(HISTORY_KEY)
      .then(setHistory)
      .catch(() => Alert.alert('Error', 'Could not load practice history.'))
      .finally(() => setLoading(false));
  }, []);

  const totalSeconds = history.reduce(
    (sum, session) => sum + session.seconds, 0
  );

  const uniqueRhythms = new Set(
    history.map((session) => session.rhythmId)
  ).size;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="My Progress"
        subtitle="Every practice session counts."
        onBack={onBack}
      />

      <View style={styles.card}>
        <Text style={styles.heading}>Your Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{history.length}</Text>
            <Text style={styles.muted}>Sessions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {(totalSeconds / 60).toFixed(1)}
            </Text>
            <Text style={styles.muted}>Minutes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{uniqueRhythms}</Text>
            <Text style={styles.muted}>Rhythms</Text>
          </View>
        </View>
      </View>

      <Text style={styles.heading}>Practice History</Text>

      {loading && <Text style={styles.muted}>Loading...</Text>}

      {!loading && history.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.muted}>
            Complete a practice session to start tracking progress.
          </Text>
        </View>
      )}

      {history.map((session) => (
        <View key={session.id} style={styles.card}>
          <Text style={styles.heading}>{session.rhythmName}</Text>
          <Text style={styles.muted}>
            {new Date(session.completedAt).toLocaleString()}
          </Text>
          <Text style={styles.muted}>
            {Math.floor(session.seconds / 60)}m {session.seconds % 60}s
            {' · '}{session.tempo} BPM
          </Text>
        </View>
      ))}

      <Text style={styles.muted}>
        Statistics reflect recorded practice time, not measured accuracy.
      </Text>
    </ScrollView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10182B',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 60,
  },
  back: {
    color: '#7DD3FC',
    fontSize: 15,
    marginBottom: 26,
  },
  brand: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 28,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    marginVertical: 12,
  },
  muted: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    marginVertical: 5,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  pageCard: {
    backgroundColor: '#10182B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#10182B',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 11,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginVertical: 5,
    flexGrow: 1,
  },
  primaryButton: {
    backgroundColor: '#38BDF8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryText: {
    color: '#10182B',
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.45,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  link: {
    color: '#7DD3FC',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  previewImage: {
    width: '100%',
    height: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 10,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 12,
  },
  filePreview: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginVertical: 10,
  },
  fileSymbol: {
    color: '#7DD3FC',
    fontSize: 48,
  },
  fileName: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 18,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#7DD3FC',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
