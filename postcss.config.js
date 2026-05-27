module.exports = {
  plugins: [
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
