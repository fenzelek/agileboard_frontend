(function () {
  'use strict';

  angular
    .module('app.core')
    .factory('contentParserService', contentParserService);

  /** @ngInject */
  function contentParserService($window) {
    var service = {
      addTokens: addTokens,
      removeTokens: removeTokens,
    };

    return service;


    function addTokens(content) {
      if (!content) return content;

      if (isDelta(content)) {
        return addTokensToDelta(content);
      } else {
        return addTokensToHTML(content)
      }
    }

    function removeTokens(content) {
      if (!content) return content;

      if (isDelta(content)) {
        return removeTokensFromDelta(content);
      } else {
        return removeTokensFromHTML(content)
      }
    }

    // 

    function addTokensToDelta(content) {
      const delta = JSON.parse(content);

      delta.ops.forEach(op => {
        const isImg = !!op.insert.image;
        if (!isImg) return;

        const isApiUrl = !!op.insert.image.match(__env.apiUrl);
        if (!isApiUrl) return;

        op.insert.image = removeTokenFromUrl(op.insert.image); // remove any existing token
        op.insert.image = addTokenToUrl(op.insert.image);
      });

      return JSON.stringify(delta);
    }

    function removeTokenFromUrl(url) {
      return url.replace(/token=[^&]+&?/, '').replace(/amp;/g, '');
    }

    function addTokenToUrl(url) {
      return url.includes('?')
        ? `${url}&token=${$window.localStorage.token}`
        : `${url}?token=${$window.localStorage.token}`; 
    }

    function addTokensToHTML(content) {
      var parser = document.createElement('div');
      parser.innerHTML = content;

      var images = parser.querySelectorAll('img');

      for (var i = 0; i < images.length; i++) {
        var img = images[i];

        var isApiUrl = !!img.src.match(__env.apiUrl);
        if (!isApiUrl) continue;

        try {
          var projectId = img.src.match(/\/projects\/(\d+)/)[1];
          var fileId = img.src.match(/\/files\/(\d+)/)[1];
        } catch (err) {
          console.warn('Possibly invalid img src', img.src, img);
          continue;
        }

        var parsedUrl = getImageUrl(projectId, fileId);
        img.src = parsedUrl;
      }

      return parser.innerHTML;
    }

    function getImageUrl(projectId, fileId) {
      var url = __env.apiUrl + 'projects/' + projectId + '/files/' + fileId +
        '/download?token=' + $window.localStorage.token +
        '&selected_company_id=' + $window.localStorage.current_company;

      return url;
    }

    function removeTokensFromDelta(content) {
      const delta = JSON.parse(content);

      delta.ops.forEach(op => {
        const isImg = !!op.insert.image;
        if (!isImg) return;

        const isApiUrl = !!op.insert.image.match(__env.apiUrl);
        if (!isApiUrl) return;

        op.insert.image = removeTokenFromUrl(op.insert.image);
      });

      return JSON.stringify(delta);
    }

    function removeTokensFromHTML(content) {
      var parser = document.createElement('div');
      parser.innerHTML = content;

      var images = parser.querySelectorAll('img');

      for (var i = 0; i < images.length; i++) {
        var img = images[i];

        var isApiUrl = !!img.src.match(__env.apiUrl);
        if (!isApiUrl) continue;

        try {
          var projectId = img.src.match(/\/projects\/(\d+)/)[1];
          var fileId = img.src.match(/\/files\/(\d+)/)[1];
        } catch (err) {
          console.warn('Possibly invalid img src', img.src, img);
          continue;
        }

        var parsedUrl = getImageUrl_noToken(projectId, fileId);
        img.src = parsedUrl;
      }

      return parser.innerHTML;
    }

    function getImageUrl_noToken(projectId, fileId) {
      var url = __env.apiUrl + 'projects/' + projectId + '/files/' + fileId + '/download?' +
        'selected_company_id=' + $window.localStorage.current_company;

      return url;
    }

    function isDelta(content) {
      try {
        JSON.parse(content);
        return true;
      } catch(err) {
        return false;
      }
    }

    }
})();
