export const SKILL_DATA = {

  slash: {
    name: "베기",
    type: 0,
    power_p: 1.5,
    power_m: 0,
    mpCost: 5,
    cooldown: 40,
    animation: "animation.ironsword.slash3",
    sound: "beacon.power",
    velocity: "6.4",
    particle: "social:ironsword",

    target: {
      shape: "cone",    
      range: 4,
      angle: 50,         // cone 전용
      radius: 0          // circle 전용
    }
  },

  fireball: {
    name: "파이어볼",
    type: 1,
    power_p: 0,
    power_m: 2.0,
    mpCost: 10,
    cooldown: 80,
    animation: "animation.ironsword.slash2",
    sound: "fire.fire",
    velocity: "6.4",
    particle: "minecraft:lava_particle",

    target: {
      shape: "single",
      range: 6
    }
  }

};
