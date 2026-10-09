import { beforeAll, afterAll } from "vitest";
import { store } from "@/lib/db/store";

beforeAll(() => {
  store.seedTestFixtures();
});

afterAll(() => {
  store.clearTestFixtures();
});
