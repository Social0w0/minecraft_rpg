import { world, system } from "@minecraft/server";
import { MOB_DATA } from "./mob.js";
import { dealDamage } from "./damage.js";

function setScore(entity, objective, value) {
    let obj = world.scoreboard.getObjective(objective);
    if (!obj) {
        obj = world.scoreboard.addObjective(objective, objective);
    }
    try { obj.setScore(entity, value); } catch {}
}

function getScore(entity, objective) {
    const obj = world.scoreboard.getObjective(objective);
    if (!obj) return 0;
    try { return obj.getScore(entity); } catch { return 0; }
}


/* =========================
   스폰 시 자동 스탯 적용
========================= */

world.afterEvents.entitySpawn.subscribe(ev => {
    const entity = ev.entity;
    if (!entity) return;

    const data = MOB_DATA[entity.typeId];
    if (!data) return;

    if (entity.hasTag("rpg_init")) return;

    system.runTimeout(() => {
    entity.runCommand(`scoreboard players set @s hp ${data.hp}`);
    entity.runCommand(`scoreboard players set @s hpnow ${data.hp}`);
    entity.runCommand(`scoreboard players set @s atk ${data.atk}`);
    entity.runCommand(`scoreboard players set @s def ${data.def}`);
    entity.runCommand(`scoreboard players set @s exp_reward ${data.exp}`);

    entity.runCommand(`scoreboard players set @s crit_chance 0`);
    entity.runCommand(`scoreboard players set @s crit_damage 100`);


    entity.addTag("mob");
    entity.addTag("rpg_init");

    entity.nameTag = `§c[${data.grade.toUpperCase()}] §f${data.name}`;
    }, 1);

});


world.afterEvents.entityHitEntity.subscribe(ev => {

    const attacker = ev.damagingEntity;
    const target = ev.hitEntity;

    if (!attacker || !target) return;

    if (attacker.hasTag("mob") && target.typeId === "minecraft:player") {
        dealDamage(attacker, target, 0);
    }
});

world.beforeEvents.entityHurt.subscribe(ev => {

    const attacker = ev.damageSource.damagingEntity;
    const target = ev.hurtEntity;

    if (!attacker || !target) return;

    if (attacker.hasTag("mob") && target.typeId === "minecraft:player") {
        ev.cancel = false;
    }

});



function makeHpBar(current, max, size = 10) {
    const ratio = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(ratio * size);
    const empty = size - filled;

    const bar = "§c" + "■".repeat(filled) + "§7" + "□".repeat(empty);
    return `${bar} ㅣ §f${current}§7/§f${max}`;
}

function updateMobNameTag(entity) {

    if (!entity.hasTag("mob")) return;
    if (!entity.isValid) return;

    const hp = getScore(entity, "hp");
    const hpnow = getScore(entity, "hpnow");

    const data = MOB_DATA[entity.typeId];
    if (!data) return;

    const bar = makeHpBar(hpnow, hp);

    entity.nameTag =
    `§c[${data.grade.toUpperCase()}] §f${data.name} \n${bar}`;
}


function handleDeath(entity) {
    const hp = getScore(entity, "hp");
    let hpnow = getScore(entity, "hpnow");

    if (hpnow > 0) return;

    // ===== 사망 처리 =====
    const exp = getScore(entity, "exp_reward");

    entity.runCommand(`scoreboard players add @p expnow ${exp}`);
    entity.runCommand("particle minecraft:huge_explosion_emitter ~~~");
    entity.runCommand("kill @s");
}

/* =========================
   몬스터 사망 감지
========================= */
let overworld;

system.run(() => {

    overworld = world.getDimension("overworld");

    system.runInterval(() => {

        for (const entity of overworld.getEntities({ tags: ["mob"] })) {
            if (!entity.isValid) continue;
            handleDeath(entity);
            updateMobNameTag(entity);
        }

    }, 5);

});
