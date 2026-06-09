module.exports = {
  plugins: [
    // Tailwind v4 — runs first so @import "tailwindcss" (admin only) is expanded
    // before the legacy CSS-Modules pipeline (flexbugs / preset-env) post-processes.
    '@tailwindcss/postcss',
    'next/dist/compiled/postcss-flexbugs-fixes',
    [
      'next/dist/compiled/postcss-preset-env',
      {
        autoprefixer: { flexbox: 'no-2009' },
        stage: 3,
        features: { 'custom-properties': false },
      },
    ],
    require.resolve('./postcss-col'),
  ],
}
