import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";


/* ================================
   메인 메뉴
================================ */

export function openMainMenu(player) {

    const form = new ActionFormData()
        .title("§l§6[ 스탯 ]")
        .button("§a능력치 보기")
        .button("§e스탯 분배")
        .button("§b스탯 설명");

    form.show(player).then(res => {

        if (res.canceled) return;

        if (res.selection === 0) openStatusUI(player);
        if (res.selection === 1) openAdvancedStatUI(player);
        if (res.selection === 2) openStatInfoUI(player);
    });
}


/* ================================
   능력치 보기 UI
================================ */

function openStatusUI(player) {

    const hp = getScore(player, "hp");
    const hpnow = getScore(player, "hpnow");
    const hpstat = getScore(player, "hpstat");

    const mp = getScore(player, "mp");
    const mpnow = getScore(player, "mpnow");
    const mpstat = getScore(player, "mpstat");

    const atk = getScore(player, "atk");
    const atkstat = getScore(player, "atkstat");
    const def = getScore(player, "def");
    const defstat = getScore(player, "defstat");

    const atk_p = getScore(player, "atk_p");
    const def_p = getScore(player, "def_p");

    const lv = getScore(player, "§e§lLV");

    const body =
        `§e§lLV: §f${lv}\n\n` +
        `§c§lHP: §f${hpnow}/${hp}\n` +
        `§b§lMP: §f${mpnow}/${mp}\n\n` +
        `§4§l공격력: §f${atk} §7(무기 ${atk_p})\n` +
        `§3§l방어력: §f${def} §7(방어구 ${def_p})\n`+
        `§l ----------------------------\n\n` +
        `§lHP 스탯: §f${hpstat}\n`+
        `§lMP 스탯: §f${mpstat}\n`+
        `§lATK 스탯: §f${atkstat}\n`+
        `§lDEF 스탯: §f${defstat}\n`+
        `§l ----------------------------\n\n`;

    const form = new ActionFormData()
        .title("§l§6[ 능력치 ]")
        .body(body)
        .button("§l뒤로");

    form.show(player).then(res => {
        if (res.canceled) return;
        openMainMenu(player);
    });
}


/* ================================
   스탯 분배 UI
================================ */

function openAdvancedStatUI(player) {

    const stat = getScore(player, "stat");

    if (stat <= 0) {
        player.sendMessage("§c남은 스탯이 없습니다.");
        return;
    }

    const form = new ModalFormData()
        .title(`§e§l남은 스탯:§f${stat}`)
        .slider("§lHP ", 0, stat, { defaultValue: 0, step: 1 })
        .slider("§lMP ", 0, stat, { defaultValue: 0, step: 1 })
        .slider("§lATK ", 0, stat, { defaultValue: 0, step: 1 })
        .slider("§lDEF ", 0, stat, { defaultValue: 0, step: 1 });

    form.show(player).then(res => {

        if (res.canceled) return;

        const [hp, mp, atk, def] = res.formValues;
        const total = hp + mp + atk + def;

        if (total > stat) {
            player.sendMessage("§c분배 총합 초과.");
            return;
        }

        setScore(player, "stat", stat - total);

        setScore(player, "hpstat", getScore(player, "hpstat") + hp);
        setScore(player, "mpstat", getScore(player, "mpstat") + mp);
        setScore(player, "atkstat", getScore(player, "atkstat") + atk);
        setScore(player, "defstat", getScore(player, "defstat") + def);

        player.sendMessage("§a스탯 분배 완료.");
    });
}


/* ================================
   스탯 설명 UI
================================ */
function openStatInfoUI(player) {

    const body =
        "                           \n"+
        '§cHP§7 - 1당 최대 체력 + 0.8％\n' +
        '§bMP§7 - 1당 최대 마나 + 0.4％\n' +
        '§4ATK§7 - 1당 공격력 + 0.5\n' +
        '§3DEF§7 - 1당 방어력 + 0.5\n';

    const form = new ActionFormData()
        .title("§l§6[ 스탯 설명 ]")
        .body(body)
        .button("§7뒤로");

    form.show(player).then(res => {
        if (res.canceled) return;
        openMainMenu(player);
    });
}


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