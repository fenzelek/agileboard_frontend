(function ()
{
    'use strict';

    angular
        .module('app.knowledge')
        .controller('AddEditDirectoryKnowledgeDialogController', AddEditDirectoryKnowledgeDialogController);

    /** @ngInject */
    function AddEditDirectoryKnowledgeDialogController($auth, transService, $mdDialog, api, apiErrorsService, formService, $window, projectsService, project_id, item)
    {
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.roles = [];
        vm.edit = false;
        vm.form_users = [];

        vm.form = {
            id: null,
            user_id: null,
            name: '',
            project_id: project_id,
            description: '',
            roles: [],
            users: [],
        };

        vm.hide = hide;
        vm.send = send;
        vm.searchUser = projectsService.searchUser;

        init();

        function init() {

            //edit
            if (item) {
                vm.edit = true;
                formService.generateForm(vm.form, item);
                vm.form.id = item.id;
                vm.form.roles = [];
                vm.form.users = [];
                angular.forEach(item.roles.data, function (value) {
                    vm.form.roles.push(value.id);
                });

                angular.forEach(item.users.data, function (value) {
                    value.avatar = $auth.getAvatar(value.avatar);
                    value.name = value.first_name + ' ' + value.last_name;
                    vm.form_users.push(value);
                });
            }

            $auth.getUser(function (user) {
                vm.form.user_id = user.id;
            });

            api.rolesCompany.get({}, function (response) {
                vm.roles = response.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function send() {

            vm.request_sending = true;
            apiErrorsService.clear('#addEditDir', vm);

            vm.form.users = [];
            angular.forEach(vm.form_users, function (obj) {
                vm.form.users.push(obj.id);
            });

            if (vm.edit) {
                api.directory.put(vm.form,
                    // success
                    function() {
                        $mdDialog.hide(true);
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#addEditDir', response, vm, []);
                        vm.request_sending = false;
                        vm.msg_error = transService.getErrorMassage(response);
                    }
                );
            } else {
                api.directories.save(vm.form,
                    // success
                    function() {
                        $mdDialog.hide(true);
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#addEditDir', response, vm, []);
                        vm.request_sending = false;
                        vm.msg_error = transService.getErrorMassage(response);
                    }
                );
            }

        }
    }

})();
