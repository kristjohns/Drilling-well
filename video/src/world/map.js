// Stylised 3D map of Norway and the North Sea (1 unit = 1 km, Lambert conformal conic).
import * as THREE from 'three';

export async function createMap() {
  const data = await (await fetch('build/map.json')).json();
  const group = new THREE.Group();

  // sea plane with graticule + soft vignette
  const seaMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPulse: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      varying vec2 vP; uniform float uTime;
      float grid(vec2 p, float s, float w) { vec2 g = abs(fract(p / s - 0.5) - 0.5) * s; return 1.0 - smoothstep(0.0, w, min(g.x, g.y)); }
      void main() {
        float r = length(vP - vec2(0.0, -150.0));
        vec3 deep = vec3(0.012, 0.035, 0.07), mid = vec3(0.025, 0.075, 0.13);
        vec3 c = mix(mid, deep, smoothstep(300.0, 2600.0, r));
        c += vec3(0.05, 0.12, 0.2) * grid(vP, 200.0, 2.2) * 0.35;
        c += vec3(0.05, 0.12, 0.2) * grid(vP, 50.0, 1.0) * 0.08;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), seaMat);
  sea.rotation.x = -Math.PI / 2;
  group.add(sea);

  const norwayMat = new THREE.MeshStandardMaterial({ color: '#c9d2d6', roughness: 0.85, metalness: 0.0 });
  const otherMat = new THREE.MeshStandardMaterial({ color: '#3d4852', roughness: 0.9, metalness: 0.0 });
  const sideMat = new THREE.MeshStandardMaterial({ color: '#1e262d', roughness: 0.9 });
  const coastMat = new THREE.LineBasicMaterial({ color: new THREE.Color(1.0, 0.62, 0.2).multiplyScalar(2.2), toneMapped: true });
  for (const c of data.countries) {
    const isNo = c.name === 'Norway';
    for (const ring of c.polys) {
      const shape = new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ExtrudeGeometry(shape, { depth: isNo ? 9 : 5, bevelEnabled: false, curveSegments: 1 });
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, [isNo ? norwayMat : otherMat, sideMat]);
      m.receiveShadow = true; m.castShadow = true;
      group.add(m);
      if (isNo) {
        const pts = ring.map(([x, y]) => new THREE.Vector3(x, 9.4, -y));
        pts.push(pts[0].clone());
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), coastMat);
        group.add(line);
      }
    }
  }
  // shape y (north) maps to -z after rotateX(-90°); helper converts map km to world
  const P = ([x, y], h = 0) => new THREE.Vector3(x, h, -y);

  // field markers: beam + ring + dot
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(1.0, 0.7, 0.25) }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */`varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`varying float vY; uniform vec3 uColor; uniform float uAlpha; void main(){ gl_FragColor = vec4(uColor * 2.5 * pow(1.0 - vY, 2.0) * uAlpha, 1.0); }`,
  });
  const markers = {};
  for (const [name, xy] of Object.entries(data.fields)) {
    const m = new THREE.Group();
    const mat = beamMat.clone();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 160, 12, 1, true), mat);
    beam.position.y = 80;
    const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.75, 0.3).multiplyScalar(3) });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), dotMat);
    dot.position.y = 3;
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.7, 0.3).multiplyScalar(2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(9, 11, 48), ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 1.5;
    m.add(beam, dot, ring);
    m.position.copy(P(xy, 0));
    m.userData = { beam, dot, ring, mat, ringMat, dotMat };
    m.visible = false;
    group.add(m);
    markers[name] = m;
  }
  const cityDots = {};
  for (const [name, xy] of Object.entries(data.cities)) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.4) }));
    d.position.copy(P(xy, 10));
    d.visible = false;
    group.add(d);
    cityDots[name] = d;
  }

  return {
    group, data, markers, cityDots, P, seaMat,
    /** Reveal a marker with a pop animation; k in 0..1 (0 hidden). */
    setMarker(name, k, t = 0) {
      const m = markers[name];
      if (!m) return;
      m.visible = k > 0.001;
      const u = m.userData;
      const s = Math.min(1, k * 1.4);
      u.beam.scale.set(1, Math.max(0.001, s), 1);
      u.beam.position.y = 80 * s;
      u.mat.uniforms.uAlpha.value = k;
      u.dot.scale.setScalar(Math.max(0.001, s));
      const pr = (t * 0.6) % 1;
      u.ring.scale.setScalar(1 + pr * 2.5);
      u.ringMat.opacity = (1 - pr) * k;
    },
  };
}
