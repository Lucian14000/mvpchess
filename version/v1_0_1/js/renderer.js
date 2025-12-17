// renderer.js - 视觉恢复版（无按钮、无输入）
(function(global){
  const images = {
    black: 'images/black.png',
    white: 'images/white.png'
  };

  function loadImage(src){
    return new Promise(res=>{
      const img = new Image();
      img.onload = ()=>res(img);
      img.onerror = ()=>res(null);
      img.src = src;
    });
  }

  class Renderer{
    constructor(canvas, width, height, n){
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = width;
      this.height = height;
      this.n = n;
      this.dpr = window.devicePixelRatio || 1;

      this.gameEnded = false;
      this.cachedBoard = null;
      this.cachedScores = null;
      this.cachedNext = null;

      this.resize(width, height);

      Promise.all([
        loadImage(images.black),
        loadImage(images.white)
      ]).then(([b,w])=>{
        this.imgBlack = b;
        this.imgWhite = w;
      });
    }

    resize(w,h){
      this.width = w;
      this.height = h;

      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);

      this._calcGeometry();
    }

    _calcGeometry(){
      // 背景幕布
      this.bgWidth  = this.width * 0.88;
      this.bgHeight = this.height * 0.88;

      // 棋盘
      this.boardSize = this.bgHeight * 0.65;
      this.cell = this.boardSize / this.n;

      this.offsetX = (this.width - this.bgWidth) / 2;
      this.offsetY = (this.height - this.bgHeight) / 2;

      this.boardOffsetX = this.offsetX + (this.bgWidth - this.boardSize)/2;
      this.boardOffsetY = this.offsetY + this.bgHeight * 0.18;

      // 字号（和旧版接近）
      this.fontTitle = Math.max(14, this.width * 0.024);
      this.fontTurn  = Math.max(12, this.width * 0.020);
      this.fontRule  = Math.max(11, this.width * 0.018);
    }

    // =====================================================
    // 主绘制
    // =====================================================
    renderBoard(board, scores, nextPlayer){
      this.cachedBoard  = board;
      this.cachedScores = scores;
      this.cachedNext   = nextPlayer;

      const ctx = this.ctx;
      ctx.clearRect(0,0,this.width,this.height);

      // ===== 背景幕布 =====
      ctx.fillStyle = '#f6f1dc';
      ctx.fillRect(this.offsetX, this.offsetY, this.bgWidth, this.bgHeight);

      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = Math.max(2, this.width * 0.004);
      ctx.strokeRect(this.offsetX, this.offsetY, this.bgWidth, this.bgHeight);

      // ===== 标题 & 分数 =====
      if(scores){
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.font = `bold ${this.fontTitle}px sans-serif`;

        const y = this.offsetY + this.fontTitle * 1.6;
        ctx.fillText(
          `玩家：A=${scores.X.A} B=${scores.X.B}    AI：A=${scores.O.A} B=${scores.O.B}`,
          this.offsetX + this.bgWidth * 0.05,
          y
        );

        ctx.font = `${this.fontTurn}px sans-serif`;
        ctx.fillStyle = nextPlayer === 'X' ? '#b00000' : '#0033aa';
        ctx.fillText(
          nextPlayer === 'X' ? '玩家回合' : 'AI 思考中…',
          this.offsetX + this.bgWidth * 0.05,
          y + this.fontTurn * 1.4
        );
      }

      // ===== 棋盘网格 =====
      ctx.strokeStyle = '#000';
      ctx.lineWidth = Math.max(1, this.width * 0.0016);

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

      // ===== 棋子 =====
      const pad = this.cell * 0.12;
      for(let r=0;r<this.n;r++){
        for(let c=0;c<this.n;c++){
          if(board[r][c]==='.') continue;
          const x = this.boardOffsetX + c*this.cell;
          const y = this.boardOffsetY + r*this.cell;
          const img = board[r][c]==='X' ? this.imgBlack : this.imgWhite;
          if(img){
            ctx.drawImage(img, x+pad, y+pad, this.cell-pad*2, this.cell-pad*2);
          }
        }
      }

      // ===== 规则说明 =====
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.font = `${this.fontRule}px sans-serif`;
      this._wrapText(
        ctx,
        '规则：每次落子会根据相邻同色增加 A 分，相邻异色增加 B 分。',
        this.offsetX + this.bgWidth/2,
        this.offsetY + this.bgHeight * 0.95,
        this.bgWidth * 0.9,
        this.fontRule * 1.25
      );

      // ===== GameOver 遮罩 =====
      if(this.gameEnded){
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0,0,this.width,this.height);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = `bold ${this.width*0.05}px sans-serif`;
        ctx.fillText('游戏结束', this.width/2, this.height*0.42);

        ctx.font = `${this.width*0.035}px sans-serif`;
        ctx.fillText(this.finalText||'', this.width/2, this.height*0.52);
      }
    }

    showGameOver(text){
      this.gameEnded = true;
      this.finalText = text;
      this.renderBoard(this.cachedBoard, this.cachedScores, this.cachedNext);
    }

    clearGameOver(){
      this.gameEnded = false;
      this.finalText = null;
    }

    pixelToCell(px,py){
      const c = Math.floor((px - this.boardOffsetX) / this.cell);
      const r = Math.floor((py - this.boardOffsetY) / this.cell);
      if(r<0||c<0||r>=this.n||c>=this.n) return null;
      return {r,c};
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight){
      const words = text.split(' ');
      let line = '';
      for(let i=0;i<words.length;i++){
        const test = line + words[i] + ' ';
        if(ctx.measureText(test).width > maxWidth && i>0){
          ctx.fillText(line, x, y);
          line = words[i] + ' ';
          y += lineHeight;
        }else{
          line = test;
        }
      }
      ctx.fillText(line, x, y);
    }
  }

  global.Renderer = Renderer;
})(window);
