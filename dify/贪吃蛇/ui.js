// ui.js - 用户界面管理模块

// 导入必要的模块
import { gameState, updateGameState, resetGameState } from './gameState.js';
import { startGame, pauseGame, resumeGame, endGame } from './gameLogic.js';
import { saveGame, loadGame } from './saveSystem.js';
import { showNotification } from './utils.js';

// DOM 元素引用
let elements = {};

/**
 * 初始化UI组件
 */
export function initUI() {
    console.log('初始化UI组件...');
    
    // 获取所有必要的DOM元素
    elements = {
        // 游戏容器
        gameContainer: document.getElementById('game-container'),
        
        // 主菜单
        mainMenu: document.getElementById('main-menu'),
        startButton: document.getElementById('start-button'),
        loadButton: document.getElementById('load-button'),
        settingsButton: document.getElementById('settings-button'),
        creditsButton: document.getElementById('credits-button'),
        quitButton: document.getElementById('quit-button'),
        
        // 游戏界面
        gameInterface: document.getElementById('game-interface'),
        pauseButton: document.getElementById('pause-button'),
        saveButton: document.getElementById('save-button'),
        menuButton: document.getElementById('menu-button'),
        
        // 游戏状态显示
        scoreDisplay: document.getElementById('score-display'),
        levelDisplay: document.getElementById('level-display'),
        livesDisplay: document.getElementById('lives-display'),
        timeDisplay: document.getElementById('time-display'),
        
        // 暂停菜单
        pauseMenu: document.getElementById('pause-menu'),
        resumeButton: document.getElementById('resume-button'),
        restartButton: document.getElementById('restart-button'),
        saveGameButton: document.getElementById('save-game-button'),
        loadGameButton: document.getElementById('load-game-button'),
        settingsMenuButton: document.getElementById('settings-menu-button'),
        quitToMenuButton: document.getElementById('quit-to-menu-button'),
        
        // 设置菜单
        settingsMenu: document.getElementById('settings-menu'),
        volumeSlider: document.getElementById('volume-slider'),
        difficultySelect: document.getElementById('difficulty-select'),
        graphicsQualitySelect: document.getElementById('graphics-quality-select'),
        saveSettingsButton: document.getElementById('save-settings-button'),
        backToPauseButton: document.getElementById('back-to-pause-button'),
        backToMainButton: document.getElementById('back-to-main-button'),
        
        // 游戏结束界面
        gameOverScreen: document.getElementById('game-over-screen'),
        finalScoreDisplay: document.getElementById('final-score-display'),
        highScoreDisplay: document.getElementById('high-score-display'),
        playAgainButton: document.getElementById('play-again-button'),
        gameOverMenuButton: document.getElementById('game-over-menu-button'),
        
        // 加载界面
        loadingScreen: document.getElementById('loading-screen'),
        loadingProgress: document.getElementById('loading-progress'),
        loadingText: document.getElementById('loading-text'),
        
        // 通知区域
        notificationArea: document.getElementById('notification-area')
    };
    
    // 初始化事件监听器
    initEventListeners();
    
    // 初始显示主菜单
    showMainMenu();
    
    console.log('UI组件初始化完成');
}

/**
 * 初始化所有事件监听器
 */
function initEventListeners() {
    // 主菜单按钮
    elements.startButton.addEventListener('click', handleStartGame);
    elements.loadButton.addEventListener('click', handleLoadGame);
    elements.settingsButton.addEventListener('click', showSettingsMenu);
    elements.creditsButton.addEventListener('click', showCredits);
    elements.quitButton.addEventListener('click', handleQuitGame);
    
    // 游戏界面按钮
    elements.pauseButton.addEventListener('click', handlePauseGame);
    elements.saveButton.addEventListener('click', handleSaveGame);
    elements.menuButton.addEventListener('click', showPauseMenu);
    
    // 暂停菜单按钮
    elements.resumeButton.addEventListener('click', handleResumeGame);
    elements.restartButton.addEventListener('click', handleRestartGame);
    elements.saveGameButton.addEventListener('click', handleSaveGame);
    elements.loadGameButton.addEventListener('click', handleLoadGame);
    elements.settingsMenuButton.addEventListener('click', showSettingsMenu);
    elements.quitToMenuButton.addEventListener('click', handleQuitToMenu);
    
    // 设置菜单按钮
    elements.saveSettingsButton.addEventListener('click', saveSettings);
    elements.backToPauseButton.addEventListener('click', showPauseMenu);
    elements.backToMainButton.addEventListener('click', showMainMenu);
    
    // 游戏结束界面按钮
    elements.playAgainButton.addEventListener('click', handleRestartGame);
    elements.gameOverMenuButton.addEventListener('click', handleQuitToMenu);
    
    // 音量控制
    elements.volumeSlider.addEventListener('input', updateVolume);
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * 处理键盘快捷键
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyboardShortcuts(event) {
    switch(event.key) {
        case 'Escape':
            if (gameState.isPlaying && !gameState.isPaused) {
                handlePauseGame();
            } else if (gameState.isPaused) {
                handleResumeGame();
            }
            break;
        case 'p':
        case 'P':
            if (gameState.isPlaying) {
                if (gameState.isPaused) {
                    handleResumeGame();
                } else {
                    handlePauseGame();
                }
            }
            break;
        case 's':
        case 'S':
            if (gameState.isPlaying && !gameState.isPaused) {
                handleSaveGame();
            }
            break;
        case 'm':
        case 'M':
            if (gameState.isPlaying && gameState.isPaused) {
                handleQuitToMenu();
            }
            break;
    }
}

/**
 * 显示主菜单
 */
export function showMainMenu() {
    hideAllScreens();
    elements.mainMenu.style.display = 'block';
    updateButtonStates();
}

/**
 * 显示游戏界面
 */
export function showGameInterface() {
    hideAllScreens();
    elements.gameInterface.style.display = 'block';
    updateGameDisplay();
}

/**
 * 显示暂停菜单
 */
export function showPauseMenu() {
    if (gameState.isPlaying) {
        elements.pauseMenu.style.display = 'block';
        updateButtonStates();
    }
}

/**
 * 显示设置菜单
 */
export function showSettingsMenu() {
    hideAllScreens();
    elements.settingsMenu.style.display = 'block';
    loadCurrentSettings();
}

/**
 * 显示游戏结束界面
 * @param {number} finalScore - 最终得分
 * @param {number} highScore - 最高分
 */
export function showGameOver(finalScore, highScore) {
    hideAllScreens();
    elements.gameOverScreen.style.display = 'block';
    elements.finalScoreDisplay.textContent = `最终得分: ${finalScore}`;
    elements.highScoreDisplay.textContent = `最高分: ${highScore}`;
}

/**
 * 显示加载界面
 * @param {string} message - 加载消息
 * @param {number} progress - 加载进度 (0-100)
 */
export function showLoadingScreen(message = '加载中...', progress = 0) {
    elements.loadingScreen.style.display = 'block';
    elements.loadingText.textContent = message;
    elements.loadingProgress.value = progress;
    elements.loadingProgress.style.width = `${progress}%`;
}

/**
 * 隐藏加载界面
 */
export function hideLoadingScreen() {
    elements.loadingScreen.style.display = 'none';
}

/**
 * 隐藏所有屏幕
 */
function hideAllScreens() {
    const screens = [
        elements.mainMenu,
        elements.gameInterface,
        elements.pauseMenu,
        elements.settingsMenu,
        elements.gameOverScreen,
        elements.loadingScreen
    ];
    
    screens.forEach(screen => {
        if (screen) screen.style.display = 'none';
    });
}

/**
 * 更新游戏状态显示
 */
export function updateGameDisplay() {
    if (!gameState.isPlaying) return;
    
    elements.scoreDisplay.textContent = `得分: ${gameState.score}`;
    elements.levelDisplay.textContent = `关卡: ${gameState.level}`;
    elements.livesDisplay.textContent = `生命: ${gameState.lives}`;
    elements.timeDisplay.textContent = `时间: ${formatTime(gameState.gameTime)}`;
    
    // 更新暂停按钮文本
    elements.pauseButton.textContent = gameState.isPaused ? '继续' : '暂停';
}

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 更新按钮状态（启用/禁用）
 */
function updateButtonStates() {
    // 根据游戏状态更新按钮
    const hasSaveData = localStorage.getItem('gameSave') !== null;
    elements.loadButton.disabled = !hasSaveData;
    elements.loadGameButton.disabled = !hasSaveData;
}

/**
 * 处理开始游戏
 */
async function handleStartGame() {
    try {
        showLoadingScreen('开始新游戏...', 30);
        
        // 重置游戏状态
        resetGameState();
        
        // 开始游戏逻辑
        await startGame();
        
        hideLoadingScreen();
        showGameInterface();
        updateGameDisplay();
        
        showNotification('游戏开始！', 'success');
    } catch (error) {
        console.error('开始游戏失败:', error);
        showNotification('开始游戏失败，请重试', 'error');
        hideLoadingScreen();
    }
}

/**
 * 处理加载游戏
 */
async function handleLoadGame() {
    try {
        showLoadingScreen('加载游戏中...', 50);
        
        const success = await loadGame();
        
        if (success) {
            hideLoadingScreen();
            showGameInterface();
            updateGameDisplay();
            showNotification('游戏加载成功！', 'success');
        } else {
            hideLoadingScreen();
            showNotification('加载失败，没有找到存档', 'error');
        }
    } catch (error) {
        console.error('加载游戏失败:', error);
        showNotification('加载游戏失败', 'error');
        hideLoadingScreen();
    }
}

/**
 * 处理暂停游戏
 */
function handlePauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    pauseGame();
    showPauseMenu();
    updateGameDisplay();
    showNotification('游戏已暂停', 'info');
}

/**
 * 处理继续游戏
 */
function handleResumeGame() {
    if (!gameState.isPlaying || !gameState.isPaused) return;
    
    resumeGame();
    elements.pauseMenu.style.display = 'none';
    updateGameDisplay();
    showNotification('游戏继续', 'info');
}

/**
 * 处理重新开始游戏
 */
async function handleRestartGame() {
    try {
        showLoadingScreen('重新开始游戏...', 40);
        
        // 结束当前游戏
        endGame();
        
        // 重置游戏状态
        resetGameState();
        
        // 开始新游戏
        await startGame();
        
        hideLoadingScreen();
        showGameInterface();
        updateGameDisplay();
        
        showNotification('游戏重新开始！', 'success');
    } catch (error) {
        console.error('重新开始游戏失败:', error);
        showNotification('重新开始失败，请重试', 'error');
        hideLoadingScreen();
    }
}

/**
 * 处理保存游戏
 */
async function handleSaveGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    try {
        showLoadingScreen('保存游戏中...', 70);
        
        const success = await saveGame();
        
        hideLoadingScreen();
        
        if (success) {
            showNotification('游戏保存成功！', 'success');
            updateButtonStates();
        } else {
            showNotification('保存失败', 'error');
        }
    } catch (error) {
        console.error('保存游戏失败:', error);
        hideLoadingScreen();
        showNotification('保存游戏失败', 'error');
    }
}

/**
 * 处理退出到主菜单
 */
function handleQuitToMenu() {
    if (gameState.isPlaying) {
        endGame();
    }
    
    showMainMenu();
    showNotification('已返回主菜单', 'info');
}

/**
 * 处理退出游戏
 */
function handleQuitGame() {
    if (confirm('确定要退出游戏吗？')) {
        // 如果是网页游戏，可以重定向或关闭窗口
        if (window.close && !window.opener) {
            window.close();
        } else {
            showNotification('感谢游玩！', 'info');
            // 对于不能直接关闭的情况，至少返回主菜单
            showMainMenu();
        }
    }
}

/**
 * 显示制作人员名单
 */
function showCredits() {
    // 这里可以显示制作人员弹窗或页面
    alert('游戏制作人员名单\n\n' +
          '策划: 游戏策划团队\n' +
          '程序: 开发团队\n' +
          '美术: 美术设计团队\n' +
          '音效: 音效制作团队\n' +
          '测试: 测试团队\n\n' +
          '感谢游玩！');
}

/**
 * 加载当前设置
 */
function loadCurrentSettings() {
    // 从localStorage加载设置，或使用默认值
    const settings = JSON.parse(localStorage.getItem('gameSettings')) || {
        volume: 80,
        difficulty: 'normal',
        graphicsQuality: 'medium'
    };
    
    elements.volumeSlider.value = settings.volume;
    elements.difficultySelect.value = settings.difficulty;
    elements.graphicsQualitySelect.value = settings.graphicsQuality;
}

/**
 * 保存设置
 */
function saveSettings() {
    const settings = {
        volume: parseInt(elements.volumeSlider.value),
        difficulty: elements.difficultySelect.value,
        graphicsQuality: elements.graphicsQualitySelect.value
    };
    
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    
    // 应用设置
    applySettings(settings);
    
    showNotification('设置已保存', 'success');
    
    // 根据当前状态返回相应界面
    if (gameState.isPlaying && gameState.isPaused) {
        showPauseMenu();
    } else {
        showMainMenu();
    }
}

/**
 * 应用设置
 * @param {Object} settings - 设置对象
 */
function applySettings(settings) {
    // 应用音量设置
    // 这里可以调用音频管理模块
    console.log(`应用设置 - 音量: ${settings.volume}%, 难度: ${settings.difficulty}, 画质: ${settings.graphicsQuality}`);
    
    // 更新游戏状态中的设置
    updateGameState({
        settings: settings
    });
}

/**
 * 更新音量
 */
function updateVolume() {
    const volume = elements.volumeSlider.value;
    // 这里可以实时更新音频音量
    console.log(`音量更新: ${volume}%`);
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型 (success, error, info, warning)
 */
export function showUINotification(message, type = 'info') {
    showNotification(message, type);
}

/**
 * 更新加载进度
 * @param {number} progress - 进度百分比
 * @param {string} message - 进度消息
 */
export function updateLoadingProgress(progress, message = '') {
    if (elements.loadingScreen.style.display === 'block') {
        elements.loadingProgress.value = progress;
        elements.loadingProgress.style.width = `${progress}%`;
        
        if (message) {
            elements.loadingText.textContent = message;
        }
    }
}

// 导出UI管理函数
export default {
    initUI,
    showMainMenu,
    showGameInterface,
    showGameOver,
    showLoadingScreen,
    hideLoadingScreen,
    updateGameDisplay,
    showUINotification,
    updateLoadingProgress
};3