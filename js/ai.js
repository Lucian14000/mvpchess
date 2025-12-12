// ai.js - 简单贪心 AI，使用 board copy + placeAndScore 做模拟
(function(global){
  const Board = window.BoardModule;

  function aiChoose(board, playerIdx){
    const n = board.length;
    let bestScore = -1e9;
    let bestMoves = [];

    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        if(board[r][c] !== Board.EMPTY) continue;
        // 复制棋盘模拟
        const copy = board.map(row => row.slice());
        const res = Board.placeAndScore(copy, r, c, playerIdx);
        if(!res) continue;
        const score = res.A + res.B * 1.2;
        if(score > bestScore){
          bestScore = score;
          bestMoves = [[r,c]];
        } else if(Math.abs(score - bestScore) < 1e-6){
          bestMoves.push([r,c]);
        }
      }
    }

    if(bestMoves.length === 0) return null;
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  global.AIModule = { aiChoose };
})(window);
