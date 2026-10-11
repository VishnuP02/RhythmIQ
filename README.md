# RhythmIQ

**Learn it. Hear it. Play it.**

RhythmIQ is a mobile music education app built to help instrumentalists and vocalists strengthen their rhythm-reading skills, organize sheet music, and track their practice. It combines interactive rhythm exercises with a personal music library in one React Native app.

> **Status:** Active development. RhythmIQ is a personal software project and is not currently published on the App Store or Google Play.

## Features

### Rhythm Trainer
- Practice rhythms displayed on a musical staff.
- Generate randomized rhythm exercises.
- Create your own exercises with the Rhythm Builder.
- Adjust tempo and use metronome audio during practice.
- Practice tapping along and receive timing feedback.

### My Music
- Add sheet music using the camera, photo library, or document picker.
- Organize imported pages into titled music entries.
- Rename and manage saved music.
- Store imported files locally on the device.
- Import image, PDF, MusicXML, and MXL files for library storage. **Importing MusicXML or MXL does not yet mean the app can play or interpret those scores.**

### Practice and Progress
- Choose from instrument and voice categories during onboarding.
- Track practice time for saved rhythm exercises.
- Save practice sessions and view practice history and summary statistics.

## Tech Stack

| Area | Technology |
| --- | --- |
| Mobile app | React Native, Expo |
| Language | TypeScript |
| Audio | Expo Audio |
| File imports | Expo Image Picker, Expo Document Picker |
| Local file storage | Expo File System |
| Local app data | AsyncStorage |
| Musical staff graphics | React Native SVG |

## Screenshots

Screenshots will be added as the app's interface is refined. Planned examples include the home dashboard, Rhythm Trainer, My Music library, and My Progress screen.

## Getting Started

### Prerequisites

- Node.js and npm
- Expo Go on a compatible physical device, or an appropriate iOS/Android development environment

### Run locally

```bash
# Clone the repository
git clone https://github.com/VishnuP02/RhythmIQ.git
cd RhythmIQ

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Follow the Expo terminal instructions to open the app on your device. Some native features, including camera and file access, require testing on a physical device and appropriate permissions.

## Project Structure

```text
RhythmIQ/
├── App.tsx                  # App entry UI and navigation
├── screens/
│   ├── HomeScreen.tsx       # Home dashboard
│   ├── RhythmTrainerScreen.tsx
│   ├── RhythmStaff.tsx      # Staff notation rendering
│   └── LibraryScreens.tsx   # My Music, Practice, My Progress
├── lib/
│   ├── rhythm.ts            # Rhythm data and generation
│   └── trainer.ts           # Rhythm practice logic
├── assets/
│   └── sounds/              # Metronome and tap audio
└── package.json
```

## Roadmap

The following features are **planned or under development**, not part of the current verified release:

- [ ] Read notes and rhythms from imported MusicXML scores
- [ ] Play selected instrument parts with adjustable playback controls
- [ ] Add choir voice-part practice and part isolation
- [ ] Recognize musical notation in photographed or PDF sheet music
- [ ] Expand playback sounds and practice feedback
- [ ] Test and refine the experience across iOS and Android devices

## Current Limitations

- Sheet music can be imported and organized, but uploaded scores are **not yet converted into playable notation**.
- PDF and image uploads are not processed with optical music recognition.
- Practice history is stored locally; there is no cloud sync or account system.
- The app is under active development and has not undergone a public production release.

## Why I Built It

RhythmIQ brings together my interests in music and software engineering. The goal is to make independent rhythm practice more approachable for students preparing for lessons, rehearsals, and performances.

## License

See [LICENSE](LICENSE) for the license included with this repository.
