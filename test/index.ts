export * from '../src'
import { vi } from "vitest";

vi.stubGlobal('__DEV__', true);
vi.stubGlobal('window', {});