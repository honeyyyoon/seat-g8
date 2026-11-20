import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/constants/theme';

const INTRO =
  "'G열 8번'(이하 '앱')은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.";

const ARTICLES: { title: string; items: string[] }[] = [
  {
    title: '제1조 (개인정보의 처리 목적)',
    items: [
      '앱은 회원가입 없이 이용할 수 있으며, 개인정보를 수집하여 운영자의 서버에 저장하지 않습니다.',
      '이용자가 입력한 관람 기록은 좌석 기록·조회 기능을 제공하기 위한 목적으로만 이용자의 단말기 안에서 처리됩니다.',
      '단말기의 위치정보는 가까운 극장 정렬 및 지도 표시 기능을 제공하기 위한 목적으로만 처리됩니다.',
    ],
  },
  {
    title: '제2조 (처리하는 개인정보의 항목)',
    items: [
      '단말기 내 저장 항목: 관람 날짜, 상영관, 좌석 번호, 좌석 평가(높이·좌우), 불편 사항, 영화 제목(선택)',
      '이용 시 일시적으로 처리하는 항목: 단말기 위치정보(선택, 위치 권한을 허용한 경우에 한함)',
      '앱은 이름, 연락처, 이메일, 광고 식별자 등 이용자를 식별할 수 있는 정보를 처리하지 않습니다.',
    ],
  },
  {
    title: '제3조 (개인정보의 처리 및 보유 기간)',
    items: [
      '관람 기록은 이용자가 직접 삭제하거나 앱을 삭제할 때까지 이용자의 단말기에 보관됩니다.',
      '위치정보는 거리 계산 및 지도 표시에만 이용되며, 단말기나 서버에 저장되지 않습니다.',
    ],
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    items: ['앱은 이용자의 개인정보를 제3자에게 제공하지 않습니다.'],
  },
  {
    title: '제5조 (개인정보 처리의 위탁)',
    items: ['앱은 개인정보 처리 업무를 외부에 위탁하지 않습니다.'],
  },
  {
    title: '제6조 (개인정보의 파기 절차 및 방법)',
    items: [
      '이용자가 앱에서 기록을 삭제하면 해당 기록은 단말기에서 즉시 삭제됩니다.',
      '앱을 삭제하면 단말기에 저장된 모든 기록이 함께 삭제되며, 삭제된 기록은 복구할 수 없습니다.',
    ],
  },
  {
    title: '제7조 (정보주체의 권리·의무 및 행사방법)',
    items: [
      '이용자는 언제든지 앱에서 자신의 기록을 열람하고 삭제할 수 있습니다.',
      '이용자는 단말기의 설정에서 위치 권한을 언제든지 허용하거나 철회할 수 있습니다.',
    ],
  },
  {
    title: '제8조 (개인정보의 안전성 확보조치)',
    items: [
      '앱은 개인정보를 외부로 전송하지 않으며, 기록은 단말기의 앱 전용 저장 공간에 보관됩니다.',
      '단말기 분실 등에 대비하여 이용자는 단말기 잠금 기능을 사용하는 것이 좋습니다.',
    ],
  },
  {
    title: '제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부)',
    items: ['앱은 쿠키, 광고 식별자, 행태정보 분석 도구 등 개인정보를 자동으로 수집하는 장치를 사용하지 않습니다.'],
  },
  {
    title: '제10조 (위치정보의 처리)',
    items: [
      '앱은 이용자가 위치 권한을 허용한 경우에만 단말기 안에서 위치정보를 이용하며, 이를 저장하거나 제3자에게 제공하지 않습니다.',
      '지도 화면은 Apple 지도(iOS) 또는 Google 지도(Android)를 이용하며, 지도 표시 과정에는 해당 사업자의 개인정보 처리방침이 적용됩니다.',
    ],
  },
  {
    title: '제11조 (개인정보 보호책임자)',
    items: [
      '앱의 개인정보 처리에 관한 문의, 불만 처리 및 피해 구제는 아래로 문의할 수 있습니다.',
      '개인정보 보호책임자: G열 8번 개발자',
      '문의처: github.com/honeyyyoon/seat-g8 (Issues)',
    ],
  },
  {
    title: '제12조 (권익침해 구제방법)',
    items: [
      '정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁 해결이나 상담 등을 신청할 수 있습니다.',
      '개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)',
      '개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)',
      '대검찰청: (국번없이) 1301 (www.spo.go.kr)',
      '경찰청: (국번없이) 182 (ecrm.police.go.kr)',
    ],
  },
  {
    title: '제13조 (개인정보 처리방침의 변경)',
    items: ['이 개인정보 처리방침은 2026년 11월 21일부터 적용됩니다.'],
  },
];


export default function PrivacyScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{INTRO}</Text>
      <View style={styles.card}>
        {ARTICLES.map((article, i) => (
          <View key={article.title} style={[styles.article, i > 0 && styles.divider]}>
            <Text style={styles.title}>{article.title}</Text>
            {article.items.map((item, j) => (
              <Text key={item} style={styles.item}>
                {article.items.length > 1 ? `${j + 1}. ` : ''}
                {item}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  intro: { fontSize: 14, lineHeight: 21, color: colors.muted, marginHorizontal: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  article: { paddingVertical: spacing.lg, gap: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink },
  item: { fontSize: 14, lineHeight: 21, color: colors.muted },
});
