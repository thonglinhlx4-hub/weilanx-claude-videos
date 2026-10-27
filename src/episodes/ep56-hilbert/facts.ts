// ep56 上屏数字（纯模块，测试里逐条重算）
import {PRIMES} from './scene3';

export const PRIME_ROW = PRIMES.slice(0, 10).join('  ') + '  …';
/** 素数幂方法下保持空着的几间（示例，测试里断言它们不是任何 2^n、p_c^n） */
export const EMPTY_MARK = [6, 10, 12, 15];
export const ROOM_NUMS = (n: number) => Array.from({length: n}, (_, i) => i + 1);
