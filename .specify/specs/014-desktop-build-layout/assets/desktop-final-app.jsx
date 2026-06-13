// desktop-final-app.jsx — state, handlers, tweaks wiring

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "view",
  "theme": "dark",
  "layout": "classic"
}/*EDITMODE-END*/;;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [items, setItems] = React.useState(INITIAL_ITEMS);
  const [dirty, setDirty] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);   // {id, title, text}
  const [picker, setPicker] = React.useState(null);     // note id
  const [focusId, setFocusId] = React.useState(null);

  const noteTokens = React.useRef({});  // id → tokens typed since last flush
  const noteEls = React.useRef({});     // id → contenteditable element
  const ageEls = React.useRef({});      // age → anchor element
  const savedRange = React.useRef(null);

  const edit = t.mode === 'edit';

  React.useEffect(() => { document.documentElement.dataset.theme = t.theme; }, [t.theme]);

  // track caret inside any note (so picker inserts at the real caret)
  React.useEffect(() => {
    const h = () => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const n = sel.anchorNode;
      for (const el of Object.values(noteEls.current)) {
        if (el && n && el.contains(n)) { savedRange.current = sel.getRangeAt(0).cloneRange(); return; }
      }
    };
    document.addEventListener('selectionchange', h);
    return () => document.removeEventListener('selectionchange', h);
  }, []);

  const flushOf = (list) => list.map(it =>
    it.kind === 'step' && noteTokens.current[it.id] != null
      ? { ...it, note: noteTokens.current[it.id] } : it);
  const resetPending = () => { noteTokens.current = {}; };

  const api = {
    noteEls, ageEls,
    clearFocus: () => setFocusId(null),
    patch: (id, p) => { setDirty(true); setItems(prev => prev.map(it => it.id === id ? { ...it, ...p } : it)); },
    noteInput: (id, tokens) => { noteTokens.current[id] = tokens; setDirty(true); },
    enterOn: (id) => {
      setItems(prev => {
        const idx = prev.findIndex(it => it.id === id);
        const l = flushOf(prev); resetPending();
        const s = { id: nid(), kind: 'step', t: '', r: {}, note: '' };
        l.splice(idx + 1, 0, s); setFocusId(s.id);
        return l;
      });
      setDirty(true);
    },
    insertAt: (idx) => {
      setItems(prev => {
        const l = flushOf(prev); resetPending();
        const s = { id: nid(), kind: 'step', t: '', r: {}, note: '' };
        l.splice(idx, 0, s); setFocusId(s.id);
        return l;
      });
      setDirty(true);
    },
    removeItem: (id) => {
      setItems(prev => { const l = flushOf(prev).filter(it => it.id !== id); resetPending(); return l; });
      setDirty(true);
    },
    askAgeDown: (id) => {
      const idx = items.findIndex(it => it.id === id);
      const it = items[idx];
      const after = items.slice(idx + 1).filter(x => x.kind === 'step').length;
      setConfirm({
        id,
        title: `Age down to ${AGE_NAME[it.age - 1]} Age?`,
        text: `This removes the ${AGE_NAME[it.age]} age-up and ${after} step${after === 1 ? '' : 's'} after it — everything from this point on. This can't be undone.`,
      });
    },
    addAgeUp: () => {
      const during = { id: nid(), kind: 'step', t: '', r: {}, note: '' };
      const after = { id: nid(), kind: 'step', t: '', r: {}, note: '' };
      setItems(prev => {
        const l = flushOf(prev); resetPending();
        const next = 2 + l.filter(x => x.kind === 'ageup').length;
        if (next > 4) return l;
        l.push({ id: nid(), kind: 'ageup', age: next }, during, { id: nid(), kind: 'reached', age: next }, after);
        return l;
      });
      setFocusId(during.id);
      setDirty(true);
    },
    openPicker: (id) => setPicker(id),
  };

  const confirmOk = () => {
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === confirm.id);
      const l = flushOf(prev).slice(0, idx); resetPending();
      return l;
    });
    setDirty(true);
    setConfirm(null);
  };

  const pickIcon = (tok) => {
    const el = noteEls.current[picker];
    if (el && RES[tok]) {
      const img = document.createElement('img');
      img.className = 'ic ic-' + iconClass(tok);
      img.setAttribute('contenteditable', 'false');
      img.src = RES[tok]; img.alt = tok;
      const space = document.createTextNode('\u00A0');
      el.focus();
      const sel = window.getSelection();
      let range = savedRange.current && el.contains(savedRange.current.startContainer)
        ? savedRange.current.cloneRange() : null;
      if (!range) { range = document.createRange(); range.selectNodeContents(el); range.collapse(false); }
      range.deleteContents();
      range.insertNode(space);
      range.insertNode(img);
      range.setStartAfter(space); range.collapse(true);
      sel.removeAllRanges(); sel.addRange(range);
      savedRange.current = range.cloneRange();
      noteTokens.current[picker] = htmlToTokens(el);
      setDirty(true);
    }
    setPicker(null);
  };

  const sidebar = t.layout === 'sidebar';
  const buildOrder = <BuildOrderCard items={items} edit={edit} api={api} focusId={focusId} />;

  return (
    <div className={'app'}>
      <SiteBar edit={edit} />
      <div className={'wrap' + (sidebar ? '' : ' narrow')}>
        <Hero edit={edit} />
        {!sidebar && (edit ? <EditMetaRow /> : <DescCard />)}
        {sidebar ? (
          <div className="grid2col">
            {buildOrder}
            <div className="aside">
              {edit ? <EditMetaRow stacked /> : <DescCard />}
              <VideoCard edit={edit} />
            </div>
          </div>
        ) : (
          <React.Fragment>
            {buildOrder}
            <VideoCard edit={edit} />
          </React.Fragment>
        )}
      </div>
      <ConfirmDialog open={!!confirm} title={confirm && confirm.title} text={confirm && confirm.text}
        onCancel={() => setConfirm(null)} onOk={confirmOk} />
      <IconPicker open={!!picker} onClose={() => setPicker(null)} onPick={pickIcon} />
      <TweaksPanel>
        <TweakSection label="Screen" />
        <TweakRadio label="Mode" value={t.mode} options={['view', 'edit']} onChange={v => setTweak('mode', v)} />
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme} options={['dark', 'light']} onChange={v => setTweak('theme', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Page" value={t.layout} options={['classic', 'sidebar']} onChange={v => setTweak('layout', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
