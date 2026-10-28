import { TestBed } from '@angular/core/testing';
import { AttendanceService, isValidUuid } from './attendance.service';

describe('AttendanceService - Unit & Security Tests', () => {
  let service: AttendanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttendanceService]
    });
    service = TestBed.inject(AttendanceService);
  });

  describe('UUID Format Validator', () => {
    it('should validate standard RFC UUIDs', () => {
      expect(isValidUuid('c9885105-cafb-4c0c-8de9-0b5e2d85b3bb')).toBe(true);
      expect(isValidUuid('43765f87-1c61-42aa-b7c8-f41accec54cd')).toBe(true);
    });

    it('should reject non-UUID strings to prevent PostgreSQL 22P02 errors', () => {
      expect(isValidUuid('qr-station-factory-1')).toBe(false);
      expect(isValidUuid('att-1234567')).toBe(false);
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
      expect(isValidUuid('')).toBe(false);
    });
  });

  describe('Haversine Geo-Fencing (Test 3 & Test 7)', () => {
    const factoryLat = 30.0444;
    const factoryLng = 31.2357;

    it('should calculate close distance correctly within factory perimeter', () => {
      // 15 meters away
      const dist = service.getDistanceInMeters(factoryLat, factoryLng, factoryLat + 0.0001, factoryLng + 0.0001);
      expect(dist).toBeLessThan(100);
      expect(dist).toBeLessThanOrEqual(500);
    });

    it('should detect when coordinates are outside the 500m boundary', () => {
      // Cairo outskirts (~5500 meters away)
      const outsideLat = factoryLat + 0.05;
      const outsideLng = factoryLng + 0.05;
      const dist = service.getDistanceInMeters(factoryLat, factoryLng, outsideLat, outsideLng);
      expect(dist).toBeGreaterThan(500);
    });
  });

  describe('QR Token Validation (Test 4 & Test 5)', () => {
    it('should validate a fresh official QR payload', () => {
      const freshToken = JSON.stringify({
        hr_id: 'c9885105-cafb-4c0c-8de9-0b5e2d85b3bb',
        timestamp: Date.now(),
        type: 'hr_qr'
      });
      const result = service.validateQrPayload(freshToken);
      expect(result.valid).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should reject an expired QR token older than 40 seconds (Test 4)', () => {
      const expiredToken = JSON.stringify({
        hr_id: 'c9885105-cafb-4c0c-8de9-0b5e2d85b3bb',
        timestamp: Date.now() - 45000, // 45 seconds old
        type: 'hr_qr'
      });
      const result = service.validateQrPayload(expiredToken);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('منتهي الصلاحية');
    });

    it('should reject malformed or non-SPER QR codes', () => {
      const invalidJson = 'not a json';
      expect(service.validateQrPayload(invalidJson).valid).toBe(false);

      const fakeCode = JSON.stringify({ type: 'other_type', timestamp: Date.now() });
      expect(service.validateQrPayload(fakeCode).valid).toBe(false);
    });
  });

  describe('Initial State & Sync', () => {
    it('should load initial users and default attendance dataset', () => {
      expect(service.usersList().length).toBeGreaterThan(0);
      expect(service.attendanceList().length).toBeGreaterThan(0);
    });
  });
});
