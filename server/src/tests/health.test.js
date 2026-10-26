import request from 'supertest';
import app from '../app.js';

describe('Server Health and Basic Middlewares', () => {
  it('GET /api/health should return operational status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.environment).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/non-existent-route should return 404', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });

  it('Reject request with forbidden Mongo operator key in query', async () => {
    const res = await request(app).get('/api/health?$gt=test');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN_KEY_PATTERN');
  });
});
