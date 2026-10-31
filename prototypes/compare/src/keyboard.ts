import { mount } from 'svelte';
import KeyboardQuiz from './svelte/KeyboardQuiz.svelte';
import { loadFonts } from './shared/font';

await loadFonts();
mount(KeyboardQuiz, { target: document.getElementById('app')! });
