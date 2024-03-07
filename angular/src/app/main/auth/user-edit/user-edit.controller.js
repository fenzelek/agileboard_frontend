(function ()
{
    'use strict';

    angular
        .module('app.user-edit')
        .controller('UserEditController', UserEditController);

    /** @ngInject */
    function UserEditController(transService, api, $auth, $timeout)
    {
        var vm = this;
        transService.loadFile('main/auth/user-edit');

        vm.form = {
            id: 0,
            password: '',
            first_name: '',
            last_name: '',
            avatar: '',
            remove_avatar: 0,
            password_confirmation: '',
            old_password: '',
        };

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.progress = '';
        vm.avatar = '';
        vm.enable_delete_avatar = false;

        vm.send = send;
        vm.passwordRequired = passwordRequired;
        vm.addFile = addFile;

        init();

        function init() {
            $auth.refreshUser(function (user) {
                vm.form.id = user.id;
                vm.form.first_name = user.first_name;
                vm.form.last_name = user.last_name;
                vm.enable_delete_avatar = user.avatar != '';
                vm.avatar = $auth.getAvatar(user.avatar);
            });
        }

        function passwordRequired() {
            return (vm.form.password != '' && typeof vm.form.password != 'undefined')
                || (vm.form.password_confirmation != '' && typeof vm.form.password_confirmation != 'undefined')
                || (vm.form.old_password != '' && typeof vm.form.old_password != 'undefined')
        }

        function addFile() {
            $timeout(function() {
                angular.element('#file-to-upload').trigger('click');
            }, 100);
        }

        function send() {
            vm.request_sending = true;

            api.userUpdate.put(vm.form,
                // success
                function() {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('USER_EDIT.SUCCESS');
                    vm.request_sending = false;

                    vm.form.password = '';
                    vm.form.password_confirmation = '';
                    vm.form.old_password = '';
                    init();
                },
                // error
                function(response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                    vm.request_sending = false;
                },
                // progress
                function(progress) {
                    vm.progress = progress;
                }
            );
        }
        //////////
    }
})();
