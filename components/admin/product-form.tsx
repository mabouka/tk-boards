'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { saveProduct, deleteProduct } from '@/app/admin/(app)/products/actions'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/admin/ui/dialog'
import type { ProductInput, LinkType } from '@/lib/admin/schemas'
import { slug, comboKey, buildGrid, dedupeOptions } from '@/lib/admin/variants'
import { Button } from '@/components/admin/ui/button'
import { Checkbox } from '@/components/admin/ui/checkbox'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'

// ── local editor types ── (label/name = EN primary; *Fr/*Es optional translations)
type EditorValue = { label: string; labelFr: string; labelEs: string; code: string; hex: string | null }
type EditorOption = {
  name: string
  nameFr: string
  nameEs: string
  code: string
  inputType: 'swatch' | 'select'
  showTr: boolean
  values: EditorValue[]
}
type Override = { price: string; sale: string; active: boolean }
type AddonRow = { name: string; priceDelta: string; sku: string }
type LinkRow = { linkedProductId: string; type: LinkType }
type ProductRef = { id: string; sku: string; name: string }

export function ProductForm({
  initial,
  allProducts = [],
}: {
  initial?: ProductInput
  allProducts?: ProductRef[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deleting, startDeleting] = useTransition()

  function remove() {
    if (!initial?.id) return
    const id = initial.id
    startDeleting(async () => {
      await deleteProduct(id)
      toast.success('Produit supprimé.')
      router.push('/admin/products')
      router.refresh()
    })
  }

  const initOptions: EditorOption[] = (initial?.options ?? []).map((o) => ({
    name: o.name,
    nameFr: o.nameFr ?? '',
    nameEs: o.nameEs ?? '',
    code: o.code,
    inputType: o.inputType,
    showTr: Boolean(o.nameFr || o.nameEs || o.values.some((v) => v.labelFr || v.labelEs)),
    values: o.values.map((v) => ({
      label: v.label,
      labelFr: v.labelFr ?? '',
      labelEs: v.labelEs ?? '',
      code: v.code,
      hex: v.hex,
    })),
  }))
  const simpleInit = initOptions.length === 0
  const firstVar = initial?.variants?.[0]

  const [name, setName] = useState(initial?.name ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [kind, setKind] = useState<'board' | 'accessory' | 'none'>(initial?.kind ?? 'none')
  const [basePrice, setBasePrice] = useState(firstVar?.priceEur ?? '')
  const [discount, setDiscount] = useState(firstVar?.salePriceEur ?? '')
  const [options, setOptions] = useState<EditorOption[]>(initOptions)
  const [addons, setAddons] = useState<AddonRow[]>(
    (initial?.addons ?? []).map((a) => ({ name: a.name, priceDelta: a.priceDelta, sku: a.sku ?? '' }))
  )
  const [links, setLinks] = useState<LinkRow[]>(
    (initial?.links ?? []).map((l) => ({ linkedProductId: l.linkedProductId, type: l.type }))
  )

  const [overrides, setOverrides] = useState<Record<string, Override>>(() => {
    const o: Record<string, Override> = {}
    if (!simpleInit && initial) {
      for (const v of initial.variants) {
        o[comboKey(initOptions, v.combo)] = {
          price: v.priceEur ?? '',
          sale: v.salePriceEur ?? '',
          active: v.active,
        }
      }
    }
    return o
  })

  const skuUpper = sku.trim().toUpperCase()

  // Drop incomplete axes + guarantee unique codes so combos/SKUs/keys never collide.
  const validOptions: EditorOption[] = dedupeOptions(options)
  const grid = buildGrid(validOptions)

  // ── option editing ──
  const addOption = () =>
    setOptions((o) => [
      ...o,
      { name: '', nameFr: '', nameEs: '', code: '', inputType: 'select', showTr: false, values: [] },
    ])
  const removeOption = (i: number) => setOptions((o) => o.filter((_, idx) => idx !== i))
  const patchOption = (i: number, patch: Partial<EditorOption>) =>
    setOptions((o) => o.map((opt, idx) => (idx === i ? { ...opt, ...patch } : opt)))
  const setOptionName = (i: number, val: string) => patchOption(i, { name: val, code: slug(val) })
  const toggleTr = (i: number) =>
    setOptions((o) => o.map((opt, idx) => (idx === i ? { ...opt, showTr: !opt.showTr } : opt)))

  const addValue = (i: number) =>
    setOptions((o) =>
      o.map((opt, idx) =>
        idx === i
          ? { ...opt, values: [...opt.values, { label: '', labelFr: '', labelEs: '', code: '', hex: null }] }
          : opt
      )
    )
  const patchValue = (i: number, j: number, patch: Partial<EditorValue>) =>
    setOptions((o) =>
      o.map((opt, idx) =>
        idx === i
          ? { ...opt, values: opt.values.map((v, vj) => (vj === j ? { ...v, ...patch } : v)) }
          : opt
      )
    )
  const setValueLabel = (i: number, j: number, val: string) =>
    patchValue(i, j, { label: val, code: slug(val) })
  const removeValue = (i: number, j: number) =>
    setOptions((o) =>
      o.map((opt, idx) =>
        idx === i ? { ...opt, values: opt.values.filter((_, vj) => vj !== j) } : opt
      )
    )

  const setOverride = (key: string, patch: Partial<Override>) =>
    setOverrides((ov) => {
      const base: Override = ov[key] ?? { price: '', sale: '', active: true }
      return { ...ov, [key]: { ...base, ...patch } }
    })

  // ── add-ons ──
  const addAddon = () => setAddons((a) => [...a, { name: '', priceDelta: '', sku: '' }])
  const patchAddon = (i: number, patch: Partial<AddonRow>) =>
    setAddons((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeAddon = (i: number) => setAddons((a) => a.filter((_, idx) => idx !== i))

  // ── related products ──
  const addLink = () => setLinks((l) => [...l, { linkedProductId: '', type: 'achat_conjoint' }])
  const patchLink = (i: number, patch: Partial<LinkRow>) =>
    setLinks((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeLink = (i: number) => setLinks((l) => l.filter((_, idx) => idx !== i))

  // ── submit ──
  function buildInput(active: boolean): ProductInput {
    let variants: ProductInput['variants']
    if (validOptions.length === 0) {
      variants = [
        {
          sku: skuUpper,
          combo: {},
          priceEur: basePrice,
          salePriceEur: discount || null,
          active: true,
        },
      ]
    } else {
      variants = grid.map((row) => {
        const key = comboKey(validOptions, row.pick)
        const ov = overrides[key]
        return {
          sku: [skuUpper, ...row.cells.map((c) => c.code)].join('-'),
          combo: row.pick,
          priceEur: ov?.price || basePrice,
          salePriceEur: (ov?.sale || discount) || null,
          active: ov?.active ?? true,
        }
      })
    }

    return {
      id: initial?.id ?? null,
      name,
      sku: skuUpper,
      kind: kind === 'none' ? null : kind,
      active,
      options: validOptions,
      variants,
      addons: addons
        .filter((a) => a.name.trim())
        .map((a) => ({ name: a.name.trim(), priceDelta: a.priceDelta, sku: a.sku.trim() || null })),
      links: links
        .filter((l) => l.linkedProductId)
        .map((l) => ({ linkedProductId: l.linkedProductId, type: l.type })),
    }
  }

  function submit(active: boolean) {
    if (!name.trim() || !skuUpper) {
      toast.error('Nom et SKU sont requis.')
      return
    }
    startTransition(async () => {
      const res = await saveProduct(buildInput(active))
      if (res.ok) {
        toast.success(active ? 'Produit publié.' : 'Brouillon enregistré.')
        router.push('/admin/products')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {initial ? 'Modifier le produit' : 'Ajouter un produit'}
        </h1>
        <div className="flex items-center gap-2">
          {initial && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive mr-auto">
                  <Trash2 className="size-4" /> Supprimer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supprimer « {initial.name} » ?</DialogTitle>
                  <DialogDescription>
                    Le produit, ses variantes, attributs, options et liens seront définitivement
                    supprimés. Les unités NFC associées sont détachées (pas supprimées). Action
                    irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={remove} disabled={deleting}>
                    {deleting ? 'Suppression…' : 'Supprimer définitivement'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="ghost" onClick={() => router.push('/admin/products')} disabled={pending}>
            Annuler
          </Button>
          <Button variant="outline" onClick={() => submit(false)} disabled={pending}>
            Brouillon
          </Button>
          <Button onClick={() => submit(true)} disabled={pending}>
            {pending ? 'Enregistrement…' : 'Publier'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rocket" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU parent</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="TK-RKT"
                  className="font-mono"
                />
                <p className="text-muted-foreground text-xs">Clé de liaison avec la page Sanity.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variantes</CardTitle>
              <CardDescription>
                Définis les axes (Couleur, Taille…) — la grille des combinaisons se génère.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {options.map((opt, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-end gap-3">
                    <div className="grid flex-1 gap-2">
                      <Label>Nom de l’axe (EN)</Label>
                      <Input
                        value={opt.name}
                        onChange={(e) => setOptionName(i, e.target.value)}
                        placeholder="Color"
                      />
                    </div>
                    <div className="grid w-40 gap-2">
                      <Label>Type</Label>
                      <Select
                        value={opt.inputType}
                        onValueChange={(v) => patchOption(i, { inputType: v as 'swatch' | 'select' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select">Liste</SelectItem>
                          <SelectItem value="swatch">Pastille (couleur)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeOption(i)} aria-label="Supprimer l'axe">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {opt.showTr && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Input
                        value={opt.nameFr}
                        onChange={(e) => patchOption(i, { nameFr: e.target.value })}
                        placeholder="Nom de l’axe (FR)"
                        className="h-9"
                      />
                      <Input
                        value={opt.nameEs}
                        onChange={(e) => patchOption(i, { nameEs: e.target.value })}
                        placeholder="Nombre del eje (ES)"
                        className="h-9"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex flex-col gap-2">
                    {opt.values.map((val, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Input
                          value={val.label}
                          onChange={(e) => setValueLabel(i, j, e.target.value)}
                          placeholder={opt.inputType === 'swatch' ? 'Couleur (EN)' : 'Valeur (EN)'}
                          className="flex-1"
                        />
                        {opt.showTr && (
                          <>
                            <Input
                              value={val.labelFr}
                              onChange={(e) => patchValue(i, j, { labelFr: e.target.value })}
                              placeholder="Français"
                              className="w-32"
                            />
                            <Input
                              value={val.labelEs}
                              onChange={(e) => patchValue(i, j, { labelEs: e.target.value })}
                              placeholder="Español"
                              className="w-32"
                            />
                          </>
                        )}
                        {opt.inputType === 'swatch' && (
                          <input
                            type="color"
                            value={val.hex ?? '#3d6ea5'}
                            onChange={(e) => patchValue(i, j, { hex: e.target.value })}
                            className="size-9 shrink-0 rounded-md border"
                            aria-label="Couleur"
                          />
                        )}
                        <span className="text-muted-foreground w-16 shrink-0 font-mono text-xs">
                          {val.code || '—'}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => removeValue(i, j)} aria-label="Supprimer la valeur">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => addValue(i)}>
                        <Plus className="size-4" /> Ajouter une valeur
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleTr(i)}>
                        {opt.showTr ? 'Masquer traductions' : '+ Traductions (FR · ES)'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" className="self-start" onClick={addOption}>
                <Plus className="size-4" /> Ajouter un axe
              </Button>

              {grid.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground border-b text-left text-xs">
                      <tr>
                        {validOptions.map((o, oi) => (
                          <th key={oi} className="px-3 py-2 font-medium">
                            {o.name}
                          </th>
                        ))}
                        <th className="px-3 py-2 font-medium">SKU</th>
                        <th className="px-3 py-2 font-medium">Prix €</th>
                        <th className="px-3 py-2 font-medium">Promo €</th>
                        <th className="px-3 py-2 text-center font-medium">Actif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grid.map((row) => {
                        const key = comboKey(validOptions, row.pick)
                        const ov = overrides[key]
                        const rowSku = [skuUpper, ...row.cells.map((c) => c.code)].join('-')
                        return (
                          <tr key={key} className="border-b last:border-0">
                            {row.cells.map((c, idx) => (
                              <td key={idx} className="px-3 py-2">
                                {c.label}
                              </td>
                            ))}
                            <td className="text-muted-foreground px-3 py-2 font-mono text-xs">{rowSku}</td>
                            <td className="px-3 py-2">
                              <Input
                                value={ov?.price ?? ''}
                                onChange={(e) => setOverride(key, { price: e.target.value })}
                                placeholder={basePrice || '—'}
                                className="h-8 w-24"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={ov?.sale ?? ''}
                                onChange={(e) => setOverride(key, { sale: e.target.value })}
                                placeholder="—"
                                className="h-8 w-24"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Checkbox
                                checked={ov?.active ?? true}
                                onCheckedChange={(c) => setOverride(key, { active: c === true })}
                                aria-label="Variante active"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Options (add-ons)</CardTitle>
              <CardDescription>Suppléments payants facultatifs (ailerons carbone, housse…).</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {addons.map((a, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="grid flex-1 gap-2">
                    <Label>Nom</Label>
                    <Input
                      value={a.name}
                      onChange={(e) => patchAddon(i, { name: e.target.value })}
                      placeholder="Ailerons carbone"
                    />
                  </div>
                  <div className="grid w-28 gap-2">
                    <Label>Prix +€</Label>
                    <Input
                      value={a.priceDelta}
                      onChange={(e) => patchAddon(i, { priceDelta: e.target.value })}
                      placeholder="75"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="grid w-44 gap-2">
                    <Label>SKU (opt.)</Label>
                    <Input
                      value={a.sku}
                      onChange={(e) => patchAddon(i, { sku: e.target.value })}
                      placeholder="TK-RKT-FIN-CARBON"
                      className="font-mono"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAddon(i)} aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="self-start" onClick={addAddon}>
                <Plus className="size-4" /> Ajouter une option
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produits liés</CardTitle>
              <CardDescription>Achat conjoint, cross-sell ou accessoire vers d’autres produits.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {links.map((l, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="grid flex-1 gap-2">
                    <Label>Produit</Label>
                    <Select
                      value={l.linkedProductId}
                      onValueChange={(v) => patchLink(i, { linkedProductId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un produit…" />
                      </SelectTrigger>
                      <SelectContent>
                        {allProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} · {p.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-48 gap-2">
                    <Label>Type</Label>
                    <Select value={l.type} onValueChange={(v) => patchLink(i, { type: v as LinkType })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="achat_conjoint">Achat conjoint</SelectItem>
                        <SelectItem value="cross_sell">Cross-sell</SelectItem>
                        <SelectItem value="accessoire">Accessoire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLink(i)} aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {allProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Crée d’autres produits pour pouvoir les lier.
                </p>
              ) : (
                <Button variant="outline" size="sm" className="self-start" onClick={addLink}>
                  <Plus className="size-4" /> Ajouter un lien
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Gérées dans le CMS (Sanity), reliées par le SKU.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* meta column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Prix</CardTitle>
              <CardDescription>
                {validOptions.length > 0
                  ? 'Prix par défaut (surchargé par la grille).'
                  : 'Produit simple : ce prix est sa variante unique.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Prix de base (€)</Label>
                <Input id="price" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="1000" inputMode="decimal" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount">Prix promo (€)</Label>
                <Input id="discount" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="—" inputMode="decimal" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Type</CardTitle>
              <CardDescription>Filtre admin. Les catégories boutique vivent dans Sanity.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={kind} onValueChange={(v) => setKind(v as 'board' | 'accessory' | 'none')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="board">Board</SelectItem>
                  <SelectItem value="accessory">Accessoire</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
