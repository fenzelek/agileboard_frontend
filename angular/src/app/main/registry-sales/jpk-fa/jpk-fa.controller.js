(function ()
{
    'use strict';

    angular
        .module('app.registry-sales')
        .controller('JpkFaDialogController', JpkFaDialogController);

    /** @ngInject */
    function JpkFaDialogController($auth, transService, $mdDialog, $window, $httpParamSerializer)
    {
        var vm = this;

        vm.form = {
            start_date: moment().format('YYYY-MM') + '-01',
            end_date: moment().format('YYYY-MM-DD')
        };

        vm.hide = hide;
        vm.generate = generate;

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function generate() {
            var params = $httpParamSerializer(vm.form);
            $window.open(
                __env.apiUrl + 'invoices/jpk/fa?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }
    }

})();
