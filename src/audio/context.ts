// The one AudioContext for playback (and, from M3-5, listening), set up for iOS (design §4.2).

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const session = (navigator as AudioSessionNavigator).audioSession;

let ctx: AudioContext | undefined;

/** True on a touch device that can't opt out of the silent switch, where iOS may mute the sound. */
export function needsRingerHint(): boolean {
  return !session && navigator.maxTouchPoints > 0;
}

/**
 * The shared context, made on first use since iOS keeps audio locked until a user gesture. A 'playback' session
 * plays with the silent switch on; resuming covers a context iOS suspended or interrupted in the background.
 */
export function audioContext(): AudioContext {
  if (!ctx) {
    if (session) session.type = 'playback';
    ctx = new AudioContext();
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => undefined);
  return ctx;
}
