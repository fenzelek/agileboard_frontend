(function ()
{
    'use strict';

    angular
        .module('app.dashboard')
        .controller('FvDashboardController', FvDashboardController);

    /** @ngInject */
    function FvDashboardController(transService, $auth, $window, $httpParamSerializer)
    {
        var vm = this;
        transService.loadFile('main/dashboard');

        vm.role = '';
        vm.csvInvoices = csvInvoices;

        $auth.getMyRole(function (role) {
            vm.role = role;
        })


        function csvInvoices() {

            var month =  moment().format('M');
            var params = $httpParamSerializer({
                year: month == 1 ? moment().format('YYYY') - 1 : moment().format('YYYY'),
                month: month == 1 ? 12 : month - 1
            });
            $window.open(
                __env.apiUrl + 'reports/invoices-registry-pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

    }
})();
