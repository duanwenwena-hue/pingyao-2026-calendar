const GENERAL_ACTIVITIES = [
  {
    date:"9/27", weekday:"周日", start:"21:30", end:"00:00",
    title:"十周年特别策划——时光切片｜电子混音DJ音乐会", en:"SLICES OF TIME: AN ELECTRONIC REMIX DJ SET",
    venue:"门厅 FOYER", kind:"活动", unit:"十周年特别策划—时光切片｜电子混音DJ音乐会",
    poster:"assets/time_slice_poster.png"
  },

  {
    date:"9/25", weekday:"周五", start:"14:00", end:"17:00",
    title:"迁徙计划·从文学到影视（上）", en:"Literary Picturized Project (Part1)",
    venue:"门厅 FOYER", kind:"活动", unit:"迁徙计划·从文学到影视 LPP"
  },
  {
    date:"9/25", weekday:"周五", start:"20:30", end:"22:30",
    title:"与花与酒醉中秋——青葱计划特别放映暨青花汾酒派对", en:"FENJIU NIGHT · CFDG Young Shoots Screenings & Moon Party",
    venue:"门厅 FOYER", kind:"活动", unit:"与花与酒醉中秋—青花汾酒派对"
  },
  {
    date:"9/26", weekday:"周六", start:"14:00", end:"17:00",
    title:"迁徙计划·从文学到影视（下）", en:"Literary Picturized Project (Part2)",
    venue:"门厅 FOYER", kind:"活动", unit:"迁徙计划·从文学到影视 LPP"
  },
  {
    date:"9/30", weekday:"周三", start:"12:00", end:"14:00",
    title:"LibTV「X小时之后」AI短片黑客松优秀作品展映", en:"LibTV AI Short Film Hackathon - Showcase screening",
    venue:"门厅 FOYER", kind:"活动", unit:"LibTV「X小时之后」AI短片黑客松优秀作品展映"
  }
];
window.GENERAL_ACTIVITIES = GENERAL_ACTIVITIES;
window.ALL_ACTIVITIES = [...(window.MASTER_ACTIVITIES||[]), ...GENERAL_ACTIVITIES];
