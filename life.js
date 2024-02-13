const config = {
  rows: 75,
  cols: 100,
  defaultBuildCooldown: 16, // iterations
  actualSimSpeed: 0, // ms
  visualSimSpeed: 10
}

const colors = {
  alive: "#000000",
  trapper: "#008000",
  voyager: "#8d00ce",
  builder: "#0000FF",
  currentColorHex: "#000000" // alive
}

let genCount = 0;
let aliveCount = 0;
let trapperCount = 0;
let buildCooldown = 0;
const cellArray = [];
const tempArray = [];
const gridContainer = document.querySelector(".grid-container");
gridContainer.style.gridTemplateColumns = "repeat(" + config.cols + ", 10px)";
const clearButton = document.getElementById("clearstop");
const gravityButton = document.getElementById("gravity");
const genText = document.querySelector(".generations");
const speedText = document.querySelector(".speed");
speedText.textContent = "SPEED: " + config.visualSimSpeed + " /  10";
const aliveCountText = document.querySelector(".alive-count");
const trapperCountText = document.querySelector(".trapper-count");
let simRunning = false;
let gravityRunning = false;
let waterMoveLeft = false;
let waterMoveRight = true;


// UI control

// Dynamically create the grid with cells that store their state, row, and col
function createCells() {
  for (let row = 0; row < config.rows; row++) {
    cellArray[row] = []
    tempArray[row] = []
    for (let col = 0; col < config.cols; col++) {
      let cell = document.createElement("div");
      cell.dataset.row = row;
      cell.dataset.col = col;
      setDead(cell);
      cell.classList.add("cell", "alive");
      cell.addEventListener("click", toggleCellState);
      
      const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]  // Possible cell neighbors
      let neighborList = [];
      neighbors.forEach(neighbor => {
        neighborList.push([[row + neighbor[0]], [col + neighbor[1]]]);
      })
      cell.dataset.neighbors = JSON.stringify(neighborList);
      gridContainer.appendChild(cell);
      cellArray[row][col] = cell; // Create array representation to store the grid's cells
      tempArray[row][col] = Number(cell.dataset.state); // Second array created to store the states of cells for updating

    }
  }
}

function setColor(newColor) {
  let currentColor = document.querySelector(".current-color");
  currentColor.style.background = newColor;
  colors.currentColorHex = newColor;
}

function toggleCellState(event) {
  const currentCell = event.target;

  let isAlive = currentCell.dataset.state == 1;
  let isTrapper = currentCell.dataset.state == 2;
  let isVoyager = currentCell.dataset.state == 3;
  let isBuilder = currentCell.dataset.state == 4;
  let currentRow = currentCell.dataset.row;
  let currentCol = currentCell.dataset.col;

  // Toggle alive cell
  if(colors.currentColorHex == colors.alive){
    if(isAlive){
      setDead(currentCell);
      tempArray[currentRow][currentCol] = 0;
      
    }
    else{
      setAlive(currentCell);
      aliveCount++;
      updateAliveText(aliveCount);
    }
  }

  // Toggle trapper cell
  else if(colors.currentColorHex == colors.trapper){
    if(isTrapper){
      setDead(currentCell);
      tempArray[currentRow][currentCol] = 0;
    }
    else{
      setTrapper(currentCell);
      trapperCount++;
      updateTrapperText(trapperCount);
    }
  }

  // Toggle voyager cell
  else if(colors.currentColorHex == colors.voyager){
    if(isVoyager){
      setDead(currentCell);
      tempArray[currentRow][currentCol] = 0;
    }
    else{
      setVoyager(currentCell);
      aliveCount++;
      updateAliveText(aliveCount);
    }
  }

  // Toggle builder cell
  else if(colors.currentColorHex == colors.builder){
    if(isBuilder){
      setDead(currentCell);
      tempArray[currentRow][currentCol] = 0; 
    }
    else{
      setBuilder(currentCell);
      currentCell.dataset.cooldown = 1;
    }
  }
}

function clearBoard() {
  const cells = document.querySelectorAll(".cell");

  cells.forEach((cell) => {
    setDead(cell);
  });

  for(let i = 0; i < config.rows; i++){
    for(let j = 0; j < config.cols; j++){
      tempArray[i][j] = 0;
    }
  }

  // Reset stats
  aliveCount = 0;
  trapperCount = 0;
  buildCooldown = 0;
  genCount = 0;
  updateGenText(0);
  updateAliveText(0);
  updateTrapperText(0);
}

function randomBoard(max){
  clearBoard();
  for(let row = 0; row < config.rows; row++){
    for(let col = 0; col < config.cols; col++){
      let randomNum = Math.floor(Math.random() * max);
      if(randomNum <= 20){
        tempArray[row][col] = 1;
      }
      else if(randomNum <= 21){
        tempArray[row][col] = 2;
      }
      else if(randomNum <= 22){
        tempArray[row][col] = 3;
      }
    }
  }
  update();
}

function updateTrapperText(trappers){
  trapperCountText.textContent = "TRAPPERS: " + trappers;
}
function updateAliveText(alive){
  aliveCountText.textContent = "ALIVE: " + alive;
}
function updateSpeedText(){
  speedText.textContent = "SPEED: " + config.visualSimSpeed + " /  10";
}
function updateGenText(gen){
  genText.textContent = "GEN: " + gen;
}

// Speed controls
function faster(){
  if((config.visualSimSpeed < 10)){
    config.visualSimSpeed += 1; 
    config.actualSimSpeed -= 100;
    updateSpeedText();
  }
}
function slower(){
  if((config.visualSimSpeed > 1)){
    config.visualSimSpeed -= 1;
    config.actualSimSpeed += 100;
    updateSpeedText();
  }
}

// Simulation logic
function checkNeighbors(cell){
  let neighborCount = [0, 0];  // Count for alive and trapper neighbors

  let neighborList = JSON.parse(cell.dataset.neighbors);  // Extract neighbors list from dataset

  neighborList.forEach((neighbor, index) => {
    let neighborRow = neighbor[0];
    let neighborCol = neighbor [1];

    if(neighborRow < 0 || neighborRow >= config.rows || neighborCol < 0 || neighborCol >= config.cols){  // Skip if cell is out of bounds
      return;
    }
    let cellNeighbor = cellArray[neighborRow][neighborCol];
    if(cellNeighbor.dataset.state == 1 || cellNeighbor.dataset.state == 3 || cellNeighbor.dataset.state == 4){  // If cell neighbor is alive, increment alive neighbor count
      neighborCount[0]++;
    }
    else if(cellNeighbor.dataset.state == 2 && index < 4){  // If an adjecent cell neighbor is a trapper, increment trapper neighbor count
      neighborCount[1]++;
      return;
    }
  })

  return neighborCount;
}

async function runGravity(){
  if(simRunning){
    stopSim();
  }
  gravityRunning = true;
  document.getElementById("next").disabled = true;
  gravityButton.disabled = true;
  clearButton.textContent = "STOP";
  clearButton.onclick = stopGravity;
  while(gravityRunning){
    for(let row = config.rows - 2; row >= 0; row--){
      for(let col = 0; col < config.cols; col++){
        
        let gridCell = cellArray[row][col];
        let gridCellState = gridCell.dataset.state;

        if(gridCellState == 0){
          continue;
        }

        // Sand
        if(gridCellState == 1){
          
          // Move Down
          if(tempArray[row + 1][col] == 0 || tempArray[row + 1][col] == 2){
            if(tempArray[row + 1][col] == 0){
              tempArray[row][col] = 0;
            }
            else if(tempArray[row + 1][col] == 2){
              tempArray[row][col] = 2;
            }
            tempArray[row + 1][col] = gridCellState;
          }
          // Move right diagonal
          else if(col + 1 < config.cols && (cellArray[row + 1][col + 1].dataset.state == 0 || cellArray[row + 1][col + 1].dataset.state == 2)){
            if(cellArray[row + 1][col + 1].dataset.state == 0){
              tempArray[row][col] = 0;
            }
            else if(cellArray[row + 1][col + 1].dataset.state == 2){
              tempArray[row][col] = 2;
            }
            tempArray[row + 1][col + 1] = gridCellState;
          }
          // Move left diagonal
          else if(col - 1 > 0 && (cellArray[row + 1][col - 1].dataset.state == 0 || cellArray[row + 1][col - 1].dataset.state == 2)){
            if(col - 1 >= config.cols || config.cols < 0){
              continue;
            }
            else if(cellArray[row + 1][col - 1].dataset.state == 0){
              tempArray[row][col] = 0;
            }
            else if(cellArray[row + 1][col - 1].dataset.state == 2){
              tempArray[row][col] = 2;
            }
            tempArray[row + 1][col - 1] = gridCellState;
            
          }

          else{
            tempArray[row][col] = gridCellState;
          }
        }

        // Water
        else if (gridCellState == 2){
          // Move down
          if(tempArray[row + 1][col] == 0){
            tempArray[row + 1][col] = gridCellState;
            tempArray[row][col] = 0;
          }
          // Move left
          else if(waterMoveLeft){
            if(tempArray[row][col + 1] == 0){
              tempArray[row][col + 1] = gridCellState;
              tempArray[row][col] = 0;
            }
            else{
              waterMoveLeft = false;
              waterMoveRight = true;
            }
          }
          else if(waterMoveLeft){
            waterMoveLeft = false;
            waterMoveRight = true;
          }
          // Move right
          else if(waterMoveRight){
            if(tempArray[row][col - 1] == 0){
              tempArray[row][col - 1] = gridCellState;
              tempArray[row][col] = 0;
            }
            else{
              waterMoveRight = false;
              waterMoveLeft = true;
            }
          }
          else if(waterMoveRight){
            waterMoveRight = false;
            waterMoveLeft = true;
          }
          else{
            tempArray[row][col] = gridCellState;
          }
        }
        else if(gridCellState == 3){
          tempArray[row][col] = gridCellState;
        }
      }
    }
    update();
    await new Promise(resolve => setTimeout(resolve, config.actualSimSpeed));
  }
}


function stopGravity(){
  document.getElementById("next").disabled = false;
  document.getElementById("start").disabled = false;
  gravityButton.disabled = false;
  gravityRunning = false;
  clearButton.textContent = "CLEAR";
  clearButton.onclick = clearBoard;
}

async function runSim(continuous){
  if(gravityRunning){
    stopGravity();
  }
  // Only change UI if "start" is pressed and not "next" (which only runs one iteration)
  if(continuous == true){
    // Make "clear" button into "stop" button
    document.getElementById("next").disabled = true;
    document.getElementById("start").disabled = true;
    clearButton.textContent = "STOP";
    clearButton.onclick = stopSim;
  }

  simRunning = true;
  while(simRunning){
    for(let row = 0; row < config.rows; row++){
      for(let col = 0; col < config.cols; col++){
        let gridCell = cellArray[row][col];
        let gridCellState = gridCell.dataset.state;

        let neighbors = checkNeighbors(gridCell);  // Returns an array [alive neighbors, trapper neighbors]
        let aliveNeighbors = neighbors[0];
        let trapperNeighbors = neighbors[1];

        // If the cell is a builder, build if the cooldown is done. Then, add the state and the cooldown value to the temp array.
        if(gridCellState == 4){
          if(aliveNeighbors == 3){
            tempArray[row][col] = 1;
            continue;
          }
          if(gridCell.dataset.cooldown <= 0){
            Build(row, col, cooldown=false);
            gridCell.dataset.cooldown = config.defaultBuildCooldown; 
          }
          tempArray[row][col] = [4, gridCell.dataset.cooldown];
          continue;
        }

        if(gridCellState == 1 || gridCellState == 3){  // If the cell is alive

          // If there is a trapper neighbor, change corresponding tempArray position into a trapper.
          if(trapperNeighbors > 0){
            tempArray[row][col] = 2;
            continue;
          }

          // If the cell is a voyager, move the cell over in a certain direction and continue to the next cell
          if(gridCellState == 3){
            tempArray[row][col] = 0;
            tempArray[row][col + 1] = 3;
            continue;
          }

          // Change cell state depending on its alive neighbors
          if(aliveNeighbors > 1 && aliveNeighbors < 4){
            tempArray[row][col] = 1;
          }
          else{
            tempArray[row][col] = 0;
          }
        }

        else if(gridCellState == 0){  // If the cell is dead
          if(aliveNeighbors == 3){
            tempArray[row][col] = 1;
          }
        }
        else if(gridCellState == 2){
          tempArray[row][col] = 2;
        }
      }
    }
    update();
    genCount++;
    updateGenText(genCount);
    // Return after one iteration for the "next" button
    if(!continuous){
      return;
    }
    await new Promise(resolve => setTimeout(resolve, config.actualSimSpeed));
  }
}

function stopSim(){
  document.getElementById("next").disabled = false;
  document.getElementById("start").disabled = false;
  simRunning = false;
  clearButton.textContent = "CLEAR";
  clearButton.onclick = clearBoard;
}

// Update the grid with the new values in tempArray and update the menu
function update(){
  aliveCount = 0;
  trapperCount = 0;
  for(let row = 0; row < config.rows; row++){
    for(let col = 0; col < config.cols; col++){
      currentCell = tempArray[row][col];
      if(currentCell == 0){
        setDead(cellArray[row][col]);
      }
      else if(currentCell == 1){
        setAlive(cellArray[row][col]);
        aliveCount++;
      }
      else if(tempArray[row][col] == 2){
        setTrapper(cellArray[row][col]);
        trapperCount++
      }
      else if(tempArray[row][col] == 3){
        setVoyager(cellArray[row][col]);
        aliveCount++;
      }
      else if(Array.isArray(currentCell) || tempArray[row][col] == 4){
        setBuilder(cellArray[row][col]);
        if(Array.isArray(currentCell)){
          cellArray[row][col].dataset.cooldown = --currentCell[1];
        }
        
      }
    }
  }
  updateAliveText(aliveCount);
  updateTrapperText(trapperCount);
}

function Build(row, col, cooldown){
  if(!cooldown){
    config.defaultBuildCooldown = 100000;
  }
  // Glider
  //tempArray[row - 1][col + 2] = 1;
  //tempArray[row - 1][col + 3] = 1;
  //tempArray[row - 1][col + 4] = 1;
  //tempArray[row - 2][col + 4] = 1;
  //tempArray[row - 3][col + 3] = 1;

  // Brush
  //tempArray[row + 1][col + 2] = 3;
  //tempArray[row + 2][col + 4] = 1;
  //tempArray[row + 2][col + 5] = 1;
  //tempArray[row + 3][col + 4] = 1;
  //tempArray[row + 3][col + 5] = 1;
  //tempArray[row + 2][col + 4] = 1;
  //tempArray[row + 3][col + 7] = 2;

  // Rocket
  //tempArray[row + 1][col + 4] = 3;
  //tempArray[row + 2][col + 6] = 1;
  //tempArray[row + 2][col + 7] = 1;
  //tempArray[row + 3][col + 6] = 1;
  //tempArray[row + 3][col + 7] = 1;
  //tempArray[row + 2][col + 6] = 1;
  //tempArray[row + 4][col + 6] = 1;
  //tempArray[row + 4][col + 7] = 1;

  // Mini Rocket
  tempArray[row][col + 4] = 1;
  tempArray[row + 1][col+ 4] = 1;
  tempArray[row - 1][col + 5] = 3;
  tempArray[row][col + 6] = 3;

  // R-Pentomino
  //tempArray[row - 2][col + 27] = 1;
  //tempArray[row - 2][col + 26] = 1;
  //tempArray[row - 1][col + 27] = 1;
  //tempArray[row - 3][col + 27] = 1;
  //tempArray[row - 3][col + 28] = 1;

  // Star Slug
  //tempArray[row - 3][col + 13] = 3;
  //tempArray[row - 2][col + 13] = 1;
  //tempArray[row - 1][col + 14] = 3;
}

function setDead(cell){
  cell.dataset.state = 0;
  cell.classList.remove("alive", "trapper", "voyager", "builder");
  cell.classList.add("dead");
}
function setAlive(cell){
  cell.dataset.state = 1;
  cell.classList.remove("dead", "trapper", "voyager", "builder");
  cell.classList.add("alive");
}
function setTrapper(cell){
  cell.dataset.state = 2;
  cell.classList.remove("alive", "dead", "voyager", "builder");
  cell.classList.add("trapper");
}
function setVoyager(cell){
  cell.dataset.state = 3;
  cell.classList.remove("alive", "trapper", "dead", "builder");
  cell.classList.add("voyager");
}
function setBuilder(cell){
  cell.dataset.state = 4;
  cell.classList.remove("alive", "trapper", "voyager", "dead");
  cell.classList.add("builder");
}

// Misc functions
function printArray(array) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      console.log(array[i][j].dataset.state);
    }
    console.log('\n');
  }
}

createCells();
