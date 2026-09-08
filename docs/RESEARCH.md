# Click tracks, tempo and reverb pre-delay

Research checked 7 September 2026. This document separates documented source behaviour from the engineering choices implemented in Tempo Time.

## Recommendation

For an **isolated, regularly spaced click channel**, use an amplitude-envelope threshold with hysteresis and a retrigger guard, then estimate tempo from successive onset timestamps. Keep **click fractions** as the default way to calculate pre-delay. Offer **note values** with an explicit “each click is a…” setting. Do not require a time signature or infer one from click pitch.

This is the approach implemented in the macOS app. It is deliberately a click-track timing tool rather than a general beat tracker for mixed music.

## Is a loudness threshold enough?

Threshold detection is a reasonable starting point for this signal. However, “every sample above a threshold is a tap” is wrong: a pitched click contains many waveform cycles, can ring, and may cross a threshold repeatedly. A detector needs to identify a new onset rather than count samples or peaks.

Existing onset tools expose both a threshold/silence setting and a minimum interval between onsets. That supports using these controls together; it does not establish universal parameter values. [aubio onset API](https://aubio.org/doc/latest/onset_8h.html).

Research on general musical onsets also uses spectral and phase information because musical attacks are more varied than isolated clicks. Such methods are sensible if the product later needs to analyze full mixes, but do not resolve the musical note-value ambiguity by themselves. [Duxbury, Sandler & Davies, *A Hybrid Approach to Musical Note Onset Detection*, DAFx 2002](https://dafx.de/papers/DAFX02_Duxbury_Sandler_Davis_note_onset_detection.pdf).

**Implementation choices:**

1. Remove DC with a 20 Hz high-pass filter.
2. Follow the rectified peak with a 3 ms decay, so individual waveform cycles do not act as separate clicks.
3. Trigger when the envelope crosses the adjustable threshold; default −30 dBFS.
4. Require 4 ms below half that amplitude (approximately 6 dB lower) to re-arm.
5. Use an 80 ms default retrigger guard, adjustable from 40 to 250 ms. Suppressed crossings also disarm, so an echo tail cannot fire at the guard’s expiry.
6. Timestamp at audio-sample position. Average up to eight consistent intervals, reject isolated anomalies, and accept a new tempo after three matching changed intervals.

Those constants are tuning choices, supported by the synthetic tests in this repository; they are not claimed industry standards or a benchmark against recorded shows. Set the threshold below the **quietest intended click**, not only below the accent. A stable result can otherwise measure bar accents, skip quiet subdivisions, or follow another consistent sound. An echo after the guard or an irregular/swing click pattern remains ambiguous. Lower the guard for faster clicks, keeping it shorter than the intended spacing.

The level meter is a raw peak meter for channel selection and gain checks; the detector compares its DC-filtered envelope. For a clean click these are similar, but they are not mathematically identical.

## Do crotchets versus quavers matter?

They matter **when naming durations or reporting quarter-note BPM**. They are unnecessary when describing a fraction of the measured click interval.

Let `T` be the measured spacing in milliseconds, and `u` the number of quarter notes represented by each click:

- Quarter/crotchet: `u = 1`
- Eighth/quaver: `u = 0.5`
- Sixteenth/semiquaver: `u = 0.25`
- Dotted quarter: `u = 1.5`
- Half/minim: `u = 2`

Then:

```text
clicks per minute       = 60,000 / T
quarter-note BPM        = 60,000 × u / T
quarter-note duration   = T / u
1/n note duration       = (4 / n) × T / u
1/n of a click          = T / n
```

Dotted values multiply by `1.5`; triplets multiply by `2/3`. Conversion uses the measured interval at full precision, not the rounded BPM display.

For the **same 500 ms click spacing**:

| Meaning assigned to each click | Quarter-note BPM | Straight 1/32 note | 1/8 of a click |
| --- | ---: | ---: | ---: |
| Quarter / crotchet | 120 | 62.50 ms | 62.50 ms |
| Eighth / quaver | 60 | 125.00 ms | 62.50 ms |
| Dotted quarter | 180 | 41.67 ms | 62.50 ms |

The final column is independent of note interpretation. This makes it a useful default for pre-delay, while retaining explicit named notes for engineers who know the session’s click subdivision. The dial therefore says **clicks/min** (or taps/min). In note mode, a separate, explicitly labelled quarter-note BPM appears. Manual input always specifies quarter-note BPM.

## Does time signature matter?

For these **individual note durations**, no: an interval and its note value are enough. Time signature becomes relevant if you want bar duration, beat grouping or the position within a bar. A whole note is not necessarily one bar.

There is one practical trap: a DAW may derive its click subdivision from the meter. Ableton’s default metronome rhythm follows the time-signature denominator, and users can select other divisions. Therefore, assuming every incoming click is a quarter note can be wrong even when the DAW tempo is known. [Ableton Live manual, Metronome Settings](https://www.ableton.com/en/manual/recording-new-clips/#metronome-settings).

Compound meter also does not uniquely choose a pulse: in 6/8, a click might mark each eighth or each dotted-quarter group. Once the user supplies that click unit, no meter selector is needed to calculate milliseconds.

## Can the high-pitched click identify the bar or meter?

A different-sounding accent can be useful evidence of a repeating group, but the documentation does not support treating it as a standardized, self-describing signal. Logic allows separate bar, group, beat and division clicks, with adjustable pitch and velocity. [Apple, Logic Pro metronome project settings](https://support.apple.com/en-euro/guide/logicpro/lgcpe1d6118e/mac). Ableton also allows replacement metronome samples. [Ableton, Customizing the Metronome sound](https://help.ableton.com/hc/en-us/articles/209067669-Customizing-the-Metronome-sound).

**Inference:** an accent every three clicks may reveal a three-click grouping, but cannot uniquely distinguish three quarter-note clicks from three eighth-note clicks, a custom pattern, or a group accent inside a longer bar. Pitch alone does not supply the missing note denominator. Count-ins and subdivision layers complicate this further.

A future accent-pattern indicator could be useful for orientation. It should ask users to confirm the interpretation and should not silently change timing values. It adds little to this version’s main pre-delay task, so automatic accent/meter inference is not implemented. Different click pitches are covered by the detector tests.

## What is useful for reverb pre-delay?

Pre-delay separates the dry event from the start of the reverb. Tempo-related choices are established plug-in behaviour: FabFilter offers synchronized note divisions and a scaling control for dotted/triplet-like durations. It also permits ordinary unsynchronized pre-delay. [FabFilter Pro-R 2, Main controls](https://www.fabfilter.com/help/pro-r/using/maincontrols).

For example, at quarter-note BPM 120, a straight 1/32 note gives 62.50 ms; a 1/64 note gives 31.25 ms. These are starting points to audition, not a claim that every reverb should be synchronized or that there is one correct delay. Tempo Time offers small fractions, longer note values, and a plain number for copying. It does not alter plug-in parameters, audio latency, reverb decay or the dry signal.

## Why Core Audio for Dante?

Audinate documents DVS as a standard Core Audio device on macOS, so there is no need to implement Dante networking in this app. The user starts DVS and routes the click with Dante Controller; Tempo Time selects the resulting input and channel. [Audinate, Choosing an Audio Application](https://dev.audinate.com/GA/dvs/userguide/webhelp/content/choosing_an_audio_application.htm).

Apple’s AUHAL interface supports input capture from a selected device and explicit channel mapping. The adapter follows that input-only structure and requests mono float audio at the device’s sample rate. [Apple Technical Note TN2091](https://developer.apple.com/library/archive/technotes/tn2091/_index.html).

Constant input latency cancels when subtracting successive onset times; callback delivery jitter should not become tempo jitter. That is why the implementation uses audio timestamps and sample positions rather than UI timers. Variable waveform attacks, clock drift, gaps and changed sample rates can still affect measurements. Timestamp gaps reset the tracker; detected device/format changes stop capture for retry. Real DVS routing and macOS permissions remain hardware validation tasks, described in [TESTING.md](TESTING.md).
