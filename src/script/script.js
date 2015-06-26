var Ractive = require('ractive'),
    d3 = require('d3'),
    piglatin = require('piglatin');

Ractive.DEBUG = false;

if (typeof window !== 'undefined') {
    var hover = require('./lib/ractive-events-hover');
}

var fs = require('fs');

var app = {

    ractive: null,

    data: null,

    template: null,

    pym: null,

    container: null,

    event: '',

    last: -1,

    text: [''],

    removeText: function () {
        var i = app.text.length-1;

        if (app.text[i].length > 0) {
            app.text[i] = app.text[i].slice(0,-1);
            if (app.text[i].length > 0) {
                app.ractive.set('text.' + i,piglatin(app.text[i]));
            }
        }
        else {
            app.text.pop();
            app.ractive.pop('text');
        }
    },

    addNewLine: function () {
        app.text.push('');
        app.ractive.push('text','');
    },

    addText: function (t) {
        var i = app.text.length-1;

        app.text[i] += t;
        if (app.text[i].length > 0) {
            app.ractive.set('text.' + i,piglatin(app.text[i]));
        }
    },

    response: function (err,data) {
        if (err) {
            console.error(err);
        }

        if ('lastPosition' in data) {
            var p = parseInt(data.lastPosition);
            // if (p !== p) {
                app.last = p;
            //}

            data.i.forEach(function (item) {
                var text = decodeURIComponent(item.d);
                for (var i = 0; i < text.length; i++) {
                    switch (text.charCodeAt(i)) {
                    case 8:
                        app.removeText();
                        break;
                    case 10:
                        app.addNewLine();
                        break;
                    case 13:
                        app.addText(' ');
                        break;
                    default:
                        app.addText(text.charAt(i));
                    }
                }
            });
        }
    },

    request: function() {
        d3.json('/text?language=en&event=' + app.event.replace('#','') + '&last=' + app.last,app.response);
    },

    hashChanged: function () {
        if (!window.location.hash) {
            app.ractive.set('message','Need to specify an event.');
            return;
        }

        app.text = [''];
        app.ractive.set('text',['']);
        app.event = window.location.hash.replace('#','');
        app.ractive.set('event',window.location.hash);
        app.ractive.set('message','');
    },

    rendered: function() {
        if (app.pym) {
            app.pym.sendHeight();
        }

        setInterval(app.request,1000);

        window.addEventListener('hashchange',app.hashChanged);
    },

    render: function(cb) {
        if (typeof pym !== 'undefined') {
            app.pym = pym.Child({
                polling: 200
            });
        }

        app.template = fs.readFileSync(__dirname + '/../template.html', 'utf8');

        // app.data = JSON.parse(fs.readFileSync(__dirname + '/../data/data.json', 'utf8'));

        app.event = window.location.hash.replace('#','');

        if (typeof document !== 'undefined') {
            app.container = document.querySelector('#eamtextstray');
        }

        app.ractive = new Ractive({
            el: app.container,
            template: app.template,
            data: {
                text: [''],
                event: app.event
            },
            oncomplete: cb
        });

        if (!app.event) {
            app.ractive.set('message','Need to specify an event.');
        }

        if (typeof window === 'undefined') {
            cb(app.ractive.toHTML());
        }
    }

};

if (typeof window !== 'undefined') {
    app.render(app.rendered);
} else {
    module.exports = app;
}
