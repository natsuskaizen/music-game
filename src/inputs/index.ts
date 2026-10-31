// The one place that lists the answer inputs (design §3.4). Adding an input is one file and one line here.
import { pianoInput } from './piano';
import { register } from './registry';
import { scriptedInput } from './scripted';

register(pianoInput);
// Production builds drop this branch, and with it the scripted input.
if (import.meta.env.MODE === 'e2e') register(scriptedInput);

export { available, inputById } from './registry';
