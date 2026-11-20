import { createContext, use } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

export const FONTS = {
  'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  'Pretendard-ExtraBold': require('../../assets/fonts/Pretendard-ExtraBold.otf'),
  'Pretendard-Black': require('../../assets/fonts/Pretendard-Black.otf'),
};

const BY_WEIGHT: Record<string, keyof typeof FONTS> = {
  normal: 'Pretendard-Regular',
  '100': 'Pretendard-Regular',
  '200': 'Pretendard-Regular',
  '300': 'Pretendard-Regular',
  '400': 'Pretendard-Regular',
  '500': 'Pretendard-Regular',
  '600': 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  '700': 'Pretendard-Bold',
  '800': 'Pretendard-ExtraBold',
  '900': 'Pretendard-Black',
};

const Family = createContext<string>('Pretendard-Regular');

function withFont(style: TextProps['style'], inherited: string) {
  const { fontWeight, fontFamily, ...rest } = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const family = fontFamily ?? (fontWeight !== undefined ? BY_WEIGHT[String(fontWeight)] : inherited);
  return { family, style: [rest, { fontFamily: family }] };
}

export function Text({ style, maxFontSizeMultiplier = 1.5, ...props }: TextProps) {
  const { family, style: fontStyle } = withFont(style, use(Family));
  return (
    <Family value={family}>
      <NativeText {...props} maxFontSizeMultiplier={maxFontSizeMultiplier} style={fontStyle} />
    </Family>
  );
}

export function TextInput({
  style,
  maxFontSizeMultiplier = 1.5,
  ...props
}: TextInputProps) {
  const { style: fontStyle } = withFont(style, 'Pretendard-Regular');
  return <NativeTextInput {...props} maxFontSizeMultiplier={maxFontSizeMultiplier} style={fontStyle} />;
}
