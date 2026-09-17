import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../components/auth';
import Login from '../screens/login';
import Dashboard from '../screens/dashboard';
import Equipamento from '../screens/equipamento';
import Usuarios from '../screens/usuarios';
import Vinculos from '../screens/vinculo-user-equipamento';
import Splash from '../screens/splash';

const Stack = createNativeStackNavigator();

export default function Router() {
  const { usuario, isAdmin, loading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);
  const finishSplash = useCallback(() => setSplashFinished(true), []);
  if (!splashFinished) return <Splash onFinish={finishSplash} />;
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}><ActivityIndicator color="#ff1111" /></View>;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario ? <Stack.Group navigationKey={isAdmin ? 'admin' : 'usuario'}>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Equipamento" component={Equipamento} />
        {isAdmin && <Stack.Screen name="Usuarios" component={Usuarios} />}
        {isAdmin && <Stack.Screen name="Vinculos" component={Vinculos} />}
      </Stack.Group> : <Stack.Screen name="Login" component={Login} />}
    </Stack.Navigator>
  );
}
