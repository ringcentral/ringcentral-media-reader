var environments = {
  sandbox: {
    server: 'https://platform.devtest.ringcentral.com',
    media: 'https://media.devtest.ringcentral.com/',
    appKey: 'pBZD_5h6QCiC3p0NwQcgdQ',
  },
  production: {
    server: 'https://platform.ringcentral.com',
    media: 'https://media.ringcentral.com/',
    appKey: 'OJ9VDO5STqObDdkolDJRsw',
  }
};

var rcsdk = new RingCentral.SDK({
  cachePrefix: 'simple-media-player-' + environment,
  server: environments[environment].server,
  appKey: environments[environment].appKey,
  redirectUri: window.location.protocol + '//' + window.location.host + window.location.pathname,
});
var platform = rcsdk.platform();

var urlParams = rcsdk.platform().parseLoginRedirect(window.location.hash || window.location.search || '?a');
var media = urlParams['media'];
var token = urlParams['access_token'];
if (media) {
  media = decodeURIComponent(media);
}

var lastMediaKey = 'lastMedia-' + environment;

platform.loggedIn().then(function(isLogin) {
  console.log('Login Status: ', isLogin);
  if (isLogin && media) {
    if (media.indexOf(environments[environment].media) === 0) {
      window.location.assign(media + '?access_token=' + platform.auth().data().access_token);
    }
    return;
  }

  if (!isLogin && media) {
    if (media.indexOf(environments[environment].media) === 0) {
      localStorage.setItem(lastMediaKey, media);
      var loginUrl = platform.loginUrl({implicit: true});
      window.location.assign(loginUrl);
    }
    return;
  }

  if (!isLogin && token) {
    platform.login(urlParams).then(function() {
      const lastMedia = localStorage.getItem(lastMediaKey);
      localStorage.removeItem(lastMediaKey);
      if (lastMedia && lastMedia.indexOf(environments[environment].media) === 0) {
        window.location.assign(lastMedia + '?access_token=' + platform.auth().data().access_token);
      }
    });
    return;
  }
  var loading = document.getElementById('loading');
  loading.innerHTML = 'Nofound.';
});
