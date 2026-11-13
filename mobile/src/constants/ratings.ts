export const HEIGHT_LABELS = ['너무 낮음', '조금 낮음', '딱 좋음', '조금 높음', '너무 높음'];
export const SIDE_LABELS = ['너무 왼쪽', '조금 왼쪽', '딱 좋음', '조금 오른쪽', '너무 오른쪽'];

export const DISCOMFORTS = [
  { id: 'legroom', label: '다리 공간' },
  { id: 'chair', label: '의자' },
  { id: 'vent', label: '냉난방' },
  { id: 'ambient_light', label: '비상구 불빛' },
  { id: 'one_sided_sound', label: '소리 쏠림' },
  { id: 'masking_light', label: '마스킹 빛샘' },
  { id: 'outside_noise', label: '외부 소음' },
] as const;

export type Discomfort = (typeof DISCOMFORTS)[number]['id'];

export function discomfortLabel(id: string) {
  return DISCOMFORTS.find((d) => d.id === id)?.label ?? id;
}
