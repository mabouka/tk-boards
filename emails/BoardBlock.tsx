import { Column, Img, Row, Section, Text } from '@react-email/components'

export type BoardAttribute = { name: string; value: string; swatchHex: string | null }

/**
 * Shared board card for emails: photo + name + serial / variant axes (color,
 * size…). Used by both the found-board and transfer emails so they stay identical.
 */
export function BoardBlock({
  boardName,
  serial,
  photoUrl,
  attributes = [],
  serialLabel,
}: {
  boardName: string | null
  serial: string | null
  photoUrl: string | null
  attributes?: BoardAttribute[]
  serialLabel: string
}) {
  const rows: BoardAttribute[] = [
    ...(serial ? [{ name: serialLabel, value: serial, swatchHex: null }] : []),
    ...attributes,
  ]

  if (!photoUrl && !boardName && rows.length === 0) return null

  return (
    <Section className="mt-6">
      {photoUrl ? (
        <Img
          src={photoUrl}
          alt={boardName ?? ''}
          width="536"
          className="border-stroke block w-full border"
        />
      ) : null}
      <Section className="border-stroke border border-t-0 px-5 py-4">
        {boardName ? (
          <Text className="font-display text-paper m-0 text-[18px] font-semibold uppercase leading-[1.2]">
            {boardName}
          </Text>
        ) : null}
        {rows.map((r, i) => (
          <Row key={i} className="mt-2">
            <Column className="text-muted text-[11px] uppercase tracking-[0.08em]">{r.name}</Column>
            <Column className="text-paper text-right text-[14px]">
              {r.swatchHex ? (
                <span
                  style={{ backgroundColor: r.swatchHex }}
                  className="mr-[6px] inline-block h-[11px] w-[11px] border border-[rgba(255,255,255,0.25)] align-middle"
                />
              ) : null}
              {r.value}
            </Column>
          </Row>
        ))}
      </Section>
    </Section>
  )
}
