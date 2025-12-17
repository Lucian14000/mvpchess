// ai.js - 1.0.3 基础：z 权重感知（结构不变）
(function(global){
  const Board = global.BoardModule;

  // ===================================================
  // Greedy：最大化 A + B*1.2
  // ===================================================
  function greedyChoose(board, playerIdx){
    const n = board.length;
    let best = -1e9;
    let moves = [];

    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        if(board[r][c].owner !== Board.EMPTY) continue;

        const copy = board.map(row =>
          row.map(cell => ({ owner: cell.owner, z: cell.z }))
        );

        const res = Board.placeAndScore(copy, r, c, playerIdx);
        if(!res) continue;

        const score = res.A + res.B * 1.2;

        if(score > best){
          best = score;
          moves = [[r,c]];
        }else if(Math.abs(score - best) < 1e-6){
          moves.push([r,c]);
        }
      }
    }

    return moves.length
      ? moves[Math.floor(Math.random()*moves.length)]
      : null;
  }

  // ===================================================
  // Lookahead：三阶段严格版
  // ===================================================
  function lookaheadChoose(board, playerIdx){
    const n = board.length;
    const oppIdx = 1 - playerIdx;

    // -------- Phase 1：最大 Δ(A+B)
    let bestLinear = -1e9;
    let P = [];

    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        if(board[r][c].owner !== Board.EMPTY) continue;

        const copy = board.map(row =>
          row.map(cell => ({ owner: cell.owner, z: cell.z }))
        );

        const res = Board.placeAndScore(copy, r, c, playerIdx);
        if(!res) continue;

        const linear = res.A + res.B;

        if(linear > bestLinear){
          bestLinear = linear;
          P = [{ r, c, dA: res.A, dB: res.B, board: copy }];
        }else if(Math.abs(linear - bestLinear) < 1e-6){
          P.push({ r, c, dA: res.A, dB: res.B, board: copy });
        }
      }
    }

    if(P.length === 0) return null;

    // -------- Phase 2：最小化对手最大 Δ(A+B)
    let minOpp = 1e9;
    let Q = [];

    for(const cand of P){
      let oppBest = -1e9;

      for(let r=0;r<n;r++){
        for(let c=0;c<n;c++){
          if(cand.board[r][c].owner !== Board.EMPTY) continue;

          const copy2 = cand.board.map(row =>
            row.map(cell => ({ owner: cell.owner, z: cell.z }))
          );

          const res2 = Board.placeAndScore(copy2, r, c, oppIdx);
          if(!res2) continue;

          const gain = res2.A + res2.B;
          oppBest = Math.max(oppBest, gain);
        }
      }

      if(oppBest < 0) oppBest = 0;

      if(oppBest < minOpp){
        minOpp = oppBest;
        Q = [cand];
      }else if(Math.abs(oppBest - minOpp) < 1e-6){
        Q.push(cand);
      }
    }

    // -------- Phase 3：最大化 Δ(A*B)
    let bestProd = -1e9;
    let finals = [];

    for(const cand of Q){
      const prod = cand.dA * cand.dB;

      if(prod > bestProd){
        bestProd = prod;
        finals = [[cand.r, cand.c]];
      }else if(Math.abs(prod - bestProd) < 1e-6){
        finals.push([cand.r, cand.c]);
      }
    }

    return finals.length
      ? finals[Math.floor(Math.random()*finals.length)]
      : null;
  }

  function aiChoose(board, playerIdx, type='greedy'){
    return type === 'lookahead'
      ? lookaheadChoose(board, playerIdx)
      : greedyChoose(board, playerIdx);
  }

  global.AIModule = {
    aiChoose,
    greedyChoose,
    lookaheadChoose
  };
})(window);
