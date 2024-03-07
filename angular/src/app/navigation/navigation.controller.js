(function ()
{
    'use strict';

    angular
        .module('app.navigation')
        .controller('NavigationController', NavigationController);

    /** @ngInject */
    function NavigationController($scope, $timeout, __env, $auth, $window)
    {
        var vm = this;

        // Data
        vm.bodyEl = angular.element('body');
        vm.folded = false;
        vm.logo = __env.logo;
        vm.msScrollOptions = {
            suppressScrollX: true
        };
        vm.companies = [];
        vm.user = [];

        // Methods
        vm.redirectToDashboard = $auth.redirectToDashboard;
        vm.toggleMsNavigationFolded = toggleMsNavigationFolded;
        vm.selectCompany = selectCompany;
        vm.companyActive = companyActive;
        vm.getLogotype = getLogotype;

        //////////
        init();


        function init() {
            $auth.getCompanies(function (companies) {
                vm.companies = companies;
                angular.forEach(companies, function (company) {
                    getLogotype(company);
                });
            });

            $auth.getUser(function (user) {
                vm.user = user;
            });
        }

        function getLogotype(company) {
            // set placeholder image first
            company.logo = '/assets/images/logos/company-inv.png';
            // fetch company logo and override placeholder if logo exists
            var logo_url = __env.apiUrl + 'companies/get-logotype/' + company.id + '?selected_company_id=' + company.id + '&token=' + $window.localStorage.token;
            var image = new Image();
            image.src = logo_url;
            image.onload = function () {
                company.logo = logo_url;
            }
        }

        function selectCompany(id) {
            if($window.localStorage.current_company != id) {
                $auth.setCurrentCompany(id, function () {
                    $auth.refreshUser(function () {
                        $auth.redirectToDashboard();
                    });
                });
            } else {
                $auth.redirectToDashboard();
            }
        }

        /**
         * Company active for .active button class
         */
        function companyActive(company_id) {
            return company_id == $window.localStorage.current_company ? true : false;
        }

        /**
         * Toggle folded status
         */
        function toggleMsNavigationFolded()
        {
            vm.folded = !vm.folded;
        }

        // Close the mobile menu on $stateChangeSuccess
        $scope.$on('$stateChangeSuccess', function () {
            vm.bodyEl.removeClass('ms-navigation-horizontal-mobile-menu-active')
        });
    }

})();
