(()=>{
  'use strict';
  const $=id=>document.getElementById(id),api=()=>window.AshFallArcade;
  const query=new URLSearchParams(location.search);
  let me=null,friends=[],matches=[],selectedId=query.get('match')||'',selectedMoves=[],selectedMatch=null,moving=false,focusInvite=!!query.get('match');
  const nameOf=player=>player?.display_name||player?.username||'Friend';
  const showError=(error,target=$('challenge-status'))=>{target.textContent=error?.message||'The arcade service is unavailable. Try again shortly.'};
  function showAccount(user){
    const status=$('arcade-account-status');status.replaceChildren();
    if(user){status.append(document.createTextNode('Signed in as '));const name=document.createElement('strong');name.textContent=user.display_name||user.username;status.append(name,document.createTextNode('. Matches and turns sync to your account.'));return;}
    status.append(document.createTextNode('Sign in to challenge friends and save matches. '));
    const link=document.createElement('a');link.href='/auth.html?next='+encodeURIComponent(location.pathname+location.search);link.textContent='Sign in';status.append(link);
  }
  const call=(path,options)=>api().request(path,options||{});
  function inviteSelect(){
    const select=$('friend-select');select.replaceChildren(new Option(friends.length?'Choose a friend':'Add a friend first',''));
    for(const friend of friends)select.add(new Option(nameOf(friend)+' (@'+friend.username+')',String(friend.user_id)));
    select.disabled=friends.length===0;
    $('challenge-button').disabled=friends.length===0;
  }
  function inviteStatus(match){
    const viewer=Number(me?.id),p1=match.player_one,p2=match.player_two;
    if(match.status==='pending')return Number(match.created_by)===viewer?'Challenge sent · waiting for '+nameOf(p2)+' to accept':'Invitation from '+nameOf(p1);
    if(match.status==='active')return Number(match.current_player_id)===viewer?'Your turn · take it whenever you’re ready':'Waiting for '+(Number(p1.id)===viewer?nameOf(p2):nameOf(p1))+' · no timer';
    if(match.status==='completed')return match.winner_id==null?'Match ended in a draw':Number(match.winner_id)===viewer?'You won this match':'Your friend won this match';
    return match.status==='declined'?'Challenge declined':'Match closed';
  }
  function badgeFor(match){
    const viewer=Number(me?.id);
    if(match.status==='active'&&Number(match.current_player_id)===viewer)return ['YOUR TURN','action'];
    if(match.status==='pending'&&Number(match.player_two.id)===viewer)return ['INVITATION','pending'];
    if(match.status==='pending')return ['WAITING',''];
    if(match.status==='active')return ['THEIR TURN',''];
    return [match.status==='completed'?'FINISHED':match.status.toUpperCase(),''];
  }
  function renderMatches(){
    const list=$('match-list');list.replaceChildren();$('empty-matches').hidden=matches.length>0;
    for(const match of matches){
      const viewer=Number(me?.id),opponent=Number(match.player_one.id)===viewer?match.player_two:match.player_one;
      const button=document.createElement('button');button.className='match-card';button.type='button';button.setAttribute('aria-current',match.id===selectedId?'true':'false');
      const copy=document.createElement('span'),title=document.createElement('strong'),sub=document.createElement('small'),badge=document.createElement('span');
      title.textContent='Chaos Connect Four · '+nameOf(opponent);sub.textContent=inviteStatus(match);const [text,kind]=badgeFor(match);badge.className='badge'+(kind?' '+kind:'');badge.textContent=text;
      copy.append(title,sub);button.append(copy,badge);button.addEventListener('click',()=>openMatch(match.id));list.append(button);
    }
    $('list-hint').textContent=matches.length?matches.length+' saved '+(matches.length===1?'match':'matches')+'. A turn never expires.':'Invitations and active games appear here. We’ll let you know when it’s your turn.';
  }
  function renderPlayers(match){
    const strip=$('player-strip');strip.replaceChildren();
    for(const [player,token,label] of [[match.player_one,'pink','Pink'],[match.player_two,'lime','Lime']]){
      const item=document.createElement('div'),dot=document.createElement('i'),name=document.createElement('span');item.className='player';dot.className='token '+token;name.textContent=label+' · '+nameOf(player);item.append(dot,name);strip.append(item);
    }
  }
  function addAction(label,action,kind=''){
    const button=document.createElement('button');button.type='button';button.className='button'+(kind?' '+kind:'');button.textContent=label;button.addEventListener('click',action);$('match-actions').append(button);
  }
  function renderBoard(match){
    const board=$('async-board');board.replaceChildren();
    const viewer=Number(me?.id),canMove=match.status==='active'&&!match.state_error&&Number(match.current_player_id)===viewer&&!moving;
    for(let row=0;row<6;row++)for(let col=0;col<7;col++){
      const slot=document.createElement('button'),cell=match.board[row][col];slot.type='button';slot.className='slot'+(cell===1?' p1':cell===2?' p2':'');
      if(match.last_move&&Number(match.last_move.row)===row&&Number(match.last_move.column)===col)slot.classList.add('last-move');
      const owner=cell===1?nameOf(match.player_one):cell===2?nameOf(match.player_two):'';
      slot.setAttribute('aria-label',owner?`Row ${row+1}, column ${col+1}: ${owner}`:`Row ${row+1}, column ${col+1}: empty`);
      slot.disabled=!canMove||match.board[0][col]!==0;
      slot.addEventListener('click',()=>playColumn(col));board.append(slot);
    }
    $('board-note').textContent=match.state_error?'This saved board needs an admin review. No moves can be made on it.':canMove?'Choose any open spot in a column. Your disc drops to the lowest open row. The game saves your move automatically.':match.status==='active'?'You can leave now. The board is saved while your friend takes their turn.':match.status==='pending'?'Accept the challenge to begin the match.':'This board is saved so you can revisit the finished match.';
    $('match-status').textContent=inviteStatus(match);
  }
  function renderHistory(moves){
    const list=$('move-history');list.replaceChildren();
    if(!moves.length){const item=document.createElement('li');item.textContent='No turns yet.';list.append(item);return;}
    for(const move of moves){
      let detail={};try{detail=JSON.parse(move.move_json||'{}')}catch{}
      const item=document.createElement('li');item.textContent=nameOf(move)+' dropped a disc in column '+(Number(detail.column)+1)+'.';list.append(item);
    }
  }
  function renderActions(match){
    const box=$('match-actions');box.replaceChildren();const viewer=Number(me?.id);
    if(match.status==='pending'&&Number(match.player_two.id)===viewer){
      addAction('Accept challenge',()=>respond('accept'),'primary');addAction('Decline',()=>respond('decline'));
    }else if(match.status==='pending'&&Number(match.created_by)===viewer){
      addAction('Cancel invitation',()=>respond('cancel'));
    }
  }
  async function openMatch(id){
    selectedId=id;history.replaceState(null,'',location.pathname+'?match='+encodeURIComponent(id));$('match-panel').hidden=false;$('match-status').textContent='Loading saved board…';
    try{
      const data=await call('/api/arcade/turn-matches/'+encodeURIComponent(id));selectedMatch=data.match;selectedMoves=data.moves||[];
      $('match-title').textContent='Chaos Connect Four';renderPlayers(selectedMatch);renderBoard(selectedMatch);renderActions(selectedMatch);renderHistory(selectedMoves);renderMatches();
      if(focusInvite){focusInvite=false;requestAnimationFrame(()=>$('match-panel').scrollIntoView({behavior:'instant',block:'start'}));}
    }catch(error){showError(error,$('match-status'));}
  }
  async function refreshMatches(openSelected=false){
    try{
      const data=await call('/api/arcade/turn-matches');matches=data.matches||[];renderMatches();
      if(selectedId&&openSelected&&matches.some(match=>match.id===selectedId))await openMatch(selectedId);
      else if(!selectedId&&matches.length&&query.get('match'))await openMatch(query.get('match'));
      else if(!matches.length&&selectedId){selectedId='';$('match-panel').hidden=true;}
    }catch(error){showError(error,$('challenge-status'));}
  }
  async function respond(action){
    try{await call('/api/arcade/turn-matches/'+encodeURIComponent(selectedId)+'/'+action,{method:'POST',body:'{}'});await refreshMatches(false);await openMatch(selectedId);}
    catch(error){showError(error,$('match-status'));await refreshMatches(true);}
  }
  async function playColumn(column){
    if(!selectedMatch||moving)return;moving=true;renderBoard(selectedMatch);
    try{
      await call('/api/arcade/turn-matches/'+encodeURIComponent(selectedId)+'/moves',{method:'POST',body:JSON.stringify({column,turn_number:selectedMatch.turn_number})});
      await refreshMatches(false);await openMatch(selectedId);
    }catch(error){
      const stale=error?.status===409;showError(error,$('match-status'));await refreshMatches(false);await openMatch(selectedId);
      if(stale)$('match-status').textContent='The saved board changed, so I loaded the latest position. '+inviteStatus(selectedMatch);
    }finally{moving=false;if(selectedMatch)renderBoard(selectedMatch);}
  }
  async function challenge(event){
    event.preventDefault();$('challenge-button').disabled=true;$('challenge-status').textContent='Sending challenge…';
    try{
      const result=await call('/api/arcade/turn-matches',{method:'POST',body:JSON.stringify({game_key:$('game-select').value,opponent_id:Number($('friend-select').value)})});
      $('challenge-status').textContent='Challenge sent. Your friend can accept whenever they’re ready.';selectedId=result.match.id;await refreshMatches(false);await openMatch(selectedId);
    }catch(error){showError(error);}
    finally{$('challenge-button').disabled=friends.length===0;}
  }
  async function boot(){
    if(!api()){$('challenge-status').textContent='Account tools did not load. Refresh this page to reconnect.';return;}
    try{
      await api().refreshUser();me=api().user;
      showAccount(me);
      if(!me){$('friend-select').replaceChildren(new Option('Sign in to challenge friends',''));$('challenge-status').textContent='Sign in to challenge a friend.';return;}
      // A deep-linked invitation must open even when friend discovery is slow or offline.
      if(selectedId)await openMatch(selectedId);
      try{const friendData=await call('/api/friends');friends=friendData.friends||[];}catch(error){console.warn('turn_game_friend_picker_unavailable',String(error));}
      inviteSelect();await refreshMatches(false);
    }catch(error){showError(error);}
  }
  $('challenge-form').addEventListener('submit',challenge);
  $('refresh-matches').addEventListener('click',()=>refreshMatches(true));
  $('close-match').addEventListener('click',()=>{selectedId='';selectedMatch=null;$('match-panel').hidden=true;history.replaceState(null,'',location.pathname);renderMatches();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshMatches(true);});
  setInterval(()=>{if(!document.hidden)refreshMatches(true);},45000);
  boot();
})();
