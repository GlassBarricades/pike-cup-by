import { createTheme, type MantineColorsTuple } from '@mantine/core'

/** Сигнальный оранжевый — акцент live / CTA */
const signal: MantineColorsTuple = [
  '#fff4f0',
  '#ffe4d9',
  '#ffc4ad',
  '#ffa07a',
  '#ff7a45',
  '#ff5a1f',
  '#e64510',
  '#c2380c',
  '#9e2d0a',
  '#7a2208',
]

/** Зона A — холодный синий */
const zoneA: MantineColorsTuple = [
  '#eef4ff',
  '#d9e5ff',
  '#b0c9ff',
  '#84a9ff',
  '#5a8cff',
  '#3d74f0',
  '#2f5fd4',
  '#254aad',
  '#1c3885',
  '#14285e',
]

/** Зона B — бирюзовый */
const zoneB: MantineColorsTuple = [
  '#e8fafa',
  '#c9f0ef',
  '#96e0de',
  '#5fc9c6',
  '#36b0ad',
  '#1f9693',
  '#187a78',
  '#13605f',
  '#0f4948',
  '#0a3332',
]

/** Графит — нейтрали для тёмной спортивной оболочки */
const graphite: MantineColorsTuple = [
  '#e8eaed',
  '#c5c9d0',
  '#9aa1ab',
  '#6f7885',
  '#4a525e',
  '#2e353f',
  '#1b1f26',
  '#14171c',
  '#0f1216',
  '#0b0d10',
]

export const theme = createTheme({
  primaryColor: 'signal',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: '"Barlow Condensed", Inter, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 2,
  colors: {
    signal,
    zoneA,
    zoneB,
    graphite,
    // legacy aliases during migration of any leftover color= props
    depth: signal,
    lake: signal,
    reed: zoneB,
    lure: signal,
  },
  other: {
    brandAccent: '#FF5A1F',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 2,
      },
      styles: {
        root: {
          fontFamily: '"Barlow Condensed", Inter, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 2,
      },
      styles: {
        root: {
          fontFamily: '"Barlow Condensed", Inter, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        },
      },
    },
    Table: {
      defaultProps: {
        horizontalSpacing: 'sm',
        verticalSpacing: 'xs',
      },
    },
    Paper: {
      defaultProps: {
        radius: 2,
      },
    },
    TextInput: {
      defaultProps: { radius: 2 },
    },
    Select: {
      defaultProps: { radius: 2 },
    },
    PasswordInput: {
      defaultProps: { radius: 2 },
    },
  },
})
