// The one AudioContext for playback (and, from M3-5, listening), set up for iOS (design §4.2).

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const session = (navigator as AudioSessionNavigator).audioSession;

let ctx: AudioContext | undefined;
let ignoreSilentSwitch = true;
let recording = false;

/** The session type to use: iOS refuses mic capture under 'playback', so recording needs 'play-and-record'. */
function applySessionType(): void {
  if (session) session.type = recording ? 'play-and-record' : ignoreSilentSwitch ? 'playback' : 'auto';
}

/** Sets whether sound plays with the silent switch on; takes effect at once, even after the context exists. */
export function setIgnoreSilentSwitch(ignore: boolean): void {
  ignoreSilentSwitch = ignore;
  applySessionType();
}

/** Switches the iOS audio session for mic capture on or off; call before `getUserMedia` and again on stop. */
export function setRecording(on: boolean): void {
  recording = on;
  applySessionType();
}

/** iOS suspends audio while the app is in the background: wake the context when the app is shown again. */
function resumeWhenVisible(): void {
  if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running')
    ctx.resume().catch(() => undefined);
}
document.addEventListener('visibilitychange', resumeWhenVisible);

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
