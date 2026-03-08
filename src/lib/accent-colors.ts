import type { Theme } from '@/types';

export interface AccentOption {
  key: string;
  label: string;
  color: string;
  hoverColor: string;
}

export const ACCENT_PALETTES: Record<Theme, AccentOption[]> = {
  'dark-gray': [
    { key: 'default', label: 'Default', color: '#7c93b8', hoverColor: '#93a8c8' },
    { key: 'amber', label: 'Amber', color: '#c9a055', hoverColor: '#d4b06a' },
    { key: 'violet', label: 'Violet', color: '#9b8ec4', hoverColor: '#afa4d0' },
    { key: 'teal', label: 'Teal', color: '#5da8a0', hoverColor: '#72b8b0' },
    { key: 'coral', label: 'Coral', color: '#c87e72', hoverColor: '#d49488' },
    { key: 'sage', label: 'Sage', color: '#7aab84', hoverColor: '#8fba98' },
    { key: 'electric', label: 'Electric', color: '#5b9cf5', hoverColor: '#78aff7' },
  ],
  'dark-slate': [
    { key: 'default', label: 'Default', color: '#6d90c0', hoverColor: '#84a4ce' },
    { key: 'amber', label: 'Amber', color: '#c4a05c', hoverColor: '#d0b072' },
    { key: 'violet', label: 'Violet', color: '#9688c0', hoverColor: '#a89cce' },
    { key: 'teal', label: 'Teal', color: '#58a8a0', hoverColor: '#6eb8b0' },
    { key: 'coral', label: 'Coral', color: '#c47e74', hoverColor: '#d0948a' },
    { key: 'sage', label: 'Sage', color: '#6daa7a', hoverColor: '#82ba8e' },
    { key: 'electric', label: 'Electric', color: '#5898f0', hoverColor: '#74aaf4' },
  ],
  'dark-wine': [
    { key: 'default', label: 'Default', color: '#c4808e', hoverColor: '#d096a2' },
    { key: 'amber', label: 'Amber', color: '#c8a060', hoverColor: '#d4b076' },
    { key: 'violet', label: 'Violet', color: '#a48cbc', hoverColor: '#b4a0ca' },
    { key: 'teal', label: 'Teal', color: '#5caba0', hoverColor: '#72bbb0' },
    { key: 'blue', label: 'Blue', color: '#7c9cc0', hoverColor: '#92b0ce' },
    { key: 'sage', label: 'Sage', color: '#72aa80', hoverColor: '#88ba94' },
    { key: 'electric', label: 'Electric', color: '#5c9af0', hoverColor: '#78acf4' },
  ],
  'dark-moss': [
    { key: 'default', label: 'Default', color: '#6da878', hoverColor: '#82b88c' },
    { key: 'amber', label: 'Amber', color: '#c4a05c', hoverColor: '#d0b072' },
    { key: 'violet', label: 'Violet', color: '#9888c0', hoverColor: '#aa9cce' },
    { key: 'teal', label: 'Teal', color: '#5ca8a8', hoverColor: '#72b8b8' },
    { key: 'coral', label: 'Coral', color: '#c48074', hoverColor: '#d0968a' },
    { key: 'blue', label: 'Blue', color: '#7c94b8', hoverColor: '#92a8c8' },
    { key: 'electric', label: 'Electric', color: '#5898f0', hoverColor: '#74aaf4' },
  ],
  'dark-coffee': [
    { key: 'default', label: 'Default', color: '#c49a6c', hoverColor: '#d0ac82' },
    { key: 'violet', label: 'Violet', color: '#9a8abc', hoverColor: '#ac9eca' },
    { key: 'teal', label: 'Teal', color: '#5ca8a0', hoverColor: '#72b8b0' },
    { key: 'coral', label: 'Coral', color: '#c47e72', hoverColor: '#d09488' },
    { key: 'blue', label: 'Blue', color: '#7c94b8', hoverColor: '#92a8c8' },
    { key: 'sage', label: 'Sage', color: '#6daa7c', hoverColor: '#82ba90' },
    { key: 'electric', label: 'Electric', color: '#5898f0', hoverColor: '#74aaf4' },
  ],
  'light': [
    { key: 'default', label: 'Default', color: '#4a7cc9', hoverColor: '#3a6ab8' },
    { key: 'amber', label: 'Amber', color: '#a07830', hoverColor: '#8c6828' },
    { key: 'violet', label: 'Violet', color: '#7b6aaf', hoverColor: '#6b5a9f' },
    { key: 'teal', label: 'Teal', color: '#2d8a82', hoverColor: '#247a72' },
    { key: 'coral', label: 'Coral', color: '#c05a50', hoverColor: '#a84a42' },
    { key: 'sage', label: 'Sage', color: '#4d8a56', hoverColor: '#407a48' },
    { key: 'electric', label: 'Electric', color: '#2563eb', hoverColor: '#1d54d0' },
  ],
};
