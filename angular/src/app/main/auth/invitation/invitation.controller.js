(function ()
{
    'use strict';

    angular
        .module('app.invitation')
        .controller('InvitationController', InvitationController);

    /** @ngInject */
    function InvitationController($stateParams, $window, api, transService, $location, $timeout)
    {
        var vm = this;
        transService.loadFile('main/auth/invitation');

        // Data
        vm.form = {
            password: '',
            password_confirmation: '',
            regulations: false,
            token: $stateParams.token
        };
        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.company_name = decodeURIComponent($stateParams.company).replace(/\+/g, ' ');
        vm.form_enabled = false;

        // Methods
        vm.send = send;
        vm.changeLanguage = transService.changeLanguage;

        init();

        function init() {
            api.company.acceptInvitation.put(vm.form, function () {

                $location.path('/guest/login');

            }, function (response) {
                vm.form_enabled = true;
            });
        }


        //////////
        function send()
        {
            vm.request_sending = true;

            api.company.acceptInvitation.put(vm.form, function () {

                $location.path('/guest/login');

            },function (response) {
                vm.msg_error = transService.getErrorMassage(response);
                vm.request_sending = false;
                $timeout(function () {
                    try {
                        var list = [
                            'company_invitation.not_pending',
                            'company_invitation.already_assigned_to_company',
                            'company_invitation.expired',
                            'company_invitation.invalid_email_given'
                        ];

                        if (list.indexOf(response.data.code) > -1) {
                            $location.path('/guest/login');
                        }
                    } catch (e) {}
                }, 5000);
            })
        }
    }
})();