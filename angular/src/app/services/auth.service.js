(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('$auth', auth);

    /** @ngInject */
    function auth($location, api, $window, $timeout, $rootScope, $state, menu, socket, projectsService, dialogService)
    {
        var user = null;
        var settings = {};
        var companies = [];
        var current_company = 0;
        var current_package = null;

        $rootScope.logout = logout;

        var service = {
            check: check,
            login: login,
            redirectToDashboard: redirectToDashboard,
            redirectTo: redirectTo,
            refreshUser: refreshUser,
            getUser: getUser,
            getMyRole: getMyRole,
            refreshCurrentPackage: refreshCurrentPackage,
            getCurrentPackage: getCurrentPackage,
            getSettings: getSettings,
            refreshSettings: refreshSettings,
            refreshCompanies: refreshCompanies,
            getCompanies: getCompanies,
            setCurrentCompany: setCurrentCompany,
            getCurrentCompany: getCurrentCompany,
            getAvatar: getAvatar,
            checkAccess : checkAccess
    	};

    	return service;

        /**
         * Check if user is logged in
         *
         * @return boolean
         */
        function check() {
            return typeof $window.localStorage.token !== 'undefined';
        }

        /**
         * login and get user data, and redirect to dashboard
         *
         * @param token
         */
        function login(token)
        {
            $window.localStorage.token = token;

            if ( typeof $window.localStorage.entry_url !== 'undefined') {
                return redirectToProjectPage($window.localStorage.getItem('entry_url'));
            }

            return redirectTo('/company/my-list');
        }

        /**
         * Redirect user to 'projects/X/page'
         *
         * @param {string} url - previous $location.path()
         */
        function redirectToProjectPage(url) {
            delete $window.localStorage.entry_url;
            // redirect to 'projects/X' if have localstorage data
            var entry_url_data = url.split('/');
            // go to the projects
            if (entry_url_data[1] == 'projects' && !isNaN(entry_url_data[2])) {

                api.projectBasicInfo.get({ id: entry_url_data[2]},
                    function(response) {
                        setCurrentCompany(response.data.company_id, function() {
                            projectsService.setCurrent(entry_url_data[2], function() {
                                return redirectTo(url);
                            });
                        })
                    }, function() {
                        return redirectTo('/company/my-list');
                    });
            }

            return redirectTo('/company/my-list');
        }

        /**
         * logout
         */
        function logout(without_request)
        {
            delete $window.localStorage.current_company;
            delete $rootScope.current_company;

            if (without_request === true) {
                delete $window.localStorage.token;
                user = null;
                $timeout(function () {
                    $window.location.reload();
                });
            } else {
                api.auth.authenticate.delete($window.localStorage.token,
                    // success
                    function () {
                        delete $window.localStorage.token;
                        user = null;
                        $timeout(function () {
                            $window.location.reload();
                        });
                    },
                    // error
                    function () {
                        delete $window.localStorage.token;
                        user = null;
                        $timeout(function () {
                            $window.location.reload();
                        });
                    }
                );
            }
        }

        /**
         * Redirect to dashboard
         */
        function redirectToDashboard() {
            // FV Dashboard
            if ($rootScope.is_fv) {
                redirectTo($state.href('app.fv-dashboard'));
                return;
            }
            // AB Dashboard
            if ($location.path() != $state.href('app.dashboard')) {
                redirectTo($state.href('app.dashboard'));
            } else {
                $state.reload();
            }
        }

        /**
         * Redirect User to given path
         *
         * @param  string path
         * @return Redirect
         */
    	function redirectTo(path) {
    		return $location.path(path);
    	}

        /**
         * refresh data user
         *
         * @param closure
         */
        function refreshUser(closure) {

            if (check()) {
                api.auth.currentUser.get({}, function (response) {
                    user = response.data;
                    closure(user);
                });
            }
        }

        /**
         * get data user
         *
         * @param closure
         */
        function getUser(closure) {
            if (user == null) {
                refreshUser(closure);
            } else {
                closure(user);
            }
        }

        /**
         * get current user role
         *
         * @param calback
         */
        function getMyRole(calback) {
            getUser(function (user) {
                if (user.selected_user_company.data) {
                    calback(user.selected_user_company.data.role.data.name)
                } else {
                    calback('');
                }
            });
        }

        /**
         * refresh current package
         *
         * @param closure
         */
        function refreshCurrentPackage(closure) {
            api.currentCompany.get({}, function (response) {

                $rootScope.packageExpires = null;

                // save company settings
                $rootScope.current_company_settings = {
                    enable_calendar: response.data.enable_calendar,
                    force_calendar_to_complete: response.data.force_calendar_to_complete,
                    enable_activity: response.data.enable_activity
                }

                var real_package = response.data.real_package.data;
                var diff = moment(real_package.expires_at, "YYYY-MM-DD HH:mm:ss").diff(moment(), 'seconds');
                if (real_package.expires_at == null || diff > 0) {
                    $rootScope.packageName = real_package.slug;
                    $rootScope.packageExpires = real_package.expires_at;
                    if (real_package.expires_at) {
                        $rootScope.packageExpires = real_package.expires_at.split(' ')[0];
                    }
                }

                if (real_package.slug == null) {
                    $rootScope.packageName = 'start';
                }

                if (typeof closure != 'undefined') {
                    closure($rootScope.packageName);
                }
            });
        }

        /**
         * get current package
         *
         * @param closure
         */
        function getCurrentPackage(closure) {
            if (!current_package) {
                refreshCurrentPackage(closure);
            } else {
                closure(current_package);
            }
        }
        /**
         * refresh data company
         *
         * @param closure
         */
        function refreshCompanies(closure) {
            if (check()) {
                api.companyMyList.get({}, function (response) {
                    companies = response.data;
                    closure(companies);
                });
            }
        }

        /**
         * get data company
         *
         * @param closure
         */
        function getCompanies(closure) {
            if (!companies.length) {
                refreshCompanies(closure);
            } else {
                closure(companies);
            }
        }

        /**
         * refresh data settings
         *
         * @param closure
         */
        function refreshSettings(closure) {
            api.currentCompany.get({}, function (response) {
                settings = {};
                angular.forEach(response.data.app_settings, function (value) {
                    settings[value.slug] = value.value;
                });

                closure(settings);
            });
        }

        /**
         * get data settings
         *
         * @param closure
         */
        function getSettings(closure) {
            if (!settings.length) {
                refreshSettings(closure);
            } else {
                closure(settings);
            }
        }

        /**
         * set current company
         * @param id
         * @param closure
         */
        function setCurrentCompany(id, closure) {
            var is_change = current_company != id;
            current_company = id;
            $window.localStorage.current_company = id;
            $rootScope.current_company = id;
            current_package = null;
            refreshCurrentPackage(function () {});
            $rootScope.button_change_packet = false;
            menu.dashboard(false);

            refreshUser(function (user) {
                menu.dashboard(true);
                menu.manageCompany(-1 < ["admin", "owner"].indexOf(user.selected_user_company.data.role.data.name));
                menu.projects(false);
                menu.invoices(false, false);

                refreshSettings(function (settings) {
                    $rootScope.show_companies_list = settings['general.companies.visible'] == "1";
                    $rootScope.projects_active = settings['projects.active'] == "1";
                    $rootScope.invoices_active = settings['invoices.active'] == "1";
                    menu.projects(settings['projects.active'], user.selected_user_company.data.role.data.name);
                    menu.invoices(settings['invoices.active'], settings['receipts.active']);
                });

                //show invite  tax office button
                if (["admin", "owner"].indexOf(user.selected_user_company.data.role.data.name) > -1) {
                    $rootScope.show_tax_office_button = false;
                    $rootScope.button_change_packet = true;
                    api.roles.get({}, function (response) {
                        var tax_office_id = -1;
                        angular.forEach(response.data, function (value) {
                            if (value.name == 'tax_office') {
                                tax_office_id = value.id;
                            }
                        });
                        api.company.users.get(function (response) {
                            $rootScope.show_tax_office_button = true;
                            angular.forEach(response.data, function (value) {
                                if (value.company_role_id == tax_office_id) {
                                    $rootScope.show_tax_office_button = false;
                                }
                            })
                        })
                    });

                    //show info - blockaded company
                    if (is_change) {
                        api.currentCompany.get(function (response) {
                            if (response.data.blockade_company) {
                                dialogService.customDialog(null, 'BlockadeCompanyDialogController', 'app/main/pages/blockade-company/blockade-company.html',
                                  {blockade_company: response.data.blockade_company});
                            }
                        });
                    }

                }

                if (typeof closure != 'undefined') {
                    closure();
                }
            });
        }

        /**
         * get current company
         * @param id
         */
        function getCurrentCompany() {
            return current_company;
        }

        /**
         * get user avatar
         * @param avatar
         * @returns {*}
         */
        function getAvatar(avatar) {
            if (avatar == '' || typeof avatar == 'undefined') {
                return 'assets/images/avatars/profile.jpg';
            } else {
                return __env.apiUrl + 'users/avatar/' + avatar + '?token=' + $window.localStorage.token;
            }
        }

        /**
         * check access to page and redirect
         *
         * @param url
         */
        function checkAccess(url) {

            if (url.indexOf('error') > -1 || url.indexOf('page') > -1 || url.indexOf('home') > -1) {
                return;
            }

            // redirect user to login page if not logged
            if(url.indexOf('guest') === -1) {

                if (!check()) {

                    // save unauthenticated url
                    $window.localStorage.setItem('entry_url', $location.path());

                    if (url == '/') {
                        $timeout(function () {
                            redirectTo('/guest/login');
                        });
                    }
                    else if (url == '/register') {
                        $timeout(function () {
                            redirectTo('/guest/register');
                        });
                    } else {
                        $timeout(function () {
                            redirectTo('/guest/login');
                        });
                    }
                } else if (url == '/') {
                    $timeout(function () {
                        redirectToDashboard();
                    });
                } else {
                    socket.clearAll();

                    //user is in companies
                    getCompanies(function (companies) {

                        //set companies
                        if (current_company == 0) {
                            if ($window.localStorage.current_company != undefined){
                                setCurrentCompany($window.localStorage.current_company);
                            } else if (companies.length == 1) {
                                setCurrentCompany(companies[0].id);
                            }
                        }

                        $rootScope.show_projects_buttons = (url.indexOf('projects') == 1 && url.indexOf('/projects/list') != 0 && url.indexOf('/projects/form/new') != 0);
                        
                        var show_department_buttons = url.indexOf('calendar/working') == 1 && current_company && Number(current_company) === 2; // 2 - devpark
                        
                        $rootScope.show_department_buttons = show_department_buttons;

                        var department = show_department_buttons ? url.replace('/calendar/working', '').replace('/', '') : null;
                        var capitalizeDepartment = department ? department.charAt(0).toUpperCase() + department.slice(1) : null;
                        $rootScope.current_department = capitalizeDepartment;

                        if ((url.indexOf('company') != 1 ) && url.indexOf('user-edit') != 1 && current_company == 0) {
                            $timeout(function () {
                                redirectTo('/company/my-list');
                            });
                        }
                        if ((url.indexOf('company/edit') == 1 ) && current_company == 0) {
                            $timeout(function () {
                                redirectTo('/company/my-list');
                            });
                        }
                        getUser(function (user) {

                            socket.connect(user.id);

                            //for employee
                            if (url.indexOf('company/edit') == 1  && user.selected_user_company.data.role.data.name == 'employee') {
                                redirectTo('/error-403');
                            }
                        });

                        angular.forEach(companies, function (value) {
                            if (value.id == current_company) {
                                if ($rootScope.current_company_nip !== value.vatin) {
                                    $rootScope.current_company_nip = value.vatin;

                                    $rootScope.vat_payer = 1;
                                    if ($rootScope.is_fv) {
                                        api.invoiceSettings.get({}, function (response) {
                                            $rootScope.vat_payer = response.data.vat_payer;
                                        });
                                    }
                                }
                            }
                        })

                    });
                }

            } else if (url.indexOf('guest') > -1 && check()) {
                $timeout(function () {
                    redirectToDashboard();
                });
            }
        }
    }

})();
