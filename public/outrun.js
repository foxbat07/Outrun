// Outrun.js

// essentials
var gui = new dat.GUI();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000000 );
var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
var spriteMap = new THREE.TextureLoader().load("assets/circle-64.png" );
var trackBallControls = new THREE.TrackballControls( camera, renderer.domElement );

var strDownloadMime = "image/octet-stream";

// set time and clocks
var date = new Date();
var currentMillis = date.getMilliseconds();
var currentTime = date.getTime();
var clock = new THREE.Clock();


renderer.setSize( window.innerWidth, window.innerHeight );
renderer.gammaInput = true;
renderer.gammaOutput = true;
document.body.appendChild( renderer.domElement );

// dat.gui
var controls = new function() {
    this.sunColor = 0xd700ca;
    this.sunLightColor = 0x000000;
    this.fogColor = 0xeb2df7;
    this.fogDensity = 2; //  dividing by 100000
    this.terrainEmissiveColor = 0x000000;
    this.terrainBaseColor = 0x000000;
    this.wireframeEmissiveColor = 0x00aaff;
    this.wireframeColor = 0x000000;
    this.showWireframe = true;
    this.showBaseTerrain = true;
    this.pathWidth = 2;
    this.elevate = 100;
    this.baseHeight = 600;
    this.amplitude = 0.1;
    this.speed = 1;
    this.takeImage = function(){ saveAsImage() };
};

var general = gui.addFolder('Outrun | Mohit Hingorani');

general.addColor(controls, 'sunColor').name('Sun Base Color');
general.addColor(controls, 'sunLightColor').name('Sun Light Color');

general.addColor(controls, 'fogColor').name('Fog Color');
general.add(controls, 'fogDensity',0,5).name('Fog Density');

var meshFolder = gui.addFolder('Mesh');
meshFolder.add(controls, 'showBaseTerrain').name('Show Base Terrain');
meshFolder.addColor(controls, 'terrainEmissiveColor').name('Terrain Emissive Color');
meshFolder.addColor(controls, 'terrainBaseColor').name('Terrain Color');

meshFolder.add(controls, 'showWireframe').name('Show Wireframe');
meshFolder.addColor(controls, 'wireframeEmissiveColor').name('Wire Emissive Color');
meshFolder.addColor(controls, 'wireframeColor').name('Wireframe Color');

meshFolder.add(controls, 'pathWidth',0,25).name('Path Width');
meshFolder.add(controls, 'elevate', 1, 1000).name('Hill Height');
meshFolder.add(controls, 'baseHeight', 0, 2000).name('Plain Height');

var utilityFolder = gui.addFolder('Utility Folder');
utilityFolder.add(controls, 'takeImage').name('Take Screenshot');
utilityFolder.add(controls, 'amplitude', 0,1).name('Amplitude');
utilityFolder.add(controls, 'speed', 0, 5).name('Speed');

general.open();
meshFolder.open();

// intialize three
var segmentLength = 200;
var w = 5000;
var h = 10000;
var ws = w/segmentLength;
var hs = h/segmentLength;



// initialize lights
// var ambientLight = new THREE.AmbientLight(controls.ambientLight);
// scene.add( ambientLight );

var sunGeometry = new THREE.CircleBufferGeometry( 3000, 32 );
var sunLight = new THREE.PointLight( controls.sunLightColor, 2, 50 );
var sunMaterial = new THREE.MeshBasicMaterial({ color: controls.sunColor, fog: false });
sunLight.add( new THREE.Mesh( sunGeometry, sunMaterial ) );
sunLight.position.set( 0, 100, -10000 );
scene.add( sunLight );


var perlin = new THREE.ImprovedNoise();
const loader = new THREE.TextureLoader();
const skyBoxTexture = loader.load('assets/outrun-small3.jpg');
var distantFog = new THREE.FogExp2( controls.fogColor, controls.fogDensity/1000 );
var terrainGeometry = new THREE.PlaneGeometry( w,h,ws-1,hs-1); // - 1 since it uses segments - keeps the math straight

terrainGeometry.rotateX( - Math.PI / 2 );
terrainGeometry.translate(-(w/ws)/2,0, 0);

var terrainMaterial = new THREE.MeshPhongMaterial( { color: controls.terrainBaseColor, emissive: controls.terrainEmissiveColor, side: THREE.DoubleSide, transparent: true } ) 
var wireframeMaterial = new THREE.MeshPhongMaterial( { color: controls.wireframeColor, emissive: controls.wireframeEmissiveColor, wireframe: true } )

function attenuate (i) {
    var position = Math.abs((i%ws) - ws/2);
    var positionWithPath = Math.max(0,position-controls.pathWidth);
    var height = positionWithPath * controls.elevate;
    return height;
}

var baseTerrainMesh = new THREE.Mesh( terrainGeometry, terrainMaterial );
var wireframeTerrainMesh = new THREE.Mesh( terrainGeometry, wireframeMaterial );

// var quadGeoemetry = terrainGeometry.clone();

// var lineSegementMeshes = [];
// var lineGeometries  = [];
// var lineGroup = new THREE.Group();
// var lineMaterial = new THREE.LineBasicMaterial({color: '#00ffff', linewidth: 1});

// for (var i = 0; i < terrainGeometry.vertices.length; i+=ws) {
    //     var tempGeometry = new THREE.Geometry();
    //     var tempVertexArray = terrainGeometry.vertices.slice(i, i + ws);
    //     tempGeometry.vertices = tempVertexArray;
    //     tempGeometry.name = i;
    
    //     lineGeometries.push(tempGeometry);
    // }
    
    // console.log(lineGeometries);
    
    // for ( var i = 0 ; i < lineGeometries.length; i++ ){
        //     lineSegementMeshes.push(new THREE.Line( lineGeometries[i], lineMaterial ))
        //     lineSegementMeshes.position =  new THREE.Vector3(100,100,100);
        //     lineGroup.add(lineSegementMeshes[i]);
        // }
        
        
        // terrainGeometry.verticesNeedUpdate = true;
        // console.log('vertex',vertex);
        // camera.lookAt(new THREE.Vector3(0,0,0));
        
init();
animate();

function init(){

    camera.position.set(0,0,3500);
    
    trackBallControls.rotateSpeed = 5;
    trackBallControls.zoomSpeed = 2;

    
    scene.add(wireframeTerrainMesh);
    scene.add( baseTerrainMesh );
    
}

function animate() {
    requestAnimationFrame(animate);
    
    distantFog.color.setHex(controls.fogColor);
    distantFog.density = controls.fogDensity/10000;

    sunLight.color.setHex(controls.sunLightColor);
    sunMaterial.color.setHex(controls.sunColor);
    // console.log(sunLight);

    terrainMaterial.color.setHex(controls.terrainBaseColor);
    terrainMaterial.emissive.setHex(controls.terrainEmissiveColor);
    
    wireframeMaterial.color.setHex(controls.wireframeColor) ;
    wireframeMaterial.emissive.setHex(controls.wireframeEmissiveColor);
    
    var delta = clock.getDelta();
    var time = clock.getElapsedTime();
    
    for (let i = 0 ; i < terrainGeometry.vertices.length ; i++ ) {
        var x = i % ws
        var y = (parseInt(i/ws))/hs;
        var localNoise = Math.abs(perlin.noise(x,y,i));
        var randomNoise = controls.amplitude * perlin.noise(i,x,y * Math.cos(controls.speed*time));
        // var randomNoise = controls.amplitude * (perlin.noise(Math.cos(time * y * controls.speed),(time * controls.speed),Math.sin(time * x * controls.speed)))

        terrainGeometry.vertices[i].y = (localNoise + randomNoise) * attenuate(i) - controls.baseHeight;
        // terrainGeometry.vertices[i].y = (Math.abs(perlin.noise(x,y,i)) + controls.amplitude * Math.sin((time+i)/controls.speed)) * attenuate(i) - controls.baseHeight;
    }
    terrainGeometry.verticesNeedUpdate = true;
    
    trackBallControls.update(delta);
    render();
};

function render() { 
    scene.background = skyBoxTexture;
    scene.fog = distantFog;

    baseTerrainMesh.visible = controls.showBaseTerrain;
    wireframeTerrainMesh.visible =controls.showWireframe;
    
    renderer.render( scene, camera );
}

window.addEventListener( 'resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}, false );

function saveAsImage() {
    var imgData, imgNode;

    try {
        var strMime = "image/jpeg";
        imgData = renderer.domElement.toDataURL(strMime);
        var fileName = 'outrun-image-' + currentTime;
        saveFile(imgData.replace(strMime, strDownloadMime), fileName);

    } catch (e) {
        console.log(e);
        return;
    }

}

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}