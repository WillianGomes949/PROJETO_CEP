document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos do DOM (Mesmos de antes) ---
  const cepInput = document.getElementById('cep');
  const logradouroInput = document.getElementById('logradouro');
  const numeroInput = document.getElementById('numero');
  const cidadeInput = document.getElementById('cidade');
  
  const btnSalvar = document.getElementById('btn-salvar');
  const btnLimpar = document.getElementById('btn-limpar');
  const resultsContainer = document.querySelector('.result-grid');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const searchUf = document.getElementById('search-uf');
  const searchCidade = document.getElementById('search-cidade');
  const searchRua = document.getElementById('search-rua');
  const btnBuscarLista = document.getElementById('btn-buscar-lista');
  const listaResultados = document.getElementById('search-results-list');

  const STORAGE_KEY = '@cep-finder:enderecos';

  carregarDoLocalStorage();

  // --- Abas ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).style.display = 'block'; 
    });
  });

  // --- Busca CEP Individual ---
  cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
  });

  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    toggleLoadingInput(true);

    try {
      const data = await fetchViaCep(`https://viacep.com.br/ws/${cep}/json/`);
      
      if (!data.erro) {
        preencherFormularioPrincipal(data);
        numeroInput.focus();
        // Popup.alert('CEP encontrado!', 'success'); // Opcional
      } else {
        Popup.alert('CEP não encontrado na base de dados.', 'error'); // <--- POPUP
        limparFormulario(false);
      }
    } catch (error) {
      console.error(error);
      Popup.alert('Erro de conexão. Verifique sua internet.', 'error'); // <--- POPUP
    } finally {
      toggleLoadingInput(false);
    }
  });

  // --- Busca por Lista ---
  btnBuscarLista.addEventListener('click', async () => {
    const uf = searchUf.value;
    const cidade = searchCidade.value.trim();
    const rua = searchRua.value.trim();

    if (!uf || cidade.length < 3 || rua.length < 3) {
      Popup.alert('Preencha a UF e digite pelo menos 3 letras para Cidade e Rua.', 'warning'); // <--- POPUP
      return;
    }

    btnBuscarLista.disabled = true;
    btnBuscarLista.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    listaResultados.innerHTML = '';

    try {
      const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}/json/`;
      const data = await fetchViaCep(url);

      if (!data || data.length === 0) {
        listaResultados.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1rem;">Nenhum endereço encontrado.</p>';
        return;
      }

      data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
          <div class="item-main">
            <strong>${item.logradouro}</strong>
            <span>${item.bairro}, ${item.localidade}</span>
          </div>
          <div class="item-cep">${item.cep}</div>
        `;
        
        div.addEventListener('click', () => {
          preencherFormularioPrincipal(item);
          tabButtons[0].click(); 
          setTimeout(() => numeroInput.focus(), 200);
        });

        listaResultados.appendChild(div);
      });

    } catch (error) {
      console.error(error);
      Popup.alert('Não foi possível realizar a pesquisa.', 'error'); // <--- POPUP
    } finally {
      btnBuscarLista.disabled = false;
      btnBuscarLista.innerHTML = '<i class="fas fa-search"></i> Pesquisar CEPs';
    }
  });

  // --- Salvar Endereço ---
  btnSalvar.addEventListener('click', () => {
    if (!cepInput.value || !logradouroInput.value || !numeroInput.value) {
      Popup.alert('Por favor, preencha CEP, Rua e Número para salvar.', 'warning'); // <--- POPUP
      return;
    }

    const novoEndereco = {
      id: Date.now(), 
      cep: cepInput.value,
      logradouro: logradouroInput.value,
      numero: numeroInput.value,
      cidade: cidadeInput.value
    };

    salvarNoLocalStorage(novoEndereco);
    renderizarCard(novoEndereco, true);
    
    // Feedback positivo
    Popup.alert('Endereço salvo com sucesso!', 'success'); // <--- POPUP
    
    limparFormulario(true);
  });

  btnLimpar.addEventListener('click', () => limparFormulario(true));

  // --- Funções Auxiliares ---

  async function fetchViaCep(url) {
    const res = await fetch(url);
    return await res.json();
  }

  function preencherFormularioPrincipal(data) {
    cepInput.value = data.cep;
    logradouroInput.value = data.logradouro;
    cidadeInput.value = `${data.localidade} - ${data.uf}`;
    numeroInput.value = '';
  }

  function toggleLoadingInput(isLoading) {
    const icon = cepInput.previousElementSibling;
    if (isLoading) {
      icon.classList.remove('fa-search');
      icon.classList.add('fa-spinner', 'fa-spin');
      cepInput.disabled = true;
    } else {
      icon.classList.remove('fa-spinner', 'fa-spin');
      icon.classList.add('fa-search');
      cepInput.disabled = false;
    }
  }

  function limparFormulario(limparTudo = true) {
    if (limparTudo) {
      cepInput.value = '';
      searchCidade.value = '';
      searchRua.value = '';
      searchUf.value = '';
      listaResultados.innerHTML = '';
      cepInput.focus();
    }
    logradouroInput.value = '';
    numeroInput.value = '';
    cidadeInput.value = '';
  }

  // --- LocalStorage ---

  function carregarDoLocalStorage() {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    resultsContainer.innerHTML = '';
    dados.reverse().forEach(item => renderizarCard(item, false));
    atualizarContador();
  }

  function salvarNoLocalStorage(item) {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    dados.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    atualizarContador();
  }

  function removerDoLocalStorage(id) {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const novosDados = dados.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDados));
    atualizarContador();
  }

 function renderizarCard(data, isNew = false) {
    const card = document.createElement('div');
    card.classList.add('result-card');
    
    // Cria a URL de busca do Google Maps
    const termoBusca = `${data.logradouro}, ${data.numero} - ${data.cidade}, ${data.cep}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(termoBusca)}`;

    card.innerHTML = `
      <div class="card-icon"><i class="fas fa-map-pin"></i></div>
      
      <div class="card-info">
        <h4>${data.cidade}</h4>
        <p>${data.logradouro}, ${data.numero}</p>
        <span class="cep-tag">${data.cep}</span>
      </div>

      <div class="card-actions">
        <a href="${googleMapsUrl}" target="_blank" class="btn-icon btn-map" title="Ver no Google Maps">
          <i class="fas fa-map-marked-alt"></i>
        </a>
        <button class="btn-icon btn-delete" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Botão Excluir com POPUP (Mantendo sua lógica anterior)
    card.querySelector('.btn-delete').addEventListener('click', async () => {
      const confirmado = await Popup.confirm('Tem certeza que deseja excluir este endereço?', 'warning');
      
      if(confirmado) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        setTimeout(() => {
          card.remove();
          removerDoLocalStorage(data.id);
        }, 300);
      }
    });

    if(isNew) {
       resultsContainer.prepend(card);
    } else {
       resultsContainer.appendChild(card);
    }
  }
  function atualizarContador() {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const badge = document.querySelector('.badge');
    if(badge) badge.textContent = `${dados.length} itens`;
  }
});