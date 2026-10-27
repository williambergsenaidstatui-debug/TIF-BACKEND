import { useCallback, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { API_URL, api } from '../routes/api';
import { Button, LoadState, Page, styles, useRemoteData } from '../components/management';

export default function Sensores({ navigation }) {
  const load = useCallback(() => api('/listar_equipamentos'), []);
  const remote = useRemoteData(load);
  const [selected, setSelected] = useState(null);
  const [readings, setReadings] = useState(null);
  const [page, setPage] = useState(1);
  const [secret, setSecret] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function show(item, number = 1) {
    if (busy) return;
    setBusy(true); setError(''); setSecret(''); setMessage(''); setConfirm('');
    setSelected(item); setReadings(null);
    try {
      const data = await api('/equipamentos/' + item.id + '/leituras?page=' + number);
      setReadings(data); setPage(number);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function credential() {
    if (busy) return;
    setBusy(true); setError(''); setSecret('');
    try {
      const data = await api('/equipamentos/' + selected.id + '/credencial', { method: confirm === 'gerar' ? 'POST' : 'DELETE' });
      setSecret(data.token || ''); setMessage(data.mensagem); setConfirm('');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Page navigation={navigation} active="Sensores" title="SENSORES HTTP">
    <LoadState {...remote} />
    <Text style={styles.text}>Selecione um equipamento para consultar as leituras ou administrar a credencial exclusiva do dispositivo.</Text>
    {!remote.loading && !remote.error && (remote.data || []).map(item => <Button key={item.id} secondary onPress={() => show(item)}>{item.numero_serie} · {item.modelo}</Button>)}
    {selected && <Modal visible transparent animationType="fade" onRequestClose={() => { if (!busy) { setSelected(null); setSecret(''); } }}>
      <View style={styles.overlay}><ScrollView style={[styles.modal, { flexGrow: 0 }]} contentContainerStyle={{ gap: 16 }}>
        <Text style={styles.modalTitle}>{selected.numero_serie}</Text>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#a00912' }}>{error}</Text>}
        {!!message && <Text accessibilityRole="alert">{message}</Text>}
        {!!secret && <>
          <Text>Copie agora. A credencial não será mostrada novamente. Configure o dispositivo com HTTPS e o cabeçalho Authorization: Bearer seguido desta credencial.</Text>
          <TextInput accessibilityLabel="Credencial do dispositivo" value={secret} editable={false} multiline selectTextOnFocus style={styles.input} />
        </>}
        <Text>Enviar POST para {API_URL}/sensores/leituras</Text>
        <Text selectable>{JSON.stringify({ sensor_nome: 'sensor-1', valor_digital: true, valor_analogico: 123 })}</Text>
        <Text>O equipamento é identificado pela credencial. Não envie id_equipamento no corpo.</Text>
        <Button disabled={busy} onPress={() => setConfirm('gerar')}>Gerar ou trocar credencial</Button>
        <Button disabled={busy} secondary onPress={() => setConfirm('revogar')}>Revogar credencial</Button>
        {!!confirm && <>
          <Text>{confirm === 'gerar' ? 'Gerar uma credencial invalida a anterior. Confirma?' : 'O dispositivo deixará de enviar leituras. Confirma?'}</Text>
          <Button disabled={busy} onPress={credential}>Confirmar operação</Button>
          <Button secondary disabled={busy} onPress={() => setConfirm('')}>Cancelar operação</Button>
        </>}
        <Text>Leituras: {readings?.total || 0} · Página {page}</Text>
        {(readings?.data || []).map(item => <Text key={item.id}>{item.created_at} · {item.sensor_nome} · Digital: {Number(item.valor_digital)} · Analógico: {item.valor_analogico ?? '—'}</Text>)}
        <Button secondary disabled={busy || page <= 1} onPress={() => show(selected, page - 1)}>Anterior</Button>
        <Button secondary disabled={busy || page >= (readings?.last_page || 1)} onPress={() => show(selected, page + 1)}>Próxima</Button>
        <Button secondary disabled={busy} onPress={() => show(selected, page)}>Atualizar leituras</Button>
        <Button disabled={busy} onPress={() => { setSelected(null); setSecret(''); }}>Fechar</Button>
      </ScrollView></View>
    </Modal>}
  </Page>;
}
