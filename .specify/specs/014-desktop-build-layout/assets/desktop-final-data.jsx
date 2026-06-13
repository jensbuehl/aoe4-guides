// desktop-final-data.jsx — data, tokens and serialization helpers for the desktop build prototype

const RES = {
  time:'assets/res/time.webp', villager:'assets/res/villager.webp', builder:'assets/res/builder.webp',
  food:'assets/res/food.webp', wood:'assets/res/wood.webp', gold:'assets/res/gold.webp', stone:'assets/res/stone.webp',
  sheep:'assets/res/food.webp',
  house:'assets/res/house.webp', mill:'assets/res/mill.webp', 'town-center':'assets/res/town-center.webp',
  'mining-camp':'assets/res/mining-camp.webp', 'lumber-camp':'assets/res/lumber-camp.webp', farm:'assets/res/farm.webp',
  knight:'assets/res/knight.webp', scout:'assets/res/scout.webp', horseman:'assets/res/horseman.webp',
  age2:'assets/res/age_2.webp', age3:'assets/res/age_3.webp',
};
const SLOTS = ['builder','food','wood','gold','stone'];
const AGE_NAME = { 1:'Dark', 2:'Feudal', 3:'Castle', 4:'Imperial' };
const AGE_RN   = { 1:'I', 2:'II', 3:'III', 4:'IV' };
const ICON_CLASS = {
  scout:'military', horseman:'military', knight:'military',
  age2:'none', age3:'none',
};
const iconClass = t => ICON_CLASS[t] || 'default';
const popOf = r => SLOTS.reduce((a,k)=>a + (r[k]||0), 0);

const PICKER = {
  Resources: ['food','wood','gold','stone','villager','builder'],
  Buildings: ['house','mill','town-center','mining-camp','lumber-camp','farm'],
  Military:  ['scout','horseman','knight'],
  Ages:      ['age2','age3'],
  Misc:      ['sheep'],
};
const PICKER_LABEL = { 'town-center':'Town Center', 'mining-camp':'Mining Camp', 'lumber-camp':'Lumber Camp',
  age2:'Feudal', age3:'Castle', villager:'Villager', builder:'Builder' };
const prettyLabel = t => PICKER_LABEL[t] || (t[0].toUpperCase()+t.slice(1));

let __id = 0;
const nid = () => 'it' + (++__id);

const INITIAL_ITEMS = [
  { kind:'step', t:'0:00', r:{ food:6 },                              note:'6 ::villager:: to ::sheep::. Queue a ::house::.' },
  { kind:'step', t:'0:35', r:{ food:7 },                              note:'Rally the next ::villager:: to ::sheep:: (7).' },
  { kind:'step', t:'1:10', r:{ food:7, gold:2, builder:1 },           note:'2 ::villager:: to ::gold:: — build a ::mining-camp::. 1 builds a ::mill::.' },
  { kind:'step', t:'1:55', r:{ food:7, wood:2, gold:2 },              note:'New ::villager:: to ::wood:: — drop a ::lumber-camp::.' },
  { kind:'note', text:'Keep the ::scout:: looping — you want the second ::sheep:: batch home by 2:30.' },
  { kind:'ageup', age:2 },
  { kind:'step', t:'2:10', r:{ food:7, wood:2, gold:2, builder:2 },   note:'2 ::villager:: build the ::age2:: landmark.' },
  { kind:'step', t:'2:40', r:{ food:8, wood:4, gold:2 },              note:'While aging: queue a ::house::, shift new ::villager:: to ::wood::.' },
  { kind:'reached', age:2 },
  { kind:'step', t:'3:10', r:{ food:8, wood:4, gold:4 },              note:'Back to ::gold:: with 2 ::villager::. Start ::horseman:: production.' },
  { kind:'step', t:'3:40', r:{ food:10, wood:6, gold:4, builder:2 },  note:'2 ::villager:: build the second ::town-center::.\nIdeal eco balance from here: substitute ::farm:: for ::sheep:: as they run out, and keep ::gold:: flowing for upgrades.' },
  { kind:'step', t:'4:20', r:{ food:12, wood:8, gold:6 },             note:'Add ::farm:: behind the ::mill:: as ::sheep:: run out.' },
  { kind:'note', text:'Ideal eco split before Castle: 12 / 8 / 6 — substitute farms for sheep when safe.' },
  { kind:'ageup', age:3 },
  { kind:'step', t:'5:30', r:{ food:14, wood:8, gold:8, builder:2 },  note:'2 ::villager:: on the ::age3:: landmark. Keep producing ::horseman::.' },
  { kind:'reached', age:3 },
  { kind:'step', t:'6:30', r:{ food:16, wood:10, gold:10, stone:4 },  note:'First ::villager:: to ::stone::. Switch production to ::knight::.' },
].map(o => ({ id: nid(), ...o }));

// ── ::token:: ↔ HTML (the round-trip contract) ──────────────
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function tokensToHtml(text) {
  return escapeHtml(text || '')
    .replace(/::([\w-]+)::/g, (m, t) =>
      RES[t] ? `<img class="ic ic-${iconClass(t)}" contenteditable="false" src="${RES[t]}" alt="${t}">` : m)
    .replace(/\n/g, '<br>');
}
function htmlToTokens(el) {
  let out = '';
  el.childNodes.forEach(n => {
    if (n.nodeType === 3) out += n.nodeValue;
    else if (n.nodeName === 'IMG') out += '::' + n.getAttribute('alt') + '::';
    else if (n.nodeName === 'BR') out += '\n';
    else if (n.nodeName === 'DIV') { if (out && !out.endsWith('\n')) out += '\n'; out += htmlToTokens(n); }
    else if (n.childNodes) out += htmlToTokens(n);
  });
  return out.replace(/\u00A0/g, ' ');
}

const Ri = ({ n, w = 18 }) => <img className="res-ic" style={{ width: w, height: w }} src={RES[n]} alt={n} />;

function Rich({ text, h = 28 }) {
  const parts = []; const re = /::([\w-]+)::/g; let last = 0, m, i = 0;
  while ((m = re.exec(text || ''))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<img key={i++} className={'ic ic-' + iconClass(m[1])} style={{ height: h }} src={RES[m[1]]} alt={m[1]} />);
    last = re.lastIndex;
  }
  parts.push((text || '').slice(last));
  return <React.Fragment>{parts}</React.Fragment>;
}

Object.assign(window, {
  RES, SLOTS, AGE_NAME, AGE_RN, iconClass, popOf,
  PICKER, prettyLabel, INITIAL_ITEMS, nid,
  tokensToHtml, htmlToTokens, Ri, Rich,
});
