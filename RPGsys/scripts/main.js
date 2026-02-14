import { system, world } from "@minecraft/server";
import { openMainMenu } from "./ui/statUI.js";

import "./combat/weapon.js";
import "./combat/stats.js";
import "./combat/damage.js";
import "./combat/combatloop.js";
import { updateCombatStats } from "./combat/stats.js";


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



// HP 기능
function makeHpBar(hpnow, hp, totalBars = 10) {
    if (hp <= 0) return "░".repeat(totalBars);

    const ratio = hpnow / hp;
    let filled = Math.floor(ratio * totalBars);

    // 0칸 되는 문제 방지
    if (hpnow > 0 && filled === 0) filled = 1;

    filled = Math.min(filled, totalBars);
    return "█".repeat(filled) + "░".repeat(totalBars - filled);
}

// MP 기능
function makeMpBar(mpnow, mp, totalBars = 10) {
    if (mp <= 0) return "░".repeat(totalBars);

    const ratio = mpnow / mp;
    let filled = Math.floor(ratio * totalBars);

    if (mpnow > 0 && filled === 0) filled = 1;
    filled = Math.min(filled, totalBars);

    return "█".repeat(filled) + "░".repeat(totalBars - filled);
}


// LV 기능
function handleLevelUp(player) {
    let lv = getScore(player, "§e§lLV");
    let exp = getScore(player, "exp");
    let expnow = getScore(player, "expnow");

    let hpbasic = getScore(player, "hpbasic");
    let mpbasic = getScore(player, "mpbasic");
    let atkbasic = getScore(player, "atkbasic");
    let defbasic = getScore(player, "defbasic");
    let stat = getScore(player, "stat");
    let hpstat = getScore(player, "hpstat");
    let mpstat = getScore(player, "mpstat");

    let leveledUp = false;
    
    while (expnow >= exp) {
        expnow -= exp;
        lv += 1;
        stat += 6;
        hpbasic = Math.floor(hpbasic * 1.05);
        mpbasic = Math.floor(mpbasic * 1.05);
        atkbasic = Math.floor(atkbasic * 1.03);
        defbasic = Math.floor(defbasic * 1.01);
        exp = Math.floor(exp * 1.05);
        leveledUp = true;
    }

    if (!leveledUp) return;

    const hp = Math.floor(hpbasic * (hpstat + 1) * 0.0065);
    const mp = Math.floor(mpbasic * (mpstat + 1) * 0.0065);

    setScore(player, "§e§lLV", lv);
    setScore(player, "exp", exp);
    setScore(player, "expnow", expnow);

    setScore(player, "hpbasic", hpbasic);
    setScore(player, "mpbasic", mpbasic);
    setScore(player, "stat", stat);
    setScore(player, "hp", hp);
    setScore(player, "mp", mp);
    setScore(player, "hpstat", hpstat);
    setScore(player, "mpstat", mpstat);

    player.addTag("levelup");
}




function handleDeath(player) {
  const hp = getScore(player, "hp");
  let hpnow = getScore(player, "hpnow");

  if (hpnow > 0) return;

  // ===== 사망 처리 =====
  setScore(player, "hpnow", hp);

  // 부활 연출 (선택)
  player.runCommand("title @s[tag=!levelup] title §c§l사 망");
  player.runCommand("kill @s[tag=!levelup]");
  player.runCommand("tag @s[tag=!levelup] add death");
}







/* ===============================
   가이드북 → 스탯 UI
================================= */

world.afterEvents.itemUse.subscribe(ev => {

    const player = ev.source;
    const item = ev.itemStack;

    if (!player || !item) return;

    if (item.typeId === "social:menu") {
        openMainMenu(player);
    }

});


///  ===== 메  인  루  프  =====
system.runInterval(() => {
    for (const player of world.getPlayers()) {

        /* ===== 최초 접속 초기화 ===== */
        if (!player.hasTag("hp_inited")) {
            // HP 기본값
            setScore(player, "hpbasic", 20);
            setScore(player, "hpstat", 0);
            setScore(player, "hpnow", 20);

            // MP 기본값
            setScore(player, "mpbasic", 20);
            setScore(player, "mpstat", 0);
            setScore(player, "mpnow", 20);
            setScore(player, "mp_regen_timer", 0);

            // 잡다한 스탯들
            setScore(player, "atk", 0);
            setScore(player, "def", 0);
            setScore(player, "atkstat", 0);
            setScore(player, "defstat", 0);
            setScore(player, "agistat", 0);

            // 전 투 관 련 **--**
            setScore(player, "atk_p", 0); // 공격 스탯
            setScore(player, "atk_m", 0);

            setScore(player, "def_p", 0); // 방어 스탯
            setScore(player, "def_m", 0);

                // 치명타
            setScore(player, "crit_chance", 5);   // 치확 5%
            setScore(player, "crit_damage", 150); // 치뎀 150%


            // 레벨 기본값
            setScore(player, "§e§lLV", 1);
            setScore(player, "exp", 1000);
            setScore(player, "expnow", 0);

            // 기초 스탯 
            setScore(player, "stat", 20);
            player.runCommand("give @s social:menu");
            player.addTag("hp_inited");
        }


        /* ===== HP 최대치 계산 (매 루프) ===== */
        const hpbasic = getScore(player, "hpbasic");
        const hpstat = getScore(player, "hpstat");
        const hp = Math.floor(hpbasic * (1 + hpstat * 0.008)); // 1당 0.8%
        setScore(player, "hp", hp);

        /* ===== 현재 HP 보정 ===== */
        let hpnow = getScore(player, "hpnow");
        if (hpnow > hp) {
            hpnow = hp;
            setScore(player, "hpnow", hpnow);
        }


        /* ===== MP 최대치 계산 ===== */
        const mpbasic = getScore(player, "mpbasic");
        const mpstat = getScore(player, "mpstat");
        const mp = Math.floor(mpbasic * (1 + mpstat * 0.004)); // 1당 0.5%
        setScore(player, "mp", mp);

        /* ===== MP 현재값 보정 ===== */
        let mpnow = getScore(player, "mpnow");
        if (mpnow > mp) {
            mpnow = mp;
            setScore(player, "mpnow", mpnow);
        }

        const hpbar = makeHpBar(hpnow, hp, 10);
        const mpbar = makeMpBar(mpnow, mp, 10);

        /* ===== MP 자연 회복 ===== */
        if (mpnow < mp) {
            let timer = getScore(player, "mp_regen_timer");
            timer += 1;

            // 회복 주기 계산
            const regenTick = Math.max(
                1,
                Math.floor(10 / (1 + mpstat * 0.03))
            );

            if (timer >= regenTick) {
                mpnow += 1;
                timer = 0;
                if (mpnow > mp) mpnow = mp;
                setScore(player, "mpnow", mpnow);
            }
            setScore(player, "mp_regen_timer", timer);
        }


        // 전투
        updateCombatStats(player);



        /* ===== 레벨업 처리 ===== */
        handleLevelUp(player);

        const lv = getScore(player, "§e§lLV");
        const exp = getScore(player, "exp");
        const expnow = getScore(player, "expnow");
        

        // 죽음에 관하여.
        handleDeath(player);

        /* ===== ActionBar 출력 ===== */
        player.onScreenDisplay.setActionBar(
            '\n'+
            '\n'+
            `§eLV ${lv}   §aEXP ${expnow}/${exp}\n` +
            `§c❤ HP: ${hpbar} | §f${hpnow}/${hp}\n` +
            `§b✦ MP: ${mpbar} | §f${mpnow}/${mp}`
        );

    }
}, 1);
