
// essentials
var gui = new dat.GUI();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 100000 );
var renderer = new THREE.WebGLRenderer({ antialias: true });
var spriteMap = new THREE.TextureLoader().load("assets/circle-64.png" );

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );



// dat.gui
var controls = new function() {
    this.emissiveColor = 0x000000;
    this.shapeColor1 = 0xffffff;
    this.shapeColor2 = 0x000000;
    this.wireframe = false;
};

var general = gui.addFolder('Outrun | Mohit Hingorani');
general.add(controls, 'wireframe').name('Show Wireframe');
general.addColor(controls, 'shapeColor1').name('Mesh Color 1');
general.addColor(controls, 'shapeColor2').name('Mesh Color 2');
general.addColor(controls, 'emissiveColor').name('Emissive Color');
// general.open();

// initlaize lights
var ambientLight = new THREE.AmbientLight(0xffffff);
scene.add( ambientLight );

// var lights = [];
// lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
// lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
// lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

// lights[ 0 ].position.set( 0, 200, 0 );
// lights[ 1 ].position.set( 100, 200, 100 );
// lights[ 2 ].position.set( - 100, - 200, - 100 );

// scene.add( lights[ 0 ] );
// scene.add( lights[ 1 ] );
// scene.add( lights[ 2 ] );
            

// intialize three
var w =16384;
var h =16384;
var ws = 50;
var hs = 50;
var pathWidth = 2;
var elevate = 200;

var trackBallControls = new THREE.TrackballControls( camera, renderer.domElement );
var perlin = new THREE.ImprovedNoise();
const loader = new THREE.TextureLoader();
const skyBoxTexture = loader.load('assets/outrun.jpg');


var terrainGeometry = new THREE.PlaneGeometry( w,h,ws-1,hs-1); // - 1 since it uses segments - keeps the math straight

// var terrainMaterial = new THREE.MeshBasicMaterial( { color: '#001122', wireframe: false } ) 
var terrainMaterial = new THREE.MeshLambertMaterial( { color: '#001122', emissive: '#ffffff', side: THREE.DoubleSide, alphaMap: spriteMap, transparent: true } ) 
// var wireframeMaterial = new THREE.MeshBasicMaterial( { color: '#00afff', wireframe: true } )
var wireframeMaterial = new THREE.MeshLambertMaterial( { color: '#0077dd', emissive: '#0022ff', wireframe: true } )

function attenuate (i) {
    var position = Math.abs((i%ws) - ws/2);
    var positionWithPath = Math.max(0,position-pathWidth);
    var height = positionWithPath * elevate;
    return height;
}

for (let i = 0 ; i < terrainGeometry.vertices.length ; i++ ) {
    var x = i % ws
    var y = (parseInt(i/ws))/hs;
    terrainGeometry.vertices[i].z = Math.abs(perlin.noise(x,y,0.8*Math.random())) * attenuate(i);
}

terrainMaterial.alphaMap.repeat.set(50,50)

var baseTerrainMesh = new THREE.Mesh( terrainGeometry, terrainMaterial );
var wireframeTerrainMesh = new THREE.Mesh( terrainGeometry, wireframeMaterial );


// var quadGeoemetry = terrainGeometry.clone();

// var lineGeometries  = [];

// for (var i = 0; i < terrainGeometry.vertices.length; i+=ws) {
//     var tempGeometry = new THREE.Geometry();
//     var tempVertexArray = terrainGeometry.vertices.slice(i, i + ws);
//     tempGeometry.vertices = tempVertexArray;
//     tempGeometry.name = i;
//     lineGeometries.push(tempGeometry);
// }

// console.log(lineGeometries);

// var lineSegementMeshes = [];
// for ( var i = 0 ; i < l )

// terrainGeometry.verticesNeedUpdate = true;
// console.log('vertex',vertex);
// camera.lookAt(new THREE.Vector3(0,0,0));

init();
animate();

function init(){

    // terrainGeometry.translate(0,0,-1000);
    terrainGeometry.rotateX( - Math.PI / 2.3);
    
    // camera.position.set(0,400,5000);
    camera.position.set(0,0,5000);
    // camera.position.z = 1000;
    
    trackBallControls.rotateSpeed = 5;
    trackBallControls.zoomSpeed = 2;
    // scene.add(wireframeTerrainMesh);
    scene.add( baseTerrainMesh );

}

function animate() {
    requestAnimationFrame(animate);
    trackBallControls.update();
    render();
};

function render() { 
    scene.background = skyBoxTexture;
    // console.log(camera.position);
    renderer.render( scene, camera );
}

window.addEventListener( 'resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}, false );

