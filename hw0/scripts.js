/*
 * CSCI-712 Assignment 0: Framework
 * Ram Zallan
 */

const CANVAS_SIZE = 500;
const DURATION = 20; // 20sec animation
const ROTATION = 2 * Math.PI;

// Initialization
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(CANVAS_SIZE, CANVAS_SIZE);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({ color: 0x4eb0e3 });
const cube = new THREE.Mesh(geometry, material);
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-1, 2, 4);
scene.add(light);

cube.scale.normalize()
scene.add( cube );

camera.position.z = 6;

const clock = new THREE.Clock();

function main(obj) {
    function render(now) {
        const time = clock.getElapsedTime();
        console.log(time);
        if (time > 20) {
            return;
        }
        obj.position.x = time / 5;
        obj.position.y = time / 5;
        if (obj.rotation.y <= (2 * Math.PI)) {
            obj.rotation.y = (2 * Math.PI) * time / 18;
        }
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    // Fix shape stretching
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    requestAnimationFrame(render);
}

main(cube);
