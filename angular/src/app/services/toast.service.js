(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('toastService', toastService);

    /** @ngInject */
    function toastService($mdToast)
    {
        return {
            show: show,
            showError: showError,
            showSuccess: showSuccess,
            showInfo: showInfo,
            showWarning: showWarning
        };

        function show(text, type, delay) {
            if (!type) {
                type = "default";
            }
            if (!delay) {
                delay = 1500;
            }
            $mdToast.show(
                $mdToast
                    .simple()
                    .textContent(text)
                    .position('top right')
                    .toastClass('toast-center toast-type-' + type)
                    .hideDelay(delay)
            );
        }

        function showError(text, delay) {
            show(text, 'error', delay);
        }

        function showSuccess(text, delay) {
            show(text, 'success', delay);
        }

        function showInfo(text, delay) {
            show(text, 'info', delay);
        }

        function showWarning(text, delay) {
            show(text, 'warning', delay);
        }

    }
})();
