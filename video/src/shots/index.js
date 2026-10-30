// Shot registry. Each shot: { look?, build?(W), setup(W, info), update(W, t, info), oceanT0? }
import * as ch0 from './ch0.js';
import * as ch1 from './ch1.js';
import * as ch2 from './ch2.js';
import * as ch3 from './ch3.js';
import * as ch4 from './ch4.js';
import * as ch5 from './ch5.js';
import * as ch6 from './ch6.js';
import * as ch7 from './ch7.js';
import * as ch8 from './ch8.js';
import * as ch9 from './ch9.js';
import * as ch10 from './ch10.js';
import { rigOnOcean } from './common.js';
import { orbit } from '../engine/util.js';

const placeholder = (id) => ({
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('day', { amp: 0.9 });
    W.shadowBox([0, 30, 0], 90, 600);
  },
  update(W, t, info) {
    rigOnOcean(W, t);
    orbit(W.camera, [0, 30, 0], 260, 60, 0.4 + t * 0.03, 40);
    const line = info.lines.find((l) => t >= l.start && t < l.start + l.dur + 0.4);
    W.ov.html('cap', { x: 160, y: 900, cls: 'note', html: `[${id}] ${line ? line.text : ''}`, style: { width: '1600px', whiteSpace: 'normal', fontSize: '26px', textTransform: 'none' } }, t, 0, 1e9);
  },
});

const defined = { ...ch0, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9, ...ch10 };
const ids = ['open_storm', 'open_rig', 'title', 'map_intro', 'map_fields', 'map_stats', 'rigtypes', 'rig_orbit', 'rig_underwater', 'rig_deck', 'rig_station',
  'heli', 'crew', 'derrick_intro', 'hoist_system', 'heave', 'floor_intro', 'fingerboard', 'roughneck', 'offline', 'cabin', 'robot',
  'dive', 'bop', 'tophole', 'casing', 'mud_loop', 'mud_barrier', 'cuttings', 'bha', 'rss', 'mwd', 'geosteer', 'record',
  'barriers', 'kick', 'shutin', 'mpd', 'data', 'auto', 'battery', 'shore', 'wind', 'complete', 'future', 'end'];

export const SHOTS = {};
for (const id of ids) SHOTS[id] = defined[id] || placeholder(id);
