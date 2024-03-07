(function ()
{
    'use strict';

    angular
        .module('app.page.switch-company')
        .controller('SwitchCompanyController', SwitchCompanyController);

    /** @ngInject */
    function SwitchCompanyController(transService, $auth, $window, $location, $timeout)
    {
        var vm = this;
        transService.loadFile('main/pages/switch-company');

        vm.newCompany = 0;
        vm.nextPage = '';

        vm.changeCompany = changeCompany;

        init();

        
        function init() {
            if(angular.isDefined($window.localStorage.newCompany)) {
                vm.newCompany = $window.localStorage.newCompany;
                $window.localStorage.removeItem('newCompany');
            } else {
                $auth.redirectToDashboard();
            }
            if(angular.isDefined($window.localStorage.nextPage)) {
                vm.nextPage = $window.localStorage.nextPage;
                $window.localStorage.removeItem('nextPage');
            } else {
                $auth.redirectToDashboard();
            }
        }



        function changeCompany() {
            // redirect witch company change
            if(vm.newCompany) {
                // switch into new company
                $auth.setCurrentCompany(vm.newCompany, function() {
                    $auth.refreshUser(function() {
                        if(vm.nextPage !== '') {
                            // redirect to new url
                            $timeout(function() {
                                $location.url(vm.nextPage);
                            }, 100);
                        } else {
                            $auth.redirectToDashboard();
                        }
                    });
                });

                
            }
        }

        
    }
})();
