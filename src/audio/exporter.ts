import lamejs from 'lamejs-fixed';
import { playClick, ClickType } from './synth';

export async function generateClickTrack(
    bpm: number,
    lengthSeconds: number,
    clickType: ClickType,
    tone: number,
    volume: number,
    timeSignatureNumerator: number,
    format: 'wav' | 'mp3'
): Promise<{ data: Uint8Array; filename: string }> {
    const sampleRate = 44100;
    const OfflineAudioCtor = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineAudioCtor(1, Math.ceil(sampleRate * lengthSeconds), sampleRate);

    const secondsPerBeat = 60.0 / bpm;
    let nextNoteTime = 0;
    let beatNumber = 0;

    while (nextNoteTime < lengthSeconds) {
        let currentTone = tone;
        if (beatNumber % timeSignatureNumerator === 0) {
            currentTone = Math.min(100, tone + 20); // Accent 1st beat of every measure
        }
        playClick(offlineCtx, nextNoteTime, clickType, currentTone, volume);
        nextNoteTime += secondsPerBeat;
        beatNumber++;
    }

    const renderedBuffer = await offlineCtx.startRendering();

    if (format === 'wav') {
        const waveData = audioBufferToWav(renderedBuffer);
        return { data: waveData, filename: `click-track-${bpm}bpm.wav` };
    } else {
        const mp3Data = audioBufferToMp3(renderedBuffer);
        return { data: mp3Data, filename: `click-track-${bpm}bpm.mp3` };
    }
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function audioBufferToWav(buffer: AudioBuffer): Uint8Array {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * numOfChan * 2, true);

    // write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    offset = 44;
    while (pos < buffer.length) {
        for (let i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Uint8Array(view.buffer);
}

function audioBufferToMp3(buffer: AudioBuffer): Uint8Array {
    const mp3encoder = new lamejs.Mp3Encoder(1, buffer.sampleRate, 128); // mono
    const samples = buffer.getChannelData(0);
    const sampleBlockSize = 1152;
    const mp3Data: Int8Array[] = [];

    const int16Samples = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
        const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    let totalLength = 0;
    for (const chunk of mp3Data) { totalLength += chunk.length; }
    const res = new Int8Array(totalLength);
    let offset = 0;
    for (const chunk of mp3Data) {
        res.set(chunk, offset);
        offset += chunk.length;
    }

    return new Uint8Array(res.buffer);
}
