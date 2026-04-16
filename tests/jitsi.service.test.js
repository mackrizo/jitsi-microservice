'use strict';

const jitsiSvc = require('../src/services/jitsi.service');

beforeEach(() => {
  process.env.JITSI_PUBLIC_URL  = 'https://meet.jit.si';
  process.env.JITSI_PRIVATE_URL = 'https://jitsi.visiodoc.online';
  process.env.JITSI_APP_ID      = 'visiodoc';
  process.env.JITSI_APP_SECRET  = 'test-secret-hs256-32bytes-padding!';
  process.env.JITSI_JWT_TTL     = '3600';
  process.env.JAAS_APP_ID       = 'vpaas-magic-cookie-test';
  process.env.JAAS_API_KEY_ID   = 'default';
});

const mockUser = { name: 'Dr Martin', email: 'dr.martin@visiodoc.online' };

describe('Mode public', () => {
  beforeEach(() => { process.env.JITSI_MODE = 'public'; });

  test('createRoom retourne une URL meet.jit.si sans JWT', () => {
    const room = jitsiSvc.createRoom('test-room', mockUser, 'moderator');
    expect(room.roomUrl).toBe('https://meet.jit.si/test-room');
    expect(room.jwt).toBeUndefined();
    expect(room.requiresJwt).toBe(false);
    expect(room.mode).toBe('public');
  });

  test('getConfig retourne mode public', () => {
    const config = jitsiSvc.getConfig();
    expect(config.mode).toBe('public');
    expect(config.requiresJwt).toBe(false);
    expect(config.jwtAlgorithm).toBeNull();
  });

  test('createRoom sans roomName lance une erreur', () => {
    expect(() => jitsiSvc.createRoom('', mockUser)).toThrow('roomName');
  });
});

describe('Mode private', () => {
  beforeEach(() => { process.env.JITSI_MODE = 'private'; });

  test('createRoom retourne une URL Hetzner avec JWT HS256', () => {
    const room = jitsiSvc.createRoom('consult-123', mockUser, 'moderator');
    expect(room.roomUrl).toBe('https://jitsi.visiodoc.online/consult-123');
    expect(room.jwt).toBeDefined();
    expect(room.requiresJwt).toBe(true);
    expect(room.mode).toBe('private');
  });

  test('JWT HS256 contient les bonnes claims', () => {
    const jwt  = require('jsonwebtoken');
    const room = jitsiSvc.createRoom('consult-123', mockUser, 'moderator');
    const decoded = jwt.decode(room.jwt);
    expect(decoded.sub).toBe('jitsi.visiodoc.online');
    expect(decoded.room).toBe('consult-123');
    expect(decoded.context.user.moderator).toBe(true);
  });

  test('Lance une erreur si JITSI_PRIVATE_URL manquant', () => {
    delete process.env.JITSI_PRIVATE_URL;
    expect(() => jitsiSvc.createRoom('room', mockUser)).toThrow('JITSI_PRIVATE_URL');
  });
});

describe('Mode jaas', () => {
  beforeEach(() => {
    process.env.JITSI_MODE = 'jaas';
    delete process.env.JAAS_PRIVATE_KEY; // RS256 key pas dispo en test unitaire
  });

  test('Lance une erreur si JAAS_PRIVATE_KEY manquant', () => {
    expect(() => jitsiSvc.createRoom('room', mockUser)).toThrow('JAAS_PRIVATE_KEY');
  });

  test('getConfig retourne mode jaas avec RS256', () => {
    const config = jitsiSvc.getConfig();
    expect(config.mode).toBe('jaas');
    expect(config.requiresJwt).toBe(true);
    expect(config.jwtAlgorithm).toBe('RS256');
  });
});
