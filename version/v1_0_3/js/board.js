(function(global){
  const EMPTY = '.';
  const PLAYERS = ['X','O'];

  // ===== 组合加成 =====
  const COMBO_BONUS = {
    THREE: 0.2,   // 三连
    SQUARE: 0.3   // 2x2 方阵
  };

  const MAX_Z = 2.0;

  function makeCell(){
    return { owner: EMPTY, z: 1.0 };
  }

  function makeBoard(n){
    const b = [];
    for(let r=0;r<n;r++){
      const row=[];
      for(let c=0;c<n;c++) row.push(makeCell());
      b.push(row);
    }
    return b;
  }

  const inRange = (b,r,c)=>r>=0&&r<b.length&&c>=0&&c<b.length;

  // =====================================
  // 组合检测（只围绕新落子）
  // =====================================
  function detectCombos(board, r, c){
    const owner = board[r][c].owner;
    if(owner === EMPTY) return [];

    const combos = [];

    // ---- 三连（4 个方向）
    const dirs = [
      [[0,-1],[0,1]],
      [[-1,0],[1,0]],
      [[-1,-1],[1,1]],
      [[-1,1],[1,-1]]
    ];

    for(const [[dr1,dc1],[dr2,dc2]] of dirs){
      const r1=r+dr1, c1=c+dc1;
      const r2=r+dr2, c2=c+dc2;
      if(inRange(board,r1,c1)&&inRange(board,r2,c2)){
        if(board[r1][c1].owner===owner &&
           board[r2][c2].owner===owner){
          combos.push({
            type:'THREE',
            cells:[[r,c],[r1,c1],[r2,c2]]
          });
        }
      }
    }

    // ---- 方阵 2x2
    const squares = [
      [[0,0],[1,0],[0,1],[1,1]],
      [[0,0],[-1,0],[0,1],[-1,1]],
      [[0,0],[1,0],[0,-1],[1,-1]],
      [[0,0],[-1,0],[0,-1],[-1,-1]]
    ];

    for(const shape of squares){
      const cells=[];
      let ok=true;
      for(const [dr,dc] of shape){
        const nr=r+dr,nc=c+dc;
        if(!inRange(board,nr,nc) ||
           board[nr][nc].owner!==owner){
          ok=false; break;
        }
        cells.push([nr,nc]);
      }
      if(ok){
        combos.push({ type:'SQUARE', cells });
      }
    }

    return combos;
  }

  // =====================================
  // z 累积更新（关键修改点）
  // =====================================
  function updateZ(board, combos){
    // 用 Map 防止同一格重复累加同一 combo
    const acc = new Map();

    for(const combo of combos){
      const bonus = COMBO_BONUS[combo.type] || 0;
      for(const [r,c] of combo.cells){
        const key = r+','+c;
        acc.set(key, (acc.get(key)||0) + bonus);
      }
    }

    // 真正累积到 z 上
    for(const [key, add] of acc.entries()){
      const [r,c] = key.split(',').map(Number);
      const cell = board[r][c];
      cell.z = Math.min(MAX_Z, cell.z + add);
    }
  }

  // =====================================
  // placeAndScore（增量 A / B）
  // =====================================
  function placeAndScore(board, r, c, playerIdx){
    if(!inRange(board,r,c)) return null;
    if(board[r][c].owner !== EMPTY) return null;

    const me  = PLAYERS[playerIdx];
    const opp = PLAYERS[1-playerIdx];

    let A=0, B=0;

    // 邻域得分（使用已有 z）
    for(let dr=-1;dr<=1;dr++){
      for(let dc=-1;dc<=1;dc++){
        if(dr===0&&dc===0) continue;
        const nr=r+dr,nc=c+dc;
        if(!inRange(board,nr,nc)) continue;
        const nb = board[nr][nc];
        if(nb.owner===me)  A += nb.z;
        else if(nb.owner===opp) B += nb.z;
      }
    }

    // 落子
    board[r][c].owner = me;
    board[r][c].z = 1.0;

    // combo 检测 + z 累积
    const combos = detectCombos(board,r,c);
    if(combos.length){
      updateZ(board, combos);
    }

    return {A,B};
  }

  function boardFull(board){
    return board.every(row=>row.every(c=>c.owner!==EMPTY));
  }

  global.BoardModule = {
    EMPTY, PLAYERS,
    makeBoard,
    placeAndScore,
    boardFull
  };
})(window);
