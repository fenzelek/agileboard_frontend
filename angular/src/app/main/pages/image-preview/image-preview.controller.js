(function() {
    'use strict';

    angular
        .module('app.core')
        .controller('ImagePreviewController', ImagePreviewController);

    /** @ngInject */
    function ImagePreviewController($mdDialog, url, $scope, $window) {
        var vm = this;

        vm.multiple = typeof url === 'string' ? false : true;
        vm.index = 0;
        vm.src = vm.multiple ? url[0] : url;
        vm.length = vm.multiple ? url.length : 1;
        vm.loading = false;

        vm.hide = hide;
        vm.next = next;
        vm.previous = previous;

        init();


        function init() {
            handleKeyboardNavigation();
        }

        function handleKeyboardNavigation() {
            if (!vm.multiple) return;

            $window.addEventListener('keydown', onKeydown);
            
            $scope.$on('$destroy', function () {
                $window.removeEventListener('keydown', onKeydown);
            });
        }

        function onKeydown(e) {
            var isRightArrow = e.which === 39;
            var isLeftArrow = e.which === 37;

            if (isRightArrow)
                next();
            
            if (isLeftArrow)
                previous();
        }


        function hide() {
            $mdDialog.hide();
        }

        function next() {
            var isLast = vm.index === url.length -1;
            var nextIndex = isLast ? 0 : vm.index + 1;
            vm.index = nextIndex;
            changeImage();
        }

        function previous() {
            var isFirst = vm.index === 0;
            var nextIndex = isFirst ? url.length -1 : vm.index - 1;
            vm.index = nextIndex;
            changeImage();
        }

        function changeImage() {
            vm.loading = true;
            $scope.$apply();

            var img = new Image();
            img.src = url[vm.index];

            img.onload = function () {
                vm.loading = false;
                vm.src = url[vm.index];
                $scope.$apply();
            }
        }

    }

})();
