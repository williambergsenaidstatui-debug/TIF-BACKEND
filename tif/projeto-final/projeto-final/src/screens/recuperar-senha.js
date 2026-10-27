import { useState } from 'react';
import { Platform, ScrollView, Text, TextInput } from 'react-native';
import { api } from '../routes/api';
import { useAuth } from '../components/auth';
import { Button, styles } from '../components/management';

export default function RecuperarSenha({ navigation }) {
  const { usuario, clearSession } = useAuth();
  const params = Platform.OS === 'web' ? new URLSearchParams(window.location.search) : null;
  const [reset, setReset] = useState(params?.has('token') || false);
  const [values, setValues] = useState({ email: params?.get('email') || '', token: params?.get('token') || '', password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit() {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api(reset ? '/redefinir_senha' : '/recuperar_senha', {
        method: 'POST', body: reset ? values : { email: values.email.trim() },
      });
      setMessage(result.mensagem);
      if (reset) {
        await clearSession();
        setValues({ ...values, token: '', password: '', password_confirmation: '' });
        if (Platform.OS === 'web') window.history.replaceState(null, '', '/login');
        setReset(false);
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const fields = [['email', 'E-mail'], ...(reset ? [['token', 'Código de recuperação'], ['password', 'Nova senha'], ['password_confirmation', 'Confirmar nova senha']] : [])];
  return <ScrollView style={styles.screen} contentContainerStyle={{ padding: 24, gap: 20, maxWidth: 600, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>{reset ? 'Redefinir senha' : 'Recuperar acesso'}</Text>
    <Text style={styles.text}>{reset ? 'Use de 12 a 72 caracteres, incluindo letras e números.' : 'Enviaremos um link para o e-mail cadastrado.'}</Text>
    {fields.map(([key, label]) => <TextInput key={key} style={styles.input} accessibilityLabel={label} placeholder={label}
      autoCapitalize="none" secureTextEntry={key.startsWith('password')} editable={!busy}
      value={values[key]} onChangeText={value => setValues({ ...values, [key]: value })} />)}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
    <Button disabled={busy} onPress={submit}>{busy ? 'Aguarde...' : reset ? 'Redefinir senha' : 'Enviar recuperação'}</Button>
    <Button secondary disabled={busy} onPress={() => { setReset(!reset); setError(''); setMessage(''); }}>{reset ? 'Solicitar outro link' : 'Já tenho um código'}</Button>
    <Button secondary disabled={busy} onPress={() => {
      if (Platform.OS === 'web') window.history.replaceState(null, '', '/login');
      navigation.navigate(usuario ? 'Dashboard' : 'Login');
    }}>Voltar ao login</Button>
  </ScrollView>;
}
