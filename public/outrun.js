
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
    this.ambientLight = 0xffffff;
    // this.ambientLightIntensity = 1;
    this.terrainEmissiveColor = 0x000000;
    this.terrainBaseColor = 0x000911;
    this.wireframeEmissiveColor = 0x00ddff;
    this.wireframeColor = 0x00ddff;
    this.showWireframe = true;
    this.showBaseTerrain = true;
    this.pathWidth = 2;
    this.elevate = 200;
};

var general = gui.addFolder('Outrun');

general.addColor(controls, 'ambientLight').name('ambientLight');

general.addColor(controls, 'terrainEmissiveColor').name('Terrain Emissive Color');
general.addColor(controls, 'terrainBaseColor').name('Terrain Color');
general.add(controls, 'showBaseTerrain').name('Show Base Terrain');

general.addColor(controls, 'wireframeEmissiveColor').name('Wireframe Emissive Color');
general.addColor(controls, 'wireframeColor').name('Wireframe Color');
general.add(controls, 'showWireframe').name('Show Wireframe');

general.add(controls, 'pathWidth',0,25).name('Path Width');
general.add(controls, 'elevate', 1, 1000).name('Elevate');

// general.open();

// initlaize lights
var ambientLight = new THREE.AmbientLight(controls.ambientLight);
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
var w = 5000;
var h = 10000;
var ws = w/100;
var hs = h/100;
// var pathWidth = 2;
// var elevate = 200;

var trackBallControls = new THREE.TrackballControls( camera, renderer.domElement );
var perlin = new THREE.ImprovedNoise();
const loader = new THREE.TextureLoader();
const skyBoxTexture = loader.load('assets/outrun.jpg');


var terrainGeometry = new THREE.PlaneGeometry( w,h,ws-1,hs-1); // - 1 since it uses segments - keeps the math straight

// var terrainMaterial = new THREE.MeshBasicMaterial( { color: '#001122', wireframe: false } ) 
var terrainMaterial = new THREE.MeshLambertMaterial( { color: controls.terrainBaseColor, emissive: controls.terrainEmissiveColor, side: THREE.DoubleSide, transparent: true } ) 
// var wireframeMaterial = new THREE.MeshBasicMaterial( { color: '#00afff', wireframe: true } )
var wireframeMaterial = new THREE.MeshLambertMaterial( { color: controls.wireframeColor, emissive: controls.wireframeEmissiveColor, wireframe: true } )

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
    
    // terrainGeometry.translate(0,0,-1000);
    // terrainGeometry.rotateX( - Math.PI / 2.3);
    
    // camera.position.set(0,400,5000);
    camera.position.set(0,0,5000);
    // camera.position.z = 1000;
    
    trackBallControls.rotateSpeed = 5;
    trackBallControls.zoomSpeed = 2;
    scene.add(wireframeTerrainMesh);
    // scene.add(lineGroup);
    scene.add( baseTerrainMesh );
    
}

function animate() {
    requestAnimationFrame(animate);
    trackBallControls.update();
    
    ambientLight.color.setHex(controls.ambientLight);
    terrainMaterial.color.setHex(controls.terrainBaseColor);
    terrainMaterial.emissive.setHex(controls.terrainEmissiveColor);
    
    wireframeMaterial.color.setHex(controls.wireframeColor) ;
    wireframeMaterial.emissive.setHex(controls.wireframeEmissiveColor);
    
    for (let i = 0 ; i < terrainGeometry.vertices.length ; i++ ) {
        var x = i % ws
        var y = (parseInt(i/ws))/hs;
        terrainGeometry.vertices[i].z = Math.abs(perlin.noise(x,y,i)) * attenuate(i);
    }
    terrainGeometry.verticesNeedUpdate = true;
    // terrainGeometry.rotation(3);
    render();
};

function render() { 
    scene.background = skyBoxTexture;

    baseTerrainMesh.visible = controls.showBaseTerrain;
    wireframeTerrainMesh.visible =controls.showWireframe;

    // console.log(camera.position);
    renderer.render( scene, camera );
}

window.addEventListener( 'resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}, false );

