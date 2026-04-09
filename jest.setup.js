/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: () => ({ id: 'back', name: 'back' }),
  useCameraPermission: () => ({
    hasPermission: true,
    requestPermission: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn().mockResolvedValue(''),
  },
}));
