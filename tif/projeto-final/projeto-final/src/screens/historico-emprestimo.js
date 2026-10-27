import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../routes/api';
import { Button, LoadState, Page, Table, styles, useRemoteData } from '../components/management';

const date = (value) => value ? value.slice(0, 10).split('-').reverse().join('/') : 'Não informado';
export default function HistoricoEmprestimo({ navigation }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const load = useCallback(() => api('/emprestimos?page=' + page + (filter ? '&situacao=' + filter : '')), [page, filter]);
  const remote = useRemoteData(load);
  return <Page navigation={navigation} active="Historico" title="HISTÓRICO DE EMPRÉSTIMOS">
    <View style={styles.toolbar}>{[['', 'Todos'], ['ativos', 'Ativos'], ['devolvidos', 'Devolvidos'], ['atrasados', 'Atrasados']].map(([value, label]) =>
      <Button key={value} secondary={value !== filter} onPress={() => { setPage(1); setFilter(value); }}>{label}</Button>)}</View>
    <LoadState {...remote} />
    {!remote.loading && !remote.error && <>
      <Table columns={['Equipamento', 'Responsável', 'Retirada / operador', 'Previsão', 'Devolução / operador']} rows={remote.data?.data || []} renderRow={item =>
        <View key={item.id} style={styles.row}>
          <Text style={styles.cell}>{item.equipamento_serie}</Text>
          <Text style={styles.cell}>{item.usuario_nome}</Text>
          <Text style={styles.cell}>{date(item.retirado_em)} / {item.operador_retirada || 'Legado'}</Text>
          <Text style={styles.cell}>{date(item.previsto_para)}</Text>
          <Text style={styles.cell}>{item.devolvido_em ? date(item.devolvido_em) + ' / ' + (item.operador_devolucao || '') : 'Em aberto'}</Text>
        </View>} />
      <Text style={styles.text}>Página {page} de {remote.data?.last_page || 1} · {remote.data?.total || 0} registros</Text>
      <View style={styles.toolbar}>
        <Button disabled={page === 1} onPress={() => setPage(page - 1)}>Anterior</Button>
        <Button disabled={page >= (remote.data?.last_page || 1)} onPress={() => setPage(page + 1)}>Próxima</Button>
      </View>
    </>}
  </Page>;
}
