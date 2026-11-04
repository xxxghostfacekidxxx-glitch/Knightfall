(()=>{
 const defaults={skin:'peach',face_shape:'round',hair:'shag',hair_color:'ink',eyes:'doe',eye_color:'violet',brow_style:'soft',eye_glimmer:'none',expression:'smile',face_mark:'freckles',piercing:'none',outfit:'hoodie',outfit_color:'plum',headwear:'none',eyewear:'none',neckwear:'spike_choker',aura:'none',accessory:'none',background:'void',pattern:'sparkles'};
 const choices={
  skin:['porcelain','peach','honey','olive','cocoa','violet'],
  face_shape:['round','soft_square','heart_face','long'],
  hair:['shag','spikes','bob','mohawk','horns','buns','flop'],
  hair_color:['ink','plum','pink','acid','silver','copper','blue'],
  eyes:['doe','sleepy','mischief','star','spiral'],
  eye_color:['violet','green','blue','pink','gold','red'],
  brow_style:['none','soft','raised','bold','sleepy'],
  eye_glimmer:['none','star','double','heart'],
  expression:['smile','grin','pout','fang','frown','tongue'],
  face_mark:['none','freckles','stars','stitches','lightning','heart'],
  piercing:['none','septum','brow','lip','ear'],
  outfit:['hoodie','jacket','overalls','dress','sweater','cape'],
  outfit_color:['plum','pink','acid','silver','copper','blue','black','red'],
  headwear:['none','witch_hat','tiara','antenna','headphones','flower'],
  eyewear:['none','star_shades','round_specs','visor','monocle','eyepatch'],
  neckwear:['none','spike_choker','chain','bandana','scarf'],
  aura:['none','ghost_flames','spark_ring','glow','moon'],
  accessory:['none','horns','halo','bow','beanie','crown','bandage'],
  background:['void','bubblegum','toxic','gravewave','ember','lavender','sky'],
  pattern:['none','sparkles','static','bats','hearts']
 };
 const palettes={
  skin:{porcelain:'#f8dbe0',peach:'#efb28f',honey:'#c98258',olive:'#9b7655',cocoa:'#704938',violet:'#b997d2'},
  hair_color:{ink:'#20182a',plum:'#71366e',pink:'#ff55d8',acid:'#a8ec42',silver:'#d9d4e3',copper:'#c66d45',blue:'#63b7ed'},
  background:{void:'#171021',bubblegum:'#54294f',toxic:'#24391e',gravewave:'#16403f',ember:'#4a241c',lavender:'#36264d',sky:'#20364c'},
  outfit_color:{plum:'#733b86',pink:'#be3c92',acid:'#557833',silver:'#7a788d',copper:'#a94f39',blue:'#315c87',black:'#292532',red:'#922c45'},
  eye_color:{violet:'#8e56c7',green:'#53b65b',blue:'#4c9fea',pink:'#ec5ab7',gold:'#d2a83e',red:'#dc455e'}
 };
 const safeAvatar=input=>{const out={...defaults};for(const k of Object.keys(defaults))if(choices[k].includes(input?.[k]))out[k]=input[k];return out};
 const hairstyles={
  shag:'<path d="M50 113 Q37 48 92 39 Q137 25 164 59 Q192 88 175 134 L157 112 L145 75 Q122 99 74 81 L69 119Z"/>',
  spikes:'<path d="M48 107 L61 63 L80 79 L94 35 L114 70 L136 32 L146 76 L173 52 L177 121Z"/>',
  bob:'<path d="M48 117 Q39 46 107 40 Q180 44 175 121 L159 147 L153 88 Q119 111 68 86 L67 144Z"/>',
  mohawk:'<path d="M54 106 Q49 58 82 48 L84 22 L103 49 L114 11 L132 50 L151 35 Q180 59 173 110Z"/>',
  horns:'<path d="M49 120 Q40 53 98 39 Q160 32 178 96 L169 131 L153 84 L74 85Z"/><path fill="#f5e9fb" d="M64 76 Q43 37 38 17 Q72 37 79 69 M148 68 Q162 36 187 19 Q181 54 164 83"/>',
  buns:'<path d="M49 116 Q38 52 91 41 Q151 30 178 88 L168 128 L153 81 L70 85Z"/><circle cx="54" cy="54" r="25"/><circle cx="168" cy="51" r="24"/>',
  flop:'<path d="M48 122 Q38 45 102 38 Q161 35 181 83 Q155 62 129 73 Q119 119 84 133 Q59 142 48 122Z"/>'
 };
 const eyeShapes={
  doe:'<ellipse cx="82" cy="121" rx="13" ry="17" fill="#fff"/><ellipse cx="145" cy="121" rx="13" ry="17" fill="#fff"/>',
  sleepy:'<path d="M67 120 Q82 108 97 120 M130 120 Q145 108 160 120" fill="none" stroke="#231727" stroke-width="8" stroke-linecap="round"/>',
  mischief:'<path d="M68 119 Q82 103 97 117 Q85 133 68 119 M130 117 Q146 101 160 117 Q147 133 130 117" fill="#fff" stroke="#231727" stroke-width="3"/>',
  star:'<path d="M82 105 L87 116 L99 117 L90 125 L93 137 L82 131 L71 137 L74 125 L65 117 L77 116Z M145 105 L150 116 L162 117 L153 125 L156 137 L145 131 L134 137 L137 125 L128 117 L140 116Z" fill="#fff" stroke="#231727" stroke-width="3"/>',
  spiral:'<circle cx="82" cy="121" r="15" fill="#fff"/><circle cx="145" cy="121" r="15" fill="#fff"/><path d="M82 111 C98 113 91 132 80 129 C72 127 77 118 84 121 M145 111 C161 113 154 132 143 129 C135 127 140 118 147 121" fill="none" stroke="#231727" stroke-width="4" stroke-linecap="round"/>'
 };
 const accessories={
  none:'',horns:'<path d="M69 71 Q42 34 40 17 Q69 36 84 68 M145 68 Q162 34 187 17 Q182 51 161 79" fill="#eee0f7" stroke="#241629" stroke-width="5"/>',
  halo:'<ellipse cx="113" cy="39" rx="35" ry="9" fill="none" stroke="#c6ff45" stroke-width="7"/>',
  bow:'<path d="M151 57 Q168 35 185 47 L174 69 L189 82 Q171 93 151 76Z" fill="#ff62c7" stroke="#28162c" stroke-width="4"/><circle cx="163" cy="69" r="7" fill="#ffe1f4"/>',
  beanie:'<path d="M49 83 Q52 44 110 40 Q162 43 174 83Z" fill="#39a36b" stroke="#241629" stroke-width="5"/><path d="M49 81 Q112 68 174 81 L175 96 Q112 88 50 98Z" fill="#c6ff45"/><circle cx="111" cy="38" r="10" fill="#ff55d8"/>',
  crown:'<path d="M66 79 L59 48 L86 64 L109 34 L133 64 L160 46 L155 82Z" fill="#c6ff45" stroke="#28172e" stroke-width="5"/><path d="M68 81 H154 V94 H68Z" fill="#ff55d8"/>',
  bandage:'<path d="M68 105 L153 87 L160 104 L73 123Z" fill="#e9d4c5" stroke="#352332" stroke-width="4"/><circle cx="89" cy="104" r="2"/><circle cx="139" cy="97" r="2"/>'
 };
 const patterns={
  none:'',
  sparkles:'<path d="M32 68 l4 9 9 4 -9 4 -4 9 -4-9 -9-4 9-4z M192 160 l4 8 8 4 -8 4 -4 8 -4-8 -8-4 8-4z M189 49 l3 6 6 3 -6 3 -3 6 -3-6 -6-3 6-3z" fill="#c6ff45"/>',
  static:'<path d="M17 130h16l8-12 10 25 10-18h13 M160 186h15l8-11 10 22 7-14h9" fill="none" stroke="#79ffe7" stroke-width="4" opacity=".7"/>',
  bats:'<path d="M20 70q11-12 20 0 8-10 16 0l-4-13 12 13q-13 2-23 13-10-11-21-13 M163 177q10-12 20 0 8-10 16 0l-4-13 12 13q-13 2-23 13-10-11-21-13" fill="#171018" stroke="#bfa3d2" stroke-width="2"/>',
  hearts:'<path d="M27 172 C11 158 29 145 37 158 C45 145 63 158 47 172 L37 181Z M181 75 C166 62 182 50 190 62 C198 50 214 62 199 75 L190 84Z" fill="#ff62c7" opacity=".85"/>'
 };
 const faceMarks={
  none:'',freckles:'<g fill="#9e5361"><circle cx="64" cy="142" r="2.3"/><circle cx="73" cy="149" r="2.3"/><circle cx="81" cy="141" r="2.3"/><circle cx="145" cy="142" r="2.3"/><circle cx="154" cy="149" r="2.3"/><circle cx="162" cy="141" r="2.3"/></g>',
  stars:'<path d="M66 143l3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1z M157 143l3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1z" fill="#c6ff45"/>',
  stitches:'<path d="M58 139l18 14m-14-19l18 14m68-11l18 14m-14-19l18 14" stroke="#512c45" stroke-width="3" stroke-linecap="round"/>',
  lightning:'<path d="M67 136l13-10-4 12 10-2-15 16 4-12-9 1z M148 136l13-10-4 12 10-2-15 16 4-12-9 1z" fill="#c6ff45"/>',
  heart:'<path d="M65 144c-8-8 2-15 7-8 5-7 15 0 7 8l-7 6z M145 144c-8-8 2-15 7-8 5-7 15 0 7 8l-7 6z" fill="#ff6b9c"/>'
 };
 const piercings={
  none:'',septum:'<path d="M105 148 Q112 159 119 148" fill="none" stroke="#e8d8f4" stroke-width="4"/><circle cx="105" cy="148" r="2.6" fill="#c6ff45"/><circle cx="119" cy="148" r="2.6" fill="#c6ff45"/>',
  brow:'<circle cx="93" cy="98" r="4" fill="#e8d8f4"/><circle cx="101" cy="97" r="4" fill="#c6ff45"/>',
  lip:'<circle cx="112" cy="160" r="4" fill="#e8d8f4"/><circle cx="112" cy="160" r="2" fill="#ff55d8"/>',
  ear:'<circle cx="49" cy="119" r="5" fill="#c6ff45"/><circle cx="175" cy="119" r="5" fill="#ff55d8"/>'
 };
 const mouths={
  smile:'<path d="M101 147 Q112 155 123 147" fill="none" stroke="#9a4d65" stroke-width="4" stroke-linecap="round"/>',
  grin:'<path d="M98 146 Q112 166 126 146Z" fill="#7f304d" stroke="#59243b" stroke-width="3"/><path d="M102 150h20" stroke="#fff1e8" stroke-width="3"/>',
  pout:'<path d="M105 151 Q112 144 119 151 Q112 158 105 151Z" fill="#b7556e"/>',
  fang:'<path d="M101 147 Q112 157 123 147" fill="none" stroke="#7f304d" stroke-width="5" stroke-linecap="round"/><path d="M105 148l2 9 4-6 M119 148l-2 9-4-6" fill="#fff4e8"/>',
  frown:'<path d="M101 154 Q112 145 123 154" fill="none" stroke="#9a4d65" stroke-width="4" stroke-linecap="round"/>',
  tongue:'<path d="M100 146 Q112 157 124 146 Q122 161 112 161 Q102 159 100 146Z" fill="#7f304d"/><path d="M112 156 Q111 168 120 165 Q126 162 120 157" fill="#f06b9a" stroke="#9a4d65" stroke-width="2"/>'
 };
 function render(input={}){
  const a=safeAvatar(input),skin=palettes.skin[a.skin],hair=palettes.hair_color[a.hair_color],bg=palettes.background[a.background],cloth=palettes.outfit_color[a.outfit_color],eye=palettes.eye_color[a.eye_color],accent=a.background==='toxic'?'#c6ff45':a.background==='bubblegum'?'#ff62c7':'#79ffe7';
  const headShape={round:'<circle cx="112" cy="113" r="68"/>',soft_square:'<path d="M48 88Q48 45 88 45H136Q176 45 176 88V128Q176 177 112 181Q48 177 48 128Z"/>',heart_face:'<path d="M112 181Q98 171 61 132Q38 108 45 79Q53 48 83 48Q103 48 112 69Q121 48 141 48Q171 48 179 79Q186 108 163 132Q126 171 112 181Z"/>',long:'<ellipse cx="112" cy="112" rx="58" ry="76"/>'}[a.face_shape];
  const brows={none:'',soft:'<path d="M68 101q14-8 28 0m34 0q14-8 28 0"/>',raised:'<path d="M68 98q14-14 28-5m34-2q14-8 28 5"/>',bold:'<path d="M67 100q15-12 31-3m31 0q16-9 31 3" stroke-width="8"/>',sleepy:'<path d="M68 99q14-2 28 3m34-3q14-2 28 3"/>'}[a.brow_style];
  const glimmer={none:'',star:'<path d="M82 111l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z M145 111l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff"/>',double:'<circle cx="77" cy="115" r="2" fill="#fff"/><circle cx="88" cy="128" r="2" fill="#fff"/><circle cx="140" cy="115" r="2" fill="#fff"/><circle cx="151" cy="128" r="2" fill="#fff"/>',heart:'<path d="M73 112c-5-5 1-10 5-5 4-5 10 0 5 5l-5 5z M136 112c-5-5 1-10 5-5 4-5 10 0 5 5l-5 5z" fill="#fff"/>'}[a.eye_glimmer];
  const pupils=a.eyes==='sleepy'?'':`<ellipse cx="84" cy="124" rx="6" ry="9" fill="${eye}"/><ellipse cx="143" cy="124" rx="6" ry="9" fill="${eye}"/><circle cx="85" cy="123" r="2.5" fill="#211528"/><circle cx="144" cy="123" r="2.5" fill="#211528"/>`;
  const garments={
   hoodie:`<path d="M78 190 Q112 174 147 190 L170 249 H55Z" fill="${cloth}" stroke="#20172a" stroke-width="6"/><path d="M83 194 Q70 184 78 174 Q91 178 99 190 M141 190 Q151 177 164 175 Q171 185 158 197" fill="${cloth}" stroke="#20172a" stroke-width="5"/><path d="M95 194l-3 23h40l-4-23 M105 193l-3 12m18-12 3 12" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`,
   jacket:`<path d="M78 190 Q112 174 147 190 L170 249 H55Z" fill="${cloth}" stroke="#20172a" stroke-width="6"/><path d="M94 187l18 20 18-20-8 48h-20z" fill="#17131f" stroke="${accent}" stroke-width="3"/><path d="M92 189l20 20-9 5-17-19m46-6-20 20 9 5 17-19" fill="${cloth}" stroke="#20172a" stroke-width="3"/><path d="M112 207v35" stroke="#e7d5ed" stroke-width="2"/><circle cx="112" cy="218" r="2" fill="${accent}"/><circle cx="112" cy="230" r="2" fill="${accent}"/>`,
   overalls:`<path d="M78 190 Q112 174 147 190 L170 249 H55Z" fill="#252330" stroke="#20172a" stroke-width="6"/><path d="M82 198h60l8 51H74z" fill="${cloth}" stroke="#20172a" stroke-width="4"/><path d="M91 190l8 25m34-25-8 25" stroke="${accent}" stroke-width="9" stroke-linecap="round"/><path d="M96 218h32v18H96z" fill="#ffffff12" stroke="#20172a" stroke-width="3"/><circle cx="97" cy="202" r="3" fill="#f7d777"/><circle cx="127" cy="202" r="3" fill="#f7d777"/>`,
   dress:`<path d="M78 190 Q112 174 147 190 L174 249 H50Z" fill="${cloth}" stroke="#20172a" stroke-width="6"/><path d="M96 191l16 23 16-23" fill="none" stroke="${accent}" stroke-width="6"/><path d="M67 231 Q112 220 157 231" fill="none" stroke="#ffffff55" stroke-width="4"/><path d="M108 216l4 6 4-6" fill="${accent}"/>`,
   sweater:`<path d="M78 190 Q112 174 147 190 L170 249 H55Z" fill="${cloth}" stroke="#20172a" stroke-width="6"/><path d="M89 192h46m-43 11h40m-43 11h46m-41 11h36" stroke="#ffffff30" stroke-width="3"/><path d="M99 188q13 13 26 0" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/><path d="M75 211l15 4m44 0 15-4" stroke="${accent}" stroke-width="5"/>`,
   cape:`<path d="M65 201 Q112 175 160 201 L186 250 H39Z" fill="${cloth}" stroke="#20172a" stroke-width="6"/><path d="M101 190 L112 226 L124 190" fill="${accent}"/><path d="M62 212l16 5m84-5-16 5" stroke="#ffffff55" stroke-width="3"/>`
  };
  const headwear={
   none:'',witch_hat:'<path d="M68 78 Q73 43 112 38 Q152 42 159 78Z" fill="#25152e" stroke="#241629" stroke-width="5"/><path d="M51 80 Q110 69 174 80 L169 91 Q110 84 56 94Z" fill="#c6ff45" stroke="#241629" stroke-width="4"/><path d="M90 49l22-23 16 26" fill="#25152e" stroke="#241629" stroke-width="4"/>',
   tiara:'<path d="M73 79l-8-22 24 13 23-31 22 31 24-13-7 24z" fill="#c6ff45" stroke="#241629" stroke-width="4"/>',
   antenna:'<path d="M91 54 Q80 28 65 25 M134 54 Q147 27 163 24" fill="none" stroke="#352340" stroke-width="5"/><circle cx="64" cy="23" r="9" fill="#ff55d8"/><circle cx="164" cy="22" r="9" fill="#79ffe7"/>',
   headphones:'<path d="M51 112 Q49 44 112 42 Q176 44 173 112" fill="none" stroke="#30243a" stroke-width="12"/><rect x="43" y="95" width="19" height="38" rx="8" fill="#ff55d8" stroke="#241629" stroke-width="4"/><rect x="163" y="95" width="19" height="38" rx="8" fill="#c6ff45" stroke="#241629" stroke-width="4"/>',
   flower:'<path d="M161 54q-8-18 5-22 14 5 2 21 17-12 23 2-3 15-22 5 13 18-1 23-14-6-3-23-17 12-23-2 4-15 22-4z" fill="#ff62c7" stroke="#35172e" stroke-width="3"/><circle cx="168" cy="59" r="7" fill="#f7dc7b"/>'
  };
  const eyewear={
   none:'',star_shades:'<path d="M63 112l15-6 14 7-7 17-15 1z M131 113l14-7 15 6-7 19-15-1z M92 116h39" fill="#21172b" stroke="#c6ff45" stroke-width="4"/>',
   round_specs:'<circle cx="82" cy="121" r="20" fill="none" stroke="#e8d8f4" stroke-width="4"/><circle cx="145" cy="121" r="20" fill="none" stroke="#e8d8f4" stroke-width="4"/><path d="M102 119q11-8 23 0" fill="none" stroke="#e8d8f4" stroke-width="4"/>',
   visor:'<path d="M61 104 Q112 89 163 104 L158 132 Q112 143 66 132Z" fill="#79ffe755" stroke="#79ffe7" stroke-width="4"/><path d="M69 111h86" stroke="#d9fff8" stroke-width="3"/>',
   monocle:'<circle cx="145" cy="121" r="19" fill="#79ffe722" stroke="#f1d880" stroke-width="4"/><path d="M159 136l14 23" stroke="#f1d880" stroke-width="3"/>',
   eyepatch:'<path d="M62 108q20-13 39 0l-4 21q-20 13-34-2z" fill="#21172b" stroke="#e8d8f4" stroke-width="4"/><path d="M62 110l-12-9m49 8 9-12" stroke="#e8d8f4" stroke-width="3"/>'
  };
  const neckwear={
   none:'',spike_choker:'<path d="M87 179 Q112 191 137 179 L135 192 Q112 203 89 192Z" fill="#21172b" stroke="#c6ff45" stroke-width="3"/><path d="M96 188l-4 8 9-4m23-4 4 8-9-4" fill="#ddd0e8"/>',
   chain:'<path d="M88 178 Q112 201 136 178" fill="none" stroke="#f3cf66" stroke-width="4"/><path d="M112 194l-8 9 8 10 8-10z" fill="#c6ff45" stroke="#241629" stroke-width="3"/>',
   bandana:'<path d="M82 178 Q112 189 142 178 L132 201 112 212 91 200Z" fill="#a63866" stroke="#241629" stroke-width="4"/><path d="M96 187l16 17 16-17" fill="none" stroke="#f2d8ea" stroke-width="3"/>',
   scarf:`<path d="M84 179 Q112 193 140 179 L135 194 Q112 205 89 193Z" fill="${accent}" stroke="#241629" stroke-width="4"/><path d="M129 191l7 36-15-5-4-25" fill="${accent}" stroke="#241629" stroke-width="4"/>`
  };
  const auras={
   none:'',ghost_flames:'<path d="M42 168 Q31 145 48 127 Q40 154 58 155 Q57 132 72 120 Q65 152 83 161 M181 168 Q193 146 176 127 Q184 154 166 155 Q167 132 152 120 Q159 152 141 161" fill="none" stroke="#79ffe7" stroke-width="7" stroke-linecap="round" opacity=".8"/>',
   spark_ring:'<ellipse cx="112" cy="126" rx="93" ry="110" fill="none" stroke="#c6ff45" stroke-width="3" stroke-dasharray="3 12" opacity=".7"/>',
   glow:'<circle cx="112" cy="113" r="76" fill="none" stroke="#ff55d8" stroke-width="9" opacity=".35"/><circle cx="112" cy="113" r="83" fill="none" stroke="#ff55d8" stroke-width="3" opacity=".6"/>',
   moon:'<path d="M175 152a30 30 0 1 1-28-46 25 25 0 1 0 28 46z" fill="#f4dc83" stroke="#30243a" stroke-width="3"/><circle cx="44" cy="103" r="5" fill="#c6ff45"/><circle cx="184" cy="190" r="5" fill="#ff62c7"/>'
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 256" role="img" aria-label="Cute chaotic big-head misfit avatar"><rect width="224" height="256" rx="36" fill="${bg}"/>${patterns[a.pattern]}${auras[a.aura]}<ellipse cx="112" cy="235" rx="62" ry="9" fill="#0007"/><path d="M83 184 Q75 201 76 217 M141 184 Q150 200 148 216" fill="none" stroke="${skin}" stroke-width="12" stroke-linecap="round"/>${garments[a.outfit]}${neckwear[a.neckwear]}<ellipse cx="50" cy="113" rx="15" ry="24" fill="${skin}" stroke="#241629" stroke-width="5"/><ellipse cx="174" cy="113" rx="15" ry="24" fill="${skin}" stroke="#241629" stroke-width="5"/><g fill="${skin}" stroke="#241629" stroke-width="6">${headShape}</g><g fill="${hair}" stroke="#241629" stroke-width="4" stroke-linejoin="round">${hairstyles[a.hair]}</g>${accessories[a.accessory]}${headwear[a.headwear]}<g fill="none" stroke="#39283b" stroke-width="4" stroke-linecap="round">${brows}</g>${eyeShapes[a.eyes]}${pupils}${glimmer}${eyewear[a.eyewear]}${faceMarks[a.face_mark]}${mouths[a.expression]}${piercings[a.piercing]}<path d="M199 40 l4 9 9 4 -9 4 -4 9 -4-9 -9-4 9-4z" fill="${accent}"/></svg>`;
 }
 window.KnightfallMisfitAvatars={defaults,safeAvatar,render,choices};
})();
