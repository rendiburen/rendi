const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function currentUser(){
  try { return JSON.parse(localStorage.getItem('sittaUser')) || null; } catch { return null; }
}
function guardAuth(){
  if(!currentUser() && !location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')){
    location.href = 'index.html';
  }
}
function logout(){
  localStorage.removeItem('sittaUser');
  location.href='index.html';
}
function greet(){
  const hour = new Date().getHours();
  if(hour < 11) return 'Selamat pagi';
  if(hour < 15) return 'Selamat siang';
  if(hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}
function moneyToNumber(str){ return Number(String(str).replace(/[^0-9]/g,'')) || 0; }
function rupiah(num){ return new Intl.NumberFormat('id-ID',{style:'currency', currency:'IDR', maximumFractionDigits:0}).format(num); }
function setUserUI(){
  const user = currentUser();
  $$('.js-greeting').forEach(el => el.textContent = `${greet()}, ${user ? user.nama.split(' ')[0] : 'Pengguna'}!`);
  $$('.js-user').forEach(el => el.textContent = user ? `${user.nama} • ${user.lokasi}` : 'Guest');
  $$('.js-avatar').forEach(el => el.textContent = user ? user.nama.charAt(0) : 'S');
}
function openModal(id){ const el = document.getElementById(id); if(el) el.classList.add('active'); }
function closeModal(id){ const el = document.getElementById(id); if(el) el.classList.remove('active'); }

function initLogin(){
  const form = $('#loginForm');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = $('#email').value.trim();
    const password = $('#password').value.trim();
    const user = dataPengguna.find(u => u.email === email && u.password === password);
    if(!user){ alert('email/password yang anda masukkan salah'); return; }
    localStorage.setItem('sittaUser', JSON.stringify(user));
    location.href = 'dashboard.html';
  });
  $('#demoLogin').addEventListener('click', ()=>{ $('#email').value='admin@ut.ac.id'; $('#password').value='admin123'; });
}

function initDashboard(){
  if(!$('#dashboardPage')) return;
  const totalStok = dataBahanAjar.reduce((a,b)=>a + Number(b.stok), 0);
  $('#countBahan').textContent = dataBahanAjar.length;
  $('#countTracking').textContent = Object.keys(dataTracking).length;
  $('#countStok').textContent = totalStok.toLocaleString('id-ID');
  const tbody = $('#dashboardTable tbody');
  tbody.innerHTML = dataBahanAjar.slice(0,4).map(item => `<tr><td>${item.kodeBarang}</td><td>${item.namaBarang}</td><td>${item.kodeLokasi}</td><td><span class="badge ${item.stok < 200 ? 'badge-warning':'badge-success'}">${item.stok} unit</span></td></tr>`).join('');
}

function renderTracking(data){
  const percent = data.status.toLowerCase().includes('selesai') || data.perjalanan.length >= 6 ? 100 : data.status.toLowerCase().includes('dikirim') ? 80 : 55;
  $('#trackingResult').innerHTML = `
    <div class="card">
      <span class="badge badge-primary">DO ${data.nomorDO}</span>
      <h2>${data.nama}</h2>
      <div class="progress"><div class="bar" style="width:${percent}%"></div></div>
      <p><b>Status:</b> ${data.status}</p>
      <div class="mini-grid">
        <div class="info-box"><span>Ekspedisi</span><b>${data.ekspedisi}</b></div>
        <div class="info-box"><span>Tanggal Kirim</span><b>${data.tanggalKirim}</b></div>
        <div class="info-box"><span>Jenis Paket</span><b>${data.paket}</b></div>
        <div class="info-box"><span>Total Pembayaran</span><b>${data.total}</b></div>
      </div>
      <div class="timeline">
        ${data.perjalanan.map(p => `<div class="timeline-item"><b>${p.waktu}</b><p class="muted">${p.keterangan}</p></div>`).join('')}
      </div>
    </div>`;
}
function initTracking(){
  if(!$('#trackingForm')) return;
  $('#trackingForm').addEventListener('submit', e=>{
    e.preventDefault();
    const nomor = $('#nomorDO').value.trim();
    const data = dataTracking[nomor];
    if(!data){ $('#trackingResult').innerHTML = `<div class="result-empty"><h3>Data tidak ditemukan</h3><p>Pastikan nomor Delivery Order benar. Contoh: 2023001234 atau 2023005678.</p></div>`; return; }
    renderTracking(data);
  });
  $('#nomorDO').value='2023001234';
  renderTracking(dataTracking['2023001234']);
}

function rowTemplate(item, index){
  return `<tr>
    <td><img class="cover" src="${item.cover}" alt="Cover ${item.namaBarang}" onerror="this.src='assets/logo-ut.png'"></td>
    <td><b>${item.kodeBarang}</b><br><span class="muted">${item.kodeLokasi}</span></td>
    <td>${item.namaBarang}</td>
    <td>${item.jenisBarang}</td>
    <td>${item.edisi}</td>
    <td><span class="badge ${item.stok < 200 ? 'badge-warning':'badge-success'}">${item.stok} unit</span></td>
    <td><button class="btn btn-light" onclick="editStock(${index})">Ubah Stok</button></td>
  </tr>`;
}
function renderStock(filter=''){
  const tbody = $('#stockTable tbody');
  if(!tbody) return;
  const keyword = filter.toLowerCase();
  const data = dataBahanAjar.filter(i => Object.values(i).join(' ').toLowerCase().includes(keyword));
  tbody.innerHTML = data.map((item)=> rowTemplate(item, dataBahanAjar.indexOf(item))).join('') || `<tr><td colspan="7">Tidak ada data yang cocok.</td></tr>`;
  $('#stockSummary').textContent = `${data.length} data ditampilkan`;
}
function editStock(index){
  const nilai = prompt('Masukkan jumlah stok baru:', dataBahanAjar[index].stok);
  if(nilai === null) return;
  const stok = Number(nilai);
  if(Number.isNaN(stok) || stok < 0){ alert('Stok harus berupa angka positif.'); return; }
  dataBahanAjar[index].stok = stok;
  renderStock($('#searchStock').value);
}
function initStock(){
  if(!$('#stockPage')) return;
  renderStock();
  $('#searchStock').addEventListener('input', e=> renderStock(e.target.value));
  $('#addStockForm').addEventListener('submit', e=>{
    e.preventDefault();
    const form = e.target;
    const newItem = {
      kodeLokasi: form.kodeLokasi.value.trim().toUpperCase(),
      kodeBarang: form.kodeBarang.value.trim().toUpperCase(),
      namaBarang: form.namaBarang.value.trim(),
      jenisBarang: form.jenisBarang.value,
      edisi: form.edisi.value.trim(),
      stok: Number(form.stok.value),
      cover: form.cover.value.trim() || 'img/pengantar_komunikasi.jpg'
    };
    if(Object.values(newItem).some(v => v === '' || Number.isNaN(v))){ alert('Mohon lengkapi data dengan benar.'); return; }
    dataBahanAjar.unshift(newItem);
    form.reset();
    closeModal('addModal');
    renderStock();
    alert('Data stok bahan ajar berhasil ditambahkan.');
  });
}
function initReports(){
  if(!$('#reportsPage')) return;
  const tbody = $('#reportTable tbody');
  tbody.innerHTML = Object.values(dataTracking).map((t,i)=>`<tr><td>${i+1}</td><td>${t.nomorDO}</td><td>${t.nama}</td><td>${t.ekspedisi}</td><td>${t.status}</td><td>${t.total}</td></tr>`).join('');
  const income = Object.values(dataTracking).reduce((a,b)=>a+moneyToNumber(b.total),0);
  $('#reportIncome').textContent = rupiah(income);
  $('#reportDO').textContent = Object.keys(dataTracking).length;
  $('#reportItems').textContent = dataBahanAjar.length;
}

document.addEventListener('DOMContentLoaded', ()=>{
  guardAuth(); setUserUI(); initLogin(); initDashboard(); initTracking(); initStock(); initReports();
  document.addEventListener('click', e=>{ if(e.target.classList.contains('modal')) e.target.classList.remove('active'); });
});
