import { world, system } from "@minecraft/server";
import { SKILL_DATA } from "./skills.js";
import { dealDamage } from "./damage.js";

const cooldownMap = new Map();

// 기초 함수
function getScore(player, objectiveName) {
    const obj = world.scoreboard.getObjective(objectiveName);
    if (!obj) return 0;
    try { return obj.getScore(player); } catch { return 0; }
}

function setScore(player, objectiveName, value) {
    let obj = world.scoreboard.getObjective(objectiveName);
    if (!obj) {
        obj = world.scoreboard.addObjective(objectiveName, objectiveName);
    }
    try { obj.setScore(player, value); } catch { }
}

function getCooldowns(player) {
    if (!cooldownMap.has(player.id)) {
        cooldownMap.set(player.id, {});
    }
    return cooldownMap.get(player.id);
}

export function useSkill(player, skillId) {

    const skill = SKILL_DATA[skillId];

    if (!skill) {
        console.warn("SKILL NOT FOUND:", skillId);
        return;
    }

    const mpnow = getScore(player, "mpnow");
    if (mpnow < skill.mpCost) {
        player.sendMessage("§l[ §a시스템§r§l ]§r §c마나가 부족합니다!");
        return;
    }

    const targets = getTargets(player, skill);

    if (targets.length === 0) {
        player.sendMessage("§l[ §a시스템§r§l ]§r §7대상이 없습니다.");
        return;
    }

    setScore(player, "mpnow", mpnow - skill.mpCost);

    const cds = getCooldowns(player);
    cds[skillId] = skill.cooldown;

    const atk = getScore(player, "atk");
    const atk_m = getScore(player, "atk_m");

    const damage =
        atk * skill.power_p +
        atk_m * skill.power_m;

    for (const target of targets) {
        player.playAnimation(skill.animation);
        system.runTimeout(() => {
            dealDamage(player, target, damage);
            player.runCommand(`playsound ${skill.sound} @a[r=5] ~~~ 20 ${skill.velocity} 20`);
            player.runCommand(`particle ${skill.particle} ${player.location.x} ${player.location.y} ${player.location.z}`);
            target.runCommand('damage @s 1');
        }, 4);
        
    }
}


// 스킬 타겟팅 - 수동
export function getTargets(player, skill) {
    if (!skill || !skill.target) return [];

    const origin = player.location;
    const view = player.getViewDirection();

    const shape = skill.target.shape;
    const range = skill.target.range ?? 5;
    const angle = skill.target.angle ?? 45;
    const radius = skill.target.radius ?? 3;

    const entities = player.dimension.getEntities({
        location: origin,
        maxDistance: range
    });

    const targets = [];

    for (const e of entities) {

        if (!e.isValid) continue;
        if (e.id === player.id) continue;


    // 생명체만 타겟
    const health = e.getComponent("minecraft:health");
    if (!health) continue;

        const dx = e.location.x - origin.x;
        const dy = (e.location.y + 1) - (origin.y + 1.5);
        const dz = e.location.z - origin.z;

        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (distance > range) continue;

        const dir = {
            x: dx / distance,
            y: dy / distance,
            z: dz / distance
        };

        const dot =
            view.x * dir.x +
            view.y * dir.y +
            view.z * dir.z;

        switch (shape) {

            case "single":
                if (dot > 0.9) targets.push(e);
                break;

            case "cone":
                const rad = angle * Math.PI / 180;
                const threshold = Math.cos(rad / 2);
                if (dot > threshold) targets.push(e);
                break;

            case "circle":
                if (distance <= radius) targets.push(e);
                break;

            case "line":
                if (dot > 0.95) targets.push(e);
                break;
        }
    }

    return targets;
}


function getFrontConeTargets(player, radius = 6, angleDeg = 60) {

    const targets = player.dimension.getEntities({
        location: player.location,
        maxDistance: radius,
        excludeTypes: ["minecraft:item"]
    });

    const result = [];

    const view = player.getViewDirection();

    const angleRad = angleDeg * Math.PI / 180;
    const cosThreshold = Math.cos(angleRad);

    for (const target of targets) {

        if (target === player) continue;
        if (!target.isValid()) continue;

        // 플레이어 → 대상 벡터
        const dx = target.location.x - player.location.x;
        const dy = target.location.y - player.location.y;
        const dz = target.location.z - player.location.z;

        const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (length === 0) continue;

        // 정규화
        const dirX = dx / length;
        const dirY = dy / length;
        const dirZ = dz / length;

        // 내적
        const dot = view.x * dirX + view.y * dirY + view.z * dirZ;

        if (dot >= cosThreshold) {
            result.push(target);
        }
    }

    return result;
}


system.runInterval(() => {

    for (const [id, cds] of cooldownMap) {
        for (const key in cds) {
            if (cds[key] > 0) {
                cds[key]--;
            }
        }
    }

}, 1);
