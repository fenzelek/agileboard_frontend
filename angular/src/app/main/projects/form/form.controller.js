(function ()
{
    'use strict';

    angular
        .module('app.projects-form')
        .controller('ProjectsFormController', ProjectsFormController);

    /** @ngInject */
    function ProjectsFormController($scope, transService, api, $stateParams, formService, apiErrorsService, $location, $auth, projectsService, dialogService, Roles, Project, ProjectUsers)
    {
        var vm = this;
        transService.loadFile('main/projects/form');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.shortNameError = false;
        vm.edit = false;
        vm.roles = Roles.data;
        vm.form_users = [];
        vm.selected_users = [];
        vm.statuses = [];
        vm.projects = [];
        vm.creator_id = 0;
        vm.current_users = ProjectUsers.data; //for edit
        vm.disable_short_name = false;
        vm.colors = ['md-red-800-bg', 'md-pink-800-bg', 'md-purple-800-bg', 'md-deep-purple-800-bg', 'md-indigo-800-bg', 'md-blue-800-bg', 'md-light-blue-800-bg', 'md-cyan-800-bg', 'md-teal-500-bg', 'md-green-800-bg', 'md-light-green-800-bg', 'md-lime-800-bg', 'md-yellow-800-bg', 'md-amber-800-bg', 'md-orange-800-bg', 'md-deep-orange-800-bg', 'md-brown-800-bg', 'md-grey-900-bg', 'md-blue-grey-800-bg'];
        vm.colors2 = ['md-red-300-bg', 'md-pink-300-bg', 'md-purple-300-bg', 'md-deep-purple-300-bg', 'md-indigo-300-bg', 'md-blue-300-bg', 'md-light-blue-300-bg', 'md-cyan-300-bg', 'md-teal-200-bg', 'md-green-300-bg', 'md-light-green-300-bg', 'md-lime-300-bg', 'md-yellow-300-bg', 'md-amber-300-bg', 'md-orange-300-bg', 'md-deep-orange-300-bg', 'md-brown-300-bg', 'md-grey-600-bg', 'md-blue-grey-500-bg'];
        vm.groupedPrivileges = [];

        vm.form = {
            id: null,
            name: '',
            short_name: '',
            status_for_calendar_id: null,
            time_tracking_visible_for_clients: false,
            ticket_scheduled_dates_with_time: false,
            email_notification_enabled: false,
            slack_notification_enabled: false,
            slack_webhook_url: '',
            slack_channel: '',
            color: 'md-teal-500-bg',
            language: 'en'
        };


        vm.send = send;
        vm.generateShort = generateShort;
        vm.selectColor = selectColor;
        vm.searchUser = searchUser;
        vm.cloneProject = cloneProject;
        vm.updatePrivileges = updatePrivileges;

        init();

        function init() {

            angular.forEach(vm.roles, function (value) {
                vm.form_users[value.id] = [];
            });

            if ($stateParams.type == 'new') {
                $auth.getUser(function (user) {
                    vm.form_users[user.selected_user_company.data.role_id].push({
                        id: user.id,
                        email: user.email,
                        name: user.first_name + ' ' + user.last_name,
                        avatar: $auth.getAvatar(user.avatar),
                    });

                    vm.creator_id = user.id;
                });
            }

            //get edit data
            if ($stateParams.type == 'edit' && !isNaN(Number($stateParams.id)) ) {
                vm.edit = true;

                formService.generateForm(vm.form, Project.data);
                vm.old_short_name = Project.data.short_name;
                vm.disable_short_name = !Project.data.editable_short_name;
                vm.form.time_tracking_visible_for_clients = Project.data.time_tracking_visible_for_clients == 1;
                vm.form.ticket_scheduled_dates_with_time = Project.data.ticket_scheduled_dates_with_time == 1;
                vm.form.email_notification_enabled = Project.data.email_notification_enabled == 1;
                vm.form.slack_notification_enabled = Project.data.slack_notification_enabled == 1;
                vm.form.status_for_calendar_id = Project.data.status_for_calendar_id ? Project.data.status_for_calendar_id : null;

                api.agileStatuses.get({ project_id: Project.data.id, tickets: 0 }, function (response) {
                    vm.statuses = response.data.splice(1);
                });

                angular.forEach(vm.current_users, function (user) {
                    vm.form_users[user.role_id].push({
                        id: user.user.data.id,
                        email: user.user.data.email,
                        name: user.user.data.first_name + ' ' + user.user.data.last_name,
                        avatar: $auth.getAvatar(user.user.data.avatar),
                    });
                });

                api.projectPrivileges.get({ id: Project.data.id }, function (response) {
                    setPrivileges(response.data);
                });
            }

            // Check that shortname is unique
            $scope.$watch(function() { return vm.form.short_name }, function(val) {
                checkShortName(val);
            });

            if (!vm.edit) {
                vm.form.first_number_of_tickets = 1;

                // get projects for "cloning" action
                api.projects.get({ limit: 200 }, function (response) {
                    vm.projects = response.data;
                });
            }

        }

        /**
         * Generates project shortname from name
         *
         */
        function generateShort() {
            if(vm.form.name) {
                var arr = vm.form.name.split(' ');
                vm.form.short_name = '';

                if (arr.length == 1) {
                    vm.form.short_name = arr[0].substring(0,3);
                }

                if (arr.length == 2) {
                    vm.form.short_name = (arr[0].substring(0,2) + arr[1].substring(0,2));
                }

                if (arr.length > 2) {
                    angular.forEach(arr, function (value, key) {
                        vm.form.short_name += arr[key].substring(0,1);
                    });
                }

                vm.form.short_name = vm.form.short_name.toUpperCase();
            } else {
                vm.form.short_name = '';
            }
        }

        /**
         * select color
         * @param color
         */
        function selectColor(color) {
            vm.form.color = color;
        }

        /**
         * searsh user for chips
         * @param query
         * @returns {Array}
         */
        function searchUser(query) {

            return api.company.users.get({
                    limit: 15,
                    page: 1,
                    search: query,
                    company_status: 1
                }
            ).$promise.then(function (response) {

                var return_data = [];

                angular.forEach(response.data, function (data) {
                    data.avatar = $auth.getAvatar(data.avatar);
                    data.name = data.first_name + ' ' + data.last_name;
                    return_data.push(data);
                });

                //delete duplicate
                angular.forEach(vm.form_users, function (list) {
                    angular.forEach(list, function (user) {
                        for(var i = return_data.length - 1; i >= 0; --i) {
                            if (return_data[i].id == user.id) {
                                return_data.splice(i, 1);
                                break;
                            }
                        }
                    })
                });

                return return_data;
            });
        }

        function cloneProject(project) {
            dialogService.customDialog(
                null,
                'cloneProjectDialogController',
                'app/main/projects/clone-dialog/clone-dialog.html',
                {
                    project_id: project.id,
                    project_name: project.name
                }
            );
        }

        //show save error
        function showError(response) {
            apiErrorsService.show('#formProject', response, vm, []);
            vm.msg_error = transService.getErrorMassage(response);
            vm.msg_success = '';
            vm.request_sending = false;
            formService.formUp();
        }

        /**
         * Check project shortname that arleady exists
         *
         */
        function checkShortName(short_name) {
            vm.shortNameError = false;

            if(short_name && vm.old_short_name != short_name) {
                api.projectExist.get({short_name: short_name}, function() {
                    // exists - show error
                    vm.shortNameError = true;
                }, function() {
                    // not found - clear errors
                    vm.shortNameError = false;
                });
            }
        }

        /**
         * Griup privileges through sections: "ticket_show", "ticket", "ticket_comment"
         * @param {Privileges[]} privileges
         * @return {GroupedPrivileges} GroupedPrivileges {}[]
         */
        function groupPrivileges(privileges) {
            var ticket_show = [];
            var ticket = []
            var ticket_comment = [];
            Object.keys(privileges).forEach(function (param) {
                if (param.indexOf('ticket_show') !== -1) {
                    ticket_show.push({ name: param, translation: param.split('_')[0], options: privileges[param] });
                }
                if (param == 'ticket_create' || param == 'ticket_update' || param == 'ticket_destroy') {
                    ticket.push({ name: param, translation: param.split('_')[1], options: privileges[param] });
                }
                if (param == 'ticket_comment_create' || param == 'ticket_comment_update' || param == 'ticket_comment_destroy') {
                    ticket_comment.push({ name: param, translation: param.split('_')[2], options: privileges[param] });
                }
            });

            return [
                { name: 'ticket_show', groups: ticket_show },
                { name: 'ticket', groups: ticket },
                { name: 'ticket_comment', groups: ticket_comment }
            ];
        }

        /**
         * Send request to API with privilege change
         * @param {string} param
         * @param {PrivilegeOptions} options
         */
        function updatePrivileges(param, options) {
            vm.request_sending = true;
            // update source model (not grouped)
            vm.privileges[param] = options;
            // send update request
            api.projectPrivileges.put(Object.assign({ id: Project.data.id }, vm.privileges), function (response) {
                setPrivileges(response.data);
                vm.request_sending = false;
            }, showError);
        }

        /**
         * Helper that set privileges and grouped privileges
         * @param {Privileges[]} privileges
         */
        function setPrivileges(privileges) {
            vm.privileges = privileges;
            vm.groupedPrivileges = groupPrivileges(privileges);
        }


        function send() {
            vm.form.users = [];
            angular.forEach(vm.form_users, function (list, role_id) {
                angular.forEach(list, function (user) {
                    vm.form.users.push({
                        id: '',
                        user_id: user.id,
                        role_id: role_id
                    });
                })
            });

            $location.hash('');
            vm.request_sending = true;
            apiErrorsService.clear('#formProject', vm);

            if (vm.edit) {
                api.project.put(vm.form, function(response) {

                    vm.msg_error = '';
                    vm.msg_success = transService.translate('PROJECTS_FORM.UPDATE_SUCCESS');
                    vm.request_sending = false;
                    formService.formUp();

                    projectsService.setCurrent(response.data.id, undefined, true);

                }, showError);
            } else {

                //create project
                api.projects.save(vm.form,
                    // success
                    function(response) {
                        // redirect to board configuration
                        $location.path('/projects/' + response.data.id + '/statuses');
                    }, showError);
            }

        }
        //////////
    }
})();
