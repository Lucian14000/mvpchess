// renderer.js - 基于你提供版本修复：不黑屏 + 正常 GameOver
(function(global){
  const images = {
    black: 'images/black.png',
    white: 'images/white.png'
  };

  function loadImage(src){
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = (e) => rej(e);
      img.src = src;
    });
  }

  class Renderer {
    constructor(canvas, width, height, n){
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = width;
      this.height = height;
      this.n = n;

      this.dpr = window.devicePixelRatio || 1;
      this.imgBlack = null;
      this.imgWhite = null;

      // 状态
      this.gameEnded = false;
      this.restartCallback = null;
      this.cachedBoard = null;   // ★ 修复：结束时缓存棋盘避免黑屏
      this.cachedScores = null;
      this.cachedNext = null;

      this._calcGeometry();

      this._imagesLoaded = Promise.all([
        loadImage(images.black).catch(()=>null),
        loadImage(images.white).catch(()=>null)
      ]).then(([b,w]) => {
        this.imgBlack = b;
        this.imgWhite = w;
      });
    }

    onRestart(cb){
      this.restartCallback = cb;
    }

    _calcGeometry(){
      this.bgWidth  = this.width * 0.85;
      this.bgHeight = this.height * 0.85;

      this.boardSize = this.bgHeight * 0.65;
      this.cell = this.boardSize / this.n;

      this.offsetX = (this.width - this.bgWidth) / 2;
      this.offsetY = (this.height - this.bgHeight) / 2;

      this.boardOffsetX = this.offsetX + (this.bgWidth - this.boardSize)/2;
      this.boardOffsetY = this.offsetY + this.bgHeight * 0.18;

      this.fontSizeTitle = Math.max(10, Math.floor(this.width * 0.022));
      this.fontSizeTurn  = Math.max(9, Math.floor(this.width * 0.02));
      this.fontSizeRule  = Math.max(9, Math.floor(this.width * 0.018));
    }

    resize(width, height){
      this.width = width;
      this.height = height;

      const cssW = Math.floor(width);
      const cssH = Math.floor(height);

      this.canvas.style.width = cssW + 'px';
      this.canvas.style.height = cssH + 'px';
      this.canvas.width = Math.floor(cssW * this.dpr);
      this.canvas.height = Math.floor(cssH * this.dpr);

      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this._calcGeometry();
    }

    // =====================================================
    // 主渲染函数
    // =====================================================
    renderBoard(board, scores, nextPlayer=null){
      // ★ 修复：缓存当前游戏画面，避免 showGameOver([]) 黑屏
      this.cachedBoard  = board;
      this.cachedScores = scores;
      this.cachedNext   = nextPlayer;

      this._imagesLoaded.then(()=>{
        const ctx = this.ctx;
        ctx.clearRect(0,0,this.width,this.height);

        // 幕布
        ctx.fillStyle = '#f6f1dc';
        ctx.fillRect(this.offsetX, this.offsetY, this.bgWidth, this.bgHeight);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = Math.max(1, this.width * 0.005);
        ctx.strokeRect(this.offsetX, this.offsetY, this.bgWidth, this.bgHeight);

        // 分数
        if(scores){
          ctx.fillStyle = '#333';
          ctx.font = `bold ${this.fontSizeTitle}px sans-serif`;
          ctx.textAlign = 'left';
          const y1 = this.offsetY + this.fontSizeTitle*1.5;

          ctx.fillText(
            `玩家: A=${scores.X.A} B=${scores.X.B}    AI: A=${scores.O.A} B=${scores.O.B}`,
            this.offsetX + this.bgWidth*0.04,
            y1
          );

          ctx.font = `${this.fontSizeTurn}px sans-serif`;
          ctx.fillStyle = nextPlayer === 'X' ? '#c00' : '#00c';
          ctx.fillText(
            nextPlayer === 'X' ? '玩家回合' : 'AI思考中...',
            this.offsetX + this.bgWidth*0.04,
            y1 + this.fontSizeTurn*1.4
          );
        }

        // 棋盘网格
        ctx.strokeStyle = '#000';
        ctx.lineWidth = Math.max(1, this.width * 0.0015);

        for(let i=0;i<=this.n;i++){
          ctx.beginPath();
          ctx.moveTo(this.boardOffsetX, this.boardOffsetY + i*this.cell);
          ctx.lineTo(this.boardOffsetX + this.boardSize, this.boardOffsetY + i*this.cell);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(this.boardOffsetX + i*this.cell, this.boardOffsetY);
          ctx.lineTo(this.boardOffsetX + i*this.cell, this.boardOffsetY + this.boardSize);
          ctx.stroke();
        }

        // 棋子
        const pad = this.cell * 0.12;
        for(let r=0;r<this.n;r++){
          for(let c=0;c<this.n;c++){
            if(board[r][c] === '.') continue;
            const x = this.boardOffsetX + c*this.cell;
            const y = this.boardOffsetY + r*this.cell;

            let img = board[r][c] === 'X' ? this.imgBlack : this.imgWhite;
            if(img)
              ctx.drawImage(img, x+pad, y+pad, this.cell-pad*2, this.cell-pad*2);
            else {
              ctx.fillStyle = board[r][c]==='X'?'#000':'#fff';
              ctx.beginPath();
              ctx.arc(x+this.cell/2, y+this.cell/2, this.cell/2-pad, 0, Math.PI*2);
              ctx.fill();
            }
          }
        }

        // 规则文字
        ctx.fillStyle = '#333';
        ctx.font = `${this.fontSizeRule}px sans-serif`;
        ctx.textAlign = 'center';
        const ruleY = this.offsetY + this.bgHeight * 0.95;
        this._wrapText(
          ctx,
          '规则：每次落子会根据相邻同色增加A分，相邻异色增加B分。',
          this.offsetX + this.bgWidth/2,
          ruleY,
          this.bgWidth*0.9,
          this.fontSizeRule*1.2
        );

        // GameOver 叠加层
        if(this.gameEnded){
          this._drawGameOverLayer();
        }
      });
    }

    // =====================================================
    // GameOver 层
    // =====================================================
    _drawGameOverLayer(){
      const ctx = this.ctx;

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = `bold ${this.width*0.05}px sans-serif`;
      ctx.fillText("游戏结束", this.width/2, this.height*0.35);

      ctx.font = `${this.width*0.04}px sans-serif`;
      ctx.fillText(this.endReason || "棋盘已满", this.width/2, this.height*0.45);

      ctx.fillText(`最终得分：${this.finalScore||0}`, this.width/2, this.height*0.55);

      const bw = this.width*0.32;
      const bh = this.height*0.10;
      const bx = (this.width - bw)/2;
      const by = this.height*0.62;

      this.restartBtn = {x:bx, y:by, w:bw, h:bh};

      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = "#fff";
      ctx.font = `bold ${this.width*0.045}px sans-serif`;
      ctx.fillText("重新开始", this.width/2, by + bh*0.67);
    }

    // =====================================================
    // 外部调用：进入 GameOver 状态
    // =====================================================
    showGameOver(finalScore, reason="游戏结束"){
      this.gameEnded = true;
      this.finalScore = finalScore;
      this.endReason = reason;

      // ★ 修复：使用缓存的完整棋盘重绘，而不是空数组
      this.renderBoard(this.cachedBoard, this.cachedScores, this.cachedNext);
    }

    handleTap(px, py){
      if(!this.gameEnded) return false;

      const b = this.restartBtn;
      if(!b) return false;

      if(px >= b.x && px <= b.x+b.w && py >= b.y && py <= b.y+b.h){
        this.gameEnded = false;
        if(this.restartCallback) this.restartCallback();
        return true;
      }
      return true;
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight){
      const words = text.split(' ');
      let line = '';
      for(let n=0;n<words.length;n++){
        const test = line + words[n] + ' ';
        const w = ctx.measureText(test).width;
        if(w > maxWidth && n>0){
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else line = test;
      }
      ctx.fillText(line, x, y);
    }

    pixelToCell(px, py){
      const c = Math.floor((px - this.boardOffsetX) / this.cell);
      const r = Math.floor((py - this.boardOffsetY) / this.cell);
      if(r<0||r>=this.n||c<0||c>=this.n) return null;
      return {r,c};
    }
  }

  global.Renderer = Renderer;
})(window);
