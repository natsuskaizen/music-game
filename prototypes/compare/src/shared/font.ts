import bravuraUrl from '../assets/bravura-subset.woff2?inline';

/** Bravura subset (clefs + noteheads, ~3 KB). Must load before either renderer draws. */
export async function loadFonts() {
  const face = new FontFace('Bravura', `url(${bravuraUrl})`);
  document.fonts.add(await face.load());
  await Promise.allSettled([
    document.fonts.load('700 22px "Atkinson Hyperlegible"'),
    document.fonts.load('400 16px "Atkinson Hyperlegible"'),
  ]);
}
