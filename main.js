import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

// --- Constants ---
const CUBE_COLORS = {
    U: '#ffffff', D: '#ffcf00', F: '#009e60', B: '#0051ba',
    R: '#c41e3a', L: '#ff5800', X: '#333333'
};
const CUBIE_SIZE = 0.49;
const CUBE_GAP = 0.08;
const PI = Math.PI;

// --- Main 3D Cube Globals ---
let scene, camera, renderer, orbitControls, effect;
let isAnimating = false, moves3DCount = 0, moveHistory = [];
let moves2DCount = 0, moves2DCountEl;

// --- Layer Display Globals ---
const layerScenes = { top: null, mid: null, bot: null, bay: null };
const layerCameras = { top: null, mid: null, bot: null, bay: null };
const layerRenderers = { top: null, mid: null, bot: null, bay: null };
const layerControls = { top: null, mid: null, bot: null, bay: null };
const layerEffects = { top: null, mid: null, bot: null, bay: null };
let initialSpins = { main: true, top: true, mid: true, bot: true, bay: false };

// --- Interaction Globals ---
let draggedCubie = null;
let selectedMatrices = ['top', 'mid'];

// --- Rubik's Cube Data ---
const SOLVED_CUBE_STATE = [
    { id: 'ULB', colors: { U: 'U', L: 'L', B: 'B' }, position: { x: -1, y: 1, z: -1 } }, { id: 'UB', colors: { U: 'U', B: 'B' }, position: { x: 0, y: 1, z: -1 } }, { id: 'URB', colors: { U: 'U', R: 'R', B: 'B' }, position: { x: 1, y: 1, z: -1 } },
    { id: 'UL', colors: { U: 'U', L: 'L' }, position: { x: -1, y: 1, z: 0 } }, { id: 'U', colors: { U: 'U' }, position: { x: 0, y: 1, z: 0 } }, { id: 'UR', colors: { U: 'U', R: 'R' }, position: { x: 1, y: 1, z: 0 } },
    { id: 'ULF', colors: { U: 'U', L: 'L', F: 'F' }, position: { x: -1, y: 1, z: 1 } }, { id: 'UF', colors: { U: 'U', F: 'F' }, position: { x: 0, y: 1, z: 1 } }, { id: 'URF', colors: { U: 'U', R: 'R', F: 'F' }, position: { x: 1, y: 1, z: 1 } },
    { id: 'LB', colors: { L: 'L', B: 'B' }, position: { x: -1, y: 0, z: -1 } }, { id: 'B', colors: { B: 'B' }, position: { x: 0, y: 0, z: -1 } }, { id: 'RB', colors: { R: 'R', B: 'B' }, position: { x: 1, y: 0, z: -1 } },
    { id: 'L', colors: { L: 'L' }, position: { x: -1, y: 0, z: 0 } }, { id: 'C', colors: {}, position: { x: 0, y: 0, z: 0 } }, { id: 'R', colors: { R: 'R' }, position: { x: 1, y: 0, z: 0 } },
    { id: 'LF', colors: { L: 'L', F: 'F' }, position: { x: -1, y: 0, z: 1 } }, { id: 'F', colors: { F: 'F' }, position: { x: 0, y: 0, z: 1 } }, { id: 'RF', colors: { R: 'R', F: 'F' }, position: { x: 1, y: 0, z: 1 } },
    { id: 'DLB', colors: { D: 'D', L: 'L', B: 'B' }, position: { x: -1, y: -1, z: -1 } }, { id: 'DB', colors: { D: 'D', B: 'B' }, position: { x: 0, y: -1, z: -1 } }, { id: 'DRB', colors: { D: 'D', R: 'R', B: 'B' }, position: { x: 1, y: -1, z: -1 } },
    { id: 'DL', colors: { D: 'D', L: 'L' }, position: { x: -1, y: -1, z: 0 } }, { id: 'D', colors: { D: 'D' }, position: { x: 0, y: -1, z: 0 } }, { id: 'DR', colors: { D: 'D', R: 'R' }, position: { x: 1, y: -1, z: 0 } },
    { id: 'DLF', colors: { D: 'D', L: 'L', F: 'F' }, position: { x: -1, y: -1, z: 1 } }, { id: 'DF', colors: { D: 'D', F: 'F' }, position: { x: 0, y: -1, z: 1 } }, { id: 'DRF', colors: { D: 'D', R: 'R', F: 'F' }, position: { x: 1, y: -1, z: 1 } }
];
let cubeState = [];
let bayState = [];

// --- DOM Elements ---
let threeContainer, btnReset3D, btnSolve3D, moves3DCountEl, matrixSelectionCheckboxes;

// --- Core Functions ---
function init() {
    showPopups();
}

function startApp() {
    console.log("init called");
    // --- DOM Elements Initializations ---
    threeContainer = document.getElementById('three-container');
    btnReset3D = document.getElementById('reset-3d');
    btnSolve3D = document.getElementById('solve-3d');
    moves3DCountEl = document.getElementById('moves-3d');
    moves2DCountEl = document.getElementById('moves-2d');
    matrixSelectionCheckboxes = document.querySelectorAll('input[name="matrix-select"]');

    initThreeJS();
    initLayerCanvases();
    initInteraction();
    resetCubeState();
    animate();
    window.addEventListener('resize', onWindowResize);
    btnSolve3D.addEventListener('click', solve3DCube);
    document.getElementById('solve-2d-btn').addEventListener('click', solve2DPuzzle);
}

function showPopups() {
    const overlay = document.getElementById('welcome-popup-overlay');
    const titleEl = document.getElementById('popup-title');
    const contentEl = document.getElementById('popup-content');
    const dismissBtn = document.getElementById('popup-dismiss-btn');
    const nextBtn = document.getElementById('popup-next-btn');
    let popupIndex = 0;

    function updatePopup() {
        titleEl.innerText = popups[popupIndex].title;
        contentEl.innerText = popups[popupIndex].content;
        if (popupIndex === popups.length - 1) {
            nextBtn.innerText = 'Start';
        } else {
            nextBtn.innerText = 'Next';
        }
    }

    function closePopup() {
        overlay.style.display = 'none';
        startApp();
    }

    dismissBtn.addEventListener('click', closePopup);
    nextBtn.addEventListener('click', () => {
        if (popupIndex < popups.length - 1) {
            popupIndex++;
            updatePopup();
        } else {
            closePopup();
        }
    });

    updatePopup();
    overlay.style.display = 'flex';
}

function onWindowResize() {
    // Main 3D canvas
    const threeRect = threeContainer.getBoundingClientRect();
    if (camera && renderer && effect) {
        camera.aspect = threeRect.width / threeRect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(threeRect.width, threeRect.height);
        effect.setSize(threeRect.width, threeRect.height);
    }

    // 2D layer canvases
    for (const key in layerRenderers) {
        if (layerRenderers[key] && layerCameras[key] && layerEffects[key]) {
            const container = layerRenderers[key].domElement.parentElement;
            if (container) {
                const layerRect = container.getBoundingClientRect();
                layerCameras[key].aspect = layerRect.width / layerRect.height;
                layerCameras[key].updateProjectionMatrix();
                layerRenderers[key].setSize(layerRect.width, layerRect.height);
                layerEffects[key].setSize(layerRect.width, layerRect.height);
            }
        }
    }
}

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
    camera = new THREE.PerspectiveCamera(70, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 100);
    camera.position.set(2, 2.5, 4.5);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    threeContainer.appendChild(renderer.domElement);
    console.log("Three.js canvas added to container");
    
    effect = new OutlineEffect(renderer);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    threeContainer.addEventListener('mousedown', () => { initialSpins.main = false; }, { once: true });
}

function createCubieMesh(cubieData) {
    const materials = Array.from({ length: 6 }, () => new THREE.MeshStandardMaterial({ color: CUBE_COLORS.X, roughness: 0.6, metalness: 0.1 }));
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const cubieMesh = new THREE.Mesh(geometry, materials);
    const faceMap = { R: 0, L: 1, U: 2, D: 3, F: 4, B: 5 };
    for (const faceKey in cubieData.colors) {
        const materialIndex = faceMap[faceKey];
        if (materialIndex !== undefined) {
            cubieMesh.material[materialIndex].color.set(CUBE_COLORS[cubieData.colors[faceKey]]);
        }
    }
    cubieMesh.userData = { ...cubieData };
    return cubieMesh;
}

function create3DCubeVisual() {
    scene.children.filter(c => c.isMesh).forEach(c => scene.remove(c));
    cubeState.forEach(cubieData => {
        if (cubieData.id !== 'C') {
            const cubieMesh = createCubieMesh(cubieData);
            cubieMesh.position.set(
                cubieData.position.x * (CUBIE_SIZE + CUBE_GAP),
                cubieData.position.y * (CUBIE_SIZE + CUBE_GAP),
                cubieData.position.z * (CUBIE_SIZE + CUBE_GAP)
            );
            if (cubieData.quaternion) {
                cubieMesh.quaternion.copy(cubieData.quaternion);
            }
            scene.add(cubieMesh);
        }
    });
}

function resetCubeState() {
    cubeState = JSON.parse(JSON.stringify(SOLVED_CUBE_STATE));
    bayState = [];
    create3DCubeVisual();
    updateLayerDisplays();
    moves3DCount = 0;
    moveHistory = [];
    moves3DCountEl.innerText = 'Moves: 0';
    moves2DCount = 0;
    moves2DCountEl.innerText = 'Moves: 0';
    initialSpins = { main: true, top: true, mid: true, bot: true, bay: false };
}

// --- Layer Display Functions ---
function initLayerCanvases() {
    const layerConfigs = {
        top: { y: 1, bg: 0x3a3a3a },
        mid: { y: 0, bg: 0x3a3a3a },
        bot: { y: -1, bg: 0x3a3a3a },
        bay: { y: null, bg: 0x1e1e1e }
    };

    for (const key in layerConfigs) {
        const container = document.getElementById(key === 'bay' ? 'holding-bay-container' : `${key}-layer-container`);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(layerConfigs[key].bg);
        layerScenes[key] = scene;

        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 3, 0); // Start directly above
        camera.lookAt(0, 0, 0);
        layerCameras[key] = camera;
        
        // Initial tilt
        scene.rotation.x = -PI / 4; // 45-degree tilt

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);
        layerRenderers[key] = renderer;

        layerEffects[key] = new OutlineEffect(renderer);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enableZoom = false;
        layerControls[key] = controls;

        container.addEventListener('mousedown', () => { initialSpins[key] = false; }, { once: true });
    }
}

function updateLayerDisplays() {
    const layerCubies = {
        top: cubeState.filter(c => c.position.y === 1),
        mid: cubeState.filter(c => c.position.y === 0 && c.id !== 'C'),
        bot: cubeState.filter(c => c.position.y === -1),
        bay: bayState
    };

    for (const key in layerScenes) {
        const scene = layerScenes[key];
        scene.children.filter(c => c.isMesh).forEach(c => scene.remove(c));

        layerCubies[key].forEach((cubieData, i) => {
            const cubieMesh = createCubieMesh(cubieData);
            if (key === 'bay') {
                // Arrange in a line in the bay
                cubieMesh.position.set((i - (layerCubies.bay.length - 1) / 2) * (CUBIE_SIZE + CUBE_GAP), 0, 0);
            } else {
                cubieMesh.position.set(cubieData.position.x * (CUBIE_SIZE + CUBE_GAP), 0, cubieData.position.z * (CUBIE_SIZE + CUBE_GAP));
            }
            scene.add(cubieMesh);
        });
    }
}

// --- Interaction Functions ---
function initInteraction() {
    matrixSelectionCheckboxes.forEach(cb => cb.addEventListener('change', handleMatrixSelection));
    for (const key in layerRenderers) {
        const container = layerRenderers[key].domElement;
        container.addEventListener('dragstart', (e) => handleDragStart(e, key));
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', (e) => handleDrop(e, key));
    }
    btnReset3D.addEventListener('click', resetCubeState);
    document.addEventListener('keydown', onKeyDown);
}

function handleMatrixSelection() {
    selectedMatrices = Array.from(matrixSelectionCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
}

function getCubieFromEvent(event, layerKey) {
    const container = layerRenderers[layerKey].domElement;
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, layerCameras[layerKey]);
    const intersects = raycaster.intersectObjects(layerScenes[layerKey].children);

    if (intersects.length > 0) {
        return intersects[0].object;
    }
    return null;
}

function handleDragStart(event, sourceLayerKey) {
    const draggedObject = getCubieFromEvent(event, sourceLayerKey);
    if (draggedObject) {
        const sourceState = sourceLayerKey === 'bay' ? bayState : cubeState;
        const cubieData = sourceState.find(c => c.id === draggedObject.userData.id);
        if (cubieData) {
            draggedCubie = { data: cubieData, sourceLayer: sourceLayerKey };
            event.dataTransfer.effectAllowed = 'move';
        }
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleDrop(event, targetLayerKey) {
    event.preventDefault();
    if (!draggedCubie) return;

    const targetObject = getCubieFromEvent(event, targetLayerKey);

    if (isValidSwap(draggedCubie.sourceLayer, targetLayerKey)) {
        if (targetObject) { // Dropped on another cubie
            const targetCubieData = (targetLayerKey === 'bay' ? bayState : cubeState).find(c => c.id === targetObject.userData.id);
            if (targetCubieData && draggedCubie.data.id !== targetCubieData.id) {
                swapCubies(draggedCubie.data, targetCubieData);
            }
        } else { // Dropped on an empty area of the bay
            if (targetLayerKey === 'bay' && draggedCubie.sourceLayer !== 'bay') {
                moveCubieToBay(draggedCubie.data);
            } else if (draggedCubie.sourceLayer === 'bay' && targetLayerKey !== 'bay') {
                // This part is tricky: requires calculating grid position to move *to*.
                // For now, we only support moving *from* bay by dropping on an existing cubie.
            }
        }
    }

    draggedCubie = null;
    updateLayerDisplays();
    create3DCubeVisual();
}

function isValidSwap(sourceLayer, targetLayer) {
    if (sourceLayer === targetLayer) return true; // Swapping within the same layer
    if (sourceLayer === 'bay' && selectedMatrices.includes(targetLayer)) return true; // Bay to active layer
    if (targetLayer === 'bay' && selectedMatrices.includes(sourceLayer)) return true; // Active layer to bay
    if (selectedMatrices.includes(sourceLayer) && selectedMatrices.includes(targetLayer)) return true; // Between two active layers
    return false;
}

function swapCubies(cubie1Data, cubie2Data) {
    const c1InCube = cubeState.find(c => c.id === cubie1Data.id);
    const c2InCube = cubeState.find(c => c.id === cubie2Data.id);
    const c1InBay = bayState.find(c => c.id === cubie1Data.id);
    const c2InBay = bayState.find(c => c.id === cubie2Data.id);

    // Case 1: Both cubies are in the main cube
    if (c1InCube && c2InCube) {
        const tempPos = c1InCube.position;
        c1InCube.position = c2InCube.position;
        c2InCube.position = tempPos;
    }
    // Case 2: One in cube, one in bay
    else if (c1InCube && c2InBay) {
        const bayIndex = bayState.findIndex(c => c.id === c2InBay.id);
        const cubeIndex = cubeState.findIndex(c => c.id === c1InCube.id);
        
        bayState.splice(bayIndex, 1, c1InCube);
        cubeState.splice(cubeIndex, 1, c2InBay);
        
        c2InBay.position = c1InCube.position;
        delete c1InCube.position;
    }
    else if (c2InCube && c1InBay) {
         const bayIndex = bayState.findIndex(c => c.id === c1InBay.id);
        const cubeIndex = cubeState.findIndex(c => c.id === c2InCube.id);
        
        bayState.splice(bayIndex, 1, c2InCube);
        cubeState.splice(cubeIndex, 1, c1InBay);
        
        c1InBay.position = c2InCube.position;
        delete c2InCube.position;
    }
}

function moveCubieToBay(cubieData) {
    const indexInCubeState = cubeState.findIndex(c => c.id === cubieData.id);
    if (indexInCubeState === -1) return; // Already in bay or error

    const [movedCubie] = cubeState.splice(indexInCubeState, 1);
    delete movedCubie.position; // Remove position when in bay
    bayState.push(movedCubie);
}

// --- Animation & Updates ---
function animate() {
    requestAnimationFrame(animate);
    
    // Main cube
    if (initialSpins.main) {
        scene.rotation.y += 0.005;
    }
    orbitControls.update();
    effect.render(scene, camera);

    // Layer displays
    for (const key in layerRenderers) {
        if (initialSpins[key]) {
            layerScenes[key].rotation.y += 0.008;
        }
        layerControls[key].update();
        layerEffects[key].render(layerScenes[key], layerCameras[key]);
    }
}

async function solve3DCube() {
    const sortById = (a, b) => a.id.localeCompare(b.id);
    if (isAnimating || moveHistory.length === 0 || JSON.stringify([...cubeState].sort(sortById)) === JSON.stringify([...SOLVED_CUBE_STATE].sort(sortById))) {
        console.log("Cube is already solved or no moves to reverse.");
        return;
    }
    
    const inverseKey = (key) => {
        if (key === key.toUpperCase()) return key.toLowerCase();
        return key.toUpperCase();
    };

    const reversedHistory = moveHistory.reverse().map(inverseKey);
    moveHistory = []; // Clear history after reversing
    moves3DCount = 0; // Reset counter for solve

    for (const key of reversedHistory) {
        await performMoveByKey(key);
        moves3DCount++;
        moves3DCountEl.innerText = `Moves: ${moves3DCount}`;
    }
}

function performMoveByKey(key) {
     const keyMap = {
        'U': { axis: 'y', v: 1, d: 1 }, 'u': { axis: 'y', v: 1, d: -1 }, 'D': { axis: 'y', v: -1, d: 1 }, 'd': { axis: 'y', v: -1, d: -1 },
        'L': { axis: 'x', v: -1, d: 1 }, 'l': { axis: 'x', v: -1, d: -1 }, 'R': { axis: 'x', v: 1, d: 1 }, 'r': { axis: 'x', v: 1, d: -1 },
        'F': { axis: 'z', v: 1, d: 1 }, 'f': { axis: 'z', v: 1, d: -1 }, 'B': { axis: 'z', v: -1, d: 1 }, 'b': { axis: 'z', v: -1, d: -1 },
        'M': { axis: 'x', v: 0, d: -1 }, 'm': { axis: 'x', v: 0, d: 1 }, 'E': { axis: 'y', v: 0, d: -1 }, 'e': { axis: 'y', v: 0, d: 1 },
        'S': { axis: 'z', v: 0, d: 1 }, 's': { axis: 'z', v: 0, d: -1 },
    };
    if (!keyMap[key]) return Promise.resolve();
    const { axis: axisChar, v, d } = keyMap[key];
    const axis = new THREE.Vector3(axisChar === 'x' ? 1 : 0, axisChar === 'y' ? 1 : 0, axisChar === 'z' ? 1 : 0);
    const cubiesToRotate = scene.children.filter(c => c.isMesh && Math.abs(c.userData.position[axisChar] - v) < 0.1);
    if (cubiesToRotate.length > 0) {
        return performFaceTurn(cubiesToRotate, axis, d);
    }
    return Promise.resolve();
}

// --- Keyboard Controls for Main Cube ---
function onKeyDown(event) {
    if (isAnimating) return;
    const key = event.key;
     const keyMap = {
        'U': 1, 'u': 1, 'D': 1, 'd': 1, 'L': 1, 'l': 1, 'R': 1, 'r': 1,
        'F': 1, 'f': 1, 'B': 1, 'b': 1, 'M': 1, 'm': 1, 'E': 1, 'e': 1, 'S': 1, 's': 1
    };
    if (!keyMap[key]) return;
    
    initialSpins.main = false; // Stop spinning on first move
    moveHistory.push(key);
    performMoveByKey(key);
}

async function performFaceTurn(cubies, axis, direction) {
    isAnimating = true;
    orbitControls.enabled = false;
    const angle = direction * PI / 2;
    const group = new THREE.Group();
    cubies.forEach(cubie => group.add(cubie));
    scene.add(group);
    const duration = 300;
    const start = Date.now();
    
    return new Promise(resolve => {
        function animateRotation() {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            group.rotation.setFromVector3(axis.clone().multiplyScalar(easedProgress * angle));
            
            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
                group.children.slice().forEach(cubie => {
                    cubie.applyMatrix4(rotationMatrix);
                    scene.add(cubie);
                    const newPos = cubie.position.clone().divideScalar(CUBIE_SIZE + CUBE_GAP).round();
                    cubie.userData.position = { x: newPos.x, y: newPos.y, z: newPos.z };
                    const axisChar = axis.x ? 'x' : (axis.y ? 'y' : 'z');
                    cubie.userData.colors = rotateCubieColors(cubie.userData.colors, axisChar, direction);
                });
                scene.remove(group);
                updateCubeStateFrom3DMeshes();
                updateLayerDisplays(); // Sync 2D layers
                isAnimating = false;
                orbitControls.enabled = true;
                resolve();
            }
        }
        animateRotation();
    });
}

function rotateCubieColors(colors, axis, direction) {
    const newColors = {};
    const maps = { y: { F: 'R', R: 'B', B: 'L', L: 'F' }, x: { U: 'F', F: 'D', D: 'B', B: 'U' }, z: { U: 'L', L: 'D', D: 'R', R: 'U' } };
    const inverseMaps = { y: { R: 'F', B: 'R', L: 'B', F: 'L' }, x: { F: 'U', D: 'F', B: 'D', U: 'B' }, z: { L: 'U', D: 'L', R: 'D', U: 'R' } };
    const map = direction === 1 ? maps[axis] : inverseMaps[axis];
    for (const key in colors) newColors[map[key] || key] = colors[key];
    return newColors;
}

function updateCubeStateFrom3DMeshes() {
    const newCubeState = [SOLVED_CUBE_STATE.find(c => c.id === 'C')];
    scene.children.forEach(obj => {
        if (obj.isMesh && obj.userData.id) {
            const cubieData = { ...obj.userData, quaternion: obj.quaternion.clone() };
            newCubeState.push(cubieData);
        }
    });
    cubeState = newCubeState;
}

async function updateAndPause(ms = 300) {
    updateLayerDisplays();
    create3DCubeVisual();
    await new Promise(r => setTimeout(r, ms));
}

function findMeshInfo(cubieId) {
    for (const key in layerScenes) {
        const scene = layerScenes[key];
        const mesh = scene.children.find(c => c.isMesh && c.userData.id === cubieId);
        if (mesh) {
            return { mesh, layerKey: key };
        }
    }
    return null;
}

function animatePositions(mesh, from, to, duration) {
    return new Promise(resolve => {
        const start = Date.now();
        function animate() {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Ease in-out
            mesh.position.lerpVectors(from, to, easedProgress);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                mesh.position.copy(to);
                resolve();
            }
        }
        animate();
    });
}

async function animatedSwap(cubie1Data, cubie2Data) {
    const info1 = findMeshInfo(cubie1Data.id);
    const info2 = cubie2Data ? findMeshInfo(cubie2Data.id) : null;

    const animationDuration = 280;

    // If pieces are in the same 2D layer, do a visual swap animation
    if (info1 && info2 && info1.layerKey === info2.layerKey && info1.layerKey !== 'bay') {
        const mesh1 = info1.mesh;
        const mesh2 = info2.mesh;
        const pos1 = mesh1.position.clone();
        const pos2 = mesh2.position.clone();
        const liftY = CUBIE_SIZE * 1.5;

        // Lift both pieces
        await Promise.all([
            animatePositions(mesh1, pos1, pos1.clone().setY(liftY), animationDuration / 3),
            animatePositions(mesh2, pos2, pos2.clone().setY(liftY), animationDuration / 3)
        ]);
        // Swap their horizontal positions
        await Promise.all([
            animatePositions(mesh1, mesh1.position, mesh1.position.clone().setX(pos2.x).setZ(pos2.z), animationDuration / 3),
            animatePositions(mesh2, mesh2.position, mesh2.position.clone().setX(pos1.x).setZ(pos1.z), animationDuration / 3)
        ]);
        // Lower them into their new places
        await Promise.all([
            animatePositions(mesh1, mesh1.position, pos2, animationDuration / 3),
            animatePositions(mesh2, mesh2.position, pos1, animationDuration / 3)
        ]);
    } else {
        // Otherwise, just fade them out
        if (info1) info1.mesh.visible = false;
        if (info2) info2.mesh.visible = false;
        await new Promise(r => setTimeout(r, animationDuration));
    }

    // Perform the actual data swap
    swapCubies(cubie1Data, cubie2Data);

    // Update displays, which will redraw everything in its new correct spot
    updateLayerDisplays();
    create3DCubeVisual();

    // Fade pieces back in
    const newInfo1 = findMeshInfo(cubie1Data.id);
    const newInfo2 = cubie2Data ? findMeshInfo(cubie2Data.id) : null;
    if (newInfo1) newInfo1.mesh.visible = true;
    if (newInfo2) newInfo2.mesh.visible = true;
}

async function animatedMoveToBay(cubieData) {
    const info = findMeshInfo(cubieData.id);
    if (info) {
        info.mesh.visible = false;
        await new Promise(r => setTimeout(r, 280));
    }
    moveCubieToBay(cubieData);
    updateLayerDisplays();
    create3DCubeVisual();
    const newInfo = findMeshInfo(cubieData.id);
    if (newInfo) newInfo.mesh.visible = true;
}

async function solve2DPuzzle() {
    const sortById = (a, b) => a.id.localeCompare(b.id);
    if (JSON.stringify([...cubeState].sort(sortById)) === JSON.stringify([...SOLVED_CUBE_STATE].sort(sortById))) {
        console.log("Cube is already solved.");
        return;
    }
    if (selectedMatrices.length !== 2) {
        alert("Please select exactly two layers to solve.");
        return;
    }

    console.log("Starting 2-layer puzzle solve...");
    const solveButton = document.getElementById('solve-2d-btn');
    solveButton.disabled = true;
    moves2DCount = 0;
    moves2DCountEl.innerText = 'Moves: 0';

    const layerMap = { top: 1, mid: 0, bot: -1 };
    const activeY = selectedMatrices.map(key => layerMap[key]);
    const inactiveY = [1, 0, -1].find(y => !activeY.includes(y));

    // --- Step 1: Move inactive layer to bay (granular) ---
    const inactivePieces = cubeState.filter(p => p.position && p.position.y === inactiveY);
    for (const piece of inactivePieces) {
        const index = cubeState.findIndex(c => c.id === piece.id);
        const [movedPiece] = cubeState.splice(index, 1);
        delete movedPiece.position;
        bayState.push(movedPiece);
        moves2DCount++;
        moves2DCountEl.innerText = `Moves: ${moves2DCount}`;
        await updateAndPause(100);
    }

    // --- Step 2: Solve the two active layers (granular) ---
    const activeSolvedPieces = SOLVED_CUBE_STATE.filter(p => p.position && activeY.includes(p.position.y));
    for (const solvedPiece of activeSolvedPieces) {
        const pieceInPlace = cubeState.find(p => p.position && p.position.x === solvedPiece.position.x && p.position.y === solvedPiece.position.y && p.position.z === solvedPiece.position.z);
        if (pieceInPlace && pieceInPlace.id !== solvedPiece.id) {
            const correctPiece = cubeState.find(p => p.id === solvedPiece.id);
            if (correctPiece) {
                const tempPos = pieceInPlace.position;
                pieceInPlace.position = correctPiece.position;
                correctPiece.position = tempPos;
                moves2DCount++;
                moves2DCountEl.innerText = `Moves: ${moves2DCount}`;
                await updateAndPause(100);
            }
        }
        const finalPiece = cubeState.find(p => p.id === solvedPiece.id);
        if(finalPiece) {
            finalPiece.colors = solvedPiece.colors;
            finalPiece.quaternion = new THREE.Quaternion();
        }
    }
    await updateAndPause(300);


    // --- Step 3: Solve the pieces in the bay (granular) ---
    const inactiveSolvedPieces = SOLVED_CUBE_STATE.filter(p => p.position && p.position.y === inactiveY);
    const sortedBay = [];
    inactiveSolvedPieces.forEach(solvedPiece => {
        const piece = bayState.find(p => p.id === solvedPiece.id);
        if(piece) {
            piece.colors = solvedPiece.colors;
            piece.quaternion = new THREE.Quaternion();
            sortedBay.push(piece);
        }
    });
    bayState = sortedBay;
    moves2DCount += bayState.length;
    moves2DCountEl.innerText = `Moves: ${moves2DCount}`;
    await updateAndPause(300);


    // --- Step 4: Move pieces from bay back to inactive layer (granular) ---
    for (const solvedPiece of inactiveSolvedPieces) {
        const pieceIndex = bayState.findIndex(p => p.id === solvedPiece.id);
        if(pieceIndex !== -1) {
            const [piece] = bayState.splice(pieceIndex, 1);
            piece.position = solvedPiece.position;
            cubeState.push(piece);
            moves2DCount++;
            moves2DCountEl.innerText = `Moves: ${moves2DCount}`;
            await updateAndPause(100);
        }
    }
    bayState = [];
    
    // Final verification and state update
    cubeState = JSON.parse(JSON.stringify(SOLVED_CUBE_STATE));
    moveHistory = [];
    moves3DCount = 0;
    moves3DCountEl.innerText = 'Moves: 0';
    create3DCubeVisual();
    updateLayerDisplays();

    console.log("2D puzzle solve finished.");
    solveButton.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});
