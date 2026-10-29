import * as THREE from 'three';

// Procedural placeholder models. Each returns a Group whose origin sits at
// ground level (y=0), facing +Z — same convention expected of uploaded GLBs.

function mat(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
}

function box(w: number, h: number, d: number, color: string, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function car(bodyColor: string, roofColor: string, opts?: { long?: boolean; lightbar?: boolean }): THREE.Group {
  const g = new THREE.Group();
  const len = opts?.long ? 5.6 : 4.2;
  g.add(box(1.9, 0.55, len, bodyColor, 0.5));
  g.add(box(1.6, 0.5, len * 0.45, roofColor, 1.0));
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12);
  const wheelMat = mat('#1a1a1a');
  const zOff = len / 2 - 0.8;
  for (const [wx, wz] of [[-0.95, zOff], [0.95, zOff], [-0.95, -zOff], [0.95, -zOff]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.32, wz);
    g.add(w);
  }
  // headlights
  const hl = box(1.5, 0.15, 0.1, '#ffe9a0', 0.55);
  hl.position.z = len / 2;
  g.add(hl);
  if (opts?.lightbar) {
    const bar = box(1.0, 0.18, 0.4, '#ff3333', 1.35);
    g.add(bar);
    const blue = box(0.45, 0.2, 0.42, '#3355ff', 1.35);
    blue.position.x = -0.27;
    g.add(blue);
  }
  return g;
}

function truck(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(2.2, 1.4, 2.0, '#b04030', 1.0)); // cab
  const cab = g.children[g.children.length - 1];
  cab.position.z = 2.0;
  g.add(box(2.3, 2.2, 4.0, '#d8d4cc', 1.3)); // box
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  const wheelMat = mat('#1a1a1a');
  for (const [wx, wz] of [[-1.1, 2.0], [1.1, 2.0], [-1.1, -1.5], [1.1, -1.5], [-1.1, -0.3], [1.1, -0.3]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.42, wz);
    g.add(w);
  }
  return g;
}

function humanoid(shirt: string, pants: string, skin = '#d9a07a'): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.5, 0.65, 0.3, shirt, 1.05)); // torso
  g.add(box(0.45, 0.6, 0.28, pants, 0.45)); // legs
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), mat(skin));
  head.position.y = 1.55;
  head.castShadow = true;
  g.add(head);
  const armL = box(0.13, 0.55, 0.13, shirt, 1.05);
  armL.position.x = 0.33;
  g.add(armL);
  const armR = box(0.13, 0.55, 0.13, shirt, 1.05);
  armR.position.x = -0.33;
  g.add(armR);
  return g;
}

function barrel(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 14), mat('#c23a26'));
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.18, 14), mat('#e8d44a'));
  stripe.position.y = 0.55;
  g.add(stripe);
  return g;
}

function tree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6, 8), mat('#6b4a2e'));
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), mat('#2e6b34'));
  crown.position.y = 2.3;
  crown.castShadow = true;
  g.add(crown);
  return g;
}

function streetlight(): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 8), mat('#444a50'));
  pole.position.y = 2.25;
  pole.castShadow = true;
  g.add(pole);
  const head = box(0.35, 0.9, 0.35, '#2a2a2e', 4.0);
  g.add(head);
  for (const [y, c] of [[4.3, '#ff4444'], [4.0, '#ffcc33'], [3.7, '#44cc44']] as [number, string][]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 }));
    lamp.position.set(0, y, 0.19);
    g.add(lamp);
  }
  return g;
}

function pistol(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.12, 0.14, 0.5, '#2a2a30', 0.35));
  const grip = box(0.12, 0.3, 0.14, '#4a3a2a', 0.18);
  grip.position.z = -0.15;
  g.add(grip);
  return g;
}

export function createBuiltinModel(key: string): THREE.Group {
  switch (key) {
    case 'sedan': return car('#3b6bd6', '#2a4a9a');
    case 'police': return car('#e8e8ee', '#1a1a22', { lightbar: true });
    case 'truck': return truck();
    case 'player': return humanoid('#d6553b', '#2a3a55');
    case 'pedestrian': return humanoid('#7a8a5a', '#444');
    case 'barrel': return barrel();
    case 'tree': return tree();
    case 'streetlight': return streetlight();
    case 'pistol': return pistol();
    default: {
      const g = new THREE.Group();
      g.add(box(1, 1, 1, '#ff00ff', 0.5)); // missing-model marker
      return g;
    }
  }
}
