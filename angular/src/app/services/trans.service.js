(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('transService', transService);

    /** @ngInject */
    function transService($translate, $translatePartialLoader, $window, $timeout, $document, $rootScope, __env)
    {
        var service = {
            getErrorMassage: getErrorMassage,
            loadFile: loadFile,
            translate: translate,
            changeLanguage: changeLanguage,
            getLanguage: getLanguage,
            loadCompanyType: loadCompanyType
        };


        $rootScope.$on('$translateLoadingStart',function(event) {
            $rootScope.translate_loading = true;
        });

        $rootScope.$on('$translateLoadingEnd',function(event) {
            $rootScope.translate_loading = false;
        });

        return service;

        /**
         * Load translate file
         *
         * @param path
         */
        function loadFile(path) {
            $translatePartialLoader.addPart('app/' +path);
            $translate.refresh();

            $timeout(function () {
                $translate.refresh();
            }, 1000);

            $timeout(function () {
                $translate.refresh();
            }, 3000);

            $timeout(function () {
                $translate.refresh();
            }, 10000);

            //for first load
            $window.onload = function(e) {
                $translate.refresh();
            };

            $document.ready = function(e) {
                $translate.refresh();
            };
        }

        /**
         * return message error from api
         *
         * @param response
         * @returns {string|Object}
         */
        function getErrorMassage(response) {

            try {
                var data = {};
                if (response.hasOwnProperty('data')) {
                    data = response.data;
                } else {
                    data = response;
                }

                var msg = $translate.instant('ERRORS.' + data.code);

                if (msg == 'ERRORS.' + data.code) {
                    return $translate.instant('ERRORS.DEFAULT');
                }

                return msg;

            } catch(e) {
                return $translate.instant('ERRORS.DEFAULT');
            }
        }

        /**
         * return translate string or ''
         *
         * @param name
         * @returns {*}
         */
        function translate(name) {

            var msg = $translate.instant(name);

            if (msg == name) {
                return '';
            }

            return msg;
        }

        /**
         * change language
         * @param {string} code - 'pl', 'en' etc.
         */
        function changeLanguage(code) {
            $timeout(function () {
                $translate.use(code);
                moment.locale(code);
            }, 100);
            $window.localStorage.language = code;
        }

        /**
         * Returns app language. Default is provided by __env variable
         *
         * @return {string} language slug ('en' || 'pl')
         */
        function getLanguage() {
            return $window.localStorage.language || __env.default_language;
        }

        /**
         * Load custom company type translations
         * @param {string} type - 'transport', 'production' etc.
         */
        function loadCompanyType(type) {
            if (!type || !type.length) {
                return;
            }

            const COMAPNY_TYPES = ['transport', 'production', 'hospital'];
            if (COMAPNY_TYPES.indexOf(type) !== -1) {
                $timeout(function () {
                    $translatePartialLoader.addPart('app/translations/company-types/' + type, 1);
                    $translate.refresh();
                }, 100);
            }
        }
    }
})();
