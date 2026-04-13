// Jest setup file for shared package
import '@testing-library/jest-native/extend-expect';

// Mock react-native
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    NativeModules: {},
    Platform: {
      OS: 'ios',
      select: jest.fn(),
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning:') &&
    args[0].includes('useLayoutEffect')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
