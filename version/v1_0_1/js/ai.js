// ai.js - Greedy + 想一步对手（Lookahead-1）
(function(global){
  const Board = window.BoardModule;

  const W_B = 1.2; // B 权重

  function moveGain(board, r, c, playerIdx){
    const copy = board.map(row => row.slice());
    const res = Board.placeAndScore(copy, r, c, playerIdx);
    if(!res) return null;
    return {
      gain: res.A + res.B * W_B,
      board: copy
    };
  }

  // ===================================================
  // Greedy：只看当前一步
  // ===================================================
  function greedyChoose(board, playerIdx){
    const n = board.length;
    let best = -1e9;
    let moves = [];

    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        if(board[r][c] !== Board.EMPTY) continue;
        const g = moveGain(board, r, c, playerIdx);
        if(!g) continue;

        if(g.gain > best){
          best = g.gain;
          moves = [[r,c]];
        } else if(Math.abs(g.gain - best) < 1e-6){
          moves.push([r,c]);
        }
      }
    }

    if(moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // ===================================================
  // Lookahead-1：我 − 对手 greedy
  // ===================================================
  function lookaheadChoose(board, playerIdx){
    const n = board.length;
    const oppIdx = 1 - playerIdx;

    let bestEval = -1e9;
    let bestMoves = [];

    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        if(board[r][c] !== Board.EMPTY) continue;

        const g = moveGain(board, r, c, playerIdx);
        if(!g) continue;

        let oppBest = 0;

        // 棋盘未满 → 计算对手 greedy 最大收益
        if(!Board.boardFull(g.board)){
          for(let rr=0;rr<n;rr++){
            for(let cc=0;cc<n;cc++){
              if(g.board[rr][cc] !== Board.EMPTY) continue;
              const og = moveGain(g.board, rr, cc, oppIdx);
              if(!og) continue;
              oppBest = Math.max(oppBest, og.gain);
            }
          }
        }

        const evalScore = g.gain - oppBest;

        if(evalScore > bestEval){
          bestEval = evalScore;
          bestMoves = [[r,c]];
        } else if(Math.abs(evalScore - bestEval) < 1e-6){
          bestMoves.push([r,c]);
        }
      }
    }

    if(bestMoves.length === 0) return null;
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  // ===================================================
  // 对外接口
  // ===================================================
  function aiChoose(board, playerIdx, type='greedy'){
    if(type === 'lookahead') return lookaheadChoose(board, playerIdx);
    return greedyChoose(board, playerIdx);
  }

  global.AIModule = {
    aiChoose,
    greedyChoose,
    lookaheadChoose
  };
})(window);
