
const SHAPES = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.ConeGeometry(1, 1.5, 8),
    'torus',
    'teapot', // lat < -30,
    'cylinder',
    'cone',
];

const TRANSLATION_TYPES = [
    'none',
    'up-and-down',
    'left-and-right',
    'all-around',
];

const ROTATION_AXES = [
    'x',
    'y',
    'z',
];

const ROTATION_TYPES = [
    'none',
    'constant',
    'back-and-forth',
];

const SCALE_TYPES = [
     'pulsating',
     'none',
];

const TRANSLATION_BOUND = 1;

function getOptions(info) {
    const options = {};

    if (!info.position) {
        options.primaryShape = SHAPES[3];
    } else if (info.position.latitude > 30) {
        options.primaryShape = SHAPES[0];
    } else if (info.position.latitude > -30) {
        options.primaryShape = SHAPES[1];
    } else {
        options.primaryShape = SHAPES[2];
    }

    options.primaryColor = `hsl(${new Date().getTime() % 255}, 50%, 50%)`;

    options.primaryTranslation = info.width < info.height ? TRANSLATION_TYPES[1] : TRANSLATION_TYPES[2];

    return options;
}

function getUserLocation() {
    if (navigator.geolocation) {
        return new Promise(
            (resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject)
        )
    } else {
        return new Promise(
            resolve => resolve({})
        )
    }
}

function getHash(data) {
    $.get('/hash/', data)
    .done((hash) => {
        console.log('Hash: ' + JSON.stringify(hash));
        $('p#content')
            .html('Your unique hash is')
            .after(`<strong>${hash}</strong>`);
    })
    .fail((err) => {
        console.log('Error: ' + JSON.stringify(error));
    });
}

function animate(options) {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const primaryGeometry = options.primaryShape;
    const primaryMaterial = new THREE.MeshPhongMaterial({ color: options.primaryColor });
    const primary = new THREE.Mesh(primaryGeometry, primaryMaterial);
    scene.add(primary);

    const camera = new THREE.PerspectiveCamera(45, width / height);
    camera.position.y = 2;
    camera.position.z = 6;
    camera.lookAt(primary.position);

    scene.add(camera);

    const pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(0, 5, 10);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const translationAxis = options.primaryTranslation == 'up-and-down' ? 'y' : 'x';
    let translationCoeff = 1;

    function render(options) {
        requestAnimationFrame(render);
        primary.position[translationAxis] += translationCoeff * 0.05;
        if (Math.abs(primary.position[translationAxis]) >= TRANSLATION_BOUND) {
            translationCoeff *= -1;
        }
        renderer.render(scene, camera);
    }

    render();
}

function init() {
    const data = {
        width: $(window).width(),
        height: $(window).height(),
        datetime: new Date().getTime(),
        useragent: navigator.userAgent,
    };
    getUserLocation()
        .then((position) => {
            const options = getOptions({ ...data, position: position.coords });
            animate(options);
            console.log(options);
        })
        .catch((error) => {
            const options = getOptions(data);
            animate(options);
            console.log(options);
        });
}

$(document).ready(init);
