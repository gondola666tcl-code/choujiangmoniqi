function factorial(n) {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function comb(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  // 优化大数
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - i + 1) / i;
  }
  return res;
}

// 计算放回抽奖概率
function calcProbability(prizeCount, poolCount, drawCount, targetCount) {
  // 放回抽奖，单次中奖概率p = 奖品数/奖池总数
  const p = prizeCount / poolCount;
  // 计算抽drawCount次，至少抽中targetCount个的概率
  let prob = 0;
  for (let k = targetCount; k <= drawCount; k++) {
    prob += comb(drawCount, k) * Math.pow(p, k) * Math.pow(1 - p, drawCount - k);
  }
  return prob;
}


function createEventForm(idx) {
  return `<div class="event" data-idx="${idx}">
    <label>奖品个数：<input type="number" class="prizeCount" min="1" value="1"></label>
    <label>奖池总数：<input type="number" class="poolCount" min="1" value="10"></label>
    <label>抽取次数：<input type="number" class="drawCount" min="1" value="1"></label>
    <label>希望抽中个数：<input type="number" class="targetCount" min="1" value="1"></label>
    <button class="removeBtn">删除</button>
  </div>`;
}

function updateEventsUI() {
  const eventsDiv = document.getElementById('events');
  eventsDiv.innerHTML = '';
  eventList.forEach((_, idx) => {
    eventsDiv.innerHTML += createEventForm(idx);
  });
  // 绑定删除事件
  document.querySelectorAll('.removeBtn').forEach((btn, idx) => {
    btn.onclick = function () {
      eventList.splice(idx, 1);
      updateEventsUI();
    };
  });
}

let eventList = [{}];

document.addEventListener('DOMContentLoaded', function () {
  updateEventsUI();
  document.getElementById('addEventBtn').onclick = function () {
    eventList.push({});
    updateEventsUI();
  };
  const animCanvas = document.getElementById('lotteryAnim');
  const animCtx = animCanvas.getContext && animCanvas.getContext('2d');
  let animTimer = null;

  function startAnim(drawCount, prizeCount, poolCount, callback) {
    if (!animCtx) { callback(); return; }
    animCanvas.style.display = '';
    animCtx.clearRect(0,0,animCanvas.width,animCanvas.height);
    // 生成球
    let balls = [];
    let total = poolCount;
    let prize = prizeCount;
    for(let i=0;i<total;i++){
      balls.push({
        color: i<prize?'#ff6666':'#bbb',
        label: i<prize?'奖':'空',
        x: 60+Math.random()*220,
        y: 40+Math.random()*40,
        r: 18
      });
    }
    let t = 0, shake = 0;
    function drawBalls(){
      animCtx.clearRect(0,0,animCanvas.width,animCanvas.height);
      animCtx.font = '16px Arial';
      animCtx.fillStyle = '#222';
      animCtx.fillText('正在摇奖...', 120, 20);
      for(let b of balls){
        let dx = Math.sin(t/5 + b.x)*2, dy = Math.cos(t/7 + b.y)*2;
        animCtx.beginPath();
        animCtx.arc(b.x+dx, b.y+dy, b.r, 0, 2*Math.PI);
        animCtx.fillStyle = b.color;
        animCtx.fill();
        animCtx.strokeStyle = '#888';
        animCtx.stroke();
        animCtx.fillStyle = '#222';
        animCtx.textAlign = 'center';
        animCtx.textBaseline = 'middle';
        animCtx.fillText(b.label, b.x+dx, b.y+dy);
      }
    }
    function anim() {
      t++;
      drawBalls();
      if (t < 40+Math.random()*20) {
        animTimer = requestAnimationFrame(anim);
      } else {
        animCanvas.style.display = 'none';
        callback();
      }
    }
    anim();
  }

  document.getElementById('calcBtn').onclick = function () {
    const events = document.querySelectorAll('.event');
    let probs = [];
    let valid = true;
    let firstDraw = 1, firstPrize = 1, firstPool = 10;
    events.forEach((ev, idx) => {
      const prizeCount = parseInt(ev.querySelector('.prizeCount').value);
      const poolCount = parseInt(ev.querySelector('.poolCount').value);
      const drawCount = parseInt(ev.querySelector('.drawCount').value);
      const targetCount = parseInt(ev.querySelector('.targetCount').value);
      if(idx===0){firstDraw=drawCount;firstPrize=prizeCount;firstPool=poolCount;}
      if (prizeCount <= 0 || poolCount <= 0 || drawCount <= 0 || targetCount <= 0) valid = false;
      if (prizeCount > poolCount) valid = false;
      if (targetCount > drawCount) valid = false;
      probs.push(calcProbability(prizeCount, poolCount, drawCount, targetCount));
    });
    const resultDiv = document.getElementById('result');
    if (!valid) {
      resultDiv.textContent = '请检查所有输入，确保为正整数且奖品数≤奖池总数，抽中数≤抽取次数';
      return;
    }
    resultDiv.textContent = '';
    startAnim(firstDraw, firstPrize, firstPool, function(){
      let totalProb = probs.reduce((a, b) => a * b, 1);
      let detail = probs.map((p, i) => `事件${i + 1}概率：${(p * 100).toFixed(1)}%`).join('，');
      resultDiv.textContent = `${detail}，全部同时发生的概率为：${(totalProb * 100).toFixed(1)}%`;
    });
  };
});
