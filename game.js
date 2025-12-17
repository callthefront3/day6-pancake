// === 전역 변수 및 상태 관리 ===
const state = {
    stage: 0,
    scores: { stage1: 0, stage2: 0, stage3: 0, stage4: 0, stage5: 0 },
    timers: [], 
    isGameOver: false
};

const MAX_SCORE = 20; // 각 스테이지 만점 (총 100점)

// 창의 포커스를 잃으면 모든 조작을 중단시킴
window.addEventListener('blur', () => {
    isHeating = false; // 4단계 용
    isDragging = false; // 2단계 용
});

// DOM 요소 가져오기
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
    // 0, 1단계와 결과창을 제외하고 타이머 바 표시
    timerWrapper.style.display = (index > 1 && index < 6) ? 'block' : 'none';
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
    statusText.textContent = msg;
}

function addScore(stageKey, points) {
    state.scores[stageKey] = Math.min(MAX_SCORE, Math.max(0, points));
}

// === 게임 시작 및 재시작 ===
document.getElementById('start-btn').addEventListener('click', () => initStage1());
document.getElementById('restart-btn').addEventListener('click', () => {
    window.location.reload();
});

// ==========================================
// 1단계: 계란 깨기
// ==========================================
function initStage1() {
    showScreen(1);
    updateStatus("타이밍에 맞춰 계란을 깨세요!");
    
    const bar = document.getElementById('crack-bar');
    const btn = document.getElementById('crack-btn');
    let pos = 0;
    let direction = 1;
    let speed = 1;

    const interval = setInterval(() => {
        pos += speed * direction;
        if (pos >= 95 || pos <= 0) direction *= -1;
        bar.style.left = pos + '%';
    }, 16);
    state.timers.push(interval);

    btn.onclick = () => {
        clearInterval(interval);
        btn.onclick = null;
        
        const targetMin = 40;
        const targetMax = 60;
        let points = 0;

        if (pos >= targetMin && pos <= targetMax) {
            points = 20;
            updateStatus("Perfect! 깔끔하게 깨졌어요!");
        } else if (pos >= 30 && pos <= 70) {
            points = 15;
            updateStatus("Good! 껍질이 조금 들어갔네요.");
        } else {
            points = 5;
            updateStatus("Bad... 계란이 으깨졌어요.");
        }

        addScore('stage1', points);
        setTimeout(initStage2, 1500);
    };
}
// ==========================================
// 2단계: 반죽 믹싱 (난이도 상향: 시간 제한 추가 + 토끼 방해 강화)
// ==========================================
function initStage2() {
    showScreen(2);
    updateStatus("15초 안에 반죽을 섞으세요! 토끼는 더 빨리 방해합니다!");

    const bowl = document.getElementById('bowl-area');
    const fillBar = document.getElementById('mix-fill');
    const msg = document.getElementById('mix-msg');
    const rabbit = document.getElementById('rabbit-intruder');
    
    let progress = 0;
    let rabbitActive = false;
    let pepperCount = 0;
    let isDragging = false;
    
    let timeLeft = 150; // 15초 (0.1초 단위)
    const MAX_TIME = 150;

    fillBar.style.width = '0%';
    rabbit.classList.add('hidden');

    // --- 난이도 조절 포인트 1: 전체 시간 제한 추가 ---
    const stageTimer = setInterval(() => {
        timeLeft--;
        timerBar.style.width = (timeLeft / MAX_TIME * 100) + '%';

        if (timeLeft <= 0) {
            clearInterval(stageTimer);
            finishStage2(pepperCount, true); // 시간 초과로 종료
        }
    }, 100);
    state.timers.push(stageTimer);

    const startDrag = () => { isDragging = true; };
    const endDrag = () => { isDragging = false; };
    
    bowl.addEventListener('mousedown', startDrag);
    bowl.addEventListener('mouseup', endDrag);
    bowl.addEventListener('touchstart', startDrag);
    bowl.addEventListener('touchend', endDrag);

    const mixHandler = () => {
        if (isDragging && progress < 100 && !rabbitActive) {
            progress += 0.5; // 진행 속도 약간 상향 (0.3 -> 0.5)
            fillBar.style.width = progress + '%';
            msg.textContent = `반죽 진행도: ${Math.floor(progress)}%`;

            if (progress >= 100) {
                finishStage2(pepperCount, false);
            }
        }
    };
    bowl.addEventListener('mousemove', mixHandler);
    bowl.addEventListener('touchmove', mixHandler);

    // --- 난이도 조절 포인트 2: 토끼 등장 빈도 및 속도 강화 ---
    const rabbitTimer = setInterval(() => {
        // 등장 확률 증가 (0.3 -> 0.5), 더 자주 나타남
        if (progress < 95 && !rabbitActive && Math.random() < 0.5) {
            rabbitActive = true;
            rabbit.classList.remove('hidden');
            updateStatus("🐰 토끼 습격! 1초 안에 쫓아내세요!!");
            
            // 후추 뿌리는 대기 시간 단축 (1.5초 -> 1.0초)
            const pepperTimer = setTimeout(() => {
                if (rabbitActive) {
                    pepperCount++;
                    globalMsg.textContent = `🐰 매워!! (후추 ${pepperCount}회)`;
                    rabbitActive = false;
                    rabbit.classList.add('hidden');
                }
            }, 1000); 
            state.timers.push(pepperTimer);
        }
    }, 1200); // 체크 주기 단축 (1.5초 -> 1.2초)
    state.timers.push(rabbitTimer);

    rabbit.onclick = (e) => {
        e.stopPropagation();
        rabbitActive = false;
        rabbit.classList.add('hidden');
        updateStatus("휴... 토끼를 막았습니다!");
    };

    function finishStage2(peppers, isTimeOut) {
        clearAllTimers();
        
        let score = 20 - (peppers * 5); // 후추 페널티
        if (isTimeOut) {
            score = Math.max(0, score - 10); // 시간 초과 페널티
            updateStatus(`시간 초과! 반죽이 굳었습니다... (후추 피해: ${peppers}회)`);
        } else {
            updateStatus(`반죽 완성! (후추 피해: ${peppers}회)`);
        }
        
        addScore('stage2', Math.max(0, score));
        setTimeout(initStage3, 1500);
    }
}

// ==========================================
// 3단계: 머랭 치기
// ==========================================
function initStage3() {
    showScreen(3);
    updateStatus("버튼을 빠르게 연타하세요!");

    const btn = document.getElementById('whisk-btn');
    const fillBar = document.getElementById('meringue-fill');
    const foam = document.getElementById('meringue-foam');
    
    let stiffness = 0;
    let timeLeft = 5.0;
    const MAX_TIME = 5.0;

    fillBar.style.width = '0%';

    const timer = setInterval(() => {
        timeLeft -= 0.1;
        timerBar.style.width = (timeLeft / MAX_TIME * 100) + '%';
        if (timeLeft <= 0) {
            finishStage3();
        }
    }, 100);
    state.timers.push(timer);

    btn.onclick = () => {
        if (stiffness < 100) {
            stiffness += 5;
            fillBar.style.width = stiffness + '%';
            let scale = 1 + (stiffness / 100);
            foam.style.transform = `scale(${scale})`;

            if (stiffness >= 100) {
                finishStage3();
            }
        }
    };

    function finishStage3() {
        btn.onclick = null;
        clearAllTimers();
        let score = Math.floor((stiffness / 100) * 20);
        addScore('stage3', score);
        if (stiffness >= 100) updateStatus("단단한 머랭 완성!");
        else updateStatus(`머랭이 묽어요... (${stiffness}%)`);
        setTimeout(initStage4, 1500);
    }
}

// ==========================================
// 4단계: 굽기
// ==========================================
function initStage4() {
    showScreen(4);
    updateStatus("온도를 초록색에 맞추고 여우를 막으세요!");

    const heatBtn = document.getElementById('heat-btn');
    const indicator = document.getElementById('temp-indicator');
    const pancake = document.getElementById('pancake');
    const fox = document.getElementById('fox-intruder');
    
    let temperature = 0;
    let isHeating = false;
    let bakeTime = 0;
    let timeLeft = 150; // 15초 (0.1초 단위)
    const MAX_TIME = 150;
    const TOTAL_BAKE_TIME = 80;

    let foxActive = false;
    fox.classList.add('hidden');

    // === 수정된 이벤트 등록 부분 ===

    // 마우스/터치 시작
    const startHeating = (e) => {
        e.preventDefault(); 
        isHeating = true;
    };

    // 마우스/터치 종료 (전역 범위 감지)
    const stopHeating = () => {
        isHeating = false;
    };

    heatBtn.addEventListener('mousedown', startHeating);
    heatBtn.addEventListener('touchstart', startHeating);

    // 버튼 밖에서 떼더라도 감지할 수 있도록 window 객체에 등록
    window.addEventListener('mouseup', stopHeating);
    window.addEventListener('touchend', stopHeating);

    // 추가: 여우를 클릭(탭)할 때 발생할 수 있는 드래그 상태 꼬임 방지
    fox.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // 이벤트 전파 방지
        stopHeating();       // 여우를 잡는 순간 불조절은 중단되도록 설정
    });

    const loop = setInterval(() => {
        timeLeft--;
        timerBar.style.width = (timeLeft / MAX_TIME * 100) + '%';

        if (isHeating) temperature += 2;
        else temperature -= 1.5;

        temperature = Math.max(0, Math.min(100, temperature));
        indicator.style.bottom = temperature + '%';

        if (temperature >= 40 && temperature <= 70) {
            bakeTime++;
            pancake.style.color = "#8D6E63";
            pancake.style.opacity = 0.5 + (bakeTime / TOTAL_BAKE_TIME) * 0.5;

            if ((bakeTime / TOTAL_BAKE_TIME) >= 1) {
                pancake.style.filter = "grayscale(70%) brightness(60%) contrast(130%)";
                globalMsg.textContent = "팬케이크가 타버렸어요!!";
            }
        }

        if (timeLeft <= 0) {
            finishStage4(bakeTime, TOTAL_BAKE_TIME);
        }

    }, 100);
    state.timers.push(loop);

    const foxTimer = setInterval(() => {
        if (!foxActive && Math.random() < 0.25) {
            foxActive = true;
            fox.classList.remove('hidden');
            updateStatus("🦊 여우가 나타났다!! 터치해서 막으세요!");

            const stealTimer = setTimeout(() => {
                if (foxActive) {
                    gameOver("여우에게 팬케이크를 뺏겼습니다 ㅠㅠ");
                }
            }, 1500);
            state.timers.push(stealTimer);
        }
    }, 2000);
    state.timers.push(foxTimer);

    fox.onclick = () => {
        foxActive = false;
        fox.classList.add('hidden');
        updateStatus("여우를 쫓아냈습니다! 불 조절 집중!");
    };

    function finishStage4(bakeTime, totalTime) {
        clearAllTimers();
        let error = totalTime - bakeTime;
        let score = 20 - Math.abs(Math.floor(error / 10));
        addScore('stage4', score);

        if (error > 50)
            updateStatus("굽기 완료! 하지만 반죽이 익지 않았어요...");
        else if (error < - 10)
            updateStatus("굽기 완료! 하지만 까맣게 탔습니다...");
        else
            updateStatus("굽기 완료! 노릇노릇하네요.");

        setTimeout(initStage5, 1500);
    }
}

// ==========================================
// 5단계: 토핑 (3단계 연속 주문) - 수정사항 3 반영: 드래그 드롭으로 변경
// ==========================================
function initStage5() {
    showScreen(5);
    const orderDisplay = document.getElementById('order-display');
    const toppingBox = document.getElementById('topping-box');

    
    
    // 팬케이크 드롭 영역 (stage-5는 stage-4의 pan-area와 같은 요소를 사용하지 않으므로, 임시 드롭존을 설정)
    // 여기서는 화면 중앙의 강아지/팬케이크 아이콘이 드롭존 역할을 하도록 하겠습니다.
    const dropZone = document.querySelector('#stage-5 .character'); 

    // 토핑 데이터
    const toppings = [
        { name: "딸기", icon: "🍓" },
        { name: "시럽", icon: "🍯" },
        { name: "버터", icon: "🧈" },
        { name: "블루베리", icon: "🫐" },
        { name: "초코", icon: "🍫" },
        { name: "생크림", icon: "🍦" }
    ];

    // 1. 주문 3개 생성 (중복 허용)
    const targetOrder = [];
    for(let i=0; i<3; i++) {
        targetOrder.push(toppings[Math.floor(Math.random() * toppings.length)]);
    }

    let currentStep = 0; 
    let timeLeft = 12.0;
    const MAX_TIME = 12.0;
    
    // UI 업데이트 함수
    function updateOrderUI() {
        if (currentStep >= 3) {
            orderDisplay.textContent = "✅ 모든 토핑 완료!";
            return;
        }
        const currentTarget = targetOrder[currentStep];
        orderDisplay.innerHTML = `
            남은 주문: <span class="current-target">${currentTarget.icon} ${currentTarget.name}</span>
            <br><span style="font-size:0.8rem; color:#888;">(${currentStep + 1}/3 단계)</span>
        `;
    }

    updateOrderUI();
    updateStatus("주문 순서대로 토핑을 팬케이크 위로 드래그하세요!");

    // 타이머
    const timer = setInterval(() => {
        timeLeft -= 0.1;
        timerBar.style.width = (timeLeft / MAX_TIME * 100) + '%';

        if (timeLeft <= 0) {
            finishStage5(false);
        }
    }, 100);
    state.timers.push(timer);

    // 토핑 버튼 생성 및 드래그 이벤트 등록
    toppingBox.innerHTML = '';
    const shuffled = [...toppings].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(t => {
        const div = document.createElement('div');
        div.className = 'topping-item';
        div.innerHTML = `<span style="font-size:2rem">${t.icon}</span><br><span style="font-size:0.8rem">${t.name}</span>`;
        
        // 드래그 속성 추가
        div.setAttribute('draggable', true);
        div.dataset.toppingName = t.name;

        // 드래그 시작 시 데이터 설정
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.toppingName);
            e.target.style.opacity = '0.5';
        });

        // 드래그 종료 시 투명도 복원
        div.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
        });
        
        toppingBox.appendChild(div);
    });

    // 드롭존 (강아지 아이콘) 이벤트 리스너 등록
    // 기본 동작 방지 (필수)
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.border = '2px dashed #ffc46bff'; // 드래그 오버 시 시각적 피드백
    });

    // 시각적 피드백 제거
    dropZone.addEventListener('dragleave', (e) => {
        dropZone.style.border = 'none';
    });

    // 드롭 발생 시 처리
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.border = 'none';

        if (currentStep >= 3) return;

        const droppedToppingName = e.dataTransfer.getData('text/plain');
        const currentTarget = targetOrder[currentStep].name;

        // 정답 체크
        if (droppedToppingName === currentTarget) {
            // 성공: 다음 단계로
            currentStep++;
            
            globalMsg.textContent = `👍 ${droppedToppingName} 성공!`;
            setTimeout(() => globalMsg.textContent = "", 500);

            // 팬케이크에 토핑 아이콘 시뮬레이션
            dropZone.innerHTML += targetOrder[currentStep-1].icon; 
            dropZone.style.fontSize = '3rem'; // 강아지 아이콘 크기 조절

            if (currentStep >= 3) {
                finishStage5(true);
            } else {
                updateOrderUI();
            }
        } else {
            // 실패: 시간 패널티 
            timeLeft -= 1.5; // 1.5초 시간 깎임
            globalMsg.textContent = `❌ ${droppedToppingName} (틀렸어요! 시간 감소)`;
            dropZone.style.border = '2px solid red'; // 틀릴 시 시각적 피드백
            setTimeout(() => {
                globalMsg.textContent = "";
                dropZone.style.border = 'none';
            }, 500);
        }
    });


    function finishStage5(isSuccess) {
        clearAllTimers();
        // 드롭 이벤트 제거 (게임 종료 시 정리)
        dropZone.removeEventListener('dragover', (e) => e.preventDefault());
        dropZone.removeEventListener('drop', () => {});
        
        let score = isSuccess ? 20 : Math.max(0, currentStep * 5);
        addScore('stage5', score);
        
        if (isSuccess) updateStatus("강아지가 배달을 시작합니다!");
        else updateStatus("시간 초과... 배달에 늦었습니다.");
        
        setTimeout(showResult, 1500);
    }
}

// ==========================================
// 결과 화면 및 게임 오버
// ==========================================
function gameOver(reason) {
    clearAllTimers();
    // 'Game Over' 시에도 재시작 대신 새로고침을 유도하도록 변경
    alert("GAME OVER: " + reason + "\n다시 시작하려면 '확인'을 눌러 페이지를 새로고침하세요.");
    window.location.reload();
}

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
    if (total >= 90) gradeText.textContent = "🏆 전설의 수플레 장인!";
    else if (total >= 70) gradeText.textContent = "👨‍🍳 훌륭한 쉐프!";
    else if (total >= 50) gradeText.textContent = "🙂 평범한 홈베이커";
    else gradeText.textContent = "😢 연습이 필요해요...";
}
