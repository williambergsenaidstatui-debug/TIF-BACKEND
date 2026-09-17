import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useAuth } from './auth';

export default function Sidebar({ navigation, active }) {
  const { usuario, isAdmin, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const items = [['Dashboard', 'Dashboard'], ...(isAdmin ? [['Usuarios', 'Usuários'], ['Vinculos', 'Vínculos']] : []), ['Equipamento', isAdmin ? 'Computadores' : 'Meus equipamentos']];

  async function sair() {
    setBusy(true);
    setError('');
    try { await logout(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <View style={[styles.sidebar, width < 760 && { width: '100%' }]}>
    <View style={styles.brand}>
      <Image source={require('../../assets/logo-projeto-final-mobile.png')} style={{ width: 38, height: 38 }} resizeMode="contain" />
      <Text style={styles.name}>VERIFY SYSTEM</Text>
    </View>
    <View style={styles.profile}>
      <Text style={styles.name}>{usuario.nome}</Text>
      <Text style={styles.text}>{isAdmin ? 'Administrador' : 'Usuário'}</Text>
    </View>
    <View style={width < 760 && { flexDirection: 'row', flexWrap: 'wrap' }}>
      {items.map(([route, label]) => <Pressable key={route} accessibilityRole="button" accessibilityState={{ selected: active === route }} onPress={() => navigation.navigate(route)} style={[styles.item, active === route && styles.active]}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>)}
      <Pressable accessibilityRole="button" disabled={busy} onPress={sair} style={styles.item}><Text style={styles.text}>{busy ? 'Saindo...' : 'Sair'}</Text></Pressable>
    </View>
    {!!error && <Text accessibilityRole="alert" style={styles.text}>{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  sidebar: { width: 225, backgroundColor: '#e51019', padding: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#fff' },
  name: { color: '#fff', fontSize: 16, fontWeight: '800', flexShrink: 1 },
  text: { color: '#fff', fontSize: 14 },
  profile: { paddingVertical: 20, gap: 4 },
  item: { padding: 14, borderRadius: 6 },
  active: { backgroundColor: '#960a12' },
});
