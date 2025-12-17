// ai.js - 严格遵循需求的双策略AI
(function(global) {
  const Board = window.BoardModule;

  // ===================================================
  // Greedy算法（上古版本）
  // ===================================================
  function greedyChoose(board, playerIdx) {
    const n = board.length;
    let bestScore = -1e9;
    let bestMoves = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] !== Board.EMPTY) continue;
        
        // 复制棋盘模拟落子
        const copy = board.map(row => row.slice());
        const res = Board.placeAndScore(copy, r, c, playerIdx);
        if (!res) continue;
        
        // A + B*1.2 评分
        const score = res.A + res.B * 1.2;
        
        // 更新最优解
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [[r, c]];
        } else if (Math.abs(score - bestScore) < 1e-6) {
          bestMoves.push([r, c]);
        }
      }
    }

    // 随机选择最优位置
    return bestMoves.length > 0
      ? bestMoves[Math.floor(Math.random() * bestMoves.length)]
      : null;
  }

  // ===================================================
  // Lookahead算法（三阶段严格版）
  // ===================================================
  function lookaheadChoose(board, playerIdx) {
    const n = board.length;
    const oppIdx = 1 - playerIdx;
    
    // 阶段1：筛选最大线性增量 (ΔA+ΔB)
    let bestLinear = -1e9;
    let phase1Candidates = []; // 候选集P
    
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] !== Board.EMPTY) continue;
        
        // 模拟落子
        const copy = board.map(row => row.slice());
        const res = Board.placeAndScore(copy, r, c, playerIdx);
        if (!res) continue;
        
        const linearDelta = res.A + res.B;
        
        // 更新线性最优解
        if (linearDelta > bestLinear) {
          bestLinear = linearDelta;
          phase1Candidates = [{ r, c, deltaA: res.A, deltaB: res.B, newBoard: copy }];
        } else if (Math.abs(linearDelta - bestLinear) < 1e-6) {
          phase1Candidates.push({ r, c, deltaA: res.A, deltaB: res.B, newBoard: copy });
        }
      }
    }
    
    if (phase1Candidates.length === 0) return null;

    // 阶段2：最小化对手最大收益
    let minOppGain = 1e9;
    let phase2Candidates = []; // 子集Q
    
    for (const cand of phase1Candidates) {
      let oppBestGain = -1e9;
      
      // 在模拟后的棋盘上计算对手收益
      for (let oppR = 0; oppR < n; oppR++) {
        for (let oppC = 0; oppC < n; oppC++) {
          if (cand.newBoard[oppR][oppC] !== Board.EMPTY) continue;
          
          // 模拟对手落子
          const oppCopy = cand.newBoard.map(row => row.slice());
          const oppRes = Board.placeAndScore(oppCopy, oppR, oppC, oppIdx);
          if (!oppRes) continue;
          
          const oppGain = oppRes.A + oppRes.B;
          oppBestGain = Math.max(oppBestGain, oppGain);
        }
      }
      
      // 处理无合法移动的情况
      if (oppBestGain === -1e9) oppBestGain = 0;
      
      // 选择最小化对手收益的位置
      if (oppBestGain < minOppGain) {
        minOppGain = oppBestGain;
        phase2Candidates = [cand];
      } else if (Math.abs(oppBestGain - minOppGain) < 1e-6) {
        phase2Candidates.push(cand);
      }
    }

    // 阶段3：最大化乘积增量 (Δ(A*B))
    let bestProductDelta = -1e9;
    let finalMoves = [];
    
    for (const cand of phase2Candidates) {
      // 计算乘积增量: (A+ΔA)*(B+ΔB) - A*B
      const productDelta = cand.deltaA * cand.deltaB;
      
      if (productDelta > bestProductDelta) {
        bestProductDelta = productDelta;
        finalMoves = [[cand.r, cand.c]];
      } else if (Math.abs(productDelta - bestProductDelta) < 1e-6) {
        finalMoves.push([cand.r, cand.c]);
      }
    }
    
    // 随机选择最终位置
    return finalMoves.length > 0
      ? finalMoves[Math.floor(Math.random() * finalMoves.length)]
      : null;
  }

  // ===================================================
  // 对外接口
  // ===================================================
  function aiChoose(board, playerIdx, type = 'greedy') {
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
