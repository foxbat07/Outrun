// Outrun.js

// essentials
var gui = new dat.GUI();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000000 );
var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
const loader = new THREE.TextureLoader();
var spriteMap = loader.load("assets/circle-64.png" );
const skyBoxTexture = loader.load('assets/outrun-small3.jpg');

var perlin = new THREE.ImprovedNoise();
var strDownloadMime = "image/octet-stream";

// set time and clocks
var date = new Date();
var startMillis = date.getMilliseconds();
var currentTime = date.getTime();
var clock = new THREE.Clock();
clock.start();


renderer.setSize( window.innerWidth, window.innerHeight );
renderer.gammaInput = true;
renderer.gammaOutput = true;
document.body.appendChild( renderer.domElement );

var trackBallControls = new THREE.TrackballControls( camera, renderer.domElement );

// dat.gui

var controls = new function() {

    this.takeImage = function(){ saveAsImage() };
    this.backgroundColor = 0x040437;

    this.sunColor = 0xd700ca;
    this.sunLightColor = 0x000000;
    this.sunSize = 1;
    this.sunInclination = 0;

    this.starColor = 0xffffff;
    this.starSize = 50;
    this.starDensity = 10000;

    this.fogColor = 0xeb2df7;
    this.fogDensity = 2; //  dividing by 100000

    this.terrainEmissiveColor = 0x000000;
    this.terrainBaseColor = 0x000000;
    this.wireframeEmissiveColor = 0x00aaff;
    this.wireframeColor = 0x000000;
    this.showWireframe = true;
    this.showBaseTerrain = true;
    this.pathWidth = 1.5;
    this.elevate = 1;
    this.baseHeight = 600;

    this.amplitude = 100;
    this.frequency = 0.1;
};

var general = gui.addFolder('Outrun | Mohit Hingorani');
general.add(controls, 'takeImage').name('Take Screenshot');
general.addColor(controls, 'backgroundColor').name('Background Color');
general.open();

var sunFolder = gui.addFolder('Sun');
sunFolder.addColor(controls, 'sunColor').name('Sun Fill Color');
sunFolder.addColor(controls, 'sunLightColor').name('Sun Reflect Color');
sunFolder.add(controls, 'sunSize',0.001,5).name('Sun Scale');
sunFolder.add(controls, 'sunInclination',-10,10).name('Sun Inclination');

var starFolder = gui.addFolder('Stars');
starFolder.addColor(controls, 'starColor').name('Star Color');
starFolder.add(controls, 'starSize',1,250).name('Star Size');
// starFolder.add(controls, 'starDensity',100,10000).name('Star Density');

var fogFolder = gui.addFolder('Fog');
fogFolder.addColor(controls, 'fogColor').name('Fog Color');
fogFolder.add(controls, 'fogDensity',0,5).name('Fog Density');

var meshFolder = gui.addFolder('Terrain');
meshFolder.add(controls, 'showBaseTerrain').name('Show Base Terrain');
meshFolder.addColor(controls, 'terrainEmissiveColor').name('Terrain Emissive Color');
meshFolder.addColor(controls, 'terrainBaseColor').name('Terrain Color');

meshFolder.add(controls, 'showWireframe').name('Show Wireframe');
meshFolder.addColor(controls, 'wireframeEmissiveColor').name('Wire Emissive Color');
meshFolder.addColor(controls, 'wireframeColor').name('Wireframe Color');

meshFolder.add(controls, 'pathWidth',0,15).name('Path Width');
meshFolder.add(controls, 'elevate', 0, 5).name('Hill Height');
meshFolder.add(controls, 'baseHeight', 0, 2000).name('Drop Plane');
meshFolder.open();

var utilityFolder = gui.addFolder('Animation');
utilityFolder.add(controls, 'amplitude', 0,1000).name('Amplitude');
utilityFolder.add(controls, 'frequency', 0, 5).name('Frequency');

// intialize three

var segmentLength = 200;
var w = 5000;
var h = 10000;
var ws = w/segmentLength;
var hs = h/segmentLength;
var sunSizeBase = 4000;
var sunPositionMultiplier = 1500;
var sunZPosition = -10000;



// initialize star
var particles = 2000;
var positions = [];
var n = 100000, n2 = n / 2;
var starGeometry = new THREE.BufferGeometry();

for ( var i = 0; i < particles; i ++ ) {
    var x = Math.random() * n - n2;
    var y = Math.random() * n - n2;
    var z = -11000;

    positions.push( x, y, z );
}

starGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
var starMaterial = new THREE.PointsMaterial( { 
    color: 0xffffff,
    depthTest: true,
    fog: false,
    map: spriteMap,
    size: 100,
    sizeAttentuation: false,
} );
var stars = new THREE.Points( starGeometry, starMaterial );



// initialize Sun
var sunGeometry = new THREE.CircleBufferGeometry( sunSizeBase, 64 );
var sunLight = new THREE.PointLight( controls.sunLightColor, 2, 50 );
var sunMaterial = new THREE.MeshBasicMaterial({ color: controls.sunColor, fog: false });
sunLight.add( new THREE.Mesh( sunGeometry, sunMaterial ) );
sunLight.position.set( 0, controls.sunInclination * sunPositionMultiplier, sunZPosition );


// initalize fog
var distantFog = new THREE.FogExp2( controls.fogColor, controls.fogDensity/1000 );


// initialize terrain

var terrainGeometry = new THREE.PlaneGeometry( w,h,ws-1,hs-1); // - 1 since it uses segments - keeps the math straight
terrainGeometry.rotateX( - Math.PI / 2 );
terrainGeometry.translate(-(w/ws)/2,0, 0);

var terrainMaterial = new THREE.MeshPhongMaterial( { color: controls.terrainBaseColor, emissive: controls.terrainEmissiveColor, side: THREE.DoubleSide, transparent: true } ) 
var wireframeMaterial = new THREE.MeshPhongMaterial( { color: controls.wireframeColor, emissive: controls.wireframeEmissiveColor, wireframe: true } )

var baseTerrainMesh = new THREE.Mesh( terrainGeometry, terrainMaterial );
var wireframeTerrainMesh = new THREE.Mesh( terrainGeometry, wireframeMaterial );


// generate terrain

function attenuate (i) {
    var position = Math.abs((i%ws) - ws/2);
    var positionWithPath = Math.max(0,position-controls.pathWidth);
    var height = positionWithPath * controls.elevate;
    return height;
}

function generateHeight( size ) {
    var data = new Uint8Array( size ), quality = 1;
    for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < size; i ++ ) {
            var x = i % ws
            var y = (parseInt(i/ws))/hs;
            var z = perlin.noise(x,y, i * startMillis/1000); //startMillis helps keep things random on each initialize
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z )) * quality;
        }
        quality *= 5;
    }

    var modulate = clock.getElapsedTime() * controls.frequency / 1000;
    var modulateFactor = 10;
    for ( var i = 0; i < size; i ++ ) {
        var x = i % ws
        var y = (parseInt(i/ws))/hs;
        var z = perlin.noise(i * modulate , x, y);
        data[ i ] += Math.abs( perlin.noise( modulateFactor * Math.sin(modulate), modulateFactor * Math.cos(modulate), z )) * controls.amplitude;
    }
    quality *= 5;

    return data;
}

// trigger threejs function starts

init();
animate();

// threejs init function

function init(){

    camera.position.set(0,0,4000);
    
    trackBallControls.rotateSpeed = 4;
    trackBallControls.zoomSpeed = 1;

    scene.add(wireframeTerrainMesh);
    scene.add( baseTerrainMesh );
    scene.add( sunLight );
    scene.add( stars );
}

// threejs animate function

function animate() {
    requestAnimationFrame(animate);
    
    distantFog.color.set(controls.fogColor); // not using Hex on purpose
    distantFog.density = controls.fogDensity/10000;

    sunLight.color.setHex(controls.sunLightColor);
    sunMaterial.color.setHex(controls.sunColor);
    sunLight.position.set( 0, controls.sunInclination * sunPositionMultiplier, -10000 );
    sunLight.scale.x = controls.sunSize;
    sunLight.scale.y = controls.sunSize;

    starMaterial.color.setHex(controls.starColor);
    starMaterial.setValues({size: controls.starSize});

    terrainMaterial.color.setHex(controls.terrainBaseColor);
    terrainMaterial.emissive.setHex(controls.terrainEmissiveColor);
    
    wireframeMaterial.color.setHex(controls.wireframeColor) ;
    wireframeMaterial.emissive.setHex(controls.wireframeEmissiveColor);
    
    //generate terrain
    var newHeight = generateHeight(terrainGeometry.vertices.length);
    for ( var i = 0; i < terrainGeometry.vertices.length; i ++ ) {
        terrainGeometry.vertices[i].y = newHeight[i]  * attenuate(i) - controls.baseHeight ;
    }

    terrainGeometry.verticesNeedUpdate = true;
    
    trackBallControls.update();
    render();
};


// threejs render function

function render() { 
    // scene.background = skyBoxTexture;
    scene.background = new THREE.Color(controls.backgroundColor);
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


// Image saving

function saveAsImage() {
    var imgData, imgNode;

    try {
        var strMime = "image/jpeg";
        imgData = renderer.domElement.toDataURL(strMime);
        var fileName = 'outrun-image-' + currentTime+ '.jpg';
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


            // // generateHeight();
    // var time = clock.getElapsedTime();
    // for (let i = 0 ; i < terrainGeometry.vertices.length ; i++ ) {
    //     var x = i % ws
    //     var y = (parseInt(i/ws))/hs;
    //     var z = perlin.noise(x,y, i * currentMillis/10000);
    //     var localNoise = Math.abs(perlin.noise(x,y,z));
    //     // var randomNoise = controls.amplitude * perlin.noise(i,x,y * Math.cos(controls.speed*time));
    //     // var randomNoise = controls.amplitude * (perlin.noise(Math.cos(time * y * controls.speed),(time * controls.speed),Math.sin(time * x * controls.speed)))

    //     terrainGeometry.vertices[i].y = (localNoise) * attenuate(i) - controls.baseHeight;
    //     // terrainGeometry.vertices[i].y = (Math.abs(perlin.noise(x,y,i)) + controls.amplitude * Math.sin((time+i)/controls.speed)) * attenuate(i) - controls.baseHeight;
    // }