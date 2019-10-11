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

function init() {
    console.log(navigator.userAgent);
    const data = {
        width: $(window).width(),
        height: $(window).height(),
        datetime: new Date().getTime(),
        useragent: navigator.userAgent,
    };
    let hash;
    getUserLocation()
        .then((position) => {
            getHash({ ...data, position: position.coords });
        })
        .catch((error) => {
            getHash(data);
        });
}

$(document).ready(init);
