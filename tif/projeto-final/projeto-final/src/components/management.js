import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from './sidebar';

export function useRemoteData(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await loader();
      if (request === generation.current) setData(result);
    } catch (err) {
      if (request === generation.current) { setError(err.message); setData(null); }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [loader]);
  useFocusEffect(useCallback(() => {
    reload();
    return () => { generation.current++; };
  }, [reload]));
  return { data, loading, error, reload };
}

export function Page({ navigation, active, title, children }) {
  const { width } = useWindowDimensions();
  return <SafeAreaView style={styles.screen}>
    <View style={[styles.layout, width < 760 && { flexDirection: 'column' }]}>
      <Sidebar navigation={navigation} active={active} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </View>
  </SafeAreaView>;
}

export function Button({ children, onPress, disabled = false, secondary = false }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={[styles.button, secondary && { backgroundColor: '#444' }, disabled && { opacity: 0.5 }]}>
    <Text style={styles.buttonText}>{children}</Text>
  </Pressable>;
}

export function LoadState({ loading, error, reload }) {
  return <View style={styles.toolbar}>
    {loading && <ActivityIndicator color="#ff1111" />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Button secondary disabled={loading} onPress={reload}>{error ? 'Tentar novamente' : 'Atualizar'}</Button>
  </View>;
}

export function Table({ columns, rows, renderRow, empty = 'Nenhum registro encontrado.' }) {
  return <ScrollView horizontal style={styles.table}>
    <View style={{ minWidth: 760, flexGrow: 1 }}>
      <View style={[styles.row, styles.tableHeader]}>{columns.map((label) => <Text key={label} style={[styles.cell, { fontWeight: '700' }]}>{label}</Text>)}</View>
      {rows.map(renderRow)}
      {!rows.length && <Text style={{ padding: 24 }}>{empty}</Text>}
    </View>
  </ScrollView>;
}

export function FormModal({ title, fields, initial, onClose, onSave }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  async function submit() {
    if (submitting.current) return;
    if (fields.some(({ name }) => !String(values[name] ?? '').trim())) {
      setError('Preencha todos os campos.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try { await onSave(values); onClose(); }
    catch (err) { setError(err.message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <Modal visible transparent animationType="fade" onRequestClose={() => !busy && onClose()}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          {fields.map(({ name, label, options, ...props }) => <View key={name} style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{label}</Text>
            {options ? <View style={styles.toolbar}>{options.map((option) => <Button key={option} disabled={busy} secondary={values[name] !== option} onPress={() => setValues({ ...values, [name]: option })}>{option}</Button>)}</View> :
              <TextInput accessibilityLabel={label} style={styles.input} value={String(values[name] ?? '')} editable={!busy} onChangeText={(value) => setValues({ ...values, [name]: value })} {...props} />}
          </View>)}
          {!!error && <Text accessibilityRole="alert" style={[styles.error, { color: '#a00912' }]}>{error}</Text>}
          <View style={styles.toolbar}>
            <Button secondary disabled={busy} onPress={onClose}>Cancelar</Button>
            <Button disabled={busy} onPress={submit}>{busy ? 'Salvando...' : 'Salvar'}</Button>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  layout: { flex: 1, flexDirection: 'row' },
  content: { padding: 24, gap: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },
  toolbar: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  button: { backgroundColor: '#d90916', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 7 },
  buttonText: { color: '#fff', fontWeight: '700' },
  input: { backgroundColor: '#fff', color: '#111', padding: 12, borderWidth: 1, borderColor: '#aaa', borderRadius: 6, minHeight: 44 },
  table: { backgroundColor: '#fff', borderRadius: 12 },
  tableHeader: { backgroundColor: '#e9e9e9' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#ddd', padding: 12, gap: 12 },
  cell: { flex: 1, minWidth: 110, color: '#222' },
  error: { color: '#ffb0b0', marginVertical: 8, flexShrink: 1 },
  text: { color: '#fff', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 560, maxHeight: '90%', padding: 24, borderRadius: 16, backgroundColor: '#fff' },
  modalTitle: { fontSize: 23, fontWeight: '700', marginBottom: 20 },
  label: { color: '#222', marginBottom: 8, fontWeight: '600' },
  card: { backgroundColor: '#95101b', padding: 24, borderRadius: 12, minWidth: 180, flexGrow: 1, gap: 12 },
});
