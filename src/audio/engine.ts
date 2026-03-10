import { playClick, ClickType } from './synth';

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private isPlaying: boolean = false;
    private timerId: number | null = null;
    private nextNoteTime: number = 0;

    public bpm: number = 120;
    public clickType: ClickType = 'standard';
    public tone: number = 50;
    public volume: number = 80;
    public timeSignatureNumerator: number = 4;
    public timeSignatureDenominator: number = 4;

    private lookahead: number = 25.0;
    private scheduleAheadTime: number = 0.1;
    private currentBeatInBar: number = 0;

    public init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    public updateParams(
        bpm: number,
        clickType: ClickType,
        tone: number,
        volume: number,
        timeSignatureNumerator: number = 4,
        timeSignatureDenominator: number = 4
    ) {
        this.bpm = bpm;
        this.clickType = clickType;
        this.tone = tone;
        this.volume = volume;
        this.timeSignatureNumerator = timeSignatureNumerator;
        this.timeSignatureDenominator = timeSignatureDenominator;
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.currentBeatInBar = (this.currentBeatInBar + 1) % this.timeSignatureNumerator;
    }

    private scheduleNote(beatNumber: number, time: number) {
        if (!this.ctx) return;
        let currentTone = this.tone;
        if (beatNumber === 0) {
            currentTone = Math.min(100, this.tone + 20); // Accent 1st beat of the measure
        }
        playClick(this.ctx, time, this.clickType, currentTone, this.volume);
    }

    private scheduler = () => {
        if (!this.isPlaying || !this.ctx) return;

        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeatInBar, this.nextNoteTime);
            this.nextNote();
        }

        this.timerId = window.setTimeout(this.scheduler, this.lookahead);
    };

    public start() {
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentBeatInBar = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05; // start slightly in future
        this.scheduler();
    }

    public stop() {
        this.isPlaying = false;
        if (this.timerId !== null) {
            window.clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    public toggle(
        bpm: number,
        clickType: ClickType,
        tone: number,
        volume: number,
        timeSignatureNumerator: number = 4,
        timeSignatureDenominator: number = 4
    ) {
        this.updateParams(bpm, clickType, tone, volume, timeSignatureNumerator, timeSignatureDenominator);
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    }
}

export const audioEngine = new AudioEngine();
