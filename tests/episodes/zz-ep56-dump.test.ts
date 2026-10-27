// scratch: dump the ep56 SFX event list to JSON for the audio synth (run: SFXOUT=path npx vitest run tests/episodes/zz-ep56-dump.test.ts)
import {it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {SFX} from '../../src/episodes/ep56-hilbert/sfx56';
import {FRAMES} from '../../src/episodes/ep56-hilbert/timing';
it('dump sfx', () => { if (process.env.SFXOUT) writeFileSync(process.env.SFXOUT, JSON.stringify({frames: FRAMES, sfx: SFX})); });
