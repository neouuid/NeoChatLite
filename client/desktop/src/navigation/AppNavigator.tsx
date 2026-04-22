import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, COLORS } from '@neochat/shared';

import { LoginWindow } from '../screens/LoginWindow';
import { RegisterWindow } from '../screens/RegisterWindow';
import { ForgotPasswordWindow } from '../screens/ForgotPasswordWindow';
import { MainWindow } from '../screens/MainWindow';
import { ViewProfileWindow } from '../screens/ViewProfileWindow';
import { SettingsWindow } from '../screens/SettingsWindow';
import { ThemeWindow } from '../screens/ThemeWindow';
import { AboutWindow } from '../screens/AboutWindow';
import { NotificationSettingsWindow } from '../screens/NotificationSettingsWindow';
import { ChatSettingsWindow } from '../screens/ChatSettingsWindow';
import { CreateGroupWindow } from '../screens/CreateGroupWindow';
import { FavoritesWindow } from '../screens/FavoritesWindow';
import { SearchWindow } from '../screens/SearchWindow';
import { ForwardWindow } from '../screens/ForwardWindow';
import { AccountSecurityWindow } from '../screens/AccountSecurityWindow';
import { GroupInfoWindow } from '../screens/GroupInfoWindow';
import { GroupMembersWindow } from '../screens/GroupMembersWindow';
import { AddGroupMembersWindow } from '../screens/AddGroupMembersWindow';
import { ChatBackgroundWindow } from '../screens/ChatBackgroundWindow';
import { ChatBackupWindow } from '../screens/ChatBackupWindow';
import { DataClearWindow } from '../screens/DataClearWindow';
import { ImageViewerWindow } from '../screens/ImageViewerWindow';
import { FileViewerWindow } from '../screens/FileViewerWindow';
import { VideoCallWindow } from '../screens/VideoCallWindow';
import { VoiceCallWindow } from '../screens/VoiceCallWindow';
import { EditProfileWindow } from '../screens/EditProfileWindow';
import { MentionsWindow } from '../screens/MentionsWindow';
import { ProfileWindow } from '../screens/ProfileWindow';
import { ContactsWindow } from '../screens/ContactsWindow';

// Type imports
import type { RootStackParamList } from '@neochat/shared';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
          <Stack.Screen name="Login" component={LoginWindow} />
          <Stack.Screen name="Register" component={RegisterWindow} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordWindow} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainWindow} />
          <Stack.Screen
            name="ViewProfile"
            component={ViewProfileWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Theme"
            component={ThemeWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="About"
            component={AboutWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatSettings"
            component={ChatSettingsWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Search"
            component={SearchWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Forward"
            component={ForwardWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AccountSecurity"
            component={AccountSecurityWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupInfo"
            component={GroupInfoWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GroupMembers"
            component={GroupMembersWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddGroupMembers"
            component={AddGroupMembersWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatBackground"
            component={ChatBackgroundWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatBackup"
            component={ChatBackupWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DataClear"
            component={DataClearWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ImageViewer"
            component={ImageViewerWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FileViewer"
            component={FileViewerWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallWindow}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="VoiceCall"
            component={VoiceCallWindow}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Help"
            component={AboutWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Mentions"
            component={MentionsWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileWindow}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Contacts"
            component={ContactsWindow}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
