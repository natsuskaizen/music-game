import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element in index.html');

mount(App, { target });
// M0-AC10 seed: src/ change without docs/STATUS.md (to be reverted)
