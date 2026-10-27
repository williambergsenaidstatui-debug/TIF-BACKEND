import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useAuth } from '../components/auth';
import { api } from '../routes/api';
import { Button, Page, styles } from '../components/management';

export default function Configuracao({ navigation }) {
  const { usuario, clearSession } = useAuth();
  const [values, setValues] = useState({ senha_atual: '', password: '', password_confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function salvar() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api('/minha_senha', { method: 'PUT', body: values });
      await clearSession();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Page navigation={navigation} active="Configuracao" title="CONFIGURAÇÕES">
    <Text style={styles.text}>{usuario.nome} · {usuario.email}</Text>
    <Text style={styles.text}>Alterar senha · Use de 12 a 72 caracteres, incluindo letras e números. Você precisará entrar novamente.</Text>
    {[['senha_atual', 'Senha atual'], ['password', 'Nova senha'], ['password_confirmation', 'Confirmar nova senha']].map(([key, label]) =>
      <TextInput key={key} accessibilityLabel={label} placeholder={label} secureTextEntry autoCapitalize="none" style={styles.input}
        value={values[key]} editable={!busy} onChangeText={value => setValues({ ...values, [key]: value })} />)}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button disabled={busy} onPress={salvar}>{busy ? 'Salvando...' : 'Alterar senha'}</Button>
  </Page>;
}
