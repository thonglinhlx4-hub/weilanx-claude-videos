// ep55：geo55 + 确定性随机（rand 与 ep53 kit 同一实现）
export * from './geo55';
export const rand = (s: number) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
