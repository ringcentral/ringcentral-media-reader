var environments = {
  sandbox: {
    server: 'https://platform.devtest.ringcentral.com',
    attServer: 'https://platform.devtest.ringcentral.com',
    media: 'https://media.devtest.ringcentral.com/',
    attMedia: 'https://media.devtest.ringcentral.com/',
    clientId: 'pBZD_5h6QCiC3p0NwQcgdQ',
  },
  production: {
    server: 'https://platform.ringcentral.com',
    attServer: 'https://platform.ringcentral.biz',
    media: 'https://media.ringcentral.com/',
    attMedia: 'https://media.ringcentral.biz/',
    clientId: 'OJ9VDO5STqObDdkolDJRsw',
  }
};

var brand = 'rc';
var lastMediaKey = 'lastMedia-' + environment;
var isAtt = window.location.href.indexOf('.biz') > 0;
var lastMedia = localStorage.getItem(lastMediaKey);
if (!isAtt && window.location.href.indexOf('code') > 0) {
  isAtt = lastMedia.indexOf('.biz') > 0;
}
if (isAtt) {
  brand = 'att';
}
var rcsdk = new RingCentral.SDK({
  cachePrefix: 'simple-media-player-' + environment + brand,
  server: isAtt ? environments[environment].attServer : environments[environment].server,
  clientId: environments[environment].clientId,
  redirectUri: window.location.protocol + '//' + window.location.host + window.location.pathname,
});
var platform = rcsdk.platform();

var urlParams = rcsdk.platform().parseLoginRedirect(window.location.hash || window.location.search || '?a');
var media = urlParams['media'];
var authCode = urlParams['code'];
if (media) {
  media = decodeURIComponent(media);
}

function isValidMediaLink(link) {
  if (link.indexOf(environments[environment].media) === 0) {
    return true;
  }
  if (link.indexOf(environments[environment].attMedia) === 0) {
    return true;
  }
  return false;
}

platform.loggedIn().then(function(isLogin) {
  console.log('Login Status: ', isLogin);
  if (isLogin && media) {
    if (isValidMediaLink(media)) {
      platform.auth().data().then(function(authData) {
        window.location.assign(media + '?access_token=' + authData.access_token);
      });
    }
    return;
  }

  if (!isLogin && media) {
    if (isValidMediaLink(media)) {
      localStorage.setItem(lastMediaKey, media);
      var loginUrl = platform.loginUrl({usePKCE: true});
      var codeVerifier = platform.codeVerifier;
      localStorage.setItem('simple-media-player-code-verifier', codeVerifier);
      window.location.assign(loginUrl);
    }
    return;
  }

  if (!isLogin && authCode) {
    var codeVerifier = localStorage.getItem('simple-media-player-code-verifier');
    urlParams.code_verifier = codeVerifier;
    platform.login(urlParams).then(function() {
      lastMedia = localStorage.getItem(lastMediaKey);
      localStorage.removeItem(lastMediaKey);
      if (lastMedia && isValidMediaLink(lastMedia)) {
        platform.auth().data().then(function(authData) {
          window.location.assign(lastMedia + '?access_token=' + authData.access_token);
        });
      }
    });
    return;
  }
  var loading = document.getElementById('loading');
  loading.innerHTML = 'Notfound.';
});
