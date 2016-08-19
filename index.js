const request = require('request');
const fs = require('fs');
const $ = require('cheerio');
const Promise = require('bluebird');
const hat = require('hat');

const SEARCH_SUBDIVX = 'http://subdivx.com/index.php?buscar={q}&accion=5&masdesc=&subtitulos=1&realiza_b=1';
const SUBS_DIRECTORY = './.subs';

exports.listSubs = function (opts, cb) {
  return new Promise(function (resolve, reject) {
    if (!opts) reject('getSubs parameter is required');

    if (typeof opts === 'string') {
      opts = {
        query: opts
      };
    }

    const requestOptions = {
      url: SEARCH_SUBDIVX.replace('{q}', opts.query.replace(' ', '+'))
    };

    exports._request
            .call(this, requestOptions)
            .then(exports._parseHTML)
            .then(exports._downloadFiles.bind(this, opts))
            .then(resolve)
            .catch(reject);
  });
};

exports._request = function (opts) {
  return new Promise(function (resolve, reject) {
    request(opts.url, function (err, res, body) {
      if (err) reject('Error requesting subdivx');

      resolve(body);
    });
  });
};

exports._parseHTML = function (html) {
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

exports._downloadFiles = function (opts, subs) {
  return new Promise(function (resolve, reject) {
    if (!opts.download) resolve(subs);
    if (!fs.existsSync(SUBS_DIRECTORY)) fs.mkdirSync(SUBS_DIRECTORY);

    const promises = subs.map(function (sub) {
      return new Promise(function (resolve, reject) {
        const subId = /id=(.*)&/gi.exec(sub.downloadLink)[1] || hat();
        const r = request(sub.downloadLink);

        r.on('response', function (res) {
          const fileName = `${SUBS_DIRECTORY}/${subId}.${res.headers['content-type'].split('/')[1]}`;
          const fileStream = fs.createWriteStream(fileName);
          res.pipe(fileStream);
        });

        r.on('error', function () {
          reject();
        });

        r.on('close', function () {
          resolve();
        });
      });
    });

    Promise.all(promises)
            .then(resolve)
            .catch(reject);
  });
};
