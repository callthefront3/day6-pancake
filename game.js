// === 전역 변수 및 상태 관리 ===
const state = {
    stage: 0,
    scores: { stage1: 0, stage2: 0, stage3: 0, stage4: 0, stage5: 0 },
    timers: [],
};

const MAX_SCORE = 20;

// DOM Elements
const screens = [
    document.getElementById('start-screen'),
    document.getElementById('stage-1'),
    document.getElementById('stage-2'),
    document.getElementById('stage-3'),
    document.getElementById('stage-4'),
    document.getElementById('stage-5'),
    document.getElementById('result-screen')
];
const timerWrapper = document.getElementById('timer-wrapper');
const timerBar = document.getElementById('timer-bar');
const statusText = document.getElementById('game-status');
const globalMsg = document.getElementById('global-msg');

// === 유틸리티 함수 ===
function showScreen(index) {
    screens.forEach((s, i) => s.classList.toggle('active', i === index));
    state.stage = index;
    globalMsg.textContent = "";
    clearAllTimers();
    // 1단계부터 타이머 바 표시
    timerWrapper.style.display = (index >= 1 && index < 6) ? 'block' : 'none';
}

function clearAllTimers() {
    state.timers.forEach(t => { clearInterval(t); clearTimeout(t); });
    state.timers = [];
}

function updateTimerUI(percent) {
    timerBar.style.width = percent + '%';
    timerBar.style.backgroundColor = percent < 30 ? '#ff4757' : '#FF6B6B';
}

function updateStatus(msg) {
    statusText.innerHTML = msg;
}

function addScore(stageKey, points) {
    state.scores[stageKey] = Math.floor(Math.min(MAX_SCORE, Math.max(0, points)));
}

// === 게임 시작 ===
document.getElementById('start-btn').addEventListener('click', () => initStage1());
document.getElementById('restart-btn').addEventListener('click', () => window.location.reload());

// ==========================================
// 1단계: 3연속 계란 깨기 (난이도: 가속 + 좁아짐)
// ==========================================
function initStage1() {
    showScreen(1);
    const target = document.getElementById('crack-target');
    const needle = document.getElementById('crack-needle');
    const btn = document.getElementById('crack-btn');
    const icons = [document.getElementById('egg-icon-1'), document.getElementById('egg-icon-2'), document.getElementById('egg-icon-3')];
    
    let currentEgg = 0;
    let pos = 0;
    let direction = 1;
    let speed = 1.0;
    let targetWidth = 20;
    let loop;
    let totalScore = 0;

    function setupEgg() {
        if (currentEgg >= 3) {
            finishStage1(totalScore);
            return;
        }
        
        speed = 1.0 + (currentEgg * 1.5); // 속도 증가폭 상향
        targetWidth = 22 - (currentEgg * 6); // 너비 감소폭 상향
        
        target.style.width = targetWidth + '%';
        target.style.left = (50 - targetWidth/2) + '%';
        
        icons.forEach((icon, i) => {
            icon.className = i === currentEgg ? 'egg-active' : '';
            icon.style.opacity = i < currentEgg ? 0.3 : 1;
        });

        updateStatus(`${currentEgg + 1}번째 계란! (난이도: ${['보통','어려움','헬'][currentEgg]})`);
        pos = Math.random() * 100;
        
        loop = setInterval(() => {
            pos += speed * direction;
            if (pos >= 100 || pos <= 0) direction *= -1;
            needle.style.left = pos + '%';
        }, 16);
        state.timers.push(loop);
        
        btn.disabled = false;
        btn.textContent = "탁! 깨기";
    }

    btn.onclick = () => {
        clearInterval(loop);
        btn.disabled = true;
        
        const halfWidth = targetWidth / 2;
        const diff = Math.abs(pos - 50);
        
        let points = 0;
        if (diff <= halfWidth) {
            points = 20;
            globalMsg.textContent = "나이스! 깔끔합니다!";
            document.getElementById('egg-char').textContent = "🍳";
        } else {
            points = Math.max(0, 20 - (diff - halfWidth) * 3); // 감점 폭 증가
            globalMsg.textContent = "앗, 껍질이 들어갔어요...";
            document.getElementById('egg-char').textContent = "💥";
        }

        totalScore += points;
        
        setTimeout(() => {
            document.getElementById('egg-char').textContent = "🥚";
            globalMsg.textContent = "";
            currentEgg++;
            setupEgg();
        }, 800);
    };

    setupEgg();

    function finishStage1(sumScore) {
        addScore('stage1', sumScore / 3);
        setTimeout(initStage2, 1000);
    }
}

// ==========================================
// 2단계: 반죽 (난이도: 토끼가 게이지 깎음)
// ==========================================
function initStage2() {
    showScreen(2);
    updateStatus("섞으세요! 토끼를 방치하면 <b style='color:red'>반죽에 후추를 뿌릴 거예요!</b>");

    const bowl = document.getElementById('bowl-area');
    const fillBar = document.getElementById('mix-fill');
    const rabbit = document.getElementById('rabbit-intruder');
    const percentTxt = document.getElementById('mix-percent');
    
    let progress = 0;
    let rabbitActive = false;
    let rabbitDamageTimer = null;
    let timeLeft = 12.0; 
    const MAX_TIME = 12.0;
    
    fillBar.style.width = '0%';
    rabbit.classList.add('hidden');

    const stageTimer = setInterval(() => {
        timeLeft -= 0.1;
        updateTimerUI(timeLeft / MAX_TIME * 100);
        if (timeLeft <= 0) finishStage2(false);
    }, 100);
    state.timers.push(stageTimer);

    let isDragging = false;
    const startDrag = () => isDragging = true;
    const endDrag = () => isDragging = false;
    
    bowl.addEventListener('mousedown', startDrag);
    window.addEventListener('mouseup', endDrag);
    bowl.addEventListener('touchstart', startDrag);
    window.addEventListener('touchend', endDrag);

    const mixHandler = (e) => {
        e.preventDefault(); 
        if (isDragging && !rabbitActive && progress < 100) {
            progress += 0.7; 
            updateProgress();
        }
    };
    bowl.addEventListener('mousemove', mixHandler);
    bowl.addEventListener('touchmove', mixHandler);

    function updateProgress() {
        progress = Math.min(100, Math.max(0, progress));
        fillBar.style.width = progress + '%';
        percentTxt.textContent = Math.floor(progress) + '%';
        if (progress >= 100) finishStage2(true);
    }

    const rabbitSpawner = setInterval(() => {
        if (!rabbitActive && progress < 95 && Math.random() < 0.45) { // 출현 빈도 증가
            rabbitActive = true;
            rabbit.classList.remove('hidden');
            globalMsg.textContent = "🐰 토끼가 후추를 뿌리는 중!! (터치!)";
            
            rabbitDamageTimer = setInterval(() => {
                progress -= 2.5; // 감소량 증가
                if (progress < 0) progress = 0;
                updateProgress();
            }, 100);
            state.timers.push(rabbitDamageTimer);
        }
    }, 1200);
    state.timers.push(rabbitSpawner);

    rabbit.onmousedown = rabbit.ontouchstart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        rabbitActive = false;
        rabbit.classList.add('hidden');
        globalMsg.textContent = "토끼를 쫓아냈습니다!";
        clearInterval(rabbitDamageTimer);
    };

    function finishStage2(success) {
        clearAllTimers();
        if (success) {
            addScore('stage2', 20);
            updateStatus("반죽 완성! 끈기가 대단하군요.");
        } else {
            addScore('stage2', Math.floor(progress / 5));
            updateStatus("시간 초과! 반죽이 덜 되었습니다.");
        }
        setTimeout(initStage3, 1500);
    }
}

// ==========================================
// 3단계: 머랭 (난이도: 오버 휘핑 - 넘치면 0점)
// ==========================================
function initStage3() {
    showScreen(3);
    updateStatus("90%~99% 사이에서 '멈추기'를 누르세요.");

    const btn = document.getElementById('whisk-btn');
    const stopBtn = document.getElementById('stop-whisk-btn');
    const fillBar = document.getElementById('meringue-fill');
    const foam = document.getElementById('meringue-foam');
    
    let stiffness = 0;
    let isFailed = false;
    let timeLeft = 8.0;

    const decayTimer = setInterval(() => {
        if (!isFailed) {
            stiffness -= 0.25; // 자연 감소량 증가
            if (stiffness < 0) stiffness = 0;
            updateUI();
        }
        
        timeLeft -= 0.05;
        updateTimerUI(timeLeft / 8.0 * 100);
        if (timeLeft <= 0 && !isFailed) finishStage3();
    }, 50);
    state.timers.push(decayTimer);

    function updateUI() {
        fillBar.style.width = stiffness + '%';
        let scale = 1 + (stiffness / 100);
        foam.style.transform = `scale(${scale})`;
        
        if (stiffness > 90) fillBar.style.backgroundColor = '#ffeb3b';
        else fillBar.style.backgroundColor = '#4CAF50';

        if (stiffness >= 100) {
            isFailed = true;
            failMeringue();
        }
    }

    function failMeringue() {
        fillBar.style.backgroundColor = '#5d5d5d';
        foam.textContent = "🧈";
        globalMsg.textContent = "망했다! 너무 저어서 버터가 됐어요!";
        btn.disabled = true;
        stopBtn.disabled = true;
        finishStage3(true);
    }

    btn.onclick = () => {
        if (!isFailed) {
            stiffness += 6.5; // 증가량 증가
            updateUI();
        }
    };

    stopBtn.onclick = () => finishStage3();

    function finishStage3(isFail = false) {
        clearAllTimers();
        btn.onclick = null;
        stopBtn.onclick = null;

        let score = 0;
        if (isFail) {
            score = 0;
            updateStatus("오버 휘핑... 수플레가 부풀지 않습니다.");
        } else {
            if (stiffness >= 90) {
                score = 20;
                updateStatus("완벽한 머랭 뿔! (Perfect)");
            } else if (stiffness >= 70) {
                score = 15;
                updateStatus("약간 묽지만 괜찮아요.");
            } else {
                score = 5;
                updateStatus("거의 물이네요... 실패.");
            }
        }
        addScore('stage3', score);
        setTimeout(initStage4, 2000);
    }
}

// ==========================================
// 4단계: 굽기 (난이도: 무빙 타겟 + 열 관성 + 도둑 여우)
// ==========================================
function initStage4() {
    showScreen(4);
    updateStatus("초록 칸에 맞추세요! 여우가 나타나면 잡으세요!");

    const heatBtn = document.getElementById('heat-btn');
    const indicator = document.getElementById('temp-indicator');
    const target = document.getElementById('temp-target');
    const fox = document.getElementById('fox-intruder');
    const pancake = document.getElementById('pancake');

    let temperature = 0;
    let velocity = 0;
    let isHeating = false;
    let scoreAccumulator = 0;
    let totalTicks = 0;
    let foxActive = false;
    let stealTimer = null;
    
    let targetPos = 40;
    let targetDir = 1;
    let timeLeft = 15.0; 
    
    const startHeat = (e) => { e.preventDefault(); isHeating = true; };
    const stopHeat = () => { isHeating = false; };
    
    heatBtn.addEventListener('mousedown', startHeat);
    heatBtn.addEventListener('touchstart', startHeat);
    window.addEventListener('mouseup', stopHeat);
    window.addEventListener('touchend', stopHeat);

    const loop = setInterval(() => {
        targetPos += 0.6 * targetDir; // 타겟 이동 속도 증가
        if (targetPos >= 75 || targetPos <= 20) targetDir *= -1;
        target.style.bottom = targetPos + '%';

        if (isHeating) velocity += 0.45; // 가열 속도 증가
        else velocity -= 0.25; // 냉각 속도 증가

        velocity *= 0.94; // 마찰력 감소 (더 미끄러움)
        temperature += velocity;

        if (temperature < 0) { temperature = 0; velocity = 0; }
        if (temperature > 100) { temperature = 100; velocity = 0; }
        
        indicator.style.bottom = temperature + '%';

        const isHit = temperature >= targetPos && temperature <= (targetPos + 25);
        if (isHit) {
            scoreAccumulator++;
            pancake.style.opacity = 0.5 + (scoreAccumulator / 150);
            target.style.background = "rgba(76, 175, 80, 0.8)";
        } else {
            target.style.background = "rgba(76, 175, 80, 0.3)";
        }
        
        totalTicks++;
        timeLeft -= 0.05;
        updateTimerUI(timeLeft / 15.0 * 100);

        if (timeLeft <= 0) finishStage4(scoreAccumulator, totalTicks);

    }, 50);
    state.timers.push(loop);

    // 도둑 여우 출현 로직
    const foxSpawner = setInterval(() => {
        if (!foxActive && Math.random() < 0.35) { // 35% 확률로 출현
            foxActive = true;
            fox.classList.remove('hidden');
            globalMsg.textContent = "🦊 여우 출현! 1.5초 안에 잡으세요!";
            
            // 1.5초 후 훔쳐가기
            stealTimer = setTimeout(() => {
                if (foxActive) {
                    globalMsg.textContent = "😭 여우가 팬케이크를 훔쳐갔습니다!";
                    pancake.textContent = "💨"; // 사라진 이펙트
                    finishStage4(0, 1, true); // 0점 처리, 도난 플래그 true
                }
            }, 1500);
            state.timers.push(stealTimer);
        }
    }, 2500); // 2.5초마다 체크
    state.timers.push(foxSpawner);

    // 여우 퇴치
    fox.onmousedown = fox.ontouchstart = (e) => {
        e.stopPropagation(); e.preventDefault();
        if (foxActive) {
            foxActive = false;
            fox.classList.add('hidden');
            globalMsg.textContent = "나이스! 여우를 쫓아냈습니다!";
            clearTimeout(stealTimer); // 훔치기 타이머 취소
        }
    };

    function finishStage4(hits, total, stolen = false) {
        clearAllTimers();
        if (stolen) {
            addScore('stage4', 0);
            updateStatus("도난 발생! 굽기 실패...");
        } else {
            const ratio = hits / total;
            let score = 0;
            if (ratio > 0.65) score = 20;
            else if (ratio > 0.45) score = 15;
            else if (ratio > 0.25) score = 10;
            else score = 5;
            addScore('stage4', score);
            updateStatus(`굽기 완료! (정확도: ${Math.floor(ratio*100)}%)`);
        }
        setTimeout(initStage5, 2000);
    }
}

// ==========================================
// 5단계: 토핑 (난이도: 블라인드 주문)
// ==========================================
function initStage5() {
    showScreen(5);
    updateStatus("주문을 잘 기억하세요! 3초 뒤 사라집니다.");

    const orderContent = document.getElementById('order-content');
    const toppingBox = document.getElementById('topping-box');
    const dropZone = document.getElementById('drop-zone'); 

    const toppings = [
        { name: "딸기", icon: "🍓" },
        { name: "시럽", icon: "🍯" },
        { name: "버터", icon: "🧈" },
        { name: "블루베리", icon: "🫐" },
        { name: "초코", icon: "🍫" },
        { name: "생크림", icon: "🍦" }
    ];

    const targetOrder = [];
    for(let i=0; i<3; i++) targetOrder.push(toppings[Math.floor(Math.random() * toppings.length)]);

    orderContent.innerHTML = targetOrder.map(t => `<span style="font-size:2rem; margin:0 5px;">${t.icon}</span>`).join('');
    orderContent.classList.remove('blur-text'); // 리셋

    setTimeout(() => {
        orderContent.classList.add('blur-text');
        globalMsg.textContent = "주문표가 가려졌습니다! 기억을 더듬으세요.";
    }, 3000);

    let currentStep = 0;
    
    toppingBox.innerHTML = '';
    const shuffled = [...toppings].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(t => {
        const div = document.createElement('div');
        div.className = 'topping-item';
        div.innerHTML = `<span style="font-size:1.8rem">${t.icon}</span><span style="font-size:0.7rem">${t.name}</span>`;
        div.onclick = () => checkTopping(t);
        toppingBox.appendChild(div);
    });

    function checkTopping(selected) {
        if (currentStep >= 3) return;
        const expected = targetOrder[currentStep];
        
        if (selected.name === expected.name) {
            dropZone.innerHTML += selected.icon;
            currentStep++;
            if (currentStep >= 3) finishStage5(true);
        } else {
            globalMsg.textContent = `❌ 땡! (정답은 ${expected.name})`;
            dropZone.textContent = "💩"; 
            finishStage5(false);
        }
    }

    function finishStage5(success) {
        clearAllTimers();
        let score = success ? 20 : 0;
        addScore('stage5', score);
        updateStatus(success ? "완벽하게 기억했군요!" : "주문을 틀렸습니다...");
        setTimeout(showResult, 2000);
    }
}

// ==========================================
// 결과 화면
// ==========================================
function showResult() {
    showScreen(6);
    const s = state.scores;
    const total = s.stage1 + s.stage2 + s.stage3 + s.stage4 + s.stage5;

    document.getElementById('score-1').textContent = s.stage1;
    document.getElementById('score-2').textContent = s.stage2;
    document.getElementById('score-3').textContent = s.stage3;
    document.getElementById('score-4').textContent = s.stage4;
    document.getElementById('score-5').textContent = s.stage5;
    document.getElementById('score-total').textContent = total;

    const gradeText = document.getElementById('final-grade-text');
    const resultImg = document.getElementById('result-img');

    if (total >= 95) {
        gradeText.textContent = "🏆 수플레의 신";
        gradeText.style.color = "#FFD700";
        resultImg.textContent = "👸";
    } else if (total >= 80) {
        gradeText.textContent = "👨‍🍳 미슐랭 3스타";
        gradeText.style.color = "#FF9800";
        resultImg.textContent = "🥞";
    } else if (total >= 50) {
        gradeText.textContent = "😐 동네 빵집 사장님";
        gradeText.style.color = "#888";
        resultImg.textContent = "🥯";
    } else {
        gradeText.textContent = "☠️ 주방 출입 금지";
        gradeText.style.color = "#333";
        resultImg.textContent = "🔥";
    }
}
