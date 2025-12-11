/**
 * 贪吃蛇游戏核心逻辑
 * 版本: 1.0 MVP
 * 功能: 游戏核心循环、碰撞检测、分数计算
 */

class SnakeGame {
    constructor(canvasId) {
        // 游戏画布和上下文
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏配置
        this.gridSize = 20; // 网格大小
        this.gridWidth = this.canvas.width / this.gridSize;
        this.gridHeight = this.canvas.height / this.gridSize;
        
        // 游戏状态
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.snakeLength = 3;
        
        // 蛇的初始状态
        this.snake = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // 食物位置
        this.food = { x: 0, y: 0 };
        
        // 游戏速度
        this.gameSpeed = 150; // 毫秒
        this.gameLoop = null;
        
        // 网格显示
        this.showGrid = false;
        
        // 初始化游戏
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 初始化蛇
        this.resetSnake();
        
        // 生成第一个食物
        this.generateFood();
        
        // 更新分数显示
        this.updateScoreDisplay();
        
        // 绑定键盘事件
        this.bindKeyboardEvents();
        
        // 绘制初始状态
        this.draw();
    }
    
    /**
     * 重置蛇的状态
     */
    resetSnake() {
        this.snake = [];
        this.snakeLength = 3;
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // 创建初始蛇身（水平排列）
        for (let i = 0; i < this.snakeLength; i++) {
            this.snake.push({
                x: Math.floor(this.gridWidth / 2) - i,
                y: Math.floor(this.gridHeight / 2)
            });
        }
    }
    
    /**
     * 生成食物
     */
    generateFood() {
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            this.food = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            // 检查食物是否生成在蛇身上
            for (const segment of this.snake) {
                if (segment.x === this.food.x && segment.y === this.food.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        if (this.gameState === 'start' || this.gameState === 'gameOver') {
            this.gameState = 'playing';
            this.score = 0;
            this.resetSnake();
            this.generateFood();
            this.updateScoreDisplay();
            this.runGameLoop();
        }
    }
    
    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            clearInterval(this.gameLoop);
        }
    }
    
    /**
     * 继续游戏
     */
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.runGameLoop();
        }
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.resetSnake();
        this.generateFood();
        this.updateScoreDisplay();
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.runGameLoop();
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.gameState = 'gameOver';
        clearInterval(this.gameLoop);
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        
        // 更新显示
        this.updateScoreDisplay();
    }
    
    /**
     * 运行游戏主循环
     */
    runGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, this.gameSpeed);
    }
    
    /**
     * 更新游戏状态
     */
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新方向
        this.direction = this.nextDirection;
        
        // 计算新的蛇头位置
        const head = { ...this.snake[0] };
        
        switch (this.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // 检查边界碰撞
        if (head.x < 0 || head.x >= this.gridWidth || 
            head.y < 0 || head.y >= this.gridHeight) {
            this.gameOver();
            return;
        }
        
        // 检查自身碰撞
        for (const segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        // 添加新的蛇头
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 增加分数和长度
            this.score += 10;
            this.snakeLength++;
            
            // 生成新食物
            this.generateFood();
            
            // 更新显示
            this.updateScoreDisplay();
            
            // 播放吃食物效果（视觉反馈）
            this.playEatEffect();
        } else {
            // 如果没有吃到食物，移除蛇尾
            this.snake.pop();
        }
    }
    
    /**
     * 绘制游戏
     */
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制游戏状态
        this.drawGameState();
    }
    
    /**
     * 绘制网格
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制食物
     */
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // 食物渐变效果
        const gradient = this.ctx.createRadialGradient(
            x + this.gridSize / 2,
            y + this.gridSize / 2,
            0,
            x + this.gridSize / 2,
            y + this.gridSize / 2,
            this.gridSize / 2
        );
        
        gradient.addColorStop(0, '#FF5252');
        gradient.addColorStop(1, '#D32F2F');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4, 5);
        this.ctx.fill();
        
        // 食物高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            x + this.gridSize / 3,
            y + this.gridSize / 3,
            this.gridSize / 6,
            this.gridSize / 6,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
    }
    
    /**
     * 绘制蛇
     */
    drawSnake() {
        // 绘制蛇身
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // 蛇头使用不同颜色
            if (i === 0) {
                // 蛇头渐变
                const headGradient = this.ctx.createLinearGradient(
                    x, y,
                    x + this.gridSize, y + this.gridSize
                );
                headGradient.addColorStop(0, '#4CAF50');
                headGradient.addColorStop(1, '#2E7D32');
                this.ctx.fillStyle = headGradient;
            } else {
                // 蛇身渐变
                const bodyGradient = this.ctx.createLinearGradient(
                    x, y,
                    x + this.gridSize, y + this.gridSize
                );
                const intensity = 1 - (i / this.snake.length) * 0.5;
                bodyGradient.addColorStop(0, `rgba(76, 175, 80, ${intensity})`);
                bodyGradient.addColorStop(1, `rgba(46, 125, 50, ${intensity})`);
                this.ctx.fillStyle = bodyGradient;
            }
            
            // 绘制蛇身段
            this.ctx.beginPath();
            this.ctx.roundRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 4);
            this.ctx.fill();
            
            // 蛇身段边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 绘制蛇眼睛（只在蛇头）
            if (i === 0) {
                this.ctx.fillStyle = 'white';
                
                // 根据方向确定眼睛位置
                let eye1X, eye1Y, eye2X, eye2Y;
                
                switch (this.direction) {
                    case 'right':
                        eye1X = x + this.gridSize - 6;
                        eye1Y = y + 6;
                        eye2X = x + this.gridSize - 6;
                        eye2Y = y + this.gridSize - 6;
                        break;
                    case 'left':
                        eye1X = x + 6;
                        eye1Y = y + 6;
                        eye2X = x + 6;
                        eye2Y = y + this.gridSize - 6;
                        break;
                    case 'up':
                        eye1X = x + 6;
                        eye1Y = y + 6;
                        eye2X = x + this.gridSize - 6;
                        eye2Y = y + 6;
                        break;
                    case 'down':
                        eye1X = x + 6;
                        eye1Y = y + this.gridSize - 6;
                        eye2X = x + this.gridSize - 6;
                        eye2Y = y + this.gridSize - 6;
                        break;
                }
                
                // 绘制眼睛
                this.ctx.beginPath();
                this.ctx.arc(eye1X, eye1Y, 2, 0, Math.PI * 2);
                this.ctx.arc(eye2X, eye2Y, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 绘制瞳孔
                this.ctx.fillStyle = '#333';
                this.ctx.beginPath();
                this.ctx.arc(eye1X, eye1Y, 1, 0, Math.PI * 2);
                this.ctx.arc(eye2X, eye2Y, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    /**
     * 绘制游戏状态信息
     */
    drawGameState() {
        if (this.gameState === 'playing') {
            // 在游戏进行时显示方向提示
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`方向: ${this.getDirectionText(this.direction)}`, 10, 20);
        }
    }
    
    /**
     * 获取方向文本
     */
    getDirectionText(dir) {
        const directions = {
            'up': '上',
            'down': '下',
            'left': '左',
            'right': '右'
        };
        return directions[dir] || dir;
    }
    
    /**
     * 播放吃食物效果
     */
    playEatEffect() {
        // 创建食物位置的粒子效果
        const x = this.food.x * this.gridSize + this.gridSize / 2;
        const y = this.food.y * this.gridSize + this.gridSize / 2;
        
        // 绘制粒子效果
        this.ctx.fillStyle = '#FF9800';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 5;
            const particleX = x + Math.cos(angle) * radius;
            const particleY = y + Math.sin(angle) * radius;
            
            this.ctx.beginPath();
            this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('snakeLength').textContent = this.snakeLength;
        
        // 更新结束界面的分数
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        
        // 检查是否打破记录
        const newRecordMsg = document.getElementById('newRecordMsg');
        if (this.score > this.highScore - 10 && this.gameState === 'gameOver') {
            newRecordMsg.textContent = '🎉 恭喜打破最高记录！';
        } else {
            newRecordMsg.textContent = '';
        }
    }
    
    /**
     * 切换网格显示
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        document.getElementById('gridStatus').textContent = this.showGrid ? '开' : '关';
        this.draw();
    }
    
    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            // 防止按键滚动页面
            if ([37, 38, 39, 40, 65, 87, 83, 68].includes(e.keyCode)) {
                e.preventDefault();
            }
            
            let newDirection;
            
            // 方向键控制
            switch (e.keyCode) {
                case 38: // 上箭头
                case 87: // W
                    newDirection = 'up';
                    break;
                case 40: // 下箭头
                case 83: // S
                    newDirection = 'down';
                    break;
                case 37: // 左箭头
                case 65: // A
                    newDirection = 'left';
                    break;
                case 39: // 右箭头
                case 68: // D
                    newDirection = 'right';
                    break;
            }
            
            // 防止直接反向移动
            if (newDirection) {
                const oppositeDirections = {
                    'up': 'down',
                    'down': 'up',
                    'left': 'right',
                    'right': 'left'
                };
                
                if (newDirection !== oppositeDirections[this.direction]) {
                    this.nextDirection = newDirection;
                }
            }
        });
    }
    
    /**
     * 改变方向（用于移动端按钮）
     */
    changeDirection(newDirection) {
        if (this.gameState !== 'playing') return;
        
        const oppositeDirections = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        if (newDirection !== oppositeDirections[this.direction]) {
            this.nextDirection = newDirection;
        }
    }
    
    /**
     * 获取游戏状态
     */
    getGameState() {
        return this.gameState;
    }
    
    /**
     * 设置游戏状态
     */
    setGameState(state) {
        this.gameState = state;
    }
}

// 为Canvas添加roundRect方法（如果不存在）
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}