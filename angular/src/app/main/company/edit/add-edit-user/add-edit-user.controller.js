(function ()
{
    'use strict';

    angular
        .module('app.company-edit')
        .controller('AddEditUserDialogController', AddEditUserDialogController);

    /** @ngInject */
    function AddEditUserDialogController($auth, transService, $mdDialog, $window, api, formService, apiErrorsService, user, role_id)
    {
        var vm = this;

        vm.create_user = false; //true create user; false only invite
        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.roles = [];

        vm.edit = false;
        vm.form = {
            company_id: $auth.getCurrentCompany(),
            email: '',
            first_name: '',
            last_name: '',
            role_id: role_id,
            password: '',
            password_confirmation: '',
            url: 'http://' + api.url + 'guest/invitation/:token/:company',
            language: transService.getLanguage()
        };

        vm.hide = hide;
        vm.create = create;
        vm.update = update;

        init();

        function init() {

            $auth.getSettings(function (settings) {
                vm.create_user = settings['general.invite.enabled'] == "0";
            });

            api.rolesCompany.get({}, function (response) {
                vm.roles = response.data;
            });
            if (user) {
                vm.edit = true;
                formService.generateForm(vm.form, user);
                vm.form.role_id = user.company_role_id;
                vm.form.id = user.id;
            }
        }

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function create() {

            vm.request_sending = true;
            apiErrorsService.clear('#addEditUser', vm);

            api.company.invite.save(vm.form,
                // success
                function() {
                    $mdDialog.hide(true);
                    // vm.msg_error = '';
                    // vm.msg_success = transService.translate('COMPANY_EDIT.USER.ADD_SUCCESS');
                    // vm.request_sending = false;
                },
                // error
                function(response) {
                    apiErrorsService.show('#addEditUser', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }

        /**
         * update user
         */
        function update() {

            vm.request_sending = true;
            apiErrorsService.clear('#addEditUser', vm);

            api.userUpdate.put(vm.form,
                // success
                function() {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('COMPANY_EDIT.USER.UPDATE_SUCCESS');
                    vm.request_sending = false;
                },
                // error
                function(response) {
                    apiErrorsService.show('#addEditUser', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }
    }

})();
