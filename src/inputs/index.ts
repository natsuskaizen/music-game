// The one place that lists the answer inputs (design §3.4). Adding an input is one file and one line here.
import { pianoInput } from './piano';
import { register } from './registry';

register(pianoInput);

export { available, inputById } from './registry';
