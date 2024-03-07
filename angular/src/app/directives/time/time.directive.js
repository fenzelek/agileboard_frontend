(function () {
    'use strict';

    angular
        .module('app.core')
        .directive('time', timeDirective); 
        
    /** @ngInject */
    function timeDirective() {
        return {
            restrict: 'A',
            scope: {
              time: '=',
            },
            link: link,
        };
    }

    function link(scope, element, attrs) {
      element.on('change', parseTime);

      function parseTime() {
        scope.time = fillTime(scope.time);
      }
    }

    /**
     * @description Fill provided value according to mask: 00:00:00, remove invalid characters.
     */
    function fillTime(value) {
        var pattern = '00:00:00';
        if (!value) value = pattern;
        value = value.trim();
        value = value.replace(/[^0-9:]/g, '');
        value = value.replace(/:+/g, ':');
        var segments = value.split(':');
  
        segments.forEach(function (seg, index) {
            if (seg.length < 2) {
                segments[index] = '0' + seg;
            }
        });
  
        value = segments.join(':');
  
        if (value.length >= pattern.length) {
            return value;
        }
  
        var lengthDiff = pattern.length - value.length;
        var toAddStartIndex = pattern.length - lengthDiff;
        var toAdd = pattern.substring(toAddStartIndex);
  
        value += toAdd;
  
        return value;
    }


})();