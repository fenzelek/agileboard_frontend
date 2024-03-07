(function ()
{
    'use strict';

    angular
        .module('app.company-payment-back')
        .controller('CompanyPaymentBackController', CompanyPaymentBackController);

    /** @ngInject */
    function CompanyPaymentBackController(transService)
    {
        var vm = this;
        transService.loadFile('main/company/payment-back');
    }
})();
