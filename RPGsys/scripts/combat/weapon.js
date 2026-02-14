import { world, system } from "@minecraft/server";

function randomOffset(range) {
    return (Math.random() - 0.5) * range;
}

/* ================================
   무기 데이터 정의
================================ */

const WEAPON_DATA = {

    "minecraft:air": { p: 0, m: 0 },
    "minecraft:stone": { p: 15, m: 0, desc: "근본 있는, 인류의 무기"},
    "bridge:ironsword": { p: 60, m: 0, desc: "많은 이들의 손을 거치며 칼날은 무뎌졌지만, 강도만큼은 여전하다." },
    "bridge:myweapon": { p: 1000, m: 0, desc: "아주 오래된 무기다." },
    
};

function setScore(player, objective, value) {
    const obj = world.scoreboard.getObjective(objective);
    if (!obj) return;
    try { obj.setScore(player, value); } catch {}
}


function applyLore(item, weaponData) {

    if (!item) return;

    // 이미 우리가 만든 lore면 다시 만들지 않음
    const currentLore = item.getLore();
    if (currentLore && currentLore[0]?.includes("공격력")) return;

    const lore = [];

    lore.push(`§7────────────`);
    lore.push(`§c공격력 +${weaponData.p}`);
    if (weaponData.m > 0)
        lore.push(`§b마법 공격 +${weaponData.m}`);
    lore.push(`§8${weaponData.desc}`);
    lore.push(`§7────────────`);

    item.setLore(lore);
}




system.runInterval(() => {

    for (const player of world.getPlayers()) {

        const equip = player.getComponent("minecraft:equippable");
        if (!equip) continue;

        const item = equip.getEquipment("Mainhand");

        // ===== 아무것도 안 들었을 때 =====
        if (!item || !item.typeId) {

            setScore(player, "atk_p", 0);
            setScore(player, "atk_m", 0);
            player.addTag("combat");
            
            continue;
        }

        const typeId = item.typeId;

        const weapon = WEAPON_DATA[typeId];

        // ===== 정의되지 않은 아이템 =====
        if (!weapon) {

            setScore(player, "atk_p", 0);
            setScore(player, "atk_m", 0);
            player.addTag("combat");
            continue;
        }

        // ===== 공격력 적용 =====
        setScore(player, "atk_p", weapon.p);
        setScore(player, "atk_m", weapon.m);

        player.addTag("combat");

        // ===== lore 적용 =====
        applyLore(item, weapon);
        equip.setEquipment("Mainhand", item);


    }

}, 2);
