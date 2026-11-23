/* RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The index of artifacts — one page that opens every other
   The index of a repository's artifacts: a tree of its pages on the left, read as the app rail is, and one page at
   a time on the right, in one frame under a bar. The tree is read from the page's data block, which
   `docs index` writes from the pages on disk. A click on an entry replaces the page in the frame and pushes the
   address, `#<its path>`, so Back returns to the page before, and a reload or a shared link opens the page again; nothing
   else is remembered between visits. The bar holds the page's name, reload, copy link and open in a new window; a click
   on an entry with a key held, or a middle click, opens the page in a browser tab of its own. The index never reads what
   a frame holds, because a page opened from disk is a stranger to the page that frames it. Every class it sets or reads opens with sds-. */
/* THE MODE IS THE DESIGN SYSTEM'S, as on every page: an index that names none takes the reader's setting and follows it. */
(function(){
  var root=document.documentElement;if(!root||root.getAttribute('data-mode')||!window.matchMedia)return;
  var ask=window.matchMedia('(prefers-color-scheme: dark)');
  function set(){if(root.hasAttribute('data-mode-chosen'))return;root.setAttribute('data-mode',ask.matches?'dark':'light');}
  set();if(ask.addEventListener)ask.addEventListener('change',set);
})();
(function(){
  var store=document.getElementById('index-data'),whole=document.getElementById('index');
  var tree=document.getElementById('index-tree'),bar=document.getElementById('index-bar');
  var panes=document.getElementById('index-panes'),toggle=document.getElementById('index-toggle');
  var marks=document.getElementById('index-marks');
  if(!store||!whole||!tree||!bar||!panes)return;

  /* THE MODE SWITCH: light or dark for the index and every page it holds, sent to each frame as a message. */
  var root=document.documentElement;
  function modeNow(){return root.getAttribute('data-mode')==='dark'?'dark':'light';}
  function tellMode(frame){if(!root.hasAttribute('data-mode-chosen')||!frame.contentWindow)return;frame.contentWindow.postMessage({sds:'mode',mode:modeNow()},'*');}
  var modeButton=document.createElement('button');modeButton.type='button';modeButton.className='sds-index-toggle sds-index-mode';
  function drawModeButton(){var next=modeNow()==='dark'?'light':'dark';modeButton.textContent='';modeButton.appendChild(icon(next==='dark'?'moon':'sun'));modeButton.title='Switch to '+next;modeButton.setAttribute('aria-label','Switch the index and its pages to '+next);}
  modeButton.addEventListener('click',function(){root.setAttribute('data-mode-chosen','');root.setAttribute('data-mode',modeNow()==='dark'?'light':'dark');drawModeButton();Array.prototype.forEach.call(panes.querySelectorAll('iframe'),tellMode);});
  if(toggle&&toggle.parentNode)toggle.parentNode.insertBefore(modeButton,toggle);
  if(window.matchMedia)window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){setTimeout(drawModeButton,0);});
  /* An index shown inside another index takes that index's mode the same way, and passes it on to its own frames. */
  window.addEventListener('message',function(event){var data=event.data;if(event.source!==window.parent||window.parent===window||!data||data.sds!=='mode')return;if(data.mode!=='light'&&data.mode!=='dark')return;root.setAttribute('data-mode-chosen','');root.setAttribute('data-mode',data.mode);drawModeButton();Array.prototype.forEach.call(panes.querySelectorAll('iframe'),tellMode);});
  var data=JSON.parse(store.textContent);
  var rows=[],groups=[],shown=null,frame=null,note=null;
  var narrow=window.matchMedia?window.matchMedia('(max-width:82.5rem)'):null;

  /* WHERE A PAGE IS. `data.base` is the one place the path to the pages is kept. A page marked `beside`
     sits next to the index itself, which only a sample does. */
  function address(entry){return (entry.beside?'':data.base)+entry.path;}
  /* A SLOT. A template writes `{{…}}` where an address goes. Such an entry has no page to load, so no
     address is asked for, and the frame's place shows a note that says the page is a slot. */
  function unfilled(entry){return /\{\{|\}\}/.test(address(entry));}
  /* THE NAME OF A PAGE. The tree shows an entry's label. A domain's overview is shown as Overview inside the
     domain's group, so it has a title too, which is the overview's own. The bar names the page by that title. */
  function named(entry){return entry.title||entry.label;}
  function pagesUnder(node){
    return (node.children||[]).reduce(function(sum,child){return sum+pagesUnder(child);},node.path?1:0);
  }
  function whereOf(entry){return new URL(address(entry),location.href).href;}

  /* THE MARKS are drawn from the design system's own set (lucide), in the colour of the text around them, so
     both themes follow. */
  var drawn='http://www.w3.org/2000/svg';
  var LINES={
    home:['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8','M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    grid:['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
    file:['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z','M14 2v4a2 2 0 0 0 2 2h4'],
    list:['M3 12h.01','M3 18h.01','M3 6h.01','M8 12h13','M8 18h13','M8 6h13'],
    activity:['M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2'],
    chevron:['m9 18 6-6-6-6'],
    out:['M7 7h10v10','M7 17 17 7'],
    reload:['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8','M21 3v5h-5'],
    copy:['M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z','M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'],
    check:['M20 6 9 17l-5-5'],
    sun:['M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8','M12 2v2','M12 20v2','m4.93 4.93 1.41 1.41','m17.66 17.66 1.41 1.41','M2 12h2','M20 12h2','m6.34 17.66-1.41 1.41','m19.07 4.93-1.41 1.41'],
    moon:['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z']
  };
  setTimeout(function(){drawModeButton();},0);
  function icon(name){
    var drawing=document.createElementNS(drawn,'svg');drawing.setAttribute('class','sds-ico');
    drawing.setAttribute('viewBox','0 0 24 24');drawing.setAttribute('aria-hidden','true');drawing.setAttribute('focusable','false');
    LINES[name].forEach(function(d){var line=document.createElementNS(drawn,'path');line.setAttribute('d',d);drawing.appendChild(line);});
    return drawing;
  }
  /* The icon says the kind of page: the hub a house, a guide a list, a report a pulse, any other page a file.
     The grid means a group and nothing else. */
  function kindIcon(entry){
    if(entry.kind==='overview'&&/concept-overview\.html$/.test(entry.path))return 'home';
    if(entry.kind==='guide')return 'list';
    if(entry.kind==='report')return 'activity';
    return 'file';
  }

  /* THE TREE. A ROW DOES ONE THING, as in the app rail: a group row only folds, a page row only opens its page.
     A page that holds pages (an area's overview) becomes a group of its own name, whose first page is that
     overview, named Overview. A group is a `details` element, so it opens and closes with no state of ours. A
     node that the data marks as folded starts closed, which the build does for a domain. */
  function place(node,into){
    if(node.path&&node.children&&node.children.length){
      var own={label:'Overview',kind:node.kind,path:node.path,title:named(node)};
      fold({label:node.label,folded:node.folded,children:[own].concat(node.children)},into,false);
      return;
    }
    if(node.path){page(node,into);}else{fold(node,into,false);}
  }
  /* The three groups of the tree are small headings with their count, and they never fold; a group inside them
     carries the grid mark and a chevron, and folds. */
  function fold(node,into,top){
    var box=document.createElement('details');box.className='sds-tree-group';box.open=top||(!node.folded&&!(into.hasAttribute&&into.hasAttribute('data-first')));
    var head=document.createElement('summary');
    var name=document.createElement('span');name.textContent=node.label;head.appendChild(name);
    if(top){
      var count=document.createElement('span');count.className='sds-tree-count';count.textContent=pagesUnder(node);head.appendChild(count);
      head.addEventListener('click',function(event){event.preventDefault();});
    }else{
      head.className='sds-tree-grouphead';if(into.hasAttribute&&into.hasAttribute('data-first'))head.insertBefore(icon('grid'),name);
      var turn=icon('chevron');turn.classList.add('sds-tree-turn');head.appendChild(turn);
    }
    box.appendChild(head);
    var kids=document.createElement('div');kids.className='sds-tree-kids';if(top)kids.setAttribute('data-first','');
    node.children.forEach(function(child){place(child,kids);});
    if(node.note){var note=document.createElement('p');note.className='sds-tree-note';note.textContent=node.note;kids.appendChild(note);}
    box.appendChild(kids);into.appendChild(box);
    if(top)groups.push({node:node,box:box,mark:null});
  }
  function page(entry,into){
    var row=document.createElement('div');row.className='sds-tree-row';
    var link=document.createElement('a');link.className='sds-tree-link';link.href=unfilled(entry)?'#':address(entry);
    /* An entry's words can be selected: a press and drag selects them instead of dragging the link. */
    link.draggable=false;link.style.webkitUserDrag='none';
    var words=document.createElement('span');words.textContent=entry.label;
    if(into.hasAttribute&&into.hasAttribute('data-first'))link.appendChild(icon(kindIcon(entry)));link.appendChild(words);
    if(entry.title)link.title=entry.title;
    /* A plain click shows the page in the frame. A click with a key held is left to the browser, which opens the link in a tab of its own,
       but not on a slot, which has no address to give the browser. */
    link.addEventListener('click',function(event){
      var held=event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button;
      if(held&&!unfilled(entry))return;
      event.preventDefault();
      /* A click that ends a drag across the words keeps the selection, and opens nothing. */
      var picked=window.getSelection&&window.getSelection();
      if(picked&&!picked.isCollapsed&&link.contains(picked.anchorNode))return;
      go(entry);
    });
    row.appendChild(link);into.appendChild(row);
    rows.push({entry:entry,link:link});
  }

  /* THE BAR above the frame names the page on screen and holds three buttons: reload, a copy of the page's whole address,
     and the page alone in a new window. The frame is made once, and a click on an entry points it at another page. */
  var told=null;
  function tell(button,words){
    if(!told){told=document.createElement('div');told.className='sds-bar-copied';told.setAttribute('role','status');document.body.appendChild(told);}
    var box=button.getBoundingClientRect();
    told.textContent=words;told.hidden=false;told.style.left=Math.max(8,box.left-20)+'px';told.style.top=(box.bottom+6)+'px';
    clearTimeout(tell.timer);tell.timer=setTimeout(function(){told.hidden=true;},1400);
  }
  function tool(name,label,mark){
    var button=document.createElement('button');button.type='button';button.className='sds-bar-button';button.title=label;button.setAttribute('aria-label',label);
    button.setAttribute('data-act',name);button.appendChild(icon(mark));bar.appendChild(button);return button;
  }
  var title=document.createElement('span');title.className='sds-bar-name';bar.appendChild(title);
  var again=tool('reload','Reload','reload'),copy=tool('copy','Copy link','copy'),away=tool('away','Open in a new window','out');
  /* The whole address of the page on screen, as the browser bar would show it if the page were opened alone.
     Where the clipboard is not given to the page, the address is shown to copy by hand. */
  copy.addEventListener('click',function(){
    if(!shown)return;
    var at=whereOf(shown);
    function done(){
      copy.classList.add('sds-is-copied');copy.replaceChild(icon('check'),copy.firstChild);tell(copy,'Copied');
      setTimeout(function(){copy.classList.remove('sds-is-copied');copy.replaceChild(icon('copy'),copy.firstChild);},1400);
    }
    function byHand(){window.prompt('Copy this address',at);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(at).then(done,byHand);}else{byHand();}
  });
  away.addEventListener('click',function(){if(shown)window.open(whereOf(shown),'_blank','noopener');});
  /* RELOAD the page on screen. A page opened from disk is a stranger to the index, so where its frame refuses the
     call, the frame is pointed at the page's address again. */
  again.addEventListener('click',function(){
    if(!shown||unfilled(shown))return;
    try{frame.contentWindow.location.reload();}
    catch(e){mount(address(shown));frame.title=named(shown);frame.hidden=false;}
  });
  /* THE FRAME IS MADE AGAIN FOR EACH PAGE: pointing a frame that holds a page at another adds an entry to the browser's history,
     and then Back would step the frame and leave the address on the page after. A new frame's first page adds none, so one
     click is one step of history, the address's. */
  function mount(at){
    var next=document.createElement('iframe');next.className='sds-pane';next.hidden=true;
    next.addEventListener('load',function(){tellMode(next);});
    if(at!==null)next.src=at;
    if(frame)panes.replaceChild(next,frame);else panes.appendChild(next);
    frame=next;
  }
  mount(null);
  /* THE NOTE OF A SLOT. It says, in the place of the page, that the page is a slot. */
  function say(entry){
    if(!note){note=document.createElement('div');note.className='sds-pane sds-pane-slot';note.hidden=true;panes.insertBefore(note,frame);}
    var box=document.createElement('div');box.className='sds-pull';
    var label=document.createElement('span');label.className='sds-label';label.textContent=named(entry);
    var words=document.createElement('p');
    words.textContent='This page is a slot. Its address is not filled in, so there is no page to load. '+
      'The build writes the tree from the pages on disk. Then each entry opens its page here.';
    box.appendChild(label);box.appendChild(words);
    note.textContent='';note.appendChild(box);
  }
  /* THE ADDRESS NAMES THE PAGE ON SCREEN: `#` and the entry's path. A click on an entry pushes it, so Back returns to the page
     before; the opening of the index and the way back write it over the last. */
  function hashOf(entry){return '#'+encodeURIComponent(entry.path).replace(/%2F/g,'/');}
  function asked(){
    if(!location.hash)return null;
    var want;try{want=decodeURIComponent(location.hash.slice(1));}catch(e){return null;}
    var hit=null;rows.forEach(function(row){if(!hit&&row.entry.path===want)hit=row;});
    return hit;
  }
  /* Show a page: the frame, the bar, and the tree's mark of where it is. Nothing is written to the address here. */
  function show(entry){
    var slot=unfilled(entry);
    shown=entry;
    title.textContent=named(entry);title.title=named(entry);
    if(slot){
      if(frame.hasAttribute('src'))mount(null);
      say(entry);
    }else if(frame.getAttribute('src')!==address(entry)){
      mount(address(entry));
    }
    frame.title=named(entry);
    frame.hidden=slot;if(note)note.hidden=!slot;
    again.hidden=slot;copy.hidden=slot;away.hidden=slot;
    /* The tree shows which page is on screen, opens what is above it, and the folded column marks its group. */
    var held=null;
    rows.forEach(function(row){
      var here=row.entry===entry;
      row.link.classList.toggle('sds-is-current',here);
      if(here){row.link.setAttribute('aria-current','page');}else{row.link.removeAttribute('aria-current');}
      if(!here)return;
      for(var up=row.link.parentNode;up&&up!==tree;up=up.parentNode){
        if(up.tagName==='DETAILS')up.open=true;
        groups.forEach(function(group){if(group.box===up)held=group;});
      }
    });
    groups.forEach(function(group){if(group.mark)group.mark.classList.toggle('sds-is-current',group===held);});
  }
  /* A click on an entry: the page replaces the one on screen, and the address is pushed. */
  function go(entry){
    if(shown!==entry){
      if(!unfilled(entry)&&window.history&&history.pushState&&location.hash!==hashOf(entry))history.pushState(null,'',hashOf(entry));
      show(entry);
    }
    /* On a narrow screen the tree is over the page, so it folds away again once a page is chosen. */
    if(narrow&&narrow.matches)foldTree(true);
  }

  /* THE TREE FOLDS AWAY with one click on the button in the head card, at any width, and comes back the same way.
     Folded, the side is a column of the button and one two-letter mark per group; a mark opens the side on its
     group. The class is set on the whole index, because the columns are its own, and the stylesheet sets every
     width. Nothing is remembered: the tree is shown at each visit, and on a narrow screen it starts folded. */
  function foldTree(away){
    whole.classList.toggle('sds-is-folded',away);
    if(!toggle)return;
    toggle.setAttribute('aria-expanded',away?'false':'true');
    toggle.title=away?'Show the tree':'Hide the tree';
  }
  if(toggle){
    toggle.addEventListener('click',function(){foldTree(!whole.classList.contains('sds-is-folded'));});
  }
  /* A GROUP THAT HOLDS NOTHING IS NOT SHOWN. The build leaves such a group out of the data; this is the same
     rule, kept here too. */
  data.groups.forEach(function(group){if(group.children&&group.children.length)fold(group,tree,true);});
  if(marks){
    groups.forEach(function(group){
      var button=document.createElement('button');button.type='button';button.className='sds-rail-groupmark';
      button.textContent=group.node.label.slice(0,2).toUpperCase();button.title=group.node.label;
      button.setAttribute('aria-label','Show '+group.node.label);
      button.addEventListener('click',function(){foldTree(false);group.box.open=true;group.box.scrollIntoView({block:'start'});});
      marks.appendChild(button);group.mark=button;
    });
  }
  foldTree(!!(narrow&&narrow.matches));
  /* THE DEFAULT PAGE is the first row of the tree: the page the index opens when its address holds no hash. The brand at the top of the side
     is a link to this file with no hash (a real link, so a click, a middle click and "copy link" all give the index as a fresh open
     does), and it says which page that opens. */
  function defaultRow(){return rows[0];}
  var brand=document.querySelector('.sds-rail-brand');
  if(brand&&rows.length){
    var openName='Open '+named(defaultRow().entry);
    brand.setAttribute('aria-label',openName);brand.title=openName;
  }
  var first=asked();
  if(rows.length){
    var start=(first||defaultRow()).entry;
    if(!first&&!unfilled(start)&&window.history&&history.replaceState)history.replaceState(null,'',hashOf(start));
    show(start);
  }
  /* Back and Forward, and an address typed or shared: the page the address names is the page on screen. */
  window.addEventListener('hashchange',function(){var row=asked();if(row&&shown!==row.entry)show(row.entry);});
})();
