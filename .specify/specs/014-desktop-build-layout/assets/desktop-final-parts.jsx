// desktop-final-parts.jsx — chrome, hero, side cards, dialogs, icon picker

function SiteBar({ edit }) {
  return (
    <div className="sitebar" data-screen-label="Site header">
      <span className="sb-brand"><span className="mdi mdi-chess-rook" /> AOE4 GUIDES</span>
      <nav className="sb-nav"><span>Home</span><span className="on">Builds</span><span>My Builds</span><span>Favorites</span></nav>
      <span className="spacer"></span>
      <span className="sb-add"><span className="mdi mdi-plus" /> Add build</span>
      <div className="avatar">JB</div>
    </div>
  );
}

function Hero({ edit }) {
  const [menu, setMenu] = React.useState(false);
  React.useEffect(() => {
    if (!menu) return;
    const h = () => setMenu(false);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [menu]);
  return (
    <div className="card hero" data-screen-label="Hero">
      <div className="hero-row">
        <div className="hero-civ">
          <img className="hero-flag" src="assets/flags/ott.webp" alt="Ottomans" />
          <div className="hero-civ-txt">
            <span className="hero-civ-name">Ottomans</span>
          </div>
        </div>
        <span className="spacer"></span>
        <div className="hero-actions">
          {!edit && <span className="vote"><span className="mdi mdi-menu-up up" /><b>24</b><span className="mdi mdi-menu-down" /></span>}
          {!edit && <button className="iconbtn" title="Favorite"><span className="mdi mdi-heart-outline" /></button>}
          {edit && <button className="hero-publish"><span className="mdi mdi-cloud-upload-outline" /> Publish</button>}
          <div className="overflow-wrap">
            <button className="iconbtn" title="More" onClick={e => { e.stopPropagation(); setMenu(m => !m); }}><span className="mdi mdi-dots-vertical" /></button>
            {menu && (
              <div className="overflow-menu">
                {edit && <div className="overflow-item" onClick={() => setMenu(false)}><span className="mdi mdi-file-outline" /> Save as draft</div>}
                {edit && <div className="overflow-item danger" onClick={() => setMenu(false)}><span className="mdi mdi-undo" /> Discard changes</div>}
                {!edit && <div className="overflow-item" onClick={() => setMenu(false)}><span className="mdi mdi-share-outline" /> Share</div>}
                {!edit && <div className="overflow-item" onClick={() => setMenu(false)}><span className="mdi mdi-export-variant" /> Export</div>}
              </div>
            )}
          </div>
        </div>
      </div>
      {edit
        ? <h1 className="hero-title editable" contentEditable suppressContentEditableWarning>Ottoman — Fast Imperial (Pax Otomana rush)</h1>
        : <h1 className="hero-title">Ottoman — Fast Imperial (Pax Otomana rush)</h1>}
      <div className="chips">
        {edit
          ? <span className="chip acc"><span className="mdi mdi-pencil-outline" /> Draft</span>
          : <span className="chip acc"><span className="mdi mdi-fire" /> New</span>}
        <span className="chip"><span className="mdi mdi-trophy-outline" /> Season 11</span>
        <span className="chip"><span className="mdi mdi-map-outline" /> Closed maps</span>
        <span className="chip"><span className="mdi mdi-sword-cross" /> Fast Imperial</span>
      </div>
      {!edit && (
        <div className="hero-meta">
          <span className="author">Twister</span><span className="dot"></span>
          <span className="stat"><span className="mdi mdi-thumb-up-outline" /> 24</span>
          <span className="stat"><span className="mdi mdi-eye-outline" /> 312</span>
          <span className="dot"></span><span>2 days ago</span>
        </div>
      )}
    </div>
  );
}

function DescCard() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className={'card' + (collapsed ? ' collapsed' : '')} data-screen-label="Description">
      <div className="card-head clickable" onClick={() => setCollapsed(c => !c)}>
        <span className="mdi mdi-text-box-outline" /> Description
        <span className="spacer"></span>
        <span className={'mdi collapse-ic ' + (collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up')} />
      </div>
      {!collapsed && (
        <div className="card-body">
          <p className="bo-desc">Super greedy build order ideal for team games on closed maps. Wall up early, boom behind it, and hit Imperial before your opponents can punish the greed.</p>
        </div>
      )}
    </div>
  );
}

function VideoCard({ edit }) {
  return (
    <div className="card" data-screen-label="Video">
      <div className="card-head"><span className="mdi mdi-youtube yt-red" /> Video guide</div>
      <div className="card-body">
        {edit && (
          <React.Fragment>
            <div className="field"><input className="ctrl" defaultValue="https://youtube.com/watch?v=oT5_aXObsdQ" placeholder="https://youtube.com/watch?v=..." /></div>
            <div className="yt-valid"><span className="mdi mdi-check-circle-outline" /> Valid YouTube link</div>
          </React.Fragment>
        )}
        <div className="yt-card">
          <div className="yt-thumb"><span className="yt-play mdi mdi-play" /><span className="yt-dur">12:04</span></div>
          <div className="yt-info">
            <div className="yt-t">Ottoman Fast Imperial — full walkthrough</div>
            <div className="yt-c"><span className="mdi mdi-youtube" /> AOE4 Strategy</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditMetaRow() {
  return (
    <div className="meta-row" data-screen-label="Edit metadata">
      <div className="card">
        <div className="card-head"><span className="mdi mdi-text-box-outline" /> Build details</div>
        <div className="card-body">
          <div className="field"><label className="field-label">Description</label>
            <textarea className="ctrl" defaultValue="Super greedy build order ideal for team games on closed maps." /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><span className="mdi mdi-tag-outline" /> Classification</div>
        <div className="card-body">
          <div className="grid2">
            <div className="field"><label className="field-label">Civilization</label><select className="ctrl"><option>Ottomans</option><option>French</option><option>English</option></select></div>
            <div className="field"><label className="field-label">Season</label><select className="ctrl"><option>Season 11</option><option>Season 12</option></select></div>
            <div className="field"><label className="field-label">Map</label><select className="ctrl"><option>Closed</option><option>Any</option><option>Open</option></select></div>
            <div className="field"><label className="field-label">Strategy</label><select className="ctrl"><option>Fast Imperial</option><option>Rush</option><option>Boom</option></select></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBar({ dirty }) {
  return (
    <div className="actionbar" data-screen-label="Edit action bar">
      <div className="actionbar-in">
        <button className="btn btn-ghost">Discard</button>
        <span className="spacer"></span>
        {dirty && <span className="ab-status"><span className="mdi mdi-circle-medium" /> Unsaved changes</span>}
        <button className="btn btn-outline">Draft</button>
        <button className="btn btn-primary">Publish</button>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, text, onCancel, onOk }) {
  if (!open) return null;
  return (
    <React.Fragment>
      <div className="scrim" onClick={onCancel}></div>
      <div className="confirm-dialog" role="dialog">
        <div className="confirm-icon"><span className="mdi mdi-history" /></div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-text">{text}</div>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onOk}>Age down</button>
        </div>
      </div>
    </React.Fragment>
  );
}

function IconPicker({ open, onClose, onPick }) {
  const [tab, setTab] = React.useState('Resources');
  const [q, setQ] = React.useState('');
  React.useEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;

  let items;
  if (q.trim()) {
    const qq = q.trim().toLowerCase(); const seen = new Set();
    items = Object.values(PICKER).flat().filter(t => {
      if (seen.has(t)) return false; seen.add(t);
      return t.includes(qq) || prettyLabel(t).toLowerCase().includes(qq);
    });
  } else {
    items = PICKER[tab];
  }

  return (
    <React.Fragment>
      <div className="scrim" onMouseDown={e => e.preventDefault()} onClick={onClose}></div>
      <div className="picker-modal" role="dialog" onMouseDown={e => e.preventDefault()}>

        <div className="picker-head">
          <span className="title">Insert icon</span>
          <button className="picker-close" onClick={onClose}><span className="mdi mdi-close" /></button>
        </div>

        <div className="picker-search">
          <span className="mdi mdi-magnify" />
          <input
            placeholder="Search icons..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>

        <div className="picker-tabs">
          {Object.keys(PICKER).map(c => (
            <button key={c}
              className={'picker-tab' + (c === tab && !q ? ' on' : '')}
              onClick={() => { setTab(c); setQ(''); }}>
              {c}
            </button>
          ))}
        </div>

        <div className="picker-grid">
          {items.length ? items.map(tk => (
            <div key={tk} className="picker-item" onClick={() => onPick(tk)}>
              <img className={'ic-' + iconClass(tk)} src={RES[tk]} alt={tk} />
              <span>{prettyLabel(tk)}</span>
            </div>
          )) : <div className="picker-empty">No icons match "{q}".</div>}
        </div>

      </div>
    </React.Fragment>
  );
}

Object.assign(window, {
  SiteBar, Hero, DescCard, VideoCard, EditMetaRow, ActionBar, ConfirmDialog, IconPicker,
});
