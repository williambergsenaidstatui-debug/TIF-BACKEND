import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { api } from '../routes/api';
import { useAuth } from '../components/auth';
import { Button, FormModal, LoadState, Page, Table, styles, useRemoteData } from '../components/management';

const loadUsers = () => api('/listar_usuarios');
const fields = [
  { name: 'nome', label: 'Nome completo' },
  { name: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { name: 'cpf', label: 'CPF (11 dígitos)', keyboardType: 'number-pad', maxLength: 11 },
  { name: 'data_nascimento', label: 'Data de nascimento (AAAA-MM-DD)', placeholder: '2000-01-31' },
  { name: 'senha', label: 'Senha (mínimo de 6 caracteres)', secureTextEntry: true },
];

export default function Usuarios({ navigation }) {
  const { isAdmin } = useAuth();
  const remote = useRemoteData(loadUsers);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('Todos');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const rows = (remote.data || []).filter((user) =>
    [user.nome, user.email, user.cpf].some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase())) &&
    (role === 'Todos' || user.is_admin === (role === 'Administrador')));

  async function save(values) {
    await api('/cadastro_usuario', { method: 'POST', body: { ...values, nome: values.nome.trim(), email: values.email.trim() } });
    setMessage('Usuário cadastrado com sucesso.');
    await remote.reload();
  }

  return <Page navigation={navigation} active="Usuarios" title="USUÁRIOS">
    <View style={styles.toolbar}>
      {isAdmin && <Button onPress={() => { setMessage(''); setCreating(true); }}>Novo usuário</Button>}
      <LoadState {...remote} />
    </View>
    {!!message && <Text accessibilityRole="alert" style={styles.text}>{message}</Text>}
    <TextInput accessibilityLabel="Buscar usuário" placeholder="Buscar por nome, e-mail ou CPF" style={styles.input} value={search} onChangeText={setSearch} />
    <View style={styles.toolbar}>{['Todos', 'Usuário', 'Administrador'].map((value) => <Button key={value} secondary={role !== value} onPress={() => setRole(value)}>{value}</Button>)}</View>
    {!remote.loading && !remote.error && <Table columns={['Nome', 'Perfil', 'CPF', 'E-mail', 'Nascimento']} rows={rows} renderRow={(user) => <View key={user.id} style={styles.row}>
      <Text style={styles.cell}>{user.nome}</Text>
      <Text style={styles.cell}>{user.is_admin ? 'Administrador' : 'Usuário'}</Text>
      <Text style={styles.cell}>{user.cpf}</Text>
      <Text style={styles.cell}>{user.email}</Text>
      <Text style={styles.cell}>{user.data_nascimento?.slice(0, 10).split('-').reverse().join('/')}</Text>
    </View>} />}
    {creating && isAdmin && <FormModal title="Novo usuário" fields={fields} initial={{ nome: '', email: '', cpf: '', data_nascimento: '', senha: '' }} onClose={() => setCreating(false)} onSave={save} />}
  </Page>;
}
