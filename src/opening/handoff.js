import * as THREE from "three";
import { armTo } from "../bots/BotMotion.js";
// Held at the lower edge, clear of the torso. This overlay uses existing rigid arm IK.
export class BriefHandoff {
  constructor(bots, prop) {
    this.bots = bots;
    this.prop = prop;
    this.owner = null;
    this.side = null;
    this.reach = new Map();
  }
  carryPoint(id, side) {
    const b = this.bots[id];
    return b.root.localToWorld(
      new THREE.Vector3(
        (side === "right" ? 1 : -1) * (b.config.torso.width / 2 + 0.2),
        b.config.hipHeight + 0.35,
        b.config.torso.depth / 2 + 0.27,
      ),
    );
  }
  attach(id, side) {
    this.owner = id;
    this.side = side;
    this.bots[id].rig.arms[side].socket.add(this.prop);
    this.prop.visible = true;
    if (id === "nour") this.bots.nour.rig.tool.visible = false;
  }
  update() {
    for (const [id, pose] of this.reach) {
      const b = this.bots[id];
      armTo(b.rig, b.rig.arms[pose.side], pose.target);
    }
    if (!this.owner) return;
    this.bots.nour.rig.tool.visible =
      this.owner !== "nour" && !this.reach.has("nour");
    const b = this.bots[this.owner],
      arm = b.rig.arms[this.side];
    if (!this.reach.has(this.owner))
      armTo(b.rig, arm, this.carryPoint(this.owner, this.side));
    b.root.updateMatrixWorld(true);
    const p = arm.hand
      .getWorldPosition(new THREE.Vector3())
      .add(new THREE.Vector3(0, 0.3, 0.08));
    this.prop.position.copy(this.prop.parent.worldToLocal(p));
    this.prop.quaternion.copy(
      this.prop.parent.getWorldQuaternion(new THREE.Quaternion()).invert(),
    );
  }
  clear(scene) {
    scene.attach(this.prop);
    this.prop.visible = false;
    this.owner = null;
    this.side = null;
    this.reach.clear();
    this.bots.nour.rig.tool.visible = true;
  }
}
