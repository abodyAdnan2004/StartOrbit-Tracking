import { withShurikenUI } from '@shuriken-ui/tailwind'
import { join } from 'pathe'
import { themeConfig } from './theme.config'
/**
 * This is the Tailwind config file for the demo.
 * It extends the default config from @shuriken-ui/tailwind
 *
 * You can add/override your own customizations here.
 */
export default withShurikenUI({
  content: [join(__dirname, `/utils/**/*.ts`)], // Parse the utils folder for demo

  safelist: [
    'transition-all',
    'duration-200',
    'duration-75',
    'ease-out',
    'ease-in',
    'opacity-0',
    'opacity-100',
  ],
  theme: {
    borderRadius: {
      DEFAULT: '8px',
      none: '0px',
      sm: '8x',
      md: '12px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '60px',
      full: '50%',
    },
    // font sizes
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    extend: themeConfig,
  },
})
