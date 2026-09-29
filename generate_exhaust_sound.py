import numpy as np
from scipy.io import wavfile
import os

def create_bmw_exhaust_sound(filename="bmw_m_exhaust.wav"):
    sample_rate = 44100
    duration = 5.2 # seconds
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    num_samples = len(t)

    # 1. RPM Profile over time
    # 0.0 - 0.4s: Starter motor churn (300 -> 450 RPM)
    # 0.4 - 0.9s: Ignition catch & flare (800 -> 3200 RPM)
    # 0.9 - 1.4s: Dip to 2000 RPM
    # 1.4 - 2.5s: Aggressive full-throttle power surge to 7250 RPM redline!
    # 2.5 - 3.6s: Throttle liftoff drop with overrun crackles
    # 3.6 - 5.2s: Settling into aggressive M lumpy idle (950 RPM)
    
    rpm = np.zeros(num_samples)
    for i, time in enumerate(t):
        if time < 0.35:
            # Starter motor
            rpm[i] = 280 + (time / 0.35) * 200
        elif time < 0.85:
            # Ignition flare
            p = (time - 0.35) / 0.50
            rpm[i] = 480 + np.sin(p * np.pi * 0.5) * 2700
        elif time < 1.35:
            # Brief dip
            p = (time - 0.85) / 0.50
            rpm[i] = 3180 - p * 1200
        elif time < 2.45:
            # Huge M power rev to 7250 RPM!
            p = (time - 1.35) / 1.10
            # Exponential throttle punch
            rpm[i] = 1980 + (p ** 1.4) * 5270
        elif time < 3.5:
            # Engine braking / deceleration drop
            p = (time - 2.45) / 1.05
            rpm[i] = 7250 * np.exp(-p * 2.2) + 950 * (1 - np.exp(-p * 2.2))
        else:
            # Throaty idle with slight lumpy cam variation
            rpm[i] = 950 + 40 * np.sin(2 * np.pi * 3.5 * time) + 25 * np.sin(2 * np.pi * 7.1 * time)

    # 2. Cylinder firing fundamental frequency (Inline-6 / V8 TwinPower Turbo)
    # Inline 6: 3 firings per revolution -> f = rpm / 60 * 3 = rpm / 20
    freq_fund = rpm / 20.0 # ~45Hz at 900 RPM up to 362Hz at 7250 RPM

    # Integrate frequency to get continuous phase
    phase_fund = 2 * np.pi * np.cumsum(freq_fund) / sample_rate

    # 3. Rich Combustion Harmonic Series (Throaty, aggressive BMW M bark)
    # Cylinders generate asymmetric pulse trains: harmonics 1x, 2x, 3x, 4x, 5x, 6x, 8x
    raw_engine = (
        1.00 * np.sin(phase_fund) +
        0.85 * np.sin(2 * phase_fund + 0.3) +
        0.70 * np.sin(3 * phase_fund + 0.8) +
        0.55 * np.sin(4 * phase_fund + 1.2) +
        0.40 * np.sin(5 * phase_fund + 1.7) +
        0.30 * np.sin(6 * phase_fund + 2.1) +
        0.20 * np.sin(8 * phase_fund + 2.5)
    )

    # Add cylinder firing pressure wave distortion (asymmetrical tube saturation)
    # Soft clipping to simulate exhaust pipe pressure distortion
    saturated_engine = np.tanh(raw_engine * 1.8)

    # 4. Deep Sub-Bass Exhaust Thump (40 - 80 Hz exhaust pipe pulse)
    sub_bass = np.sin(phase_fund * 0.5) * 0.6 + np.sin(phase_fund) * 0.5
    sub_bass = np.tanh(sub_bass * 1.4)

    # 5. Twin-Turbo Compressor Spool & Wastegate Whine
    # Whine rises from 1.2 kHz to 4.2 kHz during high throttle
    turbo_freq = 800 + (rpm / 7250.0) ** 2 * 3400
    turbo_phase = 2 * np.pi * np.cumsum(turbo_freq) / sample_rate
    turbo_whine = np.sin(turbo_phase) * 0.15 + np.sin(turbo_phase * 2.02) * 0.08
    # Turbo amplitude peaks when RPM > 3000
    turbo_envelope = np.clip((rpm - 2200) / 4000.0, 0, 1) ** 1.5
    turbo_sound = turbo_whine * turbo_envelope * 0.35

    # Turbo wastegate / blow-off valve release "pshh-whoosh" at liftoff (2.4s - 2.9s)
    bov_noise = np.random.randn(num_samples)
    bov_envelope = np.exp(-((t - 2.55) / 0.18) ** 2) * 0.35
    # High-pass filter noise for air hiss
    bov_sound = bov_noise * bov_envelope

    # 6. Exhaust Overrun Pops & Burbles (Signature BMW M Decel Crackles between 2.7s and 3.8s)
    # Distinct sharp crackle impulses
    pops = np.zeros(num_samples)
    pop_times = [2.72, 2.86, 2.98, 3.12, 3.25, 3.42, 3.60]
    for pt in pop_times:
        idx = int(pt * sample_rate)
        if idx < num_samples:
            pop_len = int(sample_rate * 0.065) # 65ms per crackle
            decay = np.exp(-np.linspace(0, 12, pop_len))
            # Sharp explosive burst
            burst = (np.random.randn(pop_len) * 0.7 + np.sin(np.linspace(0, 30, pop_len)) * 0.8) * decay
            end_idx = min(num_samples, idx + pop_len)
            pops[idx:end_idx] += burst[:end_idx - idx] * (0.85 + 0.3 * np.random.rand())

    # 7. Acoustic Room / Road Resonance
    # Overall throttle volume envelope
    vol_envelope = np.ones(num_samples)
    for i, time in enumerate(t):
        if time < 0.35:
            vol_envelope[i] = 0.25 + (time / 0.35) * 0.2
        elif time < 0.85:
            vol_envelope[i] = 0.85
        elif time < 1.35:
            vol_envelope[i] = 0.65
        elif time < 2.45:
            p = (time - 1.35) / 1.10
            vol_envelope[i] = 0.70 + p * 0.30 # Peak volume at redline
        elif time < 3.6:
            p = (time - 2.45) / 1.15
            vol_envelope[i] = 0.95 - p * 0.35
        elif time < duration:
            p = (time - 3.6) / (duration - 3.6)
            vol_envelope[i] = 0.60 * (1 - p * 0.25)

    # Combine all layers:
    # Layer 1: Saturated combustion exhaust roar
    # Layer 2: Sub-bass resonance
    # Layer 3: Twin-turbo spool & blow-off
    # Layer 4: Overrun burbles & pops
    # Layer 5: Mechanical starter at start
    starter_noise = np.zeros(num_samples)
    for i, time in enumerate(t):
        if time < 0.38:
            starter_noise[i] = (np.sin(2 * np.pi * 65 * time) + 0.4 * np.random.randn()) * 0.35

    composite = (
        saturated_engine * 0.65 +
        sub_bass * 0.45 +
        turbo_sound * 0.30 +
        bov_sound * 0.25 +
        pops * 0.60 +
        starter_noise * 0.40
    ) * vol_envelope

    # Master limiter & stereo enhancement
    # Create slight stereo spread for wide quad-exhaust soundstage
    delay_samples = int(sample_rate * 0.0018) # 1.8ms Haas effect
    left_channel = composite
    right_channel = np.zeros_like(composite)
    right_channel[delay_samples:] = composite[:-delay_samples] * 0.95 + composite[delay_samples:] * 0.05
    right_channel[:delay_samples] = composite[:delay_samples]

    stereo = np.vstack([left_channel, right_channel]).T

    # Normalize to -0.5 dB
    max_val = np.max(np.abs(stereo))
    if max_val > 0:
        stereo = stereo / max_val * 0.95

    # Convert to 16-bit PCM WAV
    audio_int16 = (stereo * 32767).astype(np.int16)
    wavfile.write(filename, sample_rate, audio_int16)
    print(f"Successfully generated studio BMW M exhaust sound: '{filename}' ({os.path.getsize(filename)/1024:.1f} KB)")

if __name__ == "__main__":
    create_bmw_exhaust_sound()
