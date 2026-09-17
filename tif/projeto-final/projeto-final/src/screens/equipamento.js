import { useCallback, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { api } from '../routes/api';
import { useAuth } from '../components/auth';
import { Button, FormModal, LoadState, Page, Table, styles, useRemoteData } from '../components/management';

const fields = [
  { name: 'numero_serie', label: 'Número de série' },
  { name: 'categoria', label: 'Categoria' },
  { name: 'marca', label: 'Marca' },
  { name: 'modelo', label: 'Modelo' },
  { name: 'data_aquisicao', label: 'Data de aquisição (AAAA-MM-DD)', placeholder: '2026-09-17' },
  { name: 'status', label: 'Status', options: ['Disponível', 'Em uso', 'Manutenção'] },
];
const empty = { numero_serie: '', categoria: 'Computador', marca: '', modelo: '', data_aquisicao: '', status: 'Disponível' };

export default function Equipamento({ navigation }) {
  const { isAdmin } = useAuth();
  const load = useCallback(() => api(isAdmin ? '/listar_equipamentos' : '/meus_equipamentos'), [isAdmin]);
  const remote = useRemoteData(load);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Todos');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const rows = (remote.data || []).filter((item) =>
    [item.numero_serie, item.marca, item.modelo, item.categoria].some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase())) &&
    (status === 'Todos' || item.status === status));

  async function save(values) {
    const body = Object.fromEntries(fields.map(({ name }) => [name, values[name].trim()]));
    await api(editing.id ? '/atualizar_equipamento/' + editing.id : '/cadastro_equipamento', { method: editing.id ? 'PUT' : 'POST', body });
    setMessage(editing.id ? 'Equipamento atualizado.' : 'Equipamento cadastrado.');
    await remote.reload();
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api('/excluir_equipamento/' + deleting.id, { method: 'DELETE' });
      setDeleting(null);
      setMessage('Equipamento excluído.');
      await remote.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <Page navigation={navigation} active="Equipamento" title={isAdmin ? 'COMPUTADORES E EQUIPAMENTOS' : 'MEUS EQUIPAMENTOS'}>
    <View style={styles.toolbar}>
      {isAdmin && <Button onPress={() => { setMessage(''); setEditing({ ...empty }); }}>Novo equipamento</Button>}
      <LoadState {...remote} />
    </View>
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
    <TextInput accessibilityLabel="Buscar equipamento" placeholder="Buscar por série, categoria, marca ou modelo" style={styles.input} value={search} onChangeText={setSearch} />
    <View style={styles.toolbar}>{['Todos', ...new Set(['Disponível', 'Em uso', 'Manutenção', ...(remote.data || []).map((item) => item.status)])].map((value) => <Button key={value} secondary={status !== value} onPress={() => setStatus(value)}>{value}</Button>)}</View>
    {!remote.loading && !remote.error && <Table columns={['Série', 'Categoria', 'Marca / modelo', 'Aquisição', 'Status', ...(isAdmin ? ['Ações'] : [])]} rows={rows} renderRow={(item) => <View key={item.id} style={styles.row}>
      <Text style={styles.cell}>{item.numero_serie}</Text>
      <Text style={styles.cell}>{item.categoria}</Text>
      <Text style={styles.cell}>{item.marca} / {item.modelo}</Text>
      <Text style={styles.cell}>{item.data_aquisicao?.slice(0, 10).split('-').reverse().join('/')}</Text>
      <Text style={styles.cell}>{item.status}</Text>
      {isAdmin && <View style={[styles.cell, { gap: 8 }]}>
        <Button secondary onPress={() => setEditing({ ...item, data_aquisicao: item.data_aquisicao.slice(0, 10) })}>Editar</Button>
        <Button secondary onPress={() => { setError(''); setDeleting(item); }}>Excluir</Button>
      </View>}
    </View>} />}
    {editing && isAdmin && <FormModal title={editing.id ? 'Editar equipamento' : 'Novo equipamento'} fields={fields} initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    {deleting && isAdmin && <Modal visible transparent animationType="fade" onRequestClose={() => !busy && setDeleting(null)}>
      <View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>Excluir {deleting.numero_serie}?</Text>
        <Text style={{ marginBottom: 20 }}>O equipamento será removido permanentemente.</Text>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#a00912', marginBottom: 16 }}>{error}</Text>}
        <View style={styles.toolbar}>
          <Button secondary disabled={busy} onPress={() => setDeleting(null)}>Cancelar</Button>
          <Button disabled={busy} onPress={remove}>{busy ? 'Excluindo...' : 'Confirmar exclusão'}</Button>
        </View>
      </View></View>
    </Modal>}
  </Page>;
}
