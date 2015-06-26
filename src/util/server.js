var browserify = require('browserify-middleware'),
    express = require('express'),
    fs = require('fs'),
    less = require('less-middleware'),
    path = require('path'),
    ractive = require('ractive-render'),
    LRU = require('lru-cache'),
    request = require('request');

var app = express();

ractive.config({
    stripComments: false
});

app.engine('html', ractive.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/../');

app.get('/', function(req, res) {
    // script.render(function (content) {
        res.render('index.html', {
            imgPath: 'img/',
            scriptPath: 'script/',
            stylePath: 'style/',
            commonPath: 'script/lib/dev/',
           // content: content,
            stripComments: false,
            preserveWhitespace: true
        });
    // });
});

cache = LRU(500);

// proxies streamtext
app.get('/text',function (req, res, next) {
    var e = req.query.event;

    // || e.indexOf('SRCCON2015') === -1
    if (typeof e == 'undefined' || e === null || !e.match(/^[A-Za-z0-9]{1,40}$/)) {
        res.end();
        return;
    }

    e = encodeURIComponent(e);

    var p = req.query.last;

    if (typeof p == 'undefined' || p === null || !p.match(/^(-|)[0-9]{1,10}$/)) {
        res.end();
        return;
    }

    p = parseInt(p);

    var l = req.query.language || 'en';

    if (typeof l == 'undefined' || l === null || ['en','fr'].indexOf(l) === -1) {
        res.end();
        return;
    }
/*
    var r = cache.get(e+p+l);

    if (r) {
        res.send(r);
    }
    else {*/
        request('http://www.streamtext.net/text-data.ashx?event=' + e + '&last=' + p + '&language=' + l, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // cache.set(e+p+l, body);

                res.set('l_p',response.headers.l_p);

                res.send(body);
            }
            else {
                next(error);
            }
        });
    // }


});


/*
express.static.mime.define({
    'application/json': ['topojson']
});*/

browserify.settings.development('cache', false);

app.use('/script/script.js', browserify(__dirname + '/../script/script.js'));
app.use(less(path.join(__dirname, '../')));
app.use(express.static(path.join(__dirname, '../')));

app.use(function (err, req, res, next) {
    res.status(500);
    res.render('error.html', { error: err });
});

if (require.main === module) {
    app.listen(process.env.PORT || 5000);
}

module.exports = app;
