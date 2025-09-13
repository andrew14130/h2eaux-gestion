import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import screens - using require for dynamic loading
const ClientsScreen = require('../src/screens/ClientsScreen').default;
const ChantiersScreen = require('../src/screens/ChantiersScreen').default;
const DocumentsScreen = require('../src/screens/DocumentsScreen').default;
const ChatScreen = require('../src/screens/ChatScreen').default;
const ParametresScreen = require('../src/screens/ParametresScreen').default;
import { useAuthStore } from '../src/stores/authStore';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1a1a1a',
    card: '#2a2a2a',
    text: '#fff',
    border: '#444',
    primary: '#007AFF',
  },
};

export default function DashboardScreen() {
  const { user } = useAuthStore();

  const getTabBarIcon = (route: any, focused: boolean, color: string, size: number) => {
    let iconName: any;

    switch (route.name) {
      case 'Clients':
        iconName = focused ? 'people' : 'people-outline';
        break;
      case 'Chantiers':
        iconName = focused ? 'construct' : 'construct-outline';
        break;
      case 'Documents':
        iconName = focused ? 'document-text' : 'document-text-outline';
        break;
      case 'Chat':
        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        break;
      case 'Paramètres':
        iconName = focused ? 'settings' : 'settings-outline';
        break;
      default:
        iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <NavigationContainer theme={theme} independent={true}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => 
              getTabBarIcon(route, focused, color, size),
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#666',
            tabBarStyle: {
              backgroundColor: '#2a2a2a',
              borderTopColor: '#444',
              height: 90,
              paddingBottom: 8,
              paddingTop: 8,
            },
            headerStyle: {
              backgroundColor: '#2a2a2a',
              shadowColor: 'transparent',
              elevation: 0,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
          })}
        >
          {user?.permissions.clients && (
            <Tab.Screen 
              name="Clients" 
              component={ClientsScreen}
              options={{
                title: 'Clients',
                headerTitle: 'Gestion Clients',
              }}
            />
          )}
          
          {user?.permissions.chantiers && (
            <Tab.Screen 
              name="Chantiers" 
              component={ChantiersScreen}
              options={{
                title: 'Chantiers',
                headerTitle: 'Gestion Chantiers',
              }}
            />
          )}
          
          {user?.permissions.documents && (
            <Tab.Screen 
              name="Documents" 
              component={DocumentsScreen}
              options={{
                title: 'Documents',
                headerTitle: 'Mes Documents',
              }}
            />
          )}
          
          {user?.permissions.chat && (
            <Tab.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{
                title: 'Chat',
                headerTitle: 'Chat Équipe',
              }}
            />
          )}
          
          {user?.permissions.parametres && (
            <Tab.Screen 
              name="Paramètres" 
              component={ParametresScreen}
              options={{
                title: 'Paramètres',
                headerTitle: 'Paramètres',
              }}
            />
          )}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});