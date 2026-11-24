# Automated Integration Tests (Vitest + Supertest)

The API verification suite is in `server/tests/api.test.js`. It exercises health, authentication input and response behavior, staff-role rejection, and admin-only user listing. The current suite uses a mocked Prisma client; database transaction and cross-module workflow tests remain to be added. See [the verification record](../docs/05-testing-and-issues.md) for results and coverage gaps.
