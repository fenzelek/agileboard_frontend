(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('authInterceptor', authInterceptor);

    /** @ngInject */
    function authInterceptor($rootScope, $q, $window, $location) {
        var service = {
            request: request,
            response: response,
            responseError: responseError
        };

        return service;

        function request(config) {
            config.headers = config.headers || {};
            if ($window.localStorage.token) {
                if (config.headers.Authorization != false) {
                    config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
                }

                if (!angular.isUndefined($rootScope.webbrowser_tab_id)) {
                    config.headers.WebbrowserTabId = $rootScope.webbrowser_tab_id;
                }

                //params - selected_company_id if is not file and has current_company
                var parts = config.url.split('/');
                if (parts.length && parts[parts.length - 1].indexOf('.') == -1 && $window.localStorage.current_company != undefined){
                    config.params = config.params || {};
                    config.params.selected_company_id =
                        config.params.selected_company_id ? config.params.selected_company_id : $window.localStorage.current_company;
                }
            }

            return config;
        }

        function response(response) {
            if (response.headers('Authorization') != null) {
                $window.localStorage.token = response.headers('Authorization').replace('Bearer ', '');
            }

            return response || $q.when(response);
        }

        function responseError(response) {

            //logout
            try {
                if (($location.path() != '/' && $location.path().indexOf('guest') === -1 && typeof $window.localStorage.token === 'undefined') || (response.status === 400 && response.data.code.indexOf('auth.expired_token') != -1)) {
                    $rootScope.logout(true);
                }
            } catch (e) {
                $rootScope.logout(true);
            }

            if (response.status === 401 && typeof $window.localStorage.token !== 'undefined') {
                try {
                    if (response.data.code.toUpperCase().indexOf('NO_PERMISSION') == -1 && response.data.code.indexOf('no_action_permission') == -1) {
                        $rootScope.logout(true);
                    }
                } catch (e) {
                    $rootScope.logout(true);
                }
            }

            //error 5xx
            if (response.status / 500 == 1) {
                window.location.href = '/error-500';
            }

            return $q.reject(response);
        }

    }

})();
