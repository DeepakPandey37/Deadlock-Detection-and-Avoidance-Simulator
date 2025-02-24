
class DeadlockSimulator {
  constructor() {
    this.processes = [];
    this.resources = [];
    this.available = [];
    this.maxMatrix = [];
    this.allocationMatrix = [];
    this.needMatrix = [];
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.getElementById('setResources').addEventListener('click', () => this.setupResources());
    document.getElementById('addProcess').addEventListener('click', () => this.showProcessInputForm());
    document.getElementById('checkSafety').addEventListener('click', () => this.checkSystemSafety());
    document.getElementById('reset').addEventListener('click', () => this.resetSimulation());
    
    const scenarioSelect = document.getElementById('scenarioSelect');
    scenarioSelect.addEventListener('change', () => this.loadScenario(scenarioSelect.value));
  }

  setupResources() {
    const count = parseInt(document.getElementById('resourceCount').value);
    if (isNaN(count) || count < 1) {
      alert("Please enter a valid resource count.");
      return;
    }
    this.resources = Array(count).fill(0);
    
    const resourceAllocation = document.getElementById('resourceAllocation');
    resourceAllocation.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.className = 'resource-input-group';
      div.innerHTML = `
        <label>Resource ${i + 1} units:</label>
        <input type="number" id="resource${i}" min="0" value="0">
      `;
      resourceAllocation.appendChild(div);
    }
    

    this.resetMatrices();
  }

  resetMatrices() {
    this.processes = [];
    this.maxMatrix = [];
    this.allocationMatrix = [];
    this.needMatrix = [];
    this.updateMatrices();
  }

  // manual data dalne ka block
  showProcessInputForm() {
    const resourceCount = this.resources.length;
    if (resourceCount === 0) {
      alert("Please set resources first.");
      return;
    }
    let formDiv = document.getElementById('processInputForm');
    if (!formDiv) {
      formDiv = document.createElement('div');
      formDiv.id = 'processInputForm';
      document.querySelector('.control-panel').appendChild(formDiv);
    }
    formDiv.innerHTML = ''; // Clear any existing form
    const processId = this.processes.length;
    const title = document.createElement('h3');
    title.textContent = `Enter values for Process P${processId}`;
    formDiv.appendChild(title);

    const form = document.createElement('form');
    form.id = 'processForm';
    for (let i = 0; i < resourceCount; i++) {
      const div = document.createElement('div');
      // Max Need input
      const labelMax = document.createElement('label');
      labelMax.textContent = `Resource ${i+1} Max Need: `;
      const inputMax = document.createElement('input');
      inputMax.type = 'number';
      inputMax.min = '0';
      inputMax.value = '0';
      inputMax.required = true;
      inputMax.className = 'max-input';
      inputMax.dataset.resourceIndex = i;
      div.appendChild(labelMax);
      div.appendChild(inputMax);
      // Allocation input
      const labelAlloc = document.createElement('label');
      labelAlloc.textContent = ` Allocation: `;
      const inputAlloc = document.createElement('input');
      inputAlloc.type = 'number';
      inputAlloc.min = '0';
      inputAlloc.value = '0';
      inputAlloc.required = true;
      inputAlloc.className = 'alloc-input';
      inputAlloc.dataset.resourceIndex = i;
      div.appendChild(labelAlloc);
      div.appendChild(inputAlloc);
      form.appendChild(div);
    }
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Process';
    submitButton.type = 'submit';
    form.appendChild(submitButton);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const maxInputs = form.querySelectorAll('.max-input');
      const allocInputs = form.querySelectorAll('.alloc-input');
      let maxValues = [];
      let allocValues = [];
      for (let i = 0; i < resourceCount; i++) {
        let maxVal = parseInt(maxInputs[i].value);
        let allocVal = parseInt(allocInputs[i].value);
        if (isNaN(maxVal) || isNaN(allocVal)) {
          alert("Please fill all fields with valid numbers.");
          return;
        }
        if (allocVal > maxVal) {
          alert(`Allocation for Resource ${i+1} cannot exceed Max Need.`);
          return;
        }
        maxValues.push(maxVal);
        allocValues.push(allocVal);
      }
      // Add process data
      this.processes.push(processId);
      this.maxMatrix.push(maxValues);
      this.allocationMatrix.push(allocValues);
      this.updateMatrices();
      formDiv.remove();
    });
    formDiv.appendChild(form);
  }

  updateMatrices() {
    this.updateAvailableResources();
    this.updateNeedMatrix();
    this.updateAllocationMatrix();
    this.updateMaxMatrix();
  }

  updateAllocationMatrix() {
    const matrix = document.getElementById('allocationMatrix');
    matrix.innerHTML = this.generateMatrixHTML(this.allocationMatrix);
  }

  updateMaxMatrix() {
    const matrix = document.getElementById('maxMatrix');
    matrix.innerHTML = this.generateMatrixHTML(this.maxMatrix);
  }

  updateNeedMatrix() {
    this.needMatrix = this.maxMatrix.map((max, i) =>
      max.map((value, j) => value - this.allocationMatrix[i][j])
    );
    const matrix = document.getElementById('needMatrix');
    matrix.innerHTML = this.generateMatrixHTML(this.needMatrix);
  }

  updateAvailableResources() {
    this.available = this.resources.map((total, i) => {
      const allocated = this.allocationMatrix.reduce((sum, row) => sum + row[i], 0);
      return total - allocated;
    });
  }

  generateMatrixHTML(matrix) {
    if (!matrix.length) return '<p>No processes yet</p>';
    return matrix.map((row) => `
      <div class="matrix-row">
        ${row.map(cell => `<div class="matrix-cell">${cell}</div>`).join('')}
      </div>
    `).join('');
  }

  checkSystemSafety() {
    const work = [...this.available];
    const finish = Array(this.processes.length).fill(false);
    const safeSequence = [];
    
    let found;
    do {
      found = false;
      for (let i = 0; i < this.processes.length; i++) {
        if (!finish[i] && this.canProcessExecute(i, work)) {
          // Process can execute; release its allocation
          work.forEach((val, j) => work[j] += this.allocationMatrix[i][j]);
          finish[i] = true;
          safeSequence.push(i);
          found = true;
        }
      }
    } while (found);

    const isSafe = finish.every(f => f);
    this.displaySafetyStatus(isSafe, safeSequence);
  }

  canProcessExecute(processIndex, work) {
    return this.needMatrix[processIndex].every((need, i) => need <= work[i]);
  }

  displaySafetyStatus(isSafe, safeSequence) {
    const statusMessage = document.getElementById('statusMessage');
    const sequenceDisplay = document.getElementById('safeSequence');
    
    if (isSafe) {
      statusMessage.innerHTML = '<p class="status-safe">System is in a SAFE state!</p>';
      sequenceDisplay.innerHTML = `<p>Safe Sequence: ${safeSequence.map(p => `P${p}`).join(' → ')}</p>`;
    } else {
      statusMessage.innerHTML = '<p class="status-unsafe">System is in an UNSAFE state!</p>';
      sequenceDisplay.innerHTML = '<p>No safe sequence exists.</p>';
    }
  }

  resetSimulation() {
    this.processes = [];
    this.resources = [];
    this.available = [];
    this.maxMatrix = [];
    this.allocationMatrix = [];
    this.needMatrix = [];
    
    document.getElementById('resourceAllocation').innerHTML = '';
    document.getElementById('allocationMatrix').innerHTML = '';
    document.getElementById('maxMatrix').innerHTML = '';
    document.getElementById('needMatrix').innerHTML = '';
    document.getElementById('statusMessage').innerHTML = '';
    document.getElementById('safeSequence').innerHTML = '';
    document.getElementById('resourceCount').value = 3;
    
    const formDiv = document.getElementById('processInputForm');
    if (formDiv) formDiv.remove();
  }

  // Load a predefined scenario (for example, Scenario 1)
  loadScenario(scenario) {
    if (scenario === 'scenario1') {
      this.resetSimulation();
      // Define 3 resources
      document.getElementById('resourceCount').value = 3;
      this.resources = [10, 5, 7];
      const resourceAllocation = document.getElementById('resourceAllocation');
      resourceAllocation.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const div = document.createElement('div');
        div.className = 'resource-input-group';
        div.innerHTML = `
          <label>Resource ${i + 1} units:</label>
          <input type="number" id="resource${i}" min="0" value="${this.resources[i]}">
        `;
        resourceAllocation.appendChild(div);
      }
      // Predefine two processes:
      // Process 0: Max = [7, 5, 3], Allocation = [0, 1, 0]
      // Process 1: Max = [3, 2, 2], Allocation = [2, 0, 0]
      this.processes.push(0, 1);
      this.maxMatrix.push([7, 5, 3], [3, 2, 2]);
      this.allocationMatrix.push([0, 1, 0], [2, 0, 0]);
      this.updateMatrices();
    }
  }
}

const simulator = new DeadlockSimulator();
