import { describe, expect, it } from 'vitest'
import { firstPerSku } from './product-images'

const asset = (id: string) => ({
  asset: { _ref: `image-${id}-1602x1602-jpg`, _type: 'reference' as const },
})
const ROCKET = asset('f744a39d854a980a127ad5cc032a66f32570a339')
const BAG = asset('5a94208c975d0e0134c7129961738197aa9d208b')

describe('firstPerSku', () => {
  // The query orders the reader's language first, so "first row wins" IS the locale
  // preference. If that ordering is ever dropped, this is what starts lying.
  it('keeps the first row for a SKU and ignores its other translations', () => {
    const urls = firstPerSku([
      { skuCode: 'TK-RKT', mainImage: ROCKET },
      { skuCode: 'TK-RKT', mainImage: BAG },
    ])
    expect(urls.size).toBe(1)
    expect(urls.get('TK-RKT')).toContain('f744a39d854a980a127ad5cc032a66f32570a339')
  })

  it('resolves several SKUs in one pass', () => {
    const urls = firstPerSku([
      { skuCode: 'TK-RKT', mainImage: ROCKET },
      { skuCode: 'TK-BAG', mainImage: BAG },
    ])
    expect([...urls.keys()].sort()).toEqual(['TK-BAG', 'TK-RKT'])
  })

  // A translation can exist without its own picture; the SKU should still show one
  // rather than fall back to the empty box.
  it('skips a row with no image so a later translation can supply it', () => {
    const urls = firstPerSku([
      { skuCode: 'TK-RKT', mainImage: null },
      { skuCode: 'TK-RKT', mainImage: {} },
      { skuCode: 'TK-RKT', mainImage: ROCKET },
    ])
    expect(urls.get('TK-RKT')).toContain('f744a39d854a980a127ad5cc032a66f32570a339')
  })

  it('leaves a SKU out entirely when no translation has a picture', () => {
    expect(firstPerSku([{ skuCode: 'TK-RKT', mainImage: null }]).has('TK-RKT')).toBe(false)
  })

  it('ignores documents carrying no SKU', () => {
    expect(firstPerSku([{ skuCode: null, mainImage: ROCKET }]).size).toBe(0)
    expect(firstPerSku([{ skuCode: '', mainImage: ROCKET }]).size).toBe(0)
  })

  it('returns nothing for no documents', () => {
    expect(firstPerSku([]).size).toBe(0)
  })

  // fit=max, not crop: a board is long and narrow and a square crop of one shows
  // nothing but colour. Squares are the easy default to regress to.
  it('asks the CDN for a scaled-to-fit thumbnail, never a crop', () => {
    const url = firstPerSku([{ skuCode: 'TK-RKT', mainImage: ROCKET }]).get('TK-RKT')!
    expect(url).toContain('w=160')
    expect(url).toContain('h=160')
    expect(url).toContain('fit=max')
    expect(url).toContain('auto=format')
    expect(url).not.toContain('fit=crop')
  })
})
