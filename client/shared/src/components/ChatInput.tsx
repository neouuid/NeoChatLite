// 聊天输入组件

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants';
import { User } from '../types';
import { detectMentionTrigger, insertMention } from '../utils';
import { MentionPicker } from './MentionPicker';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendImage?: () => void;
  onSendFile?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
  replyingTo?: { id: string; content: string; sender: string } | null;
  onCancelReply?: () => void;
  members?: User[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendImage,
  onSendFile,
  placeholder = '输入消息...',
  disabled = false,
  isSending = false,
  replyingTo,
  onCancelReply,
  members = [],
}) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const maxInputHeight = 120;
  const minInputHeight = 40;

  // 处理输入内容变化
  const handleContentSizeChange = useCallback((event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const newHeight = Math.min(Math.max(contentHeight, minInputHeight), maxInputHeight);
    setInputHeight(newHeight);
  }, []);

  // 处理输入框变化
  const handleChangeText = useCallback((newText: string) => {
    setText(newText);

    // 检测是否触发提及
    const trigger = detectMentionTrigger(newText, selection.end);
    if (trigger.trigger) {
      setShowMentionPicker(true);
      setMentionQuery(trigger.query);
    } else {
      setShowMentionPicker(false);
      setMentionQuery('');
    }
  }, [selection.end]);

  // 处理选择变化
  const handleSelectionChange = useCallback((event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });

    // 检测是否触发提及
    const trigger = detectMentionTrigger(text, end);
    if (trigger.trigger) {
      setShowMentionPicker(true);
      setMentionQuery(trigger.query);
    } else {
      setShowMentionPicker(false);
      setMentionQuery('');
    }
  }, [text]);

  // 处理选择提及用户
  const handleSelectMention = useCallback((user: User) => {
    const result = insertMention(text, selection.end, user);
    setText(result.newText);
    setShowMentionPicker(false);
    setMentionQuery('');

    // 设置光标位置
    setTimeout(() => {
      inputRef.current?.focus();
      setSelection({ start: result.newCursorPosition, end: result.newCursorPosition });
    }, 50);
  }, [text, selection.end]);

  // 处理发送消息
  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) return;

    onSendMessage(trimmedText);
    setText('');
    setInputHeight(minInputHeight);
    setShowMentionPicker(false);
    setMentionQuery('');
    inputRef.current?.clear();
  }, [text, isSending, onSendMessage]);

  const hasText = text.trim().length > 0;

  // 过滤出当前会话的成员（排除自己）
  const availableMembers = members;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 提及选择器 */}
      <MentionPicker
        members={availableMembers}
        query={mentionQuery}
        onSelect={handleSelectMention}
        onClose={() => setShowMentionPicker(false)}
        visible={showMentionPicker && availableMembers.length > 0}
      />

      <View style={styles.container}>
        {/* 回复提示 */}
        {replyingTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyLine} />
            <View style={styles.replyContent}>
              <View style={styles.replyHeader}>
                <Text style={styles.replySender}>回复 {replyingTo.sender}</Text>
                <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={18} color={COLORS.dark.text.secondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
          </View>
        )}

        {/* 输入区域 */}
        <View style={styles.inputContainer}>
          {/* 附件按钮 */}
          <View style={styles.leftActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSendFile}
              disabled={disabled || isSending}
            >
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={disabled ? COLORS.dark.text.tertiary : COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* 输入框 */}
          <View style={[styles.textInputContainer, { height: inputHeight }]}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={text}
              onChangeText={handleChangeText}
              onContentSizeChange={handleContentSizeChange}
              onSelectionChange={handleSelectionChange}
              placeholder={placeholder}
              placeholderTextColor={COLORS.dark.text.tertiary}
              multiline
              editable={!disabled && !isSending}
              textAlignVertical="center"
              selection={selection}
            />
          </View>

          {/* 右侧操作 */}
          <View style={styles.rightActions}>
            {/* 图片按钮 */}
            {!hasText && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onSendImage}
                disabled={disabled || isSending}
              >
                <Ionicons
                  name="image-outline"
                  size={28}
                  color={disabled ? COLORS.dark.text.tertiary : COLORS.primary}
                />
              </TouchableOpacity>
            )}

            {/* 发送按钮 */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!hasText || disabled || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!hasText || disabled || isSending}
            >
              {isSending ? (
                <Ionicons
                  name="hourglass-outline"
                  size={20}
                  color="#ffffff"
                />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color="#ffffff"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.dark.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.dark.border,
    paddingBottom: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  replyContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.dark.border,
  },
  replyLine: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  replySender: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  replyText: {
    color: COLORS.dark.text.secondary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.xs,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  textInputContainer: {
    flex: 1,
    marginHorizontal: SPACING.sm,
    backgroundColor: COLORS.dark.background,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    minHeight: 40,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    color: COLORS.dark.text.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.dark.text.tertiary,
  },
});
