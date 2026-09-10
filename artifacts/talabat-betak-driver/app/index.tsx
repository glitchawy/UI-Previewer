import React, { useState } from 'react';
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
import { useRequestOtp, useVerifyOtp, OtpRequestRole, OtpVerifyType } from '@workspace/api-client-react';
import { useAuth } from '@/ctx/AuthContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    
    try {
      await requestOtp.mutateAsync({
        data: {
          phone,
          role: OtpRequestRole.driver,
        }
      });
      setStep('otp');
    } catch (err: any) {
      setError(err?.error || 'Failed to request OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError('');

    try {
      const session = await verifyOtp.mutateAsync({
        data: {
          phone,
          otp,
          role: OtpRequestRole.driver,
          type: OtpVerifyType.login,
        }
      });
      await login(session);
    } catch (err: any) {
      setError(err?.error || 'Failed to verify OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>Talabat Betak Driver</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {step === 'phone' ? 'Enter your phone number to sign in' : 'Enter the 6-digit code sent to your phone'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          
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
                  },
                ]}
                placeholder="01012345678"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!requestOtp.isPending}
                testID="phone-input"
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                  requestOtp.isPending && { opacity: 0.7 },
                ]}
                onPress={handleRequestOtp}
                disabled={requestOtp.isPending}
                testID="request-otp-button"
              >
                {requestOtp.isPending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Continue</Text>
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
                editable={!verifyOtp.isPending}
                testID="otp-input"
              />
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                  verifyOtp.isPending && { opacity: 0.7 },
                ]}
                onPress={handleVerifyOtp}
                disabled={verifyOtp.isPending}
                testID="verify-otp-button"
              >
                {verifyOtp.isPending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Sign In</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkButton, { marginTop: 16 }]}
                onPress={() => setStep('phone')}
                disabled={verifyOtp.isPending}
                testID="change-phone-button"
              >
                <Text style={[styles.linkText, { color: colors.foreground }]}>Change phone number</Text>
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
