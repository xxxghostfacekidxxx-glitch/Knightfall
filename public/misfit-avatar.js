(()=>{
 const defaults={skin:'peach',face_shape:'round',hair:'shag',hair_color:'ink',eyes:'doe',eye_color:'violet',brow_style:'soft',eye_glimmer:'none',expression:'smile',face_mark:'freckles',piercing:'none',outfit:'hoodie',outfit_color:'plum',headwear:'none',eyewear:'none',neckwear:'spike_choker',aura:'none',accessory:'none',background:'void',pattern:'sparkles',nose:'button',facial_hair:'none',makeup:'none',tattoo:'none',hair_highlight:'none',outfit_patch:'none'};
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
 for(const [field,values] of Object.entries({"nose":["button","sharp","hooked","minimal"],"facial_hair":["none","stubble","mustache","goatee","full_beard"],"makeup":["none","smoky","winged","corpse","glitter"],"tattoo":["none","teardrop","neon_sigil","cracks","serpent"],"hair_highlight":["none","pink","acid","silver","blue","crimson","teal"],"outfit_patch":["none","skull","heart","lightning","cinder"]}))choices[field]=values;
 const extraChoices={"skin":["frost","ashen","infernal"],"face_shape":["angular","oval"],"hair":["undercut","waves","locs"],"hair_color":["white","crimson","teal"],"eyes":["cat","cyber","hollow"],"eye_color":["ice","amber"],"expression":["smirk","snarl"],"face_mark":["scar","runes"],"piercing":["nose"],"outfit":["armor","punk","techwear"],"outfit_color":["teal","gold"],"accessory":["safety_pin"],"background":["eclipse","neon_city","storm"],"pattern":["runes","shards"],"headwear":["spiked_cap"],"eyewear":["cyber_lens"],"neckwear":["pendant"],"aura":["lightning"]};
 for(const [field,values] of Object.entries(extraChoices))choices[field].push(...values);
 for(const [field,values] of Object.entries({"skin":{"frost":"#d5e8f0","ashen":"#9895aa","infernal":"#a14858"},"hair_color":{"white":"#f6eef1","crimson":"#d53e65","teal":"#3bd0c7"},"eye_color":{"ice":"#a3f6ff","amber":"#ed9938"},"outfit_color":{"teal":"#167b84","gold":"#b58c35"},"background":{"eclipse":"#101423","neon_city":"#22213b","storm":"#1b263d"}}))Object.assign(palettes[field],values);
 const extraArt={"hair":{"undercut":"<path d=\"M50 112Q42 58 93 40Q160 30 177 99L156 84Q124 66 86 90L67 113Z\"/><path d=\"M77 72q38-29 77-11\" fill=\"none\" stroke=\"#fff\" opacity=\".13\" stroke-width=\"3\"/>","waves":"<path d=\"M46 143Q32 85 55 61Q83 23 115 39Q168 27 178 80L176 149L157 120Q170 95 143 77Q123 64 112 82Q85 62 71 91L64 133Z\"/><path d=\"M49 117Q31 153 51 168m121-50q19 31 1 53\" fill=\"none\" stroke-width=\"10\" stroke-linecap=\"round\"/>","locs":"<path d=\"M51 108Q38 42 109 35Q177 36 175 110L157 88Q118 65 68 90Z\"/><path d=\"M52 84q-16 32-7 85m29-92q-17 37-11 92m21-94q-9 32-12 94m74-90q14 40 7 91m11-90q18 35 14 84\" fill=\"none\" stroke-width=\"12\" stroke-linecap=\"round\"/>"},"eyes":{"cat":"<path d=\"M64 117Q82 101 101 117Q87 131 67 123l-8-13m68 7q18-17 38 0l4-9q-4 30-40 16z\" fill=\"#fff\" stroke=\"#28172f\" stroke-width=\"3\"/>","cyber":"<rect x=\"66\" y=\"109\" width=\"33\" height=\"26\" rx=\"5\" fill=\"#d4ffff\" stroke=\"#23363b\" stroke-width=\"4\"/><rect x=\"129\" y=\"109\" width=\"33\" height=\"26\" rx=\"5\" fill=\"#d4ffff\" stroke=\"#23363b\" stroke-width=\"4\"/>","hollow":"<ellipse cx=\"82\" cy=\"121\" rx=\"15\" ry=\"18\" fill=\"#130c1e\" stroke=\"#a16bdf\" stroke-width=\"3\"/><ellipse cx=\"145\" cy=\"121\" rx=\"15\" ry=\"18\" fill=\"#130c1e\" stroke=\"#a16bdf\" stroke-width=\"3\"/><circle cx=\"82\" cy=\"121\" r=\"4\" fill=\"#d0a0ff\"/><circle cx=\"145\" cy=\"121\" r=\"4\" fill=\"#d0a0ff\"/>"},"expression":{"smirk":"<path d=\"M99 152q14 6 27-9\" fill=\"none\" stroke=\"#943853\" stroke-width=\"4\" stroke-linecap=\"round\"/>","snarl":"<path d=\"M98 149q14-9 28 0l-3 11-6-4-6 5-8-5Z\" fill=\"#81344c\" stroke=\"#482031\" stroke-width=\"2\"/><path d=\"M103 147l5 8 4-8m7 0 4 8\" fill=\"#fff7f1\"/>"},"face_mark":{"scar":"<path d=\"M65 110l23 50m-20-28 13-5m-7 21 13-6\" stroke=\"#92465a\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/>","runes":"<path d=\"M65 130v22l13-12-13-10m78 0v22m-8-14 8-8 8 8-8 14\" fill=\"none\" stroke=\"#be69ed\" stroke-width=\"3\"/>"},"piercing":{"nose":"<circle cx=\"120\" cy=\"144\" r=\"3.6\" fill=\"#f2d17b\" stroke=\"#512d3c\" stroke-width=\"1.4\"/>"},"garments":{"armor":"<path d=\"M77 188Q112 172 148 188L175 249H49Z\" fill=\"@cloth\" stroke=\"#201827\" stroke-width=\"6\"/><path d=\"M72 198l27-13 13 19 13-19 27 13-14 39H86Z\" fill=\"#232a39\" stroke=\"@accent\" stroke-width=\"4\"/><path d=\"M101 206l11 10 12-10-12 34Z\" fill=\"@accent\"/><path d=\"M58 211l25-15m81 15-25-15\" stroke=\"#abb8c5\" stroke-width=\"7\"/>","punk":"<path d=\"M76 188Q112 171 148 188L170 249H54Z\" fill=\"@cloth\" stroke=\"#201827\" stroke-width=\"6\"/><path d=\"M95 188l17 26 17-26-5 58H100Z\" fill=\"#17121b\"/><path d=\"M87 189l20 19m31-19-20 19\" stroke=\"@accent\" stroke-width=\"4\"/><path d=\"M76 214l13 5-13 5m74-10-13 5 13 5\" fill=\"none\" stroke=\"#f1d8ec\" stroke-width=\"3\"/>","techwear":"<path d=\"M76 188Q112 171 148 188L172 249H52Z\" fill=\"@cloth\" stroke=\"#201827\" stroke-width=\"6\"/><path d=\"M86 188l26 18 26-18-9 61H96Z\" fill=\"#252e3c\" stroke=\"@accent\" stroke-width=\"3\"/><path d=\"M112 206v43m-30-29h20m20 0h24\" stroke=\"#a4e7df\" stroke-width=\"3\" opacity=\".7\"/><rect x=\"122\" y=\"226\" width=\"25\" height=\"12\" rx=\"2\" fill=\"#1e3c41\" stroke=\"@accent\" stroke-width=\"2\"/>"},"accessory":{"safety_pin":"<path d=\"M150 63q15-21 28-8l-8 24-19-16\" fill=\"none\" stroke=\"#ffe29b\" stroke-width=\"4\"/><circle cx=\"176\" cy=\"54\" r=\"4\" fill=\"#ff5fc7\"/>"},"pattern":{"runes":"<path d=\"M22 59v27l19-14-19-13m168 114v26l-18-14 18-12M20 183l18-21m-9 0v22M186 55l12 17-20 3Z\" fill=\"none\" stroke=\"#d2a3ff\" stroke-width=\"2.5\" opacity=\".8\"/>","shards":"<path d=\"M18 37l33-20-8 46z M184 174l26 11-24 25z M18 216l23-17 11 29Z\" fill=\"#b3fff3\" stroke=\"#e9ffff\" stroke-width=\"1.5\" opacity=\".35\"/>"},"headwear":{"spiked_cap":"<path d=\"M51 88Q67 31 116 39Q161 41 174 88L169 98Q115 86 56 101Z\" fill=\"#261b32\" stroke=\"#b4ff5a\" stroke-width=\"4\"/><path d=\"M68 51l-5-17 19 12m46-8 9-16 11 20\" fill=\"#e6e5ef\" stroke=\"#342538\" stroke-width=\"3\"/><path d=\"M60 94q59-21 118 0\" fill=\"none\" stroke=\"#ff5fc9\" stroke-width=\"4\"/>"},"eyewear":{"cyber_lens":"<path d=\"M61 106h42l8 18-13 18H61l-10-20z\" fill=\"#75ffe277\" stroke=\"#79ffe7\" stroke-width=\"4\"/><path d=\"M64 118h37m-19-8v28\" stroke=\"#e0fffa\" stroke-width=\"2\"/>"},"neckwear":{"pendant":"<path d=\"M86 178q25 22 52 0\" fill=\"none\" stroke=\"#f3d684\" stroke-width=\"3\"/><path d=\"M113 190l-8 13 8 10 8-10Z\" fill=\"#a678ee\" stroke=\"#ffe2fb\" stroke-width=\"2\"/>"},"aura":{"lightning":"<path d=\"M29 90l22-27-8 29 19-7-25 37 5-30zm166 55-24 28 9-28-18 7 26-38-6 28z\" fill=\"#c6ff45\" stroke=\"#79ffe7\" stroke-width=\"2\" opacity=\".86\"/>"}};
 const fineArt={"nose":{"button":"<path d=\"M107 137q-4 9 5 9 7-1 5-9\" fill=\"none\" stroke=\"#794955\" stroke-width=\"2.5\" opacity=\".47\" stroke-linecap=\"round\"/>","sharp":"<path d=\"M113 131l-5 12 8 3m-7-1q5 3 9-2\" fill=\"none\" stroke=\"#784758\" stroke-width=\"2.4\" opacity=\".65\" stroke-linecap=\"round\"/>","hooked":"<path d=\"M109 131q7 7 2 12-6 6 7 4\" fill=\"none\" stroke=\"#784758\" stroke-width=\"2.6\" opacity=\".65\" stroke-linecap=\"round\"/>","minimal":"<path d=\"M109 143q3 2 6 0\" fill=\"none\" stroke=\"#784758\" stroke-width=\"2\" opacity=\".32\"/>"},"facial_hair":{"none":"","stubble":"<path d=\"M82 150q-3 17 30 25 34-8 33-25m-54 14 3 4m9 1 2 4m14-4 2 3m8-7 3 3m7-13 3 3\" fill=\"none\" stroke=\"#3e2530\" opacity=\".4\" stroke-width=\"2\" stroke-linecap=\"round\"/>","mustache":"<path d=\"M109 147q-16-9-21 4 12 5 24-1 12 6 24 0-6-13-22-4z\" fill=\"#34222b\" stroke=\"#241729\" stroke-width=\"1.4\"/>","goatee":"<path d=\"M104 164q8 4 16 0l-8 15z\" fill=\"#392432\" stroke=\"#241729\" stroke-width=\"2\"/><path d=\"M105 148q-8-3-13 3m24-3q8-3 13 3\" fill=\"none\" stroke=\"#392432\" stroke-width=\"3\"/>","full_beard":"<path d=\"M68 142q-3 32 44 45 48-13 45-45l-16 19-10 5-17 10-21-10-10-8z\" fill=\"#392832\" stroke=\"#241629\" stroke-width=\"3\"/><path d=\"M97 158q15 9 30 0m-33 13 5 6m27-6-6 6\" fill=\"none\" stroke=\"#8b6278\" stroke-width=\"1.5\" opacity=\".64\"/>"},"makeup":{"none":"","smoky":"<path d=\"M63 111q20-21 39 0m24 0q20-21 39 0\" fill=\"none\" stroke=\"#3c2446\" stroke-width=\"10\" stroke-linecap=\"round\" opacity=\".65\"/>","winged":"<path d=\"M66 116l-13-10q13 5 26 1m52 0q13 5 26 1l13-10\" fill=\"none\" stroke=\"#26192d\" stroke-width=\"4\" stroke-linecap=\"round\"/>","corpse":"<path d=\"M65 111q18-18 37 0m25 0q18-18 36 0\" fill=\"none\" stroke=\"#65466e\" stroke-width=\"13\" opacity=\".6\"/><path d=\"M62 138l8 6m89-6-8 6\" stroke=\"#38263e\" stroke-width=\"4\"/>","glitter":"<g fill=\"#fd9fe7\"><circle cx=\"62\" cy=\"108\" r=\"2.5\"/><circle cx=\"69\" cy=\"102\" r=\"2\"/><circle cx=\"98\" cy=\"102\" r=\"2\"/><circle cx=\"130\" cy=\"102\" r=\"2\"/><circle cx=\"157\" cy=\"102\" r=\"2\"/><circle cx=\"165\" cy=\"109\" r=\"2.5\"/></g>"},"tattoo":{"none":"","teardrop":"<path d=\"M154 138q7 12 0 15-8-3 0-15z\" fill=\"#38223c\" stroke=\"#ac72dc\" stroke-width=\"1.5\"/>","neon_sigil":"<g fill=\"none\" stroke=\"#d460e9\" stroke-width=\"2.8\"><path d=\"M58 138l11-10 11 10-11 10zM69 129v20\"/><path d=\"M145 155l7-16 7 16m-12-7h10\"/></g>","cracks":"<path d=\"M58 125l12 11-7 9 14 11m83-38-12 15 8 8-13 15\" fill=\"none\" stroke=\"#533446\" stroke-width=\"3\" stroke-linecap=\"round\"/>","serpent":"<path d=\"M62 136q20-18 16 8-16 6-7 14 16 4 14-9m-6 0-8 1m7 7-4-3\" fill=\"none\" stroke=\"#335c52\" stroke-width=\"3.7\" stroke-linecap=\"round\"/>"},"outfit_patch":{"none":"","skull":"<g transform=\"translate(144 219)\"><circle r=\"9\" fill=\"#17141e\" stroke=\"#e4dfeb\" stroke-width=\"1.5\"/><path d=\"M-5-2h3m4 0h3M-4 4v3h8V4\" fill=\"none\" stroke=\"#eff3f3\" stroke-width=\"2\"/></g>","heart":"<path d=\"M143 225q-17-13-7-18 5-3 8 3 4-7 10-3 9 7-11 18z\" fill=\"#ff5dbd\" stroke=\"#28132d\" stroke-width=\"1.5\"/>","lightning":"<path d=\"M147 207l-11 14h9l-4 11 16-19h-10l5-6z\" fill=\"#c6ff45\" stroke=\"#231e2c\" stroke-width=\"1.5\"/>","cinder":"<path d=\"M143 203q11 15 5 24-12 8-19-5 0-9 14-19m0 10q-11 13-3 14 6 2 3-14z\" fill=\"#ff834e\" stroke=\"#272031\" stroke-width=\"1.5\"/>"}};
 let renderSequence=0;
 function render(input={}){
  const a=safeAvatar(input),skin=palettes.skin[a.skin],hair=palettes.hair_color[a.hair_color],bg=palettes.background[a.background],cloth=palettes.outfit_color[a.outfit_color],eye=palettes.eye_color[a.eye_color],accent=a.background==='toxic'?'#c6ff45':a.background==='bubblegum'?'#ff62c7':'#79ffe7';
  const headShape={angular:'<path d="M56 58Q112 24 166 58L173 126 147 170 112 183 76 170 51 125Z"/>',oval:'<ellipse cx="112" cy="114" rx="60" ry="73"/>',round:'<circle cx="112" cy="113" r="68"/>',soft_square:'<path d="M48 88Q48 45 88 45H136Q176 45 176 88V128Q176 177 112 181Q48 177 48 128Z"/>',heart_face:'<path d="M112 181Q98 171 61 132Q38 108 45 79Q53 48 83 48Q103 48 112 69Q121 48 141 48Q171 48 179 79Q186 108 163 132Q126 171 112 181Z"/>',long:'<ellipse cx="112" cy="112" rx="58" ry="76"/>'}[a.face_shape];
  const brows={none:'',soft:'<path d="M68 101q14-8 28 0m34 0q14-8 28 0"/>',raised:'<path d="M68 98q14-14 28-5m34-2q14-8 28 5"/>',bold:'<path d="M67 100q15-12 31-3m31 0q16-9 31 3" stroke-width="8"/>',sleepy:'<path d="M68 99q14-2 28 3m34-3q14-2 28 3"/>'}[a.brow_style];
  const glimmer={none:'',star:'<path d="M82 111l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z M145 111l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff"/>',double:'<circle cx="77" cy="115" r="2" fill="#fff"/><circle cx="88" cy="128" r="2" fill="#fff"/><circle cx="140" cy="115" r="2" fill="#fff"/><circle cx="151" cy="128" r="2" fill="#fff"/>',heart:'<path d="M73 112c-5-5 1-10 5-5 4-5 10 0 5 5l-5 5z M136 112c-5-5 1-10 5-5 4-5 10 0 5 5l-5 5z" fill="#fff"/>'}[a.eye_glimmer];
  const pupils=(a.eyes==='sleepy'||a.eyes==='hollow')?'':`<ellipse cx="84" cy="124" rx="6" ry="9" fill="${eye}"/><ellipse cx="143" cy="124" rx="6" ry="9" fill="${eye}"/><circle cx="85" cy="123" r="2.5" fill="#211528"/><circle cx="144" cy="123" r="2.5" fill="#211528"/>`;
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
   Object.assign(hairstyles,extraArt.hair);
   Object.assign(eyeShapes,extraArt.eyes);
   Object.assign(mouths,extraArt.expression);
   Object.assign(faceMarks,extraArt.face_mark);
   Object.assign(piercings,extraArt.piercing);
   Object.assign(accessories,extraArt.accessory);
   Object.assign(patterns,extraArt.pattern);
   Object.assign(garments,Object.fromEntries(Object.entries(extraArt.garments).map(([key,value])=>[key,value.replaceAll('@cloth',cloth).replaceAll('@accent',accent)])));
   Object.assign(headwear,extraArt.headwear);
   Object.assign(eyewear,extraArt.eyewear);
   Object.assign(neckwear,extraArt.neckwear);
   Object.assign(auras,extraArt.aura);
   const uid='kf-misfit-'+(++renderSequence);
   const shapeGlow=a.background==='toxic'?'#c6ff45':a.background==='ember'?'#ff986b':a.background==='bubblegum'?'#ff7de2':'#78efec';
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 256" role="img" aria-label="Knightfall Misfit collectible avatar">
 <defs>
  <radialGradient id="${uid}-ambient" cx="51%" cy="35%" r="79%"><stop stop-color="${shapeGlow}" stop-opacity=".46"/><stop offset=".45" stop-color="${bg}" stop-opacity=".10"/><stop offset="1" stop-color="#05030a" stop-opacity=".82"/></radialGradient>
  <linearGradient id="${uid}-skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7ed" stop-opacity=".34"/><stop offset=".27" stop-color="${skin}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="#3d2438" stop-opacity=".54"/></linearGradient>
  <linearGradient id="${uid}-hair" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff7ff" stop-opacity=".38"/><stop offset=".18" stop-color="${hair}"/><stop offset=".7" stop-color="${hair}"/><stop offset="1" stop-color="#160c1d"/></linearGradient>
  <linearGradient id="${uid}-cloth" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#fff" stop-opacity=".23"/><stop offset=".21" stop-color="${cloth}"/><stop offset=".76" stop-color="${cloth}"/><stop offset="1" stop-color="#110c19"/></linearGradient>
  <radialGradient id="${uid}-shine"><stop stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="${uid}-shadow" x="-35%" y="-35%" width="170%" height="190%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#05030c" flood-opacity=".54"/></filter>
 </defs>
 <rect width="224" height="256" rx="35" fill="${bg}"/>
 <rect width="224" height="256" rx="35" fill="url(#${uid}-ambient)"/>
 <g opacity=".27" stroke="${shapeGlow}" fill="none">
   <circle cx="112" cy="124" r="100" stroke-width=".8"/><circle cx="112" cy="124" r="90" stroke-dasharray="3 7" stroke-width="1"/>
   <path d="M16 206L62 160M165 31l40 39M17 28h26m139 196h20" stroke-width="1.5"/>
 </g>
 <path d="M12 65v-27q0-24 24-24h24m152 159v41q0 28-28 28h-28" fill="none" stroke="${shapeGlow}" stroke-width="2" opacity=".5"/>
 <circle cx="112" cy="117" r="102" fill="url(#${uid}-shine)"/>
 ${patterns[a.pattern]}${auras[a.aura]}
 <ellipse cx="112" cy="240" rx="71" ry="10" fill="#07030a" opacity=".48"/>
 <g filter="url(#${uid}-shadow)">
  <path d="M83 184Q75 201 76 217M141 184Q150 200 148 216" fill="none" stroke="${skin}" stroke-width="12" stroke-linecap="round"/>
  ${garments[a.outfit].replaceAll('fill="' + cloth + '"','fill="url(#' + uid + '-cloth)"')}
  ${fineArt.outfit_patch[a.outfit_patch]}
  <path d="M60 234q20-13 31-12m45 0q17-2 32 12" fill="none" stroke="#fff" stroke-width="1.5" opacity=".24"/>
  ${neckwear[a.neckwear]}
  <ellipse cx="50" cy="113" rx="15" ry="24" fill="${skin}" stroke="#241629" stroke-width="5"/>
  <ellipse cx="174" cy="113" rx="15" ry="24" fill="${skin}" stroke="#241629" stroke-width="5"/>
  <path d="M48 99q-13 12-3 28m134-28q13 12 3 28" fill="none" stroke="#fff5e9" stroke-width="2" opacity=".35"/>
  <g fill="url(#${uid}-skin)" stroke="#241629" stroke-width="5" stroke-linejoin="round">${headShape}</g>
  <ellipse cx="90" cy="81" rx="44" ry="28" fill="#fff" opacity=".075"/>
  <ellipse cx="73" cy="146" rx="19" ry="9" fill="#ff607e" opacity=".16"/>
  <ellipse cx="152" cy="146" rx="19" ry="9" fill="#ff607e" opacity=".16"/>
  ${fineArt.nose[a.nose]}
  <g fill="url(#${uid}-hair)" stroke="#241629" stroke-width="4" stroke-linejoin="round">${hairstyles[a.hair]}</g>
  ${a.hair_highlight==="none"?"":`<path d="M71 68q17-18 36-17m17 0q18 4 27 19" fill="none" stroke="${palettes.hair_color[a.hair_highlight]}" stroke-width="6" stroke-linecap="round" opacity=".8"/>`}
  <path d="M61 71Q82 41 120 49m15 3q15 7 23 19" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".19"/>
  ${accessories[a.accessory]}${headwear[a.headwear]}
  <g fill="none" stroke="#39283b" stroke-width="4" stroke-linecap="round">${brows}</g>
  ${fineArt.makeup[a.makeup]}${eyeShapes[a.eyes]}${pupils}
  <path d="M68 139q14 5 26 0m38 0q15 5 26 0" fill="none" stroke="#673e57" stroke-width="1.5" opacity=".33"/>
  ${glimmer}${eyewear[a.eyewear]}${faceMarks[a.face_mark]}${fineArt.tattoo[a.tattoo]}${mouths[a.expression]}${fineArt.facial_hair[a.facial_hair]}${piercings[a.piercing]}
 </g>
 <path d="M199 38l3 8 9 3-9 3-3 8-3-8-9-3 9-3z" fill="${accent}"/>
 <path d="M29 198l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${shapeGlow}" opacity=".85"/>
 <path d="M31 230h33m96-207h32" fill="none" stroke="${shapeGlow}" stroke-width="2" opacity=".65"/>
 </svg>`;
 }
 window.KnightfallMisfitAvatars={defaults,safeAvatar,render,choices,palettes};
})();
