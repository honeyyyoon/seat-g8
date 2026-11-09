export const colors = {
  bg: '#F4F2F0',
  surface: '#FFFFFF',
  ink: '#1F1A1D',
  muted: '#6F6870',
  line: '#E6E2E4',
  accent: '#7A1F3D',
  accentSoft: '#F4E6EB',
  seat: '#D8D3D6',
  error: '#B3261E',
  errorSoft: '#FBEAE8',
  onAccent: '#FFFFFF',
} as const;

export const chainColors: Record<string, string> = {
  CGV: '#D62828',
  롯데시네마: '#E8710A',
  메가박스: '#4B2C8F',
};

export const radius = { sm: 6, md: 12, lg: 16 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
