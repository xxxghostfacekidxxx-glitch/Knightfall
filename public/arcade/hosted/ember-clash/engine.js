/* Rock, Paper, Ruin: classic hands, infernal sigils and the legacy Ruin rules. */
globalThis.RuinDuel = class RuinDuel {
  static modes = {
    classic: {names: ['rock','paper','scissors'], beats: {rock:['scissors'],paper:['rock'],scissors:['paper']}, target:5},
    infernal: {names: ['ember','blade','shield'], beats: {ember:['blade'],blade:['shield'],shield:['ember']}, target:3},
    ruin: {names: ['rock','paper','scissors','ruin'], beats: {rock:['scissors'],paper:['rock','ruin'],scissors:['paper','ruin'],ruin:['rock']}, rounds:5}
  };
  constructor(mode='classic', random=Math.random) {
    if (!RuinDuel.modes[mode]) throw new Error('Unknown duel mode');
    this.mode=mode; this.rules=RuinDuel.modes[mode]; this.random=random;
    this.you=0; this.cpu=0; this.ties=0; this.total=0; this.history=[];
  }
  outcome(player,cpu) {
    if (!this.rules.names.includes(player)||!this.rules.names.includes(cpu)) return null;
    return player===cpu?'tie':this.rules.beats[player].includes(cpu)?'win':'loss';
  }
  get done() { return this.rules.target ? this.you>=this.rules.target||this.cpu>=this.rules.target : this.total>=this.rules.rounds; }
  get winner() { return this.done ? this.you===this.cpu?'tie':this.you>this.cpu?'player':'cpu' : null; }
  get score() {
    if (!this.done) return 0;
    if (this.mode==='infernal') return this.winner==='player'?500:Math.max(25,this.you*70);
    return this.you*100+(this.winner==='player'?100:0);
  }
  play(player) {
    if (this.done||!this.rules.names.includes(player)) return null;
    const cpu=this.rules.names[Math.floor(this.random()*this.rules.names.length)],outcome=this.outcome(player,cpu);
    const round={player,cpu,outcome}; this.total++;
    if (outcome==='win') this.you++; else if (outcome==='loss') this.cpu++; else this.ties++;
    this.history.push(round); if (this.history.length>50) this.history.shift(); return round;
  }
  export() { return {schema:1,mode:this.mode,you:this.you,cpu:this.cpu,ties:this.ties,total:this.total,history:this.history.map(r=>({...r}))}; }
  static restore(data,random=Math.random) {
    try {
      if (!data||data.schema!==1||!Object.hasOwn(RuinDuel.modes,data.mode)) return null;
      const g=new RuinDuel(data.mode,random),r=g.rules;
      if (!['you','cpu','ties','total'].every(k=>Number.isInteger(data[k])&&data[k]>=0&&data[k]<=10000)||data.total!==data.you+data.cpu+data.ties) return null;
      if (r.target&&(data.you>r.target||data.cpu>r.target||data.you===r.target&&data.cpu===r.target)) return null;
      if (r.rounds&&data.total>r.rounds) return null;
      if (!Array.isArray(data.history)||data.history.length!==Math.min(data.total,50)) return null;
      let you=data.you,cpu=data.cpu,ties=data.ties;
      for (let i=data.history.length-1;i>=0;i--) {
        const h=data.history[i]; if (!h||g.outcome(h.player,h.cpu)!==h.outcome||h.outcome===null) return null;
        if (r.target&&i<data.history.length-1&&(you>=r.target||cpu>=r.target)) return null;
        if (h.outcome==='win') you--; else if (h.outcome==='loss') cpu--; else ties--;
        if (you<0||cpu<0||ties<0) return null;
      }
      if (data.total<=50&&(you||cpu||ties)) return null;
      g.you=data.you;g.cpu=data.cpu;g.ties=data.ties;g.total=data.total;g.history=data.history.map(h=>({player:h.player,cpu:h.cpu,outcome:h.outcome}));return g;
    } catch { return null; }
  }
};
