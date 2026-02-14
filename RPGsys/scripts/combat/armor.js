import { world, system } from "@minecraft/server";

/* ================================
   스코어 헬퍼
================================ */

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

