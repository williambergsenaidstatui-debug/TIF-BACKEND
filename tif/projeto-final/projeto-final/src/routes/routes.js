import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useAuth } from '../components/auth';
import Login from '../screens/login';
import Dashboard from '../screens/dashboard';
import Equipamento from '../screens/equipamento';
import Usuarios from '../screens/usuarios';
import Vinculos from '../screens/vinculo-user-equipamento';
import Splash from '../screens/splash';
import Historico from '../screens/historico-emprestimo';
import Alertas from '../screens/alertas';
import Configuracao from '../screens/configuracao';
import RecuperarSenha from '../screens/recuperar-senha';
import Sensores from '../screens/sensores';

const Stack = createNativeStackNavigator();

export default function Router() {
  const { usuario, isAdmin, loading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);
  const finishSplash = useCallback(() => setSplashFinished(true), []);
  if (!splashFinished) return <Splash onFinish={finishSplash} />;
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}><ActivityIndicator color="#ff1111" /></View>;
  return (
    <Stack.Navigator initialRouteName={Platform.OS === 'web' && window.location.pathname === '/redefinir-senha' ? 'RecuperarSenha' : undefined} screenOptions={{ headerShown: false }}>
      {usuario ? <Stack.Group navigationKey={isAdmin ? 'admin' : 'usuario'}>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Equipamento" component={Equipamento} />
        <Stack.Screen name="Historico" component={Historico} />
        <Stack.Screen name="Alertas" component={Alertas} />
        <Stack.Screen name="Configuracao" component={Configuracao} />
        {isAdmin && <Stack.Screen name="Usuarios" component={Usuarios} />}
        {isAdmin && <Stack.Screen name="Vinculos" component={Vinculos} />}
        {isAdmin && <Stack.Screen name="Sensores" component={Sensores} />}
      </Stack.Group> : <Stack.Screen name="Login" component={Login} />}
      <Stack.Screen navigationKey={usuario ? 'recuperar-logado' : 'recuperar-visitante'} name="RecuperarSenha" component={RecuperarSenha} />
    </Stack.Navigator>
  );
}
