/* Gerenciador de Popups Customizados - Willian Gomes */

const Popup = {
  elements: null,
  
  // Cria o HTML do popup na memória e injeta no body
  init() {
    if (document.querySelector('.popup-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    overlay.innerHTML = `
      <div class="popup-box glass-card">
        <div class="popup-icon"></div>
        <h3 class="popup-title">Atenção</h3>
        <p class="popup-message"></p>
        <div class="popup-actions">
          <button class="btn btn-secondary btn-cancel">Cancelar</button>
          <button class="btn btn-primary btn-confirm">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    this.elements = {
      overlay: overlay,
      box: overlay.querySelector('.popup-box'),
      icon: overlay.querySelector('.popup-icon'),
      title: overlay.querySelector('.popup-title'),
      message: overlay.querySelector('.popup-message'),
      btnConfirm: overlay.querySelector('.btn-confirm'),
      btnCancel: overlay.querySelector('.btn-cancel'),
      actions: overlay.querySelector('.popup-actions')
    };
  },

  // Substitui o Alert
  alert(message, type = 'info') {
    this.init();
    return new Promise((resolve) => {
      this.setupContent(message, type, false);
      
      this.elements.btnConfirm.onclick = () => {
        this.close();
        resolve(true);
      };
      
      this.open();
    });
  },

  // Substitui o Confirm
  confirm(message, type = 'warning') {
    this.init();
    return new Promise((resolve) => {
      this.setupContent(message, type, true);

      this.elements.btnConfirm.onclick = () => {
        this.close();
        resolve(true);
      };

      this.elements.btnCancel.onclick = () => {
        this.close();
        resolve(false);
      };

      this.open();
    });
  },

  // Helpers Internos
  setupContent(message, type, isConfirm) {
    this.elements.message.textContent = message;
    this.elements.btnCancel.style.display = isConfirm ? 'block' : 'none';
    this.elements.btnConfirm.textContent = isConfirm ? 'Sim' : 'OK';

    // Ícones e Cores baseados no tipo
    const icons = {
      info: '<i class="fas fa-info-circle"></i>',
      success: '<i class="fas fa-check-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      error: '<i class="fas fa-times-circle"></i>'
    };
    
    const colors = {
      info: 'var(--primary)',
      success: '#00c853',
      warning: '#ffab00',
      error: '#ff4444'
    };

    this.elements.icon.innerHTML = icons[type] || icons.info;
    this.elements.icon.style.color = colors[type] || colors.info;
    
    // Define título
    const titles = {
      info: 'Informação',
      success: 'Sucesso!',
      warning: 'Atenção',
      error: 'Ops!'
    };
    this.elements.title.textContent = titles[type];
  },

  open() {
    requestAnimationFrame(() => {
      this.elements.overlay.classList.add('active');
    });
  },

  close() {
    this.elements.overlay.classList.remove('active');
  }
};