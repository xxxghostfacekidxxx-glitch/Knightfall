document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration Constants ---
    const ASSET_FOLDER = 'auto/';
    const MAX_ASSETS = 9; 
    const BLOCK_SIZE = 20; 
    
    // --- Traffic Lane Settings ---
    const LANE_INNER = 2.5; 
    const LANE_OUTER = 6.5; 
    let trafficSpawnCounter = 0;

    // --- Physics Settings (Planck) ---
    const pl = planck;
    const TIME_STEP = 1 / 60;
    
    let velIter = 6; 
    let posIter = 2; 

    // --- State Variables ---
    let isPaused = false;
    let gameActive = false;
    let loadedTextures = [];
    let currentMapType = 'default';
    let physicsMode = 'new'; // 'old' or 'new'
    
    // --- Split-Screen & Player State ---
    let gameMode = '1p'; 
    let numPlayers = 1;
    let devices = { p1: null, p2: null }; 

    // --- Infinite Highway State ---
    let highwayChunks = [];
    const CHUNK_LENGTH = 400;

    // --- Map & Routing State ---
    let isMapOpen = false;
    let mapView = { x: 0, z: 0, zoom: 2 };
    let mapDrag = { active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, moved: false };
    let destinationKey = null;
    let destinationCoord = null; // Stores the exact clicked spot for instant rendering
    let forcePathRecompute = false;
    let p1Path = [];
    let p2Path = [];

    let gameParams = {
        playerSpeed: 300, // Player Speed Scalar
        enemySpeed: 60,   // AI Normal Speed
        trafficCount: 40, 
        spawnRadius: 200, // Keep cars alive longer when off-screen
        simpleMaterials: false, 
        particlesEnabled: true,
        headlightsEnabled: false,
        shadowMode: 'high', // 'off', 'simple', 'high'
        bulletGlow: false,
        cameraHeight: 60,
        cameraFOV: 50,
        topDownMode: true, 
        cameraRotate: false,
        
        // --- AI Behavior ---
        aiMode: 'cruiser', 
        aiRoute: 'random',

        // --- OLD ARCADE Physics Params ---
        gtaGrip: 0.12,          
        gtaTurnFactor: 8.5,     
        gtaDrag: 0.985,         
        gtaHandbrakeGrip: 0.35 
    };
    
    let p1Score = 0;
    let p2Score = 0;

    // --- DOM Elements ---
    const p1ScoreEl = document.getElementById('p1Score');
    const p2ScoreEl = document.getElementById('p2Score');
    const helpMenu = document.getElementById('helpMenu');
    const customizeMenu = document.getElementById('customizeMenu');
    const optionsMenu = document.getElementById('optionsMenu');
    const mapMenu = document.getElementById('mapMenu');
    const optionsHint = document.getElementById('optionsHint');

    // --- Fixed Resolution Setup ---
    const BASE_WIDTH = 960;
    const BASE_HEIGHT = 720;

    // --- THREE.JS Setup ---
    const container = document.getElementById('canvas-container');
    const renderer = new THREE.WebGLRenderer({ antialias: true }); 
    renderer.setSize(BASE_WIDTH, BASE_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    if (document.getElementById('lowResToggle') && document.getElementById('lowResToggle').checked) {
        renderer.setPixelRatio(0.5);
    } else {
        renderer.setPixelRatio(window.devicePixelRatio);
    }
    
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    scene.fog = new THREE.Fog(0x222222, 100, 300);

    const camera1 = new THREE.PerspectiveCamera(gameParams.cameraFOV, BASE_WIDTH / BASE_HEIGHT, 0.1, 1000);
    camera1.position.set(0, gameParams.cameraHeight, 30); 

    const camera2 = new THREE.PerspectiveCamera(gameParams.cameraFOV, BASE_WIDTH / BASE_HEIGHT, 0.1, 1000);
    camera2.position.set(0, gameParams.cameraHeight, 30); 

    window.addEventListener('resize', () => {
        if(typeof scaleGame === 'function') scaleGame();
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.bias = -0.0005;
    const d = 150;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // --- SHADOW QUALITY SYSTEM ---
    function setShadowMode(mode) {
        gameParams.shadowMode = mode;
        
        // Keep main menu and customize dropdowns in sync
        const mainSel = document.getElementById('mainShadowSelect');
        const custSel = document.getElementById('custShadowSelect');
        if (mainSel && mainSel.value !== mode) mainSel.value = mode;
        if (custSel && custSel.value !== mode) custSel.value = mode;

        if (mode === 'off') {
            dirLight.castShadow = false;
            renderer.shadowMap.enabled = false;
            if (dirLight.shadow.map) renderer.clearTarget(dirLight.shadow.map);
        } else if (mode === 'simple') {
            dirLight.castShadow = true;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.BasicShadowMap; // Pixelated, faster
            
            if (dirLight.shadow.map) {
                dirLight.shadow.map.dispose();
                dirLight.shadow.map = null;
            }
            dirLight.shadow.mapSize.width = 512;
            dirLight.shadow.mapSize.height = 512;
            dirLight.shadow.bias = -0.001;
            renderer.shadowMap.needsUpdate = true;
        } else if (mode === 'high') {
            dirLight.castShadow = true;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft, smooth
            
            if (dirLight.shadow.map) {
                dirLight.shadow.map.dispose();
                dirLight.shadow.map = null;
            }
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.bias = -0.0005;
            renderer.shadowMap.needsUpdate = true;
        }
    }

    // --- PLANCK.JS Setup ---
    const world = pl.World(pl.Vec2(0, 0)); 

    // --- Game Entities ---
    let entities = []; 
    let trafficPool = [];
    let player1, player2;
    let mapGrid = [];
    let roadTiles = []; 
    let roadLookup = {}; 
    let skidMarks = []; 
    let skidTexture = null;

    // --- UI Canvas Setup ---
    const uiCanvas = document.getElementById('uiCanvas');
    uiCanvas.width = BASE_WIDTH;
    uiCanvas.height = BASE_HEIGHT;
    const uiCtx = uiCanvas.getContext('2d');

    // --- PATHFINDING & INTERSECTION GLOBALS ---
    let intersectionLocks = {};

    function getNeighbors(nodeKey) {
        const [x, z] = nodeKey.split(',').map(Number);
        const dirs = [[0, -BLOCK_SIZE], [BLOCK_SIZE, 0], [0, BLOCK_SIZE], [-BLOCK_SIZE, 0]];
        return dirs.map(d => `${x + d[0]},${z + d[1]}`).filter(k => roadLookup[k]);
    }

    function heuristic(aKey, bKey) {
        const [ax, az] = aKey.split(',').map(Number);
        const [bx, bz] = bKey.split(',').map(Number);
        return Math.abs(ax - bx) + Math.abs(az - bz);
    }

    function aStar(startKey, goalKey) {
        const openSet = [startKey];
        const cameFrom = {};
        const gScore = { [startKey]: 0 };
        const fScore = { [startKey]: heuristic(startKey, goalKey) };
        let iter = 0;
        const MAX_ITER = 1500;

        while (openSet.length > 0 && iter++ < MAX_ITER) {
            openSet.sort((a, b) => fScore[a] - fScore[b]);
            const current = openSet.shift();

            if (current === goalKey) {
                const path = [current];
                let curr = current;
                while (cameFrom[curr]) {
                    curr = cameFrom[curr];
                    path.unshift(curr);
                }
                return path;
            }

            for (const neighbor of getNeighbors(current)) {
                const t_gScore = gScore[current] + BLOCK_SIZE;
                if (gScore[neighbor] === undefined || t_gScore < gScore[neighbor]) {
                    cameFrom[neighbor] = current;
                    gScore[neighbor] = t_gScore;
                    fScore[neighbor] = t_gScore + heuristic(neighbor, goalKey);
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return []; 
    }
    
    function updatePlayerPaths() {
        if (!destinationKey) return;
        
        [player1, player2].forEach((p, index) => {
            if (!p) return;
            const pos = p.body.getPosition();
            const tileX = Math.round(pos.x / BLOCK_SIZE) * BLOCK_SIZE;
            const tileZ = Math.round(pos.y / BLOCK_SIZE) * BLOCK_SIZE;
            const currentKey = `${tileX},${tileZ}`;
            
            if (forcePathRecompute || p.lastPathKey !== currentKey) {
                p.lastPathKey = currentKey;
                const path = aStar(currentKey, destinationKey);
                if (index === 0) p1Path = path;
                else p2Path = path;
            }

            if (currentKey === destinationKey) {
                destinationKey = null;
                destinationCoord = null;
                p1Path = [];
                p2Path = [];
            }
        });
        forcePathRecompute = false;
    }

    const CAT_PLAYER = 0x0001;
    const CAT_ENEMY = 0x0002;
    const CAT_BULLET = 0x0004;
    const CAT_WALL = 0x0008;

    // --- Blinking Windows Sub-System ---
    const animatedBuildings = [];

    class AnimatedBuildingTexture {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 128;
            this.canvas.height = 128;
            this.ctx = this.canvas.getContext('2d');
            
            this.cols = 6; 
            this.rows = 4;
            this.windowSizeW = 12;
            this.windowSizeH = 18;
            
            this.windowStates = [];
            for (let r = 0; r < this.rows; r++) {
                const row = [];
                for (let c = 0; c < this.cols; c++) {
                    row.push(Math.random() < 0.5); 
                }
                this.windowStates.push(row);
            }
            
            this.texture = new THREE.CanvasTexture(this.canvas);
            this.texture.wrapS = THREE.RepeatWrapping;
            this.texture.wrapT = THREE.RepeatWrapping;
            this.texture.magFilter = THREE.NearestFilter;
            this.texture.minFilter = THREE.LinearFilter;
            this.texture.encoding = THREE.sRGBEncoding;
            
            this.textureInstances = []; 
            this.draw();
        }

        draw() {
            const ctx = this.ctx;
            ctx.fillStyle = '#999999';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const isLightOn = this.windowStates[r][c];
                    ctx.fillStyle = isLightOn ? '#ffffaa' : '#333333';
                    const windowX = 10 + (c * 20);
                    const windowY = 10 + (r * 32);
                    ctx.fillRect(windowX, windowY, this.windowSizeW, this.windowSizeH);
                }
            }
            
            this.texture.needsUpdate = true;
            this.textureInstances.forEach(t => t.needsUpdate = true);
        }
    }

    class LightManager {
        constructor() {
            this.nextBlinkTime = performance.now() + 500; 
        }

        update() {
            if (animatedBuildings.length === 0) return;
            const currentTime = performance.now();

            if (currentTime >= this.nextBlinkTime) {
                const numWindowsToToggle = Math.floor(Math.random() * 7) + 2; 

                for (let i = 0; i < numWindowsToToggle; i++) {
                    const bldgIndex = Math.floor(Math.random() * animatedBuildings.length);
                    const building = animatedBuildings[bldgIndex];

                    const r = Math.floor(Math.random() * building.rows);
                    const c = Math.floor(Math.random() * building.cols);

                    if (building.windowStates[r] !== undefined && building.windowStates[r][c] !== undefined) {
                        building.windowStates[r][c] = !building.windowStates[r][c];
                        building.draw(); 
                    }
                }

                const delayInMilliseconds = (Math.random() * 0.5 + 0.25) * 1000;
                this.nextBlinkTime = currentTime + delayInMilliseconds;
                
                animatedBuildings.forEach(b => {
                    b.textureInstances = b.textureInstances.filter(t => !t.isDisposed);
                });
            }
        }
    }

    const lightManager = new LightManager();

    // --- Asset Loading & Procedural Textures ---
    const textureLoader = new THREE.TextureLoader();
    
    function createProceduralTexture(type) {
        if (type === 'building') {
            if (animatedBuildings.length === 0) {
                for (let i = 0; i < 15; i++) {
                    animatedBuildings.push(new AnimatedBuildingTexture());
                }
            }
            const bldg = animatedBuildings[Math.floor(Math.random() * animatedBuildings.length)];
            const clonedTex = bldg.texture.clone(); 
            bldg.textureInstances.push(clonedTex);
            return clonedTex;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, 128, 128);

        if (type === 'road') {
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = '#eeeeee'; 
            ctx.fillRect(62, 0, 4, 128); 
            ctx.fillRect(0, 62, 128, 4); 
        } else if (type === 'roof') {
            ctx.fillStyle = '#555555'; 
            ctx.fillRect(0, 0, 128, 128);
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 4;
            ctx.strokeRect(0,0,128,128);
            ctx.fillStyle = '#666666';
            ctx.fillRect(20, 20, 20, 20); 
        } else if (type === 'skid') {
            ctx.clearRect(0,0,128,128);
            ctx.fillStyle = 'rgba(10, 10, 10, 0.6)';
            ctx.fillRect(0,0,128,128);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.LinearFilter;
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    function loadAssets() {
        if(loadedTextures.length > 0) return Promise.resolve();
        skidTexture = createProceduralTexture('skid');

        const promises = [];
        for (let i = 1; i <= MAX_ASSETS; i++) {
            const num = i.toString().padStart(3, '0');
            const path = `${ASSET_FOLDER}${num}.png`;
            const p = new Promise((resolve) => {
                textureLoader.load(path, (tex) => { 
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.encoding = THREE.sRGBEncoding;
                    loadedTextures.push(tex); 
                    resolve(); 
                }, undefined, () => {
                    const c = document.createElement('canvas'); c.width=64; c.height=128;
                    const ctx = c.getContext('2d');
                    ctx.fillStyle = `hsl(${i*40},70%,50%)`; ctx.fillRect(0,0,64,128);
                    ctx.fillStyle='#000'; ctx.fillRect(10,10,44,20);
                    const t = new THREE.CanvasTexture(c);
                    t.magFilter = THREE.NearestFilter;
                    t.encoding = THREE.sRGBEncoding;
                    loadedTextures.push(t);
                    resolve();
                });
            });
            promises.push(p);
        }
        return Promise.all(promises);
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function angleDiff(a, b) {
        let d = a - b;
        while (d <= -Math.PI) d += Math.PI * 2;
        while (d > Math.PI) d -= Math.PI * 2;
        return d;
    }

    class Entity {
        constructor(mesh, body) {
            this.mesh = mesh;
            this.body = body;
            this.markedForDeletion = false;
            if (mesh) scene.add(mesh);
        }
        update() {
            if (!this.body || !this.mesh) return;
            const pos = this.body.getPosition();
            const angle = this.body.getAngle();
            this.mesh.position.set(pos.x, 0.5, pos.y); 
            this.mesh.rotation.y = -angle; 
        }
        destroy() {
            for (let key in intersectionLocks) {
                if (intersectionLocks[key] === this) {
                    intersectionLocks[key] = null;
                }
            }

            if (this.mesh) {
                scene.remove(this.mesh);
                if(this.mesh.geometry) this.mesh.geometry.dispose();
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else if(this.mesh.material) {
                    this.mesh.material.dispose();
                }
            }
            if (this.body) world.destroyBody(this.body);
        }
    }

    class SkidMark {
        constructor(x, y, angle) {
            const geo = new THREE.PlaneGeometry(0.8, 0.8);
            const mat = new THREE.MeshBasicMaterial({ 
                map: skidTexture, 
                transparent: true, 
                opacity: 0.5, 
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -1
            });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.set(x, 0.05, y); 
            this.mesh.rotation.x = -Math.PI / 2;
            this.mesh.rotation.z = angle;
            scene.add(this.mesh);
            this.life = 4.0; 
        }
        update(dt) {
            this.life -= dt;
            if (this.life < 1.0) {
                this.mesh.material.opacity = this.life * 0.5;
            }
            return this.life > 0;
        }
        destroy() {
            scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }

    class Car extends Entity {
        constructor(x, y, isPlayer, playerIndex, texture, plannedAction = 'random', laneOffset = 2.5) {
            const width = 1.8;
            const height = 3.8;
            const geometry = new THREE.PlaneGeometry(width, height);
            
            let material;
            if (gameParams.simpleMaterials) {
                material = new THREE.MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
            } else {
                material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.5, roughness: 0.5, side: THREE.DoubleSide });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.rotation.x = -Math.PI / 2; 
            mesh.frustumCulled = false; 

            const containerMesh = new THREE.Group(); 
            containerMesh.frustumCulled = false; 
            containerMesh.add(mesh);

            if (gameParams.headlightsEnabled) {
                const leftLight = new THREE.SpotLight(0xffffff, 10, 40, 0.6, 0.5, 1);
                leftLight.position.set(-0.6, 0.5, 1.5); 
                const rightLight = new THREE.SpotLight(0xffffff, 10, 40, 0.6, 0.5, 1);
                rightLight.position.set(0.6, 0.5, 1.5);
                const leftTarget = new THREE.Object3D(); leftTarget.position.set(-0.6, 0, 10);
                leftLight.target = leftTarget;
                const rightTarget = new THREE.Object3D(); rightTarget.position.set(0.6, 0, 10);
                rightLight.target = rightTarget;
                containerMesh.add(leftLight); containerMesh.add(leftTarget);
                containerMesh.add(rightLight); containerMesh.add(rightTarget);
            }

            const body = world.createBody({
                type: 'dynamic',
                position: pl.Vec2(x, y),
                linearDamping: 0.0, 
                angularDamping: 2.0 
            });

            body.setSleepingAllowed(false);

            body.createFixture(pl.Box(width / 2, height / 2), {
                density: 5.0, 
                friction: 0.1, 
                restitution: 0.1,
                filterCategoryBits: isPlayer ? CAT_PLAYER : CAT_ENEMY,
                filterMaskBits: CAT_PLAYER | CAT_ENEMY | CAT_WALL | CAT_BULLET
            });

            super(containerMesh, body);
            this.isPlayer = isPlayer;
            this.playerIndex = playerIndex;
            this.shootCooldown = 0;
            this.maxSpeed = isPlayer ? gameParams.playerSpeed : gameParams.enemySpeed;
            this.power = isPlayer ? 900 : 150; 
            
            this.aiTargetAngle = 0;
            this.lastDecisionTile = null;
            this.plannedAction = plannedAction; 
            this.laneOffset = laneOffset; 
            this.stuckTimer = 0; 
            this.path = [];
            this.currentKey = null;

            this.throttleInput = 0;
            this.steerInput = 0;
            this.handbrakeInput = false;
            this.isReversing = false;
            this.autoBraking = false;

            this.speed = 0;
            this.vx = 0;
            this.vy = 0;
            
            this.lastPathKey = null;
        }

        update(dt) {
            super.update();
            if (this.shootCooldown > 0) this.shootCooldown -= dt;
            this.maxSpeed = this.isPlayer ? gameParams.playerSpeed : gameParams.enemySpeed;

            if (physicsMode === 'old') {
                this.updatePhysicsOld(dt);
            } else {
                this.updatePhysicsNew(dt);
            }
        }

        drive(throttle, steer, handbrake) {
            this.throttleInput = throttle;
            this.steerInput = steer;
            this.handbrakeInput = handbrake;
        }

        drivePlayer(accelerate, brake, handbrake, steer) {
            this.steerInput = steer;
            
            let speed = 0;
            if (physicsMode === 'old') {
                speed = Math.abs(this.speed);
            } else {
                const velocity = this.body.getLinearVelocity();
                speed = velocity.length();
            }
            
            const isStopped = speed < 0.3; 

            let targetThrottle = 0;
            let targetHandbrake = handbrake;
            let autoBraking = false;

            if (accelerate) {
                targetThrottle = 1.0;
                this.isReversing = false;
            } else if (brake) {
                if (isStopped || this.isReversing) {
                    targetThrottle = -0.6; 
                    this.isReversing = true;
                } else {
                    targetHandbrake = true; 
                    this.isReversing = false;
                }
            } else {
                this.isReversing = false;
            }

            if (!accelerate && !this.isReversing) {
                autoBraking = true;
            }

            this.throttleInput = targetThrottle;
            this.handbrakeInput = targetHandbrake;
            this.autoBraking = autoBraking;
        }

        updatePhysicsOld(dt) {
            this.speed *= gameParams.gtaDrag;

            if (this.isPlayer && this.autoBraking && Math.abs(this.speed) > 0.1) {
                this.speed *= 0.85; 
            }

            const accel = this.power * 0.002;
            if (this.throttleInput !== 0) {
                const slip = this.handbrakeInput ? 0.3 : 1.0;
                this.speed += this.throttleInput * accel * slip;
            }

            if (Math.abs(this.speed) > 0.1) {
                const speedAbs = Math.abs(this.speed);
                const authority = Math.min(1.0, speedAbs / 15.0);
                const maxVelUnit = this.maxSpeed / 3.6;
                const speedFraction = Math.min(1.0, speedAbs / maxVelUnit);
                const dampening = 1.0 - (speedFraction * 0.5); 
                const handbrakeBonus = this.handbrakeInput ? 2.5 : 1.0;

                const turn = this.steerInput * gameParams.gtaTurnFactor * authority * dampening * 0.006 * handbrakeBonus;
                const dir = this.speed > 0 ? 1 : -1;
                this.body.setAngle(this.body.getAngle() - (turn * dir));
            }

            const angle = this.body.getAngle();
            const fx = -Math.sin(angle); 
            const fy = Math.cos(angle);

            const targetVx = fx * this.speed;
            const targetVy = fy * this.speed;

            let grip = gameParams.gtaGrip;
            if (this.handbrakeInput) {
                grip *= gameParams.gtaHandbrakeGrip; 
                if (Math.abs(this.speed) > 10) this.spawnSkidMarks();
            }

            this.vx += (targetVx - this.vx) * grip;
            this.vy += (targetVy - this.vy) * grip;

            this.body.setLinearVelocity(pl.Vec2(this.vx, this.vy));
            this.body.setAngularVelocity(this.body.getAngularVelocity() * 0.85); 

            const max = this.maxSpeed / 3.6; 
            this.speed = clamp(this.speed, -max * 0.5, max);
        }

        updatePhysicsNew(dt) {
            const body = this.body;
            const velocity = body.getLinearVelocity();
            const speed = velocity.length();

            const angle = body.getAngle();
            const forwardNormal = pl.Vec2(-Math.sin(angle), Math.cos(angle));
            const rightNormal = pl.Vec2(Math.cos(angle), Math.sin(angle));

            const lateralVel = pl.Vec2.dot(rightNormal, velocity);
            const forwardVel = pl.Vec2.dot(forwardNormal, velocity);
            
            let grip = 0.95; 
            if (this.handbrakeInput) grip = 0.05; 
            else if (speed > 20 && Math.abs(lateralVel) > 10) grip = 0.90; 

            const impulse = rightNormal.clone().mul(-lateralVel * grip * body.getMass());
            body.applyLinearImpulse(impulse, body.getWorldCenter());

            if (this.handbrakeInput && speed > 5.0) body.setAngularDamping(0.5); 
            else body.setAngularDamping(4.0);

            if (Math.abs(this.steerInput) > 0.01) {
                let steerPower = this.handbrakeInput ? 6.0 : 3.0; 
                if (this.handbrakeInput) {
                    const speedFactor = Math.min(1.0, speed / 10.0);
                    steerPower *= speedFactor;
                }
                
                let dir = 1;
                if (forwardVel < -5) dir = -1; 
                
                const currentAngVel = body.getAngularVelocity();
                const targetAngVel = -this.steerInput * steerPower * dir;
                const angDiff = targetAngVel - currentAngVel;
                body.applyAngularImpulse(angDiff * body.getInertia() * 0.1); 
            }

            if (Math.abs(this.throttleInput) > 0.01) {
                let forceMagnitude = this.power * 0.5 * this.throttleInput;
                if (this.handbrakeInput) forceMagnitude *= 0.3;
                const force = forwardNormal.clone().mul(forceMagnitude);
                body.applyForce(force, body.getWorldCenter());
            }

            let dragFactor = 0.02 + (Math.abs(lateralVel) * 0.05); 
            
            if (this.isPlayer && this.autoBraking && speed > 0.1) {
                dragFactor += 0.8; 
            }

            const brakeDrag = this.handbrakeInput ? 0.05 : 0;
            const dragForce = velocity.clone().mul(-(dragFactor + brakeDrag) * body.getMass());
            body.applyForce(dragForce, body.getWorldCenter());

            if ((Math.abs(lateralVel) > 4.0 && speed > 5) || (this.handbrakeInput && speed > 5)) {
                this.spawnSkidMarks();
            }

            this.speed = forwardVel * 3.6; 
        }

        spawnSkidMarks() {
            if (Math.random() > 0.4) return; 
            const pos = this.body.getPosition();
            const angle = this.body.getAngle();
            const right = { x: Math.cos(angle), y: Math.sin(angle) };
            const fwd = { x: -Math.sin(angle), y: Math.cos(angle) };

            const backOffset = -1.4;
            const widthOffset = 0.65;

            const lX = pos.x + (fwd.x * backOffset) - (right.x * widthOffset);
            const lY = pos.y + (fwd.y * backOffset) - (right.y * widthOffset);
            
            const rX = pos.x + (fwd.x * backOffset) + (right.x * widthOffset);
            const rY = pos.y + (fwd.y * backOffset) + (right.y * widthOffset);

            skidMarks.push(new SkidMark(lX, lY, angle));
            skidMarks.push(new SkidMark(rX, rY, angle));
        }

        aiUpdate(dt) {
            if (this.isPlayer) return;

            const pos = this.body.getPosition();
            const velocity = this.body.getLinearVelocity();
            const physVel = velocity.length();
            
            const tileX = Math.round(pos.x / BLOCK_SIZE) * BLOCK_SIZE;
            const tileZ = Math.round(pos.y / BLOCK_SIZE) * BLOCK_SIZE;
            const currentKey = `${tileX},${tileZ}`;
            
            if (!this.path) this.path = [];

            if (this.currentKey !== currentKey) {
                if (this.currentKey && intersectionLocks[this.currentKey] === this) {
                    intersectionLocks[this.currentKey] = null;
                }
                this.currentKey = currentKey;
                
                if (this.path.length > 0 && this.path[0] === currentKey) {
                    this.path.shift();
                }
            }

            let throttle = 0;
            let steer = 0;
            let brake = false;

            let useAStar = (currentMapType !== 'default' && gameParams.aiRoute === 'random');

            if (!useAStar) {
                if(physVel < 2.0) {
                    this.stuckTimer += dt;
                    if(this.stuckTimer > 0.5) {
                        if (gameParams.aiRoute === 'random') {
                            this.drive(-1, 1, false); 
                            return;
                        } else {
                            throttle = 1.0;
                        }
                    }
                } else {
                    this.stuckTimer = 0;
                }
                
                if (this.stuckTimer > 5.0) {
                    this.markedForDeletion = true;
                }

                if (pl.Vec2.distance(pos, pl.Vec2(tileX, tileZ)) < 8.0 && this.lastDecisionTile !== currentKey) {
                    this.lastDecisionTile = currentKey;
                    this.makeTurnDecision(tileX, tileZ);
                }
                
                const currentAngle = this.body.getAngle();
                const angleToTarget = angleDiff(this.aiTargetAngle, currentAngle);

                let rx = Math.cos(this.aiTargetAngle);
                let rz = Math.sin(this.aiTargetAngle);
                let dx = pos.x - tileX;
                let dz = pos.y - tileZ;
                let lateralDist = dx * rx + dz * rz;
                
                let targetLaneOffset = (currentMapType === 'default') ? this.laneOffset : 3.0;
                let laneError = lateralDist - targetLaneOffset; 
                
                if (Math.abs(angleToTarget) > 0.1 && this.stuckTimer === 0) {
                    steer = angleToTarget > 0 ? -1 : 1; 
                    throttle = 0.5; 
                } else {
                    steer = (angleToTarget * -2.5) - (laneError * 0.3);
                    if (this.stuckTimer === 0) throttle = 1.0;
                }
            } else {
                if (this.path.length === 0 && roadTiles.length > 0) {
                    const targetTile = roadTiles[Math.floor(Math.random() * roadTiles.length)];
                    this.path = aStar(currentKey, `${targetTile.x},${targetTile.z}`);
                    if (this.path.length > 0 && this.path[0] === currentKey) {
                        this.path.shift();
                    }
                }

                if (this.path.length > 0) {
                    const nextKey = this.path[0];
                    const [nx, nz] = nextKey.split(',').map(Number);
                    
                    const neighborsCount = getNeighbors(nextKey).length;
                    const isIntersection = neighborsCount > 2;

                    let canProceed = true;
                    if (isIntersection) {
                        if (!intersectionLocks[nextKey] || intersectionLocks[nextKey] === this) {
                            intersectionLocks[nextKey] = this; 
                        } else {
                            canProceed = false; 
                        }
                    }

                    if (!canProceed) {
                        throttle = 0;
                        brake = true;
                        this.stuckTimer = 0; 
                    } else {
                        if (nx > tileX) this.aiTargetAngle = -Math.PI/2;
                        else if (nx < tileX) this.aiTargetAngle = Math.PI/2;
                        else if (nz > tileZ) this.aiTargetAngle = 0; 
                        else if (nz < tileZ) this.aiTargetAngle = Math.PI; 
                        
                        throttle = 1.0;

                        if(physVel < 2.0) {
                            this.stuckTimer += dt;
                            if(this.stuckTimer > 1.5) {
                                this.drive(-1, 1, false); 
                                return;
                            }
                        } else {
                            this.stuckTimer = 0;
                        }
                    }
                } else {
                    throttle = 0;
                    brake = true;
                }

                const currentAngle = this.body.getAngle();
                const angleToTarget = angleDiff(this.aiTargetAngle, currentAngle);

                if (Math.abs(angleToTarget) > 0.15 && throttle > 0) {
                    steer = angleToTarget > 0 ? -1 : 1; 
                    throttle = 0.6; 
                } else {
                    steer = angleToTarget * -3.0; 
                }
            }

            const maxVel = this.maxSpeed / 3.6;
            if (physVel > maxVel && throttle > 0) throttle = 0;

            this.drive(throttle, clamp(steer, -1, 1), brake);
        }

        makeTurnDecision(cx, cz) {
            const neighbors = [
                { dir: 0, x: cx, z: cz - BLOCK_SIZE, angle: Math.PI },   
                { dir: 1, x: cx + BLOCK_SIZE, z: cz, angle: -Math.PI/2 }, 
                { dir: 2, x: cx, z: cz + BLOCK_SIZE, angle: 0 },         
                { dir: 3, x: cx - BLOCK_SIZE, z: cz, angle: Math.PI/2 }  
            ];
            const valid = neighbors.filter(n => roadLookup[`${n.x},${n.z}`]);
            if (valid.length === 0) return; 

            const getRel = (target) => angleDiff(target, this.aiTargetAngle);
            const straight = valid.find(n => Math.abs(getRel(n.angle)) < 0.1);
            const left     = valid.find(n => Math.abs(getRel(n.angle) - Math.PI/2) < 0.1); 
            const right    = valid.find(n => Math.abs(getRel(n.angle) + Math.PI/2) < 0.1);
            const uturn    = valid.find(n => Math.abs(getRel(n.angle) - Math.PI) < 0.1);

            let selected = null;
            
            if (gameParams.aiRoute === 'straight_uturn') {
                if (straight) selected = straight;
                else if (uturn) selected = uturn;
                else if (right) selected = right;
                else if (left) selected = left;
            } else if (gameParams.aiRoute === 'right_only') {
                if (right) selected = right;
                else if (straight) selected = straight;
                else if (left) selected = left;
                else if (uturn) selected = uturn;
            } else {
                if (this.plannedAction === 'left' && left) selected = left;
                else if (this.plannedAction === 'right' && right) selected = right;
                else if (straight) selected = straight;
                else selected = left || right;

                if (!selected && valid.length > 0) selected = valid[Math.floor(Math.random()*valid.length)];
            }
            
            if(selected) {
                this.aiTargetAngle = selected.angle;
                if (gameParams.aiRoute === 'random') {
                    if (this.plannedAction === 'left') this.plannedAction = (Math.random() < 0.3) ? 'left' : 'straight';
                    else if (this.plannedAction === 'right') this.plannedAction = (Math.random() < 0.6) ? 'right' : 'straight';
                }
            }
        }

        shoot() {
            if (this.shootCooldown > 0) return;
            const pos = this.body.getPosition();
            const angle = this.body.getAngle();
            const fwd = { x: -Math.sin(angle), y: Math.cos(angle) };
            const right = { x: Math.cos(angle), y: Math.sin(angle) };
            const carVel = this.body.getLinearVelocity(); 
            
            const gunOffset = 0.6; 
            const spawnDist = 3.0; 
            const speed = 60; 
            
            const totalVx = carVel.x + (fwd.x * speed);
            const totalVy = carVel.y + (fwd.y * speed);
            
            createBullet(pos.x + fwd.x*spawnDist - right.x*gunOffset, pos.y + fwd.y*spawnDist - right.y*gunOffset, totalVx, totalVy, this.playerIndex);
            createBullet(pos.x + fwd.x*spawnDist + right.x*gunOffset, pos.y + fwd.y*spawnDist + right.y*gunOffset, totalVx, totalVy, this.playerIndex);
            this.shootCooldown = 0.2;
        }
    }

    function createBullet(x, y, vx, vy, ownerIndex) {
        const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geo, mat);
        if (gameParams.bulletGlow) {
            const light = new THREE.PointLight(0xffaa00, 5, 15);
            mesh.add(light);
        }
        const body = world.createBody({ type: 'dynamic', position: pl.Vec2(x, y), bullet: true });
        body.createFixture(pl.Circle(0.15), { filterCategoryBits: CAT_BULLET, filterMaskBits: CAT_ENEMY | CAT_WALL });
        body.setLinearVelocity(pl.Vec2(vx, vy));

        const ent = new Entity(mesh, body);
        ent.isBullet = true;
        ent.owner = ownerIndex;
        ent.life = 1.0;
        ent.update = function(dt) {
            Entity.prototype.update.call(this);
            this.life -= dt;
            if (this.life <= 0) this.markedForDeletion = true;
        };
        entities.push(ent);
    }

    function createExplosion(pos) {
        if (!gameParams.particlesEnabled) return; 
        const geo = new THREE.BoxGeometry(0.4,0.4,0.4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
        for(let i=0; i<8; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            scene.add(mesh);
            const vel = new THREE.Vector3((Math.random()-0.5), Math.random(), (Math.random()-0.5));
            const ent = {
                mesh: mesh, vel: vel, life: 0.8,
                update: function() {
                    this.mesh.position.add(this.vel);
                    this.life -= 0.05;
                    if(this.life <= 0) { scene.remove(this.mesh); this.markedForDeletion = true; }
                }, destroy: function(){}
            };
            entities.push(ent);
        }
    }

    // --- INFINITE HIGHWAY LOGIC ---
    function createHighwayChunk(zStart) {
        const chunk = { zStart: zStart, meshes: [], bodies: [], roadData: [] };
        const matType = gameParams.simpleMaterials ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;

        const planeGeo = new THREE.PlaneGeometry(400, CHUNK_LENGTH);
        const roadTex = createProceduralTexture('road');
        roadTex.repeat.set(40, CHUNK_LENGTH/10);
        const planeMat = new matType({ map: roadTex, side: THREE.DoubleSide });
        const ground = new THREE.Mesh(planeGeo, planeMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.1, zStart + CHUNK_LENGTH/2);
        ground.receiveShadow = true;
        scene.add(ground);
        chunk.meshes.push(ground);

        const addWall = (x, z, w, h) => {
            const body = world.createBody(pl.Vec2(x, z));
            body.createFixture(pl.Box(w/2, h/2), { filterCategoryBits: CAT_WALL });
            chunk.bodies.push(body);
        };
        addWall(-40, zStart + CHUNK_LENGTH/2, 2, CHUNK_LENGTH);
        addWall(40, zStart + CHUNK_LENGTH/2, 2, CHUNK_LENGTH);

        const boxGeo = new THREE.BoxGeometry(1,1,1);
        const addBuilding = (x, z) => {
            const h = Math.random() * 15 + 5;
            const w = Math.random() * 8 + 6;
            const buildTex = createProceduralTexture('building');
            buildTex.repeat.set(w/10, h/10);
            const roofTex = createProceduralTexture('roof');
            roofTex.repeat.set(w/10, w/10);
            const sideMat = new matType({ map: buildTex, roughness: 0.2 });
            const roofMat = new matType({ map: roofTex, roughness: 0.5 });
            const materials = [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat];
            const bMesh = new THREE.Mesh(boxGeo, materials);
            bMesh.position.set(x, h/2, z);
            bMesh.scale.set(w, h, w);
            bMesh.castShadow = true; 
            bMesh.receiveShadow = true;
            scene.add(bMesh);
            chunk.meshes.push(bMesh);
            const body = world.createBody(pl.Vec2(x, z));
            body.createFixture(pl.Box(w/2, w/2), { filterCategoryBits: CAT_WALL });
            chunk.bodies.push(body);
        };

        for(let z = zStart; z < zStart + CHUNK_LENGTH; z += 12) {
            addBuilding(-35, z); addBuilding(35, z);
        }

        for(let z = zStart; z < zStart + CHUNK_LENGTH; z += 20) {
            const t1={x: -15, z: z}, t2={x: 0, z: z}, t3={x: 15, z: z};
            roadTiles.push(t1, t2, t3);
            roadLookup[`${t1.x},${t1.z}`]=true; chunk.roadData.push(t1);
            roadLookup[`${t2.x},${t2.z}`]=true; chunk.roadData.push(t2);
            roadLookup[`${t3.x},${t3.z}`]=true; chunk.roadData.push(t3);
        }
        highwayChunks.push(chunk);
    }

    function createCity() {
        highwayChunks = [];
        roadTiles = [];
        roadLookup = {};
        createHighwayChunk(-CHUNK_LENGTH); 
        createHighwayChunk(0);             
        createHighwayChunk(CHUNK_LENGTH);  
    }

    function updateHighway() {
        if (currentMapType !== 'default') return;
        let players = [];
        if (player1) players.push(player1);
        if (player2) players.push(player2);
        if (players.length === 0) return;

        players.forEach(p => {
            const pZ = p.body.getPosition().y; 
            const currentChunkIdx = Math.floor(pZ / CHUNK_LENGTH);
            [-1, 0, 1].forEach(offset => {
                const targetIdx = currentChunkIdx + offset;
                const targetZ = targetIdx * CHUNK_LENGTH;
                const exists = highwayChunks.some(c => Math.abs(c.zStart - targetZ) < 1);
                if (!exists) createHighwayChunk(targetZ);
            });
        });

        for (let i = highwayChunks.length - 1; i >= 0; i--) {
            const chunk = highwayChunks[i];
            const chunkIdx = Math.round(chunk.zStart / CHUNK_LENGTH);
            
            let farFromAll = true;
            players.forEach(p => {
                const pZ = p.body.getPosition().y;
                const pChunkIdx = Math.floor(pZ / CHUNK_LENGTH);
                if (Math.abs(chunkIdx - pChunkIdx) <= 2) farFromAll = false;
            });

            if (farFromAll) {
                chunk.meshes.forEach(m => { 
                    scene.remove(m); 
                    if(m.geometry) m.geometry.dispose();
                    if(Array.isArray(m.material)) {
                        m.material.forEach(mat => {
                            if(mat.map) { mat.map.isDisposed = true; mat.map.dispose(); }
                            mat.dispose();
                        });
                    } else if(m.material) {
                        if(m.material.map) { m.material.map.isDisposed = true; m.material.map.dispose(); }
                        m.material.dispose();
                    }
                });
                chunk.bodies.forEach(b => world.destroyBody(b));
                chunk.roadData.forEach(t => delete roadLookup[`${t.x},${t.z}`]);
                roadTiles = roadTiles.filter(t => !chunk.roadData.includes(t));
                highwayChunks.splice(i, 1);
            }
        }
    }
    
    function generateMazeData(width, height) {
        let grid = [];
        let roads = [];
        for (let z = 0; z < height; z++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                if (x === 0 || x === width - 1 || z === 0 || z === height - 1) {
                    row.push('#'); continue;
                }
                const modX = (x - 1) % 6; const modZ = (z - 1) % 4;
                if (modX < 5 && modZ < 3) row.push('#'); else row.push(' '); 
            }
            grid.push(row);
        }
        for(let z=0; z<height; z++) {
            for(let x=0; x<width; x++) {
                if(grid[z][x] === ' ') {
                    roads.push({ x: (x * BLOCK_SIZE) - (width * BLOCK_SIZE / 2), z: (z * BLOCK_SIZE) - (height * BLOCK_SIZE / 2) });
                }
            }
        }
        return { grid, roads };
    }

    function buildRoadLookup() {
        roadLookup = {};
        roadTiles.forEach(t => { roadLookup[`${t.x},${t.z}`] = true; });
    }

    function spawnTraffic() {
        if (loadedTextures.length === 0) return;
        let players = [];
        if (player1) players.push(player1);
        if (player2) players.push(player2);
        if (players.length === 0) return;

        let p = players[Math.floor(Math.random() * players.length)];
        const pPos = p.body.getPosition();
        const pAngle = p.body.getAngle();
        const pDir = pl.Vec2(-Math.sin(pAngle), Math.cos(pAngle));
        const spawnRadius = gameParams.spawnRadius;

        for(let i = trafficPool.length - 1; i >= 0; i--) {
            let cPos = trafficPool[i].body.getPosition();
            let dist1 = player1 ? pl.Vec2.distance(cPos, player1.body.getPosition()) : Infinity;
            let dist2 = player2 ? pl.Vec2.distance(cPos, player2.body.getPosition()) : Infinity;
            
            if (Math.min(dist1, dist2) > spawnRadius) {
                trafficPool[i].markedForDeletion = true; 
            }
        }

        if (trafficPool.length < gameParams.trafficCount) {
             const tex = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];
             let validTile = null, attempts = 0;
             while(!validTile && attempts < 15) {
                 const tile = roadTiles[Math.floor(Math.random() * roadTiles.length)];
                 const tileVec = pl.Vec2(tile.x, tile.z);
                 const toTile = pl.Vec2.sub(tileVec, pPos);
                 if (toTile.length() > spawnRadius - 45 && toTile.length() < spawnRadius - 5 && pl.Vec2.dot(toTile, pDir) > -30) {
                     if(!trafficPool.some(c => pl.Vec2.distance(c.body.getPosition(), tileVec) < 15)) validTile = tile;
                 }
                 attempts++;
             }
             if (!validTile) return; 

             let x = validTile.x, z = validTile.z, angle = 0;
             let laneOffset = 0;
             if (currentMapType === 'default') {
                 trafficSpawnCounter++;
                 const lane = trafficSpawnCounter % 4;
                 x = (lane === 0) ? 2.5 : (lane === 1) ? 6.5 : (lane === 2) ? -2.5 : -6.5;
                 angle = x > 0 ? 0 : Math.PI;
                 laneOffset = x;
              } else {
                  angle = (Math.random() > 0.5) ? 0 : Math.PI/2;
                  if (gameParams.aiRoute !== 'random') {
                      x += Math.cos(angle + Math.PI/2) * 2.0;
                      z += Math.sin(angle + Math.PI/2) * 2.0;
                  }
              }

             const car = new Car(x, z, false, 0, tex, 'straight', laneOffset);
             car.body.setAngle(angle);
             car.aiTargetAngle = angle;
             entities.push(car);
             trafficPool.push(car);
        }
    }

    world.on('begin-contact', (contact) => {
        const a = contact.getFixtureA().getBody();
        const b = contact.getFixtureB().getBody();
        const entA = entities.find(e => e.body === a);
        const entB = entities.find(e => e.body === b);
        if(!entA || !entB) return;

        if (entA instanceof Car || entB instanceof Car) {
            const car = entA instanceof Car ? entA : entB;
            car.speed *= 0.3; 
        }

        if(entA.isBullet || entB.isBullet) {
            const bullet = entA.isBullet ? entA : entB;
            const target = entA.isBullet ? entB : entA;
            if(target instanceof Car && !target.isPlayer) {
                bullet.markedForDeletion = true;
                target.markedForDeletion = true; 
                if(bullet.owner === 1) { p1Score += 100; p1ScoreEl.innerText = `P1: ${p1Score}`; }
                else { p2Score += 100; p2ScoreEl.innerText = `P2: ${p2Score}`; }
                createExplosion(target.mesh.position);
            } else if (!target.isPlayer) {
                bullet.markedForDeletion = true; 
            }
        }
    });

    const keys = {};
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);

    // --- Device Assignment Logic ---
    window.setGameMode = function(mode) {
        gameMode = mode;
        document.getElementById('btnMode1P').classList.toggle('active', mode === '1p');
        document.getElementById('btnMode2PH').classList.toggle('active', mode === '2ph');
        document.getElementById('btnMode2PV').classList.toggle('active', mode === '2pv');
        numPlayers = mode === '1p' ? 1 : 2;
        document.getElementById('p2DeviceSlot').style.display = numPlayers === 2 ? 'block' : 'none';
    };

    window.clearDevices = function() {
        devices = { p1: null, p2: null };
        document.getElementById('p1DeviceSlot').innerText = "P1: Waiting...";
        document.getElementById('p1DeviceSlot').classList.remove('ready');
        document.getElementById('p2DeviceSlot').innerText = "P2: Waiting...";
        document.getElementById('p2DeviceSlot').classList.remove('ready');
    };

    function getDeviceName(dev) {
        if (dev === 'kb_arrows') return "Keyboard (Arrows)";
        if (dev === 'kb_wasd') return "Keyboard (WASD)";
        if (dev && dev.startsWith('gp_')) return "Gamepad " + (parseInt(dev.split('_')[1]) + 1);
        return "Waiting...";
    }

    function assignDevice(dev) {
        if (devices.p1 === dev || devices.p2 === dev) return;
        if (!devices.p1) {
            devices.p1 = dev;
            document.getElementById('p1DeviceSlot').innerText = "P1: " + getDeviceName(dev);
            document.getElementById('p1DeviceSlot').classList.add('ready');
        } else if (!devices.p2 && numPlayers === 2) {
            devices.p2 = dev;
            document.getElementById('p2DeviceSlot').innerText = "P2: " + getDeviceName(dev);
            document.getElementById('p2DeviceSlot').classList.add('ready');
        }
    }

    function checkDeviceJoins() {
        if (keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']) assignDevice('kb_arrows');
        if (keys['KeyW'] || keys['KeyA'] || keys['KeyS'] || keys['KeyD']) assignDevice('kb_wasd');

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                let pressed = gp.buttons.some(b => b.pressed) || gp.axes.some(a => Math.abs(a) > 0.5);
                if (pressed) assignDevice('gp_' + gp.index);
            }
        }
    }

    window.addEventListener("gamepaddisconnected", (e) => {
        const id = 'gp_' + e.gamepad.index;
        if (devices.p1 === id) { devices.p1 = null; document.getElementById('p1DeviceSlot').innerText = "P1: Waiting..."; document.getElementById('p1DeviceSlot').classList.remove('ready'); }
        if (devices.p2 === id) { devices.p2 = null; document.getElementById('p2DeviceSlot').innerText = "P2: Waiting..."; document.getElementById('p2DeviceSlot').classList.remove('ready'); }
    });

    function getPlayerInput(playerIndex) {
        let dev = playerIndex === 1 ? devices.p1 : devices.p2;
        let input = { accelerate: false, brake: false, steer: 0, shoot: false, handbrake: false };
        if (!dev) return input;

        if (dev === 'kb_arrows') {
            if (keys['ArrowUp']) input.accelerate = true;
            if (keys['ArrowDown']) input.brake = true;
            if (keys['ArrowLeft']) input.steer = 1;
            if (keys['ArrowRight']) input.steer = -1;
            if (keys['Enter'] || keys['ControlRight']) input.shoot = true;
            if (keys['ShiftRight'] || keys['Space']) input.handbrake = true;
        } else if (dev === 'kb_wasd') {
            if (keys['KeyW']) input.accelerate = true;
            if (keys['KeyS']) input.brake = true;
            if (keys['KeyA']) input.steer = 1;
            if (keys['KeyD']) input.steer = -1;
            if (keys['KeyF'] || keys['ControlLeft']) input.shoot = true;
            if (keys['Space'] || keys['ShiftLeft']) input.handbrake = true;
        } else if (dev.startsWith('gp_')) {
            let gpIndex = parseInt(dev.split('_')[1]);
            let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            let gp = gamepads[gpIndex];
            if (gp) {
                if (Math.abs(gp.axes[0]) > 0.2) input.steer = -gp.axes[0]; 
                if (gp.buttons[14]?.pressed) input.steer = 1;
                if (gp.buttons[15]?.pressed) input.steer = -1;

                if (gp.buttons[0]?.pressed) input.accelerate = true;
                if (gp.buttons[6]?.pressed) input.brake = true;
                if (gp.buttons[7]?.pressed) input.shoot = true;
                if (gp.buttons[1]?.pressed || gp.buttons[2]?.pressed) input.handbrake = true;
            }
        }
        return input;
    }

    // --- Minimap, Full Map Renderers & Edge Indicators ---
    function drawEdgeIndicators(ctx, camera, rect, player) {
        if (!player) return;
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        ctx.save();
        trafficPool.forEach(car => {
            if(!car.mesh || car.markedForDeletion) return;
            const pos = car.mesh.position.clone();
            
            if (frustum.containsPoint(pos)) return;

            pos.project(camera); 

            let x = (pos.x * 0.5 + 0.5) * rect.w + rect.x;
            let y = (-(pos.y * 0.5) + 0.5) * rect.h + rect.y;

            if (pos.z > 1) { 
                x = rect.x + rect.w - (x - rect.x);
                y = rect.y + rect.h; 
            }

            const pad = 20;
            const minX = rect.x + pad;
            const maxX = rect.x + rect.w - pad;
            const minY = rect.y + pad;
            const maxY = rect.y + rect.h - pad;

            let drawX = x;
            let drawY = y;
            let clamped = false;

            if (drawX < minX) { drawX = minX; clamped = true; }
            if (drawX > maxX) { drawX = maxX; clamped = true; }
            if (drawY < minY) { drawY = minY; clamped = true; }
            if (drawY > maxY) { drawY = maxY; clamped = true; }
            if (pos.z > 1) clamped = true;

            if (clamped) {
                ctx.save();
                ctx.translate(drawX, drawY);
                const cx = rect.x + rect.w / 2;
                const cy = rect.y + rect.h / 2;
                const angle = Math.atan2(drawY - cy, drawX - cx);
                ctx.rotate(angle);
                
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-6, 8);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-6, -8);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255, 50, 50, 0.7)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }
        });
        ctx.restore();
    }

    function drawMinimap(ctx, player, rect) {
        if (!player) return;
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.clip();

        const zoom = 1.5; 
        const pPos = player.body.getPosition();
        const px = pPos.x;
        const pz = pPos.y;

        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-px, -pz);

        const viewDist = (Math.max(rect.w, rect.h) / zoom) / 2 + BLOCK_SIZE;
        ctx.fillStyle = "#333";
        roadTiles.forEach(t => {
            if (Math.abs(t.x - px) < viewDist && Math.abs(t.z - pz) < viewDist) {
                ctx.fillRect(t.x - BLOCK_SIZE/2, t.z - BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
            }
        });

        const activePath = (player === player1) ? p1Path : p2Path;
        if (activePath && activePath.length > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(180, 50, 255, 0.8)';
            ctx.lineWidth = 4 / zoom; 
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            activePath.forEach((key, index) => {
                const [nx, nz] = key.split(',').map(Number);
                if (index === 0) ctx.moveTo(nx, nz);
                else ctx.lineTo(nx, nz);
            });
            ctx.stroke();
            ctx.restore();
        }

        if (destinationCoord) {
            ctx.save();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(destinationCoord.x, destinationCoord.z, 6 / zoom, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5 / zoom;
            ctx.stroke();
            ctx.restore();
        }

        const drawCarArrow = (car, color) => {
            const pos = car.body.getPosition();
            if (Math.abs(pos.x - px) < viewDist && Math.abs(pos.y - pz) < viewDist) {
                ctx.save();
                ctx.fillStyle = color;
                ctx.translate(pos.x, pos.y);
                ctx.rotate(car.body.getAngle() + Math.PI);
                ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-4, 4); ctx.lineTo(4, 4); ctx.fill();
                ctx.restore();
            }
        };

        trafficPool.forEach(car => drawCarArrow(car, 'red'));
        if (player1) drawCarArrow(player1, '#ffcc00');
        if (player2) drawCarArrow(player2, '#cc66ff');

        ctx.restore();
    }

    function renderFullMap() {
        const canvas = document.getElementById('fullMapCanvas');
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(mapView.zoom, mapView.zoom);
        ctx.translate(-mapView.x, -mapView.z);
        
        ctx.fillStyle = '#333';
        roadTiles.forEach(t => {
            if (Math.abs(t.x - mapView.x)*mapView.zoom < w/2 + BLOCK_SIZE*mapView.zoom &&
                Math.abs(t.z - mapView.z)*mapView.zoom < h/2 + BLOCK_SIZE*mapView.zoom) {
                ctx.fillRect(t.x - BLOCK_SIZE/2, t.z - BLOCK_SIZE/2, BLOCK_SIZE, BLOCK_SIZE);
            }
        });

        if (p1Path && p1Path.length > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(180, 50, 255, 0.8)';
            ctx.lineWidth = 8 / mapView.zoom;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            p1Path.forEach((key, index) => {
                const [x, z] = key.split(',').map(Number);
                if (index === 0) ctx.moveTo(x, z);
                else ctx.lineTo(x, z);
            });
            ctx.stroke();
            ctx.restore();
        }

        if (destinationCoord) {
            ctx.save();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(destinationCoord.x, destinationCoord.z, 6 / mapView.zoom, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5 / mapView.zoom;
            ctx.stroke();
            ctx.restore();
        }

        const drawFullMapArrow = (car, color) => {
            const p = car.body.getPosition();
            ctx.save();
            ctx.fillStyle = color;
            ctx.translate(p.x, p.y);
            ctx.rotate(car.body.getAngle() + Math.PI);
            ctx.beginPath(); ctx.moveTo(0, -8/mapView.zoom); ctx.lineTo(-6/mapView.zoom, 6/mapView.zoom); ctx.lineTo(6/mapView.zoom, 6/mapView.zoom); ctx.fill();
            ctx.restore();
        };

        trafficPool.forEach(c => drawFullMapArrow(c, 'red'));
        if (player1) drawFullMapArrow(player1, '#ffcc00');
        if (player2) drawFullMapArrow(player2, '#cc66ff');
        
        ctx.restore();
    }

    let lastTime = 0;
    function animate(time) {
        requestAnimationFrame(animate);
        
        if (!gameActive) return;

        if (isMapOpen) {
            renderFullMap();
            return; 
        }

        if (isPaused) return;

        const dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        checkDeviceJoins();

        updatePlayerPaths();

        lightManager.update();

        if (Math.random() < 0.1) spawnTraffic();
        updateHighway();
        world.step(TIME_STEP, velIter, posIter);

        for (let i = skidMarks.length - 1; i >= 0; i--) {
            if (!skidMarks[i].update(dt)) {
                skidMarks[i].destroy();
                skidMarks.splice(i, 1);
            }
        }

        if (player1) {
            let i = getPlayerInput(1);
            player1.drivePlayer(i.accelerate, i.brake, i.handbrake, i.steer);
            if (i.shoot) player1.shoot();
        }

        if (player2) {
            let i = getPlayerInput(2);
            player2.drivePlayer(i.accelerate, i.brake, i.handbrake, i.steer);
            if (i.shoot) player2.shoot();
        }

        trafficPool.forEach(car => {
            if(!car.markedForDeletion) {
                car.update(dt);
                car.aiUpdate(dt);
            }
        });

        for (let i = entities.length - 1; i >= 0; i--) {
             if (entities[i] === player1 || entities[i] === player2) {
                 entities[i].update(dt);
                 continue;
             }
             entities[i].update(dt);
             if (entities[i].markedForDeletion) {
                 entities[i].destroy();
                 entities.splice(i, 1);
                 const idx = trafficPool.indexOf(entities[i]);
                 if(idx > -1) trafficPool.splice(idx, 1);
             }
        }

        const updateCam = (cam, p) => {
            if (!p || !p.mesh) return;
            if(cam.fov !== gameParams.cameraFOV) { cam.fov = gameParams.cameraFOV; cam.updateProjectionMatrix(); }
            const targetX = p.mesh.position.x;
            const distH = gameParams.topDownMode ? 0.1 : 20; 
            let finalCamX = targetX, finalCamZ = p.mesh.position.z + distH;
            
            if (gameParams.cameraRotate) {
                 const angle = p.body.getAngle(); 
                 finalCamX = targetX + (-Math.sin(angle) * distH);
                 finalCamZ = p.mesh.position.z + (Math.cos(angle) * distH);
                 if(gameParams.topDownMode) cam.up.set(Math.sin(angle), 0, Math.cos(angle));
                 else cam.up.set(0,1,0);
            } else {
                 if(gameParams.topDownMode) cam.up.set(0,0,-1);
                 else cam.up.set(0,1,0);
            }
            cam.position.x += (finalCamX - cam.position.x) * 0.1;
            cam.position.z += (finalCamZ - cam.position.z) * 0.1;
            cam.position.y += (gameParams.cameraHeight - cam.position.y) * 0.1;
            cam.lookAt(targetX, 0, p.mesh.position.z);
        };

        if (player1) updateCam(camera1, player1);
        if (player2) updateCam(camera2, player2);

        const focusPlayer = player1 || player2;
        if (focusPlayer && focusPlayer.mesh) {
            dirLight.position.x = focusPlayer.mesh.position.x + 50;
            dirLight.position.z = focusPlayer.mesh.position.z + 50;
            dirLight.target.position.set(focusPlayer.mesh.position.x, 0, focusPlayer.mesh.position.z);
            dirLight.target.updateMatrixWorld();
        }

        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        const w = isFullscreen ? BASE_WIDTH : window.innerWidth;
        const h = isFullscreen ? BASE_HEIGHT : window.innerHeight;

        if (numPlayers === 1) {
            camera1.aspect = w / h; camera1.updateProjectionMatrix();
            renderer.setViewport(0, 0, w, h);
            renderer.setScissor(0, 0, w, h);
            renderer.setScissorTest(false);
            renderer.render(scene, camera1);
        } else {
            renderer.setScissorTest(true);
            if (gameMode === '2ph') { 
                camera1.aspect = w / (h / 2); camera1.updateProjectionMatrix();
                camera2.aspect = w / (h / 2); camera2.updateProjectionMatrix();
                
                renderer.setViewport(0, Math.floor(h/2) + 1, w, Math.floor(h/2));
                renderer.setScissor(0, Math.floor(h/2) + 1, w, Math.floor(h/2));
                renderer.render(scene, camera1);

                renderer.setViewport(0, 0, w, Math.floor(h/2) - 1);
                renderer.setScissor(0, 0, w, Math.floor(h/2) - 1);
                renderer.render(scene, camera2);
            } else { 
                camera1.aspect = (w / 2) / h; camera1.updateProjectionMatrix();
                camera2.aspect = (w / 2) / h; camera2.updateProjectionMatrix();

                renderer.setViewport(0, 0, Math.floor(w/2) - 1, h);
                renderer.setScissor(0, 0, Math.floor(w/2) - 1, h);
                renderer.render(scene, camera1);

                renderer.setViewport(Math.floor(w/2) + 1, 0, Math.floor(w/2), h);
                renderer.setScissor(Math.floor(w/2) + 1, 0, Math.floor(w/2), h);
                renderer.render(scene, camera2);
            }
        }

        // --- Render UI Overlay Layer ---
        uiCtx.clearRect(0, 0, w, h);
        if (numPlayers === 1) {
            drawEdgeIndicators(uiCtx, camera1, {x:0, y:0, w:w, h:h}, player1);
            drawMinimap(uiCtx, player1, {x: w - 220, y: 20, w: 200, h: 200});
        } else {
            if (gameMode === '2ph') {
                drawEdgeIndicators(uiCtx, camera1, {x:0, y:0, w:w, h:Math.floor(h/2)}, player1);
                drawEdgeIndicators(uiCtx, camera2, {x:0, y:Math.floor(h/2), w:w, h:Math.floor(h/2)}, player2);
                drawMinimap(uiCtx, player1, {x: w - 220, y: 20, w: 200, h: 200});
                drawMinimap(uiCtx, player2, {x: w - 220, y: h/2 + 20, w: 200, h: 200});
            } else {
                drawEdgeIndicators(uiCtx, camera1, {x:0, y:0, w:Math.floor(w/2), h:h}, player1);
                drawEdgeIndicators(uiCtx, camera2, {x:Math.floor(w/2), y:0, w:Math.floor(w/2), h:h}, player2);
                drawMinimap(uiCtx, player1, {x: Math.floor(w/2) - 220, y: 20, w: 200, h: 200});
                drawMinimap(uiCtx, player2, {x: w - 220, y: 20, w: 200, h: 200});
            }
        }
    }

    requestAnimationFrame(animate);

    window.startGameWithMap = function(type) {
        currentMapType = type;
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('customizeMenu').classList.add('hidden');
        document.getElementById('gameHeader').classList.remove('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('optionsHint').classList.remove('hidden');
        mapMenu.classList.add('hidden');
        isPaused = false;
        isMapOpen = false;
        
        destinationKey = null;
        destinationCoord = null;
        p1Path = [];
        p2Path = [];
        forcePathRecompute = false;
        
        loadAssets().then(() => {
            entities.forEach(e => e.destroy());
            skidMarks.forEach(s => s.destroy());
            entities = []; trafficPool = []; skidMarks = [];
            intersectionLocks = {}; 
            
            if(type === 'default') createCity(); 
            else {
                let w=20, h=20;
                if(type === 'medium') {w=40; h=40;}
                if(type === 'large') {w=60; h=60;}
                const data = generateMazeData(w,h);
                mapGrid = data.grid; roadTiles = data.roads;
                buildRoadLookup();

                const pg = new THREE.PlaneGeometry(w*BLOCK_SIZE*1.2, h*BLOCK_SIZE*1.2);
                const roadTex = createProceduralTexture('road');
                roadTex.repeat.set(w, h);
                const pm = gameParams.simpleMaterials ? new THREE.MeshLambertMaterial({map: roadTex}) : new THREE.MeshStandardMaterial({map: roadTex});
                const g = new THREE.Mesh(pg, pm);
                g.rotation.x = -Math.PI/2; g.position.y = -0.1;
                g.receiveShadow = true;
                scene.add(g);

                const boxGeo = new THREE.BoxGeometry(1,1,1);
                const wallOffX = w * BLOCK_SIZE / 2, wallOffZ = h * BLOCK_SIZE / 2;
                for (let z = 0; z < h; z++) {
                    for (let x = 0; x < w; x++) {
                        if (mapGrid[z][x] === '#') {
                            const height = Math.random() * 25 + 5;
                            const buildTex = createProceduralTexture('building');
                            buildTex.repeat.set(BLOCK_SIZE/10, height/10);
                            const roofTex = createProceduralTexture('roof');
                            const sideMat = new (gameParams.simpleMaterials ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial)({map: buildTex});
                            const roofMat = new (gameParams.simpleMaterials ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial)({map: roofTex});
                            const materials = [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat];
                            const mesh = new THREE.Mesh(boxGeo, materials);
                            mesh.scale.set(BLOCK_SIZE, height, BLOCK_SIZE);
                            const wx = (x * BLOCK_SIZE) - wallOffX;
                            const wz = (z * BLOCK_SIZE) - wallOffZ;
                            mesh.position.set(wx, height/2, wz);
                            mesh.castShadow = true; mesh.receiveShadow = true;
                            scene.add(mesh);
                            const body = world.createBody(pl.Vec2(wx, wz));
                            body.createFixture(pl.Box(BLOCK_SIZE/2, BLOCK_SIZE/2), { filterCategoryBits: CAT_WALL });
                        }
                    }
                }
            }

            let sx = 5, sz = 0;
            if(type !== 'default' && roadTiles.length > 0) {
                 const s = roadTiles[Math.floor(roadTiles.length/2)];
                 sx = s.x; sz = s.z;
            }
            player1 = new Car(sx, sz, true, 1, loadedTextures[0]);
            entities.push(player1); 
            
            if (numPlayers === 2) {
                let s2x = sx - 5, s2z = sz;
                if (type !== 'default' && roadTiles.length > 1) {
                    const neighbors = roadTiles.filter(t => Math.abs(t.x - sx) <= BLOCK_SIZE && Math.abs(t.z - sz) <= BLOCK_SIZE && (t.x !== sx || t.z !== sz));
                    if (neighbors.length > 0) {
                        s2x = neighbors[0].x;
                        s2z = neighbors[0].z;
                    } else {
                        s2x = sx; 
                        s2z = sz + 3; 
                    }
                }
                player2 = new Car(s2x, s2z, true, 2, loadedTextures[1]);
                entities.push(player2);
                document.getElementById('p2Score').style.display = 'block';
            } else {
                player2 = null;
                document.getElementById('p2Score').style.display = 'none';
            }
            gameActive = true;
        });
    };

    function toggleMenu(menu) {
        const isHidden = menu.classList.contains('hidden');
        helpMenu.classList.add('hidden');
        customizeMenu.classList.add('hidden');
        optionsMenu.classList.add('hidden');
        mapMenu.classList.add('hidden');
        isMapOpen = false;

        if (isHidden) { 
            menu.classList.remove('hidden'); 
            isPaused = true; 
            if (menu === mapMenu) {
                isMapOpen = true;
                if (player1) {
                    const pos = player1.body.getPosition();
                    mapView.x = pos.x;
                    mapView.z = pos.y;
                }
            }
        } 
        else { isPaused = false; }
    }

    // --- Full Map Controls ---
    const mapCanvas = document.getElementById('fullMapCanvas');
    mapCanvas.addEventListener('mousedown', e => {
        mapDrag.active = true;
        mapDrag.startX = e.clientX;
        mapDrag.startY = e.clientY;
        mapDrag.lastX = e.clientX;
        mapDrag.lastY = e.clientY;
        mapDrag.moved = false;
    });
    window.addEventListener('mousemove', e => {
        if (!mapDrag.active) return;
        const dx = e.clientX - mapDrag.lastX;
        const dy = e.clientY - mapDrag.lastY;
        if (Math.abs(e.clientX - mapDrag.startX) > 3 || Math.abs(e.clientY - mapDrag.startY) > 3) {
            mapDrag.moved = true;
        }
        mapView.x -= dx / mapView.zoom;
        mapView.z -= dy / mapView.zoom;
        mapDrag.lastX = e.clientX;
        mapDrag.lastY = e.clientY;
    });
    
    window.addEventListener('mouseup', () => {
        if (!mapDrag.active) return;
        mapDrag.active = false;
    });

    mapCanvas.addEventListener('dblclick', e => {
        if (!isMapOpen) return;
        
        const rect = mapCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = mapView.x + (mouseX - rect.width/2) / mapView.zoom;
        const worldZ = mapView.z + (mouseY - rect.height/2) / mapView.zoom;
        
        const tileX = Math.round(worldX / BLOCK_SIZE) * BLOCK_SIZE;
        const tileZ = Math.round(worldZ / BLOCK_SIZE) * BLOCK_SIZE;
        const key = `${tileX},${tileZ}`;
        
        if (roadLookup[key]) {
            destinationKey = key;
            destinationCoord = { x: tileX, z: tileZ };
            forcePathRecompute = true;
        }
    });

    mapCanvas.addEventListener('wheel', e => {
        if (!isMapOpen) return;
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
        mapView.zoom *= zoomDelta;
        mapView.zoom = Math.max(0.2, Math.min(mapView.zoom, 10));
    });

    // --- Menus & Inputs Binding ---
    document.getElementById('mapButton').onclick = () => toggleMenu(mapMenu);
    document.getElementById('customizeButton').onclick = () => toggleMenu(customizeMenu);
    document.getElementById('helpButton').onclick = () => toggleMenu(helpMenu);
    document.querySelector('.close-help').onclick = () => toggleMenu(helpMenu);
    document.querySelector('.close-customize').onclick = () => toggleMenu(customizeMenu);
    document.querySelector('.close-options').onclick = () => toggleMenu(optionsMenu);
    document.querySelector('.close-map').onclick = () => toggleMenu(mapMenu);
    document.getElementById('newGameButton').onclick = () => location.reload();
    document.getElementById('restartCurrentButton').onclick = () => window.startGameWithMap(currentMapType);
    
    const btnOld = document.getElementById('physOldBtn');
    const btnNew = document.getElementById('physNewBtn');
    const txtInfo = document.getElementById('physInfoText');
    
    btnOld.onclick = () => {
        physicsMode = 'old';
        btnOld.classList.add('active'); btnNew.classList.remove('active');
        txtInfo.innerText = "Old: Classic Arcade. Sticky turns, tap to steer.";
    };
    btnNew.onclick = () => {
        physicsMode = 'new';
        btnNew.classList.add('active'); btnOld.classList.remove('active');
        txtInfo.innerHTML = "New: Drifting, tire marks, spin-outs.<br>Spacebar to Handbrake.";
    };

    window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'KeyM') toggleMenu(mapMenu);
        if (e.code === 'KeyC') toggleMenu(customizeMenu);
        if (e.code === 'KeyH') toggleMenu(helpMenu);
        if (e.code === 'KeyO') toggleMenu(optionsMenu);
    });

    // Shadow Select Handlers
    const mainShadowSel = document.getElementById('mainShadowSelect');
    const custShadowSel = document.getElementById('custShadowSelect');
    if (mainShadowSel) mainShadowSel.onchange = (e) => setShadowMode(e.target.value);
    if (custShadowSel) custShadowSel.onchange = (e) => setShadowMode(e.target.value);

    document.getElementById('headlightsToggle').onchange = (e) => gameParams.headlightsEnabled = e.target.checked;
    document.getElementById('lowResToggle').onchange = (e) => renderer.setPixelRatio(e.target.checked ? 0.5 : window.devicePixelRatio);
    document.getElementById('litePhysicsToggle').onchange = (e) => { velIter = e.target.checked ? 2 : 8; posIter = e.target.checked ? 1 : 3; };
    document.getElementById('simpleMatToggle').onchange = (e) => gameParams.simpleMaterials = e.target.checked;
    document.getElementById('particlesToggle').onchange = (e) => gameParams.particlesEnabled = e.target.checked;
    document.getElementById('topDownToggle').onchange = (e) => gameParams.topDownMode = e.target.checked;
    document.getElementById('camRotateToggle').onchange = (e) => gameParams.cameraRotate = e.target.checked;
    document.getElementById('camHeightSlider').oninput = (e) => { gameParams.cameraHeight = parseInt(e.target.value); document.getElementById('camHeightValue').innerText = e.target.value; };
    document.getElementById('fovSlider').oninput = (e) => { gameParams.cameraFOV = parseInt(e.target.value); document.getElementById('fovValue').innerText = e.target.value; };
    document.getElementById('aiModeSelect').onchange = (e) => gameParams.aiMode = e.target.value;
    
    if(document.getElementById('aiRouteSelect')) {
        document.getElementById('aiRouteSelect').onchange = (e) => gameParams.aiRoute = e.target.value;
    }
    
    const updateSlider = (id, paramKey, displayId) => {
        const el = document.getElementById(id);
        if(el) el.oninput = (e) => { gameParams[paramKey] = parseInt(e.target.value); document.getElementById(displayId).innerText = parseInt(e.target.value); };
    };
    updateSlider('playerSpeedSlider', 'playerSpeed', 'playerSpeedValue');
    updateSlider('enemySpeedSlider', 'enemySpeed', 'enemySpeedValue');
    updateSlider('densitySlider', 'trafficCount', 'densityValue');

    // --- FULLSCREEN SCALING LOGIC & MOBILE CONTROLS ---
    const mobileToggleBtn = document.getElementById('mobile-btn');
    const mobileControls = document.getElementById('mobile-controls');
    const mobileLeftBtn = document.getElementById('mobile-left');
    const mobileRightBtn = document.getElementById('mobile-right');
    const mobileUpBtn = document.getElementById('mobile-up');
    const mobileDownBtn = document.getElementById('mobile-down');
    const screenElement = document.getElementById("screen");

    window.scaleGame = function() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

        if (isFullscreen) {
            const scale = Math.min(
                window.innerWidth / BASE_WIDTH,
                window.innerHeight / BASE_HEIGHT
            );
            screenElement.style.width = `${BASE_WIDTH}px`;
            screenElement.style.height = `${BASE_HEIGHT}px`;
            screenElement.style.transform = `scale(${scale})`;
            document.body.classList.add('mobile-mode');
            
            renderer.setSize(BASE_WIDTH, BASE_HEIGHT);
            if (uiCanvas) {
                uiCanvas.width = BASE_WIDTH;
                uiCanvas.height = BASE_HEIGHT;
            }
        } else {
            screenElement.style.width = '100vw';
            screenElement.style.height = '100vh';
            screenElement.style.transform = 'none'; 
            document.body.classList.remove('mobile-mode');
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (uiCanvas) {
                uiCanvas.width = window.innerWidth;
                uiCanvas.height = window.innerHeight;
            }
        }
    };

    function goFull() {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }

    window.addEventListener("fullscreenchange", scaleGame);
    window.addEventListener("webkitfullscreenchange", scaleGame);
    
    scaleGame();
    
    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', goFull);
    }

    function setupMobileControls() {
        if (!mobileControls) return;

        const addControlListener = (element, keyCode) => {
            if (!element) return;
            const pressKey = (e) => {
                if(e.cancelable) e.preventDefault(); 
                keys[keyCode] = true;
            };
            const releaseKey = (e) => {
                if(e.cancelable) e.preventDefault();
                keys[keyCode] = false;
            };

            element.addEventListener('touchstart', pressKey, { passive: false });
            element.addEventListener('touchend', releaseKey, { passive: false });
            element.addEventListener('touchcancel', releaseKey, { passive: false });
            
            element.addEventListener('mousedown', pressKey);
            element.addEventListener('mouseup', releaseKey);
            element.addEventListener('mouseleave', (e) => {
                if (e.buttons === 1) { releaseKey(e); }
            });
        };

        addControlListener(mobileLeftBtn, 'ArrowLeft');
        addControlListener(mobileRightBtn, 'ArrowRight');
        addControlListener(mobileUpBtn, 'ArrowUp');
        addControlListener(mobileDownBtn, 'ArrowDown');
        addControlListener(document.getElementById('mobile-handbrake'), 'Space');
    }

    setupMobileControls();
});
