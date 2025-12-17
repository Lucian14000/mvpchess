// main.js - 网页版入口逻辑（兼容鼠标/触摸）
// 版本：已适配新版 Renderer（包含 GameOver + Restart 按钮）
(function(global){
  const Board = global.BoardModule;
  const AI = global.AIModule;
  const Renderer = global.Renderer;

  const boardSize = 7;
  let STATE = {
    board: null,
    scores: null,
    cur: 0, // 0 = X 玩家, 1 = O AI
    gameEnded: false
  };

  let renderer = null;
  let aiDelayMs = 300;

  // ======================================================
  // 初始化游戏
  // ======================================================
  function initGame(canvas){
    const w = window.innerWidth;
    const h = window.innerHeight;

    if(!renderer){
      renderer = new Renderer(canvas, w, h, boardSize);

      // 注册 renderer 的“重新开始”按钮事件
      renderer.onRestart(() => {
        initGame(renderer.canvas);
      });

    } else {
      renderer.width = w;
      renderer.height = h;
      renderer.n = boardSize;
      renderer._calcGeometry();
    }

    renderer.resize(w, h);

    STATE.board = Board.makeBoard(boardSize);
    STATE.scores = { X:{A:0,B:0}, O:{A:0,B:0} };
    STATE.cur = 0;
    STATE.gameEnded = false;

    renderer.renderBoard(STATE.board, STATE.scores, 'X');
  }

  // ======================================================
  // 点击处理（玩家点击棋盘 OR 点击 GameOver 遮罩/重开按钮）
  // ======================================================
  function onCanvasTap(px, py){
    if(!renderer) return;

    // 统一交给 renderer 检查是否 GameOver 的按钮区域
    if(renderer.handleTap(px, py)){
      // 若点击到 GameOver 按钮或遮罩，这里直接 return
      return;
    }

    // 正常点击落子
    if(STATE.cur === 1 || STATE.gameEnded) return;

    const cell = renderer.pixelToCell(px, py);
    if(!cell) return;
    humanMove(cell.r, cell.c);
  }

  // ======================================================
  // 玩家落子
  // ======================================================
  function humanMove(r, c){
    const playerIdx = STATE.cur;

    const res = Board.placeAndScore(STATE.board, r, c, playerIdx);
    if(!res) return;

    // 记分
    const P = Board.PLAYERS[playerIdx];
    STATE.scores[P].A += res.A;
    STATE.scores[P].B += res.B;

    const nextPlayer = 'O';
    renderer.renderBoard(STATE.board, STATE.scores, nextPlayer);

    // 棋盘满了 → 游戏结束
    if(Board.boardFull(STATE.board)){
      endGame();
      return;
    }

    // 轮到 AI
    STATE.cur = 1;
    setTimeout(aiMove, aiDelayMs);
  }

  // ======================================================
  // AI 落子
  // ======================================================
  function aiMove(){
    if(STATE.gameEnded) return;

    const mv = AI.aiChoose(STATE.board, STATE.cur);
    if(!mv){
      STATE.cur = 0;
      return;
    }

    const [r, c] = mv;
    const res = Board.placeAndScore(STATE.board, r, c, STATE.cur);

    const P = Board.PLAYERS[STATE.cur];
    STATE.scores[P].A += res.A;
    STATE.scores[P].B += res.B;

    renderer.renderBoard(STATE.board, STATE.scores, 'X');

    if(Board.boardFull(STATE.board)){
      endGame();
      return;
    }

    STATE.cur = 0;
  }

  // ======================================================
  // 棋盘满 → 游戏结束
  // ======================================================
  function endGame(){
    STATE.gameEnded = true;

    const score = p => STATE.scores[p].A * STATE.scores[p].B;
    const sx = score('X');
    const so = score('O');

    let reason = '';
    if(sx > so) reason = '玩家胜利！';
    else if(sx < so) reason = 'AI胜利！';
    else reason = '平局！';

    const finalScore = `玩家:${sx}  AI:${so}`;

    // 调用 renderer 进入 GameOver 模式
    renderer.showGameOver(finalScore, reason);
  }

  // ======================================================
  // 页面加载 → 启动游戏
  // ======================================================
  function boot(){
    const canvas = document.getElementById('gameCanvas');
    if(!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    initGame(canvas);

    // 鼠标事件
    canvas.addEventListener('mousedown', e=>{
      onCanvasTap(e.clientX, e.clientY);
    }, {passive:true});

    // 触摸事件
    canvas.addEventListener('touchstart', e=>{
      if(!e.touches || e.touches.length===0) return;
      const t = e.touches[0];
      onCanvasTap(t.clientX, t.clientY);
    }, {passive:true});

    // 窗口大小变化
    window.addEventListener('resize', ()=>{
      const w = window.innerWidth;
      const h = window.innerHeight;
      if(renderer){
        renderer.resize(w, h);
        renderer.renderBoard(
          STATE.board,
          STATE.scores,
          STATE.gameEnded ? null : (STATE.cur===0?'X':'O')
        );
      }
    });
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(boot, 1);
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }

  global.WebGame = { initGame, onCanvasTap };

})(window);
