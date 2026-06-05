import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MachineDetailScreen from '../screens/MachineDetailScreen';
import TransactionScreen from '../screens/TransactionScreen';
import ManagementDashboardScreen from '../screens/ManagementDashboardScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a237e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MachineDetail"
        component={MachineDetailScreen}
        options={({ route }) => ({
          title: route.params?.machine?.machineCode || 'Machine Detail',
        })}
      />
      <Stack.Screen
        name="Management"
        component={ManagementDashboardScreen}
        options={{ title: 'Management' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Machines:    focused ? 'hardware-chip'       : 'hardware-chip-outline',
              Transaction: focused ? 'cash'                : 'cash-outline',
              Management:  focused ? 'shield-checkmark'   : 'shield-checkmark-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor:   '#1a237e',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: { height: 60, paddingBottom: 8 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Machines"    component={HomeStack} />
        <Tab.Screen name="Transaction" component={TransactionScreen} />
        <Tab.Screen name="Management"  component={ManagementDashboardScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
