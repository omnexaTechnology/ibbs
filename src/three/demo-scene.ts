import * as THREE from "three";
import { legacyIntensity } from "./light-compat";
import { BRAND } from "./materials";
import type { SceneFactory } from "./scene-types";

/** Small reference scene (desk, chair, plant, sofa) used by the e2e fixture page and as a template for real scenes. */
const demoScene: SceneFactory = (ctx) => {
  const { scene, camera, quality, invalidate } = ctx;
  const { K } = ctx.createKit();
  const { B, at } = K;
  scene.background = new THREE.Color(0xe6e1d7);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9ac98, legacyIntensity(0.75)));
  const sun = new THREE.DirectionalLight(0xfff0dc, legacyIntensity(1.6));
  sun.position.set(5, 8, 6);
  sun.castShadow = quality.shadows;
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: BRAND.cream, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(at(B.desk({ oak: true }), 0, 0, 0));
  scene.add(at(B.taskChair({}), 0, 0, 0.9, Math.PI));
  scene.add(at(B.plant({ h: 1.4 }), 1.6, 0, -0.4));
  scene.add(at(B.sofa({ n: 2 }), -2, 0, 0.5, Math.PI / 2));

  camera.position.set(3.4, 2.4, 4.2);
  camera.lookAt(0, 0.6, 0);

  let angle = 0;
  return {
    frame(dt) {
      if (ctx.reducedMotion) return;
      angle += dt * 0.25;
      camera.position.set(Math.sin(angle) * 5, 2.4, Math.cos(angle) * 5);
      camera.lookAt(0, 0.6, 0);
    },
    resize: invalidate,
  };
};

export default demoScene;
