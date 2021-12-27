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

function getAttachmentId(mediaLink) {
  let purgeMedia = mediaLink.split('?')[0];
  purgeMedia = purgeMedia.split('#')[0];
  purgeMedia = purgeMedia.replace(/\/content$/, '');
  return purgeMedia.split('/').pop();
}

var logoutButton = window.document.getElementById('logoutButton');

platform.loggedIn().then(function(isLogin) {
  console.log('Login Status: ', isLogin);
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
  if (isLogin) {
    logoutButton.style.display = 'block';
  }
});

logoutButton.addEventListener('click', function () {
  platform.logout().then(function () {
    window.location.reload();
  });
});

var readFromRCServerButton = window.document.getElementById('readFromRCServer');
readFromRCServerButton.addEventListener('click', function () {
  if (!isValidMediaLink(media)) {
    alert('media link is not valid');
    return;
  }
  platform.loggedIn().then(function(isLogin) {
    if (isLogin && media) {
      platform.auth().data().then(function(authData) {
        window.location.assign(media + '?access_token=' + authData.access_token);
      });
      return;
    }
    if (!isLogin && media) {
      localStorage.setItem(lastMediaKey, media);
      var loginUrl = platform.loginUrl({usePKCE: true});
      var codeVerifier = platform.codeVerifier;
      localStorage.setItem('simple-media-player-code-verifier', codeVerifier);
      window.location.assign(loginUrl);
      return;
    }
  });
});

var readFromGoogleButton = window.document.getElementById('readFromGoogle');
readFromGoogleButton.addEventListener('click', function () {
  window.location.assign(`https://drive.google.com/drive/search?q=` + getAttachmentId(media));
});

var readFromDropboxButton = window.document.getElementById('readFromDropbox');
readFromDropboxButton.addEventListener('click', function () {
  window.location.assign(`https://www.dropbox.com/search/personal?path=%2F&query=` + getAttachmentId(media));
});

var readFromBoxButton = window.document.getElementById('readFromBox');
readFromBoxButton.addEventListener('click', function () {
  window.location.assign(`https://app.box.com/folder/0/search?query=` + getAttachmentId(media));
});

var startGetMediaButton = window.document.getElementById('startGetMedia');
startGetMediaButton.addEventListener('click', function () {
  var mediaUri = window.document.getElementById('mediaUri').value;
  if (!isValidMediaLink(mediaUri)) {
    alert('media link is not valid');
    return;
  }
  var pageUri = window.location.protocol + '//' + window.location.host + window.location.pathname;
  window.location.assign(pageUri + '?media=' + encodeURIComponent(mediaUri));
});

var loading = document.getElementById('loading');
loading.style.display = 'none';
var mainPage = document.getElementById('mainPage');
var startPage = document.getElementById('startPage');

if (!media && !authCode) {
  startPage.style.display = 'block';
} else {
  mainPage.style.display = 'block';
}