(function ()
{
    'use strict';

    angular
        .module('app.company-buy-wizard')
        .controller('CompanyBuyWizardController', CompanyBuyWizardController);

    /** @ngInject */
    function CompanyBuyWizardController(transService, api, CardList, Payment, PackagesCurrent, apiErrorsService, $window, $location)
    {
        var vm = this;
        transService.loadFile('main/company/buy-wizard');

        // Data
        vm.card_list = CardList.data;
        vm.payment = Payment.data;
        vm.package_current = PackagesCurrent.data;
        vm.first_module = vm.payment.transaction.data.company_modules_history.data[0];
        vm.request_sending = false;
        vm.enable_card_pay = false; //disable subscriptions

        vm.form = {
            id: vm.payment.id,
            subscription: false,
            type: false,
            token: null,
            card_exp_month: '',
            card_exp_year: '',
            card_cvv: '',
            card_number: ''
        };


        // Methods
        vm.sendForm = sendForm;

        function sendForm() {
            vm.request_sending = true;

            api.payment.save(vm.form,
                // success
                function(response) {
                    if (response.data.redirect_url) {
                        $window.location.href = response.data.redirect_url;
                    } else {
                        $location.path('/company/payment/back');
                    }
                },
                // error
                function(response) {
                    if (response.date.code == 'payu.warning_continue_3ds') {
                        $window.location.href = response.data.redirect_url;
                    } else {
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                    }
                }
            );
        }
    }
})();
