"""Assemble the film: concatenate shot segments, mux the mixed soundtrack and subtitles.

Usage: python3 -I tools/assemble.py <video_dir> [--only 1080p|720p] [--mib <1080p size budget, default 480>]
Writes out/drilling-rig-norway-1080p.mp4 and out/drilling-rig-norway-720p.mp4 plus chapters.txt.
"""
import glob
import json
import os
import re
import subprocess
import sys


def run(cmd):
    print(' '.join(cmd[:6]), '...', flush=True)
    subprocess.run(cmd, check=True)


def probe_frames(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries',
                          'stream=nb_read_packets', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    return int(out or 0)


def loudness(path):
    """Integrated loudness (LUFS) of an audio file, from ffmpeg's EBU R128 meter."""
    err = subprocess.run(['ffmpeg', '-nostats', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])


def main():
    vdir = sys.argv[1]
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    want = lambda k: only in (None, k)
    mib = float(sys.argv[sys.argv.index('--mib') + 1]) if '--mib' in sys.argv else 480
    tl = json.load(open(os.path.join(vdir, 'build', 'timeline.json')))
    seg = os.path.join(vdir, 'out', 'segments')
    out = os.path.join(vdir, 'out')
    missing = [s['id'] for s in tl['shots'] if not os.path.exists(os.path.join(seg, s['id'] + '.mp4'))]
    if missing:
        sys.exit(f'missing segments: {missing}')
    bad = [(s['id'], probe_frames(os.path.join(seg, s['id'] + '.mp4')), s['frames']) for s in tl['shots']]
    bad = [b for b in bad if b[1] != b[2]]
    if bad:
        sys.exit(f'frame count mismatch: {bad}')
    lst = os.path.join(out, 'concat.txt')
    with open(lst, 'w') as f:
        for s in tl['shots']:
            f.write(f"file '{os.path.join(seg, s['id'] + '.mp4')}'\n")
    video_only = os.path.join(out, 'video_only.mp4')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video_only])

    # chapter metadata (ffmetadata) for players that support chapters
    meta = os.path.join(out, 'chapters.ffmeta')
    chapters_txt = []
    with open(meta, 'w') as f:
        f.write(';FFMETADATA1\ntitle=The Drilling Rig — How Norway Drills for Oil and Gas\nartist=Generated with Claude Code\n')
        chaps = []
        for s in tl['shots']:
            if not chaps or chaps[-1][0] != s['chapter']:
                chaps.append([s['chapter'], s['start'], s['start'] + s['dur']])
            else:
                chaps[-1][2] = s['start'] + s['dur']
        names = {c['n']: c['title'] for c in tl['chapters']}
        for n, a, b in chaps:
            title = names.get(n) or 'Opening'
            f.write(f'\n[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(a * 1000)}\nEND={int(b * 1000)}\ntitle={title}\n')
            chapters_txt.append(f'{int(a // 60)}:{int(a % 60):02d}  {title}')
    open(os.path.join(out, 'chapters.txt'), 'w').write('\n'.join(chapters_txt) + '\n')

    mix = os.path.join(vdir, 'build', 'mix.wav')
    srt = os.path.join(vdir, 'build', 'subtitles.srt')
    # Bring the mix to -16 LUFS with one constant gain; a brick-wall limiter (delay-compensated, so sync holds)
    # catches the few transients that gain pushes over the top. Unlike loudnorm, this never rides the level.
    # The ceiling leaves room for AAC overshoot: the encoded file measures about -2.5 dBTP.
    gain = -16.0 - loudness(mix)
    print(f'audio gain {gain:+.1f} dB', flush=True)
    common_audio = ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=-3.3dB:attack=2:release=40:level=disabled:latency=1']
    mux = ['-i', video_only, '-i', mix, '-i', srt, '-f', 'ffmetadata', '-i', meta,
           '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map_metadata', '3', '-map_chapters', '3']
    tail = [*common_audio, '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-metadata:s:a:0', 'language=eng',
            '-movflags', '+faststart']
    made = []
    if want('1080p'):
        # Two-pass at the bitrate that lands the file near the size budget (upload limits). A light denoise
        # takes the edge off the synthetic film grain, which otherwise eats most of the bits.
        kbps = int((mib * 2**20 * 8 / tl['duration'] - 192_000 - 50_000) / 1000)
        video = ['-vf', 'hqdn3d=1.5:1.5:3:3', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{kbps}k', '-maxrate', '8M',
                 '-bufsize', '16M', '-tune', 'film', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1']
        log = os.path.join(out, 'x264-1080p')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video_only, '-an', '-sn', *video,
             '-pass', '1', '-passlogfile', log, '-f', 'null', os.devnull])
        final = os.path.join(out, 'drilling-rig-norway-1080p.mp4')
        run(['ffmpeg', '-y', '-loglevel', 'error', *mux, *video, '-pass', '2', '-passlogfile', log, *tail, final])
        for f in glob.glob(log + '*'):
            os.remove(f)
        made.append(final)
    if want('720p'):
        small = os.path.join(out, 'drilling-rig-norway-720p.mp4')
        run(['ffmpeg', '-y', '-loglevel', 'error', *mux, '-vf', 'scale=1280:720:flags=lanczos,hqdn3d=1.5:1.5:3:3',
             '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '4M', '-bufsize', '8M',
             '-pix_fmt', 'yuv420p', '-profile:v', 'high', *tail, small])
        made.append(small)
    # every frame must survive the encode (no -shortest: the subtitle track ends before the picture does)
    total = sum(s['frames'] for s in tl['shots'])
    for p in made:
        n = probe_frames(p)
        print(p, round(os.path.getsize(p) / 1e6, 1), 'MB,', n, 'frames', flush=True)
        if n != total:
            sys.exit(f'{p}: {n} video frames, expected {total}')


if __name__ == '__main__':
    main()
