const should = require('should'); // eslint-disable-line no-unused-vars
const subdivx = require('../index');
const semistandard = require('mocha-standard/semistandard');

const data = [{
  downloadLink: 'http://www.subdivx.com/bajar.php?id=437164&u=7',
  description: 'suits s05e04 no puedo hacerlo  x264-asap    espa�ol neutrotraducci�n: subswiki com    correcci�n: 1957maria para "www subadictos net"    �y no busques m�s! � �unete a nuestro equipo!'
}, {
  downloadLink: 'http://www.subdivx.com/bajar.php?id=455261&u=8',
  description: 'son los de subadictos net sincronizados para la versi�n 1080pweb-dl dd5 1 h 264-s (rarbg)  saludos '
}, {
  downloadLink: 'http://www.subdivx.com/bajar.php?id=435820&u=7',
  description: 'de www tusubtitulo com para suits s05e04 para  (asap) y 720p(immerse) en espa�ol (espa�a) '
}];

describe('Subdivx', function (done) {
  it('should return an array of subtitles', function (done) {
    subdivx.listSubs('suits s05e04')
            .then(function (subs) {
              subs.should.be.an.Array();
              subs.length.should.be.equal(3);

              subs.forEach(function (sub, i) {
                sub.downloadLink.should.be.equal(data[i].downloadLink);
              });

              done();
            });
  });
});

describe('coding style', function () {
  this.timeout(5000);

  it('subdivx conforms to semistandard', semistandard.files([
    '/index.js'
  ]));

  it('tests conform to semistandard', semistandard.files([
    'specs/*.js'
  ]));
});
