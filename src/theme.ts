import { createTheme, type MantineColorsTuple } from '@mantine/core'

/** Глубина воды / спина щуки */
const depth: MantineColorsTuple = [
  '#e6f2f1',
  '#c5e0dd',
  '#9cc9c4',
  '#6fafa8',
  '#449890',
  '#2d7f78',
  '#1a5f5a',
  '#144c48',
  '#0e3a37',
  '#092826',
]

/** Камыш */
const reed: MantineColorsTuple = [
  '#f2f4e8',
  '#e0e5c8',
  '#c5ce9e',
  '#a8b574',
  '#8f9e52',
  '#768540',
  '#5c6a32',
  '#485428',
  '#353e1d',
  '#242914',
]

/** Холодный янтарь / блесна — sparingly */
const lure: MantineColorsTuple = [
  '#fbf4e6',
  '#f3e4c2',
  '#e8ce90',
  '#dbb55c',
  '#c99a38',
  '#b07f24',
  '#8c641c',
  '#6e4e16',
  '#523a10',
  '#38270a',
]

export const theme = createTheme({
  primaryColor: 'depth',
  fontFamily: 'Manrope, sans-serif',
  headings: {
    fontFamily: 'Manrope, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'sm',
  colors: {
    depth,
    reed,
    lure,
    // alias на время миграции ссылок color="lake"
    lake: depth,
  },
  other: {
    brandAccent: '#768540',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Table: {
      defaultProps: {
        horizontalSpacing: 'xs',
        verticalSpacing: 'xs',
      },
    },
  },
})
