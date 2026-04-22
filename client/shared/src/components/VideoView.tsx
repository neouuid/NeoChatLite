// 跨平台视频渲染组件

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

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
  const [RTCVideoView, setRTCVideoView] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 动态加载 react-native-webrtc
  useEffect(() => {
    let isMounted = true;
    const loadRTC = async () => {
      try {
        const webrtcModule = require('react-native-webrtc');
        if (webrtcModule && webrtcModule.RTCVideoView && isMounted) {
          setRTCVideoView(() => webrtcModule.RTCVideoView);
        }
      } catch (e) {
        console.log('react-native-webrtc not available, showing placeholder');
        if (isMounted) {
          setError('react-native-webrtc not configured');
        }
      }
    };
    loadRTC();
    return () => { isMounted = false; };
  }, []);

  if (!stream) {
    return <View style={style} />;
  }

  // 如果有 RTCVideoView，使用它
  if (RTCVideoView) {
    return (
      <RTCVideoView
        streamURL={stream.id}
        style={[style, styles.video]}
        objectFit={objectFit}
        mirror={mirror}
      />
    );
  }

  // 占位视图 - 显示加载状态或错误
  return (
    <View style={[style, styles.placeholder]}>
      <Text style={styles.placeholderText}>
        {error || 'Loading video...'}
      </Text>
    </View>
  );
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
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  placeholder: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8080a0',
    fontSize: 14,
  },
});

export default VideoView;
