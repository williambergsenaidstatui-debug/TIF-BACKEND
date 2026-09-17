import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { api } from '../routes/api';
import { useAuth } from '../components/auth';
import { Button, LoadState, Page, Table, styles, useRemoteData } from '../components/management';

export default function Dashboard({ navigation }) {
  const { isAdmin } = useAuth();
  const load = useCallback(async () => {
    const [equipamentos, usuarios] = await Promise.all([
      api(isAdmin ? '/listar_equipamentos' : '/meus_equipamentos'),
      isAdmin ? api('/listar_usuarios') : Promise.resolve([]),
    ]);
    return { equipamentos, usuarios };
  }, [isAdmin]);
  const remote = useRemoteData(load);
  const equipment = remote.data?.equipamentos || [];
  const users = remote.data?.usuarios || [];
  const linked = equipment.filter((item) => item.id_usuario != null);
  const cards = isAdmin ? [
    ['Equipamentos', equipment.length],
    ['Sem vínculo', equipment.length - linked.length],
    ['Vinculados', linked.length],
    ['Usuários', users.length],
  ] : [['Meus equipamentos', equipment.length]];

  return <Page navigation={navigation} active="Dashboard" title="DASHBOARD">
    <LoadState {...remote} />
    {!remote.loading && !remote.error && <>
      <View style={styles.toolbar}>{cards.map(([label, count]) => <View key={label} style={styles.card}>
        <Text style={styles.text}>{label}</Text>
        <Text style={[styles.text, { fontSize: 40, fontWeight: '700' }]}>{count}</Text>
      </View>)}</View>
      <View style={styles.toolbar}>
        <Button onPress={() => navigation.navigate('Equipamento')}>{isAdmin ? 'Ver computadores' : 'Ver meus equipamentos'}</Button>
        {isAdmin && <Button onPress={() => navigation.navigate('Usuarios')}>Ver usuários</Button>}
      </View>
      <Text style={styles.text}>Equipamentos vinculados</Text>
      <Table columns={['Número de série', 'Marca / modelo', 'Usuário', 'Status']} rows={linked} empty="Nenhum equipamento vinculado." renderRow={(item) => <View key={item.id} style={styles.row}>
        <Text style={styles.cell}>{item.numero_serie}</Text>
        <Text style={styles.cell}>{item.marca} / {item.modelo}</Text>
        <Text style={styles.cell}>{users.find((user) => user.id === item.id_usuario)?.nome || (isAdmin ? String(item.id_usuario) : 'Você')}</Text>
        <Text style={styles.cell}>{item.status}</Text>
      </View>} />
    </>}
  </Page>;
}
