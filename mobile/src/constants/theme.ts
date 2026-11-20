export const colors = {
  bg: '#F4F2F0',
  surface: '#FFFFFF',
  ink: '#1F1A1D',
  muted: '#6F6870',
  line: '#E6E2E4',
  accent: '#7A1F3D',
  accentSoft: '#F4E6EB',
  seat: '#D8D3D6',
  seatFill: '#F1EEF0',
  seatEdge: '#8F888C',
  placeholder: '#7A7377',
  error: '#B3261E',
  errorSoft: '#FBEAE8',
  onAccent: '#FFFFFF',
} as const;

export const verdictColors = {
  good: '#1F6B4A',
  okay: '#E0A43A',
  bad: '#B3261E',
} as const;

export const verdictInk = {
  good: '#FFFFFF',
  okay: '#1F1A1D',
  bad: '#FFFFFF',
} as const;

export const verdictText = {
  good: '#1F6B4A',
  okay: '#8F5E10',
  bad: '#B3261E',
} as const;

export const verdictIcons = {
  good: 'checkmark',
  okay: 'minus',
  bad: 'exclamationmark',
} as const;

export const chainColors: Record<string, string> = {
  CGV: '#D62828',
  롯데시네마: '#E8710A',
  메가박스: '#4B2C8F',
};

export const chainText: Record<string, string> = {
  CGV: '#C42222',
  롯데시네마: '#A84E00',
  메가박스: '#4B2C8F',
};

export const radius = { sm: 6, md: 10, lg: 14 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
