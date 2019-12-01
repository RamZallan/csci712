/*
 * CSCI-712 Assignment 4a: Particle Systems
 * Ram Zallan
 */

const MOUSE = { x: 0, y: 0 };
const PARTICLES_PER_FRAME = 50; // new particles/frame
const PARTICLE_LIFETIME = 0.4; // seconds
const COMET_RADIUS = 1;
let TRACKING_MOUSE = false;
let lastPosition = new THREE.Vector3();

// Initialization
var scene = new THREE.Scene();

const width = document.body.clientWidth;
const height = document.body.clientHeight - 100;
var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(width, height);
renderer.setClearColor(0x222222);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(70, width / height);
camera.position.copy(new THREE.Vector3(0, 0, 10));

const cometGeo = new THREE.SphereGeometry(COMET_RADIUS, 15, 15);
const cometMat = new THREE.MeshNormalMaterial();
const comet = new THREE.Mesh(cometGeo, cometMat);
comet.position.copy(new THREE.Vector3(-4, 0, 0));
scene.add(comet);

const clock = new THREE.Clock();

const particles = new THREE.Group();

const particiles = new THREE.Group();
const particleGeo = new THREE.SphereGeometry(COMET_RADIUS / 10);
const particleMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true
});

scene.add(particles);

scene.scale.normalize();

function onMouseMove(e) {
    e.preventDefault();
    MOUSE.x = (event.clientX / window.innerWidth) * 2 - 1;
    MOUSE.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Make the sphere follow the mouse
    var vector = new THREE.Vector3(MOUSE.x, MOUSE.y, 0);
    vector.unproject(camera);
    var dir = vector.sub(camera.position).normalize();
    var distance = -camera.position.z / dir.z;
    var pos = camera.position.clone().add(dir.multiplyScalar(distance));

    lastPosition.copy(comet.position);

    comet.position.copy(pos);
}

$("document").ready(() => {
    $("#mouse").click(e => {
        e.preventDefault();
        TRACKING_MOUSE = true;
        document.addEventListener("mousemove", onMouseMove);
        $("#mouse").attr("disabled", true);
        $("#mouse").text("Refresh to revert to circle path");
    });
});

let t = 0;
function main() {
    function render() {
        const time = clock.getElapsedTime();

        if (!TRACKING_MOUSE) {
            t += 0.03;

            lastPosition.copy(comet.position);
            comet.position.x = 8 * Math.cos(t) + 0;
            comet.position.y = 8 * Math.sin(t) + 0;
        }

        for (const particle of particles.children) {
            // remove expired particles
            const age = time - particle.birthtime;
            if (age > PARTICLE_LIFETIME) {
                particles.remove(particle);
            }

            // update position from unitVelocity
            const delta = clock.getDelta();
            const vel = particle.velocity.clone().multiplyScalar(0.2);
            particle.position.add(vel);
            particle.material.opacity = 1.0 - age / PARTICLE_LIFETIME;
        }

        // add new particles
        for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
            const particleMesh = new THREE.Mesh(
                particleGeo,
                new THREE.MeshBasicMaterial({
                    color: `hsl(${Math.random() * 255}, 70%, 50%)`,
                    transparent: true,
                    opacity: 1.0
                })
            );

            const particlePosition = comet.position.clone();
            particlePosition.x +=
                (Math.random() > 0.5 ? -1 : 1) *
                Math.random() *
                (COMET_RADIUS * 0.5);
            particlePosition.y +=
                (Math.random() > 0.5 ? -1 : 1) *
                Math.random() *
                (COMET_RADIUS * 0.5);

            particleMesh.position.copy(particlePosition);

            particleMesh.birthtime = time;

            const cometDirection = comet.position.clone().sub(lastPosition);

            cometDirection.x *= Math.random();
            cometDirection.y *= Math.random();
            cometDirection.normalize();
            const particleVelocity = cometDirection.negate();
            particleMesh.velocity = particleVelocity;
            particles.add(particleMesh);
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

main();
