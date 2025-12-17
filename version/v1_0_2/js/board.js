// board.js - 提供 makeBoard, placeAndScore, boardFull, PLAYERS, EMPTY
(function(global){
  const EMPTY = '.';
  const PLAYERS = ['X','O'];

  function makeBoard(n){
    const b = [];
    for(let i=0;i<n;i++){
      b.push(new Array(n).fill(EMPTY));
    }
    return b;
  }

  // placeAndScore: 改变 board（原地），返回 {A,B} 或 null（非法）
  function placeAndScore(board, r, c, playerIdx){
    if(!Array.isArray(board)) return null;
    if(r < 0 || r >= board.length || c < 0 || c >= board.length) return null;
    if(board[r][c] !== EMPTY) return null;

    const me = PLAYERS[playerIdx];
    const opp = PLAYERS[1-playerIdx];

    let A = 0, B = 0;
    const n = board.length;
    for(let dr=-1; dr<=1; dr++){
      for(let dc=-1; dc<=1; dc++){
        if(dr===0 && dc===0) continue;
        const nr = r+dr, nc = c+dc;
        if(nr<0||nr>=n||nc<0||nc>=n) continue;
        if(board[nr][nc]===me) A++;
        else if(board[nr][nc]===opp) B++;
      }
    }

    board[r][c] = me;
    return {A,B};
  }

  function boardFull(board){
    for(const row of board){
      for(const cell of row){
        if(cell === EMPTY) return false;
      }
    }
    return true;
  }

  global.BoardModule = {
    EMPTY, PLAYERS, makeBoard, placeAndScore, boardFull
  };
})(window);
