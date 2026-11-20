import { jest } from '@jest/globals';

jest.mock('@/lib/analytics', () => ({
  track: jest.fn(),
  isAnalyticsOn: jest.fn(() => true),
  setAnalyticsOn: jest.fn(async () => {}),
}));
