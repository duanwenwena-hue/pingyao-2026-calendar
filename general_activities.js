const GENERAL_ACTIVITIES = [
  {
    date:"9/25", weekday:"周五", start:"14:00", end:"17:00",
    title:"迁徙计划·从文学到影视（上）", en:"Literary Picturized Project (Part1)",
    venue:"门厅 FOYER", kind:"活动", unit:"迁徙计划·从文学到影视 LPP", price:"¥ 10.00"
  },
  {
    date:"9/25", weekday:"周五", start:"20:30", end:"22:30",
    title:"与花与酒醉中秋——青葱计划特别放映暨青花汾酒派对", en:"FENJIU NIGHT · CFDG Young Shoots Screenings & Moon Party",
    venue:"门厅 FOYER", kind:"活动", unit:"与花与酒醉中秋—青花汾酒派对", price:"¥ 20.00"
  },
  {
    date:"9/26", weekday:"周六", start:"14:00", end:"17:00",
    title:"迁徙计划·从文学到影视（下）", en:"Literary Picturized Project (Part2)",
    venue:"门厅 FOYER", kind:"活动", unit:"迁徙计划·从文学到影视 LPP", price:"¥ 10.00"
  },
  {
    date:"9/30", weekday:"周三", start:"12:00", end:"14:00",
    title:"LibTV「X小时之后」AI短片黑客松优秀作品展映", en:"LibTV AI Short Film Hackathon - Showcase screening",
    venue:"门厅 FOYER", kind:"活动", unit:"LibTV「X小时之后」AI短片黑客松优秀作品展映", price:"¥ 20.00"
  }
];
window.GENERAL_ACTIVITIES = GENERAL_ACTIVITIES;
window.ALL_ACTIVITIES = [...(window.MASTER_ACTIVITIES||[]), ...GENERAL_ACTIVITIES];
