// desktop-final-steps.jsx — the build-order card: rows, C1 lane boundaries, inline editing
// Pull shared helpers from window (set by desktop-final-data.jsx)
const { Rich, Ri } = window;

function NoteEditor({ id, html, api }) {
  const ref = React.useRef(null);
  return (
    <div className="wys" contentEditable suppressContentEditableWarning
      data-placeholder="Describe this step — type :: or use the icon button"
      ref={el => { ref.current = el; api.noteEls.current[id] = el; }}
      dangerouslySetInnerHTML={{ __html: html }}
      onInput={e => api.noteInput(id, htmlToTokens(e.currentTarget))}
    />
  );
}

function StepRow({ s, edit, api, focusMe, prevR }) {
  const timeRef = React.useRef(null);
  React.useEffect(() => {
    if (focusMe && timeRef.current) {
      timeRef.current.focus();
      timeRef.current.select();
      api.clearFocus();
    }
  }, [focusMe]);
  return (
    <div className="bo-row" data-comment-anchor={'step-' + s.id}>
      {edit
        ? <input ref={timeRef} className="time-input" value={s.t} placeholder="m:ss" onChange={e => api.patch(s.id, { t: e.target.value })} />
        : <span className="bo-time">{s.t}</span>}
      <span className="bo-pop" title="Villagers (calculated)">{popOf(s.r)}</span>
      {SLOTS.map(k => {
        const v = s.r[k] || 0;
        const pv = prevR !== null ? (prevR[k] || 0) : v;
        const delta = prevR !== null && v !== pv ? (v > pv ? ' d-up' : ' d-down') : '';
        if (edit) {
          return <input key={k} className={'rc rc-in' + (v ? ' tint-' + k : ' empty') + delta} inputMode="numeric"
            value={v || ''} placeholder="–"
            onChange={e => {
              const n = e.target.value.replace(/\D/g, '').slice(0, 2);
              api.patch(s.id, { r: { ...s.r, [k]: n ? +n : 0 } });
            }} />;
        }
        return <div key={k} className={'rc' + (v ? ' tint-' + k : ' empty') + delta}>{v > 0 ? v : '–'}</div>;
      })}
      {edit ? (
        <div className="wys-wrap">
          <NoteEditor id={s.id} html={tokensToHtml(s.note)} api={api} />
          <button className="wys-fab" title="Insert icon" onMouseDown={e => e.preventDefault()} onClick={() => api.openPicker(s.id)}>
            <span className="mdi mdi-image-plus-outline" />
          </button>
        </div>
      ) : (
        <div className="bo-note" dangerouslySetInnerHTML={{ __html: tokensToHtml(s.note) }} />
      )}
      {edit && <button className="row-x" title="Remove step" onClick={() => api.removeItem(s.id)}><span className="mdi mdi-close" /></button>}
    </div>
  );
}

function NoteRow({ it, edit, api }) {
  return (
    <div className="bo-noterow" data-comment-anchor={'note-' + it.id}>
      <span className="mdi mdi-information-outline" />
      {edit
        ? <span className="noterow-edit" contentEditable suppressContentEditableWarning
            onInput={e => api.patch(it.id, { text: e.currentTarget.textContent })}>{it.text}</span>
        : <span dangerouslySetInnerHTML={{ __html: tokensToHtml(it.text) }} />}
      {edit && <button className="row-x" title="Remove note" onClick={() => api.removeItem(it.id)}><span className="mdi mdi-close" /></button>}
    </div>
  );
}

function AgeMarker({ it, edit, api }) {
  const src = RES['age' + it.age];
  return (
    <div className="age-marker" data-comment-anchor={'ageup-' + it.id}>
      <span className="lbl"><span className="mdi mdi-arrow-up-bold" /> Age up to {AGE_NAME[it.age]} Age</span>
      <span className="spacer"></span>
      {edit && <button className="row-x gold on" title="Age down" onClick={() => api.askAgeDown(it.id)}><span className="mdi mdi-close" /></button>}
    </div>
  );
}

function AgePlate({ it }) {
  const src = RES['age' + it.age];
  return (
    <div className="age-plate">
      {src && <img src={src} alt="" style={{width:24,height:24}} />}
      <span className="lbl">{AGE_NAME[it.age]} Age reached</span>
    </div>
  );
}

function InsertLine({ onClick }) {
  return (
    <div className="ins" onClick={onClick} title="Insert step here">
      <div className="ln" />
      <div className="pl"><span className="mdi mdi-plus" /> Step</div>
    </div>
  );
}

function LegendRow({ edit }) {
  return (
    <div className="bo-legend">
      <span className="lg"><Ri n="time" w={28} /></span>
      <span className="lg"><Ri n="villager" w={28} /></span>
      {SLOTS.map(k => <span key={k} className="lg"><Ri n={k} w={28} /></span>)}
      <span className="lg desc">Description</span>
      {edit && <span />}
    </div>
  );
}

function BuildOrderCard({ items, edit, api, focusId }) {
  const out = [];
  let i = 0;
  let prevR = null; // tracks last rendered step's resources for delta
  const pushIns = (idx, key) => { if (edit) out.push(<InsertLine key={'ins' + key} onClick={() => api.insertAt(idx)} />); };

  while (i < items.length) {
    const it = items[i];
    if (it.kind === 'ageup') {
      if (out.length) pushIns(i, i);
      const during = []; let j = i + 1;
      while (j < items.length && items[j].kind === 'step') { during.push({ it: items[j], idx: j }); j++; }
      const reachedIdx = (j < items.length && items[j].kind === 'reached') ? j : -1;
      // compute prevR sequence for during-steps
      const duringWithPrev = [];
      let lpr = prevR;
      during.forEach(d => { duringWithPrev.push({ ...d, prevR: lpr }); lpr = d.it.r; });
      prevR = lpr;
      out.push(
        <div key={it.id} className="lane-group" ref={el => { api.ageEls.current[it.age] = el; }}>
          <AgeMarker it={it} edit={edit} api={api} />
          <div className="lane">
            {duringWithPrev.map(d => (
              <React.Fragment key={d.it.id}>
                {edit && <InsertLine onClick={() => api.insertAt(d.idx)} />}
                <StepRow s={d.it} edit={edit} api={api} focusMe={focusId === d.it.id} prevR={d.prevR} />
              </React.Fragment>
            ))}
            {edit && <InsertLine onClick={() => api.insertAt(reachedIdx >= 0 ? reachedIdx : j)} />}
          </div>
          {reachedIdx >= 0 && <AgePlate it={items[reachedIdx]} />}
        </div>
      );
      i = (reachedIdx >= 0 ? reachedIdx : j - 1) + 1;
      continue;
    }
    if (it.kind === 'step') {
      if (out.length) pushIns(i, i);
      out.push(<StepRow key={it.id} s={it} edit={edit} api={api} focusMe={focusId === it.id} prevR={prevR} />);
      prevR = it.r;
    } else if (it.kind === 'note') {
      if (out.length) pushIns(i, i);
      out.push(<NoteRow key={it.id} it={it} edit={edit} api={api} />);
    }
    i++;
  }
  // trailing insert line so the hover-to-add affordance is available after the last row
  if (edit && out.length) out.push(<InsertLine key="ins-end" onClick={() => api.insertAt(items.length)} />);

  return (
    <div className="card" data-screen-label="Build order">
      <div className="card-head">
        <span className="mdi mdi-format-list-numbered" /> Build order
        <span className="spacer"></span>
        {!edit && <span className="focusbtn"><span className="mdi mdi-play" /> Focus mode</span>}
      </div>
      <div className="card-body flush">
        <div className={'bo' + (edit ? ' edit' : '')} ref={el => { api.ageEls.current[1] = el; }}>
          <LegendRow edit={edit} />
          {out}
        </div>
        {edit && (
          <div>
            <div className="append-row">
              <button className="append-btn ghost" onClick={api.addAgeUp}><span className="mdi mdi-arrow-up-bold" /> Add age-up</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BuildOrderCard });
