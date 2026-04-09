import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {
  Camera,
  type PhotoFile,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import type { CameraScreenProps } from '../navigation/types';

function fileUri(path: string): string {
  if (path.startsWith('file://')) {
    return path;
  }
  return Platform.OS === 'android' ? `file://${path}` : path;
}

export function CameraScreen({ navigation, route }: CameraScreenProps) {
  const { productType, category } = route.params;
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const [captured, setCaptured] = useState<PhotoFile | null>(null);
  const [taking, setTaking] = useState(false);

  const onRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || taking) {
      return;
    }
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      setCaptured(photo);
    } finally {
      setTaking(false);
    }
  }, [taking]);

  const retake = useCallback(() => {
    setCaptured(null);
  }, []);

  const usePhoto = useCallback(() => {
    if (!captured?.path) {
      return;
    }
    navigation.navigate('QuickResults', { photoPath: captured.path, productType, category });
  }, [captured, navigation, productType]);

  if (!hasPermission) {
    return (
      <View style={styles.permissionWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.permissionText}>
          Camera access is needed to scan ingredient lists.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onRequestPermission}>
          <Text style={styles.secondaryButtonText}>Allow camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.permissionText}>No camera found on this device.</Text>
      </View>
    );
  }

  if (captured?.path) {
    return (
      <View style={styles.previewWrap}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Image
          source={{ uri: fileUri(captured.path) }}
          style={styles.previewImage}
          resizeMode="contain"
        />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.outlineButton} onPress={retake}>
            <Text style={styles.outlineButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primarySmall} onPress={usePhoto}>
            <Text style={styles.primarySmallText}>Use this photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
        enableZoomGesture
      />
      <View style={styles.cameraOverlay}>
        <Text style={styles.hint}>Align the ingredient list in frame</Text>
        <TouchableOpacity
          style={styles.shutter}
          onPress={takePicture}
          disabled={taking}
          activeOpacity={0.9}>
          {taking ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  hint: {
    color: '#f9fafb',
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#e5e7eb',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#111827',
  },
  previewWrap: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    backgroundColor: '#000000',
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primarySmall: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  primarySmallText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
