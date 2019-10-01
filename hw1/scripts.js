/*
 * CSCI-712 Assignment 0: Framework
 * Ram Zallan
 */

class Keyframe {
    constructor(time, x, y, z, xa, ya, za, theta) {
        this.time = time;
        this.x = x;
        this.y = y;
        this.z = z;
        this.xa = xa;
        this.ya = ya;
        this.za = za;
        this.theta = theta;
    }
}

const CANVAS_SIZE = 500;


// From provided input file
const KEYFRAMES = [
    new Keyframe(0, 0.0, 0.0, 0.0, 1.0, 1.0, -1.0, 0.0),
    new Keyframe(1, 4.0, 0.0, 0.0, 1.0, 1.0, -1.0, 30.0),
    new Keyframe(2, 8.0, 0.0, 0.0, 1.0, 1.0, -1.0, 90.0),
    new Keyframe(3, 12.0, 12.0, 12.0, 1.0, 1.0, -1.0, 180.0),
    new Keyframe(4, 12.0, 18.0, 18.0, 1.0, 1.0, -1.0, 270.0),
    new Keyframe(5, 18.0, 18.0, 18.0, 0.0, 1.0, 0.0, 90.0),
    new Keyframe(6, 18.0, 18.0, 18.0, 0.0, 0.0, 1.0, 90.0),
    new Keyframe(7, 25.0, 12.0, 12.0, 1.0, 0.0, 0.0, 0.0),
    new Keyframe(8, 25.0, 0.0, 18.0, 1.0, 0.0, 0.0, 0.0),
    new Keyframe(9, 25.0, 1.0, 18.0, 1.0, 0.0, 0.0, 0.0),
];


// Initialization
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight);
var renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setSize(CANVAS_SIZE, CANVAS_SIZE);
renderer.setClearColor(0x4eb0e3);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(4, 4, 4);
const material = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true});
const cube = new THREE.Mesh(geometry, material);
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-1, 2, 4);
scene.add(light);

cube.scale.normalize()
scene.add(cube);

camera.position.copy(new THREE.Vector3(15, 5, 40));

const clock = new THREE.Clock();

function main(obj) {
    function render(now) {
        const time = clock.getElapsedTime();
        if (time > KEYFRAMES[KEYFRAMES.length - 1].time) return;

        // get applicable keyframes
        const prev = KEYFRAMES[Math.floor(time)];
        const next = KEYFRAMES[Math.floor(time) + 1];

        // time since previous keyframe
        const u = time - prev.time;

        // get keyfrmae positions as vectors
        const pZero = new THREE.Vector3(prev.x, prev.y, prev.z);
        const pOne = new THREE.Vector3(next.x, next.y, next.z);

        // new position = (p1 - p0) * u + p0
        const pU = pOne.sub(pZero).multiplyScalar(u).add(pZero);

        // set new position
        cube.position.copy(pU);

        // get
        const aZero = new THREE.Vector3(prev.xa, prev.ya, prev.za);
        const aOne = new THREE.Vector3(next.xa, next.ya, next.za);

        const qZero = new THREE.Quaternion()
            .setFromAxisAngle(aZero, prev.theta * Math.PI/180)
            .normalize();
        const qOne = new THREE.Quaternion()
            .setFromAxisAngle(aOne, next.theta * Math.PI/180)
            .normalize();

        const qU = qZero
            .slerp(qOne, u)
            .normalize();

        const aU = new THREE.Euler().setFromQuaternion(qU);

        cube.rotation.copy(aU);

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
