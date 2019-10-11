import express from 'express';
import path from 'path';
import hasha from 'hasha';

import config from './config';

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'assets/views'));
app.use(express.static('assets'));

app.get('/', (req, res) => {
    res.render('index', {
        content: req.headers['user-agent'],
    });
});

app.get('/hash', (req, res) => {
    console.log(req.query);
    res.send(hasha(JSON.stringify(req.query), { algorithm: 'md5' }));
});

app.listen(config.port, () => console.log('Running on port ' + config.port));
