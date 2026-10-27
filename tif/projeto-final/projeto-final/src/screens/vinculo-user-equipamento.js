import { useCallback, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { api } from '../routes/api';
import { Button, FormModal, LoadState, Page, Table, styles, useRemoteData } from '../components/management';

export default function Vinculos({ navigation }) {
  const load = useCallback(async () => {
    const [usuarios, equipamentos] = await Promise.all([api('/listar_usuarios'), api('/listar_equipamentos')]);
    return { usuarios, equipamentos };
  }, []);
  const remote = useRemoteData(load);
  const usuarios = remote.data?.usuarios || [];
  const equipamentos = remote.data?.equipamentos || [];
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const rows = equipamentos.filter(item => item.id_usuario != null).map(item => ({
    ...item, usuario_nome: usuarios.find(user => user.id === item.id_usuario)?.nome || 'Usuário indisponível',
  })).filter(item => [item.usuario_nome, item.modelo, item.numero_serie].some(value => value.toLowerCase().includes(search.trim().toLowerCase())));
  const options = equipamentos.filter(item => editing?.id ? item.id === editing.id : item.id_usuario == null && item.status === 'Disponível');
  const fields = [
    { name: 'usuario', label: 'Responsável', options: usuarios.map(user => user.id + ' · ' + user.nome) },
    { name: 'equipamento', label: 'Equipamento', options: options.map(item => item.id + ' · ' + item.numero_serie + ' · ' + item.modelo) },
    { name: 'previsto_para', label: 'Devolução prevista (AAAA-MM-DD)', placeholder: '2026-12-31' },
  ];
  async function save(values) {
    await api('/vincular_equipamento', { method: 'POST', body: {
      id_usuario: Number(values.usuario.split(' · ')[0]),
      id_equipamento: Number(values.equipamento.split(' · ')[0]),
      previsto_para: values.previsto_para.trim(),
      ...(editing.id ? { substituir_usuario_id: editing.id_usuario } : {}),
    } });
    setMessage(editing.id ? 'Responsável atualizado com sucesso.' : 'Vínculo cadastrado com sucesso.');
    await remote.reload();
  }
  async function remove() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api('/desvincular_equipamento', { method: 'POST', body: { id_equipamento: deleting.id } });
      setDeleting(null); setMessage('Devolução registrada. Vínculo removido com sucesso.');
      await remote.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Page navigation={navigation} active="Vinculos" title="VÍNCULOS E EMPRÉSTIMOS">
    <Text style={styles.text}>A troca de responsável registra a devolução anterior e uma nova retirada. Informe uma previsão para cada empréstimo.</Text>
    <View style={styles.toolbar}>
      <Button disabled={remote.loading || !!remote.error} onPress={() => setEditing({ usuario: '', equipamento: '', previsto_para: '' })}>Novo Vínculo</Button>
      <LoadState {...remote} />
    </View>
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
    <TextInput accessibilityLabel="Buscar vínculo" placeholder="Buscar usuário ou equipamento" style={styles.input} value={search} onChangeText={setSearch} />
    {!remote.loading && !remote.error && <Table columns={['Responsável', 'Equipamento', 'Número de série', 'Ações']} rows={rows} empty="Nenhum vínculo ativo." renderRow={item =>
      <View key={item.id} style={styles.row}>
        <Text style={styles.cell}>{item.usuario_nome}</Text><Text style={styles.cell}>{item.modelo}</Text><Text style={styles.cell}>{item.numero_serie}</Text>
        <View style={[styles.cell, { gap: 8 }]}>
          <Button secondary onPress={() => setEditing({ ...item, usuario: '', equipamento: item.id + ' · ' + item.numero_serie + ' · ' + item.modelo, previsto_para: '' })}>Alterar responsável</Button>
          <Button secondary onPress={() => setDetails(item)}>Visualizar vínculo</Button>
          <Button secondary onPress={() => { setError(''); setDeleting(item); }}>Registrar devolução</Button>
        </View>
      </View>} />}
    {editing && <FormModal title={editing.id ? 'Transferir equipamento' : 'Novo empréstimo'} fields={fields} initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    {(deleting || details) && <Modal visible transparent animationType="fade" onRequestClose={() => { if (!busy) { setDeleting(null); setDetails(null); } }}>
      <View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>{deleting ? 'Registrar devolução?' : 'Detalhes do vínculo'}</Text>
        <Text>{(deleting || details).usuario_nome} · {(deleting || details).numero_serie}</Text>
        <Text>{deleting ? 'O equipamento ficará disponível. A devolução e o operador serão registrados no histórico.' : 'As datas e os operadores estão disponíveis no histórico de empréstimos.'}</Text>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#a00912' }}>{error}</Text>}
        <Button secondary disabled={busy} onPress={() => { setDeleting(null); setDetails(null); }}>{deleting ? 'Cancelar' : 'Fechar'}</Button>
        {deleting && <Button disabled={busy} onPress={remove}>Confirmar devolução</Button>}
      </View></View>
    </Modal>}
  </Page>;
}
