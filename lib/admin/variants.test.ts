import { describe, it, expect } from 'vitest'
import { slug, comboKey, buildGrid, dedupeOptions } from './variants'

describe('slug', () => {
  it('uppercases and strips spaces/punctuation', () => {
    expect(slug('Size')).toBe('SIZE')
    expect(slug('Bleu marine')).toBe('BLEUMARINE')
    expect(slug('K-Strut 2024')).toBe('KSTRUT2024')
  })

  it('strips diacritics', () => {
    expect(slug('Été')).toBe('ETE')
    expect(slug('Crème brûlée')).toBe('CREMEBRULEE')
  })

  it('returns empty string for non-alphanumeric input', () => {
    expect(slug('')).toBe('')
    expect(slug('—/!?')).toBe('')
  })
})

describe('comboKey', () => {
  it('joins picks in axis order, regardless of pick key order', () => {
    const opts = [{ code: 'SIZE' }, { code: 'COLOR' }]
    expect(comboKey(opts, { COLOR: 'BLUE', SIZE: 'M' })).toBe('SIZE:M|COLOR:BLUE')
  })

  it('is empty for no axes', () => {
    expect(comboKey([], {})).toBe('')
  })
})

describe('buildGrid', () => {
  it('returns no rows when there are no axes', () => {
    expect(buildGrid([])).toEqual([])
  })

  it('produces one row per value for a single axis', () => {
    const rows = buildGrid([{ code: 'SIZE', values: [{ code: 'S' }, { code: 'M' }] }])
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.pick)).toEqual([{ SIZE: 'S' }, { SIZE: 'M' }])
  })

  it('produces the full cartesian product across axes', () => {
    const rows = buildGrid([
      { code: 'SIZE', values: [{ code: 'S' }, { code: 'M' }] },
      { code: 'COLOR', values: [{ code: 'RED' }, { code: 'BLUE' }, { code: 'BLACK' }] },
    ])
    expect(rows).toHaveLength(6)
    // first axis is the outer loop
    expect(rows[0].pick).toEqual({ SIZE: 'S', COLOR: 'RED' })
    expect(rows[1].pick).toEqual({ SIZE: 'S', COLOR: 'BLUE' })
    expect(rows[3].pick).toEqual({ SIZE: 'M', COLOR: 'RED' })
    // cells carry the picked values, one per axis
    expect(rows[0].cells).toEqual([{ code: 'S' }, { code: 'RED' }])
  })
})

describe('dedupeOptions', () => {
  it('drops axes without a code or without any coded value', () => {
    const out = dedupeOptions([
      { code: '', values: [{ code: 'X' }] },
      { code: 'SIZE', values: [{ code: '' }] },
      { code: 'COLOR', values: [{ code: 'RED' }] },
    ])
    expect(out.map((o) => o.code)).toEqual(['COLOR'])
  })

  it('disambiguates duplicate axis codes', () => {
    const out = dedupeOptions([
      { code: 'COLOR', values: [{ code: 'RED' }] },
      { code: 'COLOR', values: [{ code: 'BLUE' }] },
    ])
    expect(out.map((o) => o.code)).toEqual(['COLOR', 'COLOR-2'])
  })

  it('disambiguates duplicate value codes within an axis and drops empty ones', () => {
    const out = dedupeOptions([
      { code: 'SIZE', values: [{ code: 'M' }, { code: '' }, { code: 'M' }] },
    ])
    expect(out[0].values.map((v) => v.code)).toEqual(['M', 'M-2'])
  })

  it('preserves extra fields on axes and values', () => {
    const out = dedupeOptions([
      { code: 'COLOR', name: 'Color', values: [{ code: 'RED', hex: '#f00' }] },
    ])
    expect(out[0]).toMatchObject({ code: 'COLOR', name: 'Color' })
    expect(out[0].values[0]).toMatchObject({ code: 'RED', hex: '#f00' })
  })
})
