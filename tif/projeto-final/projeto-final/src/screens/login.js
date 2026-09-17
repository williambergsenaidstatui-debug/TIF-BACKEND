import { useState } from 'react';
import { useAuth } from '../components/auth';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ScrollView,
} from 'react-native';
import Svg, { Line, Polygon, Rect } from 'react-native-svg';

const logo = require('../../assets/logo-projeto-final-mobile.png');

export default function Login() {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function entrar() {
    if (busy) return;
    if (!email.trim() || !senha) { setError('Informe o e-mail e a senha.'); return; }
    setBusy(true);
    setError('');
    try { await login(email, senha); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={[styles.layout, isMobile && styles.layoutMobile]} keyboardShouldPersistTaps="handled">
        <View style={[styles.brandPanel, isMobile && styles.brandPanelMobile]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 420 720"
            preserveAspectRatio="none"
            style={styles.brandShape}
          >
            <Polygon
              points={isMobile ? '0,0 420,0 420,515 0,590' : '0,0 350,0 420,720 0,720'}
              fill="#9c0712"
            />
            <Line
              x1={isMobile ? '0' : '350'}
              y1={isMobile ? '590' : '0'}
              x2="420"
              y2={isMobile ? '515' : '720'}
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.9"
            />
          </Svg>

          <View style={[styles.decor, isMobile && styles.decorMobile]}>
            <Svg width="280" height="360" viewBox="0 0 180 360">
              <Rect x="-22" y="24" width="28" height="28" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 -8 38)" />
              <Rect x="24" y="72" width="42" height="42" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 45 93)" />
              <Rect x="78" y="92" width="14" height="54" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 85 99)" />
              <Rect x="-12" y="128" width="54" height="54" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 15 155)" />
              <Rect x="42" y="172" width="54" height="54" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 69 199)" />
              <Rect x="100" y="190" width="14" height="64" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 107 197)" />
              <Rect x="8" y="244" width="76" height="76" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 46 282)" />
              <Rect x="88" y="270" width="96" height="96" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 136 318)" />
              <Rect x="84" y="306" width="22" height="22" stroke="#080808" strokeWidth="3" fill="none" transform="rotate(45 95 317)" />
            </Svg>
          </View>

          <View style={[styles.brandContent, isMobile && styles.brandContentMobile]}>
            <Text style={[styles.brandHeading, isMobile && styles.brandHeadingMobile]}>
              Controle de emprestimos de{'\n'}equipamentos via IoT
            </Text>

            <Image
              source={logo}
              style={[styles.logo, isMobile && styles.logoMobile]}
              resizeMode="contain"
            />

            <Text style={[styles.brandName, isMobile && styles.brandNameMobile]}>
              Verify System
            </Text>
          </View>
        </View>

        <View style={[styles.formPanel, isMobile && styles.formPanelMobile]}>
          <View style={[styles.formBox, isMobile && styles.formBoxMobile]}>
            <Text style={[styles.formTitle, isMobile && styles.formTitleMobile]}>
              Acesse sua conta
            </Text>
            <Text style={[styles.formSubtitle, isMobile && styles.formSubtitleMobile]}>
              Entre com seu e-mail e senha
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                accessibilityLabel="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoComplete="email"
                editable={!busy}
                placeholderTextColor="#b8b8b8"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Senha:</Text>
              <TextInput
                accessibilityLabel="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                editable={!busy}
                onSubmitEditing={entrar}
                placeholderTextColor="#b8b8b8"
                style={styles.input}
              />
            </View>

            {!!error && <Text accessibilityRole="alert" style={{ color: '#ff9b9b', marginBottom: 16 }}>{error}</Text>}

            <Pressable accessibilityRole="button" disabled={busy} onPress={entrar} style={[styles.button, busy && { opacity: 0.5 }]}>
              <Text style={styles.buttonText}>{busy ? 'Entrando...' : 'Entrar'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  layout: {
    flexGrow: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  layoutMobile: {
    flexDirection: 'column',
  },
  brandPanel: {
    width: '44%',
    minWidth: 360,
    position: 'relative',
  },
  brandPanelMobile: {
    width: '100%',
    minWidth: 0,
    height: 380,
  },
  brandShape: {
    ...StyleSheet.absoluteFillObject,
  },
  decor: {
    position: 'absolute',
    left: -18,
    bottom: 12,
    opacity: 0.95,
  },
  decorMobile: {
    left: -44,
    bottom: -58,
    transform: [{ scale: 0.78 }],
  },
  brandContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
    paddingRight: 58,
  },
  brandContentMobile: {
    paddingTop: 22,
    paddingRight: 0,
  },
  brandHeading: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 31,
    textAlign: 'center',
    fontFamily: Platform.select({ web: 'serif', default: undefined }),
  },
  brandHeadingMobile: {
    fontSize: 19,
    lineHeight: 30,
  },
  logo: {
    width: 210,
    height: 190,
    marginTop: 24,
    tintColor: '#000',
  },
  logoMobile: {
    width: 150,
    height: 128,
    marginTop: 10,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '600',
    marginTop: -10,
  },
  brandNameMobile: {
    fontSize: 20,
    marginTop: -4,
  },
  formPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  formPanelMobile: {
    justifyContent: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: 34,
  },
  formBox: {
    width: '100%',
    maxWidth: 520,
  },
  formBoxMobile: {
    maxWidth: 420,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '400',
    textAlign: 'center',
  },
  formTitleMobile: {
    fontSize: 26,
  },
  formSubtitle: {
    color: '#ffffff',
    fontSize: 22,
    marginTop: 6,
    marginBottom: 46,
    textAlign: 'center',
    fontFamily: Platform.select({ web: 'serif', default: undefined }),
  },
  formSubtitleMobile: {
    fontSize: 17,
    marginBottom: 30,
  },
  fieldGroup: {
    marginBottom: 30,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  input: {
    height: 34,
    backgroundColor: '#808080',
    color: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    marginTop: 8,
    marginBottom: 42,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkbox: {
    width: 15,
    height: 15,
    backgroundColor: '#808080',
  },
  checkboxActive: {
    backgroundColor: '#35f909',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 15,
  },
  forgotText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    alignSelf: 'center',
    width: '68%',
    minWidth: 260,
    height: 38,
    borderRadius: 22,
    backgroundColor: '#ff0004',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
