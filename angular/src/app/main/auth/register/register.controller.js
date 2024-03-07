(function ()
{
    'use strict';

    angular
        .module('app.register')
        .controller('RegisterController', RegisterController);

    /** @ngInject */
    function RegisterController(api, transService, $scope, $timeout, $stateParams, $window, apiErrorsService, dialogService, $location)
    {
        var vm = this;
        transService.loadFile('main/auth/register');

        // Data
        vm.form = {
            first_name: '',
            last_name: '',
            email: '',
            regulations: false,
            discount_code: typeof $stateParams.key != 'undefined' ? $stateParams.key : '',
            password: '',
            password_confirmation: '',
            url: 'http://' + api.url + 'guest/activation/:token',
            language: transService.getLanguage()
        };
        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;

        // Methods
        vm.create = create;
        vm.changeLanguage = transService.changeLanguage;

        //////////

        function create()
        {
            vm.request_sending = true;
            apiErrorsService.clear('#registerForm', vm);

            api.auth.create.save(vm.form,
                //success
                function(response) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('REGISTER.SUCCESS');
                    vm.request_sending = false;

                    if (typeof $stateParams.plan != 'undefined') {
                        $window.localStorage.package = $stateParams.plan;
                    }

                    vm.form = {
                        first_name: '',
                        last_name: '',
                        email: '',
                        regulations: false,
                        password: '',
                        password_confirmation: '',
                        url: 'http://' + api.url + 'guest/activation/:token'
                    };
                    $timeout(function () {
                        $scope.registerForm.$setPristine();
                        $scope.registerForm.$setValidity();
                        $scope.registerForm.$setUntouched();
                        $scope.$apply();
                        $scope.registerForm = {};
                    });
                },
                //error
                function(response) {
                    apiErrorsService.show('#registerForm', response, vm);
                    vm.msg_success = '';
                    vm.request_sending = false;

                    if (response.data.code == 'general.validation_failed' && response.data.fields.email 
                            && (response.data.fields.email[0].indexOf('unikalne') !== -1 || response.data.fields.email[0].indexOf('unique') !== -1)) {
                        accountArleadyExistsInfo();
                    }

                }
            );
        }

        function accountArleadyExistsInfo() {
            dialogService.confirm(null, 'REGISTER.ACCOUNT_EXISTS', function() {
                $timeout(function() {
                    $location.path('/guest/login');
                }, 100);
            }, null, 'REGISTER.LOGIN', 'OTHER.CLOSE');
        }

    }
})();
