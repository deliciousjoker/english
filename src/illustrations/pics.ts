/**
 * Ders kitabı çizimleri: siyah mürekkep çizgi + seviye renginde, hafif kaymış düz renk (risograf baskı gibi).
 * Hepsi 100×100 alanda. Bir çizim, arkadan öne sıralı nesnelerden oluşur:
 *   fill  → nesnenin dış hattı (arkadakini kâğıt rengiyle kapatır, üstüne kaydırılmış renk basılır)
 *   ink   → çizgiler, dots → dolu küçük noktalar (göz, düğme)
 *   spot: false → renksiz (sadece kâğıt), at → "translate(x y) scale(s)"
 */

export type PicObj = { fill?: string; ink?: string; dots?: string; spot?: boolean; at?: string }
export type PicDef = { alt: string; objs: PicObj[] }

const n = (v: number) => Math.round(v * 100) / 100
const circle = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0`
const line = (x1: number, y1: number, x2: number, y2: number) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`
const rays = (cx: number, cy: number, r1: number, r2: number, count = 8) =>
  Array.from({ length: count }, (_, k) => {
    const a = (k * 2 * Math.PI) / count
    return line(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
  }).join('')
/** Kar tanesi / yıldız: merkezden geçen 3 çizgi */
const flake = (cx: number, cy: number, r: number) =>
  [90, 30, 150]
    .map((d) => {
      const a = (d * Math.PI) / 180
      return line(cx - r * Math.cos(a), cy - r * Math.sin(a), cx + r * Math.cos(a), cy + r * Math.sin(a))
    })
    .join('')

const FLOOR: PicObj = { ink: 'M6 86H94' }

// ---------- Hava ----------
const CLOUD = 'M26 70H72A13 13 0 0 0 74 44A19 19 0 0 0 38 48A12 12 0 0 0 26 70Z'
const CLOUD_UP = 'M26 56H72A13 13 0 0 0 74 30A19 19 0 0 0 38 34A12 12 0 0 0 26 56Z'
const THERMO = 'M44 20A6 6 0 0 1 56 20V60A11 11 0 1 1 44 60Z'
const thermo = (level: number): PicObj[] => [
  { fill: THERMO, spot: false, ink: `${THERMO}M56 30h5M56 38h5M56 46h5M56 54h5` },
  { fill: `M47.5 ${level}H52.5V64H47.5Z${circle(50, 69.2, 7)}`, ink: `M47.5 ${level}H52.5` },
]

// ---------- Kıyafet ----------
const TSHIRT = 'M36 20L18 30L25 46L34 41V84H66V41L75 46L82 30L64 20Q50 32 36 20Z'
const boot = (x: number) => `M${x} 24H${x + 14}V56L${x + 26} 62Q${x + 32} 65 ${x + 32} 72V80H${x}Z`
const shoe = (x: number) => `M${x} 78V52Q${x} 46 ${x + 6} 46H${x + 16}Q${x + 20} 46 ${x + 22} 52L${x + 26} 58Q${x + 38} 60 ${x + 40} 70V78Z`
const palm = (x: number) => `M${x} 84V48Q${x} 30 ${x + 12} 30Q${x + 24} 30 ${x + 24} 48V84Z`

// ---------- Tom (kedi) ve kutular ----------
const tomBody: PicObj = {
  fill: 'M-10 0C-13 -10 -10 -18 -5 -20H5C10 -18 13 -10 10 0Z',
  ink: 'M-10 0C-13 -10 -10 -18 -5 -20H5C10 -18 13 -10 10 0ZM10 -2C19 -2 21 -11 16 -17M-3.5 0V-9M3.5 0V-9',
}
const tomHead: PicObj = {
  fill: `${circle(0, -27, 8.5)}M-7.5 -31L-8 -40L-2.5 -34.5ZM7.5 -31L8 -40L2.5 -34.5Z`,
  ink: `${circle(0, -27, 8.5)}M-7.3 -32L-8 -40L-2.5 -35M7.3 -32L8 -40L2.5 -35M-4.5 -23.5H-11M4.5 -23.5H11M-1.8 -24L0 -22.8L1.8 -24`,
  dots: `${circle(-3.2, -28, 1.3)}${circle(3.2, -28, 1.3)}`,
}
const tom = (x: number, y: number, s = 1): PicObj[] => [tomBody, tomHead].map((o) => ({ ...o, at: `translate(${x} ${y}) scale(${s})` }))

/** Kapalı kutu (önden ve biraz yukarıdan) */
const box = (x: number, y: number, w: number, h: number, d = 8): PicObj => {
  const t = y - h
  const dy = d * 0.8
  return {
    fill: `M${x} ${y}V${t}L${x + d} ${t - dy}H${x + w + d}V${y - dy}L${x + w} ${y}Z`,
    spot: false,
    ink: `M${x} ${y}V${t}L${x + d} ${t - dy}H${x + w + d}V${y - dy}L${x + w} ${y}ZM${x} ${t}H${x + w}V${y}M${x + w} ${t}L${x + w + d} ${t - dy}`,
  }
}
const table = (x: number, y: number, w: number, h: number): PicObj => ({
  fill: `M${x - 4} ${y - h}H${x + w + 4}V${y - h + 5}H${x - 4}Z`,
  spot: false,
  ink: `M${x - 4} ${y - h}H${x + w + 4}V${y - h + 5}H${x - 4}ZM${x + 3} ${y - h + 5}V${y}M${x + w - 3} ${y - h + 5}V${y}`,
})

export const PICS: Record<string, PicDef> = {
  sunny: { alt: 'The sun is shining.', objs: [{ fill: circle(50, 50, 17), ink: circle(50, 50, 17) + rays(50, 50, 25, 36) }] },
  cloudy: {
    alt: 'Two clouds.',
    objs: [
      { fill: 'M58 40H80A8 8 0 0 0 80 24A11 11 0 0 0 60 26A7 7 0 0 0 58 40Z', spot: false, ink: 'M58 40H80A8 8 0 0 0 80 24A11 11 0 0 0 60 26A7 7 0 0 0 58 40Z' },
      { fill: CLOUD, ink: CLOUD },
    ],
  },
  rain: {
    alt: 'Rain is falling from a cloud.',
    objs: [{ fill: CLOUD_UP, ink: CLOUD_UP + line(34, 64, 30, 74) + line(48, 64, 44, 74) + line(62, 64, 58, 74) + line(41, 80, 37, 90) + line(55, 80, 51, 90) }],
  },
  snow: {
    alt: 'Snow is falling from a cloud.',
    objs: [{ fill: CLOUD_UP, ink: CLOUD_UP + flake(33, 68, 5) + flake(50, 66, 5) + flake(67, 70, 5) + flake(41, 84, 5) + flake(58, 86, 5) }],
  },
  windy: {
    alt: 'The wind is blowing a leaf.',
    objs: [
      { ink: 'M14 40H58A9 9 0 1 0 49 31M14 54H76A9 9 0 1 1 67 63M24 68H50A7 7 0 1 1 43 75' },
      { fill: 'M70 26Q80 16 90 24Q80 34 70 26Z', ink: 'M70 26Q80 16 90 24Q80 34 70 26ZM70 26L88 24' },
    ],
  },
  hot: { alt: 'A hot day: the thermometer is high.', objs: [...thermo(26), { fill: circle(24, 26, 7), ink: circle(24, 26, 7) + rays(24, 26, 11, 16) }] },
  warm: { alt: 'A warm day: the thermometer is in the middle.', objs: [...thermo(42), { fill: circle(24, 30, 6), ink: circle(24, 30, 6) + rays(24, 30, 9.5, 12.5) }] },
  cold: { alt: 'A cold day: the thermometer is low.', objs: [...thermo(58), { ink: flake(24, 30, 10) + flake(26, 56, 5) }] },
  umbrella: {
    alt: 'An umbrella.',
    objs: [
      {
        fill: 'M16 50A34 34 0 0 1 84 50Q75.5 44 67 50Q58.5 44 50 50Q41.5 44 33 50Q24.5 44 16 50Z',
        ink: 'M16 50A34 34 0 0 1 84 50Q75.5 44 67 50Q58.5 44 50 50Q41.5 44 33 50Q24.5 44 16 50ZM50 16Q38 28 33 50M50 16Q62 28 67 50M50 50V80A6 6 0 0 1 38 80M50 16V11',
      },
    ],
  },

  clothes: {
    alt: 'A T-shirt on a hanger.',
    objs: [
      { fill: 'M36 40L20 48L26 62L34 58V90H66V58L74 62L80 48L64 40Q50 50 36 40Z', ink: 'M36 40L20 48L26 62L34 58V90H66V58L74 62L80 48L64 40Q50 50 36 40Z' },
      { ink: 'M45 16A5 5 0 1 1 50 21V27M50 27L80 42H20Z' },
    ],
  },
  coat: {
    alt: 'A long winter coat.',
    objs: [
      {
        fill: 'M38 16L26 20L16 50L23 53L30 38V88H70V38L77 53L84 50L74 20L62 16L50 32Z',
        ink: 'M38 16L26 20L16 50L23 53L30 38V88H70V38L77 53L84 50L74 20L62 16L50 32ZM50 32V88M34 66h9M57 66h9M18 44L25 47M82 44L75 47',
        dots: circle(55, 44, 1.8) + circle(55, 57, 1.8) + circle(55, 70, 1.8),
      },
    ],
  },
  sweater: {
    alt: 'A warm sweater.',
    objs: [
      {
        fill: 'M36 20L20 26L12 70H23L32 42V86H68V42L77 70H88L80 26L64 20Q50 30 36 20Z',
        ink: 'M36 20L20 26L12 70H23L32 42V86H68V42L77 70H88L80 26L64 20Q50 30 36 20ZM13.1 64H24.9M75.1 64H86.9M32 80H68M32 52l4.5 5 4.5-5 4.5 5 4.5-5 4.5 5 4.5-5 4.5 5 4.5-5',
      },
    ],
  },
  't-shirt': { alt: 'A T-shirt.', objs: [{ fill: TSHIRT, ink: `${TSHIRT}M34 52H66` }] },
  jeans: {
    alt: 'A pair of jeans.',
    objs: [
      {
        fill: 'M30 16H70L75 86H56L50 42L44 86H25Z',
        ink: 'M30 16H70L75 86H56L50 42L44 86H25ZM30.4 24H69.6M50 24V40M33 24Q36 33 44 33M67 24Q64 33 56 33M25.4 80H44.8M55.2 80H74.6',
        dots: circle(50, 20, 1.6),
      },
    ],
  },
  boots: {
    alt: 'A pair of boots.',
    objs: [10, 54].map((x) => ({ fill: boot(x), ink: `${boot(x)}M${x} 32H${x + 14}M${x - 1} 80H${x + 33}M${x + 14} 44l-5 3M${x + 14} 50l-5 3` })),
  },
  scarf: {
    alt: 'A striped scarf.',
    objs: [
      { fill: 'M36 40L30 82H44L48 44Z', ink: 'M36 40L30 82H44L48 44ZM31 74H44.6M32.3 64H45.7M32 82v6M36 82v6M40 82v6M44 82v6' },
      { fill: 'M56 44L60 78H72L67 38Z', ink: 'M56 44L60 78H72L67 38ZM59.1 70H71.2M57.9 60H70.4M61 78v6M65 78v6M69 78v6' },
      { fill: 'M30 26Q50 40 70 26L72 34Q50 50 28 34Z', ink: 'M30 26Q50 40 70 26L72 34Q50 50 28 34Z' },
    ],
  },
  gloves: {
    alt: 'A pair of gloves.',
    objs: [
      { fill: `${palm(22)}M22 58Q12 54 12 62Q12 68 22 72Z`, ink: `${palm(22)}M22 58Q12 54 12 62Q12 68 22 72M30 31V46M38 31V46M22 74H46` },
      { fill: `${palm(56)}M80 58Q90 54 90 62Q90 68 80 72Z`, ink: `${palm(56)}M80 58Q90 54 90 62Q90 68 80 72M64 31V46M72 31V46M56 74H80` },
    ],
  },
  hat: {
    alt: 'A winter hat.',
    objs: [
      { fill: circle(50, 25, 7), ink: circle(50, 25, 7) },
      { fill: 'M26 66C26 42 36 30 50 30C64 30 74 42 74 66Z', ink: 'M26 66C26 42 36 30 50 30C64 30 74 42 74 66Z' },
      { fill: 'M23 64H77V78H23Z', ink: `M23 64H77V78H23Z${[31, 39, 47, 55, 63, 71].map((x) => `M${x} 66V76`).join('')}` },
    ],
  },
  shoes: {
    alt: 'A pair of shoes.',
    objs: [8, 52].map((x) => ({ fill: shoe(x), ink: `${shoe(x)}M${x} 72H${x + 40}M${x + 20} 52l-5 4M${x + 24} 57l-5 4` })),
  },
  sofa: {
    alt: 'A sofa.',
    objs: [
      { fill: 'M20 32Q20 28 24 28H76Q80 28 80 32V58H20Z', ink: 'M20 32Q20 28 24 28H76Q80 28 80 32V58H20Z' },
      { fill: 'M14 58H86V78H14Z', ink: 'M14 58H86V78H14ZM22 68H78M50 58V68M12 78V85M88 78V85' },
      { fill: 'M8 48Q8 44 12 44H20Q24 44 24 48V78H8Z', ink: 'M8 48Q8 44 12 44H20Q24 44 24 48V78H8Z' },
      { fill: 'M76 48Q76 44 80 44H88Q92 44 92 48V78H76Z', ink: 'M76 48Q76 44 80 44H88Q92 44 92 48V78H76Z' },
    ],
  },
  shelf: {
    alt: 'A shelf with books and a plant.',
    objs: [
      { fill: 'M22 62V34H30V62ZM30 62V30H38V62ZM38 62V38H45V62Z', ink: 'M22 62V34H30V62ZM30 62V30H38V62ZM38 62V38H45V62ZM24 40H28M32 36H36' },
      { fill: 'M47 62L58 36L64 39L54 62Z', ink: 'M47 62L58 36L64 39L54 62Z' },
      { ink: 'M73 52Q66 44 68 36Q76 42 73 52M73 52Q80 44 86 42Q83 51 73 52' },
      { fill: 'M68 62L66 52H80L78 62Z', ink: 'M68 62L66 52H80L78 62Z' },
      { fill: 'M14 62H86V67H14Z', spot: false, ink: 'M14 62H86V67H14ZM24 67V75L32 67M76 67V75L68 67' },
    ],
  },

  // "Tom nerede?" edat resimleri
  'tom-in': {
    alt: 'Tom is in the box.',
    objs: [FLOOR, { ink: 'M24 58L33 51H84L75 58' }, ...tom(52, 84, 1.15), { fill: 'M24 86V58H75V86Z', spot: false, ink: 'M24 86V58H75V86ZM24 58L13 49M75 58L86 49' }],
  },
  'tom-on': { alt: 'Tom is on the box.', objs: [FLOOR, box(24, 86, 46, 26), ...tom(51, 58, 1.15)] },
  'tom-under': { alt: 'Tom is under the table.', objs: [FLOOR, table(16, 86, 68, 50), ...tom(48, 86, 1.05)] },
  'tom-next-to': { alt: 'Tom is next to the box.', objs: [FLOOR, box(10, 86, 40, 32), ...tom(72, 86, 1.15)] },
  'tom-behind': { alt: 'Tom is behind the box.', objs: [FLOOR, ...tom(60, 64, 1.15), box(20, 86, 50, 32)] },
  'tom-in-front-of': { alt: 'Tom is in front of the box.', objs: [box(40, 76, 44, 36), { ink: 'M6 92H94' }, ...tom(40, 92, 1.2)] },
  'tom-between': { alt: 'Tom is between the boxes.', objs: [FLOOR, ...tom(50, 86, 1.1), box(2, 86, 24, 26), box(70, 86, 22, 26)] },
}

/** Kelime kartlarında kelime → çizim */
const WORD_PICS: Record<string, string> = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  windy: 'windy',
  rain: 'rain',
  raining: 'rain',
  snow: 'snow',
  snowing: 'snow',
  hot: 'hot',
  warm: 'warm',
  cold: 'cold',
  umbrella: 'umbrella',
  clothes: 'clothes',
  coat: 'coat',
  sweater: 'sweater',
  't-shirt': 't-shirt',
  jeans: 'jeans',
  boots: 'boots',
  scarf: 'scarf',
  gloves: 'gloves',
  hat: 'hat',
  shoes: 'shoes',
  sofa: 'sofa',
  shelf: 'shelf',
  in: 'tom-in',
  on: 'tom-on',
  under: 'tom-under',
  'next to': 'tom-next-to',
  behind: 'tom-behind',
  'in front of': 'tom-in-front-of',
  between: 'tom-between',
}

export const picForWord = (word: string): string | undefined => WORD_PICS[word.toLowerCase()]
