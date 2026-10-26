/* RESTATES: spn-foundation docs/04-capabilities/01-devex/04-workspace/04-docs/05-artifacts.md § The index of artifacts — one page that opens every other
   The index of a repository's artifacts: a tree of its pages on the left, and tabs on the right with one
   page in each, in a frame of its own. The tree is read from the page's data block, which `docs index`
   writes from the pages on disk. Nothing is kept in the address, and nothing is remembered between visits.
   The index never reads what a frame holds, because a page opened from disk is a stranger to the page that
   frames it. Every class it sets or reads opens with sds-. */
(function(){
  var store=document.getElementById('index-data'),whole=document.getElementById('index');
  var tree=document.getElementById('index-tree'),bar=document.getElementById('index-tabs');
  var panes=document.getElementById('index-panes'),toggle=document.getElementById('index-toggle');
  if(!store||!whole||!tree||!bar||!panes)return;
  var data=JSON.parse(store.textContent);
  var tabs=[],rows=[],branches=[],shown=null,clock=0;
  var narrow=window.matchMedia?window.matchMedia('(max-width:60rem)'):null;

  /* WHERE A PAGE IS. `data.base` is the one place the path to the pages is kept. A page marked `beside`
     sits next to the index itself, which only a sample does. */
  function address(entry){return (entry.beside?'':data.base)+entry.path;}
  /* A SLOT. A template writes `{{…}}` where an address goes. Such an entry has no page to load, so no
     address is asked for, and its tab says that the page is a slot. */
  function unfilled(entry){return /\{\{|\}\}/.test(address(entry));}
  /* THE NAME OF A PAGE. The tree shows an entry's label. A domain that opens its one overview is shown by
     the domain's name, so it has a title too, which is the overview's own. A tab is named by that title. */
  function named(entry){return entry.title||entry.label;}
  function pagesUnder(node){
    return (node.children||[]).reduce(function(sum,child){return sum+pagesUnder(child);},node.path?1:0);
  }

  /* THE MARK THAT OPENS A NEW TAB is drawn, not typed: an outline with an arrow that leaves it at the top
     right. It is drawn in the colour of the text around it, so both themes follow. */
  var drawn='http://www.w3.org/2000/svg';
  function newTabMark(){
    var drawing=document.createElementNS(drawn,'svg');
    drawing.setAttribute('viewBox','0 0 16 16');drawing.setAttribute('aria-hidden','true');drawing.setAttribute('focusable','false');
    var line=document.createElementNS(drawn,'path');
    line.setAttribute('d','M7 3.5H4.5A1.5 1.5 0 0 0 3 5v6.5A1.5 1.5 0 0 0 4.5 13H11a1.5 1.5 0 0 0 1.5-1.5V9M9.5 3H13v3.5M13 3 7.5 8.5');
    drawing.appendChild(line);
    return drawing;
  }

  /* THE TREE. A node with a path is a page. A node with children and no path is a folder: a group, an
     area, or a domain with more than one overview. A folder is a `details` element, so it opens and closes
     with no state of ours. A page with children is an overview: the constructs it links sit under it. A
     node that the data marks as folded starts closed, which the build does for a domain. */
  function place(node,into){
    if(node.path){page(node,into);}else{fold(node,into);}
  }
  function fold(node,into){
    var box=document.createElement('details');box.className='sds-tree-group';box.open=!node.folded;
    var head=document.createElement('summary');
    var name=document.createElement('span');name.textContent=node.label;head.appendChild(name);
    var count=document.createElement('span');count.className='sds-tree-count';count.textContent=pagesUnder(node);
    head.appendChild(count);box.appendChild(head);
    var kids=document.createElement('div');kids.className='sds-tree-kids';
    node.children.forEach(function(child){place(child,kids);});
    if(node.note){var note=document.createElement('p');note.className='sds-tree-note';note.textContent=node.note;kids.appendChild(note);}
    box.appendChild(kids);into.appendChild(box);
  }
  /* A PAGE THAT HOLDS PAGES gets a mark before its row. The mark folds the pages under it, and the row
     opens the page, so the two clicks are kept apart. */
  function mark(entry,row,kids){
    var button=document.createElement('button');button.type='button';button.className='sds-tree-fold';
    button.title='Show or hide the pages under it';
    button.setAttribute('aria-label','Show or hide the pages under '+named(entry));
    row.appendChild(button);
    branches.push({button:button,kids:kids});
    unfold(kids,!entry.folded);
    button.addEventListener('click',function(){unfold(kids,kids.hidden);});
  }
  function unfold(kids,open){
    branches.forEach(function(one){
      if(one.kids!==kids)return;
      kids.hidden=!open;one.button.setAttribute('aria-expanded',open?'true':'false');
    });
  }
  function page(entry,into){
    var row=document.createElement('div');row.className='sds-tree-row';
    var kids=null;
    if(entry.children&&entry.children.length){
      kids=document.createElement('div');kids.className='sds-tree-kids';
      mark(entry,row,kids);
    }
    var link=document.createElement('a');link.className='sds-tree-link';link.href=unfilled(entry)?'#':address(entry);
    link.textContent=entry.label;
    if(entry.title)link.title=entry.title;
    /* A plain click opens the page in the tab that is shown. A click with a key held is left to the browser,
       but not on a slot, which has no address to give the browser. */
    link.addEventListener('click',function(event){
      var held=event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button;
      if(held&&!unfilled(entry))return;
      event.preventDefault();open(entry,false);
    });
    var more=document.createElement('button');more.type='button';more.className='sds-tree-new';more.appendChild(newTabMark());
    more.title='Open in a new tab';more.setAttribute('aria-label','Open '+named(entry)+' in a new tab');
    more.addEventListener('click',function(){open(entry,true);});
    row.appendChild(link);row.appendChild(more);into.appendChild(row);
    rows.push({entry:entry,link:link});
    if(kids){
      entry.children.forEach(function(child){place(child,kids);});
      into.appendChild(kids);
    }
  }

  /* THE TABS. Each tab owns one frame. A tab that is not shown keeps its frame, so its page stays loaded.
     A tab that holds a slot owns a note too, which is shown in place of the frame. */
  function make(){
    var wrap=document.createElement('div');wrap.className='sds-tab';
    var title=document.createElement('button');title.type='button';title.className='sds-tab-title';title.setAttribute('role','tab');
    var close=document.createElement('button');close.type='button';close.className='sds-tab-close';close.textContent='×';
    var frame=document.createElement('iframe');frame.className='sds-pane';frame.hidden=true;
    var tab={wrap:wrap,title:title,close:close,frame:frame,note:null,slot:false,entry:null,opened:0};
    title.addEventListener('click',function(){show(tab);});
    close.addEventListener('click',function(){shut(tab);});
    wrap.appendChild(title);wrap.appendChild(close);bar.appendChild(wrap);panes.appendChild(frame);
    tabs.push(tab);
    return tab;
  }
  /* A tab's title is the name the tree's data gives the page, because the index cannot read the page's own. */
  function load(tab,entry){
    tab.entry=entry;
    tab.title.textContent=named(entry);tab.title.title=named(entry);
    tab.close.title='Close this tab';tab.close.setAttribute('aria-label','Close '+named(entry));
    tab.frame.title=named(entry);tab.slot=unfilled(entry);
    if(!tab.slot){tab.frame.src=address(entry);return;}
    /* A slot gives the frame nothing to load. A frame that held a page is emptied. */
    if(tab.frame.hasAttribute('src'))tab.frame.src='about:blank';
    say(tab,entry);
  }
  /* THE NOTE OF A SLOT. It says, in the place of the page, that the page is a slot. */
  function say(tab,entry){
    if(!tab.note){
      tab.note=document.createElement('div');tab.note.className='sds-pane sds-pane-slot';tab.note.hidden=true;
      panes.insertBefore(tab.note,tab.frame);
    }
    var box=document.createElement('div');box.className='sds-pull';
    var label=document.createElement('span');label.className='sds-label';label.textContent=named(entry);
    var words=document.createElement('p');
    words.textContent='This page is a slot. Its address is not filled in, so this tab has no page to load. '+
      'The build writes the tree from the pages on disk. Then each entry opens its page here.';
    box.appendChild(label);box.appendChild(words);
    tab.note.textContent='';tab.note.appendChild(box);
  }
  function show(tab){
    shown=tab;
    tabs.forEach(function(one){
      one.wrap.classList.toggle('sds-is-current',one===tab);
      one.title.setAttribute('aria-selected',one===tab?'true':'false');
      one.frame.hidden=one!==tab||one.slot;
      if(one.note)one.note.hidden=one!==tab||!one.slot;
      one.close.disabled=tabs.length<2;                 // the last tab cannot be closed
    });
    /* The tree shows which page the shown tab holds, and opens what is above it. */
    rows.forEach(function(row){
      var here=row.entry===tab.entry;
      row.link.classList.toggle('sds-is-current',here);
      if(here){row.link.setAttribute('aria-current','page');}else{row.link.removeAttribute('aria-current');}
      if(!here)return;
      for(var up=row.link.parentNode.parentNode;up&&up!==tree;up=up.parentNode){
        if(up.tagName==='DETAILS')up.open=true;
        if(up.hidden)unfold(up,true);
      }
    });
    if(tab.wrap.scrollIntoView)tab.wrap.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  /* `fresh` asks for a tab of its own. At the limit no tab is added: the tab opened longest ago takes the page. */
  function open(entry,fresh){
    var tab=shown;
    if(fresh||!tab){
      if(tabs.length<data.tabs){tab=make();}
      else{tab=tabs.reduce(function(oldest,one){return one.opened<oldest.opened?one:oldest;});}
      clock+=1;tab.opened=clock;
      load(tab,entry);
    }else if(tab.entry!==entry){
      load(tab,entry);
    }
    show(tab);
    /* On a narrow screen the tree is over the page, so it folds away again once a page is chosen. */
    if(narrow&&narrow.matches)foldTree(true);
  }
  function shut(tab){
    if(tabs.length<2)return;
    var at=tabs.indexOf(tab);
    tabs.splice(at,1);
    bar.removeChild(tab.wrap);panes.removeChild(tab.frame);
    if(tab.note)panes.removeChild(tab.note);
    show(shown===tab?tabs[Math.min(at,tabs.length-1)]:shown);
  }

  /* THE TREE FOLDS AWAY with one click on the button at its top, at any width, and comes back the same way.
     The page on the right then has the whole window. The class is set on the whole index, because the
     columns are its own, and the stylesheet sets every width. Nothing is remembered: the tree is shown at
     each visit, and on a narrow screen it starts folded. */
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
  data.groups.forEach(function(group){if(group.children&&group.children.length)fold(group,tree);});
  foldTree(!!(narrow&&narrow.matches));
  if(rows.length)open(rows[0].entry,true);
})();
