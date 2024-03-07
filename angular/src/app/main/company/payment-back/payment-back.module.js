(function ()
{
    'use strict';

    angular
        .module('app.company-payment-back', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.company-payment-back', {
                url    : '/company/payment/back',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/company/payment-back/payment-back.html',
                        controller : 'CompanyPaymentBackController as vm'
                    }
                }
            });
    }
})();