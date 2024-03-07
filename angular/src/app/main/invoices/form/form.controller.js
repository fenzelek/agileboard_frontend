(function ()
{
    'use strict';

    angular
        .module('app.invoices-form')
        .controller('InvoicesFormController', InvoicesFormController);

    /** @ngInject */
    function InvoicesFormController(transService, api, $stateParams, dialogService, formService, apiErrorsService,
                                    $location, $scope, $auth, $timeout, invoiceService, CurrentCompany, TaxesList,
                                    UnitsList, PaymentMethodsList, InvoiceTypesList, ProductsListShortList)
    {
        var vm = this;
        transService.loadFile('main/invoices/form');

        // Data
        vm.for_contractor = false;
        vm.alert_profile_is_showing = false;
        vm.copy_invoice = false;
        vm.products_short_list = ProductsListShortList.data;

        vm.send = send;

        init();

        function init() {

            invoiceService.init(vm, $scope);

            vm.units = UnitsList.data;
            vm.payment_methods = PaymentMethodsList.data;
            vm.company = CurrentCompany.data;

            //invoice_type_id
            vm.type = typeof $stateParams.type != 'undefined' ? $stateParams.type : 'vat';

            //settings
            $auth.getSettings(function (settings) {
                vm.custom_name_products_enable = settings['invoices.services.name.allow_customization'] == "1";
                vm.addresses_delivery_enabled = settings['invoices.addresses.delivery.enabled'] == "1";
            });

            //margin procedures
            if (vm.type == 'margin') {
                invoiceService.getMarginProcedures();
            }
            //reverse charges
            if (vm.type == 'reverse_charge') {
                invoiceService.getReverseChanges();
            }

            //taxes
            angular.forEach(TaxesList.data, function (item) {
                vm.taxes[item.id] = item;

                if (item.name == 'np.') {
                    vm.tax_type_np_id = item.id;
                }
            });

            if (typeof $stateParams.invoice_id == 'undefined') {
                vm.addProduct();
            }

            // set values from selected invoice type
            angular.forEach(InvoiceTypesList.data, function (item) {
                if (item.slug == vm.type) {
                    vm.form.invoice_type_id = item.id;
                    vm.title = item.description;
                }
            })

            //registry
            invoiceService.getInvoiceSettingAndFormats(function () {
                if (!vm.registries.length) {
                    profileAlert();
                }

                //set default registry
                angular.forEach(vm.registries, function (value) {
                    if (value.default) {
                        vm.form.invoice_registry_id = value.id;
                    }
                });
                if (!vm.form.invoice_registry_id && vm.registries.length) {
                    vm.form.invoice_registry_id = vm.registries[0].id;
                }
            });

            //payment_method_id
            if (!vm.company.default_payment_method_id || vm.company.vatin == '') {
                profileAlert()
            }
            vm.form.payment_method_id = vm.company.default_payment_method_id;

            //bank account
            invoiceService.setBankAccount(vm.company);

            //gross_counted
            vm.form.gross_counted = (vm.type == 'margin' || vm.type == 'reverse_charge') ? 1 : vm.company.default_invoice_gross_counted;

            //get contractor
            if (typeof $stateParams.contractor_id != 'undefined') {

                vm.for_contractor = true;

                api.contractor.get({id:$stateParams.contractor_id}, function (response) {
                    vm.contractor = response.data;
                }, vm.responseError)
            }

            //load from invoice
            if (typeof $stateParams.invoice_id != 'undefined') {
                loadFromInvoice($stateParams.invoice_id);
            }

            //load from receipts
            if (typeof $stateParams.ids != 'undefined') {
                vm.is_extra_item = true;
                vm.form.gross_counted = 1;
                vm.form.extra_item_id = Array.isArray($stateParams.ids) ? $stateParams.ids : [$stateParams.ids];
                vm.form.extra_item_type = 'receipts';
                vm.form.items = [];

                angular.forEach(vm.payment_methods, function (method) {
                    if (method.slug == 'inne') {
                        vm.form.payment_method_id = method.id;
                    }
                });

                //load receipts and set values
                angular.forEach(vm.form.extra_item_id, function (id) {
                    api.receipt.get({id: id}, function (response) {

                        vm.form.sale_date = response.data.sale_date.split(' ')[0];
                        vm.payment_date = vm.form.sale_date;

                        angular.forEach(response.data.items.data, function (item, key) {

                            (function (item, id) {
                                //load product
                                api.product.get({id:item.company_service_id}, function (response_product) {

                                    vm.form.items.push(invoiceService.getNewObjItem());

                                    var index = vm.form.items.length - 1;
                                    formService.generateForm(vm.form.items[index], item);

                                    vm.form.items[index].current_service = response_product.data;
                                    vm.form.items[index].base_document_id = id;

                                    invoiceService.calculate();
                                })
                            }(item, id));

                        });

                    }, vm.responseError);
                });
            }

            //from receipt
            if (typeof $stateParams.receipt_id != 'undefined') {
                loadExtraItem('receipts', api.receipt, $stateParams.receipt_id);
            }

            //from online_sales
            if (typeof $stateParams.online_sales_id != 'undefined') {
                loadExtraItem('online_sales', api.onlineSale, $stateParams.online_sales_id);
            }

            /**
             * change contractor
             */
            $scope.$watch(function () {return vm.contractor;},function(value){
                if (!vm.is_extra_item && value) {

                    //payment_method_id
                    if (vm.contractor.default_payment_method_id && !vm.special_payment) {
                        vm.form.payment_method_id = vm.contractor.default_payment_method_id;
                    }

                    invoiceService.setPaymentDateFull();
                }

                //set contractor and address delivery
                if (vm.addresses_delivery_enabled && value) {
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
                if (!vm.is_extra_item && value) {
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
                        invoiceService.setPaymentDateFull();
                    }
                })

            });

            /**
             * change gross_counted
             */
            $scope.$watch(function () {return vm.form.gross_counted;},function(){
                if (!vm.is_extra_item) {
                    invoiceService.calculate();
                }
            });

            /**
             * change products
             */
            $scope.$watchCollection(function () {return vm.form.items;},invoiceService.calculate);
        }

        /**
         * Load other invoice to form
         * @param id
         */
        function loadFromInvoice(id) {

            //load invoice
            api.invoice.get({id:id}, function (response) {

                vm.copy_invoice = true;

                //load contractor
                api.contractor.get({id:response.data.contractor_id}, function (response_contractor) {

                    formService.generateForm(vm.form, response.data);

                    vm.contractor = response_contractor.data;
                    vm.form.sale_date = vm.today;
                    vm.form.issue_date = vm.today;
                    vm.form.default_delivery = vm.form.default_delivery == 1;

                    //set payment date in next tick
                    //todo check it is require
                    (function (payment_term_days) {
                        $timeout(function () {
                            invoiceService.setPaymentDate(payment_term_days);
                        });
                    })(vm.form.payment_term_days);


                    //get slug and title type
                    angular.forEach(InvoiceTypesList.data, function (item) {
                        if (item.id == vm.form.invoice_type_id) {
                            vm.type = item.slug;
                            vm.title = item.description;
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

                    //special payments
                    if (response.data.special_payments.data.length) {
                        vm.special_payment = true;
                        vm.form.special_payment = response.data.special_payments.data[0];
                    }

                    //load items
                    angular.forEach(vm.form.items, function (item, key) {

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

                }, vm.responseError)

            }, vm.responseError)
        }

        /**
         * Load items from receipt or online sales for generate invoice
         *
         * @param name
         * @param endpoint
         * @param id
         */
        function loadExtraItem(name, endpoint, id) {
            vm.is_extra_item = true;
            vm.form.gross_counted = 1;
            vm.form.extra_item_id = [id];
            vm.form.extra_item_type = name;

            //load receipt or online sales and set values
            endpoint.get({id: id}, function (response) {

                formService.generateForm(vm.form, response.data);

                vm.form.sale_date = vm.form.sale_date.split(' ')[0];
                vm.payment_date = vm.form.sale_date;

                angular.forEach(vm.form.items, function (item, key) {

                    (function (key) {
                        //load product
                        api.product.get({id:item.company_service_id}, function (response_product) {
                            vm.form.items[key].current_service = response_product.data;
                            vm.form.items[key].custom_name = '';
                            vm.form.items[key].custom_name_enable = false;
                        })
                    }(key));

                });

            }, vm.responseError);
        }

        /**
         * Alert company setting is empty
         * @param e
         */
        function profileAlert(e) {
            if (!vm.alert_profile_is_showing) {
                vm.alert_profile_is_showing = true;
                dialogService.customDialog(e, 'ProfileAlertDialogController', 'app/main/invoices/form/profile-alert/profile-alert.html');
            }
        }

        /**
         * Create new invoice
         */
        function send() {

            //confirm action
            dialogService.confirm(null, 'INVOICES_FORM.ADD_QUESTION', function() {

                $location.hash('');
                vm.request_sending = true;
                apiErrorsService.clear('#invoiceProduct', vm);

                //clear unnecessary elements
                var form =  angular.copy(vm.form);

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

                api.invoices.save(form,
                    // success
                    function(response) {
                        //show modal with info success and actions for selected
                        dialogService.customDialog(null, 'InvoicesSuccessSaveDialogController', 'app/main/invoices/success_save/success_save.html',
                            {invoice:response.data, type:vm.type, page: 'new'},
                            undefined, function () {$location.path('/invoices/list');});
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
