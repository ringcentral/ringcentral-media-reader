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
var pageUri = window.location.protocol + '//' + window.location.host + window.location.pathname;
var urlParams = rcsdk.platform().parseLoginRedirect(window.location.hash || window.location.search || '?a');
var media = urlParams['media'];
var authCode = urlParams['code'];
if (media) {
  media = decodeURIComponent(media);
}

function isValidMedia(link) {
  if (!link) {
    return false;
  }
  if (link.indexOf(environments[environment].media) === 0) {
    return true;
  }
  if (link.indexOf(environments[environment].attMedia) === 0) {
    return true;
  }
  return false;
}

if (!isValidMedia(media)) {
  media = null;
}

function isAudioMedia(media) {
  return media.indexOf('recording') > -1
}

function getAttachmentId(mediaLink) {
  var purgeMedia = mediaLink.split('?')[0];
  purgeMedia = purgeMedia.split('#')[0];
  purgeMedia = purgeMedia.replace(/\/content$/, '');
  return purgeMedia.split('/').pop();
}

var logoutButton = window.document.getElementById('logoutButton');
var loginButton = window.document.getElementById('loginButton');
var audioPlayer = window.document.getElementById('audioPlayer');
var downloadButton = window.document.getElementById('downloadButton');

function updateAudioPlayer() {
  if (isAudioMedia(media)) {
    audioPlayer.style.display = 'inline-block';
    platform.auth().data().then(function (authData) {
      audioPlayer.src = media + '?access_token=' + authData.access_token;
    });
  }
}

platform.loggedIn().then(function (isLogin) {
  if (!isLogin && authCode) {
    var codeVerifier = localStorage.getItem('simple-media-player-code-verifier');
    urlParams.code_verifier = codeVerifier;
    platform.login(urlParams).then(function () {
      lastMedia = localStorage.getItem(lastMediaKey);
      localStorage.removeItem(lastMediaKey);
      if (!isValidMedia(lastMedia)) {
        return;
      }
      if (isAudioMedia(lastMedia)) {
        window.location.assign(pageUri + '?media=' + encodeURIComponent(lastMedia));
        return;
      }
      platform.auth().data().then(function (authData) {
        window.location.assign(lastMedia + '?access_token=' + authData.access_token);
      });
    });
    return;
  }
  if (!isValidMedia(media)) {
    return;
  }
  if (isLogin) {
    logoutButton.style.display = 'block';
    downloadButton.style.display = 'block';
    updateAudioPlayer();
  } else {
    loginButton.style.display = 'block';
  }
});

platform.on('refreshSuccess', function() {
  updateAudioPlayer();
});

logoutButton.addEventListener('click', function () {
  platform.logout().then(function () {
    window.location.reload();
  });
});

function openAuthPage() {
  localStorage.setItem(lastMediaKey, media);
  var loginUrl = platform.loginUrl({ usePKCE: true });
  var codeVerifier = platform.codeVerifier;
  localStorage.setItem('simple-media-player-code-verifier', codeVerifier);
  window.location.assign(loginUrl);
}

loginButton.addEventListener('click', function () {
  openAuthPage();
});

downloadButton.addEventListener('click', function () {
  if (!isValidMedia(media)) {
    alert('media link is not valid');
    return;
  }
  platform.loggedIn().then(function (isLogin) {
    if (isLogin) {
      platform.auth().data().then(function (authData) {
        window.location.assign(media + '?access_token=' + authData.access_token);
      });
      return;
    } else {
      openAuthPage();
    }
  });
});

var readFromGoogleButton = window.document.getElementById('readFromGoogle');
readFromGoogleButton.addEventListener('click', function () {
  var googleDriveHomeURI = localStorage.getItem('googleDriveHomeURI') || 'https://drive.google.com/drive/u/0/my-drive';
  googleDriveHomeURI = googleDriveHomeURI.split('?')[0];
  var googleDriveSearchURI = googleDriveHomeURI.split('/my-drive')[0];
  window.location.assign(`${googleDriveSearchURI}/search?q=` + getAttachmentId(media));
});

var readFromDropboxButton = window.document.getElementById('readFromDropbox');
readFromDropboxButton.addEventListener('click', function () {
  window.location.assign(`https://www.dropbox.com/search/personal?path=%2F&query=` + getAttachmentId(media));
});

var readFromBoxButton = window.document.getElementById('readFromBox');
readFromBoxButton.addEventListener('click', function () {
  window.location.assign(`https://app.box.com/folder/0/search?query=` + getAttachmentId(media));
});

var archiveSettingModal = window.document.getElementById('archiveSettingModal');
var archiverSettingBootstrapModal = new bootstrap.Modal(archiveSettingModal, {
  keyboard: false
});
var oneDriveHomeURIInput = window.document.getElementById('oneDriveHomeURI');
var googleDriveHomeURIInput = window.document.getElementById('googleDriveHomeURI');
function showArchiverSettings() {
  var oneDriveHomeURI = localStorage.getItem('oneDriveHomeURI');
  if (oneDriveHomeURI) {
    oneDriveHomeURIInput.value = oneDriveHomeURI;
  }
  var googleDriveHomeURI = localStorage.getItem('googleDriveHomeURI');
  googleDriveHomeURIInput.value = googleDriveHomeURI || 'https://drive.google.com/drive/u/0/my-drive';
  archiverSettingBootstrapModal.show();
}

var readFromOneDrive = window.document.getElementById('readFromOneDrive');
readFromOneDrive.addEventListener('click', function () {
  var oneDriveHomeURI = localStorage.getItem('oneDriveHomeURI');
  if (!oneDriveHomeURI) {
    showArchiverSettings();
    return;
  }
  oneDriveHomeURI = oneDriveHomeURI.split('?')[0];
  window.location.assign(`${oneDriveHomeURI}?view=7&searchScope=all&q=` + getAttachmentId(media));
});

var archiverSettings = window.document.getElementById('archiverSettings');
archiverSettings.addEventListener('click', function () {
  showArchiverSettings();
});

var saveArchiverSettings = window.document.getElementById('saveArchiverSettings');
saveArchiverSettings.addEventListener('click', function () {
  if (oneDriveHomeURIInput.value && !oneDriveHomeURIInput.value.indexOf('https://') === 0) {
    alert('Please enter a valid OneDrive home page URL');
    return;
  }
  if (!googleDriveHomeURIInput.value || !googleDriveHomeURIInput.value.indexOf('https://drive.google.com/drive/') === 0) {
    alert('Please enter a valid Google Drive home page URL');
    return;
  }
  localStorage.setItem('oneDriveHomeURI', oneDriveHomeURIInput.value);
  localStorage.setItem('googleDriveHomeURI', googleDriveHomeURIInput.value);
  archiverSettingBootstrapModal.hide();
});

var startGetMediaButton = window.document.getElementById('startGetMedia');
startGetMediaButton.addEventListener('click', function () {
  var mediaUri = window.document.getElementById('mediaUri').value;
  if (!isValidMedia(mediaUri)) {
    alert('media link is not valid');
    return;
  }
  window.location.assign(pageUri + '?media=' + encodeURIComponent(mediaUri));
});

var loading = document.getElementById('loading');
var mainPage = document.getElementById('mainPage');
var startPage = document.getElementById('startPage');

if (!media && !authCode) {
  loading.style.display = 'none';
  startPage.style.display = 'block';
} else if (authCode) {
  loading.style.display = 'block';
} else {
  loading.style.display = 'none';
  mainPage.style.display = 'block';
}