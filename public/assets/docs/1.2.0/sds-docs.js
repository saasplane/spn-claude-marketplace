/* RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § One stylesheet, served in versions
   The one script every page loads: the rail, the fold under each section, the link beside each
   heading, and the reader's own time on a report. Every class it sets or reads opens with sds-. */
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
