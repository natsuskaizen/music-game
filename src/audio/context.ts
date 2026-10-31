// The one AudioContext for playback (and, from M3-5, listening), set up for iOS (design §4.2).

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const session = (navigator as AudioSessionNavigator).audioSession;

let ctx: AudioContext | undefined;
let ignoreSilentSwitch = true;

/** Sets whether sound plays with the silent switch on; takes effect at once, even after the context exists. */
export function setIgnoreSilentSwitch(ignore: boolean): void {
  ignoreSilentSwitch = ignore;
  if (session) session.type = ignore ? 'playback' : 'auto';
}

/** True on a touch device that can't opt out of the silent switch, where iOS may mute the sound. */
export function needsRingerHint(): boolean {
  return !session && navigator.maxTouchPoints > 0;
}

/**
 * The shared context, made on first use since iOS keeps audio locked until a user gesture. Resuming covers a
 * context iOS suspended or interrupted in the background; the session type follows `setIgnoreSilentSwitch`.
 */
export function audioContext(): AudioContext {
  if (!ctx) {
    setIgnoreSilentSwitch(ignoreSilentSwitch);
    ctx = new AudioContext();
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => undefined);
  return ctx;
}
