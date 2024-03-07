(function ()
{
    'use strict';

    angular
        .module('app.online-sales-list')
        .controller('OnlineSalesDialogController', OnlineSalesDialogController);

    /** @ngInject */
    function OnlineSalesDialogController($mdDialog, $window, $httpParamSerializer, $auth, __env, invoices)
    {
        var vm = this;
        vm.invoices = invoices;

        vm.hide = hide;
        vm.pdf = pdf;

        function hide() {
            $mdDialog.hide();
        }

        function pdf(id, duplicate) {
            var params = $httpParamSerializer(vm.query);
            $window.open(
                __env.apiUrl + 'invoices/' + id + '/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&duplicate=' + duplicate +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }
    }

})();
