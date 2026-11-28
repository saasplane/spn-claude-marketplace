/* RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/08-stylesheet.md § One stylesheet, served in versions
   The one script every page loads: the rail, the fold under each section, the link beside each
   heading, the reader's own time on a report, and the colour of a code block. Every class it sets or
   reads opens with sds-. */
/* THE MODE IS THE DESIGN SYSTEM'S: data-mode on the page, light or dark. A page that names none takes the reader's
   own setting, and a data-theme an older page carries is read as the same word. */
/* A PAGE OPENS AT ITS START (or at the section its address names): a reload does not restore an old position, in a window or in the index's frame. */
try{if('scrollRestoration' in history)history.scrollRestoration='manual';}catch(e){}
(function(){
  var root=document.documentElement;if(!root||root.getAttribute('data-mode'))return;
  var theme=root.getAttribute('data-theme'),dark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-mode',theme==='dark'||(theme!=='light'&&dark)?'dark':'light');
})();
/* THE RAIL OF A PAGE THAT HAS NONE: a page with no rail and three or more sections whose heads hold an h2 gets one, the same rail every other
   page has, which the lines below fill with its sections. A page with fewer sections, a page with a rail of its own and a surface page get nothing. */
(function(){
  var page=document.querySelector('.sds-page');if(!page||document.getElementById('rail')||document.querySelector('.sds-surface'))return;
  var wrap=page.querySelector('.sds-wrap');if(!wrap)return;
  var secs=Array.prototype.filter.call(wrap.children,function(s){return s.tagName==='SECTION'&&s.querySelector('h2');});
  if(secs.length<3)return;
  secs.forEach(function(s,i){if(!s.id)s.id='sds-section-'+(i+1);});
  var rail=document.createElement('nav');rail.className='sds-rail';rail.id='rail';
  var title=document.createElement('div');title.className='sds-rail-title';title.textContent=document.title;rail.appendChild(title);
  page.insertBefore(rail,wrap);page.classList.add('sds-has-rail');
})();
(function(){
  var rail=document.getElementById('rail');if(!rail)return;
  var secs=Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  var links=[];
  secs.forEach(function(s){
    var num=s.querySelector('.sds-section-head .sds-number'),h2=s.querySelector('h2');if(!h2)return;
    var a=document.createElement('a');a.href='#'+s.id;
    var n=document.createElement('span');n.className='sds-number';n.textContent=num?num.textContent:'';
    var t=document.createElement('span');t.textContent=h2.textContent.split(' — ')[0];
    a.appendChild(n);a.appendChild(t);
    if(s.id==='s4'){var c=s.querySelectorAll('.sds-open').length;if(c){var b=document.createElement('span');b.className='sds-count';b.textContent=c;a.appendChild(b);}}
    rail.appendChild(a);links.push({el:a,sec:s});
    Array.prototype.forEach.call(s.querySelectorAll('h3[id]'),function(h){
      var sa=document.createElement('a');sa.href='#'+h.id;sa.className='sds-sub';sa.textContent=h.textContent.split(' — ')[0];rail.appendChild(sa);
    });
  });
  function mark(){var y=window.scrollY+120,cur=links[0];links.forEach(function(l){if(l.sec.offsetTop<=y)cur=l;});links.forEach(function(l){l.el.classList.toggle('sds-is-current',l===cur);});}
  window.addEventListener('scroll',mark,{passive:true});mark();
})();
(function(){
  var rail = document.getElementById('rail-list') || document.getElementById('rail');
  if (!rail || rail.querySelector('.sds-sub-group')) return;
  var styled = document.getElementById('rail') || rail;

  /* The caret and the group are one state with two faces. Writing both here is what stops the
     caret claiming a section is open while its subsections are hidden. */
  function setOpen(anchor, group, open){
    group.classList.toggle('sds-is-open', open);
    anchor.classList.toggle('sds-is-open', open);
    anchor.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* Regroup whatever the page's own builder produced: a section anchor, then the `sds-sub` anchors
     that follow it, moved into one collapsing group. */
  var entries = [], current = null;
  Array.prototype.slice.call(rail.children).forEach(function(node){
    if (node.tagName !== 'A' || node.classList.contains('sds-home')) return;
    if (node.classList.contains('sds-sub')) {
      if (!current) return;
      if (!current.group) {
        current.group = document.createElement('div');
        current.group.className = 'sds-sub-group';
        rail.insertBefore(current.group, node);
      }
      current.group.appendChild(node);
      return;
    }
    current = { anchor: node, group: null };
    entries.push(current);
  });

  entries.forEach(function(entry){
    if (!entry.group) return;                     // a section with no second level never folds
    var anchor = entry.anchor, group = entry.group;
    anchor.classList.add('sds-has-subs');
    var caret = document.createElement('span');
    caret.className = 'sds-caret';
    caret.setAttribute('role', 'button');
    caret.setAttribute('tabindex', '-1');
    caret.setAttribute('aria-label', 'Show sections under ' + anchor.textContent.trim());
    anchor.appendChild(caret);
    /* The caret toggles without leaving the page; the label still navigates. Hit-testing the
       element beats measuring offsetX, which broke the moment the caret moved to the right. */
    anchor.addEventListener('click', function(event){
      if (event.target !== caret) return;
      event.preventDefault();
      /* `pinned` means a reader decided, so the scroll must stop overriding them. */
      anchor.dataset.pinned = '1';
      setOpen(anchor, group, !group.classList.contains('sds-is-open'));
    });
    setOpen(anchor, group, false);
  });

  /* THE RAIL FOLLOWS THE SCROLL. The page's own builder already marks the current entry with
     `sds-is-current`, so this watches that mark rather than measuring offsets a second time — two answers to
     where the reader is would disagree the first time either changed. */
  function follow(){
    entries.forEach(function(entry){
      if (!entry.group || entry.anchor.dataset.pinned === '1') return;
      var here = entry.anchor.classList.contains('sds-is-current') || !!entry.group.querySelector('a.sds-is-current');
      setOpen(entry.anchor, entry.group, here);
    });
  }
  new MutationObserver(follow).observe(rail, {subtree: true, attributes: true,
                                              attributeFilter: ['class']});
  /* Last, because everything above degrades to the full index when no script runs. */
  styled.classList.add('sds-has-script');
  follow();
})();
/* Every section (h2 inside .section-head) and every subsection (h3 with an id) gets an anchor link.
   Clicking it moves the address to that heading and copies the full link, so a subsection can be shared. */
(function(){
  function pageBase(){
    var ref=document.referrer||'';
    if(window.top!==window&&ref.indexOf('/artifact/')>-1)return ref.split('#')[0];
    return location.href.split('#')[0];
  }
  function attach(h,id){
    if(!id||h.querySelector('a.sds-anchor'))return;
    var a=document.createElement('a');a.className='sds-anchor';a.href='#'+id;a.textContent='#';a.title='Copy link to this heading';a.setAttribute('aria-label','Copy link to '+h.textContent.trim());
    a.addEventListener('click',function(ev){
      var url=pageBase()+'#'+id;
      try{history.replaceState(null,'',location.pathname+location.search+'#'+id);}catch(e){}
      var done=function(){a.classList.add('sds-is-copied');setTimeout(function(){a.classList.remove('sds-is-copied');},1400);};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,done);}else{done();}
      var target=document.getElementById(id);if(target){ev.preventDefault();target.scrollIntoView({block:'start'});}
    });
    h.appendChild(a);
  }
  Array.prototype.forEach.call(document.querySelectorAll('section[id]'),function(s){
    var h2=s.querySelector('.sds-section-head h2');if(!h2)return;
    if(!h2.id)h2.id=s.id+'-title';
    attach(h2,s.id);
  });
  Array.prototype.forEach.call(document.querySelectorAll('h3[id]'),function(h){attach(h,h.id);});
})();
/* Generated: shows in the reader's own time zone and format. The page keeps the moment with its offset in the
   `datetime` attribute; this renders it with the reader's locale and zone, and keeps the stored value as the
   tooltip. Where no script runs, or the value cannot be read, the stored value stays as written. */
(function(){
  Array.prototype.forEach.call(document.querySelectorAll('time.sds-local[datetime]'),function(t){
    var stored=t.getAttribute('datetime'),at=new Date(stored);
    if(isNaN(at.getTime()))return;
    try{
      t.textContent=new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(at);
      t.title=stored;
    }catch(e){}
  });
})();
/* A code block is coloured here, when the page opens. The page's file holds plain code in a `pre` tagged with
   its language, and this reads the tag. A block that already holds an element is left as it is, so a page whose
   colour was written into its file shows the same as before. A block with no language, or with one this does not
   know, is never coloured. A token the rules do not know stays plain, and is never coloured wrongly. Where no
   script runs, the block shows as plain code. */
(function(){
  var LANGS={
    ts:{keywords:'const let var function return if else for while class interface type enum export import from as await async new extends implements readonly public private void null undefined true false'.split(' '),comment:/\/\/[^\n]*|\/\*[\s\S]*?\*\//g,type:/\b[A-Z][A-Za-z0-9_]+\b/g},
    json:{keywords:['true','false','null']},
    yaml:{comment:/(^|\s)#[^\n]*/g,keywords:['true','false','null','yes','no','on','off'],type:/^[ \t]*(?:- )?[A-Za-z_][A-Za-z0-9_.\-]*(?=:)/gm},
    sql:{keywords:'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX PRIMARY KEY FOREIGN REFERENCES NOT NULL UNIQUE ON DEFAULT ALTER ADD CONSTRAINT AND OR JOIN LEFT INNER GROUP BY ORDER LIMIT'.split(' '),comment:/--[^\n]*/g},
    sh:{comment:/#[^\n]*/g},
    bash:{comment:/#[^\n]*/g},
    jsonc:{keywords:['true','false','null'],comment:/\/\/[^\n]*/g},
    tree:{},
    diff:{},
    md:{}
  };
  function esc(text){return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  /* A FILE TREE: a folder in the type colour, a file in the ink, its branches (an indent of spaces or of the box-drawing
     marks) quiet and upright, a status word that opens its note (new, changed, removed) in a diff's colours, and the rest of
     the note in the comment colour. */
  var TREE_LINE=/^([\s\u2502\u251c\u2514\u252c\u2500|`+\\-]*?)([^\s\u2502\u251c\u2514\u252c\u2500]\S*)(?:(\s{2,})(\S.*))?$/;
  var STATUS={'new':'sds-tk-add','added':'sds-tk-add','changed':'sds-tk-n','moved':'sds-tk-n','removed':'sds-tk-del','deleted':'sds-tk-del'};
  function isTree(code){
    var lines=code.replace(/\n+$/,'').split('\n');
    if(!lines.length||!/\/$/.test(lines[0].trim()))return false;
    return lines.every(function(line){return !line.trim()||TREE_LINE.test(line);});
  }
  function colourTree(code){
    return code.split('\n').map(function(line){
      var m=TREE_LINE.exec(line);
      if(!m||!line.trim())return esc(line);
      var branch=/[^\s]/.test(m[1])?'<span class="sds-tk-g">'+esc(m[1])+'</span>':esc(m[1]);
      var name=/\/$/.test(m[2])?'<span class="sds-tk-t">'+esc(m[2])+'</span>':esc(m[2]);
      var note='';
      if(m[4]){
        var s=/^(\S+)(\s{2,})(\S.*)$/.exec(m[4]);
        note=esc(m[3])+(s&&STATUS[s[1].toLowerCase()]?'<span class="'+STATUS[s[1].toLowerCase()]+'">'+esc(s[1])+'</span>'+esc(s[2])+'<span class="sds-tk-c">'+esc(s[3])+'</span>':(STATUS[m[4].trim().toLowerCase()]?'<span class="'+STATUS[m[4].trim().toLowerCase()]+'">'+esc(m[4])+'</span>':'<span class="sds-tk-c">'+esc(m[4])+'</span>'));
      }
      return branch+name+note;
    }).join('\n');
  }
  function colour(code,lang){
    if(lang==='tree')return colourTree(code);
    var spec=LANGS[lang];
    if(lang==='diff'){
      return code.split('\n').map(function(line){
        if(line.charAt(0)==='+')return '<span class="sds-tk-add">'+esc(line)+'</span>';
        if(line.charAt(0)==='-')return '<span class="sds-tk-del">'+esc(line)+'</span>';
        return esc(line);
      }).join('\n');
    }
    /* Every span is held aside behind a marker and put back at the end. A pass that ran over markup it had
       just written would colour its own output: `class` is a TypeScript keyword, and it is also in every span.
       The marker is the SUB character around letters, never digits, because the number rule would match a digit. */
    var SEP=String.fromCharCode(26),held=[];
    function marker(index){
      var letters='',n=index+1;
      while(n>0){letters=String.fromCharCode(97+((n-1)%26))+letters;n=Math.floor((n-1)/26);}
      return SEP+letters+SEP;
    }
    function hold(cls,text){held.push('<span class="'+cls+'">'+esc(text)+'</span>');return marker(held.length-1);}
    function keep(cls,escaped){held.push('<span class="'+cls+'">'+escaped+'</span>');return marker(held.length-1);}
    var out=code;
    /* Comments and strings come out first, so a keyword inside one is never coloured as code. */
    if(spec.comment)out=out.replace(spec.comment,function(match){return hold('sds-tk-c',match);});
    out=out.replace(/'[^'\n]*'|"[^"\n]*"|`[^`\n]*`/g,function(match){return hold('sds-tk-s',match);});
    out=esc(out);
    out=out.replace(/\b\d+(?:\.\d+)?\b/g,function(match){return keep('sds-tk-n',match);});
    if(spec.keywords&&spec.keywords.length){
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp -- pattern built from this script's own constants and escaped text, never outside input
      var words=new RegExp('\\b('+spec.keywords.map(function(word){return word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|')+')\\b','g');
      out=out.replace(words,function(match){return keep('sds-tk-k',match);});
    }
    if(spec.type)out=out.replace(spec.type,function(match){return keep('sds-tk-t',match);});
    return out.replace(new RegExp(SEP+'([a-z]+)'+SEP,'g'),function(whole,letters){
      var index=0;
      for(var i=0;i<letters.length;i++)index=index*26+(letters.charCodeAt(i)-96);
      return held[index-1];
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('pre[data-lang]'),function(pre){
    var lang=pre.getAttribute('data-lang');
    if(lang==='text'&&isTree(pre.textContent))lang='tree';
    if(!LANGS[lang]||pre.children.length)return;
    pre.innerHTML=colour(pre.textContent,lang);
  });
})();

/* The sticky card: mark the chip whose arc is on screen. The row of chips never scrolls by itself; it moves only
   when the person scrolls it. */
(function(){
  var bar=document.querySelectorAll('.sds-footbar-chips')[0];
  if(!bar)return;
  var chips=Array.prototype.slice.call(bar.querySelectorAll('a.sds-chip'));
  var pending=false,current=null;
  function mark(){
    pending=false;
    var floor=window.innerHeight-bar.parentNode.offsetHeight,centre=floor/2,best=null,bestDistance=Infinity;
    chips.forEach(function(chip){
      var target=document.getElementById(chip.getAttribute('href').slice(1));
      if(!target)return;
      var box=target.getBoundingClientRect();
      if(box.bottom<=0||box.top>=floor)return;
      var distance=Math.abs((box.top+box.bottom)/2-centre);
      if(distance<bestDistance){best=chip;bestDistance=distance;}
    });
    if(best===current)return;
    if(current)current.classList.remove('sds-here');
    current=best;
    if(!best)return;
    best.classList.add('sds-here');
  }
  var cells=Array.prototype.slice.call(bar.parentNode.querySelectorAll('a.sds-chip,.sds-footbar-summary'));
  var pop=document.createElement('div');pop.className='sds-tip-pop';pop.setAttribute('aria-hidden','true');pop.hidden=true;document.body.appendChild(pop);
  function show(cell){
    var tip=cell.querySelector('.sds-tip');if(!tip)return;
    pop.innerHTML=tip.innerHTML;pop.hidden=false;
    var box=cell.getBoundingClientRect(),width=pop.offsetWidth,height=pop.offsetHeight;
    var left=Math.min(Math.max(8,box.left+box.width/2-width/2),window.innerWidth-width-8);
    var top=box.top-height-6;if(top<8)top=box.bottom+6;
    pop.style.left=left+'px';pop.style.top=top+'px';
  }
  function hide(){pop.hidden=true;}
  cells.forEach(function(cell){
    cell.addEventListener('mouseenter',function(){show(cell);});
    cell.addEventListener('focus',function(){show(cell);});
    cell.addEventListener('mouseleave',hide);
    cell.addEventListener('blur',hide);
  });
  document.addEventListener('keydown',function(event){if(event.key==='Escape')hide();});
  bar.addEventListener('scroll',hide,{passive:true});
  function ask(){if(!pending){pending=true;window.requestAnimationFrame(mark);}}
  window.addEventListener('scroll',ask,{passive:true});
  window.addEventListener('resize',ask);
  mark();
})();

/* THE RAIL ON A NARROW PAGE folds into a menu under the title: the rail moves under the masthead, and its title becomes a button that opens it. */
(function(){
  var rail=document.getElementById('rail');var page=rail&&rail.closest('.sds-page');if(!page)return;
  var wrap=page.querySelector('.sds-wrap');if(!wrap)return;
  var toggle=document.createElement('button');toggle.type='button';toggle.className='sds-rail-toggle';toggle.setAttribute('aria-expanded','false');toggle.textContent='On this page';
  rail.insertBefore(toggle,rail.firstChild);
  toggle.addEventListener('click',function(){var open=rail.classList.toggle('sds-is-open');toggle.setAttribute('aria-expanded',String(open));});
  rail.addEventListener('click',function(e){if(e.target.closest('a')){rail.classList.remove('sds-is-open');toggle.setAttribute('aria-expanded','false');}});
  var narrow=window.matchMedia?window.matchMedia('(max-width: 69rem)'):null;
  function place(){
    var head=wrap.querySelector('.sds-masthead');
    if(narrow&&narrow.matches&&head)head.parentNode.insertBefore(rail,head.nextSibling);else if(rail.parentNode!==page)page.insertBefore(rail,wrap);
  }
  place();if(narrow&&narrow.addEventListener)narrow.addEventListener('change',place);
})();
/* THE DOCS DESIGN LANGUAGE'S BEHAVIOUR: the mode switch, a stepped figure's Next and Back, a figure's motion (30% in view, pausing off screen),
   and a narrow figure's tap to open at full size. */
/* The page's two small helpers: the light/dark switch, and the step-through of a stepped figure. */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('[data-dl-mode]');
  var chosen = false;
  if (btn) btn.addEventListener('click', function () {
    var next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-mode', next);
    btn.textContent = next === 'dark' ? 'Light' : 'Dark';
    chosen = true;
  });
  // The page follows a change of the reader's system setting while it is open, as the index around it does, until the reader
  // picks a mode with the switch; a page that names its own mode in its markup keeps it.
  // The index that holds this page in a frame sends the mode its reader picked; only the page's own parent is heard, and the
  // page then holds that mode as a reader's choice.
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (event.source !== window.parent || window.parent === window || !data || data.sds !== 'mode') return;
    if (data.mode !== 'light' && data.mode !== 'dark') return;
    root.setAttribute('data-mode', data.mode);
    chosen = true;
    if (btn) btn.textContent = data.mode === 'dark' ? 'Light' : 'Dark';
  });
  var named = root.getAttribute('data-theme') === 'dark' || root.getAttribute('data-theme') === 'light';
  if (!named && window.matchMedia) {
    var ask = window.matchMedia('(prefers-color-scheme: dark)');
    if (ask.addEventListener) ask.addEventListener('change', function () {
      if (!chosen) root.setAttribute('data-mode', ask.matches ? 'dark' : 'light');
    });
  }
  document.querySelectorAll('[data-dl-stepped]').forEach(function (fig) {
    var units = fig.querySelectorAll('[data-dl-step]');
    var n = 0, at = 0;
    units.forEach(function (u) { n = Math.max(n, +u.getAttribute('data-dl-step')); });
    var prev = fig.querySelector('[data-dl-prev]'), next = fig.querySelector('[data-dl-next]'), say = fig.querySelector('[data-dl-at]');
    function show() {
      units.forEach(function (u) { u.classList.toggle('dl-off', at !== 0 && +u.getAttribute('data-dl-step') !== at); });
      prev.disabled = at === 0; next.disabled = at === n;
      say.textContent = at === 0 ? 'All at rest' : 'Step ' + at + ' of ' + n;
    }
    prev.addEventListener('click', function () { at = Math.max(0, at - 1); show(); });
    next.addEventListener('click', function () { at = Math.min(n, at + 1); show(); });
    show();
  });
  // fit and tap: a figure narrower than its frame shows as a preview, the whole figure a button, and opens full-screen at 1:1
  var dlg;
  function dialog() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog'); dlg.className = 'dl-full'; dlg.setAttribute('aria-label', 'Figure at full size');
    dlg.innerHTML = '<button type="button" class="dl-full-close" aria-label="Close the full view">Close</button><p class="dl-full-hint">Turn the phone to see it larger.</p><div class="dl-full-pan"></div>';
    dlg.querySelector('.dl-full-close').addEventListener('click', function () { dlg.close(); });
    document.body.appendChild(dlg);
    return dlg;
  }
  document.querySelectorAll('.dl-frame').forEach(function (f) {
    var s = f.querySelector('svg.dl-svg'); if (!s) return;
    var mark = document.createElement('span'); mark.className = 'dl-expand'; mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/></svg>';
    f.appendChild(mark);
    function sync() {
      var narrow = f.clientWidth < s.viewBox.baseVal.width - 1;
      f.classList.toggle('dl-preview', narrow);
      if (narrow) { f.setAttribute('role', 'button'); f.setAttribute('tabindex', '0'); f.setAttribute('aria-label', 'Open the figure at full size'); }
      else { f.removeAttribute('role'); f.removeAttribute('tabindex'); f.removeAttribute('aria-label'); }
    }
    function open() {
      if (!f.classList.contains('dl-preview')) return;
      var d = dialog(), pan = d.querySelector('.dl-full-pan'), copy = s.cloneNode(true);
      copy.removeAttribute('data-motion'); copy.querySelectorAll('.dl-drawing').forEach(function (w) { w.classList.remove('dl-drawing'); w.style.strokeDasharray = ''; w.style.strokeDashoffset = ''; });
      copy.querySelectorAll('.dl-pulse-dot').forEach(function (x) { x.remove(); });
      pan.textContent = ''; pan.appendChild(copy);
      d.addEventListener('close', function back() { d.removeEventListener('close', back); f.focus(); });
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      d.querySelector('.dl-full-close').focus();
      try { pan.scrollLeft = Math.max(0, copy.getBBox().x); } catch (e) {}
    }
    sync(); window.addEventListener('resize', sync);
    f.addEventListener('click', open);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  // figure motion (the figure's spec says: data-motion = draw-once | pulse). As on saasplane.ai's SiteDrawing: it starts once
  // 30% of the figure is in view, a loop pauses off screen, and print, PDF and reduced motion show the figure finished.
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var printing = false;
  window.addEventListener('beforeprint', function () { printing = true; document.querySelectorAll('svg[data-motion]').forEach(finish); });
  function wires(svg, solidOnly) { return [].slice.call(svg.querySelectorAll('path.dl-wire, path.dl-wire-on')).filter(function (w) { return !solidOnly || !w.classList.contains('dl-wire-dash'); }); }
  function finish(svg) {
    svg.querySelectorAll('.dl-drawing').forEach(function (w) { w.classList.remove('dl-drawing'); w.style.strokeDasharray = ''; w.style.strokeDashoffset = ''; w.style.transition = ''; });
    svg.querySelectorAll('.dl-pulse-dot').forEach(function (d) { d.remove(); });
    svg.__stop = true;
  }
  // The site's own values (saasplane.ai media css, ab-08-2 build-evolvable): a wire draws over 2.4s on cubic-bezier(.4,0,.2,1) after .3s, and
  // the drawings that stagger their lines step the delay by .57s (1.13s, 1.70s, 2.27s).
  var DRAW = 2400, START = 300, STEP = 570;
  function drawOnce(svg) {
    var ws = wires(svg, true);
    ws.forEach(function (w) { var L = w.getTotalLength(); w.classList.add('dl-drawing'); w.style.strokeDasharray = L + ' ' + L; w.style.strokeDashoffset = L; });
    return function play() {
      ws.forEach(function (w, i) {
        var L = w.getTotalLength();
        setTimeout(function () {
          if (svg.__stop) return;
          w.style.transition = 'stroke-dashoffset ' + DRAW + 'ms cubic-bezier(.4,0,.2,1)'; w.style.strokeDashoffset = 0;
          setTimeout(function () { w.classList.remove('dl-drawing'); w.style.strokeDasharray = ''; w.style.strokeDashoffset = ''; w.style.transition = ''; }, DRAW + 100);
        }, START + i * STEP);
      });
    };
  }
  function pulse(svg) {
    var ws = wires(svg, false).filter(function (w) { return w.getAttribute('data-dl-flow'); }).sort(function (a, b) { return a.getAttribute('data-dl-flow') - b.getAttribute('data-dl-flow'); });
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'dl-dot dl-pulse-dot'); dot.setAttribute('r', '3.5'); svg.appendChild(dot);
    var running = false, visible = false, i = 0, t0 = 0;
    // The site's loops (ab-01 .. ab-09 animateMotion): a period of 12s with keyTimes 0;0.32;1, so the light travels the whole path in the first
    // 32% (3.84s, linear) and rests the other 8.16s. Here the light crosses the figure's wires in turn within that travel, by their length.
    var PERIOD = 12000, TRAVEL = 3840;
    var lens = ws.map(function (w) { return w.getTotalLength(); }), total = lens.reduce(function (s, v) { return s + v; }, 0) || 1;
    function frame(now) {
      if (svg.__stop || !visible) { running = false; return; }
      if (!t0) t0 = now;
      var e = (now - t0) % PERIOD;
      if (e < TRAVEL) {
        var at = e / TRAVEL * total, k = 0;
        while (k < ws.length - 1 && at > lens[k]) { at -= lens[k]; k++; }
        var pt = ws[k].getPointAtLength(Math.min(at, lens[k]));
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.style.opacity = 1;
      } else dot.style.opacity = 0;
      requestAnimationFrame(frame);
    }
    dot.style.opacity = 0;
    return { start: function () { visible = true; if (!running) { running = true; t0 = 0; requestAnimationFrame(frame); } }, stop: function () { visible = false; } };
  }
  document.querySelectorAll('svg[data-motion]').forEach(function (svg) {
    if (still || !('IntersectionObserver' in window)) return;
    var kind = svg.getAttribute('data-motion'), actor;
    if (kind === 'draw-once') actor = { play: drawOnce(svg) }; else if (kind === 'pulse') actor = pulse(svg); else return;
    var started = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var inView = e.isIntersecting && e.intersectionRatio >= 0.3;
        if (kind === 'draw-once') { if (inView && !started && !printing) { started = true; actor.play(); } }
        else if (inView && !printing) actor.start(); else actor.stop();
      });
    }, { threshold: [0, 0.3] }).observe(svg);
  });
  // reduced motion and print: a character holds its finished pose
  function hold() { document.querySelectorAll('svg.dl-svg').forEach(function (s) { if (s.pauseAnimations) { s.pauseAnimations(); s.setCurrentTime(0); } }); }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) hold();
  window.addEventListener('beforeprint', hold);
})();

/* A COMMAND FRAME. A guide step's command (`.sds-step > pre`), or any block tagged `data-run`, stands in a frame: a head saying where it
   runs (Terminal, unless the block says `data-run="claude"`) with a copy button, then each command line with its `$` prompt kept apart
   from the command (the prompt is a mark, never selected or copied), then the step's "What you see" joined below in the same frame. */
(function () {
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // Every frame's head ends the same way: its tag, then this copy button. The mark is the index's own (lucide copy), and a check
  // while the text is on the clipboard; its words are its title and label.
  var COPY = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
  var DONE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>';
  function copyButton(text, label) {
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'sds-cmd-copy'; copy.innerHTML = COPY; copy.title = 'Copy';
    copy.setAttribute('aria-label', label);
    copy.addEventListener('click', function () {
      var done = function () { copy.innerHTML = DONE; copy.title = 'Copied'; copy.classList.add('sds-is-copied'); setTimeout(function () { copy.innerHTML = COPY; copy.title = 'Copy'; copy.classList.remove('sds-is-copied'); }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text()).then(done, done); else done();
    });
    return copy;
  }
  // A file frame (a file, a unit) gains the button at the end of its head: it copies the frame's code.
  Array.prototype.slice.call(document.querySelectorAll('figure.sds-file > figcaption')).forEach(function (cap) {
    var figure = cap.parentNode, code = figure.querySelector('pre');
    if (!code || cap.querySelector('.sds-cmd-copy')) return;
    // A code frame that folds holds a second block behind its fold; the button copies every block, whole.
    cap.appendChild(copyButton(function () { return Array.prototype.map.call(figure.querySelectorAll('pre'), function (pre) { return pre.textContent; }).join('\n'); }, 'Copy the code'));
  });
  // A block tagged sh or bash is framed too when it holds commands; a script (a line that opens or closes a branch or a loop) stays
  // a plain code block, since a prompt on each line of a script would be wrong. The colouring before this ran on its text, so the
  // text is read again from the block.
  var SCRIPT = /^\s*(if|then|else|elif|fi|for|while|until|do|done|case|esac|function)\b|\{\s*$|^\s*\}/;
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.sds-step > pre, pre[data-run], pre[data-lang="sh"], pre[data-lang="bash"]'));
  blocks.forEach(function (pre) {
    if (pre.closest('.sds-cmd-frame') || pre.closest('figure.sds-file')) return;
    var tagged = pre.getAttribute('data-lang') === 'sh' || pre.getAttribute('data-lang') === 'bash';
    if (!tagged && pre.children.length) return;
    if (tagged && !pre.hasAttribute('data-run') && pre.textContent.split('\n').some(function (l) { return SCRIPT.test(l); })) return;
    var lines = pre.textContent.replace(/\n+$/, '').split('\n');
    var commands = [];
    pre.innerHTML = lines.map(function (line) {
      if (!line.trim()) return '';
      if (/^\s*#/.test(line)) return '<span class="sds-tk-c">' + esc(line) + '</span>';
      var m = /^(.*?\S)(\s{2,}#.*)?$/.exec(line);
      commands.push(m[1]);
      return '<span class="sds-prompt" aria-hidden="true">$ </span><span class="sds-cmd">' + esc(m[1]) + '</span>' + (m[2] ? '<span class="sds-tk-c">' + esc(m[2]) + '</span>' : '');
    }).join('\n');
    var frame = document.createElement('div'); frame.className = 'sds-cmd-frame';
    var head = document.createElement('div'); head.className = 'sds-cmd-head';
    var where = document.createElement('span'); where.className = 'sds-file-path'; where.textContent = pre.getAttribute('data-run') === 'claude' ? 'Claude in VS Code' : 'Terminal';
    var tag = document.createElement('span'); tag.className = 'sds-file-lang'; tag.textContent = pre.getAttribute('data-run') === 'claude' ? 'claude' : 'sh';
    head.appendChild(where); head.appendChild(tag); head.appendChild(copyButton(function () { return commands.join('\n'); }, 'Copy the command'));
    pre.parentNode.insertBefore(frame, pre);
    frame.appendChild(head); frame.appendChild(pre);
    var see = frame.nextElementSibling;
    if (see && see.classList.contains('sds-step-see')) frame.appendChild(see);
  });
})();

/* THE SURFACE PAGE: the bar's switches, and the frame's document. The page's markup stands in one `<template id="page-<MODE>-<DEVICE>">`
   for each device and mode that was rendered, and on a page with cases one `<template id="page-<CASE>-<MODE>-<DEVICE>">` for each other case,
   which the Case switch picks and `#case-<case>` opens; the switches pick the template for the choice and swap the frame's markup, and where there is none
   for it they restyle the nearest one only (mode on the frame's `<html>`, width on the frame). The frame's document holds the template's
   markup and nothing else, linking `design-system.css` from the folder this script was served from (the cut of the design system that
   `<meta name="surface-ds">` names) and the app's stylesheet at the path `<meta name="surface-app-css">` names. Notes live outside the page, in
   `<script type="application/json" id="sample-notes">`, a list of { n, kind, case, status, text }, `n` the place of a top-level section
   counted from 0, or on a page with cases an object of such a list for each case; a note is a number, a short title and one plain sentence, with no link; the Notes switch opens a panel beside the stage and puts a small numbered badge over each section's top-left, and does neither when off. A `#<id>` in
   the page's address scrolls the frame to that element. The choice is kept in this browser (05-pages.md, The surface preview). */
(function () {
  var root = document.querySelector('.sds-surface'); if (!root) return;
  var frame = root.querySelector('.sds-surface-frame');
  var stage = root.querySelector('.sds-surface-stage');
  var layer = root.querySelector('.sds-surface-notes');
  var panel = root.querySelector('.sds-surface-panel');
  var state = { width: 'desktop', mode: 'light', notes: false };
  try { var kept = JSON.parse(localStorage.getItem('sds-surface') || '{}'); for (var k in state) if (k in kept) state[k] = kept[k]; } catch (e) {}
  // The Case switch: the page's cases as tabs, the default first; the chosen case is the page's, never kept across pages.
  var caseButtons = Array.prototype.slice.call(root.querySelectorAll('[data-surface="case"]'));
  var CASES = caseButtons.map(function (b) { return b.getAttribute('data-value'); });
  function caseHash(key) { return 'case-' + String(key).toLowerCase().replace(/_/g, '-'); }
  function caseFromHash() { var h = decodeURIComponent((location.hash || '').slice(1)); for (var i = 0; i < CASES.length; i++) if (caseHash(CASES[i]) === h) return CASES[i]; return null; }
  var chosen = caseFromHash() || CASES[0] || '';
  function meta(name) { var m = document.querySelector('meta[name="' + name + '"]'); return m ? (m.getAttribute('content') || '').trim() : ''; }
  function attr(text) { return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function text(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var own = document.querySelector('script[src*="docs-page.js"]');
  var folder = own ? own.getAttribute('src').replace(/[^\/]*$/, '') : '';
  var appCss = meta('surface-app-css');
  var allNotes = []; try { var nj = document.getElementById('sample-notes'); allNotes = nj ? JSON.parse(nj.textContent || '[]') : []; } catch (e) {}
  function notesFor() { return Array.isArray(allNotes) ? allNotes : (allNotes && allNotes[chosen]) || []; }
  var notes = notesFor();
  var templates = Array.prototype.slice.call(document.querySelectorAll('template[id^="page-"], template#page'));
  var DEVICE = { desktop: 'DESKTOP', tablet: 'TABLET', phone: 'PHONE' };
  // The template for the choice: the exact one, else the same device in the other mode, else the other devices in the same mode, else any.
  function pick() {
    var mode = state.mode.toUpperCase(), device = DEVICE[state.width] || 'DESKTOP';
    var prefix = chosen && chosen !== CASES[0] ? 'page-' + chosen + '-' : 'page-';
    function by(id) { return document.getElementById(id) && document.getElementById(id).tagName === 'TEMPLATE' ? document.getElementById(id) : null; }
    var found = by(prefix + mode + '-' + device) || by(prefix + (mode === 'LIGHT' ? 'DARK' : 'LIGHT') + '-' + device);
    for (var i = 0; i < templates.length && !found; i++) if (templates[i].id.indexOf(prefix + mode + '-') === 0) found = templates[i];
    return found || by(prefix + 'LIGHT-DESKTOP') || templates[0] || null;
  }
  var shown = null;
  function pageDocument(template) {
    return '<!doctype html><html lang="en" data-mode="' + state.mode + '"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<link rel="stylesheet" href="' + attr(folder + 'design-system.css') + '">' +
      (appCss && appCss.charAt(0) !== '{' ? '<link rel="stylesheet" href="' + attr(appCss) + '">' : '') +
      '<style>html,body{margin:0}body{background:var(--surface,var(--background));color:var(--foreground)}</style></head><body>' +
      (template ? template.innerHTML : '') + '</body></html>';
  }
  function inner() { try { return frame.contentDocument && frame.contentDocument.documentElement ? frame.contentDocument : null; } catch (e) { return null; } }
  // The top-level sections of the page, in order: the section containers that stand in no other section, within the page's own roots
  // (`[data-layout-page]`, else `[data-ds-page]`); where a root holds none, its children are the sections.
  function sections(doc) {
    var all = '[data-layout-page],[class*="&>[data-item-head]"]';
    var roots = Array.prototype.filter.call(doc.querySelectorAll(all), function (e) { return !e.parentElement.closest(all); });
    if (!roots.length) roots = Array.prototype.slice.call(doc.querySelectorAll('[data-ds-page]'));
    var out = [];
    roots.forEach(function (r) {
      var q = Array.prototype.filter.call(r.querySelectorAll('[data-slot=section-container]'), function (e) {
        var up = e.parentElement.closest('[data-slot=section-container]'); return up === null || !r.contains(up);
      });
      if (q.length) { out = out.concat(q); return; }
      var k = Array.prototype.slice.call(r.children);
      if (k.length === 1 && k[0].hasAttribute('data-place')) k = Array.prototype.slice.call(k[0].children);
      out = out.concat(k);
    });
    return out;
  }
  var WIDTHS = { desktop: 1440, tablet: 768, phone: 390 };
  var scale = 1, left = 0;
  // The frame takes the stage's whole width: the device's width is scaled to fit it, never above 1, centred, so the right edge is never cropped.
  function fit() {
    var w = WIDTHS[state.width] || WIDTHS.desktop, room = stage.clientWidth, high = stage.clientHeight;
    scale = Math.min(1, room / w);
    frame.style.width = w + 'px';
    frame.style.height = (high / scale) + 'px';
    frame.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    left = Math.max(0, (room - w * scale) / 2);
    frame.style.marginLeft = left + 'px';
  }
  // A note's short title: the kind's name and, where it matters, its case in words.
  function words(w) { w = String(w || '').replace(/[-_]+/g, ' ').trim(); return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''; }
  function title(note) { return [words(note.kind), note.case ? String(note.case).trim() : ''].filter(Boolean).join(' \u00b7 '); }
  var NOTICE = 'All words, names, dates and figures on this page are sample values.';
  // Notes opens a panel beside the stage (a sheet under it on a narrow window), solid, listing the notes in order; the page itself carries
  // only a small numbered badge at each section's top-left, in the page's side room. A note scrolls the frame to its section.
  function drawNotes() {
    panel.hidden = !state.notes; layer.hidden = !state.notes; layer.textContent = '';
    if (!state.notes) { panel.textContent = ''; return; }
    if (!panel.firstChild) {
      var html = '<p>' + text(NOTICE) + '</p><ol>';
      notes.forEach(function (note, i) {
        var line = text(String(note.text || '').split(NOTICE).join('').trim());
        html += '<li data-note="' + i + '"><b>' + (i + 1) + '</b><strong title="' + attr(title(note)) + '">' + text(title(note)) + '</strong>' + (line ? '<span>' + line + '</span>' : '') + '</li>';
      });
      panel.innerHTML = html + '</ol>';
    }
    var doc = inner(); if (!doc || !notes.length) return;
    var list = sections(doc), badges = '';
    notes.forEach(function (note, i) {
      var section = list[note.n | 0]; if (!section) return;
      var box = section.getBoundingClientRect(), top = box.top * scale + 3;
      if (top + 20 < 0 || top > stage.clientHeight) return;
      badges += '<span class="sds-surface-badge" data-note="' + i + '" style="top:' + Math.max(3, top) + 'px;left:' + (left + Math.max(0, box.left) * scale + 3) + 'px">' + (i + 1) + '</span>';
    });
    layer.innerHTML = badges;
  }
  // A `#<id>` scrolls the frame to the element of that id; failing that, to the first section whose note's kind is that word.
  function anchor() {
    var doc = inner(), id = decodeURIComponent((location.hash || '').slice(1)); if (!doc || !id) return;
    var el = doc.getElementById(id);
    if (!el) { var list = sections(doc); for (var i = 0; i < notes.length && !el; i++) if (notes[i].kind === id) el = list[notes[i].n | 0]; }
    if (el && el.scrollIntoView) el.scrollIntoView();
  }
  function set() {
    var doc = inner(); if (!doc) return;
    doc.documentElement.setAttribute('data-mode', state.mode);
    drawNotes();
  }
  function apply() {
    root.setAttribute('data-width', state.width);
    panel.hidden = !state.notes;
    fit();
    Array.prototype.forEach.call(root.querySelectorAll('[data-surface]'), function (b) {
      var key = b.getAttribute('data-surface'), value = b.getAttribute('data-value');
      if (key === 'case') { b.setAttribute('aria-selected', String(chosen === value)); b.setAttribute('aria-pressed', String(chosen === value)); return; }
      b.setAttribute('aria-pressed', String(key === 'notes' ? state.notes : state[key] === value));
    });
    try { localStorage.setItem('sds-surface', JSON.stringify(state)); } catch (e) {}
    var want = pick();
    if (want !== shown) { shown = want; frame.srcdoc = pageDocument(want); } else set();
  }
  addEventListener('resize', function () { fit(); drawNotes(); });
  addEventListener('hashchange', function () {
    var c = caseFromHash();
    if (c && c !== chosen) { chosen = c; notes = notesFor(); panel.textContent = ''; apply(); return; }
    anchor();
  });
  root.addEventListener('click', function (e) {
    var n = e.target.closest('[data-note]');
    if (n) {
      var i = +n.getAttribute('data-note'), doc = inner();
      if (n.classList.contains('sds-surface-badge')) { var item = panel.querySelector('li[data-note="' + i + '"]'); if (item) item.scrollIntoView({ block: 'nearest' }); }
      else if (doc && notes[i]) { var target = sections(doc)[notes[i].n | 0]; if (target) target.scrollIntoView(); }
      return;
    }
    var b = e.target.closest('[data-surface]'); if (!b) return;
    var key = b.getAttribute('data-surface');
    if (key === 'case') {
      chosen = b.getAttribute('data-value'); notes = notesFor(); panel.textContent = '';
      try { history.replaceState(null, '', chosen === CASES[0] ? location.pathname + location.search : '#' + caseHash(chosen)); } catch (e2) {}
      apply(); return;
    }
    if (key === 'notes') state.notes = !state.notes; else state[key] = b.getAttribute('data-value');
    apply();
  });
  frame.addEventListener('load', function () {
    set(); anchor();
    var win = frame.contentWindow; if (win) { win.addEventListener('scroll', drawNotes, { passive: true }); win.addEventListener('resize', drawNotes); }
  });
  apply();
})();

// TABS (N017): each .sds-tabset holds a bar of tabs and one panel per tab. Without this every panel shows; with it one shows at a time, the bar takes arrow keys, Home and End, and the open tab is kept in the hash.
(function () {
  function open(set, tab, focus) {
    set.querySelectorAll('[role="tab"]').forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus({ preventScroll: true });
    // Keeping the open tab in view moves its own bar sideways and never the page, and nothing moves when a set is set up at load.
    var bar = set.querySelector('.sds-tabset-bar');
    if (bar && bar.scrollWidth > bar.clientWidth) {
      var at = tab.getBoundingClientRect(), box = bar.getBoundingClientRect();
      if (at.left < box.left) bar.scrollLeft += at.left - box.left;
      else if (at.right > box.right) bar.scrollLeft += at.right - box.right;
    }
  }
  // A row wider than its place scrolls inside its box, with an arrow at an edge that has more, as DSTabs does.
  function scroller(set) {
    var bar = set.querySelector('.sds-tabset-bar');
    var wrap = document.createElement('div');
    wrap.className = 'sds-tabset-scroll';
    bar.parentNode.insertBefore(wrap, bar);
    wrap.appendChild(bar);
    var arrows = ['start', 'end'].map(function (side) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sds-tabset-arrow';
      b.dataset.side = side;
      b.tabIndex = -1;
      b.setAttribute('aria-hidden', 'true');
      b.textContent = side === 'start' ? '‹' : '›';
      b.addEventListener('click', function () {
        bar.scrollBy({ left: (side === 'start' ? -1 : 1) * bar.clientWidth * 0.8, behavior: 'smooth' });
      });
      wrap.appendChild(b);
      return b;
    });
    function update() {
      var max = bar.scrollWidth - bar.clientWidth;
      arrows[0].hidden = bar.scrollLeft <= 1;
      arrows[1].hidden = bar.scrollLeft >= max - 1;
    }
    bar.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  document.querySelectorAll('.sds-tabset').forEach(function (set) {
    var tabs = Array.prototype.slice.call(set.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    scroller(set);
    var fromHash = tabs.filter(function (t) { return '#' + t.getAttribute('aria-controls') === location.hash; })[0];
    open(set, fromHash || tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0], false);
    set.classList.add('sds-is-ready');
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { open(set, t, false); });
      t.addEventListener('keydown', function (e) {
        var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        open(set, tabs[(to + tabs.length) % tabs.length], true);
      });
    });
  });
})();

/* A JSON FACT'S DIALOG: its chip opens it with showModal and focus goes to the close button; the close button, Escape and a click outside close it,
   and focus returns to the chip. Copy JSON copies the value's formatted JSON. */
document.addEventListener('click', function (e) {
  var t = e.target && e.target.closest ? e.target : null;
  if (!t) return;
  var chip = t.closest('.sds-json-chip');
  if (chip) {
    var dlg = document.getElementById(chip.getAttribute('data-json-open'));
    if (dlg && dlg.showModal && !dlg.open) {
      chip.setAttribute('aria-expanded', 'true');
      dlg.addEventListener('close', function () { chip.setAttribute('aria-expanded', 'false'); chip.focus(); }, { once: true });
      dlg.showModal();
      var x = dlg.querySelector('.sds-json-close'); if (x) x.focus();
    }
    return;
  }
  if (t.closest('.sds-json-close')) { t.closest('dialog').close(); return; }
  if (t.classList && t.classList.contains('sds-json-dialog')) { t.close(); return; }
  var b = t.closest('.sds-json-copy');
  if (!b) return;
  var live = b.closest('.sds-json-code') && b.closest('.sds-json-code').querySelector('.sds-json-live');
  var done = function () { b.classList.add('sds-is-copied'); if (live) live.textContent = 'Copied'; setTimeout(function () { b.classList.remove('sds-is-copied'); if (live) live.textContent = ''; }, 1500); };
  var text = b.getAttribute('data-json') || '';
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
});
