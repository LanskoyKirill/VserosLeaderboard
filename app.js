(()=>{
  'use strict';
  const rows=Array.isArray(window.CUPS_DATA)?window.CUPS_DATA:[];
  const $=id=>document.getElementById(id);
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,frac=3)=>n===null||n===undefined?'—':Number(n).toLocaleString('ru-RU',{minimumFractionDigits:frac,maximumFractionDigits:frac});
  let mode='total',page=1,topOnly=true,term='';const pageSize=30;
  const medal=r=>r===1?'🥇':r===2?'🥈':r===3?'🥉':null;
  const modeRank=r=>mode==='r1'?r.rank1:mode==='r2'?r.rank2:r.rank;
  const ordered=()=>{
    let result=rows;
    if(mode==='r2')result=result.filter(r=>r.rank2!==null);
    else if(mode==='total'&&topOnly&&!term.trim())result=result.filter(r=>r.rank<=300);
    else if(mode==='r1'&&topOnly&&!term.trim())result=result.filter(r=>r.rank1<=300);
    if(term.trim())result=result.filter(r=>r.login.toLocaleLowerCase().includes(term.toLocaleLowerCase().trim()));
    result=[...result];
    if(mode==='r1')result.sort((a,b)=>a.rank1-b.rank1);
    else if(mode==='r2')result.sort((a,b)=>a.rank2-b.rank2);
    else result.sort((a,b)=>a.rank-b.rank);
    return result;
  };
  function podium(){
    const medals=['🥇','🥈','🥉'];
    $('podium').innerHTML=rows.slice(0,3).map((r,i)=>{
      let color=['first','second','third'][i];
      return `<article class="podium-card ${color}"><div class="podium-top"><span class="podium-place">0${i+1} МЕСТО</span><span class="podium-crown" aria-hidden="true">${medals[i]}</span></div><h3 class="podium-login">${escape(r.login)}</h3><div class="podium-score">${fmt(r.total_est)} <span>из 1 500</span>${r.total_max>r.total_est+0.001?'<span class="uncertainty" title="Баллы могут повыситься при точном равенстве метрик">*</span>':''}</div><div class="podium-split"><div>Тур 01 <strong>${fmt(r.round1)}</strong></div><div>Тур 02 <strong>${fmt(r.round2_est)}</strong></div></div><div class="score-track"><span class="track-r1" style="width:${r.round1/1500*100}%"></span><span class="track-r2" style="width:${r.round2_est/1500*100}%"></span></div></article>`;
    }).join('');
  }
  function render(){
    const result=ordered();const totalPages=Math.max(1,Math.ceil(result.length/pageSize));page=Math.min(Math.max(page,1),totalPages);
    const visible=result.slice((page-1)*pageSize,page*pageSize);
    $('leaderboard-body').innerHTML=visible.length?visible.map(r=>{
      const rank=modeRank(r),m=medal(rank);const mt=m?`<span class="rank-medal" title="Место ${rank}">${m}</span>`:`<span class="rank-n">${rank}</span>`;
      return `<tr><td>${mt}</td><td class="login-cell">${escape(r.login)}${r.rank2!==null?'<span class="r2-tag">R2</span>':''}</td><td>${fmt(r.round1)}</td><td>${r.rank2===null?'—':fmt(r.round2_est)+(r.total_max>r.total_est+.001?'<span class="uncertainty" title="Возможное совпадение округлённой метрики">*</span>':'')}</td><td class="total-cell"><strong>${fmt(r.total_est)}</strong>${r.total_max>r.total_est+.001?'<span class="uncertainty" title="Возможная поправка на равенство метрик">*</span>':''}</td><td class="col-more"><button class="details-button" type="button" data-login="${escape(r.login)}" aria-label="Детали ${escape(r.login)}">↗</button></td></tr>`;
    }).join(''):'<tr><td colspan="6" class="empty-state">По вашему запросу ничего не найдено. Измените поисковый запрос.</td></tr>';
    const start=result.length?(page-1)*pageSize+1:0,end=Math.min(page*pageSize,result.length);
    $('table-summary').textContent=`${mode==='total'?'Общий зачёт':mode==='r1'?'Тур без прокторинга':'Тур с прокторингом'} · ${result.length} участников`;
    $('pagination-status').textContent=`Показано ${start}–${end} из ${result.length}`;
    $('page-index').textContent=`${page} / ${totalPages}`;
    $('prev').disabled=page<=1;$('next').disabled=page>=totalPages;
    $('top-checkbox-wrap').style.display=mode==='r2'?'none':'flex';
    $('leaderboard-body').querySelectorAll('[data-login]').forEach(button=>button.addEventListener('click',()=>detail(button.dataset.login)));
  }
  function detail(login){
    const r=rows.find(x=>x.login===login);if(!r)return;
    const tied=r.total_max>r.total_est+.00001;
    const m=r.rank2?`#${r.rank2}`:'Не участвовал';
    $('detail-content').innerHTML=`<div class="modal-kicker">УЧАСТНИК · ПОДРОБНЫЕ РЕЗУЛЬТАТЫ</div><h2 id="detail-title">${escape(r.login)}</h2><div class="modal-stats"><div class="modal-stat"><b>#${r.rank}</b><span>Место в общем зачёте</span></div><div class="modal-stat"><b>#${r.rank1}</b><span>Место, тур 01</span></div><div class="modal-stat"><b>${escape(m)}</b><span>Место, тур 02</span></div></div><h3 style="font-size:13px;margin:23px 0 12px">Тур 01 · ${fmt(r.round1)} / 900 баллов</h3><div class="task-grid">${['A','B','C'].map(k=>`<div class="task"><span>Задача ${k}</span><b>${fmt(r[k])}</b></div>`).join('')}</div><h3 style="font-size:13px;margin:23px 0 12px">Тур 02 · ${r.rank2!==null?fmt(r.round2_est):'0,000'} / 600 баллов</h3><div class="modal-stats"><div class="modal-stat"><b>${r.metric2??'—'}</b><span>Private-метрика (отображаемая)</span></div><div class="modal-stat"><b>${fmt(r.round2_est)}</b><span>Баллы (оценка)</span></div><div class="modal-stat"><b>${fmt(r.round2_max)}</b><span>Верхняя граница</span></div></div><div class="modal-note"><b>Общий результат: ${fmt(r.total_est)} / 1500</b>${tied?`<p style="margin:8px 0 0"><strong>Возможно совпадение:</strong> если исходные метрики совпадают точно, сумма может достигать ${fmt(r.total_max)}. Фактическая разница может быть нулевой.</p>`:''}<p style="margin:8px 0 0">Рейтинг независимый; данные All Cups на 18.10.2026. Не официальный протокол.</p></div>`;
    $('detail-backdrop').hidden=false;$('close-detail').focus();document.body.style.overflow='hidden';
  }
  function closeDetail(){$('detail-backdrop').hidden=true;document.body.style.overflow=''}
  if(!rows.length){$('leaderboard-body').innerHTML='<tr><td colspan="6" class="empty-state">Не удалось загрузить локальные данные. Откройте проект целиком.</td></tr>';return;}
  podium();render();
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{
    mode=btn.dataset.mode;page=1;document.querySelectorAll('[data-mode]').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))});render();
  }));
  $('search').addEventListener('input',e=>{term=e.target.value;page=1;render()});
  $('top-only').addEventListener('change',e=>{topOnly=e.target.checked;page=1;render()});
  $('prev').addEventListener('click',()=>{page--;render()});$('next').addEventListener('click',()=>{page++;render()});
  $('close-detail').addEventListener('click',closeDetail);$('detail-backdrop').addEventListener('click',e=>{if(e.target===$('detail-backdrop'))closeDetail()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();if(e.key==='/'&&document.activeElement!==$('search')&&$('detail-backdrop').hidden){e.preventDefault();$('search').focus()}});
})();
