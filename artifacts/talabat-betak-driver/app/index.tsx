import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useRequestOtp, useVerifyOtp } from '@workspace/api-client-react';
import { useAuth } from '@/ctx/AuthContext';
import {
  acquireSubmissionLock,
  isNonDriverSessionError,
  loginErrorMessage,
  normalizeEgyptianMobile,
  otpRequestData,
  otpVerificationData,
} from '@/lib/login-behavior';
import { useLocale } from '@/ctx/LocaleContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t, direction, toggleLocale } = useLocale();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [requestLocked, setRequestLocked] = useState(false);
  const [verifyLocked, setVerifyLocked] = useState(false);
  const requestLock = useRef(false);
  const verifyLock = useRef(false);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const handleRequestOtp = async () => {
    if (!acquireSubmissionLock(requestLock)) return;
    setRequestLocked(true);
    const canonicalPhone = normalizeEgyptianMobile(phone);
    if (!canonicalPhone) {
      setError(t('login.invalidPhone'));
      requestLock.current = false;
      setRequestLocked(false);
      return;
    }
    setPhone(canonicalPhone);
    setError('');
    
    try {
      await requestOtp.mutateAsync({
        data: otpRequestData(canonicalPhone)
      });
      setStep('otp');
    } catch (err: unknown) {
      setError(loginErrorMessage(err, t('login.requestError')));
      requestLock.current = false;
      setRequestLocked(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!acquireSubmissionLock(verifyLock)) return;
    setVerifyLocked(true);
    if (!/^\d{6}$/.test(otp)) {
      setError(t('login.invalidOtp'));
      verifyLock.current = false;
      setVerifyLocked(false);
      return;
    }
    setError('');

    try {
      const session = await verifyOtp.mutateAsync({
        data: otpVerificationData(phone, otp),
      });
      await login(session);
    } catch (err: unknown) {
      setError(
        isNonDriverSessionError(err)
          ? t('login.driverOnly')
          : loginErrorMessage(err, t('login.verifyError')),
      );
      verifyLock.current = false;
      setVerifyLocked(false);
    }
  };

  const handleChangePhone = () => {
    requestLock.current = false;
    verifyLock.current = false;
    setRequestLocked(false);
    setVerifyLocked(false);
    setOtp('');
    setError('');
    setStep('phone');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20, direction }]}>
        <TouchableOpacity
          style={[styles.languageButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => { void toggleLocale(); }}
          accessibilityRole="button"
          accessibilityLabel={t('profile.switchHint')}
          testID="login-language-toggle"
        >
          <Text style={[styles.languageText, { color: colors.foreground }]}>{t('login.language')}</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>{t('login.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {step === 'phone' ? t('login.enterPhone') : t('login.enterOtp')}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <Text
              style={[styles.error, { color: colors.destructive }]}
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : null}
          
          {step === 'phone' ? (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius,
                    writingDirection: 'ltr',
                  },
                ]}
                placeholder="01012345678"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                textAlign="left"
                editable={!requestLocked && !requestOtp.isPending}
                accessibilityLabel={t('login.enterPhone')}
                testID="phone-input"
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                  (requestLocked || requestOtp.isPending) && { opacity: 0.7 },
                ]}
                onPress={handleRequestOtp}
                disabled={requestLocked || requestOtp.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('login.continue')}
                testID="request-otp-button"
              >
                {requestOtp.isPending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{t('login.continue')}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius,
                    textAlign: 'center',
                    writingDirection: 'ltr',
                    letterSpacing: 8,
                    fontSize: 24,
                  },
                ]}
                placeholder="------"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                editable={!verifyLocked && !verifyOtp.isPending}
                accessibilityLabel={t('login.enterOtp')}
                testID="otp-input"
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                  (verifyLocked || verifyOtp.isPending) && { opacity: 0.7 },
                ]}
                onPress={handleVerifyOtp}
                disabled={verifyLocked || verifyOtp.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('login.signIn')}
                testID="verify-otp-button"
              >
                {verifyOtp.isPending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{t('login.signIn')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkButton, { marginTop: 16 }]}
                onPress={handleChangePhone}
                disabled={verifyLocked || verifyOtp.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('login.changePhone')}
                testID="change-phone-button"
              >
                <Text style={[styles.linkText, { color: colors.foreground }]}>{t('login.changePhone')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  languageButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
  },
  languageText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  form: {
    width: '100%',
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 56,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Inter_500Medium',
  },
  button: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  linkButton: {
    padding: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
