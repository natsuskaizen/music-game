import { mount } from 'svelte';
import App from './App.svelte';
import { themeFromQuery } from './core/theme';
import './app.css';
import './themes.css';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app element in index.html');

const theme = themeFromQuery(location.search);
document.documentElement.dataset.theme = theme;
mount(App, { target, props: { theme } });
