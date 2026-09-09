const fields = ['brand','cause','province','road_type','severity'];
const $ = (id) => document.getElementById(id);
let summary;

function option(select, item) { const el=document.createElement('option'); el.value=item.label; el.textContent=`${item.label} (${item.value})`; select.append(el); }
async function loadSummary() {
  summary = await fetch('/api/summary').then((r)=>r.json());
  $('total').textContent=summary.total; $('unverified').textContent=summary.unverified;
  $('last-run').textContent=summary.runs[0]?.finished_at?.slice(0,10) || '尚未运行';
  const map={brand:'brands',cause:'causes',province:'provinces',road_type:'roadTypes',severity:'severity'};
  for(const field of fields){ const current=$(field).value; $(field).length=1; summary[map[field]].forEach((x)=>option($(field),x)); $(field).value=current; }
}
async function loadReports() {
  const params=new URLSearchParams(); for(const field of fields) if($(field).value) params.set(field,$(field).value); if($('q').value) params.set('q',$('q').value);
  const rows=await fetch(`/api/reports?${params}`).then((r)=>r.json()); $('count').textContent=`${rows.length} 条`;
  $('reports').innerHTML=rows.length?rows.map((r)=>`<article class="report"><div class="date">${(r.event_date||r.published_at||r.collected_at).slice(0,10)}</div><div><h3><a href="${escapeHtml(r.source_url||'#')}" target="_blank" rel="noreferrer">${escapeHtml(r.title)}</a></h3><div class="meta">${escapeHtml(r.source_name)} · ${escapeHtml(r.platform||'未知平台')} · <span class="status">${escapeHtml(r.verification_status)}</span> · 相关度 ${r.relevance_score}</div><div class="chips"><span class="chip">${escapeHtml(r.brand)}</span><span class="chip">${escapeHtml(r.cause)}</span><span class="chip">${escapeHtml(r.road_type)}</span><span class="chip">${escapeHtml(r.province||'地点未知')}</span><span class="chip">${escapeHtml(r.severity)}</span></div></div><button data-id="${r.id}" class="verify">核验通过</button></article>`).join(''):'<div class="empty">暂无匹配线索。运行采集，或向 data/inbox 添加 JSONL 导出文件。</div>';
  document.querySelectorAll('.verify').forEach((button)=>button.onclick=async()=>{await fetch(`/api/reports/${button.dataset.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({verification_status:'human_verified'})}); await refresh();});
}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function refresh(){await loadSummary();await loadReports();}
for(const field of fields) $(field).onchange=loadReports; let timer; $('q').oninput=()=>{clearTimeout(timer);timer=setTimeout(loadReports,250)};
$('reset').onclick=()=>{for(const field of fields)$(field).value='';$('q').value='';loadReports()};
$('collect').onclick=async()=>{$('collect').disabled=true;$('collect').textContent='更新中…';await fetch('/api/collect',{method:'POST'});$('collect').disabled=false;$('collect').textContent='立即更新';await refresh()};
refresh();
