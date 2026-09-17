import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../routes/api';
import Sidebar from '../components/sidebar';
import { Button, LoadState, useRemoteData } from '../components/management';

export default function VinculosScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const load = useCallback(async () => {
    const [usuarios, equipamentos] = await Promise.all([api('/listar_usuarios'), api('/listar_equipamentos')]);
    return { usuarios, equipamentos };
  }, []);
  const remote = useRemoteData(load);
  const usuarios = remote.data?.usuarios || [];
  const equipamentos = (remote.data?.equipamentos || []).map(item => ({ ...item, nome: item.modelo + ' (' + item.numero_serie + ')' }));
  const vinculos = equipamentos.filter(item => item.id_usuario != null).map(item => {
    const usuario = usuarios.find(user => String(user.id) === String(item.id_usuario));
    return { id: item.id, usuario: usuario?.nome || 'Usuário indisponível', tipo: usuario?.is_admin ? 'Administrador' : 'Usuário', equipamento: item.modelo, identificador: item.numero_serie, status: 'Ativo', id_usuario: item.id_usuario };
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [statusFiltroAberto, setStatusFiltroAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);
  const [usuarioDropdownAberto, setUsuarioDropdownAberto] = useState(false);
  const [equipamentoDropdownAberto, setEquipamentoDropdownAberto] = useState(false);
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const identificador = equipamentoSelecionado?.numero_serie || '';
  const equipamentosDisponiveis = equipamentos.filter(item => editing ? item.id === editing.id : item.id_usuario == null);
  const vinculosFiltrados = useMemo(() => vinculos.filter(item =>
    [item.usuario, item.equipamento, item.identificador].some(value => value.toLowerCase().includes(busca.trim().toLowerCase())) &&
    (statusFiltro === 'Todos' || item.status === statusFiltro)), [vinculos, busca, statusFiltro]);

  function fecharDropdowns() {
    setUsuarioDropdownAberto(false);
    setEquipamentoDropdownAberto(false);
  }
  function abrirCadastro() {
    setEditing(null); setUsuarioSelecionado(null); setEquipamentoSelecionado(null);
    setError(''); setMessage(''); fecharDropdowns(); setModalVisible(true);
  }
  function fecharCadastro() {
    if (busy) return;
    fecharDropdowns(); setModalVisible(false);
  }
  async function cadastrarVinculo() {
    if (busy) return;
    if (!usuarioSelecionado || !equipamentoSelecionado) {
      setError('Selecione um usuário e um equipamento.'); return;
    }
    setBusy(true); setError('');
    try {
      await api('/vincular_equipamento', { method: 'POST', body: { id_usuario: usuarioSelecionado.id, id_equipamento: equipamentoSelecionado.id } });
      setModalVisible(false);
      setMessage(editing ? 'Responsável atualizado com sucesso.' : 'Vínculo cadastrado com sucesso.');
      await remote.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  function alterarVinculo(vinculo) {
    setEditing(vinculo);
    setUsuarioSelecionado(usuarios.find(item => String(item.id) === String(vinculo.id_usuario)) || null);
    setEquipamentoSelecionado(equipamentos.find(item => item.id === vinculo.id));
    setError(''); fecharDropdowns(); setModalVisible(true);
  }
  function visualizarVinculo(vinculo) { setDetails(vinculo); }
  function deletarVinculo(vinculo) { setError(''); setDeleting(vinculo); }
  async function desvincular() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api('/desvincular_equipamento', { method: 'POST', body: { id_equipamento: deleting.id } });
      setDeleting(null); setMessage('Vínculo removido com sucesso.'); await remote.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.mainContainer, width < 760 && { flexDirection: 'column' }]}>

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <Sidebar navigation={navigation} active="Vinculos" />

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER */}

          <View style={styles.header}>

            <Text style={styles.pageTitle}>
              VINCULOS
            </Text>

            <Ionicons
              name="leaf-outline"
              size={48}
              color="#fff"
            />

          </View>

          {/* BOTÃO NOVO VÍNCULO */}

          <View style={styles.newButtonContainer}>

            <TouchableOpacity accessibilityRole="button"
              style={styles.newButton}
              disabled={remote.loading || !!remote.error}
              onPress={abrirCadastro}
              activeOpacity={0.8}
            >

              <Ionicons
                name="add"
                size={19}
                color="#000"
              />

              <Text style={styles.newButtonText}>
                Novo Vínculo
              </Text>

            </TouchableOpacity>

          </View>

          {/* =================================================
              TABELA
          ================================================= */}

<LoadState {...remote} />
          {!!message && <Text accessibilityRole="alert" style={{ color: '#fff', marginBottom: 12 }}>{message}</Text>}
          <ScrollView horizontal>
          <View style={[styles.tableContainer, { minWidth: 850, flex: 1 }]}>

            {/* FILTROS */}

            <View style={styles.filtersContainer}>

              {/* BUSCA */}

              <View style={styles.searchContainer}>

                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#aaa"
                />

                <TextInput
                  value={busca}
                  onChangeText={setBusca}
                  placeholder="Buscar usuário ou equipamento"
                  placeholderTextColor="#aaa"
                  style={styles.searchInput}
                />

              </View>

              {/* STATUS */}

              <View style={styles.filterWrapper}>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.statusFilter}
                  onPress={() =>
                    setStatusFiltroAberto(
                      !statusFiltroAberto
                    )
                  }
                >

                  <Text style={styles.filterText}>
                    status: {statusFiltro}
                  </Text>

                  <Ionicons
                    name={
                      statusFiltroAberto
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={18}
                    color="#999"
                  />

                </TouchableOpacity>

                {statusFiltroAberto && (
                  <View style={styles.filterDropdown}>

                    {[
                      'Todos',
                      'Ativo',
                    ].map((item) => (

                      <TouchableOpacity accessibilityRole="button"
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setStatusFiltro(item);
                          setStatusFiltroAberto(false);
                        }}
                      >

                        <Text style={styles.dropdownItemText}>
                          {item}
                        </Text>

                      </TouchableOpacity>

                    ))}

                  </View>
                )}

              </View>

            </View>

            {/* CABEÇALHO */}

            <View style={styles.tableHeader}>

              <Text
                style={[
                  styles.headerCell,
                  styles.userColumn,
                ]}
              >
                USER
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.typeColumn,
                ]}
              >
                TIPO
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.equipmentColumn,
                ]}
              >
                EQUIPAMENTO
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.identifierColumn,
                ]}
              >
                IDENTIFICADOR
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.statusColumn,
                ]}
              >
                STATUS
              </Text>

              <Text
                style={[
                  styles.headerCell,
                  styles.actionsColumn,
                ]}
              >
                AÇÕES
              </Text>

            </View>

            {/* LINHAS */}

            {vinculosFiltrados.map((vinculo) => (

              <VinculoRow
                key={vinculo.id}
                vinculo={vinculo}
                onAlterar={alterarVinculo}
                onVisualizar={visualizarVinculo}
                onDeletar={deletarVinculo}
              />

            ))}

            {/* SEM RESULTADOS */}

            {vinculosFiltrados.length === 0 && (

              <View style={styles.emptyContainer}>

                <Ionicons
                  name="link-outline"
                  size={42}
                  color="#aaa"
                />

                <Text style={styles.emptyText}>
                  Nenhum vínculo encontrado.
                </Text>

              </View>

            )}

          </View>

          </ScrollView>
        </ScrollView>

      </View>

      {/* =====================================================
          MODAL NOVO VÍNCULO
      ===================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={fecharCadastro}
      >

        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          {/* FUNDO */}

          <Pressable
            style={styles.modalBackground}
            onPress={fecharCadastro}
          />

          {/* MODAL */}

          <View style={styles.modalContainer}>

            {/* HEADER */}

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  {editing ? 'Alterar responsável' : 'Novo Vínculo'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Vincule um usuário a um equipamento
                </Text>

              </View>

              <TouchableOpacity accessibilityRole="button"
                style={styles.closeButton}
                onPress={fecharCadastro}
              >

                <Ionicons
                  name="close"
                  size={25}
                  color="#000"
                />

              </TouchableOpacity>

            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* =================================================
                  USUÁRIO
              ================================================= */}

              <View style={styles.inputGroup}>

                <Text style={styles.inputLabel}>
                  Usuário
                </Text>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.selectInput}
                  accessibilityLabel="Selecionar opção"
                  onPress={() => {

                    setEquipamentoDropdownAberto(false);

                    setUsuarioDropdownAberto(
                      !usuarioDropdownAberto
                    );

                  }}
                >

                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#777"
                  />

                  <Text
                    style={[
                      styles.selectText,
                      !usuarioSelecionado &&
                      styles.placeholderText,
                    ]}
                  >
                    {usuarioSelecionado
                      ? usuarioSelecionado.nome
                      : 'Selecione o usuário'}
                  </Text>

                  <Ionicons
                    name={
                      usuarioDropdownAberto
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={18}
                    color="#777"
                  />

                </TouchableOpacity>

                {usuarioDropdownAberto && (

                  <View style={styles.typeDropdown}>

                    {usuarios.map((usuario) => (

                      <TouchableOpacity accessibilityRole="button"
                        key={usuario.id}
                        style={styles.dropdownItem}
                        onPress={() => {

                          setUsuarioSelecionado(
                            usuario
                          );

                          setUsuarioDropdownAberto(
                            false
                          );

                        }}
                      >

                        <Text
                          style={
                            styles.dropdownItemText
                          }
                        >
                          {usuario.nome}
                        </Text>

                      </TouchableOpacity>

                    ))}

                  </View>

                )}

              </View>

              {/* =================================================
                  EQUIPAMENTO
              ================================================= */}

              <View style={styles.inputGroup}>

                <Text style={styles.inputLabel}>
                  Equipamento
                </Text>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.selectInput}
                  accessibilityLabel="Selecionar opção"
                  onPress={() => {

                    setUsuarioDropdownAberto(false);

                    setEquipamentoDropdownAberto(
                      !equipamentoDropdownAberto
                    );

                  }}
                >

                  <Ionicons
                    name="desktop-outline"
                    size={20}
                    color="#777"
                  />

                  <Text
                    style={[
                      styles.selectText,
                      !equipamentoSelecionado &&
                      styles.placeholderText,
                    ]}
                  >
                    {equipamentoSelecionado
                      ? equipamentoSelecionado.nome
                      : 'Selecione o equipamento'}
                  </Text>

                  <Ionicons
                    name={
                      equipamentoDropdownAberto
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={18}
                    color="#777"
                  />

                </TouchableOpacity>

                {equipamentoDropdownAberto && (

                  <View style={styles.typeDropdown}>

                    {equipamentosDisponiveis.map(
                      (equipamento) => (

                        <TouchableOpacity accessibilityRole="button"
                          key={equipamento.id}
                          style={styles.dropdownItem}
                          onPress={() => {

                            setEquipamentoSelecionado(
                              equipamento
                            );

                            setEquipamentoDropdownAberto(
                              false
                            );

                          }}
                        >

                          <Text
                            style={
                              styles.dropdownItemText
                            }
                          >
                            {equipamento.nome}
                          </Text>

                        </TouchableOpacity>

                      )
                    )}

                  </View>

                )}

              </View>

              {/* =================================================
                  IDENTIFICADOR
              ================================================= */}

              <View style={styles.inputGroup}>

                <Text style={styles.inputLabel}>
                  Identificador
                </Text>

                <View style={styles.inputWrapper}>

                  <Ionicons
                    name="barcode-outline"
                    size={20}
                    color="#777"
                  />

                  <TextInput
                    value={identificador}
                    editable={false}
                    placeholder="Ex: opt4038"
                    placeholderTextColor="#999"
                    style={styles.input}
                  />

                </View>

              </View>

              {!!error && <Text accessibilityRole="alert" style={{ color: '#a00912', marginBottom: 12 }}>{error}</Text>}
              {!equipamentosDisponiveis.length && <Text>Nenhum equipamento disponível para vínculo.</Text>}
              {/* =================================================
                  BOTÕES
              ================================================= */}

              <View style={styles.modalButtons}>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.cancelButton}
                  onPress={fecharCadastro}
                >

                  <Text
                    style={styles.cancelButtonText}
                  >
                    Cancelar
                  </Text>

                </TouchableOpacity>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.registerButton}
                  disabled={busy}
                  onPress={cadastrarVinculo}
                >

                  <Ionicons
                    name="checkmark"
                    size={19}
                    color="#fff"
                  />

                  <Text
                    style={styles.registerButtonText}
                  >
                    {busy ? 'Salvando...' : editing ? 'Salvar responsável' : 'Cadastrar'}
                  </Text>

                </TouchableOpacity>

              </View>

            </ScrollView>

          </View>

        </KeyboardAvoidingView>

      </Modal>

<Modal visible={!!details || !!deleting} transparent animationType="fade" onRequestClose={() => { if (!busy) { setDetails(null); setDeleting(null); } }}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{deleting ? 'Remover vínculo?' : 'Detalhes do vínculo'}</Text>
          <Text>{(deleting || details)?.usuario} — {(deleting || details)?.equipamento}</Text>
          <Text>Identificador: {(deleting || details)?.identificador}</Text>
          {deleting && <Text>O PC ficará disponível para outro usuário.</Text>}
          {!!error && deleting && <Text accessibilityRole="alert" style={{ color: '#a00912' }}>{error}</Text>}
          <Button secondary disabled={busy} onPress={() => { setDetails(null); setDeleting(null); }}>{deleting ? 'Cancelar' : 'Fechar'}</Button>
          {deleting && <Button disabled={busy} onPress={desvincular}>{busy ? 'Removendo...' : 'Confirmar desvínculo'}</Button>}
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}


/* =========================================================
   MENU ITEM
========================================================= */

function VinculoRow({
  vinculo,
  onAlterar,
  onVisualizar,
  onDeletar,
}) {

  return (
    <View style={styles.vinculoRow}>

      {/* USER */}

      <View style={styles.userColumn}>

        <Text style={styles.userName}>
          {vinculo.usuario}
        </Text>

      </View>

      {/* TIPO */}

      <View style={styles.typeColumn}>

        <Text style={styles.rowText}>
          {vinculo.tipo}
        </Text>

      </View>

      {/* EQUIPAMENTO */}

      <View style={styles.equipmentColumn}>

        <Text style={styles.rowText}>
          {vinculo.equipamento}
        </Text>

      </View>

      {/* IDENTIFICADOR */}

      <View style={styles.identifierColumn}>

        <Text style={styles.rowText}>
          {vinculo.identificador}
        </Text>

      </View>

      {/* STATUS */}

      <View style={styles.statusColumn}>

        <View
          style={[
            styles.statusBadge,

            vinculo.status === 'Ativo'
              ? styles.statusActive
              : styles.statusInactive,
          ]}
        >

          <Text
            style={[
              styles.statusText,

              vinculo.status === 'Ativo'
                ? styles.statusActiveText
                : styles.statusInactiveText,
            ]}
          >
            {vinculo.status.toLowerCase()}
          </Text>

        </View>

      </View>

      {/* AÇÕES */}

      <View style={styles.actionsColumn}>

        <View style={styles.actionsContainer}>

          {/* ALTERAR */}

          <TouchableOpacity accessibilityRole="button"
            onPress={() =>
              onAlterar(vinculo)
            }
          >

            <Text
              style={[
                styles.actionText,
                styles.actionAlterar,
              ]}
            >
              A
            </Text>

          </TouchableOpacity>

          {/* VISUALIZAR */}

          <TouchableOpacity accessibilityRole="button"
            onPress={() =>
              onVisualizar(vinculo)
            }
          >

            <Text
              style={[
                styles.actionText,
                styles.actionVisualizar,
              ]}
            >
              V
            </Text>

          </TouchableOpacity>

          {/* DELETAR */}

          <TouchableOpacity accessibilityRole="button"
            onPress={() =>
              onDeletar(vinculo)
            }
          >

            <Text
              style={[
                styles.actionText,
                styles.actionDeletar,
              ]}
            >
              D
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
  },


  /* =====================================================
     SIDEBAR
  ===================================================== */

  sidebar: {
    width: 227,
    backgroundColor: '#ff1111',
    minHeight: '100%',
    position: 'relative',
  },

  sidebarHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    paddingHorizontal: 9,
  },

  menuButton: {
    width: 38,
    marginRight: 8,
  },

  menuLine: {
    height: 4,
    width: 36,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginVertical: 3,
  },

  brand: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },

  logoIcon: {
    transform: [
      { rotate: '-25deg' },
    ],
  },


  /* =====================================================
     PERFIL
  ===================================================== */

  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 13,
  },

  profileIcon: {
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  profileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  profileRole: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },


  /* =====================================================
     MENU
  ===================================================== */

  menuContainer: {
    marginTop: 1,
  },

  menuItem: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  menuItemActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  menuText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 12,
  },


  /* =====================================================
     SAIR
  ===================================================== */

  logoutButton: {
    position: 'absolute',
    bottom: 12,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 9,
  },


  /* =====================================================
     CONTENT
  ===================================================== */

  contentScroll: {
    flex: 1,
    backgroundColor: '#000',
  },

  content: {
    paddingHorizontal: 29,
    paddingTop: 19,
    paddingBottom: 30,
  },


  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  pageTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
  },


  /* =====================================================
     BOTÃO NOVO
  ===================================================== */

  newButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  newButton: {
    height: 35,
    backgroundColor: '#ff1111',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },


  /* =====================================================
     TABELA
  ===================================================== */

  tableContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    minHeight: 378,
  },

  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    zIndex: 20,
  },

  searchContainer: {
    width: '40%',
    height: 33,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  searchInput: {
    flex: 1,
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 7,
    paddingVertical: 0,
  },

  filterWrapper: {
    width: '40%',
    position: 'relative',
  },

  statusFilter: {
    height: 33,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  filterText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '700',
  },

  filterDropdown: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 10,
    zIndex: 100,
  },

  dropdownItem: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },

  dropdownItemText: {
    color: '#333',
    fontSize: 14,
  },


  /* =====================================================
     CABEÇALHO TABELA
  ===================================================== */

  tableHeader: {
    height: 49,
    backgroundColor: '#d0d0d0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  headerCell: {
    color: '#444',
    fontSize: 14,
    fontWeight: '900',
  },


  /* =====================================================
     COLUNAS
  ===================================================== */

  userColumn: {
    flex: 0.95,
    paddingLeft: 9,
  },

  typeColumn: {
    flex: 1.05,
  },

  equipmentColumn: {
    flex: 1.05,
  },

  identifierColumn: {
    flex: 1.2,
  },

  statusColumn: {
    flex: 1,
  },

  actionsColumn: {
    flex: 0.7,
    alignItems: 'center',
  },


  /* =====================================================
     LINHAS
  ===================================================== */

  vinculoRow: {
    height: 41,
    marginTop: 4,
    backgroundColor: '#d0d0d0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  userName: {
    color: '#555',
    fontSize: 13,
    fontWeight: '800',
  },

  rowText: {
    color: '#555',
    fontSize: 13,
  },


  /* =====================================================
     STATUS
  ===================================================== */

  statusBadge: {
    height: 41,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusActive: {
    backgroundColor: '#7fc9a8',
  },

  statusInactive: {
    backgroundColor: '#e58a8a',
  },

  statusText: {
    fontSize: 12,
  },

  statusActiveText: {
    color: '#579b7c',
  },

  statusInactiveText: {
    color: '#bb6a6a',
  },


  /* =====================================================
     AÇÕES
  ===================================================== */

  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },

  actionAlterar: {
    color: '#8d4de8',
  },

  actionVisualizar: {
    color: '#555',
  },

  actionDeletar: {
    color: '#e33',
  },


  /* =====================================================
     EMPTY
  ===================================================== */

  emptyContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },


  /* =====================================================
     MODAL
  ===================================================== */

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  modalContainer: {
    width: '78%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    elevation: 15,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 23,
  },

  modalTitle: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: '#777',
    fontSize: 13,
    marginTop: 3,
  },

  closeButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =====================================================
     INPUTS
  ===================================================== */

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    color: '#333',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },

  inputWrapper: {
    height: 45,
    borderWidth: 1,
    borderColor: '#d5d5d5',
    borderRadius: 5,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    height: 45,
    color: '#222',
    fontSize: 14,
    marginLeft: 9,
  },


  /* =====================================================
     SELECT
  ===================================================== */

  selectInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#d5d5d5',
    borderRadius: 5,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  selectText: {
    flex: 1,
    color: '#444',
    fontSize: 14,
    marginLeft: 9,
  },

  placeholderText: {
    color: '#999',
  },

  typeDropdown: {
    marginTop: 3,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },


  /* =====================================================
     BOTÕES MODAL
  ===================================================== */

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 7,
    paddingBottom: 3,
  },

  cancelButton: {
    height: 43,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '800',
  },

  registerButton: {
    height: 43,
    paddingHorizontal: 20,
    backgroundColor: '#ff1111',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 5,
  },

});
