(function(){
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const KEY = 'greenleaf_itinerary_pro_v3_2';

  // Airports (SEA)
  const SEA_AIRPORTS = [
    "SINGAPORE (SIN)","KUALA LUMPUR (KUL)","PENANG (PEN)","LANGKAWI (LGK)","JOHOR BAHRU (JHB)","KOTA KINABALU (BKI)","KUCHING (KCH)",
    "BANGKOK SUVARNABHUMI (BKK)","BANGKOK DON MUEANG (DMK)","PHUKET (HKT)","CHIANG MAI (CNX)","KRABI (KBV)",
    "JAKARTA SOEKARNO‑HATTA (CGK)","BALI DENPASAR (DPS)","SURABAYA (SUB)","YOGYAKARTA (YIA)","MEDAN KUALANAMU (KNO)",
    "HANOI (HAN)","HO CHI MINH (SGN)","DA NANG (DAD)","NHA TRANG CAM RANH (CXR)","PHU QUOC (PQC)",
    "PHNOM PENH (PNH)","SIEM REAP (SAI)","SIHANOUKVILLE (KOS)",
    "VIENTIANE (VTE)","LUANG PRABANG (LPQ)",
    "YANGON (RGN)","MANDALAY (MDL)",
    "MANILA (MNL)","CLARK (CRK)","CEBU (CEB)","DAVAO (DVO)","ILOILO (ILO)","CAGAYAN DE ORO (CGY)",
    "BRUNEI (BWN)","DILI (DIL)"
  ];
  const dl = $('#airports'); SEA_AIRPORTS.forEach(a => { const o=document.createElement('option'); o.value=a; dl.appendChild(o); });

  // Watermark setup
  const wmWrap = $('#watermarkWrap');
  wmWrap.dataset.wm = "";
  document.documentElement.style.setProperty('--wm-size', '96px');
  document.documentElement.style.setProperty('--wm-opacity', '0.05');
  document.documentElement.style.setProperty('--wm-rot', '-24deg');

  // Dynamic @page
  const printStyle = document.createElement('style'); document.head.appendChild(printStyle);
  function setPrint(page='A4', margin='normal'){
    let mm; switch(margin){case'narrow':mm='8mm';break;case'wide':mm='18mm';break;default:mm='10mm'}
    printStyle.textContent = `@page{ size:${page}; margin:${mm}; }`;
  }

  // Signature live preview
  function sigPreview(prefix){
    const name = $(`[data-field="${prefix}Name"]`);
    const pos  = $(`[data-field="${prefix}Pos"]`);
    const img  = $(`[data-field="${prefix}Img"]`);
    const nameP = $(`#${prefix}NamePreview`);
    const posP  = $(`#${prefix}PosPreview`);
    const imgP  = $(`#${prefix}Preview`);
    function sync(){
      nameP.textContent = name?.value || '';
      posP.textContent = pos?.value || '';
      if(img?.value){ imgP.src = img.value; imgP.style.display='block'; } else { imgP.style.display='none'; }
    }
    [name,pos,img].forEach(el=> el && el.addEventListener('input', ()=>{ sync(); autosave(); })); sync();
  }
  ['sigPrepared','sigApproved'].forEach(sigPreview);

  // Helpers
  const pageSize   = $('#pageSize');
  const marginSize = $('#marginSize');
  const uppercase  = $('#uppercaseMode');
  $('#year').textContent = new Date().getFullYear();

  const brandLogo = $('#brandLogo');

  // Executive Summary generation
  function genSummary(){
    const brand = $('[data-field="brandName"]').innerText.trim() || 'Greenleaf Assurance';
    const tag   = $('[data-field="tripTag"]').innerText.trim();
    const people= $('[data-field="participants"]').value.trim();
    const purpose = $('[data-field="purpose"]').value.trim();
    const sites   = $('[data-field="factory"]').value.trim();
    const s = $('[data-field="startDate"]').value; const e = $('[data-field="endDate"]').value;
    const dateStr = (s && e) ? `${s} to ${e}` : (s || e || '');
    const dest = guessDest();
    const who = people ? `Lead traveler(s): ${people}. ` : '';
    const siteStr = sites ? `Planned site visits: ${sites}. ` : '';
    const txt = `This itinerary covers travel ${dest ? 'to ' + dest + ' ' : ''}${dateStr ? 'from ' + dateStr + ' ' : ''}for ${purpose || 'business support activities'}. ${siteStr}${who}${brand} will coordinate logistics and ensure deliverables are met.`.trim();
    $('#summary').innerText = txt;
  }
  function guessDest(){
    // Guess from first flight "to" field
    const firstTo = $('#flightTable tbody tr td:nth-child(4) input')?.value || '';
    const m = firstTo.match(/^(.+?) \\([A-Z]{3}\\)/);
    return m ? m[1] : '';
  }
  $('#btnGenSummary').addEventListener('click', ()=>{ genSummary(); autosave(); });

  // Trip dates bind
  function bindDates(){ const s=$('[data-field="startDate"]').value; const e=$('[data-field="endDate"]').value; $('[data-bind="dates"]').textContent = (s && e) ? `${s} – ${e}` : ''; }
  document.addEventListener('input', e=>{
    if(e.target.matches('[data-field="startDate"],[data-field="endDate"],[data-field="brandName"],[data-field="tripTag"],[data-field="participants"],[data-field="purpose"],[data-field="factory"]')){
      bindDates(); autosave();
    }
  });

  // Flight & Visit rows
  const flightBody = $('#flightTable tbody');
  const visitBody  = $('#visitTable tbody');
  function flightRow(data={}){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="upper flight" placeholder="Flight No." value="${(data.flight||'').replace(/"/g,'&quot;')}"></td>
      <td><input type="date" value="${data.date||''}"></td>
      <td><input list="airports" class="upper iata" placeholder="From (City – IATA)" value="${data.from||''}"></td>
      <td><input list="airports" class="upper iata" placeholder="To (City – IATA)" value="${data.to||''}"></td>
      <td><input type="time" value="${data.dep||''}"></td>
      <td><input type="time" value="${data.arr||''}"></td>
      <td class="row-actions"><button class="btn small ghost delRow"><svg><use href="#i-trash"/></svg></button></td>`;
    // auto-close ) on blur for IATA
    tr.querySelectorAll('.iata').forEach(inp => inp.addEventListener('blur', ()=>{
      const v = inp.value;
      if(/\(.{3}$/.test(v)) inp.value = v + ')';
      autosave();
    }));
    return tr;
  }
  function visitRow(data={}){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="date" value="${data.date||''}"></td>
      <td><input placeholder="Activity" value="${data.activity||''}"></td>
      <td><input class="upper" placeholder="Facility" value="${data.facility||''}"></td>
      <td><textarea placeholder="Full site address">${data.address||''}</textarea></td>
      <td>
        <select>
          ${['','Car','Grab','Taxi','MRT','Bus','MRT+Bus','Company van','Walk'].map(x=>`<option ${data.transport===x?'selected':''}>${x}</option>`).join('')}
        </select>
      </td>
      <td class="row-actions"><button class="btn small ghost delRow"><svg><use href="#i-trash"/></svg></button></td>`;
    return tr;
  }

  // Add rows handlers
  $('#addFlight').addEventListener('click', ()=>{ flightBody.appendChild(flightRow()); autosave(); });
  $('#addVisit').addEventListener('click', ()=>{ visitBody.appendChild(visitRow()); autosave(); });
  document.addEventListener('click', (e)=>{ if(e.target.closest('.delRow')){ e.target.closest('tr').remove(); autosave(); }});

  // Collect / populate
  function collect(){
    return {
      head:{
        brandName: $('[data-field="brandName"]').innerText.trim(),
        tripTag:   $('[data-field="tripTag"]').innerText.trim(),
        logo: $('#brandLogo').src
      },
      overview:{
        participants: $('[data-field="participants"]').value,
        phones: $('[data-field="phones"]').value,
        purpose: $('[data-field="purpose"]').value,
        factory: $('[data-field="factory"]').value,
        startDate: $('[data-field="startDate"]').value,
        endDate: $('[data-field="endDate"]').value,
        hotel: $('[data-field="hotel"]').value,
        map: $('[data-field="map"]').value,
        hotelContacts: $('[data-field="hotelContacts"]').value
      },
      summary: $('#summary').innerText,
      flights: $$('#flightTable tbody tr').map(tr=>{
        const t=tr.querySelectorAll('td');
        return { flight:t[0].querySelector('input').value, date:t[1].querySelector('input').value,
          from:t[2].querySelector('input').value, to:t[3].querySelector('input').value,
          dep:t[4].querySelector('input').value, arr:t[5].querySelector('input').value };
      }),
      visits: $$('#visitTable tbody tr').map(tr=>{
        const t=tr.querySelectorAll('td');
        return { date:t[0].querySelector('input').value, activity:t[1].querySelector('input').value,
          facility:t[2].querySelector('input').value, address:t[3].querySelector('textarea').value,
          transport:t[4].querySelector('select').value };
      }),
      notes:{
        pickup: $('[data-field="pickup"]').innerHTML,
        instructions: $('[data-field="instructions"]').innerHTML,
        payment: $('[data-field="payment"]').innerHTML,
        contacts: $('[data-field="contacts"]').innerHTML
      },
      prefs:{ pageSize: $('#pageSize').value, margin: $('#marginSize').value, uppercase: $('#uppercaseMode').checked }
    };
  }
  function populate(data){
    try{
      $('[data-field="brandName"]').innerText = data.head?.brandName || 'Greenleaf Assurance';
      $('[data-field="tripTag"]').innerText   = data.head?.tripTag   || 'SINGAPORE MANAGEMENT SUPPORT';
      $('#brandNameFooter').textContent = data.head?.brandName || 'Greenleaf Assurance';
      if(data.head?.logo) $('#brandLogo').src = data.head.logo;

      $('[data-field="participants"]').value = data.overview?.participants || '';
      $('[data-field="phones"]').value       = data.overview?.phones || '';
      $('[data-field="purpose"]').value      = data.overview?.purpose || '';
      $('[data-field="factory"]').value      = data.overview?.factory || '';
      $('[data-field="startDate"]').value    = data.overview?.startDate || '';
      $('[data-field="endDate"]').value      = data.overview?.endDate || '';
      $('[data-field="hotel"]').value        = data.overview?.hotel || '';
      $('[data-field="map"]').value          = data.overview?.map || '';
      $('[data-field="hotelContacts"]').value= data.overview?.hotelContacts || '';

      $('#summary').innerText = data.summary || '';
      bindDates();

      flightBody.innerHTML = ''; (data.flights||[]).forEach(r=> flightBody.appendChild(flightRow(r)));
      visitBody.innerHTML  = ''; (data.visits||[]).forEach(r=> visitBody.appendChild(visitRow(r)));
      if(!flightBody.children.length) flightBody.appendChild(flightRow());
      if(!visitBody.children.length)  visitBody.appendChild(visitRow());

      $('[data-field="pickup"]').innerHTML       = data.notes?.pickup || '';
      $('[data-field="instructions"]').innerHTML = data.notes?.instructions || '';
      $('[data-field="payment"]').innerHTML      = data.notes?.payment || '';
      $('[data-field="contacts"]').innerHTML     = data.notes?.contacts || '';

      pageSize.value = data.prefs?.pageSize || 'A4';
      marginSize.value= data.prefs?.margin || 'normal';
      $('#uppercaseMode').checked = !!data.prefs?.uppercase;

      applyPrefs();
    }catch(e){ console.error(e); }
  }

  // Save/Load/Reset
  $('#btnSave').addEventListener('click', ()=>{ localStorage.setItem(KEY, JSON.stringify(collect())); alert('Saved to this browser.'); });
  $('#btnLoad').addEventListener('click', ()=>{ const raw=localStorage.getItem(KEY); if(!raw) return alert('No saved data found.'); populate(JSON.parse(raw)); });
  $('#btnReset').addEventListener('click', ()=>{ if(confirm('Clear saved data?')){ localStorage.removeItem(KEY); location.reload(); } });

  $('#btnNewBlank').addEventListener('click', ()=>{ if(confirm('Start a new blank itinerary?')){ populate(blankData()); genSummary(); localStorage.setItem(KEY, JSON.stringify(collect())); } });
  $('#btnNewTemplate').addEventListener('click', ()=>{ if(confirm('Load sample template data?')){ populate(templateData()); genSummary(); localStorage.setItem(KEY, JSON.stringify(collect())); } });

  // Export/import (plain + encrypted)
  $('#btnExport').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(collect(), null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `greenleaf-itinerary-${Date.now()}.json`; a.click();
  });
  $('#btnExportEnc').addEventListener('click', async ()=>{
    const pwd = prompt('Set a password for this file:'); if(!pwd) return;
    const data = new TextEncoder().encode(JSON.stringify(collect()));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(pwd, salt);
    const ct   = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
    const out = { v:1, alg:'AES-GCM', kdf:'PBKDF2', salt: buf2b64(salt), iv: buf2b64(iv), ct: buf2b64(new Uint8Array(ct)) };
    const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/octet-stream'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `greenleaf-itinerary-${Date.now()}.gleaf`; a.click();
  });
  $('#btnImport').addEventListener('click', ()=> $('#fileImport').click());
  $('#fileImport').addEventListener('change', (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try{
        const txt = reader.result; let obj = JSON.parse(txt);
        if(obj && obj.ct && obj.iv && obj.salt){
          const pwd = prompt('Enter password to decrypt:'); if(!pwd) return;
          const key = await deriveKey(pwd, b64tobuf(obj.salt));
          const pt  = await crypto.subtle.decrypt({name:'AES-GCM', iv: b64tobuf(obj.iv)}, key, b64tobuf(obj.ct));
          obj = JSON.parse(new TextDecoder().decode(new Uint8Array(pt)));
        }
        populate(obj); genSummary(); localStorage.setItem(KEY, JSON.stringify(collect())); alert('Imported.');
      }catch(err){ alert('Invalid or corrupted file.'); console.error(err); }
      finally{ e.target.value = ''; }
    };
    reader.readAsText(file);
  });

  // Crypto helpers
  function buf2b64(buf){ let binary=''; buf.forEach(b=> binary += String.fromCharCode(b)); return btoa(binary); }
  function b64tobuf(b64){ const bin = atob(b64); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i); return arr.buffer; }
  async function deriveKey(password, salt){
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'}, keyMaterial, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }

  // Print helpers: 24h time & ISO dates in PDF
  function pad(n){ return n.toString().padStart(2,'0'); }
  function to24h(t){ if(!t) return ''; const [h,m] = t.split(':').map(Number); return pad(h)+':'+pad(m); }
  function toISO(d){ return d; } // inputs already store YYYY-MM-DD
  let printClones = [];
  function beforePrint(){
    // Doc header
    const docIdEl = $('#docId'); const verEl=$('#docVer'); const genEl=$('#docGen');
    const s = $('[data-field="startDate"]').value || 'XXXX-XX-XX';
    const dest = (guessDest() || 'TRIP').toUpperCase().replace(/[^A-Z]/g,'');
    docIdEl.textContent = `GLA-TRIP-${s}-${dest}`;
    verEl.textContent = '1.0';
    genEl.textContent = new Date().toISOString().replace('T',' ').slice(0,16);

    // Replace time/date inputs with spans so browsers don't localize
    printClones = [];
    $$('input[type="time"]').forEach(inp=>{
      const span = document.createElement('span'); span.className='print-repl'; span.textContent = to24h(inp.value);
      inp.after(span); inp.style.display='none'; printClones.push([inp,span]);
    });
    $$('input[type="date"]').forEach(inp=>{
      const span = document.createElement('span'); span.className='print-repl'; span.textContent = toISO(inp.value);
      inp.after(span); inp.style.display='none'; printClones.push([inp,span]);
    });
  }
  function afterPrint(){
    printClones.forEach(([inp,span])=>{ span.remove(); inp.style.display=''; });
    printClones = [];
  }
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);

  // Print button
  $('#btnPrint').addEventListener('click', ()=>{ window.print(); });

  // Preferences & uppercase
  function applyPrefs(){
    setPrint($('#pageSize').value, $('#marginSize').value);
    const on = $('#uppercaseMode').checked;
    $$('.upper').forEach(el => { el.classList.toggle('uppercase', on); if(on && el.value) el.value = el.value.toUpperCase(); });
  }
  ;['pageSize','marginSize','uppercaseMode'].forEach(id => { const el = document.getElementById(id); el && el.addEventListener('change', ()=>{ applyPrefs(); localStorage.setItem(KEY, JSON.stringify(collect())); }); });

  // Initial data
  function plus(n){ return new Date(Date.now()+n*86400000).toISOString().slice(0,10); }
  function blankData(){
    return { head:{ brandName:'Greenleaf Assurance', tripTag:'' },
      overview:{ participants:'', phones:'', purpose:'', factory:'', startDate:'', endDate:'', hotel:'', map:'', hotelContacts:'' },
      flights:[], visits:[], notes:{ pickup:'', instructions:'', payment:'', contacts:'' }, summary:'' , prefs:{ pageSize:'A4', margin:'normal', uppercase:false } };
  }
  function templateData(){
    return { head:{ brandName:'Greenleaf Assurance', tripTag:'SINGAPORE MANAGEMENT SUPPORT' },
      overview:{ participants:'JANE DOE; JOHN LEE', phones:'+65 8000 0000 | +65 8111 1111', purpose:'BUSINESS SUPPORT SERVICES',
        factory:'RIGHTMEN SECURITY / MARKONO PRINT MEDIA', startDate:plus(0), endDate:plus(3),
        hotel:'ibis Styles Singapore on MacPherson', map:'https://maps.google.com', hotelContacts:'Front desk +65 1234 5678' },
      flights:[ {flight:'EK349', date:plus(-1), from:'PHNOM PENH (PNH)', to:'SINGAPORE (SIN)', dep:'20:50', arr:'23:50'},
                {flight:'EK348', date:plus(3),  from:'SINGAPORE (SIN)', to:'PHNOM PENH (PNH)', dep:'15:45', arr:'18:35'} ],
      visits:[ {date:plus(1), activity:'SUPPORT', facility:'RIGHTMEN SECURITY SERVICES PTE LTD', address:'10 Anson Rd, International Plaza, #34-02, 079903', transport:'MRT+Bus'},
               {date:plus(2), activity:'SUPPORT', facility:'MARKONO PRINT MEDIA PTE LTD', address:'M-Cube, 18 Pioneer Crescent, 628567', transport:'Grab'} ],
      notes:{ pickup:'Airport pickup via Grab.', instructions:'Arrive 08:45–09:00.', payment:'Settlement within 14 days after assignment.', contacts:'HQ: Niwanka (niwankap@greenleafassurance.com). Local: Nalaka.' },
      summary:'', prefs:{ pageSize:'A4', margin:'normal', uppercase:true } };
  }

  // Init
  setPrint('A4','normal');
  const saved = localStorage.getItem(KEY);
  if(saved){ try{ populate(JSON.parse(saved)); }catch{ populate(templateData()); } }
  else{ populate(templateData()); }
  if(!$('#summary').innerText.trim()) genSummary();

})();