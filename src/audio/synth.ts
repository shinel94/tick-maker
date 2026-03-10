export type ClickType = 'standard' | 'metal' | 'cowbell' | 'soft-wood' | 'hi-hat';

export function playClick(
    ctx: BaseAudioContext,
    time: number,
    type: ClickType,
    tone: number,
    volume: number,
    destination: AudioNode = ctx.destination
) {
    // volume: 0 to 100 -> 0.0 to 1.0
    const vol = (volume / 100) * 0.8;
    // tone: 0 to 100 -> mapped to frequency range realistically
    const baseFreq = 400 + (tone * 8); // 400Hz to 1200Hz

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, time);
    masterGain.connect(destination);

    if (type === 'standard') {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 2, time);

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(1, time + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(env);
        env.connect(masterGain);

        osc.start(time);
        osc.stop(time + 0.05);
    } else if (type === 'metal') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const env = ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(baseFreq * 3, time);
        osc2.frequency.setValueAtTime(baseFreq * 4.2, time);

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(1, time + 0.002);
        env.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc1.connect(env);
        osc2.connect(env);
        env.connect(masterGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.1);
        osc2.stop(time + 0.1);
    } else if (type === 'cowbell') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const env = ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';

        const cbFreq = baseFreq;
        osc1.frequency.setValueAtTime(cbFreq, time);
        osc2.frequency.setValueAtTime(cbFreq * 1.481, time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(cbFreq * 1.5, time);
        filter.Q.value = 1;

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(1, time + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.3);
        osc2.stop(time + 0.3);
    } else if (type === 'soft-wood') {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq * 1.2, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(1, time + 0.015);
        env.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        osc.start(time);
        osc.stop(time + 0.15);
    } else if (type === 'hi-hat') {
        // Simple white noise synthesis for hi-hat
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(1, time + 0.002);
        env.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        noiseSource.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        noiseSource.start(time);
        noiseSource.stop(time + 0.05);
    }
}
