(function ()
{
    'use strict';

    angular
        .module('app.invoices-form-edit')
        .controller('InvoicesFormEditController', InvoicesFormEditController);

    /** @ngInject */
    function InvoicesFormEditController(transService, api, dialogService, formService, apiErrorsService, $location, $scope,
                                        $auth, $timeout, invoiceService, TaxesList, UnitsList, PaymentMethodsList,
                                        Invoice, InvoiceTypesList, CurrentCompany, ProductsListShortList)
    {
        var vm = this;
        transService.loadFile('main/invoices/form-edit');

        // Data
        vm.in_loading = true;
        vm.in_loading_contractor = true;
        vm.products_short_list = ProductsListShortList.data;

        vm.send = send;

        init();

        function init() {

            invoiceService.init(vm, $scope);
            vm.units = UnitsList.data;
            vm.payment_methods = PaymentMethodsList.data;
            vm.company = CurrentCompany.data;

            formService.generateForm(vm.form, Invoice.data);
            vm.form.id = Invoice.data.id;
            vm.form.default_delivery = vm.form.default_delivery == 1;
            vm.title = Invoice.data.number;
            vm.show_description = vm.form.description != '';

            //get slug type
            angular.forEach(InvoiceTypesList.data, function (item) {
                if (item.id == vm.form.invoice_type_id) {
                    vm.type = item.slug;
                }
            });

            //margin procedures
            if (vm.type == 'margin') {
                invoiceService.getMarginProcedures();
            }
            //reverse charges
            if (vm.type == 'reverse_charge') {
                invoiceService.getReverseChanges();
            }

            invoiceService.setPaymentDate(vm.form.payment_term_days);

            // bank account
            invoiceService.setBankAccount(vm.company, Invoice.data.bank_account);

            //special payments
            if (Invoice.data.special_payments.data.length) {
                vm.special_payment = true;
                vm.form.special_payment = Invoice.data.special_payments.data[0];
            }

            //taxes
            angular.forEach(TaxesList.data, function (item) {
                vm.taxes[item.id] = item;

                if (item.name == 'np.') {
                    vm.tax_type_np_id = item.id;
                }
            });

            //invoice settings
            invoiceService.getInvoiceSettingAndFormats();

            //load items and set values
            angular.forEach(vm.form.items, function (item, key) {

                vm.form.items[key].service_unit = vm.form.items[key].service_unit.data;

                delete vm.form.items[key].paid;
                delete vm.form.items[key].invoice;

                (function (key) {
                    api.product.get({id:item.company_service_id}, function (response_product) {
                        vm.form.items[key].current_service = response_product.data;
                        vm.form.items[key].search_text = response_product.data.name;
                        vm.form.items[key].watch = vm.productWatch(key);

                        vm.form.items[key].custom_name_enable = vm.form.items[key].custom_name != null && vm.form.items[key].custom_name != '';
                        if (!vm.form.items[key].custom_name_enable) {
                            vm.form.items[key].custom_name = '';
                        }
                    })
                }(key));

            });

            //has receipts or online_sales
            if (Invoice.data.receipts.data.length || Invoice.data.online_sales.data.length) {
                vm.is_extra_item = true;
            }

            //get settings and data for edit
            $auth.getSettings(function (settings) {
                vm.custom_name_products_enable = settings['invoices.services.name.allow_customization'] == "1";
                vm.addresses_delivery_enabled = settings['invoices.addresses.delivery.enabled'] == "1";

                //set contractor delivery
                if (vm.addresses_delivery_enabled && Invoice.data.delivery_address.data) {
                    api.contractor.get({id: Invoice.data.delivery_address.data.contractor_id}, function (response) {
                        vm.delivery_contractor = response.data;
                    }, vm.responseError)
                }

                vm.in_loading = false;

                //get contractor
                api.contractor.get({id:vm.form.contractor_id}, function (response) {
                    vm.contractor = response.data;
                    $timeout(function () {
                        vm.in_loading_contractor = false;
                        //create invoice without delivery address and edit with
                        if (!vm.form.delivery_address_id && vm.addresses_delivery_enabled) {
                            vm.delivery_contractor = angular.copy(vm.contractor);
                            vm.changeContractorDelivery();
                        }
                    });
                }, vm.responseError)
            });


            /**
             * select contractor
             */
            $scope.$watch(function () {return vm.contractor;},function(value){
                // if (!vm.is_extra_item && value) {
                //
                //     //payment_method_id
                //     if (vm.contractor.default_payment_method_id && !vm.in_loading && !vm.special_payment) {
                //         vm.form.payment_method_id = vm.contractor.default_payment_method_id;
                //     }
                //
                //     invoiceService.setPaymentDateFull();
                // }

                //set contractor and address delivery
                if (!vm.in_loading_contractor && vm.addresses_delivery_enabled && value) {
                    vm.delivery_contractor = angular.copy(value);
                    if (!vm.form.default_delivery) {
                        vm.changeContractorDelivery();
                    }
                }
            });

            /**
             * change issue_date
             */
            $scope.$watch(function () {return vm.form.issue_date;},function(value){
                if (!vm.is_extra_item && value && !vm.in_loading) {
                    invoiceService.setPaymentDateFull();
                }
            });

            /**
             * change payment_method_id
             */
            $scope.$watch(function () {return vm.form.payment_method_id;},function(value){
                angular.forEach(vm.payment_methods, function (item) {
                    if (item.id == value) {
                        vm.current_method = item;
                        vm.disabled_payment_date = (item.slug == 'gotowka' || item.slug == 'karta' || item.slug == 'payu');
                        if (!vm.in_loading) {
                            invoiceService.setPaymentDateFull();
                        }
                    }
                })

            });

            /**
             * change products
             */
            $scope.$watchCollection(function () {return vm.form.items;},invoiceService.calculate);
        }

        function send() {
            //confirm action
            dialogService.confirm(null, 'INVOICES_FORM_EDIT.UPDATE_QUESTION', function() {

                $location.hash('');
                vm.request_sending = true;
                apiErrorsService.clear('#invoiceProduct', vm);

                //clear unnecessary elements
                var form = angular.copy(vm.form);

                angular.forEach(form.items, function (item) {
                    delete item.current_service;
                    delete item.search_text;
                    delete item.watch;
                });

                form.contractor_id = vm.contractor.id; //set contractor id
                form.payment_term_days = moment(vm.payment_date).diff(vm.form.issue_date, 'days'); //calculate payment_term_days

                if (!vm.show_description) {
                    form.description = '';
                }

                api.invoice.put(form,
                    // success
                    function(response) {
                        //show modal with info success and actions for selected
                        dialogService.customDialog(null, 'InvoicesSuccessSaveDialogController', 'app/main/invoices/success_save/success_save.html',
                            {invoice:response.data, type:null, page: 'edit'},
                            undefined, function () {$location.path('/invoices/list');})
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#invoiceProduct', response, vm, []);
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        formService.formUp();
                    }
                );

            });
        }

        //////////
    }
})();
