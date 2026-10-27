// scratch: dump the ep57 SFX event list to JSON for the audio synth (run: SFXOUT=path npx vitest run tests/episodes/zz-ep57-dump.test.ts)
import {it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {SFX} from '../../src/episodes/ep57-monty/sfx57';
import {FRAMES} from '../../src/episodes/ep57-monty/timing';
it('dump sfx', () => { if (process.env.SFXOUT) writeFileSync(process.env.SFXOUT, JSON.stringify({frames: FRAMES, sfx: SFX})); });
