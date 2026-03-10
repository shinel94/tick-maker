# Click Track Generator

A sleek, robust, and entirely local web application for generating customizable practice click tracks.

## Features
- Configure BPM, Track Length, Sound Type, Audio Tone, and Volume.
- Real-time instant preview of your configured click sound.
- High-quality audio generation directly in your browser.
- Export as WAV or MP3 files for offline use.
- Beautiful, fully responsive dark-themed UI built with Glassmorphism techniques using pure CSS.
- No cloud backend required—everything runs locally.

## Getting Started

1. **Install dependencies**
   ```sh
   npm install
   ```
2. **Run the development server locally**
   ```sh
   npm run dev
   ```
3. Open the provided `localhost` link in your web browser.

## Tech Stack
- Frontend UI: React + Vite + TypeScript
- Styling: Custom Vanilla CSS with CSS Variables and responsive grid system
- Sound Engine: Raw Web Audio API (`AudioContext` and `OfflineAudioContext`)
- Iconography: Lucide React
- MP3 Encoding: `lamejs` running locally on the client

Enjoy!
