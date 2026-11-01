// The one place that lists the answer inputs (design §3.4). Adding an input is one file and one line here.
import { handwritingInput } from './handwriting';
import { pianoInput } from './piano';
import { micInput } from './mic';
import { register } from './registry';
import { scriptedInput } from './scripted';
import { speechInput } from './speech';

register(pianoInput);
register(micInput);
register(speechInput);
register(handwritingInput);
// Production builds drop this branch, and with it the scripted input.
if (import.meta.env.MODE === 'e2e') register(scriptedInput);

export { available, inputById } from './registry';
