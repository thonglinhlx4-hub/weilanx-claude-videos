// scratch: dump the ep58 SFX event list to JSON for the audio synth (run: SFXOUT=path npx vitest run tests/episodes/zz-ep58-dump.test.ts)
import {it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {SFX} from '../../src/episodes/ep58-rice/sfx58';
import {FRAMES} from '../../src/episodes/ep58-rice/timing';
it('dump sfx', () => { if (process.env.SFXOUT) writeFileSync(process.env.SFXOUT, JSON.stringify({frames: FRAMES, sfx: SFX})); });
