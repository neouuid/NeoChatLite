import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Conversation, useChatStore } from '@neochat/shared';

import { Sidebar } from '../components/Sidebar';
import { ChatListPanel } from '../components/ChatListPanel';
import { ChatPanel } from '../components/ChatPanel';
import { ContactsPanel } from '../components/ContactsPanel';
import { ProfilePanel } from '../components/ProfilePanel';
import { FavoritesPanel } from '../components/FavoritesPanel';

type ActivePanel = 'chat' | 'contacts' | 'favorites' | 'profile';

export const MainWindow: React.FC = () => {
  const { currentConversation } = useChatStore();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | undefined>();
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [showProfile, setShowProfile] = useState(false);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handlePanelChange = (panel: ActivePanel) => {
    setActivePanel(panel);
  };

  const handleAvatarPress = () => {
    setShowProfile(!showProfile);
  };

  return (
    <View style={styles.container}>
      {/* 左侧图标栏 */}
      <Sidebar
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        onAvatarPress={handleAvatarPress}
      />

      {/* 个人资料面板 - 在侧边栏之上显示 */}
      {showProfile && (
        <View style={styles.profileOverlay}>
          <ProfilePanel onClose={() => setShowProfile(false)} />
        </View>
      )}

      {/* 中间面板 */}
      {!showProfile && activePanel === 'chat' && (
        <ChatListPanel
          selectedConversationId={selectedConversation?.id || currentConversation?.id}
          onSelectConversation={handleSelectConversation}
        />
      )}
      {!showProfile && activePanel === 'contacts' && <ContactsPanel />}
      {!showProfile && activePanel === 'favorites' && <FavoritesPanel />}

      {/* 右侧聊天区域 - 仅在聊天面板时显示且不显示个人资料 */}
      {!showProfile && activePanel === 'chat' && (
        <ChatPanel conversation={selectedConversation || currentConversation} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#131324',
  },
  placeholderPanel: {
    width: 320,
    backgroundColor: '#1a1a2e',
    borderRightWidth: 1,
    borderRightColor: '#2a2a4a',
  },
  profileOverlay: {
    position: 'absolute',
    left: 72, // 侧边栏宽度
    top: 0,
    bottom: 0,
    width: 320,
    zIndex: 100,
  },
});
