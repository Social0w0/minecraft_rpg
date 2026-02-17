import { world } from "@minecraft/server";

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

export function updateCombatStats(player) {

    const lv = getScore(player, "§e§lLV");
    const atkstat = getScore(player, "atkstat");
    const defstat = getScore(player, "defstat");

    const atk_p = getScore(player, "atk_p");
    const atk_m = getScore(player, "atk_m");

    const def_p = getScore(player, "def_p");
    const def_m = getScore(player, "def_m");

    const atkbasic = 1 + lv * 0.3;

    const atk = Math.floor(atkbasic + atkstat * 0.3 + atk_p);
    const def = Math.floor(defstat * 0.2+ def_p);

    setScore(player, "atk", atk);
    setScore(player, "def", def);
}
