(function ()
{
    'use strict';

    angular
        .module('app.products-form')
        .controller('ProductsFormController', ProductsFormController);

    /** @ngInject */
    function ProductsFormController(transService, api, $stateParams, formService, apiErrorsService, $location, $state, $timeout, $mdDialog, $rootScope)
    {
        var vm = this;
        transService.loadFile('main/products/form');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.edit = false;
        vm.taxes = {};
        vm.units = {};
        vm.root_scope = $rootScope;

        vm.form = {
            id: null,
            name: '',
            pkwiu: '',
            type: 'service',
            description: '',
            print_on_invoice: false,
            price_net: null,
            price_gross: null,
            service_unit_id: null,
            vat_rate_id: ''
        };

        vm.changePrice = changePrice;
        vm.send = send;

        init();

        function init() {

            if (typeof $stateParams.success != 'undefined') {
                vm.msg_success = transService.translate('PRODUCTS_FORM.ADD_SUCCESS');
            }

            api.units.get({}, function (response) {
                vm.units = response.data;
            });

            api.taxs.get({}, function (response) {
                angular.forEach(response.data, function (item) {
                    vm.taxes[item.id] = item;
                });

                if (response.data.length === 1) {
                    vm.form.vat_rate_id = response.data[0].id;
                }
            });

            if ($stateParams.type == 'edit' && !isNaN(Number($stateParams.id)) ) {
                vm.edit = true;

                api.product.get({id:$stateParams.id}, function (response) {
                    formService.generateForm(vm.form, response.data);
                    vm.form.print_on_invoice = vm.form.print_on_invoice == 1;

                    if (!vm.form.price_net) {
                        vm.form.price_net = null;
                        vm.form.price_gross = null;
                    }
                })
            }
        }

        function changePrice() {
            if (vm.form.price_net && vm.form.vat_rate_id != '') {
                vm.form.price_gross = vm.form.price_net * (1 + (vm.taxes[vm.form.vat_rate_id].rate / 100) );
                if (isNaN(vm.form.price_gross))
                    vm.form.price_gross = 0;
                vm.form.price_gross =  Math.round(vm.form.price_gross * 100) / 100;
            } else {
                vm.form.price_gross = null;
            }
        }

        function send(is_modal) {

            if (!is_modal) {
                $location.hash('');
            }

            vm.request_sending = true;
            apiErrorsService.clear('#formProduct', vm);

            if (vm.edit) {

                api.product.put(vm.form,
                    // success
                    function() {
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('PRODUCTS_FORM.UPDATE_SUCCESS');
                        vm.request_sending = false;
                        if (is_modal) {
                            $mdDialog.hide();
                        } else {
                            formService.formUp();
                        }
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#formProduct', response, vm, []);
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        if (!is_modal) {
                            formService.formUp();
                        }
                    }
                );
            } else {

                api.product.save(vm.form,
                    // success
                    function(response) {
                        //reload
                        if (is_modal) {
                            $mdDialog.hide(response.data);
                        } else {
                            $location.url('/products/form/new?success=true');
                            $timeout(function () {
                                $state.reload();
                            }, 500);
                        }
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#formProduct', response, vm, []);
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        if (!is_modal) {
                            formService.formUp();
                        }
                    }
                );
            }
        }
        //////////
    }
})();
