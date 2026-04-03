const jitsiService = require('../src/services/jitsi.service');

describe('JitsiService', () => {
  afterEach(() => {
    // Reset to default after each test
    jitsiService.switchMode('public');
  });

  describe('getConfig()', () => {
    it('returns public config by default', () => {
      const config = jitsiService.getConfig();
      expect(config.mode).toBe('public');
      expect(config.requiresJwt).toBe(false);
      expect(config.baseUrl).toContain('meet.jit.si');
    });

    it('returns private config after switch', () => {
      process.env.JITSI_PRIVATE_URL = 'https://jitsi.test.com';
      jitsiService.switchMode('private');
      const config = jitsiService.getConfig();
      expect(config.mode).toBe('private');
      expect(config.requiresJwt).toBe(true);
    });
  });

  describe('switchMode()', () => {
    it('throws for invalid mode', () => {
      expect(() => jitsiService.switchMode('invalid')).toThrow();
    });

    it('switches to private', () => {
      jitsiService.switchMode('private');
      expect(jitsiService.mode).toBe('private');
    });
  });

  describe('createRoom()', () => {
    it('creates public room without JWT', () => {
      const room = jitsiService.createRoom({ roomName: 'test-room' });
      expect(room.roomUrl).toContain('meet.jit.si');
      expect(room.jwt).toBeUndefined();
    });

    it('sanitizes room names', () => {
      const room = jitsiService.createRoom({ roomName: 'My Room With Spaces!' });
      expect(room.roomName).toMatch(/^[a-z0-9-_]+$/);
    });

    it('auto-generates room name if not provided', () => {
      const room = jitsiService.createRoom();
      expect(room.roomName).toMatch(/^visiodoc-/);
    });
  });
});
