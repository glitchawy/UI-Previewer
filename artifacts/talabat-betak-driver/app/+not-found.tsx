import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/ctx/LocaleContext';

export default function NotFoundScreen() {
  const colors = useColors();
  const { t, direction } = useLocale();

  return (
    <>
      <Stack.Screen options={{ title: t('common.error') }} />
      <View style={[styles.container, { backgroundColor: colors.background, direction }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('notFound.title')}
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            {t('notFound.home')}
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
});
