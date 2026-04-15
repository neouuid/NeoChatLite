import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, COLORS } from '@neochat/shared';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { MainChatScreen } from '../screens/MainChatScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ViewProfileScreen } from '../screens/ViewProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ThemeScreen } from '../screens/ThemeScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ChatSettingsScreen } from '../screens/ChatSettingsScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ForwardScreen } from '../screens/ForwardScreen';
import { AccountSecurityScreen } from '../screens/AccountSecurityScreen';
import { GroupInfoScreen } from '../screens/GroupInfoScreen';
import { GroupMembersScreen } from '../screens/GroupMembersScreen';
import { AddGroupMembersScreen } from '../screens/AddGroupMembersScreen';
import { ChatBackgroundScreen } from '../screens/ChatBackgroundScreen';
import { ChatBackupScreen } from '../screens/ChatBackupScreen';
import { DataClearScreen } from '../screens/DataClearScreen';
import { ImageViewerScreen } from '../screens/ImageViewerScreen';
import { FileViewerScreen } from '../screens/FileViewerScreen';
import { VideoCallScreen } from '../screens/VideoCallScreen';
import { VoiceCallScreen } from '../screens/VoiceCallScreen';

// Type imports
import type { RootStackParamList } from '@neochat/shared';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          backgroundColor: COLORS.dark.surface,
          borderTopColor: COLORS.dark.border,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.dark.text.secondary,
      }}
    >
      <Tab.Screen
        name="MainChat"
        component={MainChatScreen}
        options={{
          tabBarLabel: '消息',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarLabel: '联系人',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: COLORS.dark.surface,
              },
              headerTintColor: COLORS.dark.text.primary,
              headerTitleStyle: {
                color: COLORS.dark.text.primary,
              },
            }}
          />
          <Stack.Screen
            name="ViewProfile"
            component={ViewProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Theme"
            component={ThemeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatSettings"
            component={ChatSettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Forward"
            component={ForwardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AccountSecurity"
            component={AccountSecurityScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupInfo"
            component={GroupInfoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupMembers"
            component={GroupMembersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddGroupMembers"
            component={AddGroupMembersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatBackground"
            component={ChatBackgroundScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatBackup"
            component={ChatBackupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DataClear"
            component={DataClearScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ImageViewer"
            component={ImageViewerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FileViewer"
            component={FileViewerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="VoiceCall"
            component={VoiceCallScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
