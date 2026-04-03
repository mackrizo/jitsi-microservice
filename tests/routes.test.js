const request = require('supertest');
const app = require('../src/server');

describe('Health Check', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('jitsi-microservice');
  });
});

describe('Jitsi Routes', () => {
  it('GET /api/jitsi/config returns current config', async () => {
    const res = await request(app).get('/api/jitsi/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('mode');
    expect(res.body.data).toHaveProperty('baseUrl');
  });

  it('POST /api/jitsi/room creates a room (no API_KEY set = open mode)', async () => {
    const res = await request(app)
      .post('/api/jitsi/room')
      .send({ roomName: 'unit-test-room', user: { name: 'TestUser' } });
    expect(res.status).toBe(201);
    expect(res.body.data.roomUrl).toContain('unit-test-room');
  });

  it('GET /api/jitsi/room/:roomId returns room info', async () => {
    const res = await request(app).get('/api/jitsi/room/my-test-room');
    expect(res.status).toBe(200);
    expect(res.body.data.roomId).toBe('my-test-room');
  });
});
