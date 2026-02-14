import { world, system } from "@minecraft/server";
import { WEAPON_DATA } from "./weapon.js";

function randomOffset(range) {
    return (Math.random() - 0.5) * range;
}

function getScore(player, objective) {
    const obj = world.scoreboard.getObjective(objective);
    if (!obj) return 0;
    try { return obj.getScore(player); } catch { return 0; }
}

function setScore(player, objective, value) {
    const obj = world.scoreboard.getObjective(objective);
    if (!obj) return;
    try { obj.setScore(player, value); } catch {}
}





const cooldownMap = new Map();

export function dealDamage(attacker, target, baseDamage = 0) {

    const now = system.currentTick;

    let weapon = null;
    let cooldown = 10; // 몹 기본 공격속도

    const equip = attacker.getComponent("minecraft:equippable");
    if (equip) {
        const item = equip.getEquipment("Mainhand");
        const typeId = item?.typeId ?? "minecraft:air";
        weapon = WEAPON_DATA[typeId];
    }
    if (weapon) {
        cooldown = weapon.cooldown ?? 0;
    }

    const lastAttack = cooldownMap.get(attacker.id) ?? 0;
    if (now < lastAttack + cooldown) {
        attacker.runCommand(
            `effect @s mining_fatigue 1 15 true`
        );
        attacker.runCommand(
            `effect @s weakness 1 255 true`
        );
        return;
    }
    cooldownMap.set(attacker.id, now);

    if (cooldown > 0) {
        attacker.runCommand(
            `effect @s clear mining_fatigue`
        );
        attacker.runCommand(
            `effect @s clear weakness`
        );
    } 
    // ===== 공격자 =====
    if (!attacker || !target) return;
    let atk = getScore(attacker, "atk");
    let damage = atk + baseDamage;
    
    // ===== 방어력 계산 (Target 기준) =====
    let def = 0;
    let armor_p = 0;
    let armor_m = 0;

    if (target.typeId === "minecraft:player") {
        def = getScore(target, "def");        // defstat 반영된 값
        armor_p = getScore(target, "def_p"); // 방어구 물방
        armor_m = getScore(target, "def_m");
    }
    let depense = def + armor_p + armor_m;

    damage = Math.max(1, damage - depense);


    // ===== 치명타 계산 =====
    let isCritical = false;

    const critChance = getScore(attacker, "crit_chance"); 
    const critDamagePercent = getScore(attacker, "crit_damage"); 

    if (Math.random() * 100 < critChance) {
        isCritical = true;
        damage = Math.floor(damage * (critDamagePercent / 100));
        target.runCommand("particle 빨강1.9 ~~1~")
        target.runCommand("particle 빨강1.14 ~~2~")
        target.runCommand("particle 빨강.15 ~~2~")
        
    }


    // ===== HP 감소 =====
    let hpnow = getScore(target, "hpnow");
    hpnow -= damage;
    setScore(target, "hpnow", Math.max(0, hpnow));
    spawnDamageIndicator(target, damage, isCritical);

}


function spawnDamageIndicator(target, damage, isCritical = false) {
    const dim = target.dimension;

    const base = target.location;

    const loc = {
        x: base.x + randomOffset(1.0),   // 좌우 퍼짐
        y: base.y +0.5+ randomOffset(0.5), // 높이 랜덤
        z: base.z - randomOffset(1.0)
    };

    // 데미지 태그 소환
    const indicator = dim.spawnEntity("bridge:damage", loc);

    if (isCritical) {
        indicator.nameTag = `§l§c${damage}!`;
    } else {
        indicator.nameTag = `§l§7${damage}`;
    }

    let tick = 0;
    const maxTick = 40;

    const interval = system.runInterval(() => {

        if (!indicator?.isValid) {
            system.clearRun(interval);
            return;
        }

        tick++;

        // 🔥 위로 천천히 상승
        const current = indicator.location;
        indicator.teleport({
            x: current.x,
            y: current.y + 0.025,   // 상승 속도 (조절 가능)
            z: current.z
        });

        if (tick >= maxTick) {
            indicator.remove();
            system.clearRun(interval);
        }

    }, 1); 
}
