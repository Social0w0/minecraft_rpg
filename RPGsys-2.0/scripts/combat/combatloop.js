import { world } from "@minecraft/server";
import { dealDamage } from "./damage.js";

world.afterEvents.entityHitEntity.subscribe(ev => {

    const attacker = ev.damagingEntity;
    const target = ev.hitEntity;

    if (!attacker || !target) return;
    if (attacker.typeId !== "minecraft:player") return;
    if (!attacker.hasTag("combat")) return;

    dealDamage(attacker, target);
});
