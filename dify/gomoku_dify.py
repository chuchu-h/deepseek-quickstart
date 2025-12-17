# main.py
import pygame
import sys
import random
import math
from enum import Enum
import socket
import threading
import json
import time

# 初始化pygame
pygame.init()

# 常量定义
BOARD_SIZE = 15
GRID_SIZE = 40
MARGIN = 50
WINDOW_WIDTH = BOARD_SIZE * GRID_SIZE + 2 * MARGIN
WINDOW_HEIGHT = BOARD_SIZE * GRID_SIZE + 2 * MARGIN + 100
FPS = 60

# 颜色定义
class Colors:
    BACKGROUND = (240, 217, 181)  # 米色背景
    BOARD = (222, 184, 135)       # 木质棋盘
    LINE = (101, 67, 33)          # 深棕色线条
    BLACK = (0, 0, 0)             # 黑棋
    WHITE = (255, 255, 255)       # 白棋
    HIGHLIGHT = (255, 0, 0)       # 红色高亮
    TEXT = (50, 50, 50)           # 深灰色文字
    BUTTON = (180, 134, 99)       # 按钮颜色
    BUTTON_HOVER = (200, 154, 119) # 按钮悬停颜色

# 游戏状态枚举
class GameState(Enum):
    MENU = 1
    PLAYING = 2
    GAME_OVER = 3
    ONLINE_WAITING = 4

# 玩家类型枚举
class PlayerType(Enum):
    HUMAN = 1
    AI = 2
    ONLINE = 3

# 游戏模式枚举
class GameMode(Enum):
    HUMAN_VS_AI = 1
    HUMAN_VS_HUMAN = 2
    ONLINE = 3

# 难度级别枚举
class Difficulty(Enum):
    EASY = 1
    MEDIUM = 2
    HARD = 3

class GomokuGame:
    def __init__(self):
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("智弈五子棋")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont(None, 36)
        self.small_font = pygame.font.SysFont(None, 24)
        
        # 游戏状态
        self.state = GameState.MENU
        self.mode = GameMode.HUMAN_VS_AI
        self.difficulty = Difficulty.MEDIUM
        
        # 棋盘状态
        self.board = [[0 for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        self.current_player = 1  # 1:黑棋, -1:白棋
        self.game_over = False
        self.winner = 0
        self.winning_line = []
        self.last_move = None
        
        # 玩家设置
        self.player1_type = PlayerType.HUMAN
        self.player2_type = PlayerType.AI
        
        # 在线对战
        self.online_socket = None
        self.online_thread = None
        self.is_online_host = False
        self.opponent_name = "对手"
        self.player_name = "玩家"
        
        # 悔棋相关
        self.move_history = []
        self.max_undo = 3
        self.undo_count = 0
        
        # 音效（使用系统默认声音）
        self.sound_enabled = True
        
        # 初始化按钮
        self.init_buttons()
        
    def init_buttons(self):
        button_width = 200
        button_height = 50
        button_margin = 20
        
        # 主菜单按钮
        center_x = WINDOW_WIDTH // 2
        start_y = WINDOW_HEIGHT // 2 - 100
        
        self.menu_buttons = {
            'vs_ai': pygame.Rect(center_x - button_width//2, start_y, button_width, button_height),
            'vs_human': pygame.Rect(center_x - button_width//2, start_y + button_height + button_margin, button_width, button_height),
            'online': pygame.Rect(center_x - button_width//2, start_y + 2*(button_height + button_margin), button_width, button_height),
            'quit': pygame.Rect(center_x - button_width//2, start_y + 3*(button_height + button_margin), button_width, button_height)
        }
        
        # 游戏内按钮
        bottom_y = WINDOW_HEIGHT - 80
        self.game_buttons = {
            'undo': pygame.Rect(50, bottom_y, 80, 40),
            'surrender': pygame.Rect(150, bottom_y, 80, 40),
            'menu': pygame.Rect(WINDOW_WIDTH - 130, bottom_y, 80, 40),
            'restart': pygame.Rect(WINDOW_WIDTH - 230, bottom_y, 80, 40)
        }
        
        # 难度选择按钮
        diff_y = WINDOW_HEIGHT // 2 + 50
        self.diff_buttons = {
            'easy': pygame.Rect(center_x - 320, diff_y, 100, 40),
            'medium': pygame.Rect(center_x - 110, diff_y, 100, 40),
            'hard': pygame.Rect(center_x + 100, diff_y, 100, 40)
        }
        
        # 在线对战按钮
        online_y = WINDOW_HEIGHT // 2
        self.online_buttons = {
            'host': pygame.Rect(center_x - button_width//2, online_y - 60, button_width, button_height),
            'join': pygame.Rect(center_x - button_width//2, online_y + 10, button_width, button_height),
            'back': pygame.Rect(center_x - button_width//2, online_y + 80, button_width, button_height)
        }

    def draw_board(self):
        # 绘制棋盘背景
        board_rect = pygame.Rect(MARGIN, MARGIN, 
                                BOARD_SIZE * GRID_SIZE, 
                                BOARD_SIZE * GRID_SIZE)
        pygame.draw.rect(self.screen, Colors.BOARD, board_rect)
        
        # 绘制网格线
        for i in range(BOARD_SIZE):
            # 横线
            start_pos = (MARGIN, MARGIN + i * GRID_SIZE)
            end_pos = (MARGIN + (BOARD_SIZE-1) * GRID_SIZE, MARGIN + i * GRID_SIZE)
            pygame.draw.line(self.screen, Colors.LINE, start_pos, end_pos, 2)
            
            # 竖线
            start_pos = (MARGIN + i * GRID_SIZE, MARGIN)
            end_pos = (MARGIN + i * GRID_SIZE, MARGIN + (BOARD_SIZE-1) * GRID_SIZE)
            pygame.draw.line(self.screen, Colors.LINE, start_pos, end_pos, 2)
        
        # 绘制天元和小星
        center = BOARD_SIZE // 2
        stars = [(3, 3), (3, 11), (11, 3), (11, 11), (7, 7)]
        for x, y in stars:
            pos = (MARGIN + x * GRID_SIZE, MARGIN + y * GRID_SIZE)
            pygame.draw.circle(self.screen, Colors.LINE, pos, 5)
        
        # 绘制棋子
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                if self.board[row][col] != 0:
                    pos = (MARGIN + col * GRID_SIZE, MARGIN + row * GRID_SIZE)
                    color = Colors.BLACK if self.board[row][col] == 1 else Colors.WHITE
                    pygame.draw.circle(self.screen, color, pos, GRID_SIZE//2 - 2)
                    
                    # 如果是最后一步，添加高亮
                    if self.last_move == (row, col):
                        pygame.draw.circle(self.screen, Colors.HIGHLIGHT, pos, GRID_SIZE//2 - 2, 2)
        
        # 绘制获胜连线
        if self.winning_line:
            for i in range(len(self.winning_line)-1):
                start = (MARGIN + self.winning_line[i][1] * GRID_SIZE,
                        MARGIN + self.winning_line[i][0] * GRID_SIZE)
                end = (MARGIN + self.winning_line[i+1][1] * GRID_SIZE,
                      MARGIN + self.winning_line[i+1][0] * GRID_SIZE)
                pygame.draw.line(self.screen, Colors.HIGHLIGHT, start, end, 4)

    def draw_ui(self):
        # 绘制当前玩家提示
        if not self.game_over:
            player_text = "黑棋回合" if self.current_player == 1 else "白棋回合"
            color = Colors.BLACK if self.current_player == 1 else Colors.TEXT
            text_surf = self.font.render(player_text, True, color)
            self.screen.blit(text_surf, (WINDOW_WIDTH//2 - text_surf.get_width()//2, 20))
        
        # 绘制游戏模式提示
        mode_text = ""
        if self.mode == GameMode.HUMAN_VS_AI:
            mode_text = "人机对战"
        elif self.mode == GameMode.HUMAN_VS_HUMAN:
            mode_text = "双人对战"
        elif self.mode == GameMode.ONLINE:
            mode_text = f"在线对战 - {self.player_name} vs {self.opponent_name}"
        
        mode_surf = self.small_font.render(mode_text, True, Colors.TEXT)
        self.screen.blit(mode_surf, (WINDOW_WIDTH//2 - mode_surf.get_width()//2, 60))
        
        # 绘制游戏结束提示
        if self.game_over:
            if self.winner == 0:
                result_text = "平局！"
            else:
                winner_color = "黑棋" if self.winner == 1 else "白棋"
                result_text = f"{winner_color}获胜！"
            
            result_surf = self.font.render(result_text, True, Colors.HIGHLIGHT)
            self.screen.blit(result_surf, (WINDOW_WIDTH//2 - result_surf.get_width()//2, 20))

    def draw_button(self, rect, text, hover=False):
        color = Colors.BUTTON_HOVER if hover else Colors.BUTTON
        pygame.draw.rect(self.screen, color, rect, border_radius=10)
        pygame.draw.rect(self.screen, Colors.LINE, rect, 2, border_radius=10)
        
        text_surf = self.small_font.render(text, True, Colors.WHITE)
        text_rect = text_surf.get_rect(center=rect.center)
        self.screen.blit(text_surf, text_rect)

    def draw_menu(self):
        # 绘制标题
        title = self.font.render("智弈五子棋", True, Colors.TEXT)
        self.screen.blit(title, (WINDOW_WIDTH//2 - title.get_width()//2, 100))
        
        # 绘制按钮
        mouse_pos = pygame.mouse.get_pos()
        
        for btn_name, btn_rect in self.menu_buttons.items():
            hover = btn_rect.collidepoint(mouse_pos)
            text_map = {
                'vs_ai': '人机对战',
                'vs_human': '双人对战',
                'online': '在线对战',
                'quit': '退出游戏'
            }
            self.draw_button(btn_rect, text_map[btn_name], hover)
        
        # 绘制难度选择（仅在人机对战模式显示）
        if self.mode == GameMode.HUMAN_VS_AI:
            diff_text = self.small_font.render("选择难度:", True, Colors.TEXT)
            self.screen.blit(diff_text, (WINDOW_WIDTH//2 - diff_text.get_width()//2, 
                                        WINDOW_HEIGHT//2 + 20))
            
            for diff_name, diff_rect in self.diff_buttons.items():
                hover = diff_rect.collidepoint(mouse_pos)
                text_map = {
                    'easy': '初级',
                    'medium': '中级',
                    'hard': '高级'
                }
                self.draw_button(diff_rect, text_map[diff_name], hover)
                
                # 高亮当前难度
                if ((diff_name == 'easy' and self.difficulty == Difficulty.EASY) or
                    (diff_name == 'medium' and self.difficulty == Difficulty.MEDIUM) or
                    (diff_name == 'hard' and self.difficulty == Difficulty.HARD)):
                    pygame.draw.rect(self.screen, Colors.HIGHLIGHT, diff_rect, 3, border_radius=10)

    def draw_online_menu(self):
        # 绘制在线对战菜单
        title = self.font.render("在线对战", True, Colors.TEXT)
        self.screen.blit(title, (WINDOW_WIDTH//2 - title.get_width()//2, 100))
        
        mouse_pos = pygame.mouse.get_pos()
        
        for btn_name, btn_rect in self.online_buttons.items():
            hover = btn_rect.collidepoint(mouse_pos)
            text_map = {
                'host': '创建房间',
                'join': '加入房间',
                'back': '返回主菜单'
            }
            self.draw_button(btn_rect, text_map[btn_name], hover)
        
        # 显示连接状态
        if self.state == GameState.ONLINE_WAITING:
            status_text = "等待对手连接..."
            if self.is_online_host:
                status_text = "房间已创建，等待对手加入..."
            
            status_surf = self.small_font.render(status_text, True, Colors.TEXT)
            self.screen.blit(status_surf, (WINDOW_WIDTH//2 - status_surf.get_width()//2, 
                                         WINDOW_HEIGHT//2 + 150))

    def draw_game_buttons(self):
        mouse_pos = pygame.mouse.get_pos()
        
        # 根据游戏模式决定显示哪些按钮
        buttons_to_draw = ['menu', 'restart']
        
        if not self.game_over:
            buttons_to_draw.extend(['surrender'])
            
            # 悔棋按钮只在非在线对战且未达到上限时显示
            if self.mode != GameMode.ONLINE and self.undo_count < self.max_undo:
                buttons_to_draw.append('undo')
        
        for btn_name in buttons_to_draw:
            btn_rect = self.game_buttons[btn_name]
            hover = btn_rect.collidepoint(mouse_pos)
            
            text_map = {
                'undo': '悔棋',
                'surrender': '认输',
                'menu': '菜单',
                'restart': '重玩'
            }
            self.draw_button(btn_rect, text_map[btn_name], hover)

    def check_win(self, row, col, player):
        # 检查八个方向
        directions = [
            [(0, 1), (0, -1)],   # 水平
            [(1, 0), (-1, 0)],   # 垂直
            [(1, 1), (-1, -1)],  # 主对角线
            [(1, -1), (-1, 1)]   # 副对角线
        ]
        
        for dir_pair in directions:
            line = [(row, col)]
            count = 1
            
            # 检查每个方向的两个相反方向
            for dx, dy in dir_pair:
                r, c = row + dx, col + dy
                while 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and self.board[r][c] == player:
                    line.append((r, c))
                    count += 1
                    r += dx
                    c += dy
            
            if count >= 5:
                # 对连线进行排序，确保顺序正确
                line.sort()
                self.winning_line = line
                return True
        
        return False

    def make_move(self, row, col, player=None):
        if player is None:
            player = self.current_player
        
        if 0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE and self.board[row][col] == 0:
            self.board[row][col] = player
            self.move_history.append((row, col, player))
            self.last_move = (row, col)
            
            # 检查胜负
            if self.check_win(row, col, player):
                self.game_over = True
                self.winner = player
                if self.sound_enabled:
                    pygame.mixer.Sound.play(pygame.mixer.Sound('win.wav' if pygame.mixer.get_init() else None))
            elif len(self.move_history) == BOARD_SIZE * BOARD_SIZE:
                self.game_over = True
                self.winner = 0
            
            # 切换玩家
            self.current_player = -player
            
            # 播放落子音效
            if self.sound_enabled and pygame.mixer.get_init():
                try:
                    pygame.mixer.Sound.play(pygame.mixer.Sound('place.wav'))
                except:
                    pass
            
            return True
        return False

    def undo_move(self):
        if self.move_history and self.undo_count < self.max_undo:
            row, col, player = self.move_history.pop()
            self.board[row][col] = 0
            self.current_player = player
            self.game_over = False
            self.winner = 0
            self.winning_line = []
            self.undo_count += 1
            
            # 更新最后一步
            if self.move_history:
                self.last_move = (self.move_history[-1][0], self.move_history[-1][1])
            else:
                self.last_move = None
            
            return True
        return False

    def ai_move(self):
        if self.game_over:
            return
        
        # 根据难度选择AI策略
        if self.difficulty == Difficulty.EASY:
            return self.ai_random_move()
        elif self.difficulty == Difficulty.MEDIUM:
            return self.ai_medium_move()
        else:
            return self.ai_hard_move()

    def ai_random_move(self):
        # 随机选择空位
        empty_cells = [(r, c) for r in range(BOARD_SIZE) for c in range(BOARD_SIZE) 
                      if self.board[r][c] == 0]
        if empty_cells:
            row, col = random.choice(empty_cells)
            self.make_move(row, col, self.current_player)
            return True
        return False

    def ai_medium_move(self):
        # 简单的攻防策略
        empty_cells = [(r, c) for r in range(BOARD_SIZE) for c in range(BOARD_SIZE) 
                      if self.board[r][c] == 0]
        
        if not empty_cells:
            return False
        
        # 优先选择中心区域
        center = BOARD_SIZE // 2
        center_cells = [(r, c) for r, c in empty_cells 
                       if abs(r - center) <= 3 and abs(c - center) <= 3]
        
        if center_cells:
            row, col = random.choice(center_cells)
        else:
            row, col = random.choice(empty_cells)
        
        self.make_move(row, col, self.current_player)
        return True

    def ai_hard_move(self):
        # 简单的评估函数
        def evaluate_position(r, c, player):
            score = 0
            
            # 检查四个方向
            directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
            for dr, dc in directions:
                line = []
                
                # 向两个方向延伸
                for i in range(-4, 5):
                    nr, nc = r + i*dr, c + i*dc
                    if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
                        line.append(self.board[nr][nc])
                    else:
                        line.append(2)  # 边界
                
                # 分析棋型
                for i in range(5):
                    segment = line[i:i+5]
                    if len(segment) == 5:
                        # 统计玩家棋子数
                        player_count = segment.count(player)
                        opponent_count = segment.count(-player)
                        empty_count = segment.count(0)
                        
                        if opponent_count == 0:
                            if player_count == 4:
                                score += 1000
                            elif player_count == 3 and empty_count == 2:
                                score += 100
                            elif player_count == 2 and empty_count == 3:
                                score += 10
                        
                        if player_count == 0:
                            if opponent_count == 4:
                                score += 800
                            elif opponent_count == 3:
                                score += 80
            
            return score
        
        empty_cells = [(r, c) for r in range(BOARD_SIZE) for c in range(BOARD_SIZE) 
                      if self.board[r][c] == 0]
        
        if not empty_cells:
            return False
        
        # 选择评分最高的位置
        best_score = -1
        best_moves = []
        
        for r, c in empty_cells:
            # 进攻评分
            attack_score = evaluate_position(r, c, self.current_player)
            # 防守评分
            defense_score = evaluate_position(r, c, -self.current_player)
            total_score = attack_score + defense_score * 0.8
            
            if total_score > best_score:
                best_score = total_score
                best_moves = [(r, c)]
            elif total_score == best_score:
                best_moves.append((r, c))
        
        if best_moves:
            row, col = random.choice(best_moves)
            self.make_move(row, col, self.current_player)
            return True
        
        return False

    def reset_game(self):
        self.board = [[0 for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        self.current_player = 1
        self.game_over = False
        self.winner = 0
        self.winning_line = []
        self.move_history = []
        self.last_move = None
        self.undo_count = 0

    def start_online_game(self, is_host=True):
        self.is_online_host = is_host
        self.state = GameState.ONLINE_WAITING
        
        # 启动网络线程
        self.online_thread = threading.Thread(target=self.run_online_server if is_host else self.connect_to_server)
        self.online_thread.daemon = True
        self.online_thread.start()

    def run_online_server(self):
        # 简单的服务器实现
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        
        try:
            server.bind(('0.0.0.0', 12345))
            server.listen(1)
            
            # 接受连接
            self.online_socket, addr = server.accept()
            
            # 发送初始信息
            init_data = json.dumps({
                'type': 'init',
                'player': -1 if random.random() > 0.5 else 1
            })
            self.online_socket.send(init_data.encode())
            
            # 开始游戏
            self.state = GameState.PLAYING
            self.mode = GameMode.ONLINE
            
        except Exception as e:
            print(f"服务器错误: {e}")
            self.state = GameState.MENU

    def connect_to_server(self):
        # 连接到服务器
        try:
            self.online_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.online_socket.connect(('localhost', 12345))
            
            # 接收初始信息
            data = self.online_socket.recv(1024).decode()
            init_info = json.loads(data)
            
            # 开始游戏
            self.state = GameState.PLAYING
            self.mode = GameMode.ONLINE
            
        except Exception as e:
            print(f"连接错误: {e}")
            self.state = GameState.MENU

    def send_move(self, row, col):
        if self.online_socket:
            data = json.dumps({
                'type': 'move',
                'row': row,
                'col': col
            })
            self.online_socket.send(data.encode())

    def receive_move(self):
        if self.online_socket:
            try:
                self.online_socket.settimeout(0.1)
                data = self.online_socket.recv(1024).decode()
                if data:
                    move_data = json.loads(data)
                    if move_data['type'] == 'move':
                        self.make_move(move_data['row'], move_data['col'])
                        return True
            except socket.timeout:
                pass
            except Exception as e:
                print(f"接收错误: {e}")
        return False

    def handle_click(self, pos):
        x, y = pos
        
        # 检查是否点击棋盘
        if (MARGIN <= x < MARGIN + BOARD_SIZE * GRID_SIZE and
            MARGIN <= y < MARGIN + BOARD_SIZE * GRID_SIZE):
            
            if self.game_over:
                return
            
            col = round((x - MARGIN) / GRID_SIZE)
            row = round((y - MARGIN) / GRID_SIZE)
            
            # 确保在边界内
            col = max(0, min(BOARD_SIZE-1, col))
            row = max(0, min(BOARD_SIZE-1, row))
            
            # 根据游戏模式处理落子
            if self.mode == GameMode.HUMAN_VS_AI:
                if self.current_player == 1:  # 玩家执黑
                    if self.make_move(row, col):
                        # AI回合
                        if not self.game_over:
                            pygame.time.wait(500)  # AI思考时间
                            self.ai_move()
            
            elif self.mode == GameMode.HUMAN_VS_HUMAN:
                self.make_move(row, col)
            
            elif self.mode == GameMode.ONLINE:
                # 在线对战，只允许当前玩家落子
                if self.make_move(row, col):
                    self.send_move(row, col)

    def handle_menu_click(self, pos):
        # 处理主菜单点击
        for btn_name, btn_rect in self.menu_buttons.items():
            if btn_rect.collidepoint(pos):
                if btn_name == 'vs_ai':
                    self.mode = GameMode.HUMAN_VS_AI
                    self.player1_type = PlayerType.HUMAN
                    self.player2_type = PlayerType.AI
                    self.reset_game()
                    self.state = GameState.PLAYING
                
                elif btn_name == 'vs_human':
                    self.mode = GameMode.HUMAN_VS_HUMAN
                    self.player1_type = PlayerType.HUMAN
                    self.player2_type = PlayerType.HUMAN
                    self.reset_game()
                    self.state = GameState.PLAYING
                
                elif btn_name == 'online':
                    self.state = GameState.MENU
                    # 显示在线对战子菜单
                    self.draw_online_menu()
                
                elif btn_name == 'quit':
                    pygame.quit()
                    sys.exit()
        
        # 处理难度选择
        if self.mode == GameMode.HUMAN_VS_AI:
            for diff_name, diff_rect in self.diff_buttons.items():
                if diff_rect.collidepoint(pos):
                    if diff_name == 'easy':
                        self.difficulty = Difficulty.EASY
                    elif diff_name == 'medium':
                        self.difficulty = Difficulty.MEDIUM
                    elif diff_name == 'hard':
                        self.difficulty = Difficulty.HARD

    def handle_online_click(self, pos):
        # 处理在线对战菜单点击
        for btn_name, btn_rect in self.online_buttons.items():
            if btn_rect.collidepoint(pos):
                if btn_name == 'host':
                    self.start_online_game(is_host=True)
                elif btn_name == 'join':
                    self.start_online_game(is_host=False)
                elif btn_name == 'back':
                    self.state = GameState.MENU

    def handle_game_click(self, pos):
        # 处理游戏内按钮点击
        for btn_name, btn_rect in self.game_buttons.items():
            if btn_rect.collidepoint(pos):
                if btn_name == 'undo' and not self.game_over:
                    if self.mode != GameMode.ONLINE:
                        self.undo_move()
                
                elif btn_name == 'surrender' and not self.game_over:
                    self.game_over = True
                    self.winner = -self.current_player
                
                elif btn_name == 'restart':
                    self.reset_game()
                    if self.mode == GameMode.HUMAN_VS_AI and self.current_player == -1:
                        self.ai_move()
                
                elif btn_name == 'menu':
                    self.state = GameState.MENU
                    if self.online_socket:
                        self.online_socket.close()
                        self.online_socket = None

    def run(self):
        running = True
        
        while running:
            # 处理事件
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    pos = pygame.mouse.get_pos()
                    
                    if self.state == GameState.MENU:
                        self.handle_menu_click(pos)
                    
                    elif self.state == GameState.ONLINE_WAITING:
                        self.handle_online_click(pos)
                    
                    elif self.state == GameState.PLAYING:
                        # 先检查按钮点击
                        self.handle_game_click(pos)
                        # 再检查棋盘点击
                        self.handle_click(pos)
                    
                    elif self.state == GameState.GAME_OVER:
                        self.handle_game_click(pos)
            
            # 在线对战接收数据
            if self.state == GameState.PLAYING and self.mode == GameMode.ONLINE:
                self.receive_move()
            
            # 绘制
            self.screen.fill(Colors.BACKGROUND)
            
            if self.state == GameState.MENU:
                self.draw_menu()
            
            elif self.state == GameState.ONLINE_WAITING:
                self.draw_online_menu()
            
            elif self.state in [GameState.PLAYING, GameState.GAME_OVER]:
                self.draw_board()
                self.draw_ui()
                self.draw_game_buttons()
            
            # 更新显示
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = GomokuGame()
    game.run()