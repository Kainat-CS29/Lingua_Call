import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  RenderModeType,
} from 'react-native-agora';

// Replace with your Agora App ID (from console.agora.io)
const APP_ID = 'a6019f41b5a44fc4b84b0744d1a5e790';
const CHANNEL_NAME = 'testChannel';

const App = () => {
  const [engine, setEngine] = useState<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Agora Engine
  useEffect(() => {
    const initAgora = async () => {
      try {
        // 1. Request permissions (Android)
        if (Platform.OS === 'android') {
          await requestPermissions();
        }

        // 2. Create and initialize engine
        const rtcEngine = createAgoraRtcEngine();
        rtcEngine.initialize({ appId: APP_ID });

        // 3. Enable video and audio
        rtcEngine.enableVideo();
        rtcEngine.enableAudio();
        rtcEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        rtcEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        // 4. Set up event handlers
        rtcEngine.registerEventHandler({
          onJoinChannelSuccess: (connection, uid) => {
            console.log('Joined channel:', uid);
            setJoined(true);
            setLocalUid(uid);
            Alert.alert('Success', `Joined as UID: ${uid}`);
          },
          onUserJoined: (_, uid) => {
            console.log('Remote user joined:', uid);
            setRemoteUid(uid);
          },
          onUserOffline: (_, uid) => {
            console.log('Remote user left:', uid);
            setRemoteUid(null);
          },
          onError: (err) => {
            console.error('Agora error:', err);
            Alert.alert('Error', `Code: ${err}`);
          },
        });

        setEngine(rtcEngine);
      } catch (err) {
        console.error('Initialization failed:', err);
      }
    };

    initAgora();

    // Cleanup
    return () => {
      engine?.leaveChannel();
      engine?.release();
    };
  }, []);

  // Android permission helper
  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
      return (
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  // Join channel with random UID
  const joinChannel = async () => {
    if (!engine) return;

    try {
      const uid = Math.floor(Math.random() * 100000);
      await engine.startPreview();
      await engine.joinChannel(
        "", // Token (set to null for testing)
        CHANNEL_NAME,
        uid,
        {} // Optional options
      );
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  // Leave channel
  const leaveChannel = () => {
    engine?.leaveChannel();
    setJoined(false);
    setRemoteUid(null);
  };

  // Toggle microphone
  const toggleMute = () => {
    if (!engine) return;
    engine.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  // Switch camera
  const switchCamera = () => {
    engine?.switchCamera();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Agora Video Call</Text>

      {/* Video Streams */}
      <View style={styles.videoContainer}>
        {/* Local Video */}
        {joined && (
          <View style={styles.videoBox}>
            <RtcSurfaceView
              canvas={{ uid: 0, renderMode: RenderModeType.RenderModeFit }}
              style={styles.video}
            />
            <Text style={styles.uidText}>You (UID: {localUid})</Text>
          </View>
        )}

        {/* Remote Video */}
        {remoteUid ? (
          <View style={styles.videoBox}>
            <RtcSurfaceView
              canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeFit }}
              style={styles.video}
            />
            <Text style={styles.uidText}>Remote (UID: {remoteUid})</Text>
          </View>
        ) : (
          <View style={[styles.videoBox, styles.placeholder]}>
            <Text style={styles.uidText}>Waiting for others...</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!joined ? (
          <Button title="Join Call" onPress={joinChannel} />
        ) : (
          <>
            <Button title={isMuted ? "Unmute" : "Mute"} onPress={toggleMute} />
            <Button title="Switch Camera" onPress={switchCamera} />
            <Button title="Leave Call" onPress={leaveChannel} color="red" />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  videoContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  videoBox: {
    width: '45%',
    aspectRatio: 9/16,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uidText: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 10,
  },
});

export default App;