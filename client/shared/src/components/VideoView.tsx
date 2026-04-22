// 跨平台视频渲染组件

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// 环境检测
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

interface VideoViewProps {
  stream: MediaStream | null;
  style?: any;
  mirror?: boolean;
  objectFit?: 'cover' | 'contain';
}

// Web 版本视频组件
const WebVideoView: React.FC<VideoViewProps> = ({ stream, style, mirror, objectFit = 'cover' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true; // 本地视频静音
    }
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  if (!stream) {
    return <View style={style} />;
  }

  return (
    <video
      ref={videoRef}
      style={{
        ...styles.webVideo,
        ...style,
        transform: mirror ? 'scaleX(-1)' : undefined,
        objectFit,
      }}
      autoPlay
      playsInline
      muted
    />
  );
};

// React Native 版本视频组件
const NativeVideoView: React.FC<VideoViewProps> = ({ stream, style, mirror, objectFit }) => {
  // 这里需要集成 react-native-webrtc 的 RTCVideoView
  // 由于动态加载，我们先返回一个占位视图
  // 实际使用时需要确保 react-native-webrtc 已正确配置

  if (!stream) {
    return <View style={style} />;
  }

  // 占位视图 - 实际项目中需要替换为 RTCVideoView
  return <View style={[style, styles.placeholder]} />;
};

// 根据平台选择组件
export const VideoView: React.FC<VideoViewProps> = (props) => {
  if (isWeb) {
    return <WebVideoView {...props} />;
  }
  return <NativeVideoView {...props} />;
};

const styles = StyleSheet.create({
  webVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  placeholder: {
    backgroundColor: '#1a1a2e',
  },
});

export default VideoView;
