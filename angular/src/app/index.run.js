(function ()
{
    'use strict';

    angular
        .module('CEP')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $timeout, $state, $auth, $location, $window, dialogService, api, projectsService, filesService, transService)
    {
        $rootScope.footer_copyright = __env.copyright;
        $rootScope.page_title = __env.title;
        $rootScope.is_fv = __env.is_fv;
        $rootScope.show_tax_office_button = false;
        $rootScope.show_projects_buttons = false;
        $rootScope.show_department_buttons = false;
        $rootScope.current_department = null;
        $rootScope.button_change_packet  = false;
        $rootScope.show_companies_list = true;
        $rootScope.close_gdpr_info = false;

        if (angular.isUndefined($window.localStorage.last_build_angular)) {
            $window.localStorage.last_build_angular = 0;
        }

        // onload actions
        (function() {
            //favicon
            var link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = __env.logo == '' ? 'favicon.ico' : '/assets/logos/' + __env.logo + '/favicon.ico';
            document.getElementsByTagName('head')[0].appendChild(link);
            // GDPR information
            $(window).on('load', function() {
                if (typeof $window.localStorage.gdprInfo != 'undefined') {
                    $rootScope.close_gdpr_info = true;
                } else {
                    showGdprInfo();
                }
            });
        }());

        $rootScope.closeGdprInfo = function() {
            $window.localStorage.gdprInfo = true;
            $rootScope.close_gdpr_info = true;
        }

        // redirect user if hasn`t access
        $auth.checkAccess($location.path());

        // Activate loading indicator
        var stateChangeStartEvent = $rootScope.$on('$stateChangeStart', function (event, toState, toParams)
        {
            if (angular.isUndefined(toParams.project_id)) {
                //delete current_project_id when load general page
                $window.localStorage.current_project_id = undefined;
            } else if ($auth.check()) {
                //check access to selected project
                var company_id = (angular.isDefined($window.localStorage.current_company) && $window.localStorage.current_company) ? $window.localStorage.current_company : 0;
                projectsService.hasAccessToTheProject(toParams.project_id, company_id);

                // load file types in local service variable - first time from API
                // prevent 'infinite' loop if file_types is not defined in ng-if statement
                filesService.getFileTypes();
            }

            $rootScope.loadingProgress = true;
        });

        // De-activate loading indicator
        var stateChangeSuccessEvent = $rootScope.$on('$stateChangeSuccess', function ()
        {
            $auth.checkAccess($location.path());

            $timeout(function ()
            {
                $rootScope.loadingProgress = false;

                if (__env.ga) {
                    //remove hash
                    var hash = $location.hash();
                    var url = $location.url().replace('#' + hash, '');
                    var url_parts = url.split('?');
                    url = url_parts[0];
                    if (url_parts.length > 1) {
                        url += url_parts[1];
                    }

                    /**
                     * Google Analytics
                     */
                    $auth.getUser(function (user) {
                        ga('set', 'userId', user.id);
                    });
                    $window.ga('send', 'pageview', url);
                }
            });
        });

        $($window).bind('hashchange', function () {

            if (__env.ga && !$rootScope.loadingProgress) {

                var hash = $location.hash();
                if (hash != '' && hash != 'up' && hash != 'down') {

                    $auth.getUser(function (user) {
                        ga('set', 'userId', user.id);
                    });

                    if (hash == '1') {
                        $window.ga('send', 'pageview', $location.url().replace('#1', ''));
                    } else {
                        var url = $location.url().replace('#' + hash, '');
                        var url_parts = url.split('?');
                        url = url_parts[0] + '/' + hash.replace('-wrap', '-page');
                        if (url_parts.length > 1) {
                            url += url_parts[1];
                        }
                        $window.ga('send', 'pageview', url);
                    }
                }
            }
        });

        // Store state in the root scope for easy access
        $rootScope.state = $state;

        // Cleanup
        $rootScope.$on('$destroy', function ()
        {
            stateChangeStartEvent();
            stateChangeSuccessEvent();
        });

        /**
         * range method
         *
         * @param min
         * @param max
         * @param step
         * @returns {Array}
         */
        $rootScope.range = function(min, max, step) {
            step = step || 1;
            min = Math.ceil(min);
            max = Math.ceil(max);
            var input = [];
            for (var i = min; i <= max; i += step) {
                input.push(i);
            }
            return input;
        };

        $rootScope.range_r = function(min, max, step) {
            step = step || 1;
            min = Math.ceil(min);
            max = Math.ceil(max);
            var input = [];
            for (var i = max; i >= min; i -= step) {
                input.push(i);
            }
            return input;
        };

        $rootScope.searchItem = function (object, param, query) {
            if (!object || typeof object[param] !== 'string') {
                return false;
            }
            if (!query || query.length < 2) {
                return true;
            }
            return (object[param].toLowerCase()).indexOf(query.toLowerCase()) !== -1;
        }

        /**
         * show alert work in progress
         *
         * @param e
         */
        $rootScope.alertWorkInProgress =  function (e) {
            dialogService.alert(e, "OTHER.WORK_IN_PROGRESS");
        };

        /**
         * new version
         */
        api.version.get({t:(new Date()).getTime()}, function (response) {

            if ($window.localStorage.last_build_angular == 0) {
                $window.localStorage.last_build_angular = response.data.timestamp;
            }
            else if (response.data.timestamp != $window.localStorage.last_build_angular) {
                $window.localStorage.last_build_angular = response.data.timestamp;
                $window.location.reload();
            }

            checkVersion();
        });

        function checkVersion() {
            $timeout(function () {
                api.version.get({t:(new Date()).getTime()}, function (response) {
                    if (response.data.timestamp != $window.localStorage.last_build_angular) {
                        $window.localStorage.last_build_angular = response.data.timestamp;
                        dialogService.customDialog(undefined, 'NewVersionDialogController', 'app/main/pages/new-version/new-version.html');
                    } else {
                        checkVersion();
                    }
                }, function () {
                    checkVersion();
                })
            }, 1800 * 1000); //30min
        }

        /**
         * Language information for FV only
         */
        if (__env.fv === true) {
            if ((typeof $window.navigator.language !== 'undefined' && ['pl', 'pl-PL'].indexOf($window.navigator.language) == -1 ) ||
                (typeof $window.navigator.userLanguage !== 'undefined' && ['pl', 'pl-PL'].indexOf($window.navigator.userLanguage) == -1 )) {
                dialogService.customDialog(undefined, 'LanguageWebBrowserDialogController', 'app/main/pages/language_webbrowser/language_webbrowser.html');
            }
        }

        /**
         * set language from wp
         */
        if (document.referrer) {
            if (document.referrer.indexOf('//agileboard.me/pl') != -1) {
                transService.changeLanguage('pl');
            } else if (document.referrer.indexOf('//agileboard.me/en') != -1) {
                transService.changeLanguage('en');
            }
        }
        /**
         * Save (to LS) and load custom company type translations
         * you can do this by setting a URL param "companyType",
         * eg. agileboard.me/projects/list?companyType=transport
         */
        if ($location.search().companyType) {
            $window.localStorage.company_type = $location.search().companyType;
            transService.changeLanguage('pl');
        }
        transService.loadCompanyType($window.localStorage.company_type);

        /**
         * invite tax office modal
         */
        $rootScope.inviteTaxOffice = inviteTaxOffice;
        $rootScope.packageAlert = packageAlert;
        $rootScope.openHome = openHome;

        function inviteTaxOffice(e) {
            dialogService.customDialog(e, 'InviteTaxOfficeDialogController', 'app/main/pages/invite_tax_office/invite_tax_office.html');
        }

        function packageAlert(message, e) {
            dialogService.customDialog(e, 'PackageAlertDialogController', 'app/main/pages/package-alert/package-alert.html', {message: message});
        }

        function openHome() {
            window.location.href = __env.homeUrl;
        }

        function showGdprInfo() {
            dialogService.customDialog(null, 'GdprInfoDialogController', 'app/main/pages/gdpr_info/gdpr_info.html', null, null, null, null, false);
        }

        $rootScope.Deferred = function Deferred() {
            const _this = this;
            this.promise = new Promise(function(res, rej) {
                _this.resolve = res;
                _this.reject = rej;
            });
        }

        $rootScope.debounce = function debounce(cb, delay = 250) {
            let timeout;
          
            return (...args) => {
              clearTimeout(timeout);
              timeout = setTimeout(() => {
                cb(...args)
              }, delay);
            }
        }

    }
})();
