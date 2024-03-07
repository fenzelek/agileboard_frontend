(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('projectsService', projectsService);

    /** @ngInject */
    function projectsService(msNavigationService, $window, $rootScope, $filter, api, socket, dialogService, $timeout, $location)
    {
        var limit = 6;
        var pinned_limit = 5;
        var current_project = {};

        var service = {
            searchUser: searchUser,
            setCurrent: setCurrent,
            setList: setList,
            setPinnedStatus: setPinnedStatus,
            pinLimitReached: pinLimitReached,
            deleteListFromMenu: deleteListFromMenu,
            updateList: updateList,
            formatEstimate: formatEstimate,
            estimationToSeconds: estimationToSeconds,
            stripFormat: stripFormat,
            hasAccess: hasAccess,
            hasAccessToTheProject: hasAccessToTheProject,
            hasPermission: hasPermission,
            getTicketTimeStatus: getTicketTimeStatus,
            getTicketTimeClass: getTicketTimeClass,
            getTicketsDateFormat: getTicketsDateFormat,
            getTicketsDatepickerFormat: getTicketsDatepickerFormat
        };

        return service;


        /**
         * search user for chips
         * @param search
         * @returns {Array}
         */
        function searchUser(search, projectId) {
            if (!projectId) {
                projectId = current_project.id ? current_project.id : $rootScope.current_project_id;
            }

            return api.projectUsers.get({
                    limit: 15,
                    page: 1,
                    id: projectId,
                    search: search
                }
            ).$promise.then(function (response) {

                var return_data = [];

                angular.forEach(response.data, function (data) {
                    if (data.user.data.avatar == '') {
                        data.user.data.avatar = 'assets/images/avatars/profile.jpg';
                    } else {
                        data.user.data.avatar = __env.apiUrl + 'users/avatar/' + data.user.data.avatar + '?token=' + $window.localStorage.token;
                    }
                    data.user.data.name = data.user.data.first_name + ' ' + data.user.data.last_name;
                    return_data.push(data.user.data);
                });

                return return_data;
            });
        }

        /**
         * set current project
         *
         * @param id
         * @param closure
         * @param refresh
         */
        function setCurrent(id, closure, refresh) {

            if ($rootScope.current_project_id == id && refresh !== true) {
                if (typeof closure != 'undefined') {
                    closure(current_project);
                }
            } else {
                socket.emit('change-project', {project_id:id});

                api.project.get({id:id}, function (response) {
                    current_project = response.data;
                    $rootScope.tickets_date_format = getTicketsDateFormat();
                    $rootScope.tickets_datepicker_format = getTicketsDatepickerFormat();

                    if (typeof closure != 'undefined') {
                        closure(response.data);
                    }
                    //set role
                    api.projectUsers.get({id:id, user_id:'current'}, function (response_user) {
                        $rootScope.current_project_user_role = response_user.data[0].role.data.name;
                        $rootScope.current_project_user_permissions = response_user.data[0].project_permission;

                        // show information when calendar working hours for today is empty
                        // only if project have any tickets
                        if (current_project.created_tickets && $rootScope.current_company_settings &&
                            $rootScope.current_company_settings.enable_calendar && $rootScope.current_company_settings.force_calendar_to_complete
                        ) {
                            showEmptyCalendarModal(response_user.data[0]);
                        }
                    });

                    addActive(current_project);
                });
            }

            // set new current_project_id
            $window.localStorage.current_project_id = id;
        }

        /**
         * Set current active project
         *
         * @param project
         */
        function addActive(project) {

            $rootScope.current_project_id = project.id;
            $rootScope.current_project_name = project.name;
            $rootScope.webbrowser_tab_id = Math.random();

            var arr_name = 'company_' + $window.localStorage.current_company;

            var projects = [];
            var recentProjects = {data: {}};
            if (typeof $window.localStorage.recentProjects != 'undefined') {
                recentProjects = angular.fromJson($window.localStorage.recentProjects);
                if (typeof recentProjects.data != 'undefined' && typeof recentProjects.data[arr_name] != 'undefined') {
                    projects = recentProjects.data[arr_name];
                }
            }

            project.pinned = false;
            // remove current project from localStorage if exists
            for (var i = projects.length -1; i >= 0; --i) {
                if (projects[i].id == project.id) {
                    // save pinned information for new object
                    project.pinned = projects[i].pinned;
                    // delete object
                    projects.splice(i, 1);
                }
            }

            // remove last from list, not pinned item
            for (var i = projects.length -1; i >= 0; --i) {
                if(projects.length == limit && !projects[i].pinned) {
                    projects.splice(i, 1);
                }
            }

            //add
            projects.unshift({id: project.id, name: project.name, pinned: project.pinned});
            recentProjects.data[arr_name] = projects;
            $window.localStorage.recentProjects = angular.toJson(recentProjects);

            setList();
        }

        /**
         * Set ticket datetime format basing on current project setting
         * @returns {string} format
         */
        function getTicketsDateFormat() {
            if (current_project && current_project.ticket_scheduled_dates_with_time) {
                return 'yyyy-MM-dd HH:mm';
            }
            return 'yyyy-MM-dd';
        }
        function getTicketsDatepickerFormat() {
            if (current_project && current_project.ticket_scheduled_dates_with_time) {
                return 'YYYY-MM-DD HH:mm';
            }
            return 'YYYY-MM-DD';
        }

        /**
         * Gets menu projects from localStorage and gives reached limit information
         *
         * @returns {boolean} reached
         */
        function pinLimitReached() {

            var arr_name = 'company_' + $window.localStorage.current_company;
            var projects = [];
            var recentProjects = {data: {}};
            if (typeof $window.localStorage.recentProjects != 'undefined') {
                recentProjects = angular.fromJson($window.localStorage.recentProjects);
                if (typeof recentProjects.data != 'undefined' && typeof recentProjects.data[arr_name] != 'undefined') {
                    projects = recentProjects.data[arr_name];
                }
            }
            var pinned_items = 0;
            angular.forEach(projects, function(project) {
                if(project.pinned) {
                    pinned_items++;
                }
            });

            return pinned_items >= pinned_limit ? true : false;
        }


        /**
         * Set item as pinned, update navigation
         */
        function setPinnedStatus(pin_item, pinned_status) {
            var arr_name = 'company_' + $window.localStorage.current_company;
            var projects = [];
            var recentProjects = {data: {}};

            // get projects if defined
            if (typeof $window.localStorage.recentProjects != 'undefined') {
                recentProjects = angular.fromJson($window.localStorage.recentProjects);
                if (typeof recentProjects.data != 'undefined' && typeof recentProjects.data[arr_name] != 'undefined') {
                    projects = recentProjects.data[arr_name];
                }
            }

            // save pinned_status of project
            angular.forEach(projects, function (project) {
                if (project.id === pin_item.projectId) {
                    project.pinned = pinned_status;
                }
            });

            // save data into localStorage
            recentProjects.data[arr_name] = projects;
            $window.localStorage.recentProjects = angular.toJson(recentProjects);

            //update navigation
            setList();
        }

        /**
         * set list projects on menu
         */
        function setList() {

            var arr_name = 'company_' + $window.localStorage.current_company;

            deleteListFromMenu();

            if (typeof $window.localStorage.recentProjects != 'undefined') {
                var recentProjects = angular.fromJson($window.localStorage.recentProjects);

                if (typeof recentProjects.data != 'undefined' && typeof recentProjects.data[arr_name] != 'undefined') {
                    var projects = recentProjects.data[arr_name];

                    angular.forEach(projects, function (value, key) {

                        var weight = value.pinned ? 1 : (key + 2);

                        msNavigationService.saveItem('projects.last_' + (key + 1), {
                            title       : value.name,
                            state       : 'app.scrumboard',
                            stateParams : {project_id: value.id},
                            projectId   : value.id,
                            pinned      : value.pinned,
                            weight      : weight
                        });
                    });
                }
            }

            msNavigationService.saveItem('projects.all', {
                title    : 'Wszystkie',
                state    : 'app.projects-list',
                translate: 'NAV.PROJECTS.ALL',
                weight   : 10
            });

            // sort by weight
            msNavigationService.sort();
        }

        /**
         * delete list projects from menu
         */
        function deleteListFromMenu() {
            msNavigationService.deleteItem('projects.all');

            for(var i = 1; i <= limit; ++i) {
                msNavigationService.deleteItem('projects.last_' + i);
            }
        }


        function updateList() {
            api.projects.get({
                has_access: 1
            }, function (response) {
                var acc_projects = response.data;
                // load localstorage menu project list
                if (typeof $window.localStorage.recentProjects != 'undefined') {
                    var recentProjects = angular.fromJson($window.localStorage.recentProjects);
                    var arr_name = 'company_' + $window.localStorage.current_company;

                    if (typeof recentProjects.data != 'undefined' && typeof recentProjects.data[arr_name] != 'undefined') {
                        var curr_projects = recentProjects.data[arr_name];
                        var new_projects = [];

                        angular.forEach(curr_projects, function (curr_project) {
                            angular.forEach(acc_projects, function(acc_project) {
                                if(curr_project.id == acc_project.id) {
                                    new_projects.push(curr_project);
                                }
                            });
                        });

                        // save data into localStorage
                        recentProjects.data[arr_name] = new_projects;
                        $window.localStorage.recentProjects = angular.toJson(recentProjects);

                        //update navigation
                        setList();
                    }
                }

            });
        }


        /**
         * format seconds to string
         *
         * @param seconds
         * @param show_zero
         * @returns {*}
         */
        function formatEstimate(seconds, show_zero) {
            if (seconds == 0) {
                if (show_zero === true) {
                    return '0s';
                }
                return '';
            }

            if (seconds < 60) {
                return seconds + 's';
            }

            var min = Math.floor(seconds / 60);
            seconds = seconds % 60;

            if (min < 60) {
                return min + 'm' + (seconds ? ' ' + seconds + 's' : '')
            }

            var hours = Math.floor(min / 60);
            min = min % 60;

            //if (hours < 24) {
            return hours + 'h' + (min ? ' ' + min + 'm' : '')
            // }
            //
            // var days = Math.floor(hours / 24);
            // hours = hours % 24;
            //
            // return  days + 'd' + (hours ? ' ' + hours + 'h' : '') + (min ? ' ' + min + 'm' : '')
        }

        function estimationToSeconds(estimation) {
            var error = false;
            var secondsValue = 0;
            //estimate
            if (estimation != '') {
                var parts = estimation.split(' ');
                angular.forEach(parts, function (part) {
                    if (!isNaN(part)) {
                        secondsValue += parseInt(part);
                    } else if (part.length < 2) {
                        error = true;
                    } else {
                        var letter = part[part.length - 1];
                        if (['h', 'm', 's'].indexOf(letter) != -1) {
                            var num = part.slice(0, part.length - 1);
                            if (!isNaN(num)) {
                                num = parseInt(num);
                                if (letter == 'h') {
                                    secondsValue += (num * 3600);
                                } else if (letter == 'm') {
                                    secondsValue += (num * 60);
                                } else if (letter == 's') {
                                    secondsValue += num;
                                } else {
                                    error = true;
                                }
                            } else {
                                error = true;
                            }
                        } else {
                            error = true;
                        }
                    }
                });
            }

            if(!error) return secondsValue;
        }

        /**
         * delete html from text
         *
         * @param $html
         * @returns {*}
         */
        function stripFormat($html) {
            return $filter('htmlToPlaintext')($html);
        }

        /**
         * check access
         *
         * @param roles
         * @returns {boolean}
         */
        function hasAccess(roles) {
            for(var i in roles) {
                if (roles[i] == $rootScope.current_project_user_role) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Check that user has permission (string or array of strings)
         * of specified type.
         *
         * @param {string} type
         * @param {string | string[]} permissions
         * @returns {boolean}
         */
        function hasPermission(type, permissions) {
            var result = false;
            if (!$rootScope.current_project_user_permissions) {
                return false;
            }
            if (typeof permissions == 'string') {
                permissions = [permissions];
            }
            // get project's type permissions list with values
            var type_permissions = $rootScope.current_project_user_permissions[type];
            // check permissions
            if (type == 'ticket_show') {
                // any of injected permissions is present and `true` on project user's role permissions list
                angular.forEach(type_permissions, function (type_per) {
                    if (!result && type_per.name && type_per.value && permissions.indexOf(type_per.name) !== -1) {
                        result = true;
                    }
                });
            } else {
                // @todo: will be developed later, with our first need
                console.log('@todo: roles / relations check, inputs: ', type, permissions);
            }

            return result;
        }


        function hasAccessToTheProject(project_id, company_id) {
            api.projectBasicInfo.get({ id: project_id},
                function(response) {
                    // company change
                    if(company_id && company_id != response.data.company_id) {
                        $window.localStorage.nextPage = $location.url();
                        $window.localStorage.newCompany = response.data.company_id;
                        $location.path('/page/switch-company');
                    }
                }, function() {
                    $location.path('/page/unauthorized');
                })
        }

        /**
         *  Shows information about today's working hour calendar gap
         *
         * @param {object} user
         */
        function showEmptyCalendarModal(user) {
            // information works only for admin / developer
            if (hasAccess(['admin', 'developer'])) {
                // get user calendar working hours for today
                var today = moment();
                if(today.isoWeekday() != 6 && today.isoWeekday() != 7) {
                    api.calendar.userAvailabilities.get({
                        user: user.user_id,
                        day: today.format('YYYY-MM-DD')
                    }, function (response) {
                        // hours empty
                        if(!response.data.length) {
                            dialogService.customDialog(null, 'CalendarEmptyDialogController', 'app/main/pages/calendar_empty/calendar_empty.html', null, null, null, null, false);
                        }
                    });
                }
            }
        }


        function getTicketTimeStatus(start_date, end_date) {
            // no-date - instantly return 0
            if (!start_date && !end_date) {
                return 0;
            }
            var start_date = new Date($filter('datetime')(start_date, 'yyyy-MM-dd'));
            var end_date = new Date($filter('datetime')(end_date, 'yyyy-MM-dd'));
            var today = new Date();
            // today or "start is past and end is future"
            if ($filter('datetime')(end_date, 'yyyy-MM-dd') === $filter('datetime')(today, 'yyyy-MM-dd') ||
                $filter('datetime')(start_date, 'yyyy-MM-dd') === $filter('datetime')(today, 'yyyy-MM-dd') ||
                (start_date.getTime() < today.getTime() && end_date.getTime() > today.getTime())) {
                return 1;
            }
            // past
            if (end_date.getTime() < today.getTime() || start_date.getTime() < today.getTime()) {
                return 2;
            }
            // future
            if (end_date.getTime() > today.getTime() || start_date.getTime() > today.getTime()) {
                return 3;
            }

            return 0;
        }

        // returns class name basing on ticket dates
        function getTicketTimeClass(start_date, end_date) {
            var status = getTicketTimeStatus(start_date, end_date);
            switch(status) {
                case 1:
                    return 'today-ticket';
                case 2:
                    return 'past-ticket';
                case 3:
                    return 'future-ticket';
                default:
                    return '';
            }
        }

    }
})();
