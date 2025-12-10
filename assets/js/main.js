
// Simple client-side interactions
document.addEventListener('DOMContentLoaded', function(){
  // Label preview
  const previewArea = document.getElementById('label-preview');
  const inputs = document.querySelectorAll('.label-input');
  const logoInput = document.getElementById('logo-input');
  function updatePreview(){
    if(!previewArea) return;
    const eventType = document.getElementById('event-type').value;
    const message = document.getElementById('custom-message').value;
    const colors = document.getElementById('preferred-colors').value;
    const font = document.getElementById('font-style').value;
    const qty = document.getElementById('quantity-needed').value || '1';
    previewArea.style.background = colors || 'linear-gradient(90deg,#ffd1dc,#ffd9a6)';
    previewArea.style.fontFamily = font;
    previewArea.innerHTML = `<div style="padding:12px">
      <div style="font-weight:800;font-size:18px">${eventType} — x${qty}</div>
      <div style="margin-top:8px;font-size:14px">${message || 'Your message here'}</div>
      <div id="logo-mock" style="margin-top:10px"></div>
    </div>`;
  }
  inputs.forEach(i=>i.addEventListener('input', updatePreview));
  if(logoInput){
    logoInput.addEventListener('change', function(e){
      const file = this.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        const img = new Image();
        img.src = ev.target.result;
        img.style.maxHeight = '60px';
        img.style.maxWidth = '160px';
        const logoMock = document.getElementById('logo-mock');
        if(logoMock){
          logoMock.innerHTML = '';
          logoMock.appendChild(img);
        }
      }
      reader.readAsDataURL(file);
    });
  }
  updatePreview();

  // Gallery click to open modal
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click', ()=> {
      const name = card.dataset.name;
      alert(name + " — $3\nAdd to cart functionality can be plugged in.");
    });
  });
});
