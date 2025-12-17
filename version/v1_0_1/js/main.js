(function(global){
  const Board=global.BoardModule;
  const AI=global.AIModule;
  const Renderer=global.Renderer;

  const N=7;
  let renderer,STATE;
  let enemyAI='greedy',helpAI='greedy';

  function resetGame(){
    STATE={
      board:Board.makeBoard(N),
      scores:{X:{A:0,B:0},O:{A:0,B:0}},
      cur:0,
      ended:false
    };
    renderer.clearGameOver();
    renderer.renderBoard(STATE.board,STATE.scores,'X');
  }

  function placeMove(r,c){
    const res=Board.placeAndScore(STATE.board,r,c,STATE.cur);
    if(!res) return false;
    const p=Board.PLAYERS[STATE.cur];
    STATE.scores[p].A+=res.A;
    STATE.scores[p].B+=res.B;
    return true;
  }

  function afterMove(){
    if(Board.boardFull(STATE.board)){
      STATE.ended=true;
      const sx=STATE.scores.X.A*STATE.scores.X.B;
      const so=STATE.scores.O.A*STATE.scores.O.B;
      renderer.showGameOver(`玩家 ${sx} : AI ${so}`);
      return;
    }
    STATE.cur^=1;
    renderer.renderBoard(STATE.board,STATE.scores,STATE.cur===0?'X':'O');
    if(STATE.cur===1){
      setTimeout(()=>{
        const mv = AI.aiChoose(STATE.board, 1, enemyAI);
        if(mv){ placeMove(mv[0],mv[1]); afterMove(); }
      },300);
    }
  }

  function boot(){
    const canvas=document.getElementById('gameCanvas');
    renderer=new Renderer(canvas,window.innerWidth,window.innerHeight,N);
    resetGame();

    canvas.addEventListener('mousedown',e=>{
      if(STATE.ended||STATE.cur!==0) return;
      const cell=renderer.pixelToCell(e.clientX,e.clientY);
      if(cell && placeMove(cell.r,cell.c)) afterMove();
    });

    document.getElementById('enemyAI').onchange=e=>enemyAI=e.target.value;
    document.getElementById('helpAI').onchange=e=>helpAI=e.target.value;

    document.getElementById('helpBtn').onclick=()=>{
      if(STATE.ended) return;
      const mv = AI.aiChoose(STATE.board, STATE.cur, helpAI);
      if(mv && placeMove(mv[0],mv[1])) afterMove();
    };

    document.getElementById('restartBtn').onclick=resetGame;

    window.addEventListener('resize',()=>{
      renderer.resize(window.innerWidth,window.innerHeight);
      renderer.renderBoard(
        STATE.board,
        STATE.scores,
        STATE.ended?null:(STATE.cur===0?'X':'O')
      );
    });
  }

  document.addEventListener('DOMContentLoaded',boot);
})(window);
