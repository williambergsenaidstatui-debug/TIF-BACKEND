import { Text, View } from 'react-native';
import { api } from '../routes/api';
import { LoadState, Page, styles, useRemoteData } from '../components/management';
const load = () => api('/alertas');
export default function Alertas({ navigation }) {
  const remote = useRemoteData(load);
  return <Page navigation={navigation} active="Alertas" title="ALERTAS">
    <LoadState {...remote} />
    {!remote.loading && !remote.error && <>
      <Text style={styles.text}>Empréstimos atrasados: {remote.data?.total_atrasados || 0}</Text>
      {(remote.data?.atrasados || []).map(item => <View key={item.id} style={styles.card}>
        <Text style={styles.text}>{item.equipamento_serie} · {item.usuario_nome}</Text>
        <Text style={styles.text}>Devolução prevista: {item.previsto_para?.slice(0, 10).split('-').reverse().join('/')}</Text>
      </View>)}
      <Text style={styles.text}>Equipamentos em manutenção: {remote.data?.total_manutencao || 0}</Text>
      {(remote.data?.manutencao || []).map(item => <View key={item.id} style={styles.card}>
        <Text style={styles.text}>{item.numero_serie} · {item.marca} {item.modelo}</Text>
      </View>)}
      <Text style={styles.text}>Os alertas são atualizados ao abrir esta tela ou tocar em Atualizar. São exibidos até 100 registros de cada tipo; os atrasos completos estão no histórico.</Text>
    </>}
  </Page>;
}
