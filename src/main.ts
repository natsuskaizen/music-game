import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element in index.html');

mount(App, { target });
import { appTitle } from './core/seed';
document.title = appTitle;
