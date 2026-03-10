import { useState, useEffect } from 'react';
import { Settings, Play, Square, Download, FileAudio, Clock, Activity, Volume2 } from 'lucide-react';
import { audioEngine } from './audio/engine';
import { generateClickTrack } from './audio/exporter';
import { ClickType } from './audio/synth';

import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export default function App() {
  const [bpm, setBpm] = useState<number>(120);
  const [lengthSeconds, setLengthSeconds] = useState<number>(60);
  const [clickType, setClickType] = useState<ClickType>('standard');
  const [tone, setTone] = useState<number>(50);
  const [volume, setVolume] = useState<number>(80);
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav');
  const [timeSignature, setTimeSignature] = useState<string>('4/4');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isPlaying) {
      const [num, den] = timeSignature.split('/').map(Number);
      audioEngine.updateParams(bpm, clickType, tone, volume, num, den);
    }
  }, [bpm, clickType, tone, volume, timeSignature, isPlaying]);

  useEffect(() => {
    // cleanup on unmount
    return () => audioEngine.stop();
  }, []);

  const handlePreviewToggle = () => {
    const [num, den] = timeSignature.split('/').map(Number);
    const newState = audioEngine.toggle(bpm, clickType, tone, volume, num, den);
    setIsPlaying(newState);
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      // Stop preview if it's playing
      if (isPlaying) {
        audioEngine.stop();
        setIsPlaying(false);
      }

      const [num] = timeSignature.split('/').map(Number);
      const { data, filename } = await generateClickTrack(bpm, lengthSeconds, clickType, tone, volume, num, format);

      const filePath = await save({
        defaultPath: filename
      });

      if (!filePath) {
        setIsGenerating(false);
        return;
      }

      await writeFile(filePath, data);

      // Optional: alert('Successfully saved file!');
    } catch (error: any) {
      console.error('Failed to generate click track:', error);
      alert(`Failed to generate audio file: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>
          <Activity size={24} color="var(--accent-primary)" />
          Click Track Generator
        </h1>
        <p>Customizable metronome tracks for practice</p>
      </div>

      <div className="controls-grid">
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="bpm">
              <Activity size={16} /> BPM
            </label>
            <input
              id="bpm"
              type="number"
              min="30"
              max="400"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value) || 30)}
            />
          </div>

          <div className="control-group">
            <label htmlFor="length">
              <Clock size={16} /> Length (sec)
            </label>
            <input
              id="length"
              type="number"
              min="1"
              value={lengthSeconds}
              onChange={(e) => setLengthSeconds(Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="click-type">
            <Settings size={16} /> Sound Type
          </label>
          <select
            id="click-type"
            value={clickType}
            onChange={(e) => setClickType(e.target.value as ClickType)}
          >
            <option value="standard">Standard Metronome</option>
            <option value="metal">Metal Click</option>
            <option value="cowbell">Cowbell</option>
            <option value="soft-wood">Soft Stick</option>
            <option value="hi-hat">Hi-hat Style Click</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="time-signature">
            <Settings size={16} /> Time Signature
          </label>
          <select
            id="time-signature"
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="2/4">2/4</option>
            <option value="6/8">6/8</option>
            <option value="12/8">12/8</option>
            <option value="6/4">6/4</option>
            <option value="3/2">3/2</option>
            <option value="1/2">1/2</option>
            <option value="15/16">15/16</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="tone">
            <Settings size={16} /> Tone
          </label>
          <input
            id="tone"
            type="range"
            min="0"
            max="100"
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="volume">
            <Volume2 size={16} /> Volume
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="200"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>
            <FileAudio size={16} /> Export Format
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="wav"
                checked={format === 'wav'}
                onChange={() => setFormat('wav')}
              />
              WAV
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="format"
                value="mp3"
                checked={format === 'mp3'}
                onChange={() => setFormat('mp3')}
              />
              MP3
            </label>
          </div>
        </div>
      </div>

      <div className="actions">
        <button
          className={`btn-preview ${isPlaying ? 'active' : ''}`}
          onClick={handlePreviewToggle}
          disabled={isGenerating}
        >
          {isPlaying ? (
            <>
              <Square size={20} /> Stop Preview
            </>
          ) : (
            <>
              <Play size={20} /> Preview Track
            </>
          )}
        </button>

        <button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={isGenerating || isPlaying}
        >
          {isGenerating ? (
            'Generating...'
          ) : (
            <>
              <Download size={20} /> Generate & Download
            </>
          )}
        </button>
      </div>
    </div>
  );
}
