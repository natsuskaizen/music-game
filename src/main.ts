import { mount } from 'svelte';
import App from './App.svelte';
import { loadSettings } from './core/settings';
import { activeTheme } from './core/theme';
import './app.css';
import './themes.css';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element in index.html');

// Set before the first paint so the saved theme never flashes the default one.
document.documentElement.dataset.theme = activeTheme(location.search, loadSettings(localStorage).theme);
mount(App, { target });
