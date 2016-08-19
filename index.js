const request = require('request');
const fs = require('fs');
const $ = require('cheerio');
const Promise = require('bluebird');
const hat = require('hat');

function Subdivx () {
  this.defaults = {
    SEARCH_URL: 'http://subdivx.com/index.php?buscar={q}&accion=5&masdesc=&subtitulos=1&realiza_b=1',
    DIRECTORY: './.subs'
  };
}

Subdivx.prototype.listSubs = function (opts, cb) {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (!opts) reject('getSubs parameter is required');

    if (typeof opts === 'string') {
      opts = {
        query: opts
      };
    }

    const requestOptions = {
      url: self.defaults.SEARCH_URL.replace('{q}', opts.query.replace(' ', '+'))
    };

    self._request(requestOptions)
            .then(self._parseHTML)
            .then(self._downloadFiles.bind(self, opts))
            .then(resolve)
            .catch(reject);
  });
};

Subdivx.prototype._request = function (opts) {
  return new Promise(function (resolve, reject) {
    request.get(opts.url, function (err, res, body) {
      if (err) reject('Error requesting subdivx');

      resolve(body);
    });
  });
};

Subdivx.prototype._parseHTML = function (html) {
  return new Promise(function (resolve, reject) {
    const subs = $(html)
            .find('#contenedor_izq > div')
            .filter(function (i, elem) {
              return ~($(elem).attr('id') || '').indexOf('buscador_detalle');
            })
            .map(function (i, elem) {
              return {
                downloadLink: $(elem).find('a[target="new"]').attr('href'),
                description: $(elem).find('#buscador_detalle_sub').text()
              };
            })
            .toArray();

    resolve(subs);
  });
};

Subdivx.prototype._downloadFiles = function (opts, subs) {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (!opts.download) resolve(subs);
    if (!fs.existsSync(self.defaults.DIRECTORY)) fs.mkdirSync(self.defaults.DIRECTORY);

    const promises = subs.map(function (sub) {
      return new Promise(function (resolve, reject) {
        const subId = /id=(.*)&/gi.exec(sub.downloadLink)[1] || hat();
        const r = request(sub.downloadLink);
        let fileName = '';

        r.on('response', function (res) {
          fileName = `${self.defaults.DIRECTORY}/${subId}.${res.headers['content-type'].split('/')[1]}`;
          const fileStream = fs.createWriteStream(fileName);
          res.pipe(fileStream);

          res.on('end', function () {
            sub.filePath = fileName;
            resolve(sub);
          });

        });

        r.on('error', function () {
          reject();
        });
      });
    });

    Promise.all(promises)
            .then(resolve)
            .catch(reject);
  });
};

module.exports = new Subdivx();
