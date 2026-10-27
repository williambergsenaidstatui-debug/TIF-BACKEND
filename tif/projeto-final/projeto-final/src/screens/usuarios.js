import { useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { api } from '../routes/api';
import { Button, FormModal, LoadState, Page, Table, styles, useRemoteData } from '../components/management';

const loadUsers = () => api('/listar_usuarios');
const fields = [
  { name: 'nome', label: 'Nome completo' },
  { name: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { name: 'cpf', label: 'CPF (11 dígitos)', keyboardType: 'number-pad', maxLength: 11 },
  { name: 'data_nascimento', label: 'Data de nascimento (AAAA-MM-DD)', placeholder: '2000-01-31' },
  { name: 'senha', label: 'Senha (12 a 72 caracteres, letras e números)', secureTextEntry: true },
];

export default function Usuarios({ navigation }) {
  const remote = useRemoteData(loadUsers);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('Todos');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const rows = (remote.data || []).filter(user =>
    [user.nome, user.email, user.cpf].some(value => String(value).toLowerCase().includes(search.trim().toLowerCase())) &&
    (role === 'Todos' || user.is_admin === (role === 'Administrador')));

  async function save(values) {
    const body = { nome: values.nome.trim(), email: values.email.trim(), cpf: values.cpf, data_nascimento: values.data_nascimento };
    if (!editing.id) body.senha = values.senha;
    await api(editing.id ? '/usuarios/' + editing.id : '/cadastro_usuario', { method: editing.id ? 'PUT' : 'POST', body });
    setMessage(editing.id ? 'Usuário atualizado. As sessões anteriores foram encerradas.' : 'Usuário cadastrado com sucesso.');
    await remote.reload();
  }
  async function remove() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api('/usuarios/' + deleting.id, { method: 'DELETE' });
      setDeleting(null); setMessage('Usuário excluído. Histórico preservado.');
      await remote.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Page navigation={navigation} active="Usuarios" title="USUÁRIOS">
    <View style={styles.toolbar}>
      <Button onPress={() => { setMessage(''); setEditing({ nome: '', email: '', cpf: '', data_nascimento: '', senha: '' }); }}>Novo usuário</Button>
      <LoadState {...remote} />
    </View>
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
    <TextInput accessibilityLabel="Buscar usuário" placeholder="Buscar por nome, e-mail ou CPF" style={styles.input} value={search} onChangeText={setSearch} />
    <View style={styles.toolbar}>{['Todos', 'Usuário', 'Administrador'].map(value =>
      <Button key={value} secondary={role !== value} onPress={() => setRole(value)}>{value}</Button>)}</View>
    {!remote.loading && !remote.error && <Table columns={['Nome', 'Perfil', 'CPF', 'E-mail', 'Nascimento', 'Ações']} rows={rows} renderRow={user => <View key={user.id} style={styles.row}>
      <Text style={styles.cell}>{user.nome}</Text>
      <Text style={styles.cell}>{user.is_admin ? 'Administrador' : 'Usuário'}</Text>
      <Text style={styles.cell}>{user.cpf}</Text>
      <Text style={styles.cell}>{user.email}</Text>
      <Text style={styles.cell}>{user.data_nascimento?.slice(0, 10).split('-').reverse().join('/')}</Text>
      <View style={[styles.cell, { gap: 8 }]}>
        <Button secondary onPress={() => setEditing({ ...user, data_nascimento: user.data_nascimento.slice(0, 10) })}>Editar usuário</Button>
        {!user.is_admin && <Button secondary onPress={() => { setError(''); setDeleting(user); }}>Excluir usuário</Button>}
      </View>
    </View>} />}
    {editing && <FormModal title={editing.id ? 'Editar usuário' : 'Novo usuário'} fields={editing.id ? fields.filter(field => field.name !== 'senha') : fields}
      initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    {deleting && <Modal visible transparent animationType="fade" onRequestClose={() => !busy && setDeleting(null)}>
      <View style={styles.overlay}><View style={styles.modal}>
        <Text style={styles.modalTitle}>Excluir {deleting.nome}?</Text>
        <Text>O acesso será removido e o histórico será preservado. Empréstimos ativos devem ser devolvidos antes.</Text>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#a00912' }}>{error}</Text>}
        <Button secondary disabled={busy} onPress={() => setDeleting(null)}>Cancelar</Button>
        <Button disabled={busy} onPress={remove}>Confirmar exclusão de usuário</Button>
      </View></View>
    </Modal>}
  </Page>;
}
